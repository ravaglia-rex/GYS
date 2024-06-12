import axios from 'axios';
import { STUDENTS_DATA_PHASE_1 } from '../constants/constants';

const getUserAnswers = async (studentId: string) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_GATEWAY_ROUTE}${STUDENTS_DATA_PHASE_1}`, {
            userId: studentId
        });
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching student data ${studentId} from database`);
    }
};