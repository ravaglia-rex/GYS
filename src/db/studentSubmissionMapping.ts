import {
    collection,
    addDoc,
} from "firebase/firestore";
import db from "./db";

// CREATE SUBMISSION RECORD
type SubmissionRecord = {
    student_uid: string;
    submission_id: string;
    form_id: string;
    submission_time: string;
};

export const createSubmissionRecord = async (submission_record: SubmissionRecord) => {
    try {
        const payment_obj = await addDoc(collection(db, "student_submission_mappings"), submission_record);
        return payment_obj.id;
    } catch (e) {
        throw new Error(`Error recording submission details. Please contact administrator!`);
    }
};