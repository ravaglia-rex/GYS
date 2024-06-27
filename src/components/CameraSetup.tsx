import React, { useEffect } from 'react';
import { auth } from '../firebase/firebase.ts';
import { captureFrame, analyzeLighting} from "../functions/frame_handling/captureFrame.ts";
import { FRAME_RATE } from '../constants/constants.ts';
import { useDispatch, useSelector } from 'react-redux';
import { setFrameIntervalId, setVideoStream, cleanupFrameResources } from '../state_data/frameCaptureSlice.ts';
import { cleanupAudioCaptureResources } from '../state_data/audioCaptureSlice.ts';
import { RootState } from '../state_data/reducer.ts';
import { setLoadState } from '../state_data/loadSlice.ts';
import { useToast } from './ui/use-toast';

interface CameraSetupProps {
    hasCameraAccess: boolean;
    isSubmitted: boolean;
    setHasCameraAccess: React.Dispatch<React.SetStateAction<boolean>>;
    haveModelsLoaded: { [key: string]: boolean };
    videoRef: React.RefObject<HTMLVideoElement>;
    entityDetectionWorkerRef: React.RefObject<Worker>;
    poseDetectionWorkerRef: React.RefObject<Worker>;
    faceLandmarksWorkerRef: React.RefObject<Worker>;
}

const CameraSetup: React.FC<CameraSetupProps> = ({hasCameraAccess, isSubmitted, setHasCameraAccess, haveModelsLoaded, videoRef, entityDetectionWorkerRef, poseDetectionWorkerRef, faceLandmarksWorkerRef}) => {
    const user_id = auth.currentUser?.uid || "11111";
    const exam_id = localStorage.getItem('currentFormId') || "<UNKNOWN_FORM_ID>";
  
    const { toast } = useToast();
    const dispatch = useDispatch();
    const videoStream = useSelector((state: RootState) => state.frameCapture.videoStream);

    useEffect(() => {
        const setupCamera = async () => {
        try {
            if (hasCameraAccess && !videoStream && !isSubmitted) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            dispatch(setVideoStream(stream));
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = async () => {
                    await videoRef.current?.play();
                    dispatch(setLoadState(false));
                    const frameRate = FRAME_RATE;
                    const newIntervalId = setInterval(() => {
                        const canvas = document.createElement('canvas');
                        if (entityDetectionWorkerRef.current && poseDetectionWorkerRef.current && faceLandmarksWorkerRef.current && canvas && videoRef.current) {
                            captureFrame(videoRef, canvas, user_id, exam_id, entityDetectionWorkerRef.current, poseDetectionWorkerRef.current, faceLandmarksWorkerRef.current);
                            const lighting_check = analyzeLighting(videoRef, canvas);
                            if (!lighting_check) {
                                toast({
                                variant: 'destructive',
                                title: 'Lighting Error',
                                description: 'Please ensure that you are in a well-lit environment',
                                });
                                dispatch(cleanupFrameResources());
                                dispatch(cleanupAudioCaptureResources());
                                setHasCameraAccess(false);
                            }
                        }
                        }, 1000 / frameRate) as unknown as number;
                        dispatch(setFrameIntervalId(newIntervalId));
                    };
                }
            }
        } catch (error: any) {
                toast({
                variant: 'destructive',
                title: 'Camera Error',
                description: 'An error occurred while accessing the camera. Please check your camera permissions and try again.',
                });
                dispatch(cleanupFrameResources());
                dispatch(cleanupAudioCaptureResources());
                setHasCameraAccess(false);
            }
        };
        setupCamera();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [haveModelsLoaded, dispatch, entityDetectionWorkerRef, poseDetectionWorkerRef, faceLandmarksWorkerRef, exam_id, user_id, videoStream, videoRef, hasCameraAccess, toast, isSubmitted]);


  return (
    <div>
        <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }}></video>
    </div>
  );
};

export default CameraSetup;
