import axios from 'axios';
import { EXAM_RESPONSES_APIS, FETCH_RESULT_TOTALS } from '../constants/constants';

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