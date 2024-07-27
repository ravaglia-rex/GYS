import axios from 'axios';
import { EXAM_RESPONSES_APIS, FETCH_RESULT_TOTALS, FETCH_PHASE_1_RESULT_TOTALS } from '../constants/constants';

export const fetchResultTotals = async (userID: string, formID: string) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${EXAM_RESPONSES_APIS}${FETCH_RESULT_TOTALS}`, {
            userID: userID,
            formID: formID
        });
        if ('error' in response.data) {
            return null;
        }
        return response.data;
    } catch (e) {
        throw new Error('Error fetching result totals');
    }
};

export const fetchPhase1ResultTotals = async (userID: string) => {
    try {
        const encodedUserID = encodeURIComponent(userID);
        const response = await axios.get(`${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${EXAM_RESPONSES_APIS}${FETCH_PHASE_1_RESULT_TOTALS}/${encodedUserID}`);
        if ('error' in response.data) {
            return null;
        }
        console.log(response.data);
        return response.data;
    } catch (e) {
        throw new Error('Error fetching result totals');
    }
};