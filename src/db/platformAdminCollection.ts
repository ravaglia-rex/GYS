import axios from 'axios';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
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
  PLATFORM_ADMIN_NOTIFICATIONS,
  PLATFORM_ADMIN_NOTIFICATIONS_MARK_READ,
  PLATFORM_ADMIN_NOTIFICATIONS_MARK_ALL_READ,
  PLATFORM_ADMIN_MARK_SCHOOL_PAID,
  PLATFORM_ADMIN_UPDATE_SCHOOL_BILLING,
  PLATFORM_ADMIN_DELETE_SCHOOL,
  PLATFORM_ADMIN_DELETE_STUDENT,
  PLATFORM_ADMIN_BILLING_INVOICE_DOWNLOAD_URL,
  PLATFORM_ADMIN_INVITE_SCHOOL_ADMIN,
  PLATFORM_ADMIN_ADD_SCHOOL_ADMIN,
  PLATFORM_ADMIN_REMOVE_SCHOOL_ADMIN,
} from '../constants/constants';

function apiBase(): string {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS;
  if (!base) {
    throw new Error('REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not set.');
  }
  return base;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await authTokenHandler.getAuthToken();
  if (!token) {
    throw new Error('Not authenticated');
  }
  return { Authorization: `Bearer ${token}` };
}

export type PlatformAdminOverviewStats = {
  schools_total: number;
  schools_paid: number;
  schools_pending_payment: number;
  schools_verified: number;
  schools_pending_wire_capture: number;
  students_total: number;
  pending_redemptions: number;
  unread_notifications: number;
  total_revenue_paise: number;
};

export type PlatformAdminNotificationType =
  | 'school_registered'
  | 'school_students_added'
  | 'student_joined';

const HIDDEN_PLATFORM_ADMIN_NOTIFICATION_TYPES = new Set<PlatformAdminNotificationType>([
  'student_joined',
]);

export type PlatformAdminNotification = {
  id: string;
  type: PlatformAdminNotificationType;
  title: string;
  message: string;
  school_id: string | null;
  school_name: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  created_at: string | null;
};

export type PlatformAdminSchoolSummary = {
  id: string;
  school_name: string;
  poc_email: string;
  verified: boolean;
  payment_status: string;
  payment_method: string | null;
  payment_captured: string | null;
  payment_satisfied: boolean;
  selected_plan_id: string | null;
  registered_plan_id: string | null;
  subscription_plan: string | null;
  registered_subscription_plan: string | null;
  plan_price_inr: number | null;
  paid_amount_paise: number | null;
  institutional_tier: string | null;
  institutional_performance_tier: string | null;
  created_at: string | null;
  updated_at: string | null;
  paid_at: string | null;
  pending_wire_capture: boolean;
};

export type PlatformAdminSchoolDetail = PlatformAdminSchoolSummary & {
  contact_emails: string[];
  admin_emails: string[];
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
  student_count: number;
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
};

export type PlatformAdminEmailActivityRow = {
  id: string;
  sent_at: string | null;
  template_id: string;
  label: string;
  subject: string | null;
  recipients: string[];
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
  created_at: string | null;
  is_test?: boolean;
};

export type PlatformAdminStudentStats = {
  students_total: number;
  students_approved: number;
  students_pending: number;
  students_rostered: number;
  students_level_3_plus: number;
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
  const stats = res.data.stats ?? {};
  return {
    ...stats,
    unread_notifications: stats.unread_notifications ?? 0,
  };
}

export async function listPlatformAdminNotifications(limit = 50): Promise<{
  notifications: PlatformAdminNotification[];
  unread_count: number;
}> {
  const headers = await authHeaders();
  const res = await axios.get(`${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_NOTIFICATIONS}`, {
    headers,
    params: { limit },
  });
  const rawList = (res.data.notifications ?? []) as PlatformAdminNotification[];
  const notifications = rawList.filter(
    (n) => !HIDDEN_PLATFORM_ADMIN_NOTIFICATION_TYPES.has(n.type)
  );
  const apiUnread = typeof res.data.unread_count === 'number' ? res.data.unread_count : null;
  const hiddenUnreadInPage = rawList.filter(
    (n) => HIDDEN_PLATFORM_ADMIN_NOTIFICATION_TYPES.has(n.type) && !n.read
  ).length;
  const unread_count =
    apiUnread === null
      ? notifications.filter((n) => !n.read).length
      : Math.max(0, apiUnread - hiddenUnreadInPage);

  return {
    notifications,
    unread_count,
  };
}

