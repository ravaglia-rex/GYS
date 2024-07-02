import axios from 'axios';
import { STUDENTS_APIS, SIGN_UP_TRANSACTION } from '../constants/constants';

type Student = {
    uid: string;
    first_name: string;
    last_name: string;
    school_id: string;
    grade: number;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
};

export const runSignUpTransaction = async (student: Student, email: string, examID: string, isQualified: boolean | null, eligibleDateTime: string) => {
    try {
        await axios.post(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${SIGN_UP_TRANSACTION}`, {
            student: student,
            email: email,
            examID: examID,
            isQualified: isQualified,
            eligibleDateTime: eligibleDateTime,
        });
        return { message: `Student ${student.first_name} ${student.last_name} created successfully!` };
    } catch (e) {
        throw new Error(`Error creating ${student.first_name} ${student.last_name}. Please contact talentsearch@argus.ai`);
    }
};