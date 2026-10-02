import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import VideocamIcon from '@mui/icons-material/Videocam';

type Props = {
  onReady: (stream: MediaStream) => void;
  onBack: () => void;
};

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

function streamIsLive(stream: MediaStream | null): boolean {
  if (!stream) return false;
  const videoOk = stream.getVideoTracks().some((track) => track.readyState === 'live' && track.enabled);
  const audioOk = stream.getAudioTracks().some((track) => track.readyState === 'live' && track.enabled);
  return videoOk && audioOk;
}

const ACCESS_REMOVED_MESSAGE =
  'Camera or microphone access was turned off. Allow both again in your browser settings, then press Try again.';

const PROCTORING_REQUIREMENTS = [
  'Your face must stay in the frame and be clearly visible.',
  'Sit in a well-lit room, with the light on your face rather than behind you.',
  'You must be alone. No one else in the room or in the camera frame.',
  'Look at the screen and stay seated. Do not leave the frame.',
  'Do not cover the camera, mute the microphone, or use a virtual background.',
  'No phone, notes, extra screens, or help from anyone else.',
];

function permissionErrorMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Camera and microphone access was blocked. Click the camera icon in your browser address bar, choose Allow for both, then press Try again.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'No camera or microphone was found. Connect both devices and press Try again.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Your camera or microphone is already in use by another app. Close that app and press Try again.';
  }
  return 'Could not turn on your camera and microphone. Allow both in your browser settings, then press Try again.';
}

/**
 * Pre-exam gate that turns the camera and microphone on.
 * On continue, the live stream is handed to the exam and stays on until submit.
 */
