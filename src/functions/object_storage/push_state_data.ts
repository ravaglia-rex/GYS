import axios from 'axios';
import { GEN_PRESIGNED_URLS } from '../../constants/constants';

const getPresignedStateURL = async (userId: string, exam_id: string, datetime: string) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_GATEWAY_ROUTE}${GEN_PRESIGNED_URLS}`, {
            user_id: userId,
            exam_id: exam_id,
            datetime: datetime,
            data_type: 'metadata'
        });
        const presignedUrl = response.data.presignedUrl;
        return presignedUrl;
    } catch (error) {
        console.error('Error fetching presigned URL:', error);
        return null;
    }
};

export const pushStateData = async (userId: string, exam_id: string, datetime: string, stateData: any) => {
    try {
        const presignedUrl = await getPresignedStateURL(userId, exam_id, datetime);
        if (!presignedUrl) {
            throw new Error('Failed to get presigned URL');
        }

        await axios.put(presignedUrl, JSON.stringify(stateData), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error: any) {
        console.error('Error pushing state data:', error);
        throw new Error('Error pushing state data:', error);
    }
};