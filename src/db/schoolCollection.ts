import axios from 'axios';
import {
  CREATE_EXPEDITED_SCHOOL,
  REGISTER_SCHOOL,
  RESUME_SCHOOL_CHECKOUT,
  SCHOOLS_APIS,
  FETCH_SCHOOL_NAMES_AND_IDS,
  FETCH_SCHOOL_NAME,
  RESOLVE_REGISTRATION_SCHOOL,
  RAZORPAY_APIS,
  CREATE_SCHOOL_RAZORPAY_ORDER,
  VERIFY_SCHOOL_RAZORPAY_PAYMENT,
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
  board: string;
  state_board_state: string;
  referral_source: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  contact_emails: string[];
  selected_plan_id: string;
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

function pickCheckoutSecret(data: Record<string, unknown>): string {
  const a = data.checkoutSecret;
  const b = data.checkout_secret;
  if (typeof a === "string" && a.length > 0) return a;
  if (typeof b === "string" && b.length > 0) return b;
  return "";
}

export const resumeSchoolCheckout = async (
  schoolId: string,
  pocEmail: string
): Promise<{checkoutSecret: string}> => {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS ?? "";
  if (!base) {
    throw new Error("REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not configured.");
  }
  try {
    const response = await axios.post(
      `${base}${SCHOOLS_APIS}${RESUME_SCHOOL_CHECKOUT}`,
      {school_id: schoolId, poc_email: pocEmail.trim().toLowerCase()},
      {headers: {"Content-Type": "application/json"}}
    );
    const secret = pickCheckoutSecret(response.data as Record<string, unknown>);
    if (!secret) {
      throw new Error("Server did not return a checkout token.");
    }
    return {checkoutSecret: secret};
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data?.error) {
      throw new Error(String(e.response.data.error));
    }
    throw new Error(
      "Could not resume checkout. Try again or contact schools@globalyoungscholar.com."
    );
  }
};

export type CreateSchoolRazorpayOrderResponse = {
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  plan_id: string;
  test_mode_amounts?: boolean;
  /** True when API uses ₹1/₹2/₹3 micro test amounts (SCHOOL_RAZORPAY_MICRO_TEST). */
  test_micro_amounts?: boolean;
  /** When API sets RAZORPAY_CHECKOUT_CONFIG_ID - pass through to Checkout options. */
  checkout_config_id?: string;
};

export const createSchoolRazorpayOrder = async (
  schoolId: string,
  checkoutSecret: string
): Promise<CreateSchoolRazorpayOrderResponse> => {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS ?? "";
  if (!base) {
    throw new Error("REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not configured.");
  }
  try {
    const response = await axios.post(
      `${base}${RAZORPAY_APIS}${CREATE_SCHOOL_RAZORPAY_ORDER}`,
      {school_id: schoolId, checkout_secret: checkoutSecret}
    );
    return response.data;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data?.message) {
      throw new Error(String(e.response.data.message));
    }
    throw new Error("Could not start payment. Please try again or contact schools@globalyoungscholar.com.");
  }
};

export const verifySchoolRazorpayPayment = async (body: {
  school_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<void> => {
  const base = process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS ?? "";
  if (!base) {
    throw new Error("REACT_APP_GOOGLE_CLOUD_FUNCTIONS is not configured.");
  }
  try {
    await axios.post(`${base}${RAZORPAY_APIS}${VERIFY_SCHOOL_RAZORPAY_PAYMENT}`, body);
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data?.message) {
      throw new Error(String(e.response.data.message));
    }
    throw new Error("Payment verification failed. If you were charged, contact schools@globalyoungscholar.com.");
  }
};

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
    let checkoutSecret = pickCheckoutSecret(raw);
    const schoolId = typeof raw.schoolId === "string" ? raw.schoolId : "";
    const pocEmail =
      typeof raw.pocEmail === "string"
        ? raw.pocEmail
        : typeof raw.poc_email === "string"
          ? raw.poc_email
          : "";
    if (!checkoutSecret && schoolId && pocEmail) {
      try {
        const recovered = await resumeSchoolCheckout(schoolId, pocEmail);
        checkoutSecret = recovered.checkoutSecret;
      } catch {
        // leave empty; caller shows recovery UI
      }
    }
    return {
      success: Boolean(raw.success),
      schoolId,
      schoolName: typeof raw.schoolName === "string" ? raw.schoolName : "",
      pocEmail,
      checkoutSecret,
    };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.data?.error) {
      throw new Error(String(e.response.data.error));
    }
    throw new Error(
      'Could not complete registration. Please try again or contact schools@globalyoungscholar.com.'
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
        throw new Error(`Error creating ${school.school_name}. Please contact talentsearch@argus.ai`);
    }
}

// FETCH ALL SCHOOL NAMES AND IDs (server-cached; no client cache - list excludes list-only schools)
export const fetchSchoolNamesAndIds = async (): Promise<{ id: string; name: string }[]> => {
  try {
    const response = await axios.get(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}${FETCH_SCHOOL_NAMES_AND_IDS}`);
    const data = await response.data;
    return data;
  } catch (e) {
    throw new Error(`Error fetching schools. Please contact talentsearch@argus.ai`);
  }
};

// FETCH SCHOOL NAME
export type ResolveRegistrationSchoolResult = {
  schoolId: string | null;
  schoolName: string | null;
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
    };
  } catch {
    throw new Error('Could not verify school for your email. Please contact talentsearch@argus.ai');
  }
};

export const getSchoolDetails = async (school_id: string) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}${FETCH_SCHOOL_NAME}/${school_id}`);
        const data = await response.data;
        return data;
    } catch (e) {
        throw new Error(`Error fetching school. Please contact talentsearch@argus.ai`);
    }
};