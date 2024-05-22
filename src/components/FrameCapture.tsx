import React, { useRef, useState, useEffect } from 'react';
import { FlaggedFrame } from '../frame_flagging_modules/frameFlagClass.ts';

const FrameCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [frameFlags, setFrameFlags] = useState<FlaggedFrame|null>(null);
  const videoWorkerRef = useRef<Worker>();
  const audioWorkerRef = useRef<Worker>();

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    return () => {
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, [intervalId]);

  useEffect(() => {
    videoWorkerRef.current = new Worker(new URL('../frame_flagging_modules/frameWorker.ts', import.meta.url), {type: 'module'});
    audioWorkerRef.current = new Worker(new URL('../audio_flagging_modules/AudioWorker.ts', import.meta.url), {type: 'module'});
    return () => {
        videoWorkerRef.current?.terminate();
        audioWorkerRef.current?.terminate();
    };
  }, []);

  useEffect(()=>{
    videoWorkerRef.current?.addEventListener('message', (event: MessageEvent)=>{
        setFrameFlags(event.data);
    });
  }, []);

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
       
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const timestamp = new Date(Date.now());
        videoWorkerRef.current?.postMessage({imageData, timestamp});
        setCount(c => c + 1);
      }
    }
  };

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreaming(true);
        const frameRate = 6;
        const newIntervalId = setInterval(captureFrame, 1000 / frameRate) as unknown as number; // Type assertion
        setIntervalId(newIntervalId);
      }
    } catch (error: any) {
      console.error('Error accessing the camera', error);
      alert('Error accessing camera: ' + error.message);
    }
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject instanceof MediaStream) {
      setFrameFlags(null);
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setStreaming(false);
    }
    if (intervalId !== null) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline muted></video>
      <div>
        {streaming ? (
          <button onClick={stopVideo}>Stop Video</button>
        ) : (
          <button onClick={startVideo}>Start Video</button>
        )}
        <p>You have recorded {count} frames.</p>
      </div>
      {frameFlags && (
        <div>
          <h2>Detections:</h2>
          {frameFlags.types.map((type, index) => (
            <div key={`type_${index}`}>
              <p>Type: {type}</p>
            </div>
          ))}
          {
            frameFlags.additionalInfo?.predictions.map((prediction:any, index:number) => (
                <div key={`prediction_${index}`}>
                    <p>Class: {prediction.class}</p>
                    <p>Confidence: {prediction.score}</p>
                    <p>Bounding Box: {prediction.bbox}</p>
                </div>
            ))
          }
          <p>Timestamp: {frameFlags.timestamp.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

export default FrameCapture;