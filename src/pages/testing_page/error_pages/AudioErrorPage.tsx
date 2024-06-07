import React from "react";
import { Button } from "../../../components/ui/button";
import { useNavigate } from "react-router-dom";

const AudioErrorPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md mx-auto">
        <h1 className="text-2xl font-semibold text-red-600 mb-4">Audio Error</h1>
        <p className="text-gray-700 mb-6">
          We've run into issues accessing your microphone or running our audio models.
          Please refresh your browser or use a different one.
        </p>
        <Button onClick={() => navigate('/')}>
          Go Back Home
        </Button>
      </div>
    </div>
  );
}

export default AudioErrorPage;
