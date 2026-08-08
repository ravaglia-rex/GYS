import axios from 'axios';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
import {
  filterHiddenStaffSchoolAdminEmails,
  isHiddenStaffSchoolAdminEmail,
} from '../constants/hiddenStaffSchoolAdmins';
import {
  PLATFORM_ADMIN_APIS,
  PLATFORM_ADMIN_AUTHENTICATE,
  PLATFORM_ADMIN_VERIFY_AND_SEND_PASSWORD_SETUP,
  PLATFORM_ADMIN_VERIFY_PASSWORD_SETUP,
  PLATFORM_ADMIN_FULFILL_REDEMPTION,
  PLATFORM_ADMIN_ME,
  PLATFORM_ADMIN_OVERVIEW,
  PLATFORM_ADMIN_PENDING_REDEMPTIONS,
  PLATFORM_ADMIN_REDEMPTION_HISTORY,
  PLATFORM_ADMIN_RUN_PIPELINE,
  PLATFORM_ADMIN_SCHOOLS,
  PLATFORM_ADMIN_STUDENTS,
  PLATFORM_ADMIN_STUDENTS_STATS,
  PLATFORM_ADMIN_MARK_SCHOOL_PAID,
  PLATFORM_ADMIN_UPDATE_SCHOOL_BILLING,
  PLATFORM_ADMIN_DELETE_SCHOOL,
  PLATFORM_ADMIN_DELETE_STUDENT,
  PLATFORM_ADMIN_BILLING_INVOICE_DOWNLOAD_URL,
  PLATFORM_ADMIN_INVITE_SCHOOL_ADMIN,
  PLATFORM_ADMIN_ADD_SCHOOL_ADMIN,
  PLATFORM_ADMIN_DELETE_SCHOOL_CONTACT,
  PLATFORM_ADMIN_STUDENT_REGISTRATION_EMAILS,
  PLATFORM_ADMIN_COMPLIMENTARY_INVITES,
  PLATFORM_ADMIN_ADMINS,
  PLATFORM_ADMIN_ADMINS_UPDATE,
  PLATFORM_ADMIN_ADMINS_REMOVE,
  PLATFORM_ADMIN_ADMINS_INVITE,
  PLATFORM_ADMIN_QUESTION_PROBLEM_REPORTS,
  PLATFORM_ADMIN_TEST_RESULTS_TRACKED_EMAILS,
  PLATFORM_ADMIN_TEST_RESULTS_DAY_QUESTIONS,
} from '../constants/constants';

function apiBase(): string {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  if (!base) {
    throw new Error('REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not set.');
  }
  return base;
}

async function authHeaders(forceRefresh = false): Promise<Record<string, string>> {
  const token = await authTokenHandler.getAuthToken(forceRefresh);
  if (!token) {
    throw new Error('Not authenticated');
  }
  return { Authorization: `Bearer ${token}` };
}

function isAxiosUnauthorized(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 401
  );
}

/** POST/GET with Bearer token; on 401, force-refresh Firebase ID token and retry once. */
async function withAuthRetry<T>(request: (headers: Record<string, string>) => Promise<T>): Promise<T> {
  try {
    return await request(await authHeaders(false));
  } catch (error) {
    if (!isAxiosUnauthorized(error)) throw error;
    return await request(await authHeaders(true));
  }
}

export type PlatformAdminOverviewStats = {
  schools_total: number;
  schools_paid: number;
  schools_pending_payment: number;
  schools_verified: number;
  schools_pending_wire_capture: number;
  students_total: number;
  pending_redemptions: number;
  total_revenue_paise: number;
};

/** Who received the school payment. Null when unpaid / not yet attributed. */
export type PlatformAdminSchoolPaymentPayee = 'education_world' | 'argus';

export const PLATFORM_ADMIN_PAYMENT_PAYEE_LABELS: Record<PlatformAdminSchoolPaymentPayee, string> = {
  education_world: 'Education World',
  argus: 'Argus',
};

/** Education World if method is paid_to_education_world; otherwise Argus when payment is captured. */
export function resolvePlatformAdminSchoolPaymentPayee(params: {
  payment_method: string | null | undefined;
  payment_satisfied: boolean;
  payment_payee?: PlatformAdminSchoolPaymentPayee | null;
}): PlatformAdminSchoolPaymentPayee | null {
  if (params.payment_payee === 'education_world' || params.payment_payee === 'argus') {
    return params.payment_payee;
  }
  const method = (params.payment_method ?? '').trim().toLowerCase();
  if (method === 'paid_to_education_world') return 'education_world';
  if (params.payment_satisfied) return 'argus';
  return null;
}

