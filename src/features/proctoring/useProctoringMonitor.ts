import { useCallback, useEffect, useRef } from 'react';
import * as Sentry from '@sentry/react';
import { getProctoringUploadUrl, recordProctoringEvent } from './api';
import { isProctoringActive } from './config';
import type { ProctoringConfig, ProctoringEventSeverity, ProctoringEventType } from './types';

type UseProctoringMonitorOptions = {
  uid: string;
  attemptId: string | null;
  active: boolean;
  config: ProctoringConfig;
  onCameraDenied?: () => void;
};

async function uploadSnapshot(
  uid: string,
  attemptId: string,
  eventId: string,
  blob: Blob
): Promise<string | null> {
  const signed = await getProctoringUploadUrl({ uid, attempt_id: attemptId, event_id: eventId });
  await fetch(signed.upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: blob,
  });
  return signed.object_key;
}

export function useProctoringMonitor({
  uid,
  attemptId,
  active,
  config,
  onCameraDenied,
}: UseProctoringMonitorOptions) {
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const disposedRef = useRef(false);

  const reportEvent = useCallback(
    async (
      event_type: ProctoringEventType,
      severity: ProctoringEventSeverity,
      withSnapshot = false
    ) => {
      if (!uid || !attemptId || !isProctoringActive(config)) return;
      try {
        const res = await recordProctoringEvent({
          uid,
          attempt_id: attemptId,
          event_type,
          severity,
        });
        if (withSnapshot && config.snapshot_on_violation && videoRef.current) {
          const canvas = document.createElement('canvas');
          const video = videoRef.current;
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise<Blob | null>((resolve) =>
              canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85)
            );
            if (blob) {
              const key = await uploadSnapshot(uid, attemptId, res.event_id, blob);
              if (key) {
                await recordProctoringEvent({
                  uid,
                  attempt_id: attemptId,
                  event_type,
                  severity,
                  snapshot_s3_key: key,
                });
              }
            }
          }
        }
      } catch (err) {
        Sentry.captureException(err);
      }
    },
    [uid, attemptId, config]
  );

  useEffect(() => {
    if (!active || !attemptId || !uid || !isProctoringActive(config)) {
      return undefined;
    }

    disposedRef.current = false;
    let detectorDispose: (() => void) | null = null;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (disposedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;

        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();
        videoRef.current = video;

        const { loadFaceDetector } = await import('./faceDetector');
        const detector = await loadFaceDetector();
        detectorDispose = detector.dispose;

        const intervalMs = (config.check_interval_sec ?? 45) * 1000;
        intervalRef.current = window.setInterval(async () => {
          if (!videoRef.current) return;
          const result = await detector.detect(videoRef.current);
          if (result.faceCount === 0) {
            await reportEvent('face_missing', 'medium', true);
          } else if (result.faceCount > 1) {
            await reportEvent('multiple_faces', 'high', true);
          }
        }, intervalMs);
      } catch {
        onCameraDenied?.();
        await reportEvent('camera_denied', 'high', false);
      }
    };

    void start();

    return () => {
      disposedRef.current = true;
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      videoRef.current = null;
      detectorDispose?.();
    };
  }, [active, attemptId, uid, config, onCameraDenied, reportEvent]);

  return { reportEvent };
}
