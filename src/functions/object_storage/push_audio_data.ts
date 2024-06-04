import axios from 'axios';
import { API_GATEWAY_ROUTE } from '../../constants/constants';

const getPresignedAudioURL = async (userId: string, exam_id: string, datetime: string) => {
    try {
        const response = await axios.post(API_GATEWAY_ROUTE, {
            user_id: userId,
            exam_id: exam_id,
            datetime: datetime,
            data_type: 'audio'
        });
        const presignedUrl = response.data.presignedUrl;
        return presignedUrl;
    } catch (error) {
        console.error('Error fetching presigned URL:', error);
        return null;
    }
};

export const pushAudioData = async (userId: string, exam_id: string, datetime: string, audioData: ArrayBuffer[]) => {
    try {
        const presignedUrl = await getPresignedAudioURL(userId, exam_id, datetime);
        if (!presignedUrl) {
            console.log('Failed to get a presigned URL');
            return;
        }

        const blob = new Blob(audioData, { type: 'audio/webm' });
        await axios.put(presignedUrl, blob, {
            headers: {
                'Content-Type': 'audio/webm'
            }
        });
    } catch (error) {
        console.error('Error pushing audio data:', error);
    }
};