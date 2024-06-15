import React, { useRef, useEffect, useState } from 'react';
import { captureFrame, analyzeLighting, triggerMetadataUpdate } from "../functions/frame_handling/captureFrame.ts";
import { auth } from '../firebase/firebase.ts';
import { getSchoolId } from '../db/studentCollection.ts';
import { getExamId } from '../db/examMappingCollection.ts';
import { setExamID } from '../state_data/examDetailsSlice.ts';
import { FRAME_RATE } from '../constants/constants.ts';
import { useDispatch, useSelector } from 'react-redux';
import { setEntityDetection } from '../state_data/entityDetectionSlice.ts';
import { setPoseDetection } from '../state_data/poseDetectionSlice.ts';
import { setFaceLandmarks } from '../state_data/faceLandmarksSlice.ts';
import { setEntityDetectionWorker, setPoseDetectionWorker, setFaceLandmarkDetectionWorker, setFrameIntervalId, setVideoStream, cleanupInterval, cleanupFrameResources } from '../state_data/frameCaptureSlice.ts';
import { cleanupAudioCaptureResources } from '../state_data/audioCaptureSlice.ts';
import { RootState } from '../state_data/reducer.ts';
import { setLoadState } from '../state_data/loadSlice.ts';
import { useToast } from './ui/use-toast.tsx';
import { Progress } from './ui/progress.tsx';
import CameraAccessDialog from './CameraAccessDialog.tsx';

const FrameCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const entityDetectiorRef = useRef<Worker | null>(null);
  const poseDetectionRef = useRef<Worker | null>(null);
  const faceLandmarksRef = useRef<Worker | null>(null);
  const modelLoaded = useRef<{ [key: string]: boolean }>({});
  const { toast } = useToast();
  const dispatch = useDispatch();
  const loading = useSelector((state: RootState) => state.load.loading);
  const videoStream = useSelector((state: RootState) => state.frameCapture.videoStream);
  const exam_id = useSelector((state: RootState) => state.examDetails.examId)|| "mOGkN8";
  const user_id = auth.currentUser?.uid || "11111";

  const entityDetectionState = useRef<Array<any>>([]);
  const faceLandmarksState = useRef<Array<any>>([]);
  const poseDetectionState = useRef<Array<any>>([]);
  const internetSpeedStateSelector = useSelector((state: RootState) => state.internetSpeed);
  const tabSwitchingStateSelector = useSelector((state: RootState) => state.tabSwitching);
  const internetSpeedState = useRef<any>(null);
  const tabSwitchingState = useRef<any>(null);

  const [hasCameraAccess, setHasCameraAccess] = useState<boolean>(false);
  const [formLoaded, setFormLoaded] = useState<boolean>(false);

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
      if (hasCameraAccess && !videoStream) {
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
              if (entityDetectiorRef.current && poseDetectionRef.current && faceLandmarksRef.current && canvas && videoRef.current) {
                captureFrame(videoRef, canvas, user_id, exam_id, entityDetectiorRef.current, poseDetectionRef.current, faceLandmarksRef.current);
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
      console.error('Error accessing the camera:', error);
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

  useEffect(() => {
    // Check camera permission initially
    navigator.permissions.query({ name: 'camera' as PermissionName })
      .then(permissionStatus => {
        if (permissionStatus.state === 'granted') {
          setHasCameraAccess(true);
        } else if (permissionStatus.state === 'prompt') {
          setHasCameraAccess(false);
          videoRef.current?.pause();
        } else {
          setHasCameraAccess(false);
          videoRef.current?.pause();
        }
      });

    return () => {
      dispatch(cleanupInterval());
      dispatch(cleanupFrameResources());
      dispatch(cleanupAudioCaptureResources());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    if (hasCameraAccess && formLoaded) {
      setupWorkers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCameraAccess]);

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
        setFormLoaded(true);
      } catch (error: any) {
        dispatch(setExamID({ examId: "mOGkN8" }));
        setFormLoaded(true);
      }
    };

    fetchFormLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user_id]);

  useEffect(() => {
    if(exam_id === "") return;

    if (!entityDetectiorRef.current || !poseDetectionRef.current || !faceLandmarksRef.current) {
      setupWorkers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, formLoaded, videoStream, internetSpeedStateSelector, tabSwitchingStateSelector, toast, user_id, exam_id, hasCameraAccess]);

  return (
    <div>
      {loading ? (
        <div>
          <Progress value={(Object.keys(modelLoaded.current).length * 100) / 3} />
        </div>
      ) : (
        <div>
          <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }}></video>
          {!hasCameraAccess && <CameraAccessDialog hasCameraAccess={hasCameraAccess} setHasCameraAccess={setHasCameraAccess} />}
        </div>
      )}
    </div>
  );
};

export default FrameCapture;
