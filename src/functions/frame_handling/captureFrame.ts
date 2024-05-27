import React from "react";

export const captureFrame = (
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>,
  entityWorkerRef: React.MutableRefObject<Worker | undefined>,
  poseWorkerRef: React.MutableRefObject<Worker | undefined>,
  faceLandmarksRef: React.MutableRefObject<Worker | undefined>
) => {
  if (videoRef.current && canvasRef.current) {
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const timestamp = new Date();

      const imageDataBuffer1 = new Uint8ClampedArray(imageData.data).buffer;
      const imageDataBuffer2 = new Uint8ClampedArray(imageData.data).buffer;
      const imageDataBuffer3 = new Uint8ClampedArray(imageData.data).buffer;

      entityWorkerRef.current?.postMessage({
        type: 'predict',
        imageData: imageDataBuffer1,
        width: canvas.width,
        height: canvas.height,
        timestamp
      }, [imageDataBuffer1]);
      poseWorkerRef.current?.postMessage({
        type: 'predict',
        imageData: imageDataBuffer2,
        width: canvas.width,
        height: canvas.height,
        timestamp
      }, [imageDataBuffer2]);
      faceLandmarksRef.current?.postMessage({
        type: 'predict',
        imageData: imageDataBuffer3,
        width: canvas.width,
        height: canvas.height,
        timestamp
      }, [imageDataBuffer3]);
    }
  }
};