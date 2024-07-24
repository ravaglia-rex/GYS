import React from 'react';
import WebcamOverlay from '../../components/proctoring_components/WebcamOverlay';
import TabSwitchingMonitor from '../../components/proctoring_components/TabSwitchingMonitor';

const WebcamOverlayPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <TabSwitchingMonitor isSubmitted={false} />
        <div className="text-center text-red-600 font-semibold mb-4">
          Ensure your face is properly centered in the circle.
        </div>
        <WebcamOverlay />
      </div>
    </div>
  );
};

export default WebcamOverlayPage;
