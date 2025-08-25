import axios from "axios";
import { STUDENTS_APIS, FETCH_STUDENT_DATA, UPDATE_STUDENT_DATA } from "../constants/constants";
import authTokenHandler from "../functions/auth_token/auth_token_handler";

export const getStudent = async (userId: string) => {
    try {
        const authToken = await authTokenHandler.getAuthToken();
        const encodedUID = encodeURIComponent(userId);
        const config = {
            method: 'get',
            url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${FETCH_STUDENT_DATA}/${encodedUID}`,
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        };
        const response = await axios.request(config);
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching student for user ${userId}. Please contact talentsearch@argus.ai`);
    }
}

export const updateStudent = async (user_id: string, student: {first_name?: string, last_name?: string, parent_name?: string, parent_email?: string, parent_phone?: string, grade?: number}) => {
    try {
        const authToken = await authTokenHandler.getAuthToken();
        const config = {
            method: 'post',
            url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${UPDATE_STUDENT_DATA}`,
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            data: {
                uid: user_id,
                student: student
            }
        };
        await axios.request(config);
        return;
    } catch (error) {
        throw new Error(`Error updating student for user ${user_id}. Please contact talentsearch@argus.ai`);
    }
}