export type PlatformAdminSchoolSummary = {
  id: string;
  school_name: string;
  poc_email: string;
  verified: boolean;
  payment_status: string;
  payment_method: string | null;
  payment_captured: string | null;
  payment_satisfied: boolean;
  /** Present when payment is attributed: Education World vs Argus. */
  payment_payee?: PlatformAdminSchoolPaymentPayee | null;
  selected_plan_id: string | null;
  registered_plan_id: string | null;
  subscription_plan: string | null;
  registered_subscription_plan: string | null;
  plan_price_inr: number | null;
  paid_amount_paise: number | null;
  institutional_tier: string | null;
  institutional_performance_tier: string | null;
  students_invited: number;
  /** Signed-up student accounts linked to this school (excludes test accounts). */
  student_count: number;
  created_at: string | null;
  updated_at: string | null;
  paid_at: string | null;
  pending_wire_capture: boolean;
};

export type PlatformAdminSchoolDetail = PlatformAdminSchoolSummary & {
  contact_emails: string[];
  gstin: string | null;
  gst_registration_status: string | null;
  student_registration_emails: string[];
  billing_invoice_number: string | null;
  billing_public_reference: string | null;
  billing_invoice_pdf_available: boolean;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  wire_payment_id: string | null;
  wire_order_id: string | null;
  wire_amount_paise: number | null;
  students_on_roster: number;
  students_setup_complete: number;
};

export type PlatformAdminPaymentHistoryItem = {
  id: string;
  kind: string;
  amount_paise: number | null;
  plan_id: string | null;
  source: string | null;
  order_id: string | null;
  payment_id: string | null;
  billing_invoice_number: string | null;
  public_reference: string | null;
  has_invoice_pdf: boolean;
  confirmation_email_sent_at: string | null;
  recorded_at: string | null;
};

export type PlatformAdminPocAccountRow = {
  email: string;
  is_primary: boolean;
  is_admin: boolean;
  account_created: boolean;
  email_verified: boolean;
  setup_complete: boolean;
  auth_created_at: string | null;
  last_sign_in_at: string | null;
  last_invited_at: string | null;
  last_invited_by: string | null;
};

export type PlatformAdminEmailActivityRow = {
  id: string;
  sent_at: string | null;
  template_id: string;
  label: string;
  subject: string | null;
  recipients: string[];
  invited_by: string | null;
  source: 'logged' | 'inferred';
};

export type PlatformAdminSchoolRegistrant = {
  name: string | null;
  designation: string | null;
};

export type PlatformAdminStudentRow = {
  uid: string;
  email: string;
  first_name: string;
  last_name: string;
  school_id: string | null;
  school_name: string | null;
  grade: number | null;
  membership_level: number | null;
  approval_status: string | null;
  achievement_tier: string | null;
  argus_coins: number;
  qod_attempted_total?: number;
  qod_correct_total?: number;
  qod_accuracy_pct?: number;
  practice_sessions_total?: number;
  practice_questions_total?: number;
  practice_correct_total?: number;
  practice_accuracy_pct?: number;
  practice_coins_earned_total?: number;
  exam_coins_earned_total?: number;
  login_streak_current?: number;
  login_streak_longest?: number;
  qod_streak_current?: number;
  qod_streak_longest?: number;
  created_at: string | null;
  is_test?: boolean;
  /** True for email-bound complimentary invites that haven't registered an account yet. */
  is_invite?: boolean;
  invited_by?: string | null;
  password_setup_complete?: boolean;
  self_paid?: boolean;
};

export type PlatformAdminStudentPaymentHistoryItem = {
  id: string;
  payment_id: string;
  order_id: string | null;
  kind: string;
  payment_status: string;
  paid_at: string | null;
  amount_paise: number | null;
  membership_level: number | null;
  from_membership_level: number | null;
  target_membership_level: number | null;
  payment_method: string;
  invoice_number: string | null;
  has_invoice_pdf: boolean;
  description: string;
  error_code: string | null;
  error_description: string | null;
};

export type PlatformAdminStudentDetail = PlatformAdminStudentRow & {
  phone_number: string | null;
  parent_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  heard_from: string | null;
  signup_school_name: string | null;
  registration_status: string | null;
  school_covered_membership_level: number | null;
  complimentary_invite_membership_level: number | null;
  payment_status: string | null;
  razorpay_payment_id: string | null;
  razorpay_order_id: string | null;
  razorpay_amount_paise: number | null;
  paid_at: string | null;
  billing_invoice_number: string | null;
  billing_invoice_pdf_available: boolean;
  password_setup_complete: boolean;
  self_paid: boolean;
  updated_at: string | null;
  payment_history: PlatformAdminStudentPaymentHistoryItem[];
};

