import React, { useRef, useState, useEffect } from 'react';

const FrameCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [intervalId, setIntervalId] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [detections, setDetections] = useState<any[]>([]);
  const workerRef = useRef<Worker>();

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    return () => {
      if (intervalId !== null) clearInterval(intervalId);
    };
  }, [intervalId]);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../frame_flagging_modules/frameWorker.ts', import.meta.url), {type: 'module'});
    return () => {
        workerRef.current?.terminate();
    };
  }, []);

  useEffect(()=>{
    workerRef.current?.addEventListener('message', (event: MessageEvent)=>{
        setDetections(event.data);
    });
  }, []);

  const drawDetections = (detections: any[]) => {
    const context = canvasRef.current?.getContext('2d');
    if(context){
        detections.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            context.strokeRect(x, y, width, height);
            context.fillText(prediction.class, x, y);
        });
    }
  };

  useEffect(() => {
    if(detections.length>0){
        drawDetections(detections);
        console.log(detections);
    }
  }, [detections]);

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        workerRef.current?.postMessage({imageData});
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
        const frameRate = 1;
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
      {detections.length > 0 && (
        <div>
          <h2>Detections:</h2>
          {detections.map((detection, index) => (
            <div key={index}>
              <p>Class: {detection.class}</p>
              <p>Score: {detection.score.toFixed(2)}</p>
              <p>BBox: {detection.bbox.join(', ')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FrameCapture;