import axios from 'axios';
import {
  AMEND_SCHOOL_REGISTRATION,
  CREATE_EXPEDITED_SCHOOL,
  LOOKUP_SCHOOL_REGISTRATION_PAYMENT,
  REGISTER_SCHOOL,
  RESUME_SCHOOL_CHECKOUT,
  SCHOOLS_APIS,
  FETCH_SCHOOL_NAME,
  RESOLVE_REGISTRATION_SCHOOL,
  RAZORPAY_APIS,
  CREATE_SCHOOL_RAZORPAY_ORDER,
  VERIFY_SCHOOL_RAZORPAY_PAYMENT,
  MARK_SCHOOL_WIRE_TRANSFER_ATTEMPT,
} from "../constants/constants";

type expeditedSchool = {
    school_name: string;
    city: string;
    state: string;
}

export type RegisterSchoolPayload = {
  school_name: string;
  confirm_school_name: string;
  abbreviations: string[];
  udise_code: string;
  /** One or more curriculum options from the registration BOARDS list. */
  boards: string[];
  state_board_state: string;
  city: string;
  state: string;
  referral_source: string;
  registrant_first_name: string;
  registrant_last_name: string;
  registrant_designation: string;
  contact_emails: string[];
  /** India mobile (E.164, e.g. +919876543210) for the registrant / POC. */
  poc_phone: string;
  selected_plan_id: string;
  gst_registration_status: 'yes' | 'no' | 'not_sure';
  gstin: string;
  /** School Terms + Data Processing Terms acceptance (pre-checked in UI; required on submit). */
  accept_school_terms: boolean;
  /** Effective date / version string of the accepted school legal docs. */
  school_terms_version: string;
  commit_to_pay: boolean;
};

export type RegisterSchoolResponse = {
  success: boolean;
  schoolId: string;
  schoolName: string;
  pocEmail: string;
  /** Single-use style secret for POST /razorpay/createSchoolOrder (not shown publicly after session). */
  checkoutSecret: string;
};

export type AmendSchoolRegistrationPayload = RegisterSchoolPayload & {
  school_id: string;
  checkout_secret: string;
};

function pickCheckoutSecret(data: Record<string, unknown>): string {
  const a = data.checkoutSecret;
  const b = data.checkout_secret;
  if (typeof a === "string" && a.length > 0) return a;
  if (typeof b === "string" && b.length > 0) return b;
  return "";
}

export type SchoolRegistrationPaymentLookupResponse = {
  schoolId: string;
  schoolName: string;
  city: string;
  state: string;
  pocEmail: string;
  planId: string;
  planName: string;
  planPriceInr: number;
  registrationEmail: string;
};

export const lookupSchoolRegistrationPayment = async (
  registrationEmail: string
): Promise<SchoolRegistrationPaymentLookupResponse> => {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS ?? "";
  if (!base) {
    throw new Error("REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not configured.");
  }
  try {
    const response = await axios.post(
      `${base}${SCHOOLS_APIS}${LOOKUP_SCHOOL_REGISTRATION_PAYMENT}`,
      {registration_email: registrationEmail.trim().toLowerCase()},
      {headers: {"Content-Type": "application/json"}}
    );
    const data = response.data as Record<string, unknown>;
    const schoolId = typeof data.schoolId === "string" ? data.schoolId : "";
    if (!schoolId) {
      throw new Error("Server did not return a school id.");
    }
    return {
      schoolId,
      schoolName: typeof data.schoolName === "string" ? data.schoolName : "Your school",
      city: typeof data.city === "string" ? data.city : "",
      state: typeof data.state === "string" ? data.state : "",
      pocEmail: typeof data.pocEmail === "string" ? data.pocEmail : registrationEmail.trim().toLowerCase(),
      planId: typeof data.planId === "string" ? data.planId : "",
      planName: typeof data.planName === "string" ? data.planName : "Institutional plan",
      planPriceInr: typeof data.planPriceInr === "number" ? data.planPriceInr : 0,
      registrationEmail:
        typeof data.registrationEmail === "string" ?
          data.registrationEmail :
          registrationEmail.trim().toLowerCase(),
    };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data?.error) {
      throw new Error(String(e.response.data.error));
    }
    throw new Error(
      "Could not find your registration. Try again or contact globalyoungscholar@argus.ai."
    );
  }
};

