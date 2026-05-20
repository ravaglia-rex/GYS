import axios from "axios";
import {
  BILLING_INVOICE_DOWNLOAD_URL,
  FETCH_SCHOOL_ADMIN_DATA,
  FETCH_SCHOOL_DASHBOARD,
  QUARTERLY_REPORT_DOWNLOAD_URL,
  QUARTERLY_REPORTS,
  SCHOOL_ADMINS_APIS,
  SCHOOLS_APIS,
  STUDENT_REGISTRATION_EMAILS,
  UPDATE_SCHOOL_PROFILE,
} from "../constants/constants";
import authTokenHandler from "../functions/auth_token/auth_token_handler";

const GYS_SUPPORT_EMAIL = "globalyoungscholar@argus.ai";

/** Shown in UI for any PDF download failure; details go to console only. */
const PDF_DOWNLOAD_USER_MESSAGE = `Something went wrong with your download. Please try again later. If it keeps happening, contact us at ${GYS_SUPPORT_EMAIL}.`;

function parseS3ErrorCode(body: string): string | null {
  const m = body.match(/<Code>([^<]+)<\/Code>/);
  return m?.[1] ?? null;
}

function logUrlPathOnly(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname}`;
  } catch {
    return "[invalid-url]";
  }
}

export interface SchoolAdmin {
  adminId?: string;
  email: string;
  email_normalized?: string;
  schoolId: string;
  role: string;
}

export interface SchoolEmailCheck {
  schoolId: string;
  schoolName: string;
  verified: boolean;
  email: string;
  /** True when Razorpay (or dev) marks registration fee as collected - required for dashboard access. */
  registrationPaymentComplete: boolean;
}

export interface AssessmentProgress {
  proficiency_tier: number;
  status: "locked" | "available" | "tier_advanced";
  best_score: number | null;
  attempts_count: number;
  tiers_cleared?: Record<string, boolean>;
  latest_attempt_level?: number | null;
  latest_attempt_score?: number | null;
}

export interface StudentRow {
  uid: string;
  /** Normalized signup email when present on the student doc. */
  email?: string;
  first_name: string;
  last_name: string;
  grade: number;
  membership_level: number;
  approval_status: string;
  /** Coalesced on the API; missing legacy docs read as `explorer`. */
  achievement_tier: string;
  assessment_progress: Record<string, AssessmentProgress>;
  created_at: any;
}

export interface SchoolDashboardBilling {
  invoice_number: string | null;
  has_invoice_pdf: boolean;
}

export interface SchoolDashboardResponse {
  schoolId: string;
  live: {
    total_students: number;
    pending_approval: number;
    membership_breakdown: {
      level_1: number;
      level_2: number;
      level_3: number;
    };
  };
  students: StudentRow[];
  analytics: Record<string, any>;
  billing?: SchoolDashboardBilling;
  /** Mirrors backend S3 signing readiness for institutional invoice PDF downloads. */
  s3_invoice_download_configured?: boolean;
}

export interface QuarterlyReportListItem {
  quarterKey: string;
  reportId: string | null;
  title: string;
  assessmentPeriodLabel: string | null;
  studentsAssessed: number | null;
  subscriptionTier: string | null;
  institutionalTier: string | null;
  /** Full S3 object key in `AWS_S3_REPORTS_BUCKET` (convention: `school-reports/{schoolId}/{year}_q{n}.pdf`). */
  pdfS3Key: string | null;
  pdfFilename: string | null;
  hasPdf: boolean;
  generatedAt: string | null;
  isLatest: boolean;
  /** Public HTTPS URL for sample PDFs on `/for-schools/preview` (no signed URL / auth). */
  previewPublicPdfUrl?: string | null;
}

export interface QuarterlyReportsResponse {
  schoolId: string;
  reports: QuarterlyReportListItem[];
  s3Configured: boolean;
}

export const getSchoolAdmin = async (email: string): Promise<SchoolAdmin | null> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const encodedEmail = encodeURIComponent(email);
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${FETCH_SCHOOL_ADMIN_DATA}/${encodedEmail}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw new Error(`Error fetching school admin for email ${email}. Please contact globalyoungscholar@argus.ai`);
  }
};

export const getStudentRegistrationEmails = async (): Promise<string[]> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${STUDENT_REGISTRATION_EMAILS}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return Array.isArray(response.data?.emails) ? response.data.emails : [];
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(String(error.response.data.error));
    }
    throw new Error("Could not load student registration emails.");
  }
};

export type UpdateSchoolProfilePayload = {
  phone?: string;
  website?: string;
  boards?: string[];
  board?: string;
  abbreviations?: string[];
  referral_source?: string;
  additional_contact_emails?: string[];
};

export const putSchoolProfile = async (
  payload: UpdateSchoolProfilePayload
): Promise<{ success: boolean; school_name: string; poc_email: string }> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const response = await axios.put(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${UPDATE_SCHOOL_PROFILE}`,
      payload,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(String(error.response.data.error));
    }
    throw new Error("Could not save school settings. Please try again.");
  }
};

