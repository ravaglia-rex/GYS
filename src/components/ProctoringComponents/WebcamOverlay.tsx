import React, { useRef, useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface WebcamOverlayProps {
  setFaceAligned: React.Dispatch<React.SetStateAction<boolean>>;
}

const WebcamOverlay: React.FC<WebcamOverlayProps> = ({setFaceAligned}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isFaceAligned, setIsFaceAligned] = useState(false);
  const workerRef = useRef<Worker>();

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (video) {
          video.srcObject = stream;
          video.play();
        }
      } catch (err) {
        console.error('Error accessing webcam: ', err);
      }
    };

    if (isVideoPlaying) {
      startVideo();
    } else if (video && video.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }

    const drawOutline = () => {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw semi-transparent black overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clear the ellipse area
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      const x = canvas.width / 1.8;
      const y = canvas.height / 2.2;
      const radiusX = canvas.width / 6;
      const radiusY = canvas.height / 4;
      ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      // Reset composite operation
      ctx.globalCompositeOperation = 'source-over';

      // Draw the ellipse outline
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.stroke();

      requestAnimationFrame(drawOutline);
    };

    if (video && canvas && ctx) {
      video.addEventListener('play', () => {
        drawOutline();
      });
    }

    return () => {
      if (video) {
        video.removeEventListener('play', drawOutline);
      }
    };
  }, [isVideoPlaying]);

  useEffect(() => {
    const worker = new Worker(new URL('../../frame_flagging_modules/alignmentWorker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (e.data.type === 'modelLoaded') {
        console.log('Model loaded');
      } else if (e.data.type === 'prediction') {
        const { left_ear_x, left_ear_y, right_ear_x, right_ear_y } = e.data;
        const canvas = canvasRef.current;
        if (canvas) {
          const ellipseX = canvas.width / 1.8;
          const ellipseY = canvas.height / 2.2;
          const radiusX = canvas.width / 6;
          // Calculate whether the face is aligned by checking if the ears are within the ellipse
          const distance = Math.sqrt(
            Math.pow(left_ear_x - ellipseX, 2) + Math.pow(left_ear_y - ellipseY, 2)
          ) / radiusX +
            Math.sqrt(
              Math.pow(right_ear_x - ellipseX, 2) + Math.pow(right_ear_y - ellipseY, 2)
            ) / radiusX;
          setIsFaceAligned(distance < 2);
        }
      }
    };

    worker.postMessage({ type: 'loadModel' });

    return () => {
      worker.terminate();
    };
  }, []);

  useEffect(() => {
    const captureFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const worker = workerRef.current;

      if (video && canvas && worker) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          worker.postMessage({
            type: 'predict',
            imageData: imageData.data.buffer,
            width: canvas.width,
            height: canvas.height,
            timestamp: performance.now(),
          }, [imageData.data.buffer]);
        }
      }
    };

    let intervalId: number;

    if (isVideoPlaying) {
      intervalId = window.setInterval(captureFrame, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isVideoPlaying]);

  const handleStopVideo = () => {
    setFaceAligned(true);
    setIsVideoPlaying(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <video
        ref={videoRef}
        style={{ width: '100%', height: '100%' }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />

      <button onClick={handleStopVideo} style={{ ...buttonStyle, backgroundColor: isFaceAligned ? 'green' : 'gray' }} disabled={!isFaceAligned}>
        <Check />
      </button>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '20px',
  right: '20px',
  color: 'white',
  border: 'none',
  borderRadius: '50%',
  width: '50px',
  height: '50px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
};

export default WebcamOverlay;
