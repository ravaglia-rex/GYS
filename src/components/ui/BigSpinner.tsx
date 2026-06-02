import React from "react";
import { LoadingSpinner } from "./spinner";

const BigSpinner: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        height: '100vh',
        color: 'rgba(255, 255, 255, 0.86)',
      }}
    >
        <LoadingSpinner className="loading-spinner" />
        <span style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '0.02em' }}>Loading...</span>
    </div>
  );
};

export default BigSpinner;