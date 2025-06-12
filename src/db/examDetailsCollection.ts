import axios from "axios";
import { EXAM_DETAILS_APIS, FETCH_EXAM_DETAILS } from "../constants/constants";
import authTokenHandler from "../functions/auth_token/auth_token_handler";

export const getExamDetails = async (formLinks: string[]) => {
  try {
      const examDetailsPromises = formLinks.map(async (formLink) => {
      try {
        const authToken = await authTokenHandler.getAuthToken();
        const encodedFormLink = encodeURIComponent(formLink);
        const config = {
          method: 'get',
          url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${EXAM_DETAILS_APIS}${FETCH_EXAM_DETAILS}/${encodedFormLink}`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        };
        const response = await axios.request(config);
        return response.data;
      } catch (error) {
        return null;
      }
    });

    const examDetails = await Promise.all(examDetailsPromises);
    const filteredExamDetails = examDetails.filter((details) => details !== null);
    return filteredExamDetails;
  } catch (error) {
    throw new Error(`Error fetching exam details. Please contact talentsearch@argus.ai`);
  }
};
