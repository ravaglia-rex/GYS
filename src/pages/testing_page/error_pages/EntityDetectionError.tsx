import React from "react";

const EntityDetectionError: React.FC = () => {  
  return (
    <div>
      <h1>Entity Detection Error</h1>
      <p>There was an unexpected error in loading/operation of the entity detection model. Please try refreshing the browser</p>
    </div>
  );
}

export default EntityDetectionError;