const MediaPermissionGate: React.FC<Props> = ({ onReady, onBack }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handedOffRef = useRef(false);
  const meterBarsRef = useRef<Array<HTMLDivElement | null>>([]);
  const [error, setError] = useState<string | null>(null);
  const [cameraLive, setCameraLive] = useState(false);
  const [micLive, setMicLive] = useState(false);
  const [requesting, setRequesting] = useState(true);
  const [retryToken, setRetryToken] = useState(0);

  const release = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    const cleanups: Array<() => void> = [];

    const start = async () => {
      setRequesting(true);
      setError(null);
      setCameraLive(false);
      setMicLive(false);
      stopStream(streamRef.current);
      streamRef.current = null;

      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          'This browser cannot access your camera and microphone. Use a current Chrome, Edge, or Safari window.'
        );
        setRequesting(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (disposed) {
          stopStream(stream);
          return;
        }

        const hasVideo = stream.getVideoTracks().some((track) => track.readyState === 'live');
        const hasAudio = stream.getAudioTracks().some((track) => track.readyState === 'live' && track.enabled);
        if (!hasVideo || !hasAudio) {
          stopStream(stream);
          setError(
            'Both camera and microphone are required. Check that neither device is blocked, then press Try again.'
          );
          setRequesting(false);
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setCameraLive(true);
        setMicLive(true);

        const paintMeter = (level: number) => {
          const bars = meterBarsRef.current;
          bars.forEach((bar, index) => {
            if (!bar) return;
            const threshold = (index + 1) / bars.length;
            const lit = level >= threshold * 0.72;
            const loud = index >= bars.length - 3;
            bar.style.backgroundColor = lit ? (loud ? '#dc2626' : '#16a34a') : '#e2e8f0';
          });
        };

        const syncDevices = () => {
          if (disposed) return;
          const current = streamRef.current;
          const videoTrack = current?.getVideoTracks().find((track) => track.readyState === 'live' && track.enabled);
          const audioTrack = current?.getAudioTracks().find((track) => track.readyState === 'live' && track.enabled);
          const videoOk = Boolean(videoTrack);
          const audioOk = Boolean(audioTrack && !audioTrack.muted);
          setCameraLive(videoOk);
          setMicLive(audioOk);
          if (videoRef.current) {
            videoRef.current.srcObject = videoOk && current ? current : null;
          }
          if (!audioOk) paintMeter(0);
          if (videoOk && audioOk) {
            setError(null);
          } else if (!videoOk && !audioOk) {
            setError(ACCESS_REMOVED_MESSAGE);
          } else if (!audioOk) {
            setError('Microphone is off. Turn it back on to continue. The camera stays on.');
          } else {
            setError('Camera is off. Turn it back on to continue.');
          }
        };

        stream.getVideoTracks().forEach((track) => {
          track.addEventListener('ended', syncDevices);
          track.addEventListener('mute', syncDevices);
          track.addEventListener('unmute', syncDevices);
          cleanups.push(() => {
            track.removeEventListener('ended', syncDevices);
            track.removeEventListener('mute', syncDevices);
            track.removeEventListener('unmute', syncDevices);
          });
        });
        stream.getAudioTracks().forEach((track) => {
          track.addEventListener('ended', syncDevices);
          track.addEventListener('mute', syncDevices);
          track.addEventListener('unmute', syncDevices);
          cleanups.push(() => {
            track.removeEventListener('ended', syncDevices);
            track.removeEventListener('mute', syncDevices);
            track.removeEventListener('unmute', syncDevices);
          });
        });

        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.65;
        source.connect(analyser);
        const samples = new Uint8Array(analyser.fftSize);
        let meterFrame = 0;
        const readMeter = () => {
          if (disposed) return;
          const audioTrack = stream.getAudioTracks().find((track) => track.readyState === 'live' && track.enabled && !track.muted);
          if (!audioTrack) {
            paintMeter(0);
          } else {
            analyser.getByteTimeDomainData(samples);
            let sum = 0;
            for (let i = 0; i < samples.length; i += 1) {
              const sample = (samples[i] - 128) / 128;
              sum += sample * sample;
            }
            const level = Math.min(1, Math.sqrt(sum / samples.length) * 5.5);
            paintMeter(level);
          }
          meterFrame = window.requestAnimationFrame(readMeter);
        };
        void audioContext.resume().catch(() => undefined);
        const resumeMeter = () => {
          void audioContext.resume().catch(() => undefined);
        };
        window.addEventListener('pointerdown', resumeMeter);
        meterFrame = window.requestAnimationFrame(readMeter);
        cleanups.push(() => {
          window.removeEventListener('pointerdown', resumeMeter);
          window.cancelAnimationFrame(meterFrame);
          source.disconnect();
          void audioContext.close();
          paintMeter(0);
        });

        if (navigator.permissions?.query) {
          for (const name of ['camera', 'microphone'] as PermissionName[]) {
            try {
              const status = await navigator.permissions.query({ name });
              if (disposed) return;
              const onChange = () => {
                if (status.state === 'denied') syncDevices();
              };
              status.addEventListener('change', onChange);
              cleanups.push(() => status.removeEventListener('change', onChange));
            } catch {
              /* Safari does not expose camera and microphone permission names. */
            }
          }
        }
      } catch (err) {
        if (!disposed) setError(permissionErrorMessage(err));
      } finally {
        if (!disposed) setRequesting(false);
      }
    };

    void start();

    return () => {
      disposed = true;
      cleanups.forEach((cleanup) => cleanup());
      if (!handedOffRef.current) {
        stopStream(streamRef.current);
      }
      streamRef.current = null;
    };
  }, [retryToken]);

  const handleReady = () => {
    const blocked = (message: string) => {
      setError(message);
      const current = streamRef.current;
      const videoOk = current?.getVideoTracks().some((track) => track.readyState === 'live' && track.enabled && !track.muted) ?? false;
      setCameraLive(videoOk);
      setMicLive(false);
      if (!videoOk && videoRef.current) videoRef.current.srcObject = null;
    };

    if (!streamIsLive(streamRef.current)) {
      blocked(ACCESS_REMOVED_MESSAGE);
      return;
    }

    const proceed = () => {
      if (!streamIsLive(streamRef.current)) {
        blocked(ACCESS_REMOVED_MESSAGE);
        return;
      }
      handedOffRef.current = true;
      const stream = streamRef.current;
      if (!stream) return;
      onReady(stream);
    };

    if (!navigator.permissions?.query) {
      proceed();
      return;
    }

    void Promise.all(
      (['camera', 'microphone'] as PermissionName[]).map((name) => navigator.permissions.query({ name }))
    )
      .then((statuses) => {
        if (statuses.some((status) => status.state !== 'granted')) {
          blocked(ACCESS_REMOVED_MESSAGE);
          return;
        }
        proceed();
      })
      .catch(() => proceed());
  };

  const handleBack = () => {
    release();
    onBack();
  };

  const statusChip = (label: string, on: boolean, icon: React.ReactNode) => (
    <Box
      sx={{
        width: 'calc(50% - 4px)',
        height: 36,
        px: 1.25,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        border: '1px solid #d5dbe3',
        borderRadius: 1,
        bgcolor: '#f8fafc',
        flexShrink: 0,
      }}
    >
      <Box sx={{ color: on ? '#166534' : '#64748b', display: 'flex' }}>{icon}</Box>
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a', flex: 1 }}>{label}</Typography>
      <Typography
        sx={{
          width: 36,
          textAlign: 'right',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: 0.3,
          color: on ? '#166534' : '#64748b',
        }}
      >
        {on ? 'On' : 'Off'}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#e8edf2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, md: 4 },
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 920,
          bgcolor: '#fff',
          border: '1px solid #d5dbe3',
          borderRadius: 1,
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ px: { xs: 2.5, md: 4 }, pt: { xs: 2.5, md: 3.5 }, pb: 2, borderBottom: '1px solid #e6ebf0' }}>
          <Typography sx={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a', letterSpacing: -0.2 }}>
            Video proctoring requirements
          </Typography>
          <Typography sx={{ mt: 0.75, fontSize: '0.92rem', color: '#475569', maxWidth: 640 }}>
            Allow your camera and microphone. Both must stay on before you can continue. Nothing is recorded on this screen.
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'flex-start',
            gap: { xs: 3, md: 5 },
            px: { xs: 2.5, md: 4 },
            py: { xs: 2.5, md: 3.5 },
          }}
        >
          <Box sx={{ width: { xs: '100%', md: 340 }, flexShrink: 0 }}>
            <Box
              component="video"
              ref={videoRef}
              autoPlay
              muted
              playsInline
              sx={{
                display: 'block',
                width: '100%',
                height: 255,
                borderRadius: 1,
                border: '1px solid #c5ced8',
                bgcolor: '#0f172a',
                objectFit: 'cover',
              }}
            />
            <Box sx={{ mt: 1.5, display: 'flex', gap: 1, justifyContent: 'space-between' }}>
              {statusChip('Camera', cameraLive, <VideocamIcon sx={{ fontSize: 18 }} />)}
              {statusChip('Microphone', micLive, <MicIcon sx={{ fontSize: 18 }} />)}
            </Box>
            <Box
              aria-hidden
              sx={{ mt: 1.25, height: 28, display: 'flex', alignItems: 'flex-end', gap: '4px' }}
            >
              {Array.from({ length: 16 }, (_, index) => (
                <Box
                  key={index}
                  ref={(node: HTMLDivElement | null) => {
                    meterBarsRef.current[index] = node;
                  }}
                  sx={{
                    flex: 1,
                    height: 6 + index * 1.4,
                    borderRadius: '2px',
                    bgcolor: '#e2e8f0',
                  }}
                />
              ))}
            </Box>
          </Box>

          <Box component="ol" sx={{ m: 0, p: 0, listStyle: 'none', flex: 1, minWidth: 0 }}>
            {PROCTORING_REQUIREMENTS.map((line, index) => (
              <Box key={line} component="li" sx={{ display: 'flex', gap: 1.5, mb: index === PROCTORING_REQUIREMENTS.length - 1 ? 0 : 1.25 }}>
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    mt: '1px',
                    flexShrink: 0,
                    borderRadius: '50%',
                    bgcolor: '#e8eef5',
                    color: '#1e3a5f',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {index + 1}
                </Box>
                <Typography sx={{ fontSize: '0.92rem', lineHeight: 1.45, color: '#1e293b' }}>{line}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box
          sx={{
            px: { xs: 2.5, md: 4 },
            py: 2,
            borderTop: '1px solid #e6ebf0',
            bgcolor: '#f8fafc',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1, minHeight: 40, display: 'flex', alignItems: 'center' }}>
            {error ? (
              <Typography sx={{ fontSize: '0.88rem', lineHeight: 1.45, color: '#9f1239' }}>{error}</Typography>
            ) : requesting ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <CircularProgress size={16} sx={{ color: '#1e3a5f' }} />
                <Typography sx={{ fontSize: '0.88rem', color: '#334155' }}>
                  Allow camera and microphone when your browser asks.
                </Typography>
              </Box>
            ) : (
              <Typography sx={{ fontSize: '0.88rem', color: '#334155' }}>
                {cameraLive && micLive ? 'Camera and microphone are on.' : 'Camera and microphone must both be on to continue.'}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.25, flexShrink: 0 }}>
            <Button
              onClick={handleBack}
              sx={{
                color: '#1e293b',
                border: '1px solid #c5ced8',
                bgcolor: '#fff',
                minWidth: 96,
                height: 40,
                px: 2,
                whiteSpace: 'nowrap',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: '#f1f5f9', borderColor: '#94a3b8' },
              }}
            >
              Back
            </Button>
            <Button
              variant="outlined"
              onClick={() => setRetryToken((n) => n + 1)}
              disabled={requesting || !error}
              sx={{
                visibility: error ? 'visible' : 'hidden',
                height: 40,
                minWidth: 112,
                px: 2,
                whiteSpace: 'nowrap',
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#94a3b8',
                color: '#0f172a',
                '&:hover': { borderColor: '#334155', bgcolor: '#fff' },
              }}
            >
              Try again
            </Button>
            <Button
              variant="contained"
              disabled={!cameraLive || !micLive || requesting || !!error}
              onClick={handleReady}
              sx={{
                minWidth: 120,
                height: 40,
                px: 2.5,
                whiteSpace: 'nowrap',
                textTransform: 'none',
                fontWeight: 700,
                bgcolor: '#1e3a5f',
                boxShadow: 'none',
                '&:hover': { bgcolor: '#152a45', boxShadow: 'none' },
                '&.Mui-disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' },
              }}
            >
              Continue
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MediaPermissionGate;