export type PlatformAdminStudentStats = {
  /** Accounts with password setup complete. */
  students_total: number;
  /** On school roster + password set. */
  students_active: number;
  /** Individual signup payers, set up or not (excludes membership upgrades). Overlaps every other bucket. */
  students_self_paid: number;
  /** Subset of self_paid with password setup complete. */
  students_self_paid_setup: number;
  /** Subset of self_paid still missing password setup. */
  students_self_paid_pending: number;
  /** Unique students with a captured membership upgrade payment. */
  students_membership_upgrade: number;
  /** On roster with no account yet, or account without password. */
  students_roster_pending: number;
  /** Not on school roster; account exists but password not set (paid or unpaid). */
  students_others: number;
  /** @deprecated Prefer roster_pending + others. Kept for older clients. */
  students_pending_setup?: number;
  /** Invite-list emails with no account yet (subset of roster_pending). */
  students_pending_invite?: number;
  /** Invite-list emails ∪ registered accounts across real schools. */
  students_on_roster?: number;
  /** Registered accounts linked to a school (subset of on_roster). */
  students_rostered?: number;
  /** Alias of students_pending_setup. */
  students_pending?: number;
};

export type PlatformAdminPendingRedemption = {
  redemption_id: string;
  uid: string;
  item_id: string;
  item_name: string;
  coins_spent: number;
  student_name: string;
  student_email: string;
  parent_email: string;
  requested_at?: { seconds?: number; _seconds?: number };
};

export type PlatformAdminRedemptionHistorySummary = {
  pending_count: number;
  fulfilled_count: number;
  rejected_count: number;
  coins_fulfilled: number;
  coins_rejected_refunded: number;
  inr_fulfilled_total: number;
};

export type PlatformAdminRedemptionHistoryEntry = {
  redemption_id: string;
  uid: string;
  student_name: string;
  student_email: string;
  parent_email: string;
  item_id: string;
  item_name: string;
  coins_spent: number;
  status: 'fulfilled' | 'rejected';
  face_value_inr: number;
  admin_note: string | null;
  voucher_code: string | null;
  requested_at?: { seconds?: number; _seconds?: number };
  action_at?: { seconds?: number; _seconds?: number } | null;
};

export type PlatformAdminRole = 'super' | 'member';

export type PlatformAdminMe = {
  ok: boolean;
  email: string;
  name?: string;
  position?: string;
  role: PlatformAdminRole;
  permissions?: string[];
  is_super_admin: boolean;
  password_setup_complete?: boolean;
};

export async function getPlatformAdminMe(): Promise<PlatformAdminMe | null> {
  try {
    const headers = await authHeaders();
    const res = await axios.get(`${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ME}`, { headers });
    if (res.data?.ok !== true) return null;
    return res.data as PlatformAdminMe;
  } catch {
    return null;
  }
}

export async function checkPlatformAdminAccess(): Promise<boolean> {
  const me = await getPlatformAdminMe();
  return me?.ok === true;
}

/** Validates env-stored admin password and returns a Firebase custom token (legacy shared-password login). */
export async function authenticatePlatformAdmin(
  email: string,
  password: string
): Promise<string> {
  const res = await axios.post(`${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_AUTHENTICATE}`, {
    email: email.trim().toLowerCase(),
    password,
  });
  const token = res.data?.customToken;
  if (typeof token !== 'string' || !token) {
    throw new Error('Authentication failed');
  }
  return token;
}

/** Ensures Auth user exists for an allowlisted admin so a password-setup email can be sent. */
export async function verifyPlatformAdminAndSendPasswordSetup(email: string): Promise<void> {
  await axios.post(`${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_VERIFY_AND_SEND_PASSWORD_SETUP}`, {
    email: email.trim().toLowerCase(),
  });
}

/** Marks personal password setup complete after confirmPasswordReset (requires signed-in admin). */
export async function verifyPlatformAdminPasswordSetup(email: string): Promise<void> {
  const headers = await authHeaders();
  await axios.post(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_VERIFY_PASSWORD_SETUP}`,
    { email: email.trim().toLowerCase() },
    { headers }
  );
}

export async function getPlatformAdminOverview(): Promise<PlatformAdminOverviewStats> {
  const headers = await authHeaders();
  const res = await axios.get(`${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_OVERVIEW}`, { headers });
  return (res.data.stats ?? {}) as PlatformAdminOverviewStats;
}

export async function listPlatformAdminSchools(params?: {
  payment?: 'paid' | 'pending' | 'wire';
  /** Filter by who received payment: Education World vs Argus. */
  payee?: PlatformAdminSchoolPaymentPayee;
  verified?: 'yes' | 'no';
  plan?: 'entry' | 'standard' | 'premium';
  search?: string;
  limit?: number;
}): Promise<PlatformAdminSchoolSummary[]> {
  const headers = await authHeaders();
  const res = await axios.get(`${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_SCHOOLS}`, {
    headers,
    params,
  });
  return res.data.schools ?? [];
}

export async function getPlatformAdminSchool(schoolId: string): Promise<{
  school: PlatformAdminSchoolDetail;
  payment_history: PlatformAdminPaymentHistoryItem[];
  analytics: Record<string, unknown> | null;
  poc_accounts: PlatformAdminPocAccountRow[];
  email_activity: PlatformAdminEmailActivityRow[];
  registrant: PlatformAdminSchoolRegistrant | null;
}> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_SCHOOLS}/${encodeURIComponent(schoolId)}`,
    { headers }
  );
  return {
    school: {
      ...res.data.school,
      contact_emails: filterHiddenStaffSchoolAdminEmails(
        Array.isArray(res.data.school?.contact_emails) ? res.data.school.contact_emails : []
      ),
    },
    payment_history: res.data.payment_history ?? [],
    analytics: res.data.analytics ?? null,
    poc_accounts: Array.isArray(res.data.poc_accounts)
      ? res.data.poc_accounts
          .filter((row: PlatformAdminPocAccountRow) => !isHiddenStaffSchoolAdminEmail(row.email))
          .map((row: PlatformAdminPocAccountRow) => ({
            ...row,
            is_admin: true,
          }))
      : [],
    email_activity: Array.isArray(res.data.email_activity)
      ? res.data.email_activity.map((row: PlatformAdminEmailActivityRow) => ({
          ...row,
          recipients: filterHiddenStaffSchoolAdminEmails(
            Array.isArray(row.recipients) ? row.recipients : []
          ),
        }))
      : [],
    registrant: res.data.registrant ?? null,
  };
}

