import React, { useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state_data/reducer.ts';
import CameraSetup from './CameraSetup.tsx';
import WorkerSetupComponent from './WorkerSetupComponent.tsx';
import CameraAccessCheckComponent from './CameraAccessCheckComponent.tsx';

interface FrameCaptureProps {
  isSubmitted: boolean;
}

const FrameCapture: React.FC<FrameCaptureProps> = ({isSubmitted}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [modelLoaded, setModelLoaded] = useState<{ [key: string]: boolean }>({});
  const entityDetectiorRef = useRef<Worker | null>(null);
  const poseDetectionRef = useRef<Worker | null>(null);
  const faceLandmarksRef = useRef<Worker | null>(null);

  const [hasCameraAccess, setHasCameraAccess] = useState<boolean>(false);
  const internetSpeedStateSelector = useSelector((state: RootState) => state.internetSpeed);
  const tabSwitchingStateSelector = useSelector((state: RootState) => state.tabSwitching);
  const internetSpeedState = useRef<any>(null);
  const tabSwitchingState = useRef<any>(null);

  useEffect(() => {
    internetSpeedState.current = internetSpeedStateSelector;
    tabSwitchingState.current = tabSwitchingStateSelector;
}, [internetSpeedStateSelector, tabSwitchingStateSelector]);

  return (
    <div>
        <CameraAccessCheckComponent hasCameraAccess={hasCameraAccess} setHasCameraAccess={setHasCameraAccess} videoRef={videoRef} />
        <WorkerSetupComponent hasCameraAccess={hasCameraAccess} formLoaded={true} modelLoaded={modelLoaded} setModelsLoaded={setModelLoaded} entityDetectionWorkerRef={entityDetectiorRef} poseDetectionWorkerRef={poseDetectionRef} faceLandmarksWorkerRef={faceLandmarksRef} internetSpeedState={internetSpeedState} tabSwitchingState={tabSwitchingState}/>
        <CameraSetup hasCameraAccess={hasCameraAccess} isSubmitted={isSubmitted} setHasCameraAccess={setHasCameraAccess} haveModelsLoaded={modelLoaded} videoRef={videoRef} entityDetectionWorkerRef={entityDetectiorRef} poseDetectionWorkerRef={poseDetectionRef} faceLandmarksWorkerRef={faceLandmarksRef}/>
    </div>
  );
};

export default FrameCapture;