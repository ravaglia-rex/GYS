import React, { useRef, useEffect } from 'react';
import { triggerMetadataUpdate } from "../functions/frame_handling/captureFrame.ts";
import { auth } from '../firebase/firebase.ts';
import { useDispatch } from 'react-redux';
import { setEntityDetection } from '../state_data/entityDetectionSlice.ts';
import { setPoseDetection } from '../state_data/poseDetectionSlice.ts';
import { setFaceLandmarks } from '../state_data/faceLandmarksSlice.ts';
import { setEntityDetectionWorker, setPoseDetectionWorker, setFaceLandmarkDetectionWorker} from '../state_data/frameCaptureSlice.ts';
import { setLoadState } from '../state_data/loadSlice.ts';
import { useToast } from './ui/use-toast';

interface WorkerSetupComponentProps {
    hasCameraAccess: boolean;
    formLoaded: boolean;
    modelLoaded: { [key: string]: boolean };
    setModelsLoaded: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
    entityDetectionWorkerRef: React.MutableRefObject<Worker | null>;
    poseDetectionWorkerRef: React.MutableRefObject<Worker | null>;
    faceLandmarksWorkerRef: React.MutableRefObject<Worker | null>;
    internetSpeedState: React.MutableRefObject<any>;
    tabSwitchingState: React.MutableRefObject<any>;
}

const WorkerSetupComponent: React.FC<WorkerSetupComponentProps> = ({hasCameraAccess, formLoaded, modelLoaded, setModelsLoaded, entityDetectionWorkerRef, poseDetectionWorkerRef, faceLandmarksWorkerRef, internetSpeedState, tabSwitchingState}) => {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const exam_id = localStorage.getItem('currentFormId') || "<UNKNOWN_FORM_ID>";
  const user_id = auth.currentUser?.uid || "<UNKNOWN_USER_ID>";

  const entityDetectionState = useRef<Array<any>>([]);
  const faceLandmarksState = useRef<Array<any>>([]);
  const poseDetectionState = useRef<Array<any>>([]);

  const setupWorkers = () => {
    const worker1 = new Worker(new URL('../frame_flagging_modules/entityDetectionWorker.ts', import.meta.url), { type: 'module' });
    const worker2 = new Worker(new URL('../frame_flagging_modules/poseDetectionWorker.ts', import.meta.url), { type: 'module' });
    const worker3 = new Worker(new URL('../frame_flagging_modules/faceLandmarksWorker.ts', import.meta.url), { type: 'module' });

    entityDetectionWorkerRef.current = worker1;
    poseDetectionWorkerRef.current = worker2;
    faceLandmarksWorkerRef.current = worker3;
    
    dispatch(setEntityDetectionWorker(worker1));
    dispatch(setPoseDetectionWorker(worker2));
    dispatch(setFaceLandmarkDetectionWorker(worker3));

    const checkModelsLoaded = () => {
      if (modelLoaded['entityDetection'] && modelLoaded['poseDetection'] && modelLoaded['faceLandmarks']) {
      } else {
        dispatch(setLoadState(true));
      }
    }

    worker1.addEventListener('message', (event: MessageEvent) => {
      if (event.data.type === 'modelLoaded') {
        setModelsLoaded({ ...modelLoaded, entityDetection: true });
        checkModelsLoaded();
      } else if (event.data.type === 'prediction') {
        triggerMetadataUpdate("entityDetection", event.data.flaggedFrame, [entityDetectionState, faceLandmarksState, poseDetectionState, internetSpeedState.current, tabSwitchingState.current], user_id, exam_id);
        dispatch(setEntityDetection(event.data.flaggedFrame));
      } else if (event.data.type === 'error') {
        toast({
          variant: 'destructive',
          title: 'Model Error',
          description: "We can't detect any entities in the frame. Be sure to be in a well-lit environment and clearly in the camera frame.",
        });
      }
    });

    worker2.addEventListener('message', (event: MessageEvent) => {
      if (event.data.type === 'modelLoaded') {
        setModelsLoaded({ ...modelLoaded, poseDetection: true });
        checkModelsLoaded();
      } else if (event.data.type === 'prediction') {
        triggerMetadataUpdate("poseDetection", event.data.poseResults, [entityDetectionState, faceLandmarksState, poseDetectionState, internetSpeedState.current, tabSwitchingState.current], user_id, exam_id);
        dispatch(setPoseDetection(event.data.poseResults));
      } else if (event.data.type === 'error') {
        console.error("Pose Detection Worker Error:", event.data.message);
        toast({
          variant: 'destructive',
          title: 'Model Error',
          description: "Are you sure your face and shoulders are visible in the camera frame?",
        });
      }
    });

    worker3.addEventListener('message', (event: MessageEvent) => {
      if (event.data.type === 'modelLoaded') {
        setModelsLoaded({ ...modelLoaded, faceLandmarks: true });
        checkModelsLoaded();
      } else if (event.data.type === 'prediction') {
        triggerMetadataUpdate("faceLandmarks", event.data.faceLandmarks, [entityDetectionState, faceLandmarksState, poseDetectionState, internetSpeedState.current, tabSwitchingState.current], user_id, exam_id);
        dispatch(setFaceLandmarks(event.data.faceLandmarks));
      } else if (event.data.type === 'error') {
        toast({
          variant: 'destructive',
          title: 'Model Error',
          description: "We can't detect any facial landmarks in the frame. Be sure to be in a well-lit environment and clearly in the camera frame.",
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

  useEffect(() => {
    if (hasCameraAccess && formLoaded && !modelLoaded['entityDetection'] && !modelLoaded['poseDetection'] && !modelLoaded['faceLandmarks']) {
      setupWorkers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCameraAccess, formLoaded, modelLoaded]);

  return (
    null
  );
};

export default WorkerSetupComponent;
