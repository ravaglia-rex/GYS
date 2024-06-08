import { DOWNLOAD_SPEED_THRESHOLD, UPLOAD_SPEED_THRESHOLD, SPEED_TEST_INTERVAL, DOWNLOAD_URL, UPLOAD_SIZE, UPLOAD_URL } from '../constants/constants';

const testDownloadSpeed = async () => {
  const startTime = Date.now();
  try {
    const response = await fetch(DOWNLOAD_URL);
    if(!response || !response.body) {
        console.error('No response or body');
        return -1;
    }
    const reader = response.body.getReader();
    let bytesRead = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.length;
    }

    const endTime = Date.now();
    const durationInSeconds = (endTime - startTime) / 1000;
    const speedInMbps = (bytesRead * 8) / (durationInSeconds * 100000);

    return speedInMbps;
  } catch (error) {
    console.error('Error downloading file', error);
    return -1;
  }
};

const testUploadSpeed = async () => {
  const uploadSize = UPLOAD_SIZE;
  const data = new Uint8Array(uploadSize);
  const startTime = Date.now();
  try {
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: data,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });
    const endTime = Date.now();

    if (response.ok) {
      const durationInSeconds = (endTime - startTime) / 1000;
      const speedInMbps = (uploadSize * 8) / (durationInSeconds * 100000); // Convert bytes to megabits

      return speedInMbps;
    } else {
      console.error('Error uploading file', response.statusText);
      return -1;
    }
  } catch (error) {
    console.error('Error uploading file', error);
    return -1;
  }
};

const startMonitoring = () => {
  setInterval(async () => {
    const downloadSpeed = await testDownloadSpeed();
    const uploadSpeed = await testUploadSpeed();

    if (downloadSpeed < DOWNLOAD_SPEED_THRESHOLD) {
      postMessage({
        type: 'downloadSpeedLow',
        downloadSpeed,
        uploadSpeed
      });
      return;
    }
    if (uploadSpeed < UPLOAD_SPEED_THRESHOLD) {
      postMessage({
        type: 'uploadSpeedLow',
        downloadSpeed,
        uploadSpeed
      });
      return;
    }

    postMessage({
      type: 'speedTestResult',
      downloadSpeed,
      uploadSpeed,
    });
    return;
  }, SPEED_TEST_INTERVAL);
};

onmessage = (event) => {
  if (event.data === 'start') {
    startMonitoring();
  }
};
