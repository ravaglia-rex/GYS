import axios from "axios";
import { PHASE_1_QUERIES_APIS, CHECK_EXAM_ID_USED } from "../constants/constants";

export const checkExamIDExists = async (examID: string): Promise<boolean> => {
    try {
        const encodedExamID = encodeURIComponent(examID);
        const response = await axios.get(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${PHASE_1_QUERIES_APIS}${CHECK_EXAM_ID_USED}/${encodedExamID}`);
        const data = response.data;
        return data.exists;
    } catch (error) {
        console.log(error);
        return false;
    }
};