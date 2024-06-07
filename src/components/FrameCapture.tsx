import React, { useRef, useEffect } from 'react';

import { captureFrame, analyzeLighting, triggerMetadataUpdate } from "../functions/frame_handling/captureFrame.ts";

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
import { useToast } from './ui/use-toast.tsx';
import { Progress } from './ui/progress.tsx';

const FrameCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameIntervalId = useSelector((state: RootState) => state.frameCapture.frameIntervalId);
  const entityDetectiorRef = useRef<Worker | null>(null);
  const poseDetectionRef = useRef<Worker | null>(null);
  const faceLandmarksRef = useRef<Worker | null>(null);
  const modelLoaded = useRef<number>(0);
  const { toast } = useToast();

  const entityDetectionState = useRef<Array<any>>([]);
  const faceLandmarksState = useRef<Array<any>>([]);
  const poseDetectionState = useRef<Array<any>>([]);

  const internetSpeedStateSelector = useSelector((state: RootState) => state.internetSpeed);
  const tabSwitchingStateSelector = useSelector((state: RootState) => state.tabSwitching);

  const dispatch = useDispatch();
  const loading = useSelector((state: RootState) => state.load.loading);

  const navigate = useNavigate();

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    return () => {
      if (frameIntervalId !== null) dispatch(cleanupInterval());
    };
  }, [dispatch, frameIntervalId]);

  useEffect(() => {
    const setupWorkers = () => {
      const worker1 = new Worker(new URL('../frame_flagging_modules/entityDetectionWorker.ts', import.meta.url), {type: 'module'});
      const worker2 = new Worker(new URL('../frame_flagging_modules/poseDetectionWorker.ts', import.meta.url), {type: 'module'});
      const worker3 = new Worker(new URL('../frame_flagging_modules/faceLandmarksWorker.ts', import.meta.url), {type: 'module'});

      entityDetectiorRef.current = worker1;
      poseDetectionRef.current = worker2;
      faceLandmarksRef.current = worker3;
      dispatch(setEntityDetectionWorker(worker1));
      dispatch(setPoseDetectionWorker(worker2));
      dispatch(setFaceLandmarkDetectionWorker(worker3));

      const checkModelsLoaded = () => {
        modelLoaded.current += 1;
        if(modelLoaded.current === 3){
          dispatch(setLoadState(false));
          setupVideoAndWorker();
        } else {
          dispatch(setLoadState(true));
        }
      }

      worker1.addEventListener('message', (event: MessageEvent)=>{
        if (event.data.type==='modelLoaded'){
          checkModelsLoaded();
        } else if(event.data.type==='prediction'){
          triggerMetadataUpdate("entityDetection", event.data.flaggedFrame, [entityDetectionState, faceLandmarksState, poseDetectionState, internetSpeedStateSelector, tabSwitchingStateSelector]);
          dispatch(setEntityDetection(event.data.flaggedFrame));
        } else if(event.data.type==='error'){
          // save state of the exam and push user to the entity detection error page
          toast({
            variant: 'destructive',
            title: 'Entity Detection Error',
            description: event.data.message,
          });

          dispatch(cleanupFrameResources());
          dispatch(cleanupAudioCaptureResources());
          navigate('/entity_detection_error');
        }
      });

      worker2.addEventListener('message', (event: MessageEvent) => {
        if (event.data.type==='modelLoaded'){
          checkModelsLoaded();
        } else if(event.data.type==='prediction'){
          triggerMetadataUpdate("poseDetection", event.data.poseResults, [entityDetectionState, faceLandmarksState, poseDetectionState, internetSpeedStateSelector, tabSwitchingStateSelector]);
          dispatch(setPoseDetection(event.data.poseResults));
        } else if(event.data.type==='error'){
          // save state of the exam and push user to the pose detection error page
          toast({
            variant: 'destructive',
            title: 'Pose Detection Error',
            description: event.data.message,
          });
          dispatch(cleanupFrameResources());
          dispatch(cleanupAudioCaptureResources());
          navigate('/pose_detection_error');
        }
      });

      worker3.addEventListener('message', (event: MessageEvent)=>{
        if (event.data.type==='modelLoaded'){
          checkModelsLoaded();
        } else if(event.data.type==='prediction'){
          triggerMetadataUpdate("faceLandmarks", event.data.faceLandmarks, [entityDetectionState, faceLandmarksState, poseDetectionState, internetSpeedStateSelector, tabSwitchingStateSelector]);
          dispatch(setFaceLandmarks(event.data.faceLandmarks));
        } else if(event.data.type==='error'){
          // save state of the exam and push user to the face landmarks error page
          toast({
            variant: 'destructive',
            title: 'Face Landmarks Error',
            description: event.data.message,
          });
          dispatch(cleanupFrameResources());
          dispatch(cleanupAudioCaptureResources());
          navigate('/face_landmarks_model_error');
        }
      });
      worker1.postMessage({type: 'loadModel'});
      worker2.postMessage({type: 'loadModel'});
      worker3.postMessage({type: 'loadModel'});

      return () => {
        worker1?.terminate();
        worker2?.terminate();
        worker3?.terminate();
      };
    };

    const setupVideoAndWorker = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        dispatch(setVideoStream(stream));
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          const frameRate = FRAME_RATE;
          const newIntervalId = setInterval(() => {
            if(entityDetectiorRef.current && poseDetectionRef.current && faceLandmarksRef.current && canvasRef && videoRef){
              captureFrame(videoRef, canvasRef, entityDetectiorRef.current, poseDetectionRef.current, faceLandmarksRef.current);
            }
            if(canvasRef.current && videoRef.current){
              const lighting_check = analyzeLighting(videoRef, canvasRef);
              if(!lighting_check){
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
        }
      } catch (error: any) {
        console.error('Error accessing the camera', error);
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

    setupWorkers();
  }, [dispatch, internetSpeedStateSelector, tabSwitchingStateSelector, navigate, toast]);

  return (
    <div>
      {loading? (<div> <Progress value={modelLoaded.current*100/3}/> </div>): (<div>
        <video ref={videoRef} autoPlay playsInline muted style={{display: 'none'}}></video> 
      </div>)}
    </div>
  );
};

export default FrameCapture;
