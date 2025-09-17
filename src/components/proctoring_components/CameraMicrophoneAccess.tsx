import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../ui/use-toast.tsx';
import TabSwitchingMonitor from './TabSwitchingMonitor.tsx';
import { Video, Mic, Sun, Wifi } from 'lucide-react';
import * as Sentry from '@sentry/react';

const CameraMicrophoneAccess: React.FC = () => {
  const [hasCameraAccess, setHasCameraAccess] = useState<boolean>(false);
  const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState<boolean>(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const requestCameraAccess = async () => {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraAccess(true);
      videoStream.getTracks().forEach(track => track.stop());
    } catch (error: any) {
      Sentry.withScope((scope) => {
        scope.setTag('location', 'CameraMicrophoneAccess.requestCameraAccess');
        Sentry.captureException(error);
      });
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Camera access is necessary to proceed with the exam.'
      });
    }
  };

  const requestMicrophoneAccess = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasMicrophoneAccess(true);
      audioStream.getTracks().forEach(track => track.stop());
    } catch (error: any) {
      Sentry.withScope((scope) => {
        scope.setTag('location', 'CameraMicrophoneAccess.requestMicrophoneAccess');
        Sentry.captureException(error);
      });
      toast({
        variant: 'destructive',
        title: 'Microphone Access Denied',
        description: 'Microphone access is necessary to proceed with the exam.'
      });
    }
  };

  const handleAcknowledge = () => {
    navigate('/webcam-overlay');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <TabSwitchingMonitor isSubmitted={false}/>
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
        <h1 className="text-3xl font-semibold text-red-600 mb-4">Camera and Microphone Access Required</h1>
        <ul className="text-lg text-gray-700 list-none space-y-2 text-justify">
          <li className="flex items-center">
            <Video className="text-green-500 mr-2" />
            Allow access to your camera; you will be recorded during the exam to ensure integrity.
          </li>
          <li className="flex items-center">
            <Mic className="text-green-500 mr-2" />
            Allow access to your microphone.
          </li>
          <li className="flex items-center">
            <Sun className="text-green-500 mr-2" />
            Ensure you are in a well-lit room with your face and shoulders clearly visible.
          </li>
          <li className="flex items-center">
            <Wifi className="text-green-500 mr-2" />
            Ensure your internet connection is stable and above 5Mbps at all times.
          </li>
        </ul>
        <hr className="my-4" /> {/* Separator line */}
        <div className="flex justify-center space-x-4 mb-4">
          <button
            className={`hover:text-red-500 border border-gray-300 rounded-full p-2 ${hasCameraAccess ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={hasCameraAccess ? undefined : requestCameraAccess}
            disabled={hasCameraAccess}
            style={{ transition: 'all 0.3s ease-in-out' }}
          >
            <Video className="text-6xl text-gray-700" />
          </button> {/* Camera Icon Button */}
          <button
            className={`hover:text-red-500 border border-gray-300 rounded-full p-2 ${hasMicrophoneAccess ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={hasMicrophoneAccess ? undefined : requestMicrophoneAccess}
            disabled={hasMicrophoneAccess}
            style={{ transition: 'all 0.3s ease-in-out' }}
          >
            <Mic className="text-6xl text-gray-700" />
          </button> {/* Microphone Icon Button */}
        </div>
        {hasCameraAccess && hasMicrophoneAccess && (
          <div className="flex justify-center">
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleAcknowledge}>
              I Understand and Agree
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraMicrophoneAccess;