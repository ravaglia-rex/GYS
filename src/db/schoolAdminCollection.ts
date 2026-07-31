import axios from "axios";
import {
  BILLING_INVOICE_DOWNLOAD_URL,
  FETCH_SCHOOL_ADMIN_DATA,
  FETCH_SCHOOL_SUMMARY,
  SCHOOL_STUDENTS_ROSTER,
  QUARTERLY_REPORT_DOWNLOAD_URL,
  QUARTERLY_REPORTS,
  SCHOOL_ADMINS_APIS,
  SCHOOLS_APIS,
  SCHOOLS_FOR_ADMIN_EMAIL,
  STUDENT_REGISTRATION_EMAILS,
  UPDATE_SCHOOL_PROFILE,
  DISMISS_SCHOOL_TUTORIAL,
  SCHOOL_NOTIFICATIONS,
  SCHOOL_SEND_NOTIFICATION_EMAILS,
} from "../constants/constants";
import authTokenHandler from "../functions/auth_token/auth_token_handler";

const GYS_SUPPORT_EMAIL = "globalyoungscholar@argus.ai";

/** Shown in UI for any PDF download failure; details go to console only. */
const PDF_DOWNLOAD_USER_MESSAGE = `Something went wrong with your download. Please try again later. If it keeps happening, contact us at ${GYS_SUPPORT_EMAIL}.`;

function appendSchoolIdQuery(
  params: URLSearchParams,
  schoolId: string | undefined
): void {
  const id = typeof schoolId === "string" ? schoolId.trim() : "";
  if (id) params.set("schoolId", id);
}

function schoolIdQueryString(schoolId: string | undefined): string {
  const params = new URLSearchParams();
  appendSchoolIdQuery(params, schoolId);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Client-side cache for S3 presigned GET URLs. Server default TTL is 600s
 * (`REPORT_PDF_PRESIGN_TTL_SECONDS`); we expire early so a cached URL is never used after AWS rejects it.
 */
const SIGNED_URL_CACHE_TTL_MS = 540_000;
const signedUrlCache = new Map<string, { url: string; filename: string; invoice_number?: string | null; expiresAt: number }>();

function getCachedSignedDownload(cacheKey: string): { url: string; filename: string; invoice_number?: string | null } | null {
  const hit = signedUrlCache.get(cacheKey);
  if (!hit) return null;
  if (Date.now() >= hit.expiresAt) {
    signedUrlCache.delete(cacheKey);
    return null;
  }
  return hit;
}

function putCachedSignedDownload(
  cacheKey: string,
  value: { url: string; filename: string; invoice_number?: string | null }
): void {
  signedUrlCache.set(cacheKey, { ...value, expiresAt: Date.now() + SIGNED_URL_CACHE_TTL_MS });
}

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
  city?: string;
}

export interface AssessmentProgress {
  proficiency_tier?: number;
  status: "locked" | "available" | "tier_advanced" | "completed";
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
  /** True after the student has set their Firebase password. */
  password_setup_complete?: boolean;
  assessment_progress: Record<string, AssessmentProgress>;
  created_at: any;
  /**
   * Max membership tier included in the school's current plan (detail endpoint).
   * entry→1, standard→2, premium→3.
   */
  school_covered_membership_level?: number;
  /**
   * True when the student self-paid for a package above the school's current covered tier.
   * Detail endpoint only.
   */
  individual_add_on_purchased?: boolean;
}

export interface SchoolDashboardBilling {
  invoice_number: string | null;
  has_invoice_pdf: boolean;
}

export interface SchoolDashboardPaymentHistoryItem {
  payment_id: string;
  order_id: string | null;
  kind: "captured" | "school_plan_upgrade";
  paid_at: string | null;
  amount_paise: number | null;
  plan_id: string | null;
  invoice_number: string | null;
  has_invoice_pdf?: boolean;
  payment_method: string;
  renewal_date: string | null;
}

export type SchoolTutorialUiPreferences = {
  tutorials?: {
    dismissed?: Record<string, boolean>;
  };
};

/**
 * Lightweight school admin summary: live counts (denormalized on the school doc server-side),
 * analytics, billing, payment history, and per-admin UI preferences. Deliberately excludes the
 * per-student roster - fetch that separately via `getSchoolStudentRoster` (paginated `/students`)
 * only on pages that actually need per-student rows.
 */
export interface SchoolSummaryResponse {
  schoolId: string;
  ui_preferences?: SchoolTutorialUiPreferences;
  selected_plan_id?: string | null;
  subscription_plan?: string | null;
  /** Resolved server-side from the same school doc read for billing/plan data - see `schoolHeaderFieldsFromDoc`. */
  school_name?: string;
  city?: string;
  board_label?: string;
  member_since_iso?: string | null;
  institutional_tier?: string | null;
  live: {
    total_students: number;
    pending_approval: number;
    membership_breakdown: {
      level_1: number;
      level_2: number;
      level_3: number;
    };
  };
  analytics: Record<string, any>;
  billing?: SchoolDashboardBilling;
  payment_history?: SchoolDashboardPaymentHistoryItem[];
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

export interface SchoolAdminNotificationEventSource {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  created_at_iso: string;
  category: 'payment' | 'system' | 'general' | 'report';
  color: string;
}

export interface SchoolNotificationsResponse {
  schoolId: string;
  notifications: SchoolAdminNotificationEventSource[];
}

export const getSchoolNotifications = async (
  schoolId: string
): Promise<SchoolNotificationsResponse> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${SCHOOL_NOTIFICATIONS}${schoolIdQueryString(schoolId)}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data as SchoolNotificationsResponse;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(String(error.response.data.error));
    }
    throw new Error('Could not load school notifications.');
  }
};

export const sendSchoolNotificationEmails = async (params: {
  notificationIds: string[];
  schoolId: string;
}): Promise<void> => {
  const authToken = await authTokenHandler.getAuthToken();
  if (!authToken) {
    return;
  }
  await axios.post(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${SCHOOL_SEND_NOTIFICATION_EMAILS}`,
    params,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
};

export const getSchoolAdmin = async (
  email: string,
  schoolId?: string
): Promise<SchoolAdmin | null> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const encodedEmail = encodeURIComponent(email);
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${FETCH_SCHOOL_ADMIN_DATA}/${encodedEmail}${schoolIdQueryString(schoolId)}`,
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

/**
 * Paid schools the signed-in admin email may enter (post-auth picker / switcher).
 */
export const listSchoolsForAdminEmail = async (): Promise<SchoolEmailCheck[]> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${SCHOOLS_FOR_ADMIN_EMAIL}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return Array.isArray(response.data?.schools) ? response.data.schools : [];
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(String(error.response.data.error));
    }
    throw new Error("Could not load schools for this admin email.");
  }
};

export type StudentRegistrationEmailLists = {
  emails: string[];
  revokedEmails: string[];
};

export const getStudentRegistrationEmailLists = async (
  schoolId: string
): Promise<StudentRegistrationEmailLists> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${STUDENT_REGISTRATION_EMAILS}${schoolIdQueryString(schoolId)}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return {
      emails: Array.isArray(response.data?.emails) ? response.data.emails : [],
      revokedEmails: Array.isArray(response.data?.revokedEmails) ? response.data.revokedEmails : [],
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(String(error.response.data.error));
    }
    throw new Error("Could not load student registration emails.");
  }
};

export const getStudentRegistrationEmails = async (schoolId: string): Promise<string[]> => {
  const lists = await getStudentRegistrationEmailLists(schoolId);
  return lists.emails;
};

export type UpdateSchoolProfilePayload = {
  phone?: string;
  website?: string;
  udise_code?: string;
  boards?: string[];
  board?: string;
  abbreviations?: string[];
  referral_source?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  additional_contact_emails?: string[];
};

export const putSchoolTutorialDismissal = async (
  pageKey: string,
  dismissed: Record<string, boolean>,
  schoolId: string
): Promise<{ success: boolean }> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const response = await axios.put(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${DISMISS_SCHOOL_TUTORIAL}`,
      { pageKey, dismissed, schoolId },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data ?? { success: true };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(String(error.response.data.error));
    }
    throw new Error("Could not save tutorial preference.");
  }
};

export const putSchoolProfile = async (
  payload: UpdateSchoolProfilePayload,
  schoolId: string
): Promise<{ success: boolean; school_name: string; poc_email: string }> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const response = await axios.put(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${UPDATE_SCHOOL_PROFILE}`,
      { ...payload, schoolId },
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
  emails: string[],
  schoolId: string,
  revokedEmails?: string[]
): Promise<{ success: boolean; count: number }> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const response = await axios.put(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${STUDENT_REGISTRATION_EMAILS}`,
      revokedEmails ? { emails, revokedEmails, schoolId } : { emails, schoolId },
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

export const getQuarterlyReports = async (
  schoolId: string
): Promise<QuarterlyReportsResponse> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${QUARTERLY_REPORTS}${schoolIdQueryString(schoolId)}`,
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
  quarterKey: string,
  schoolId: string
): Promise<{ url: string; filename: string; quarterKey: string }> => {
  const cacheKey = `quarterly:${schoolId}:${quarterKey}`;
  const cached = getCachedSignedDownload(cacheKey);
  if (cached) {
    return { url: cached.url, filename: cached.filename, quarterKey };
  }
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const enc = encodeURIComponent(quarterKey);
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${QUARTERLY_REPORT_DOWNLOAD_URL}/${enc}${schoolIdQueryString(schoolId)}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    const data = response.data as { url: string; filename: string; quarterKey: string };
    putCachedSignedDownload(cacheKey, { url: data.url, filename: data.filename });
    return data;
  } catch (error) {
    console.error("[getQuarterlyReportDownloadUrl]", {quarterKey, schoolId, error});
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

export const downloadQuarterlyReportPdf = async (
  quarterKey: string,
  schoolId: string
): Promise<void> => {
  const { url, filename } = await getQuarterlyReportDownloadUrl(quarterKey, schoolId);
  await downloadPdfFromUrl(url, filename || `${quarterKey}.pdf`);
};

export const getBillingInvoiceDownloadUrl = async (
  schoolId: string,
  paymentId?: string
): Promise<{
  url: string;
  filename: string;
  invoice_number: string | null;
}> => {
  const cacheKey = `invoice:${schoolId}:${paymentId ?? "latest"}`;
  const cached = getCachedSignedDownload(cacheKey);
  if (cached) {
    return {
      url: cached.url,
      filename: cached.filename,
      invoice_number: cached.invoice_number ?? null,
    };
  }
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const params = new URLSearchParams();
    appendSchoolIdQuery(params, schoolId);
    if (paymentId) params.set("payment_id", paymentId);
    const qs = params.toString();
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${BILLING_INVOICE_DOWNLOAD_URL}${qs ? `?${qs}` : ""}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    const data = response.data as { url: string; filename: string; invoice_number: string | null };
    putCachedSignedDownload(cacheKey, {
      url: data.url,
      filename: data.filename,
      invoice_number: data.invoice_number,
    });
    return data;
  } catch (error) {
    console.error("[getBillingInvoiceDownloadUrl]", error);
    throw new Error(PDF_DOWNLOAD_USER_MESSAGE);
  }
};

