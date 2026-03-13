import axios from 'axios';
import { EXAM_RESPONSES_APIS, FETCH_RESULT_TOTALS, FETCH_PHASE_2_RESULT_TOTALS } from '../constants/constants';
import authTokenHandler from '../functions/auth_token/auth_token_handler';

export const fetchResultTotals = async (userID: string, formID: string) => {
    try {
        const authToken = await authTokenHandler.getAuthToken();
        const config = {
            method: 'post',
            url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${EXAM_RESPONSES_APIS}${FETCH_RESULT_TOTALS}`,
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            data: {
                userID: userID,
                formID: formID
            }
        };
        const response = await axios.request(config);
        if ('error' in response.data) {
            return null;
        }
        return response.data;
    } catch (e) {
        throw new Error('Error fetching result totals');
    }
};

export const fetchPhase2ResultTotals = async (userID: string, formID: string) => {
    try {

        const authToken = await authTokenHandler.getAuthToken();
        const config = {
            method: 'post',
            url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${EXAM_RESPONSES_APIS}${FETCH_PHASE_2_RESULT_TOTALS}`,
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            data: {
                userID: userID,
                formID: formID
            }
        };
        

        const response = await axios.request(config);
        
        if ('error' in response.data) {
            return null;
        }

        return response.data;
    } catch (e) {
        throw new Error('Error fetching Phase 2 result totals');
    }
};