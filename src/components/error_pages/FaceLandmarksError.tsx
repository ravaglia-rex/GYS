import React from "react";

const FaceLandmarksError: React.FC = () => {
  return (
    <div>
      <h1>Face Landmarks Error</h1>
      <p>There was an unexpected error in loading/operation of the face landmarks model. Please try refreshing the browser</p>
    </div>
  );
}

export default FaceLandmarksError;