export type ResumeSchoolCheckoutResponse = {
  checkoutSecret: string;
  schoolId: string;
  schoolName: string;
  pocEmail: string;
  planId: string;
  planName: string;
  planPriceInr: number;
};

export const resumeSchoolCheckout = async (
  registrationEmail: string,
  schoolId?: string
): Promise<ResumeSchoolCheckoutResponse> => {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS ?? "";
  if (!base) {
    throw new Error("REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not configured.");
  }
  try {
    const body: {registration_email: string; school_id?: string} = {
      registration_email: registrationEmail.trim().toLowerCase(),
    };
    if (schoolId?.trim()) {
      body.school_id = schoolId.trim();
    }
    const response = await axios.post(
      `${base}${SCHOOLS_APIS}${RESUME_SCHOOL_CHECKOUT}`,
      body,
      {headers: {"Content-Type": "application/json"}}
    );
    const data = response.data as Record<string, unknown>;
    const secret = pickCheckoutSecret(data);
    if (!secret) {
      throw new Error("Server did not return a checkout token.");
    }
    const resolvedSchoolId = typeof data.schoolId === "string" ? data.schoolId : typeof data.school_id === "string" ? data.school_id : schoolId ?? "";
    if (!resolvedSchoolId) {
      throw new Error("Server did not return a school id.");
    }
    return {
      checkoutSecret: secret,
      schoolId: resolvedSchoolId,
      schoolName: typeof data.schoolName === "string" ? data.schoolName : typeof data.school_name === "string" ? data.school_name : "Your school",
      pocEmail: typeof data.pocEmail === "string" ? data.pocEmail : registrationEmail.trim().toLowerCase(),
      planId: typeof data.planId === "string" ? data.planId : typeof data.plan_id === "string" ? data.plan_id : "",
      planName: typeof data.planName === "string" ? data.planName : typeof data.plan_name === "string" ? data.plan_name : "Institutional plan",
      planPriceInr: typeof data.planPriceInr === "number" ? data.planPriceInr : typeof data.plan_price_inr === "number" ? data.plan_price_inr : 0,
    };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data?.error) {
      throw new Error(String(e.response.data.error));
    }
    throw new Error(
      "Could not resume checkout. Try again or contact globalyoungscholar@argus.ai."
    );
  }
};

export type CreateSchoolRazorpayOrderResponse = {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  /** Razorpay Import Flow - pass to Standard Checkout options. */
  customer_id?: string;
  /** RBI Import Flow payer details; passed through to Checkout so Razorpay can prefill its compliance step. */
  customer_details?: Record<string, unknown>;
  plan_id: string;
  /** When API sets RAZORPAY_CHECKOUT_CONFIG_ID - pass through to Checkout options. */
  checkout_config_id?: string;
};

export type CreateSchoolRazorpayOrderParams = {
  schoolId: string;
  checkoutSecret: string;
  /** India mobile - Import Flow customer + order customer_details. */
  poc_phone: string;
};

export const createSchoolRazorpayOrder = async (
  params: CreateSchoolRazorpayOrderParams
): Promise<CreateSchoolRazorpayOrderResponse> => {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS ?? "";
  if (!base) {
    throw new Error("REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not configured.");
  }
  try {
    const response = await axios.post(`${base}${RAZORPAY_APIS}${CREATE_SCHOOL_RAZORPAY_ORDER}`, {
      school_id: params.schoolId,
      checkout_secret: params.checkoutSecret,
      poc_phone: params.poc_phone.trim(),
    });
    return response.data;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data) {
      const d = e.response.data as { message?: string; error?: string };
      const bits = [d.message, d.error].filter(
        (x): x is string => typeof x === "string" && x.trim().length > 0
      );
      if (bits.length > 0) {
        throw new Error(bits.join(" - "));
      }
    }
    throw new Error("Could not start payment. Please try again or contact globalyoungscholar@argus.ai.");
  }
};

