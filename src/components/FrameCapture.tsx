import React, { useRef, useEffect } from 'react';
import { captureFrame, analyzeLighting, triggerMetadataUpdate } from "../functions/frame_handling/captureFrame.ts";
import { auth } from '../firebase/firebase.ts';
import { getSchoolId } from '../db/studentCollection';
import { getExamId } from '../db/examMappingCollection';
import { setExamID } from '../state_data/examDetailsSlice';
import { FRAME_RATE } from '../constants/constants.ts';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setEntityDetection } from '../state_data/entityDetectionSlice.ts';
import { setPoseDetection } from '../state_data/poseDetectionSlice.ts';
import { setFaceLandmarks } from '../state_data/faceLandmarksSlice.ts';
import { setEntityDetectionWorker, setPoseDetectionWorker, setFaceLandmarkDetectionWorker, setFrameIntervalId, setVideoStream, cleanupInterval, cleanupFrameResources } from '../state_data/frameCaptureSlice.ts';
import { cleanupAudioCaptureResources } from '../state_data/audioCaptureSlice.ts';
import { RootState } from '../state_data/reducer.ts';
import { setLoadState } from '../state_data/loadSlice.ts';
import { useToast } from './ui/use-toast';
import { Progress } from './ui/progress';

const FrameCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameIntervalId = useSelector((state: RootState) => state.frameCapture.frameIntervalId);
  const entityDetectiorRef = useRef<Worker | null>(null);
  const poseDetectionRef = useRef<Worker | null>(null);
  const faceLandmarksRef = useRef<Worker | null>(null);
  const modelLoaded = useRef<{ [key: string]: boolean }>({});
  const { toast } = useToast();
  const dispatch = useDispatch();
  const loading = useSelector((state: RootState) => state.load.loading);
  const navigate = useNavigate();
  const videoStream = useSelector((state: RootState) => state.frameCapture.videoStream);
  const exam_id = useSelector((state: RootState) => state.examDetails.examId);
  const user_id = auth.currentUser?.uid || "11111";

  const entityDetectionState = useRef<Array<any>>([]);
  const faceLandmarksState = useRef<Array<any>>([]);
  const poseDetectionState = useRef<Array<any>>([]);
  const internetSpeedStateSelector = useSelector((state: RootState) => state.internetSpeed);
  const tabSwitchingStateSelector = useSelector((state: RootState) => state.tabSwitching);
  const internetSpeedState = useRef<any>(null);
  const tabSwitchingState = useRef<any>(null);

  useEffect(() => {
    internetSpeedState.current = internetSpeedStateSelector;
    tabSwitchingState.current = tabSwitchingStateSelector;
}, [internetSpeedStateSelector, tabSwitchingStateSelector]);

  useEffect(() => {
    const fetchFormLink = async () => {
      if (!user_id) return;

      try {
        // Fetch school ID based on user ID
        const schoolId = await getSchoolId(user_id);

        // Fetch form link based on school ID
        const exam_id = await getExamId(schoolId) as string;
        dispatch(setExamID({ examId: exam_id }));
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Form Embedding Error',
          description: error.message,
        });
        dispatch(setExamID({ examId: "mOGkN8" }));
      }
    };

    fetchFormLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user_id]);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    return () => {
      if (frameIntervalId !== null) dispatch(cleanupInterval());
    };
  }, [dispatch, frameIntervalId]);

  useEffect(() => {
    if(exam_id === "") return;

    const setupWorkers = () => {
      const worker1 = new Worker(new URL('../frame_flagging_modules/entityDetectionWorker.ts', import.meta.url), { type: 'module' });
      const worker2 = new Worker(new URL('../frame_flagging_modules/poseDetectionWorker.ts', import.meta.url), { type: 'module' });
      const worker3 = new Worker(new URL('../frame_flagging_modules/faceLandmarksWorker.ts', import.meta.url), { type: 'module' });

      entityDetectiorRef.current = worker1;
      poseDetectionRef.current = worker2;
      faceLandmarksRef.current = worker3;
      dispatch(setEntityDetectionWorker(worker1));
      dispatch(setPoseDetectionWorker(worker2));
      dispatch(setFaceLandmarkDetectionWorker(worker3));

      const checkModelsLoaded = () => {
        if (modelLoaded.current['entityDetection'] && modelLoaded.current['poseDetection'] && modelLoaded.current['faceLandmarks']) {
          setupVideoAndWorker();
        } else {
          dispatch(setLoadState(true));
        }
      }

      worker1.addEventListener('message', (event: MessageEvent) => {
        if (event.data.type === 'modelLoaded') {
          modelLoaded.current['entityDetection'] = true;
          checkModelsLoaded();
        } else if (event.data.type === 'prediction') {
          triggerMetadataUpdate("entityDetection", event.data.flaggedFrame, [entityDetectionState, faceLandmarksState, poseDetectionState, internetSpeedState.current, tabSwitchingState.current], user_id, exam_id);
          dispatch(setEntityDetection(event.data.flaggedFrame));
        } else if (event.data.type === 'error') {
          console.error("Entity Detection Worker Error:", event.data.message);
          toast({
            variant: 'destructive',
            title: 'Entity Detection Error',
            description: event.data.message,
          });
        }
      });

      worker2.addEventListener('message', (event: MessageEvent) => {
        if (event.data.type === 'modelLoaded') {
          modelLoaded.current['poseDetection'] = true;
          checkModelsLoaded();
        } else if (event.data.type === 'prediction') {
          triggerMetadataUpdate("poseDetection", event.data.poseResults, [entityDetectionState, faceLandmarksState, poseDetectionState, internetSpeedState.current, tabSwitchingState.current], user_id, exam_id);
          dispatch(setPoseDetection(event.data.poseResults));
        } else if (event.data.type === 'error') {
          console.error("Pose Detection Worker Error:", event.data.message);
          toast({
            variant: 'destructive',
            title: 'Pose Detection Error',
            description: event.data.message,
          });
        }
      });

      worker3.addEventListener('message', (event: MessageEvent) => {
        if (event.data.type === 'modelLoaded') {
          modelLoaded.current['faceLandmarks'] = true;
          checkModelsLoaded();
        } else if (event.data.type === 'prediction') {
          triggerMetadataUpdate("faceLandmarks", event.data.faceLandmarks, [entityDetectionState, faceLandmarksState, poseDetectionState, internetSpeedStateSelector, tabSwitchingStateSelector], user_id, exam_id);
          dispatch(setFaceLandmarks(event.data.faceLandmarks));
        } else if (event.data.type === 'error') {
          console.error("Face Landmarks Worker Error:", event.data.message);
          toast({
            variant: 'destructive',
            title: 'Face Landmarks Error',
            description: event.data.message,
          });
        }
      });

      worker1.postMessage({ type: 'loadModel' });
      worker2.postMessage({ type: 'loadModel' });
      worker3.postMessage({ type: 'loadModel' });

      return () => {
        worker1.terminate();
        worker2.terminate();
        worker3.terminate();
      };
    };

    const setupVideoAndWorker = async () => {
      try {
        if (!videoStream) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          dispatch(setVideoStream(stream));
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = async () => {
              await videoRef.current?.play();
              dispatch(setLoadState(false));
              const frameRate = FRAME_RATE;
              const newIntervalId = setInterval(() => {
                if (entityDetectiorRef.current && poseDetectionRef.current && faceLandmarksRef.current && canvasRef.current && videoRef.current) {
                  captureFrame(videoRef, canvasRef, user_id, exam_id, entityDetectiorRef.current, poseDetectionRef.current, faceLandmarksRef.current);
                  const lighting_check = analyzeLighting(videoRef, canvasRef);
                  if (!lighting_check) {
                    toast({
                      variant: 'destructive',
                      title: 'Lighting Error',
                      description: 'Please ensure that you are in a well-lit environment',
                    });
                    dispatch(cleanupFrameResources());
                    dispatch(cleanupAudioCaptureResources());
                    navigate('/lighting_error');
                  }
                }
              }, 1000 / frameRate) as unknown as number;
              dispatch(setFrameIntervalId(newIntervalId));
            };
          }
        }
      } catch (error: any) {
        console.error('Error accessing the camera:', error);
        toast({
          variant: 'destructive',
          title: 'Camera Error',
          description: 'An error occurred while accessing the camera. Please check your camera permissions and try again.',
        });
        dispatch(cleanupFrameResources());
        dispatch(cleanupAudioCaptureResources());
        navigate('/camera_error');
      }
    };
    if (!entityDetectiorRef.current || !poseDetectionRef.current || !faceLandmarksRef.current) {
      setupWorkers();
    }
  }, [dispatch, videoStream, internetSpeedStateSelector, tabSwitchingStateSelector, navigate, toast, user_id, exam_id]);

  return (
    <div>
      {loading ? (
        <div>
          <Progress value={(Object.keys(modelLoaded.current).length * 100) / 3} />
        </div>
      ) : (
        <div>
          <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }}></video>
        </div>
      )}
    </div>
  );
};

export default FrameCapture;
