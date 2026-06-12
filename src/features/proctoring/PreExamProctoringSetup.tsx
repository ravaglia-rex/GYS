import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { isProctoringActive } from './config';
import type { ProctoringConfig } from './types';

type Props = {
  config: ProctoringConfig;
  onReady: () => void;
  onBack: () => void;
};

/**
 * Pre-exam camera gate. Renders nothing when proctoring is disabled (dormant default).
 */
const PreExamProctoringSetup: React.FC<Props> = ({ config, onReady, onBack }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [faceOk, setFaceOk] = useState(false);

  useEffect(() => {
    if (!isProctoringActive(config)) return undefined;

    let stream: MediaStream | null = null;
    let intervalId: number | null = null;
    let disposed = false;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        if (disposed || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const { loadFaceDetector } = await import('./faceDetector');
        const detector = await loadFaceDetector();
        intervalId = window.setInterval(async () => {
          if (!videoRef.current) return;
          const result = await detector.detect(videoRef.current);
          setFaceOk(result.faceCount === 1);
        }, 1500);

        return () => detector.dispose();
      } catch {
        setError('Camera access is required for proctored exams. Enable your webcam and try again.');
      }
    };

    let cleanupDetector: (() => void) | undefined;
    void start().then((dispose) => {
      cleanupDetector = dispose;
    });

    return () => {
      disposed = true;
      if (intervalId != null) window.clearInterval(intervalId);
      stream?.getTracks().forEach((t) => t.stop());
      cleanupDetector?.();
    };
  }, [config]);

  if (!isProctoringActive(config)) {
    return null;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, p: 3 }}>
      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
        Proctoring setup
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 480, textAlign: 'center' }}>
        Position your face in the frame. Your camera will be checked periodically during the exam.
      </Typography>
      <Box
        component="video"
        ref={videoRef}
        autoPlay
        muted
        playsInline
        sx={{ width: 320, maxWidth: '100%', borderRadius: 2, border: '2px solid #cbd5e1', bgcolor: '#000' }}
      />
      {error ? (
        <Alert severity="error" sx={{ maxWidth: 480, width: '100%' }}>{error}</Alert>
      ) : (
        <Alert severity={faceOk ? 'success' : 'info'} sx={{ maxWidth: 480, width: '100%' }}>
          {faceOk ? 'Face detected. You can start the exam.' : 'Align your face in the camera frame.'}
        </Alert>
      )}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button onClick={onBack} color="inherit">Back</Button>
        <Button variant="contained" disabled={!faceOk || !!error} onClick={onReady}>
          Continue to exam
        </Button>
      </Box>
    </Box>
  );
};

export default PreExamProctoringSetup;
