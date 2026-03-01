import axios from "axios";
import { FETCH_SCHOOL_ADMIN_DATA, SCHOOLS_APIS } from "../constants/constants";
import authTokenHandler from "../functions/auth_token/auth_token_handler";

export interface SchoolAdmin {
  email: string;
  schoolId: string;
  role: string;
}

export interface SchoolEmailCheck {
  schoolId: string;
  schoolName: string;
  verified: boolean;
  email: string;
}

export const getSchoolAdmin = async (email: string): Promise<SchoolAdmin | null> => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const encodedEmail = encodeURIComponent(email);
    const config = {
      method: 'get',
      url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}${FETCH_SCHOOL_ADMIN_DATA}/${encodedEmail}`,
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

export const checkSchoolEmail = async (email: string): Promise<SchoolEmailCheck | null> => {
  try {
    const encodedEmail = encodeURIComponent(email);
    const response = await axios.get(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}/checkSchoolEmail?email=${encodedEmail}`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('checkSchoolEmail error:', {
        status: error.response?.status,
        data: error.response?.data,
        email: email,
        url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}/checkSchoolEmail?email=${encodeURIComponent(email)}`
      });
      
      if (error.response?.status === 404) {
        return null;
      }
      
      // For other errors, log and return null so user sees the error message
      if (error.response?.status === 500) {
        console.error('Server error checking school email:', error.response?.data);
      }
    }
    throw new Error(`Error checking school email. Please contact talentsearch@argus.ai`);
  }
};

export const createSchoolAdmin = async (email: string, schoolId: string, password: string) => {
  try {
    const response = await axios.post(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}/createSchoolAdmin`,
      { email, schoolId, password }
    );
    return response.data;
  } catch (error) {
    throw new Error(`Error creating school admin account. Please contact talentsearch@argus.ai`);
  }
};

export const verifySchoolEmail = async (email: string) => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const response = await axios.post(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}/verifySchoolEmail`,
      { email },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(`Error verifying school email. Please contact talentsearch@argus.ai`);
  }
};

export const verifySchoolAdminAndSendPasswordSetup = async (email: string, schoolId: string) => {
  try {
    console.log('Calling verifySchoolAdminAndSendPasswordSetup:', { email, schoolId });
    const response = await axios.post(
      `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${SCHOOLS_APIS}/verifySchoolAdminAndSendPasswordSetup`,
      { email, schoolId }
    );
    console.log('Verification response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Verification error details:', {
      message: error.message,
      response: error.response,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.error || 'Email does not match the selected school. Please contact us at talentsearch@argus.ai';
        throw new Error(errorMsg);
      }
      if (error.response?.status === 404) {
        throw new Error('School not found. Please contact us at talentsearch@argus.ai');
      }
      if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later or contact us at talentsearch@argus.ai');
      }
    }
    throw new Error(`Error verifying school admin: ${error.message || 'Unknown error'}. Please contact talentsearch@argus.ai`);
  }
};