export async function getPlatformAdminSchoolInvoiceDownloadUrl(
  schoolId: string,
  params?: { payment_history_id?: string; public_reference?: string }
): Promise<{ url: string; filename: string; invoice_number: string | null }> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_SCHOOLS}/${encodeURIComponent(schoolId)}${PLATFORM_ADMIN_BILLING_INVOICE_DOWNLOAD_URL}`,
    { headers, params }
  );
  return {
    url: res.data.url,
    filename: res.data.filename,
    invoice_number: res.data.invoice_number ?? null,
  };
}

export type PlatformAdminMarkSchoolPaidMethod =
  | 'wire'
  | 'razorpay_link'
  | 'neft_rtgs'
  | 'upi'
  | 'cheque'
  | 'paid_to_education_world'
  | 'other';

/** Historical methods kept for display only - no longer selectable when marking paid. */
const LEGACY_PLATFORM_ADMIN_PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  already_paid: 'Paid before platform signup',
};

export const PLATFORM_ADMIN_PAYMENT_METHOD_LABELS: Record<PlatformAdminMarkSchoolPaidMethod, string> = {
  wire: 'Wire transfer',
  razorpay_link: 'Razorpay link',
  neft_rtgs: 'NEFT / RTGS',
  upi: 'UPI',
  cheque: 'Cheque',
  paid_to_education_world: 'Paid to Education World',
  other: 'Other',
};

export function platformAdminPaymentMethodLabel(method: string): string {
  return (
    PLATFORM_ADMIN_PAYMENT_METHOD_LABELS[method as PlatformAdminMarkSchoolPaidMethod] ??
    LEGACY_PLATFORM_ADMIN_PAYMENT_METHOD_LABELS[method] ??
    method
  );
}

export async function markPlatformAdminSchoolPaid(
  schoolId: string,
  body: {
    payment_method: PlatformAdminMarkSchoolPaidMethod;
    paid_at: string;
    amount_paise?: number;
    plan_id?: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    transaction_reference?: string;
    admin_note?: string;
    send_confirmation_email?: boolean;
    /** Include invoice PDF attachment when sending confirmation email. Defaults to true. */
    attach_invoice?: boolean;
  }
): Promise<{ paymentId: string; invoiceNumber: string; publicReference: string }> {
  const res = await withAuthRetry((headers) =>
    axios.post(
      `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_SCHOOLS}/${encodeURIComponent(schoolId)}${PLATFORM_ADMIN_MARK_SCHOOL_PAID}`,
      body,
      { headers }
    )
  );
  return {
    paymentId: res.data.paymentId,
    invoiceNumber: res.data.invoiceNumber,
    publicReference: res.data.publicReference,
  };
}

export async function updatePlatformAdminSchoolBilling(
  schoolId: string,
  body: {
    effective_plan_id?: string;
    paid_amount_paise?: number;
    admin_note?: string;
  }
): Promise<void> {
  const headers = await authHeaders();
  await axios.post(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_SCHOOLS}/${encodeURIComponent(schoolId)}${PLATFORM_ADMIN_UPDATE_SCHOOL_BILLING}`,
    body,
    { headers }
  );
}

export async function invitePlatformAdminSchoolAdmin(
  schoolId: string,
  email: string
): Promise<{ email: string; invited: boolean }> {
  const headers = await authHeaders();
  const res = await axios.post(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_SCHOOLS}/${encodeURIComponent(schoolId)}${PLATFORM_ADMIN_INVITE_SCHOOL_ADMIN}`,
    { email },
    { headers }
  );
  return {
    email: res.data.email ?? email,
    invited: res.data.invited !== false,
  };
}

export async function importPlatformAdminStudentRegistrationEmails(
  schoolId: string,
  emails: string[]
): Promise<{ imported: number; total: number }> {
  const headers = await authHeaders();
  const res = await axios.post(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_SCHOOLS}/${encodeURIComponent(schoolId)}${PLATFORM_ADMIN_STUDENT_REGISTRATION_EMAILS}`,
    { emails },
    { headers }
  );
  return {
    imported: Number(res.data.imported ?? 0),
    total: Number(res.data.total ?? 0),
  };
}

