import axios from "axios";
import { EXAM_DETAILS_APIS, EXAM_SUBMISSION_TRANSACTION } from "../constants/constants";

export const runExamSubmissionTransaction = async (student_uid: string, submission_id: string, form_id: string, submission_time: string) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${EXAM_DETAILS_APIS}${EXAM_SUBMISSION_TRANSACTION}`, {
            student_uid,
            submission_id,
            form_id,
            submission_time,
        });
        return response.data;
    } catch (error) {
        throw new Error(`Error submitting exam. Please contact talentsearch@argus.ai on PRIORITY with your registered email`);
    }
};