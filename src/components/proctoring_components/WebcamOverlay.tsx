import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import * as Sentry from '@sentry/react';
import BigSpinner from '../BigSpinner';

const WebcamOverlay: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isFaceAligned, setIsFaceAligned] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const workerRef = useRef<Worker>();
  const navigate = useNavigate();
  let mediaStream = useRef<MediaStream>();

  const handleStartExam = () => {
    setIsVideoPlaying(false);
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
      workerRef.current?.terminate();
    }
    navigate('/testing');
  };

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        mediaStream.current = stream;
        if (video) {
          video.srcObject = stream;
          video.play();
        }
      } catch (err) {
        Sentry.withScope((scope) => {
          scope.setTag('location', 'WebcamOverlay.startVideo');
          Sentry.captureException(err);
        });
      }
    };
    if (isModelLoaded && isVideoPlaying) {
      startVideo();
    }

    const drawOutline = () => {
      if (!canvas || !ctx || !isModelLoaded) {
        if (canvas && ctx) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          ctx.fillStyle = 'black';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        return;
      }

      // Set canvas dimensions to match video dimensions
      if (video) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

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

    if (isModelLoaded && video && canvas && ctx) {
      video.addEventListener('play', () => {
        drawOutline();
      });
    }

    return () => {
      if (video) {
        video.removeEventListener('play', drawOutline);
      }
    };
  }, [isVideoPlaying, isModelLoaded]);

  useEffect(() => {
    const worker = new Worker(new URL('../../frame_flagging_modules/alignmentWorker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (e) => {
      if (e.data.type === 'modelLoaded') {
        setIsModelLoaded(true);
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

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 60px)' }}>
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

      {!isModelLoaded && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
          <BigSpinner />
        </div>
      )}

      {isModelLoaded && (
        <>
          <div className="absolute bottom-4 right-4 flex items-center justify-center">
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: isFaceAligned ? 'green' : 'red', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isFaceAligned ? <Check color="white" size={30} /> : <X color="white" size={30} />}
            </div>
          </div>

          <div className="flex justify-center" style={{ position: 'absolute', bottom: '10px', width: '100%' }}>
            <button
              className={`font-bold py-2 px-4 rounded ${isFaceAligned ? 'bg-blue-500 hover:bg-blue-700 text-white cursor-pointer' : 'bg-gray-400 text-gray-700 cursor-not-allowed'}`}
              onClick={handleStartExam}
              disabled={!isFaceAligned}
            >
              Start Exam
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default WebcamOverlay;
