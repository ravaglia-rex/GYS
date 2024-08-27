import React from "react";

const LightingErrorPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
        <h1 className="text-3xl font-semibold text-red-600 mb-4">Camera Error</h1>
        <p className="text-lg text-gray-700 mb-6">
          Lighting Error. Please ensure that you are in a well-lit environment.
        </p>
        <p className="text-lg text-gray-700 mb-6">
          Please close the browser window. You'll need to grant microphone permissions and retake the test.
        </p>
      </div>
    </div>
  );
};

export default LightingErrorPage;
