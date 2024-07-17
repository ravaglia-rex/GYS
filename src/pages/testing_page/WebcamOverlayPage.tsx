import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WebcamOverlay from '../../components/ProctoringComponents/WebcamOverlay';
import TabSwitchingMonitor from '../../components/TabSwitchingMonitor';

const WebcamOverlayPage: React.FC = () => {
  const navigate = useNavigate();
  const [faceAligned, setFaceAligned] = useState(false);

  const handleStartExam = () => {
    navigate('/testing');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <TabSwitchingMonitor isSubmitted={false} />
        {!faceAligned && (
          <div className="text-center text-red-600 font-semibold mb-4">
            Ensure your face is properly centered in the circle.
          </div>
        )}
        {!faceAligned && <WebcamOverlay setFaceAligned={setFaceAligned} />}
        {faceAligned && (
          <div className="text-center text-green-600 font-semibold mb-4">
            You’re good to go! All the best.
          </div>
        )}
        <div className="flex justify-center mt-4">
          <button
            className={`font-bold py-2 px-4 rounded ${faceAligned ? 'bg-blue-500 hover:bg-blue-700 text-white cursor-pointer' : 'bg-gray-400 text-gray-700 cursor-not-allowed'}`}
            onClick={handleStartExam}
            disabled={!faceAligned}
          >
            Start Exam
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebcamOverlayPage;
