const SPEED_TEST_INTERVAL = 1000 * 20; // 20 seconds
const DOWNLOAD_SPEED_THRESHOLD = 2; // 2 Mbps
const UPLOAD_SPEED_THRESHOLD = 1; // 1 Mbps

const testDownloadSpeed = async () => {
  const downloadSize = 50000; // Size of the file to download in bytes
  const url = `https://eu.httpbin.org/stream-bytes/${downloadSize}`;

  const startTime = Date.now();
  try {
    const response = await fetch(url);
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
    const speedInMbps = (bytesRead * 8) / (durationInSeconds * 1000000); // Convert bytes to megabits

    return speedInMbps;
  } catch (error) {
    console.error('Error downloading file', error);
    return -1;
  }
};

const testUploadSpeed = async () => {
  const uploadSize = 200000; // Size of the data to upload in bytes
  const data = new Uint8Array(uploadSize);
  const url = 'https://eu.httpbin.org/post'; // URL that accepts POST requests

  const startTime = Date.now();
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: data,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });
    const endTime = Date.now();

    if (response.ok) {
      const durationInSeconds = (endTime - startTime) / 1000;
      const speedInMbps = (uploadSize * 8) / (durationInSeconds * 1000000); // Convert bytes to megabits

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
      });
      return;
    }
    if (uploadSpeed < UPLOAD_SPEED_THRESHOLD) {
      postMessage({
        type: 'uploadSpeedLow',
        uploadSpeed,
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
