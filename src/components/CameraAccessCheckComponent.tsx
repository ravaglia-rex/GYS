import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { cleanupInterval, cleanupFrameResources } from '../state_data/frameCaptureSlice.ts';
import { cleanupAudioCaptureResources } from '../state_data/audioCaptureSlice.ts';
import CameraAccessDialog from './CameraAccessDialog.tsx';

interface CameraAccessCheckComponentProps {
    hasCameraAccess: boolean;
    setHasCameraAccess: React.Dispatch<React.SetStateAction<boolean>>;
    videoRef: React.RefObject<HTMLVideoElement>;
};

const CameraAccessCheckComponent: React.FC<CameraAccessCheckComponentProps> = ({hasCameraAccess, setHasCameraAccess, videoRef}) => {
  const dispatch = useDispatch();

  useEffect(() => {
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
  }, [dispatch, setHasCameraAccess, videoRef]);

    return (
        <div>
            {!hasCameraAccess && <CameraAccessDialog hasCameraAccess={hasCameraAccess} setHasCameraAccess={setHasCameraAccess} />}
        </div>
    )
};

    
export default CameraAccessCheckComponent;