import axios from 'axios';
import { STUDENTS_APIS, SIGN_UP_TRANSACTION } from '../constants/constants';
import authTokenHandler from "../functions/auth_token/auth_token_handler";

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
        const authToken = await authTokenHandler.getAuthToken();
        const config = {
            method: 'post',
            url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${SIGN_UP_TRANSACTION}`,
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            data: {
                student: student,
                email: email,
                examID: examID,
                isQualified: isQualified,
                eligibleDateTime: eligibleDateTime,
            }
        };
        await axios.request(config);
        return { message: `Student ${student.first_name} ${student.last_name} created successfully!` };
    } catch (e) {
        throw new Error(`Error creating ${student.first_name} ${student.last_name}. Please contact talentsearch@argus.ai`);
    }
};