export const verifySchoolRazorpayPayment = async (body: {
  school_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ payment_status?: 'captured' | 'pending_webhook' }> => {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS ?? "";
  if (!base) {
    throw new Error("REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not configured.");
  }
  try {
    const response = await axios.post(`${base}${RAZORPAY_APIS}${VERIFY_SCHOOL_RAZORPAY_PAYMENT}`, body);
    return response.data;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data?.message) {
      throw new Error(String(e.response.data.message));
    }
    throw new Error("Payment verification failed. If you were charged, contact globalyoungscholar@argus.ai.");
  }
};

export type SchoolManualPaymentMethod = 'wire' | 'already_paid';

export type MarkSchoolManualPaymentAttemptParams = {
  schoolId: string;
  checkoutSecret: string;
  poc_phone?: string;
  missing_bank_name?: string;
  payment_method?: SchoolManualPaymentMethod;
  source?: 'wire' | 'razorpay_missing_bank' | 'already_paid';
  force_email?: boolean;
};

export type MarkSchoolManualPaymentAttemptResponse = {
  success: boolean;
  payment_id: string;
  order_id: string;
  amount: number;
  currency: string;
  plan_id: string;
  payment_method?: SchoolManualPaymentMethod;
  invoice_number?: string;
  details_email_sent?: boolean;
  details_email_already_sent?: boolean;
};

export const markSchoolManualPaymentAttempt = async (
  params: MarkSchoolManualPaymentAttemptParams
): Promise<MarkSchoolManualPaymentAttemptResponse> => {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS ?? "";
  if (!base) {
    throw new Error("REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not configured.");
  }
  try {
    const response = await axios.post(`${base}${RAZORPAY_APIS}${MARK_SCHOOL_WIRE_TRANSFER_ATTEMPT}`, {
      school_id: params.schoolId,
      checkout_secret: params.checkoutSecret,
      ...(params.poc_phone?.trim() ? { poc_phone: params.poc_phone.trim() } : {}),
      ...(params.missing_bank_name?.trim() ? { missing_bank_name: params.missing_bank_name.trim() } : {}),
      ...(params.payment_method ? { payment_method: params.payment_method } : {}),
      ...(params.source ? { source: params.source } : {}),
      ...(params.force_email ? { force_email: true } : {}),
    });
    return response.data;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data) {
      const d = e.response.data as { message?: string; error?: string };
      const bits = [d.message, d.error].filter(
        (x): x is string => typeof x === "string" && x.trim().length > 0
      );
      if (bits.length > 0) {
        throw new Error(bits.join(" - "));
      }
    }
    throw new Error("Could not record payment attempt. Please contact globalyoungscholar@argus.ai.");
  }
};

function parseRegisterSchoolResponse(raw: Record<string, unknown>): RegisterSchoolResponse {
  let checkoutSecret = pickCheckoutSecret(raw);
  const schoolId = typeof raw.schoolId === "string" ? raw.schoolId : "";
  const pocEmail =
    typeof raw.pocEmail === "string"
      ? raw.pocEmail
      : typeof raw.poc_email === "string"
        ? raw.poc_email
        : "";
  return {
    success: Boolean(raw.success),
    schoolId,
    schoolName: typeof raw.schoolName === "string" ? raw.schoolName : "",
    pocEmail,
    checkoutSecret,
  };
}

