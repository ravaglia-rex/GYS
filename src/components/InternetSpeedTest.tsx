import { VIOLATION_COUNT } from '../constants/constants.ts';

import React, { useEffect, useRef } from 'react';

import { useNavigate } from 'react-router-dom';

import { useDispatch } from 'react-redux';
import { setInternetSpeed } from '../state_data/internetSpeedSlice';
import { cleanupFrameResources } from '../state_data/frameCaptureSlice.ts';
import { cleanupAudioCaptureResources } from '../state_data/audioCaptureSlice.ts';
import { useToast } from './ui/use-toast.tsx';
import * as Sentry from '@sentry/react';

const InternetSpeedMonitor: React.FC = () => {
  const dispatch = useDispatch();
  const violation_count = useRef<number>(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const worker = new Worker(new URL('../internet_speed_monitoring/internetSpeedWorker.ts', import.meta.url));

    worker.onmessage = (event) => {
      if (event.data.type === 'speedTestResult') {
        dispatch(setInternetSpeed({ upload_speed: event.data.uploadSpeed, download_speed: event.data.downloadSpeed, timestamp: new Date().toISOString(), violation_count: 0}));
        violation_count.current = 0;
      } else if (event.data.type === 'downloadSpeedLow') {
        Sentry.withScope((scope) => {
          scope.setTag('location', 'InternetSpeedMonitor.downloadSpeedLow');
          scope.setExtra('downloadSpeed', event.data.downloadSpeed);
          Sentry.captureMessage(`Download speed is below the threshold: ${event.data.downloadSpeed} Mbps`);
        });
        toast({
          variant: 'default',
          title: 'Download speed is below the threshold',
          description: `Download speed is below the threshold: ${event.data.downloadSpeed} Mbps`,
        });
        dispatch(setInternetSpeed({ upload_speed: event.data.uploadSpeed, download_speed: event.data.downloadSpeed, timestamp: new Date().toISOString(), violation_count: violation_count.current+1}));
        violation_count.current += 1;
      } else if (event.data.type === 'uploadSpeedLow') {
        Sentry.withScope((scope) => {
          scope.setTag('location', 'InternetSpeedMonitor.uploadSpeedLow');
          scope.setExtra('uploadSpeed', event.data.uploadSpeed);
          Sentry.captureMessage(`Upload speed is below the threshold: ${event.data.uploadSpeed} Mbps`);
        });
        toast({
          variant:'default',
          title: 'Upload speed is below the threshold',
          description: `Upload speed is below the threshold: ${event.data.uploadSpeed} Mbps`,
        });
        dispatch(setInternetSpeed({ upload_speed: event.data.uploadSpeed, download_speed: event.data.downloadSpeed, timestamp: new Date().toISOString(), violation_count: violation_count.current+1}));
        violation_count.current += 1;
      }
      if(violation_count.current >= VIOLATION_COUNT){
        Sentry.withScope((scope) => {
          scope.setTag('location', 'InternetSpeedMonitor.VIOLATION_COUNT');
          scope.setExtra('violationCount', violation_count.current);
          Sentry.captureMessage('Internet speed violation count exceeded');
        });
        toast({
          variant: 'destructive',
          title: 'Internet Speed Error',
          description: 'Internet speed violation count exceeded. Please check your internet connection.',
        });
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
