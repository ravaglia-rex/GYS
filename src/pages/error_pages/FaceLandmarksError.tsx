import React from "react";

const FaceLandmarksError: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
        <h1 className="text-3xl font-semibold text-red-600 mb-4">Face Landmarks Error</h1>
        <p className="text-lg text-gray-700 mb-6">
          There was an unexpected error in loading/operation of the face landmarks model.
        </p>
        <p className="text-lg text-gray-700 mb-6">
          Please close the browser window. You will receive an email to retake the assessment from the point you left off.
        </p>
      </div>
    </div>
  );
}

export default FaceLandmarksError;
