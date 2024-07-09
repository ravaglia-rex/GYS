import axios from "axios";
import { EXAM_DETAILS_APIS, FETCH_EXAM_DETAILS } from "../constants/constants";

export const getExamDetails = async (formLinks: string[]) => {
  try {
      const examDetailsPromises = formLinks.map(async (formLink) => {
      try {
        const encodedFormLink = encodeURIComponent(formLink);
        const response = await axios.get(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${EXAM_DETAILS_APIS}${FETCH_EXAM_DETAILS}/${encodedFormLink}`);
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
