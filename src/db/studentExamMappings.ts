import axios from "axios";
import { STUDENTS_APIS, FETCH_EXAM_IDS } from "../constants/constants";
import authTokenHandler from "../functions/auth_token/auth_token_handler";

export const getExamIds = async (uid: string) => {
  try {
    const authToken = await authTokenHandler.getAuthToken();
    const encodedUID = encodeURIComponent(uid);
    const config = {
      method: 'get',
      url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${FETCH_EXAM_IDS}/${encodedUID}`,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching exam IDs for user. Please contact talentsearch@argus.ai`);
  }
};