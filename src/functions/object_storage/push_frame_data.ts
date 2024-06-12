import axios from 'axios';
import { GEN_PRESIGNED_URLS } from '../../constants/constants';

const getPresignedFrameURL = async (userId: string, exam_id: string, datetime: string) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_GATEWAY_ROUTE}${GEN_PRESIGNED_URLS}`, {
            user_id: userId,
            exam_id: exam_id,
            datetime: datetime,
            data_type: 'image'
        });
        const presignedUrl = response.data.presignedUrl;
        return presignedUrl;
    } catch (error) {
        console.error('Error fetching presigned URL:', error);
        return null;
    }
};

export const pushFrameData = async (userId: string, exam_id: string, datetime: string, frameData: ArrayBuffer) => {
    try {
        const presignedUrl = await getPresignedFrameURL(userId, exam_id, datetime);
        if (!presignedUrl) {
            console.log('Failed to get a presigned URL');
            return;
        }

        const blob = new Blob([frameData], { type: 'image/png' });
        await axios.put(presignedUrl, blob, {
            headers: {
                'Content-Type': 'image/png'
            }
        });
    } catch (error) {
        console.error('Error pushing frame data:', error);
    }
};