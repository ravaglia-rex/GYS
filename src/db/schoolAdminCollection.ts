import axios from "axios";
import { SCHOOL_ADMIN_APIS, FETCH_SCHOOL_ADMIN_DATA } from "../constants/constants";
import authTokenHandler from "../functions/auth_token/auth_token_handler";

export interface SchoolAdmin {
    email: string;
    schoolId: string;
    role: string;
}

export const getSchoolAdmin = async (email: string): Promise<SchoolAdmin | null> => {
    try {
        const authToken = await authTokenHandler.getAuthToken();
        const encodedEmail = encodeURIComponent(email);
        const config = {
            method: 'get',
            url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOL_ADMIN_APIS}${FETCH_SCHOOL_ADMIN_DATA}/${encodedEmail}`,
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        };
        const response = await axios.request(config);
        return response.data;
    } catch (error) {
        // If no school admin found, return null
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        throw new Error(`Error fetching school admin for email ${email}. Please contact talentsearch@argus.ai`);
    }
};

export const checkIfSchoolAdmin = async (email: string): Promise<boolean> => {
    try {
        const schoolAdmin = await getSchoolAdmin(email);
        return schoolAdmin !== null;
    } catch (error) {
        console.error('Error checking school admin status:', error);
        return false;
    }
};
