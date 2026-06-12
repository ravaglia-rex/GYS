/**
 * Lazy-loaded MediaPipe face detector. Only imported when proctoring is enabled.
 * In dormant mode this module is never dynamically imported.
 */
export type FaceCheckResult = {
  faceCount: number;
  ok: boolean;
};

let detectorPromise: Promise<{
  detect: (video: HTMLVideoElement) => Promise<FaceCheckResult>;
  dispose: () => void;
}> | null = null;

export async function loadFaceDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const vision = await import('@mediapipe/tasks-vision');
      const { FaceDetector, FilesetResolver } = vision;
      const fileset = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );
      const faceDetector = await FaceDetector.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        minDetectionConfidence: 0.5,
      });

      return {
        async detect(video: HTMLVideoElement): Promise<FaceCheckResult> {
          if (video.readyState < 2) {
            return { faceCount: 0, ok: false };
          }
          const result = faceDetector.detectForVideo(video, performance.now());
          const faceCount = result.detections?.length ?? 0;
          return { faceCount, ok: faceCount === 1 };
        },
        dispose() {
          faceDetector.close();
        },
      };
    })();
  }
  return detectorPromise;
}