export async function addPlatformAdminSchoolAdmin(
  schoolId: string,
  body: { email: string }
): Promise<{
  email: string;
  already_admin: boolean;
  invited: boolean;
  already_configured: boolean;
  warning?: string;
}> {
  const headers = await authHeaders();
  const res = await axios.post(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_SCHOOLS}/${encodeURIComponent(schoolId)}${PLATFORM_ADMIN_ADD_SCHOOL_ADMIN}`,
    body,
    { headers }
  );
  return {
    email: res.data.email ?? body.email,
    already_admin: Boolean(res.data.already_admin),
    invited: Boolean(res.data.invited),
    already_configured: Boolean(res.data.already_configured),
    warning: typeof res.data.warning === 'string' ? res.data.warning : undefined,
  };
}

export type PlatformAdminDeleteSchoolContactResult = {
  email: string;
  removed_from_contact_emails: boolean;
  admin_docs_deleted: number;
  auth_deleted: boolean;
  auth_skipped: boolean;
};

/** Super admin only - strip admin from school records and delete Auth when safe. */
export async function deletePlatformAdminSchoolContact(
  schoolId: string,
  email: string
): Promise<PlatformAdminDeleteSchoolContactResult> {
  const headers = await authHeaders();
  const res = await axios.post(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_SCHOOLS}/${encodeURIComponent(schoolId)}${PLATFORM_ADMIN_DELETE_SCHOOL_CONTACT}`,
    { email },
    { headers }
  );
  return {
    email: res.data.email ?? email,
    removed_from_contact_emails: Boolean(res.data.removed_from_contact_emails),
    admin_docs_deleted:
      typeof res.data.admin_docs_deleted === 'number' ? res.data.admin_docs_deleted : 0,
    auth_deleted: Boolean(res.data.auth_deleted),
    auth_skipped: Boolean(res.data.auth_skipped),
  };
}

export type PlatformAdminDeleteSchoolResult = {
  schoolId: string;
  studentsUnlinked: number;
  adminAuthDeleted: number;
  adminAuthSkipped: number;
  allowlistEntriesDeleted: number;
  subcollectionsDeleted: Record<string, number>;
};

export async function deletePlatformAdminSchool(
  schoolId: string,
  body: {
    confirm_school_name: string;
    delete_admin_auth?: boolean;
    unlink_students?: boolean;
  }
): Promise<PlatformAdminDeleteSchoolResult> {
  const headers = await authHeaders();
  const res = await axios.post(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_SCHOOLS}/${encodeURIComponent(schoolId)}${PLATFORM_ADMIN_DELETE_SCHOOL}`,
    body,
    { headers }
  );
  return {
    schoolId: res.data.schoolId ?? schoolId,
    studentsUnlinked: res.data.studentsUnlinked ?? 0,
    adminAuthDeleted: res.data.adminAuthDeleted ?? 0,
    adminAuthSkipped: res.data.adminAuthSkipped ?? 0,
    allowlistEntriesDeleted: res.data.allowlistEntriesDeleted ?? 0,
    subcollectionsDeleted: res.data.subcollectionsDeleted ?? {},
  };
}

export type PlatformAdminDeleteStudentResult = {
  studentUid: string;
  email: string;
  authDeleted: boolean;
  authSkipped: boolean;
  pendingRedemptionsRemoved: number;
};

export async function deletePlatformAdminStudent(
  studentUid: string,
  body: {
    confirm_email: string;
    delete_auth?: boolean;
  }
): Promise<PlatformAdminDeleteStudentResult> {
  const headers = await authHeaders();
  const res = await axios.post(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_STUDENTS}/${encodeURIComponent(studentUid)}${PLATFORM_ADMIN_DELETE_STUDENT}`,
    body,
    { headers }
  );
  return {
    studentUid: res.data.studentUid ?? studentUid,
    email: res.data.email ?? '',
    authDeleted: res.data.authDeleted === true,
    authSkipped: res.data.authSkipped === true,
    pendingRedemptionsRemoved: res.data.pendingRedemptionsRemoved ?? 0,
  };
}

export type PlatformAdminCoinEventRow = {
  id: string;
  ts: string | null;
  date_ist: string | null;
  delta: number;
  balance_after: number;
  lifetime_after: number;
  reason: string;
  ref_id: string | null;
  meta: Record<string, unknown> | null;
};

