import axios from 'axios';
import { SCHOOLS_DATA } from '../constants/constants';

export const fetchSchools = async () => {
    try {
        const response = await axios.get(`${process.env.REACT_APP_API_GATEWAY_ROUTE}${SCHOOLS_DATA}`);

        if (response.status === 200) {
            return {
                success: true,
                data: response.data
            };
        } else {
            return {
                success: false,
                error: `Received a non-successful status code: ${response.status}`
            };
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Unknown error occurred'
        };
    }
};