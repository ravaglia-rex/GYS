import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './ui/use-toast.tsx';
import TabSwitchingMonitor from './TabSwitchingMonitor.tsx';

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
      toast({
        variant: 'destructive',
        title: 'Microphone Access Denied',
        description: 'Microphone access is necessary to proceed with the exam.'
      });
    }
  };

  const handleAcknowledge = () => {
    navigate('/'); // Navigate to the root path after acknowledgement
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <TabSwitchingMonitor isSubmitted={false}/>
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md mx-auto">
        <h1 className="text-3xl font-semibold text-red-600 mb-4">Camera and Microphone Access Required</h1>
        <ul className="text-lg text-gray-700 list-none space-y-2 text-justify">
          <li>
            <span className="material-icons align-middle text-green-500 mr-2">videocam</span>
            Allow access to your camera; you will be recorded during the exam to ensure integrity.
          </li>
          <li>
            <span className="material-icons align-middle text-green-500 mr-2">mic</span>
            Allow access to your microphone.
          </li>
          <li>
            <span className="material-icons align-middle text-green-500 mr-2">light_mode</span>
            Ensure you are in a well-lit room with your face and shoulders clearly visible.
          </li>
        </ul>
        <hr className="my-4" /> {/* Separator line */}
        <div className="flex justify-center space-x-4 mb-4">
          <button
            className={`material-icons text-6xl hover:text-red-500 border border-gray-300 rounded-full p-2 ${hasCameraAccess ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={hasCameraAccess ? undefined : requestCameraAccess}
            disabled={hasCameraAccess}
            style={{ transition: 'all 0.3s ease-in-out' }}
          >
            videocam
          </button> {/* Camera Icon Button */}
          <button
            className={`material-icons text-6xl hover:text-red-500 border border-gray-300 rounded-full p-2 ${hasMicrophoneAccess ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={hasMicrophoneAccess ? undefined : requestMicrophoneAccess}
            disabled={hasMicrophoneAccess}
            style={{ transition: 'all 0.3s ease-in-out' }}
          >
            mic
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
