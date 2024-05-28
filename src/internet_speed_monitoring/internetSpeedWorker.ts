import NetworkSpeedCheck from "network-speed";

const testNetworkSpeed = new NetworkSpeedCheck();

const SPEED_TEST_INTERVAL = 1000 * 60; // 1 minutes
const DOWNLOAD_SPEED_THRESHOLD = 2; // 2 Mbps
const UPLOAD_SPEED_THRESHOLD = 1; // 1 Mbps

const testDownloadSpeed = async () => {
  const startTime = Date.now();
  const downloadSize = 500000;
  const url = `https://eu.httpbin.org/stream-bytes/${downloadSize}`;
  try {
    const speed = await testNetworkSpeed.checkDownloadSpeed(url, downloadSize);
    return speed.mbps;
  } catch (error: any) {
    console.error('Error downloading file', error);
    return -1;
  }
}

const testUploadSpeed = async () => {
    const options = {
        hostname: 'www.google.com',
        port: 80,
        path: '/catchers/544b09b4599c1d0200000289',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    };
    const uploadSize = 2000000;
    try{
        const speed = await testNetworkSpeed.checkUploadSpeed(options, uploadSize);
        return speed.mbps;
    } catch (error: any) {
        console.error('Error uploading file', error);
        return -1;
    }
}

const startMonitoring = () => {
    setInterval(async () => {
            const downloadSpeed = await testDownloadSpeed();
            const uploadSpeed = await testUploadSpeed();
            if(typeof downloadSpeed === 'number' && downloadSpeed < DOWNLOAD_SPEED_THRESHOLD){
                postMessage({
                    type: 'downloadSpeedLow',
                    downloadSpeed
                });
            }
            if(typeof uploadSpeed === 'number' && uploadSpeed < UPLOAD_SPEED_THRESHOLD){
                postMessage({
                    type: 'uploadSpeedLow',
                    uploadSpeed
                });
            }

            postMessage({
                type: 'speedTestResult',
                downloadSpeed,
                uploadSpeed
            });
        }, SPEED_TEST_INTERVAL);
};

onmessage = (event) => {
    if(event.data === 'start'){
        startMonitoring();
    }
};