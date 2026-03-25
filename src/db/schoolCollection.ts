import axios from 'axios';
import {
  CREATE_EXPEDITED_SCHOOL,
  SCHOOLS_APIS,
  FETCH_SCHOOL_NAMES_AND_IDS,
  FETCH_SCHOOL_NAME,
  RESOLVE_REGISTRATION_SCHOOL,
} from "../constants/constants";

type expeditedSchool = {
    school_name: string;
    city: string;
    state: string;
}

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

// FETCH ALL SCHOOL NAMES AND IDs (server-cached; no client cache — list excludes list-only schools)
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

/** Matches signup email to a school-provided allowlist (list-only schools). */
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