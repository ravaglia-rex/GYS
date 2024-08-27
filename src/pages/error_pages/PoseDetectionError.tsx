import React from "react";

const PoseDetectionError: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
        <h1 className="text-3xl font-semibold text-red-600 mb-4">Pose Detection Error</h1>
        <p className="text-lg text-gray-700 mb-6">
          There was an unexpected error in loading/operation of the pose detection model. Please try refreshing the browser.
        </p>
        <p className="text-lg text-gray-700 mb-6">
          Please close the browser window. You'll need to grant microphone permissions and retake the test.
        </p>
      </div>
    </div>
  );
}

export default PoseDetectionError;
