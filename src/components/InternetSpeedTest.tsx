import { VIOLATION_COUNT } from '../constants/constants.ts';

import React, { useEffect, useRef } from 'react';

import { useNavigate } from 'react-router-dom';

import { useDispatch } from 'react-redux';
// import { RootState } from '../state_data/reducer.ts';
// import { useSelector } from 'react-redux';
import { setInternetSpeed } from '../state_data/internetSpeedSlice';
import { cleanupFrameResources } from '../state_data/frameCaptureSlice.ts';
import { cleanupAudioCaptureResources } from '../state_data/audioCaptureSlice.ts';

const InternetSpeedMonitor: React.FC = () => {
  const dispatch = useDispatch();
  // const internetSpeed = useSelector((state: RootState) => state.internetSpeed);
  const violation_count = useRef<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const worker = new Worker(new URL('../internet_speed_monitoring/internetSpeedWorker.ts', import.meta.url));

    worker.onmessage = (event) => {
      if (event.data.type === 'speedTestResult') {
        dispatch(setInternetSpeed({ upload_speed: event.data.uploadSpeed, download_speed: event.data.downloadSpeed, timestamp: new Date().toISOString(), violation_count: 0}));
        violation_count.current = 0;
      } else if (event.data.type === 'downloadSpeedLow') {
        // start a timer to ask user to restore internet connection speeds failing which the user state needs to be stored and user redirected
        alert(`Download speed is below the threshold: ${event.data.downloadSpeed} Mbps`);
        dispatch(setInternetSpeed({ upload_speed: event.data.uploadSpeed, download_speed: event.data.downloadSpeed, timestamp: new Date().toISOString(), violation_count: violation_count.current+1}));
        violation_count.current += 1;
      } else if (event.data.type === 'uploadSpeedLow') {
        // start a timer to ask user to restore internet connection speeds failing which the user state needs to be stored and user redirected
        alert(`Upload speed is below the threshold: ${event.data.uploadSpeed} Mbps`);
        dispatch(setInternetSpeed({ upload_speed: event.data.uploadSpeed, download_speed: event.data.downloadSpeed, timestamp: new Date().toISOString(), violation_count: violation_count.current+1}));
        violation_count.current += 1;
      }
      if(violation_count.current >= VIOLATION_COUNT){
        // redirect user to the internet speed error page
        console.log('Internet speed violation count exceeded. Redirecting to error page.');
        dispatch(cleanupFrameResources());
        dispatch(cleanupAudioCaptureResources());
        navigate('/internet_speed_error');
      }
    };

    worker.postMessage('start');

    return () => {
      worker.terminate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  return (
    null
  );
};

export default InternetSpeedMonitor;
