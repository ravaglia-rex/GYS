import axios from 'axios';
import { FRAME_API_GATEWAY_ROUTE } from '../../constants/constants';

const getPresignedURL = async (userId: string, exam_id: string, datetime: string) => {
    try {
        const response = await axios.post(FRAME_API_GATEWAY_ROUTE, {
            user_id: userId,
            exam_id: exam_id,
            datetime: datetime
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
        const presignedUrl = await getPresignedURL(userId, exam_id, datetime);
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
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.src = url;
        document.body.appendChild(img);
    } catch (error) {
        console.error('Error pushing frame data:', error);
    }
};