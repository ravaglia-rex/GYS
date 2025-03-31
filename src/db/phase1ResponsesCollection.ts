import axios from 'axios';
import { PHASE_1_QUERIES_APIS, CHECK_PHASE_1_ELIBIGILITY } from '../constants/constants';
import authTokenHandler from '../functions/auth_token/auth_token_handler';

type UserData = {
    eligibleDateTime?: string;
    message?: string;
};

// FETCH RESULT BASED ON UID
export const getUserData = async (uid: string): Promise<UserData> => {
    try {
        const authToken = await authTokenHandler.getAuthToken();
        const encodedUID = encodeURIComponent(uid);

        const config = {
            method: 'get',
            url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${PHASE_1_QUERIES_APIS}${CHECK_PHASE_1_ELIBIGILITY}/${encodedUID}`,
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        };
        const response = await axios.request(config);
        const data = response.data;
        return data;
    } catch (error) {
        throw new Error(`Error fetching result for UID ${uid}. Please contact talentsearch@argus.ai`);
    }
};