import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';

const GRACE_MS = 10_000;
const OFF_DEBOUNCE_MS = 400;

type Warning = {
  secondsLeft: number;
  cameraOff: boolean;
  micOff: boolean;
};

function deviceState(stream: MediaStream | null): { camera: boolean; mic: boolean } {
  if (!stream) return { camera: false, mic: false };
  return {
    camera: stream.getVideoTracks().some((track) => track.readyState === 'live' && track.enabled),
    mic: stream.getAudioTracks().some((track) => track.readyState === 'live' && track.enabled && !track.muted),
  };
}

type Options = {
  active: boolean;
  stream: MediaStream | null;
  /** Set before the app itself stops the tracks, so that does not count as the student turning a device off. */
  intentionalStopRef: MutableRefObject<boolean>;
  onEnd: () => void;
  onReplaceStream: (stream: MediaStream) => void;
};

/**
 * First time the camera or microphone drops during an exam: 10 seconds to turn it back on.
 * A second time ends the exam immediately.
 */
export function useProctorDeviceGuard({ active, stream, intentionalStopRef, onEnd, onReplaceStream }: Options) {
  const [warning, setWarning] = useState<Warning | null>(null);
  const strikesRef = useRef(0);
  const inGraceRef = useRef(false);
  const endedRef = useRef(false);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const restoreDevices = useCallback(async () => {
    if (!stream) return;
    const state = deviceState(stream);
    let videoTracks = stream.getVideoTracks().filter((track) => track.readyState === 'live' && track.enabled);
    let audioTracks = stream
      .getAudioTracks()
      .filter((track) => track.readyState === 'live' && track.enabled && !track.muted);
    try {
      if (!state.camera) {
        const video = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        videoTracks = video.getVideoTracks();
      }
      if (!state.mic) {
        const audio = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        audioTracks = audio.getAudioTracks();
      }
    } catch {
      return;
    }
    onReplaceStream(new MediaStream([...videoTracks, ...audioTracks]));
  }, [onReplaceStream, stream]);

  useEffect(() => {
    if (!active || !stream) {
      setWarning(null);
      inGraceRef.current = false;
      return undefined;
    }

    let disposed = false;
    let debounceTimer: number | null = null;
    let graceTimer: number | null = null;
    let tickTimer: number | null = null;
    const cleanups: Array<() => void> = [];

    const clearGrace = () => {
      if (graceTimer != null) window.clearTimeout(graceTimer);
      if (tickTimer != null) window.clearInterval(tickTimer);
      graceTimer = null;
      tickTimer = null;
      inGraceRef.current = false;
      setWarning(null);
    };

    const endExam = () => {
      if (disposed || endedRef.current || intentionalStopRef.current) return;
      endedRef.current = true;
      clearGrace();
      onEndRef.current();
    };

    const startGrace = () => {
      clearGrace();
      inGraceRef.current = true;
      const endsAt = Date.now() + GRACE_MS;
      const tick = () => {
        const state = deviceState(stream);
        setWarning({
          secondsLeft: Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)),
          cameraOff: !state.camera,
          micOff: !state.mic,
        });
      };
      tick();
      tickTimer = window.setInterval(tick, 250);
      graceTimer = window.setTimeout(() => {
        if (disposed || intentionalStopRef.current) return;
        const state = deviceState(stream);
        if (!state.camera || !state.mic) endExam();
        else clearGrace();
      }, GRACE_MS);
    };

    const check = () => {
      if (disposed || endedRef.current || intentionalStopRef.current) return;
      const state = deviceState(stream);
      if (state.camera && state.mic) {
        if (debounceTimer != null) window.clearTimeout(debounceTimer);
        debounceTimer = null;
        if (inGraceRef.current) clearGrace();
        return;
      }
      if (inGraceRef.current || debounceTimer != null) return;
      debounceTimer = window.setTimeout(() => {
        debounceTimer = null;
        if (disposed || endedRef.current || intentionalStopRef.current) return;
        const later = deviceState(stream);
        if (later.camera && later.mic) return;
        if (strikesRef.current >= 1) {
          endExam();
          return;
        }
        strikesRef.current += 1;
        startGrace();
      }, OFF_DEBOUNCE_MS);
    };

    const bind = (track: MediaStreamTrack) => {
      track.addEventListener('ended', check);
      track.addEventListener('mute', check);
      track.addEventListener('unmute', check);
      cleanups.push(() => {
        track.removeEventListener('ended', check);
        track.removeEventListener('mute', check);
        track.removeEventListener('unmute', check);
      });
    };
    stream.getTracks().forEach(bind);

    return () => {
      disposed = true;
      if (debounceTimer != null) window.clearTimeout(debounceTimer);
      clearGrace();
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [active, intentionalStopRef, stream]);

  return { warning, restoreDevices };
}

export function ProctorDeviceWarningDialog({
  open,
  secondsLeft,
  cameraOff,
  micOff,
  onTurnBackOn,
}: {
  open: boolean;
  secondsLeft: number;
  cameraOff: boolean;
  micOff: boolean;
  onTurnBackOn: () => void;
}) {
  const which =
    cameraOff && micOff ? 'camera and microphone are' : cameraOff ? 'camera is' : 'microphone is';
  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(15, 23, 42, 0.62)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          },
        },
        paper: {
          sx: {
            bgcolor: '#fff',
            color: '#0f172a',
            backgroundImage: 'none',
            borderRadius: 2,
            maxWidth: 480,
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.45)',
            textAlign: 'center',
          },
        },
      }}
    >
      <DialogTitle sx={{ px: { xs: 2.5, sm: 3.5 }, pt: { xs: 3, sm: 3.5 }, pb: 1, fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>
        Turn your {cameraOff && micOff ? 'camera and microphone' : cameraOff ? 'camera' : 'microphone'} back on
      </DialogTitle>
      <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 0, pb: 1 }}>
        <DialogContentText component="div" sx={{ m: 0, color: '#334155', typography: 'body1', lineHeight: 1.65, fontSize: '1rem' }}>
          Your {which} off. Turn {cameraOff && micOff ? 'both' : 'it'} back on to continue the exam.
          <Box component="p" sx={{ mt: 1.5, mb: 0, fontWeight: 800, fontSize: '1.15rem', color: '#b91c1c' }}>
            Turn back on ({secondsLeft}s)
          </Box>
          <Box component="p" sx={{ mt: 1, mb: 0, color: '#334155' }}>
            If you do not turn it back on in time, this attempt will end. If you turn a device off again, the exam ends immediately.
          </Box>
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2.5, sm: 3.5 }, pb: { xs: 3, sm: 3.5 }, pt: 1.5, justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<VideocamIcon />}
          onClick={onTurnBackOn}
          autoFocus
          sx={{ fontWeight: 800, px: 3, py: 1.1, minWidth: 240, bgcolor: '#1e3a5f', '&:hover': { bgcolor: '#152a45' } }}
        >
          Turn back on
        </Button>
      </DialogActions>
    </Dialog>
  );
}
