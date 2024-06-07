import React from "react";

const SpeedTestErrorPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
        <h1 className="text-3xl font-semibold text-red-600 mb-4">Internet Speed Too Low</h1>
        <p className="text-lg text-gray-700 mb-6">
          We detected that your internet speed was consistently low. We've saved your exam responses so you can save your connectivity.
        </p>
        <p className="text-lg text-gray-700 mb-6">
          Please close the browser window. You will receive an email to retake the assessment from the point you left off.
        </p>
      </div>
    </div>
  );
}

export default SpeedTestErrorPage;
