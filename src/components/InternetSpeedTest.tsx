import React, { useEffect, useState } from 'react';

const InternetSpeedMonitor: React.FC = () => {
  const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('../internet_speed_monitoring/internetSpeedWorker.ts', import.meta.url));

    worker.onmessage = (event) => {
      if (event.data.type === 'speedTestResult') {
        setDownloadSpeed(event.data.downloadSpeed);
        setUploadSpeed(event.data.uploadSpeed);
        setError(null); // Clear any previous errors if the test passed
      } else if (event.data.type === 'downloadSpeedLow') {
        setError(`Download speed is below the threshold: ${event.data.downloadSpeed} Mbps`);
      } else if (event.data.type === 'uploadSpeedLow') {
        setError(`Upload speed is below the threshold: ${event.data.uploadSpeed} Mbps`);
      }
    };

    worker.postMessage('start');

    return () => {
      worker.terminate();
    };
  }, []);

  return (
    <div>
      {error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <div>
          <div>Download speed: {downloadSpeed !== null ? `${downloadSpeed.toFixed(2)} Mbps` : 'Testing...'}</div>
          <div>Upload speed: {uploadSpeed !== null ? `${uploadSpeed.toFixed(2)} Mbps` : 'Testing...'}</div>
        </div>
      )}
    </div>
  );
};

export default InternetSpeedMonitor;
