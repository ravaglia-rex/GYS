import React from "react";
import { LoadingSpinner } from "./spinner";

const BigSpinner: React.FC = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <LoadingSpinner className="loading-spinner" />
    </div>
  );
};

export default BigSpinner;