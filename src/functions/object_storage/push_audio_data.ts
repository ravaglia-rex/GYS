import axios from 'axios';
import { GEN_PRESIGNED_URLS } from '../../constants/constants';

const getPresignedAudioURL = async (userId: string, exam_id: string, datetime: string) => {
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_GATEWAY_ROUTE}${GEN_PRESIGNED_URLS}`, {
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