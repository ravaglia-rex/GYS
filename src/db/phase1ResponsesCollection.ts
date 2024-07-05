import axios from 'axios';
import { PHASE_1_QUERIES_APIS, CHECK_PHASE_1_ELIBIGILITY } from '../constants/constants';

type UserData = {
    eligibleDateTime?: string;
    message?: string;
};

// FETCH RESULT BASED ON UID
export const getUserData = async (uid: string): Promise<UserData> => {
    try {
        const encodedUID = encodeURIComponent(uid);
        const response = await axios.get(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${PHASE_1_QUERIES_APIS}${CHECK_PHASE_1_ELIBIGILITY}/${encodedUID}`);
        const data = response.data;
        return data;
    } catch (error) {
        throw new Error(`Error fetching result for UID ${uid}. Please contact talentsearch@argus.ai`);
    }
};