import axios from 'axios';
import { PREPARE_SIGN_UP_TRANSACTION, STUDENTS_APIS, SIGN_UP_TRANSACTION } from '../constants/constants';

export type NewStudent = {
    uid?: string;
    first_name: string;
    last_name: string;
    email: string;
    school_id: string;
    grade: number;
    /** Optional class section (e.g. A, B). */
    section?: string;
    parent_name: string;
    parent_email: string;
    parent_phone: string;
    phone_number?: string;
    about_me?: string;
    date_of_birth?: string;
    membership_level?: number;
    home_language?: string;
    aspiration?: string;
    heard_from?: string;
    city_state?: string;
    /** When school_id is not-listed: name the student entered at signup. */
    signup_school_name?: string;
    /** From verifyStudentRegistrationPayment when membership_level ≥ 1 */
    razorpay_payment_id?: string;
};

// No auth token needed - called during signup before the user has a verified token.
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
        if (axios.isAxiosError(e) && (e.response?.status === 409 || e.response?.status === 403 || e.response?.status === 400)) {
            const msg = (e.response?.data as { message?: string })?.message;
            if (typeof msg === 'string' && msg.trim()) {
                throw new Error(msg);
            }
            if (e.response?.status === 409) {
                throw new Error('An account with this information already exists.');
            }
        }
        throw new Error(`Error creating account for ${student.first_name} ${student.last_name}. Please contact globalyoungscholar@argus.ai`);
    }
};

export const prepareSignUpTransaction = async (student: NewStudent): Promise<{uid: string}> => {
    try {
        const config = {
            method: 'post',
            url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${PREPARE_SIGN_UP_TRANSACTION}`,
            data: { student },
        };
        const response = await axios.request(config);
        const uid = (response.data as {uid?: unknown})?.uid;
        if (typeof uid !== 'string' || !uid.trim()) {
            throw new Error('Student signup could not be prepared.');
        }
        return { uid };
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
        throw new Error(`Error preparing account for ${student.first_name} ${student.last_name}. Please contact globalyoungscholar@argus.ai`);
    }
};