export async function getPlatformAdminStudentCoinEvents(
  studentUid: string,
  limit = 50
): Promise<PlatformAdminCoinEventRow[]> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_STUDENTS}/${encodeURIComponent(studentUid)}/coin-events`,
    { headers, params: { limit } }
  );
  return Array.isArray(res.data?.events) ? res.data.events : [];
}

export async function getPlatformAdminStudent(studentUid: string): Promise<PlatformAdminStudentDetail> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_STUDENTS}/${encodeURIComponent(studentUid)}`,
    { headers }
  );
  if (!res.data?.student) {
    throw new Error('Student not found');
  }
  const student = res.data.student as PlatformAdminStudentDetail;
  return {
    ...student,
    billing_invoice_pdf_available: student.billing_invoice_pdf_available === true,
    payment_history: Array.isArray(student.payment_history)
      ? student.payment_history.map((row) => ({
          ...row,
          has_invoice_pdf: row.has_invoice_pdf === true,
        }))
      : [],
  };
}

export async function getPlatformAdminStudentInvoiceDownloadUrl(
  studentUid: string,
  params?: { payment_history_id?: string }
): Promise<{ url: string; filename: string; invoice_number: string | null }> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_STUDENTS}/${encodeURIComponent(studentUid)}${PLATFORM_ADMIN_BILLING_INVOICE_DOWNLOAD_URL}`,
    { headers, params }
  );
  return {
    url: res.data.url,
    filename: res.data.filename,
    invoice_number: res.data.invoice_number ?? null,
  };
}

export async function capturePlatformAdminSchoolPayment(schoolId: string): Promise<void> {
  const headers = await authHeaders();
  await axios.post(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_SCHOOLS}/${encodeURIComponent(schoolId)}/capture-payment`,
    {},
    { headers }
  );
}

export async function getPlatformAdminStudentStats(): Promise<PlatformAdminStudentStats> {
  const headers = await authHeaders();
  const res = await axios.get(`${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_STUDENTS_STATS}`, { headers });
  return res.data.stats;
}

export async function listPlatformAdminStudents(params?: {
  search?: string;
  grade?: string;
  membership?: string;
  status?: 'approved' | 'pending' | 'all';
  roster?: 'yes' | 'no' | 'all';
  setup?: 'complete' | 'incomplete' | 'all';
  payment?: 'self_paid' | 'membership_upgrade' | 'all';
  /** registered = has account; invite = invite-list / complimentary stub, no account yet. */
  account?: 'registered' | 'invite' | 'all';
  /** Required: `'all'` or one/more school document IDs. Omitting returns no students. */
  school_ids?: 'all' | string[];
  limit?: number;
}): Promise<{
  students: PlatformAdminStudentRow[];
  /** Rows matching the filters platform-wide - can exceed `students.length` when `limit` clips. */
  totalMatching: number;
}> {
  const headers = await authHeaders();
  const schoolIdsParam =
    params?.school_ids === 'all'
      ? 'all'
      : Array.isArray(params?.school_ids) && params.school_ids.length > 0
        ? params.school_ids.join(',')
        : undefined;
  const res = await axios.get(`${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_STUDENTS}`, {
    headers,
    params: {
      search: params?.search,
      limit: params?.limit,
      grade: params?.grade && params.grade !== 'all' ? params.grade : undefined,
      membership: params?.membership && params.membership !== 'all' ? params.membership : undefined,
      status: params?.status && params.status !== 'all' ? params.status : undefined,
      roster: params?.roster && params.roster !== 'all' ? params.roster : undefined,
      setup: params?.setup && params.setup !== 'all' ? params.setup : undefined,
      payment: params?.payment && params.payment !== 'all' ? params.payment : undefined,
      account: params?.account && params.account !== 'all' ? params.account : undefined,
      school_ids: schoolIdsParam,
    },
  });
  const students = (res.data.students ?? []) as PlatformAdminStudentRow[];
  return {
    students,
    totalMatching:
      typeof res.data.total_matching === 'number' ? res.data.total_matching : students.length,
  };
}

export type PlatformAdminComplimentaryInvite = {
  id: string;
  email: string;
  membership_level: 1 | 2 | 3 | 4;
  status: 'pending' | 'redeemed' | 'revoked';
  created_by: string;
  created_at: unknown;
  updated_at: unknown;
  redeemed_at?: unknown;
  redeemed_uid?: string | null;
};

export async function listPlatformAdminComplimentaryInvites(
  status: 'pending' | 'redeemed' | 'revoked' | 'all' = 'pending'
): Promise<PlatformAdminComplimentaryInvite[]> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_COMPLIMENTARY_INVITES}`,
    { headers, params: { status } }
  );
  return (res.data.invites ?? []) as PlatformAdminComplimentaryInvite[];
}

export async function createPlatformAdminComplimentaryInvite(params: {
  email: string;
  membership_level: 1 | 2 | 3 | 4;
}): Promise<{
  invite: PlatformAdminComplimentaryInvite;
  updated: boolean;
  invite_sent: boolean;
}> {
  const headers = await authHeaders();
  const res = await axios.post(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_COMPLIMENTARY_INVITES}`,
    params,
    { headers }
  );
  return {
    invite: res.data.invite as PlatformAdminComplimentaryInvite,
    updated: res.data.updated === true,
    invite_sent: res.data.invite_sent === true,
  };
}

