import React, { useEffect, useState } from 'react';

const InternetSpeedTest: React.FC = () => { 
    const [downloadSpeed, setDownloadSpeed] = useState<number | null>(null);
    const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const worker = new Worker(new URL('../internet_speed_monitoring/internetSpeedWorker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (event) => {
            if (event.data.type === 'downloadSpeedLow') {
                setError(`Download speed is too low: ${event.data.downloadSpeed}`);
            } else if (event.data.type === 'uploadSpeedLow') {
                setError(`Upload speed is too low: ${event.data.uploadSpeed}`);
            } else if (event.data.type === 'speedTestResult') {
                setDownloadSpeed(event.data.downloadSpeed);
                setUploadSpeed(event.data.uploadSpeed);
            }
        }

        worker.postMessage('start');
        return () => {
            worker.terminate();
        };
    }, []);
    return (
        <div>
            {downloadSpeed !== null && <p>Download speed: {downloadSpeed} Mbps</p>}
            {uploadSpeed !== null && <p>Upload speed: {uploadSpeed} Mbps</p>}
            {error && <p>{error}</p>}
        </div>
    )
}

export default InternetSpeedTest;