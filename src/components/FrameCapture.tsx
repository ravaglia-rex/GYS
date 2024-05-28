import React, { useRef, useState, useEffect } from 'react';
import { captureFrame } from "../functions/frame_handling/captureFrame.ts";
import { useDispatch, useSelector } from 'react-redux';
import { setEntityDetection } from '../state_data/entityDetectionSlice.ts';
import { setPoseDetection } from '../state_data/poseDetectionSlice.ts';
import { setFaceLandmarks } from '../state_data/faceLandmarksSlice.ts';
import { RootState } from '../state_data/reducer.ts';
import { setLoadState } from '../state_data/loadSlice.ts';


const FrameCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const entityDetectiorRef = useRef<Worker>();
  const poseDetectionRef = useRef<Worker>();
  const faceLandmarksRef = useRef<Worker>();
  const dispatch = useDispatch();
  const state = useSelector((state: RootState) => state);
  const loading = useSelector((state: RootState) => state.load.loading);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    return () => {
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, [intervalId]);

  useEffect(() => {
    const setupVideoAndWorker = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            const frameRate = 1;
            const newIntervalId = setInterval(() => captureFrame(videoRef, canvasRef, entityDetectiorRef, poseDetectionRef, faceLandmarksRef), 1000 / frameRate) as unknown as number;
            setIntervalId(newIntervalId);
          }
        } catch (error: any) {
          // This needs to push the user to the Camera Error page instead of a simple error message
          console.error('Error accessing the camera', error);
          alert('Error accessing camera: ' + error.message);
        }
      }
      entityDetectiorRef.current = new Worker(new URL('../frame_flagging_modules/entityDetectionWorker.ts', import.meta.url), {type: 'module'});
      poseDetectionRef.current = new Worker(new URL('../frame_flagging_modules/poseDetectionWorker.ts', import.meta.url), {type: 'module'});
      faceLandmarksRef.current = new Worker(new URL('../frame_flagging_modules/faceLandmarksWorker.ts', import.meta.url), {type: 'module'});

      let models_loaded = 0;
      const checkModelsLoaded = () => {
        models_loaded += 1;
        if(models_loaded === 3){
          dispatch(setLoadState(false));
          setupVideoAndWorker();
        } else {
          dispatch(setLoadState(true));
        }
      }

      entityDetectiorRef.current?.addEventListener('message', (event: MessageEvent)=>{
        if (event.data.type==='modelLoaded'){
          checkModelsLoaded();
        } else if(event.data.type==='prediction'){
          dispatch(setEntityDetection(event.data.flaggedFrame));
        } else if(event.data.type==='error'){
          // Throw the user to a page stating that the state of the exam is saved but they need to restart the browser and check their camera permissions
          console.error('Entity Worker Error: ', event.data.message);
        }
      });

      poseDetectionRef.current?.addEventListener('message', (event: MessageEvent) => {
        if (event.data.type==='modelLoaded'){
          checkModelsLoaded();
        } else if(event.data.type==='prediction'){
          dispatch(setPoseDetection(event.data.poseResults));
        } else if(event.data.type==='error'){
          // Throw the user to a page stating that the state of the exam is saved but they need to restart the browser and check their camera permissions/pose model
          console.error('Pose Worker Error: ', event.data.message);
        }
      });

      faceLandmarksRef.current?.addEventListener('message', (event: MessageEvent)=>{
        if (event.data.type==='modelLoaded'){
          checkModelsLoaded();
        } else if(event.data.type==='prediction'){
          dispatch(setFaceLandmarks(event.data.faceLandmarks));
          console.log(event.data.landmarks);
        } else if(event.data.type==='error'){
          // Throw the user to a page stating that the state of the exam is saved but they need to restart the browser and check their camera permissions/face landmarks model
          console.error('Face Landmarks Error: ', event.data.message);
        }
      });
      entityDetectiorRef.current.postMessage({type: 'loadModel'});
      poseDetectionRef.current.postMessage({type: 'loadModel'});
      faceLandmarksRef.current.postMessage({type: 'loadModel'});
      setupVideoAndWorker();
      return () => {
        entityDetectiorRef.current?.terminate();
        poseDetectionRef.current?.terminate();
        faceLandmarksRef.current?.terminate();
      };
    }, [dispatch]);

  return (
    <div>
      {loading? (<div>Loading...</div>): (<div>
        <video ref={videoRef} autoPlay playsInline muted style={{display: 'none'}}></video>
        <pre>{JSON.stringify(state.entityDetection, null, 2)}</pre>
        <pre>{JSON.stringify(state.faceLandmarks, null, 2)}</pre>
        <pre>{JSON.stringify(state.poseDetection, null, 2)}</pre>
      </div>)}
    </div>
  );
};

export default FrameCapture;