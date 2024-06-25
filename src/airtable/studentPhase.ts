import axios from 'axios';
import { STUDENTS_DATA_PHASE_1 } from '../constants/constants';

export const getUserData = async (studentId: string) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_GATEWAY_ROUTE}${STUDENTS_DATA_PHASE_1}`, {
            userId: studentId
        });

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