export const putStudentRegistrationEmails = async (
  emails: string[]
): Promise<{ success: boolean; count: number }> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const response = await axios.put(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${STUDENT_REGISTRATION_EMAILS}`,
      { emails },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data ?? { success: true, count: emails.length };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(String(error.response.data.error));
    }
    throw new Error("Could not save student registration emails.");
  }
};

export const getQuarterlyReports = async (): Promise<QuarterlyReportsResponse> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${QUARTERLY_REPORTS}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data as QuarterlyReportsResponse;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(String(error.response.data.error));
    }
    throw new Error("Could not load quarterly reports.");
  }
};

export const getQuarterlyReportDownloadUrl = async (
  quarterKey: string
): Promise<{ url: string; filename: string; quarterKey: string }> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const enc = encodeURIComponent(quarterKey);
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${QUARTERLY_REPORT_DOWNLOAD_URL}/${enc}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error("[getQuarterlyReportDownloadUrl]", {quarterKey, error});
    throw new Error(PDF_DOWNLOAD_USER_MESSAGE);
  }
};

/**
 * Download a PDF from an HTTPS URL (presigned S3 or public).
 * Logs failures to the console; callers should show only `message` from thrown Error to users.
 */
export const downloadPdfFromUrl = async (url: string, downloadFilename: string): Promise<void> => {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) {
      const body = await res.text();
      console.error("[downloadPdfFromUrl] HTTP error", {
        status: res.status,
        s3Code: parseS3ErrorCode(body),
        bodySnippet: body.slice(0, 800),
        urlPath: logUrlPathOnly(url),
        downloadFilename,
      });
      throw new Error(PDF_DOWNLOAD_USER_MESSAGE);
    }
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = downloadFilename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  } catch (e) {
    if (e instanceof Error && e.message === PDF_DOWNLOAD_USER_MESSAGE) {
      throw e;
    }
    console.error("[downloadPdfFromUrl] failed", {
      err: e,
      urlPath: logUrlPathOnly(url),
      downloadFilename,
    });
    throw new Error(PDF_DOWNLOAD_USER_MESSAGE);
  }
};

export const downloadQuarterlyReportPdf = async (quarterKey: string): Promise<void> => {
  const { url, filename } = await getQuarterlyReportDownloadUrl(quarterKey);
  await downloadPdfFromUrl(url, filename || `${quarterKey}.pdf`);
};

export const getBillingInvoiceDownloadUrl = async (): Promise<{
  url: string;
  filename: string;
  invoice_number: string | null;
}> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${BILLING_INVOICE_DOWNLOAD_URL}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data as { url: string; filename: string; invoice_number: string | null };
  } catch (error) {
    console.error("[getBillingInvoiceDownloadUrl]", error);
    throw new Error(PDF_DOWNLOAD_USER_MESSAGE);
  }
};

export const downloadBillingInvoicePdf = async (): Promise<void> => {
  const { url, filename } = await getBillingInvoiceDownloadUrl();
  await downloadPdfFromUrl(url, filename || "invoice.pdf");
};

export const getSchoolDashboard = async (schoolId: string): Promise<SchoolDashboardResponse> => {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS ?? "";
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const encodedSchoolId = encodeURIComponent(String(schoolId ?? "").trim());
    // `fetch` + `cache: "no-store"` bypasses the browser HTTP cache more reliably than axios
    // (fixes stale 304 / old tier % after Firestore updates). `_t` busts URL-keyed CDN caches.
    const url = `${base}${SCHOOL_ADMINS_APIS}${FETCH_SCHOOL_DASHBOARD}/${encodedSchoolId}?_t=${Date.now()}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`getSchoolDashboard HTTP ${res.status}`);
    }
    return (await res.json()) as SchoolDashboardResponse;
  } catch {
    throw new Error("Error fetching school dashboard. Please contact globalyoungscholar@argus.ai");
  }
};

export const checkSchoolEmail = async (email: string): Promise<SchoolEmailCheck | null> => {
  try {
    const encodedEmail = encodeURIComponent(email);
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}/checkSchoolEmail?email=${encodedEmail}`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) return null;
      console.error("checkSchoolEmail error:", error.response?.data);
    }
    throw new Error("Error checking school email. Please contact globalyoungscholar@argus.ai");
  }
};

export const verifySchoolEmail = async (email: string) => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const response = await axios.post(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}/verifySchoolEmail`,
      { email },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  } catch (error: any) {
    const msg =
      axios.isAxiosError(error) && error.response?.data?.error
        ? error.response.data.error
        : error.message ?? "Error verifying school email.";
    throw new Error(msg);
  }
};

// Alias kept for backward compatibility - delegates to verifySchoolAdminAndSendPasswordSetup
// which now handles both Firebase Auth user creation and admin record creation.
export const createSchoolAdmin = async (email: string, schoolId: string, _password?: string) => {
  return verifySchoolAdminAndSendPasswordSetup(email, schoolId);
};

export const verifySchoolAdminAndSendPasswordSetup = async (email: string, schoolId: string) => {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}/verifySchoolAdminAndSendPasswordSetup`,
      { email, schoolId }
    );
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 400) {
        throw new Error(error.response?.data?.error || "Email does not match the selected school.");
      }
      if (error.response?.status === 404) {
        throw new Error("School not found. Please contact us at globalyoungscholar@argus.ai");
      }
    }
    throw new Error(`Error verifying school admin: ${error.message ?? "Unknown error"}. Please contact globalyoungscholar@argus.ai`);
  }
};
