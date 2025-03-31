import axios from "axios";
import { EXAM_DETAILS_APIS, EXAM_SUBMISSION_TRANSACTION } from "../constants/constants";
import authTokenHandler from "../functions/auth_token/auth_token_handler";

export const runExamSubmissionTransaction = async (student_uid: string, submission_id: string, form_id: string, submission_time: string) => {
    try {
        const authToken = await authTokenHandler.getAuthToken();
        const config = {
            method: 'post',
            url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${EXAM_DETAILS_APIS}${EXAM_SUBMISSION_TRANSACTION}`,
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            data: {
                student_uid,
                submission_id,
                form_id,
                submission_time,
            }
        };
        const response = await axios.request(config);
        return response.data;
    } catch (error) {
        throw new Error(`Error submitting exam. Please contact talentsearch@argus.ai on PRIORITY with your registered email`);
    }
};