import axios from "axios";
import {
  FETCH_SCHOOL_ADMIN_DATA,
  FETCH_SCHOOL_DASHBOARD,
  SCHOOL_ADMINS_APIS,
  SCHOOLS_APIS,
} from "../constants/constants";
import authTokenHandler from "../functions/auth_token/auth_token_handler";

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
}

export interface AssessmentProgress {
  proficiency_tier: number;
  status: "locked" | "available" | "tier_advanced";
  best_score: number | null;
  attempts_count: number;
}

export interface StudentRow {
  uid: string;
  first_name: string;
  last_name: string;
  grade: number;
  membership_level: number;
  approval_status: string;
  achievement_tier: string | null;
  assessment_progress: Record<string, AssessmentProgress>;
  created_at: any;
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
    throw new Error(`Error fetching school admin for email ${email}. Please contact talentsearch@argus.ai`);
  }
};

export const getSchoolDashboard = async (schoolId: string): Promise<SchoolDashboardResponse> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const encodedSchoolId = encodeURIComponent(String(schoolId ?? "").trim());
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMINS_APIS}${FETCH_SCHOOL_DASHBOARD}/${encodedSchoolId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  } catch (error) {
    throw new Error("Error fetching school dashboard. Please contact talentsearch@argus.ai");
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
    throw new Error("Error checking school email. Please contact talentsearch@argus.ai");
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

// Alias kept for backward compatibility — delegates to verifySchoolAdminAndSendPasswordSetup
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
        throw new Error("School not found. Please contact us at talentsearch@argus.ai");
      }
    }
    throw new Error(`Error verifying school admin: ${error.message ?? "Unknown error"}. Please contact talentsearch@argus.ai`);
  }
};