export const registerSchool = async (
  payload: RegisterSchoolPayload
): Promise<RegisterSchoolResponse> => {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}${REGISTER_SCHOOL}`,
      payload,
      {headers: {"Content-Type": "application/json"}}
    );
    const raw = response.data as Record<string, unknown>;
    let result = parseRegisterSchoolResponse(raw);
    if (!result.checkoutSecret && result.schoolId && result.pocEmail) {
      try {
        const recovered = await resumeSchoolCheckout(result.pocEmail, result.schoolId);
        result = {...result, checkoutSecret: recovered.checkoutSecret};
      } catch {
        // leave empty; caller shows recovery UI
      }
    }
    return result;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data) {
      const d = e.response.data as {message?: string; error?: string};
      const bits = [d.message, d.error].filter(
        (x): x is string => typeof x === "string" && x.trim().length > 0
      );
      if (bits.length > 0) {
        throw new Error(bits.join(" - "));
      }
    }
    throw new Error(
      'Could not complete registration. Please try again or contact globalyoungscholar@argus.ai.'
    );
  }
};

export const amendSchoolRegistration = async (
  payload: AmendSchoolRegistrationPayload
): Promise<RegisterSchoolResponse> => {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}${AMEND_SCHOOL_REGISTRATION}`,
      payload,
      {headers: {"Content-Type": "application/json"}}
    );
    const raw = response.data as Record<string, unknown>;
    return parseRegisterSchoolResponse(raw);
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data) {
      const d = e.response.data as {message?: string; error?: string};
      const bits = [d.message, d.error].filter(
        (x): x is string => typeof x === "string" && x.trim().length > 0
      );
      if (bits.length > 0) {
        throw new Error(bits.join(" - "));
      }
    }
    throw new Error(
      "Could not update registration. Please try again or contact globalyoungscholar@argus.ai."
    );
  }
};

export const createExpeditedSchool = async (school: expeditedSchool) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}${CREATE_EXPEDITED_SCHOOL}`, {
            school_name: school.school_name,
            city: school.city,
            state: school.state
        });
        const data = response.data;
        return data.id;
    } catch (e) {
        throw new Error(`Error creating ${school.school_name}. Please contact globalyoungscholar@argus.ai`);
    }
}

export type ResolveRegistrationSchoolResult = {
  schoolId: string | null;
  schoolName: string | null;
  schoolPaymentComplete?: boolean;
  schoolPlanId?: string | null;
  schoolCoveredMembershipLevel?: number;
  complimentaryCoveredMembershipLevel?: number;
  coveredMembershipLevel?: number;
};

/** Matches signup email to this school’s `student_registration_emails` (and legacy allowlist). */
export const resolveRegistrationSchool = async (
  email: string
): Promise<ResolveRegistrationSchoolResult> => {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { schoolId: null, schoolName: null };
  }
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}${RESOLVE_REGISTRATION_SCHOOL}`,
      { email: normalized }
    );
    return {
      schoolId: response.data?.schoolId ?? null,
      schoolName: response.data?.schoolName ?? null,
      schoolPaymentComplete: response.data?.schoolPaymentComplete === true,
      schoolPlanId: response.data?.schoolPlanId ?? null,
      schoolCoveredMembershipLevel:
        typeof response.data?.schoolCoveredMembershipLevel === 'number'
          ? response.data.schoolCoveredMembershipLevel
          : 0,
      complimentaryCoveredMembershipLevel:
        typeof response.data?.complimentaryCoveredMembershipLevel === 'number'
          ? response.data.complimentaryCoveredMembershipLevel
          : 0,
      coveredMembershipLevel:
        typeof response.data?.coveredMembershipLevel === 'number'
          ? response.data.coveredMembershipLevel
          : 0,
    };
  } catch {
    throw new Error('Could not verify school for your email. Please contact globalyoungscholar@argus.ai');
  }
};

export const getSchoolDetails = async (school_id: string) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}${FETCH_SCHOOL_NAME}/${school_id}`);
        const data = await response.data;
        return data;
    } catch (e) {
        throw new Error(`Error fetching school. Please contact globalyoungscholar@argus.ai`);
    }
};