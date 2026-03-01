import axios from 'axios';
import { CREATE_EXPEDITED_SCHOOL, SCHOOLS_APIS, FETCH_SCHOOL_NAMES_AND_IDS, FETCH_SCHOOL_NAME } from "../constants/constants";

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

// Add caching
let cachedSchools: { id: string; name: string }[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// FETCH ALL SCHOOL NAMES AND IDs
export const fetchSchoolNamesAndIds = async (): Promise<{ id: string; name: string }[]> => {
  try {
    // Check cache
    const now = Date.now();
    if (cachedSchools && (now - cacheTimestamp) < CACHE_DURATION) {
      return cachedSchools;
    }

    const response = await axios.get(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}${FETCH_SCHOOL_NAMES_AND_IDS}`);
    const data = await response.data;
    
    // Update cache
    cachedSchools = data;
    cacheTimestamp = now;
    
    return data;
  } catch (e) {
    throw new Error(`Error fetching schools. Please contact talentsearch@argus.ai`);
  }
};

// FETCH SCHOOL NAME
export const getSchoolDetails = async (school_id: string) => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}${FETCH_SCHOOL_NAME}/${school_id}`);
        const data = await response.data;
        return data;
    } catch (e) {
        throw new Error(`Error fetching school. Please contact talentsearch@argus.ai`);
    }
};