import axios from 'axios';
import { API_GATEWAY_ROUTE } from '../../constants/constants';

const getPresignedStateURL = async (userId: string, exam_id: string, datetime: string) => {
    try {
        const response = await axios.post(API_GATEWAY_ROUTE, {
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
            console.log('Failed to get a presigned URL');
            return;
        }

        await axios.put(presignedUrl, JSON.stringify(stateData), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error pushing audio data:', error);
    }
};