export async function revokePlatformAdminComplimentaryInvite(email: string): Promise<void> {
  const headers = await authHeaders();
  await axios.delete(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_COMPLIMENTARY_INVITES}/${encodeURIComponent(email)}`,
    { headers }
  );
}

export async function listPlatformAdminPendingRedemptions(): Promise<PlatformAdminPendingRedemption[]> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_PENDING_REDEMPTIONS}`,
    { headers }
  );
  return res.data.pending ?? [];
}

export async function getPlatformAdminRedemptionHistory(): Promise<{
  summary: PlatformAdminRedemptionHistorySummary;
  history: PlatformAdminRedemptionHistoryEntry[];
}> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_REDEMPTION_HISTORY}`,
    { headers }
  );
  return {
    summary: res.data.summary ?? {
      pending_count: 0,
      fulfilled_count: 0,
      rejected_count: 0,
      coins_fulfilled: 0,
      coins_rejected_refunded: 0,
      inr_fulfilled_total: 0,
    },
    history: res.data.history ?? [],
  };
}

export async function fulfillPlatformAdminRedemption(body: {
  redemption_id: string;
  uid: string;
  action: 'fulfill' | 'reject';
  voucher_code?: string;
  admin_note?: string;
}): Promise<void> {
  const headers = await authHeaders();
  await axios.post(`${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_FULFILL_REDEMPTION}`, body, {
    headers,
  });
}

export async function runPlatformAdminPipeline(
  pipeline: 'school' | 'student' | 'monthly'
): Promise<void> {
  const headers = await authHeaders();
  await axios.post(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_RUN_PIPELINE}`,
    { pipeline },
    { headers }
  );
}

export type PlatformAdminDirectoryRow = {
  email: string;
  name: string;
  position: string;
  role: 'super' | 'member';
  permissions: string[];
  active: boolean;
  password_setup_complete: boolean;
  /** Portal activity (API use while session open). Prefer this over last_login_at. */
  last_seen_at: string | null;
  /** Firebase Auth lastSignInTime - only updates on actual sign-in. */
  last_login_at: string | null;
  last_invite_sent_at: string | null;
  last_invited_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export async function listPlatformAdminsDirectory(): Promise<PlatformAdminDirectoryRow[]> {
  const headers = await authHeaders();
  const res = await axios.get(`${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ADMINS}`, {
    headers,
  });
  return res.data.admins ?? [];
}

export async function addPlatformAdmin(body: {
  email: string;
  name?: string;
  position?: string;
  send_invite?: boolean;
}): Promise<{ admin: PlatformAdminDirectoryRow; invite_sent: boolean }> {
  const headers = await authHeaders();
  const res = await axios.post(`${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ADMINS}`, body, {
    headers,
  });
  return {
    admin: res.data.admin,
    invite_sent: res.data.invite_sent === true,
  };
}

export async function updatePlatformAdmin(body: {
  email: string;
  name?: string;
  position?: string;
}): Promise<PlatformAdminDirectoryRow> {
  const headers = await authHeaders();
  const res = await axios.post(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ADMINS_UPDATE}`,
    body,
    { headers }
  );
  return res.data.admin;
}

export async function removePlatformAdmin(email: string): Promise<PlatformAdminDirectoryRow> {
  const headers = await authHeaders();
  const res = await axios.post(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ADMINS_REMOVE}`,
    { email },
    { headers }
  );
  return res.data.admin;
}

