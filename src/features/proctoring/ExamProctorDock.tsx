import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

type Props = {
  stream: MediaStream;
};

const BAR_COUNT = 10;

/**
 * Small live camera and microphone meter kept on screen for the whole exam.
 * Does not stop the stream. The exam page stops it when the student submits.
 */
const ExamProctorDock: React.FC<Props> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const barsRef = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    video.srcObject = stream;
    void video.play().catch(() => undefined);
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  useEffect(() => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.65;
    source.connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    let frame = 0;
    let disposed = false;

    const paint = (level: number) => {
      barsRef.current.forEach((bar, index) => {
        if (!bar) return;
        const lit = level >= ((index + 1) / BAR_COUNT) * 0.72;
        const loud = index >= BAR_COUNT - 2;
        bar.style.backgroundColor = lit ? (loud ? '#dc2626' : '#16a34a') : '#334155';
      });
    };

    const read = () => {
      if (disposed) return;
      const audioLive = stream.getAudioTracks().some((track) => track.readyState === 'live' && track.enabled && !track.muted);
      if (!audioLive) {
        paint(0);
      } else {
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (let i = 0; i < samples.length; i += 1) {
          const sample = (samples[i] - 128) / 128;
          sum += sample * sample;
        }
        paint(Math.min(1, Math.sqrt(sum / samples.length) * 5.5));
      }
      frame = window.requestAnimationFrame(read);
    };

    void audioContext.resume().catch(() => undefined);
    frame = window.requestAnimationFrame(read);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      source.disconnect();
      void audioContext.close();
    };
  }, [stream]);

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 16,
        bottom: 88,
        zIndex: 20,
        width: 168,
        p: 1,
        borderRadius: 1,
        bgcolor: '#0f172a',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.28)',
      }}
    >
      <Box
        component="video"
        ref={videoRef}
        autoPlay
        muted
        playsInline
        sx={{
          display: 'block',
          width: '100%',
          height: 96,
          objectFit: 'cover',
          borderRadius: 0.5,
          bgcolor: '#020617',
        }}
      />
      <Box sx={{ mt: 0.75, height: 16, display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
        {Array.from({ length: BAR_COUNT }, (_, index) => (
          <Box
            key={index}
            ref={(node: HTMLDivElement | null) => {
              barsRef.current[index] = node;
            }}
            sx={{ flex: 1, height: 4 + index, borderRadius: '1px', bgcolor: '#334155' }}
          />
        ))}
      </Box>
      <Typography sx={{ mt: 0.5, fontSize: '0.68rem', fontWeight: 700, letterSpacing: 0.4, color: '#e2e8f0', textAlign: 'center' }}>
        Proctoring on
      </Typography>
    </Box>
  );
};

export default ExamProctorDock;