export const downloadBillingInvoicePdf = async (
  schoolId: string,
  paymentId?: string
): Promise<void> => {
  const { url, filename } = await getBillingInvoiceDownloadUrl(schoolId, paymentId);
  await downloadPdfFromUrl(url, filename || "invoice.pdf");
};

/**
 * Cache freshness is now owned by React Query (see `query/hooks.ts` `useSchoolAdminSummary` /
 * `useSchoolAdminRoster`) rather than by defeating the HTTP cache on every call - the endpoint
 * response can be cached normally; React Query's `staleTime`/manual `invalidateQueries` calls
 * after mutations (billing upgrade, roster changes, etc.) control when a refetch actually happens.
 */
export const getSchoolSummary = async (schoolId: string): Promise<SchoolSummaryResponse> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const encodedSchoolId = encodeURIComponent(String(schoolId ?? "").trim());
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${FETCH_SCHOOL_SUMMARY}/${encodedSchoolId}`,
      {headers: {Authorization: `Bearer ${authToken}`}}
    );
    return response.data as SchoolSummaryResponse;
  } catch {
    throw new Error("Error fetching school summary. Please contact globalyoungscholar@argus.ai");
  }
};

const SCHOOL_ROSTER_PAGE_LIMIT = 500;
/** Safety cap on pagination loops - matches the "no per-campus cap" premium plan ceiling. */
const SCHOOL_ROSTER_MAX_PAGES = 40;

/**
 * Fetches the full student roster for the caller's school via the paginated `/students` endpoint,
 * looping through pages until exhausted. Kept as a single "give me everything" helper so existing
 * pages that compute roster-wide aggregates (tier breakdowns, grade distribution, etc.) don't need
 * to manage pagination themselves; the endpoint being paginated still bounds each individual
 * Firestore read even for large (premium, uncapped) school rosters.
 */
export const getSchoolStudentRoster = async (schoolId: string): Promise<StudentRow[]> => {
  const authToken = await authTokenHandler.getAuthToken();
  const all: StudentRow[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < SCHOOL_ROSTER_MAX_PAGES; page += 1) {
    const params = new URLSearchParams({limit: String(SCHOOL_ROSTER_PAGE_LIMIT)});
    appendSchoolIdQuery(params, schoolId);
    if (cursor) params.set("cursor", cursor);
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${SCHOOL_STUDENTS_ROSTER}?${params.toString()}`,
      {headers: {Authorization: `Bearer ${authToken}`}}
    );
    const pageStudents: StudentRow[] = Array.isArray(response.data?.students) ? response.data.students : [];
    all.push(...pageStudents);
    cursor = typeof response.data?.next_cursor === "string" ? response.data.next_cursor : null;
    if (!cursor) break;
  }

  return all;
};

export const getSchoolStudent = async (
  studentId: string,
  schoolId: string
): Promise<StudentRow> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const encodedStudentId = encodeURIComponent(String(studentId ?? "").trim());
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}/students/${encodedStudentId}${schoolIdQueryString(schoolId)}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data as StudentRow;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      throw new Error("This student is not linked to your school.");
    }
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error("Student not found.");
    }
    throw new Error("Could not load student profile. Please try again.");
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