export async function markPlatformAdminNotificationsRead(ids: string[]): Promise<number> {
  const headers = await authHeaders();
  const res = await axios.post(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_NOTIFICATIONS_MARK_READ}`,
    { ids },
    { headers }
  );
  return res.data.unread_count ?? 0;
}

export async function markAllPlatformAdminNotificationsRead(): Promise<void> {
  const headers = await authHeaders();
  await axios.post(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_NOTIFICATIONS_MARK_ALL_READ}`,
    {},
    { headers }
  );
}

export async function listPlatformAdminSchools(params?: {
  payment?: 'paid' | 'pending' | 'wire';
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
      admin_emails: Array.isArray(res.data.school?.admin_emails) ? res.data.school.admin_emails : [],
      contact_emails: Array.isArray(res.data.school?.contact_emails) ? res.data.school.contact_emails : [],
    },
    payment_history: res.data.payment_history ?? [],
    analytics: res.data.analytics ?? null,
    poc_accounts: Array.isArray(res.data.poc_accounts)
      ? res.data.poc_accounts.map((row: PlatformAdminPocAccountRow) => ({
          ...row,
          is_admin: Boolean(row?.is_primary || row?.is_admin),
        }))
      : [],
    email_activity: Array.isArray(res.data.email_activity) ? res.data.email_activity : [],
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
  | 'cash'
  | 'already_paid'
  | 'paid_to_education_world'
  | 'other';

export const PLATFORM_ADMIN_PAYMENT_METHOD_LABELS: Record<PlatformAdminMarkSchoolPaidMethod, string> = {
  wire: 'Wire transfer',
  razorpay_link: 'Razorpay link',
  neft_rtgs: 'NEFT / RTGS',
  upi: 'UPI',
  cheque: 'Cheque',
  cash: 'Cash',
  already_paid: 'Paid before platform signup',
  paid_to_education_world: 'Paid to Education World',
  other: 'Other',
};

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
  }
): Promise<{ paymentId: string; invoiceNumber: string; publicReference: string }> {
  const headers = await authHeaders();
  const res = await axios.post(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_SCHOOLS}/${encodeURIComponent(schoolId)}${PLATFORM_ADMIN_MARK_SCHOOL_PAID}`,
    body,
    { headers }
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

export async function addPlatformAdminSchoolAdmin(
  schoolId: string,
  body: { email: string; send_invite?: boolean }
): Promise<{
  email: string;
  already_admin: boolean;
  invited: boolean;
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
    warning: typeof res.data.warning === 'string' ? res.data.warning : undefined,
  };
}

export async function removePlatformAdminSchoolAdmin(
  schoolId: string,
  email: string
): Promise<{ email: string; removed: boolean }> {
  const headers = await authHeaders();
  const res = await axios.post(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_SCHOOLS}/${encodeURIComponent(schoolId)}${PLATFORM_ADMIN_REMOVE_SCHOOL_ADMIN}`,
    { email },
    { headers }
  );
  return {
    email: res.data.email ?? email,
    removed: res.data.removed !== false,
  };
}

export type PlatformAdminDeleteSchoolResult = {
  schoolId: string;
  studentsUnlinked: number;
  adminAuthDeleted: number;
  adminAuthSkipped: number;
  notificationsDeleted: number;
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
    notificationsDeleted: res.data.notificationsDeleted ?? 0,
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

export async function getPlatformAdminStudent(studentUid: string): Promise<PlatformAdminStudentRow> {
  const headers = await authHeaders();
  const res = await axios.get(
    `${apiBase()}${PLATFORM_ADMIN_APIS}${PLATFORM_ADMIN_STUDENTS}/${encodeURIComponent(studentUid)}`,
    { headers }
  );
  if (!res.data?.student) {
    throw new Error('Student not found');
  }
  return res.data.student as PlatformAdminStudentRow;
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
  /** Required: `'all'` or one/more school document IDs. Omitting returns no students. */
  school_ids?: 'all' | string[];
  limit?: number;
}): Promise<PlatformAdminStudentRow[]> {
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
      school_ids: schoolIdsParam,
    },
  });
  return res.data.students ?? [];
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

export function paymentStatusChipColor(status: string): 'success' | 'warning' | 'error' | 'default' {
  const s = status.toLowerCase();
  if (['captured', 'paid', 'completed'].includes(s)) return 'success';
  if (['pending', 'pending_contact', 'pending_webhook'].includes(s)) return 'warning';
  if (s === 'failed') return 'error';
  return 'default';
}