export async function invitePlatformAdmin(email: string): Promise<void> {
  const headers = await authHeaders();
  await axios.post(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_ADMINS_INVITE}`,
    { email },
    { headers }
  );
}

export function formatInrFromPaise(paise: number | null | undefined): string {
  if (typeof paise !== 'number' || !Number.isFinite(paise)) return ' - ';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function formatInr(amount: number | null | undefined): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return ' - ';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ' - ';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return ' - ';
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Date + time for activity timestamps (last active / last login). */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '-';
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function paymentStatusChipColor(status: string): 'success' | 'warning' | 'error' | 'default' {
  const s = status.toLowerCase();
  if (['captured', 'paid', 'completed'].includes(s)) return 'success';
  if (['pending', 'pending_contact', 'pending_webhook'].includes(s)) return 'warning';
  if (s === 'failed') return 'error';
  return 'default';
}

export type PlatformAdminQuestionProblemReport = {
  id: string;
  source: 'official' | 'practice';
  exam_id: string;
  exam_title: string;
  tier_or_level: number | null;
  item_id: string;
  text: string;
  reported_at: string | null;
  reporter_uid: string;
  reporter_name: string;
  reporter_email: string;
  school_id: string | null;
  school_name: string | null;
  attempt_id: string | null;
};

export async function listPlatformAdminQuestionProblemReports(options?: {
  limit?: number;
  source?: 'all' | 'official' | 'practice';
}): Promise<{
  reports: PlatformAdminQuestionProblemReport[];
  official_count: number;
  practice_count: number;
}> {
  const params = new URLSearchParams();
  if (options?.limit != null) params.set('limit', String(options.limit));
  if (options?.source && options.source !== 'all') params.set('source', options.source);
  const qs = params.toString();
  const res = await withAuthRetry((headers) =>
    axios.get(
      `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_QUESTION_PROBLEM_REPORTS}${qs ? `?${qs}` : ''}`,
      { headers }
    )
  );
  const data = res.data ?? {};
  return {
    reports: Array.isArray(data.reports) ? data.reports : [],
    official_count: typeof data.official_count === 'number' ? data.official_count : 0,
    practice_count: typeof data.practice_count === 'number' ? data.practice_count : 0,
  };
}

export type PlatformAdminQuestionProblemReportItem = {
  source: 'official' | 'practice';
  exam_id: string;
  exam_title: string;
  tier_or_level: string;
  item_id: string;
  prompt: string;
  instruction: string | null;
  passage: string | null;
  stimulus?: unknown;
  stimulus_type?: string | null;
  options: Array<{ letter: string; text: string }>;
  correct_index: number | null;
  correct_letter: string | null;
  solution_steps: string[];
  family: string | null;
  subconstruct: string | null;
  mechanic_class_derived: string | null;
  problem_report_count: number;
  problem_report_texts: string[];
};

export async function getPlatformAdminQuestionProblemReportItem(opts: {
  source: 'official' | 'practice';
  exam_id: string;
  tier_or_level: number | string | null;
  item_id: string;
}): Promise<PlatformAdminQuestionProblemReportItem> {
  const params = new URLSearchParams();
  params.set('source', opts.source);
  params.set('exam_id', opts.exam_id);
  params.set('tier_or_level', opts.tier_or_level == null ? '' : String(opts.tier_or_level));
  params.set('item_id', opts.item_id);
  const res = await withAuthRetry((headers) =>
    axios.get(
      `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_QUESTION_PROBLEM_REPORTS}/item?${params.toString()}`,
      { headers }
    )
  );
  return res.data?.item as PlatformAdminQuestionProblemReportItem;
}

export type TestDayQuestionRow = {
  index: number;
  item_id: string;
  family: string | null;
  subconstruct: string | null;
  prompt: string;
  stimulus?: unknown;
  stimulus_type?: string | null;
  options: Array<{ letter: string; text: string }>;
  selected_index: number | null;
  selected_letter: string;
  correct_index: number | null;
  correct_letter: string | null;
  is_correct: boolean | null;
  time_spent_sec: number | null;
};

export type TestDayAttemptBlock = {
  attempt_id: string;
  assessment_id: string;
  proficiency_tier: number | null;
  status: string;
  completed_at: string | null;
  score_pct: number | null;
  score_points: number | null;
  passed: boolean | null;
  questions: TestDayQuestionRow[];
};

export type TestDayPracticeRow = {
  exam_id: string;
  level: string;
  item_id: string;
  correct: boolean | null;
  occurred_at: string | null;
};

export type TestStudentDayQuestionsPayload = {
  email: string;
  uid: string;
  student_name: string;
  date_ist: string;
  attempts: TestDayAttemptBlock[];
  practice: TestDayPracticeRow[];
  generated_at: string;
};

export async function listPlatformAdminTrackedTestEmails(): Promise<string[]> {
  const res = await withAuthRetry((headers) =>
    axios.get(`${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_TEST_RESULTS_TRACKED_EMAILS}`, {
      headers,
    })
  );
  return Array.isArray(res.data?.emails) ? res.data.emails : [];
}

export async function getPlatformAdminTestStudentDayQuestions(opts: {
  email: string;
  date?: string;
}): Promise<TestStudentDayQuestionsPayload> {
  const params = new URLSearchParams();
  params.set('email', opts.email);
  if (opts.date) params.set('date', opts.date);
  const res = await withAuthRetry((headers) =>
    axios.get(
      `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_TEST_RESULTS_DAY_QUESTIONS}?${params.toString()}`,
      { headers }
    )
  );
  const data = res.data ?? {};
  return {
    email: typeof data.email === 'string' ? data.email : opts.email,
    uid: typeof data.uid === 'string' ? data.uid : '',
    student_name: typeof data.student_name === 'string' ? data.student_name : '',
    date_ist: typeof data.date_ist === 'string' ? data.date_ist : opts.date || '',
    attempts: Array.isArray(data.attempts) ? data.attempts : [],
    practice: Array.isArray(data.practice) ? data.practice : [],
    generated_at: typeof data.generated_at === 'string' ? data.generated_at : '',
  };
}
