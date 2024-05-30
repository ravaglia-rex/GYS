import React from "react";

const PoseDetectionError: React.FC = () => {
  return (
    <div>
      <h1>Pose Detection Error</h1>
      <p>There was an unexpected error in loading/operation of the pose detection model. Please try refreshing the browser</p>
    </div>
  );
}

export default PoseDetectionError;