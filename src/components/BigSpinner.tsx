import React from "react";
import { LoadingSpinner } from "./ui/spinner";

const BigSpinner: React.FC = () => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <LoadingSpinner className="loading-spinner" />
    </div>
  );
};

export default BigSpinner;