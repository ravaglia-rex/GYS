import axios from "axios";
import { PHASE_1_QUERIES_APIS, CHECK_EXAM_ID_USED } from "../constants/constants";
import authTokenHandler from "../functions/auth_token/auth_token_handler";

export const checkExamIDExists = async (examID: string): Promise<boolean> => {
    try {
        const authToken = await authTokenHandler.getAuthToken();
        const encodedExamID = encodeURIComponent(examID);
        const config = {
            method: 'get',
            url: `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${PHASE_1_QUERIES_APIS}${CHECK_EXAM_ID_USED}/${encodedExamID}`,
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        };
        const response = await axios.request(config);
        const data = response.data;
        return data.exists;
    } catch (error) {
        return false;
    }
};