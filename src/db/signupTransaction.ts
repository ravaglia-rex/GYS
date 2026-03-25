import axios from 'axios';
import { STUDENTS_APIS, SIGN_UP_TRANSACTION } from '../constants/constants';

export type NewStudent = {
    uid: string;
    first_name: string;
    last_name: string;
    email: string;
    school_id: string;
    grade: number;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    phone_number?: string;
    about_me?: string;
    date_of_birth?: string;
};

// No auth token needed — called during signup before the user has a verified token.
export const runSignUpTransaction = async (student: NewStudent) => {
    try {
        const config = {
            method: 'post',
            url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${SIGN_UP_TRANSACTION}`,
            data: { student },
        };
        await axios.request(config);
        return { message: `Student ${student.first_name} ${student.last_name} created successfully!` };
    } catch (e: any) {
        if (axios.isAxiosError(e) && e.response?.status === 409) {
            throw new Error('An account with this information already exists.');
        }
        if (axios.isAxiosError(e) && (e.response?.status === 403 || e.response?.status === 400)) {
            const msg = (e.response?.data as { message?: string })?.message;
            if (typeof msg === 'string' && msg.trim()) {
                throw new Error(msg);
            }
        }
        throw new Error(`Error creating account for ${student.first_name} ${student.last_name}. Please contact talentsearch@argus.ai`);
    }
};
