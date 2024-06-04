import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';

let faceLandmarker: any = null;

const loadModel = async () => {
  await tf.setBackend('cpu'); // Set backend to CPU
  await tf.ready();

  const filesetResolver = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm');
  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'CPU' // Use CPU as the delegate
    },
    outputFaceBlendshapes: true,
    runningMode: 'IMAGE', // Set running mode to IMAGE
    numFaces: 1
  });
  postMessage({ type: 'modelLoaded' });
};

interface Landmark {
  index: number;
  score: number;
  categoryName: string;
  displayName: string;
}

const getEyeDirection = (landmarks: Array<Landmark>) => {
  // For looking left, the left eye should be looking out and the right eye should be looking in
  // For looking right, the right eye should be looking out and the left eye should be looking in
  // For looking up, the eyes should be looking up
  // For looking down, the eyes should be looking down
  // If we have kind of equal confidences for both directions, we can say the person is looking straight
  const directions = ['Out', 'In', 'Up', 'Down'];
  const eyeScores = directions.reduce((acc, direction) => {
    acc[`eyeLook${direction}Left`] = landmarks.find(l => l.categoryName === `eyeLook${direction}Left`)?.score || 0;
    acc[`eyeLook${direction}Right`] = landmarks.find(l => l.categoryName === `eyeLook${direction}Right`)?.score || 0;
    return acc;
  }, {} as Record<string, number>);
  const leftOutRightIn = eyeScores.eyeLookOutLeft + eyeScores.eyeLookInRight;
  const rightOutLeftIn = eyeScores.eyeLookOutRight + eyeScores.eyeLookInLeft;
  const upLeftRight = eyeScores.eyeLookUpLeft + eyeScores.eyeLookUpRight;
  const downLeftRight = eyeScores.eyeLookDownLeft + eyeScores.eyeLookDownRight;
  let direction = 'straight';
  let confidence = 0;
  if(leftOutRightIn > rightOutLeftIn && leftOutRightIn > upLeftRight && leftOutRightIn > downLeftRight){
    direction = 'left';
    confidence = leftOutRightIn;
  } else if(rightOutLeftIn > leftOutRightIn && rightOutLeftIn > upLeftRight && rightOutLeftIn > downLeftRight){
    direction = 'right';
    confidence = rightOutLeftIn;
  } else if(upLeftRight > leftOutRightIn && upLeftRight > rightOutLeftIn && upLeftRight > downLeftRight){
    direction = 'up';
    confidence = upLeftRight;
  } else if(downLeftRight > leftOutRightIn && downLeftRight > rightOutLeftIn && downLeftRight > upLeftRight){
    direction = 'down';
    confidence = downLeftRight;
  }
  return {direction, confidence};
}

const getMouthState = (landmarks: Array<Landmark>) => {
  const mouthFunnel = landmarks.find(l => l.categoryName === 'mouthFunnel')?.score || 0;
  const mouthClose = landmarks.find(l => l.categoryName === 'mouthClose')?.score || 0;

  const isOpen = mouthFunnel > mouthClose;
  const confidence = Math.max(mouthFunnel, mouthClose);
  return {isOpen, confidence};
}

const processLandmarks = (landmarks: any) => {
  const eyeDirection = getEyeDirection(landmarks);
  const mouthOpen = getMouthState(landmarks);
  return [eyeDirection, mouthOpen];
}

onmessage = async (e) => {
  if (e.data.type === 'loadModel') {
    try {
      await loadModel();
      postMessage({ type: 'modelLoaded' });
    } catch (error: any) {
      postMessage({ type: 'error', message: 'Failed to load model: ' + error.message });
    }
  } else if (e.data.type === 'predict' && faceLandmarker) {
    try {
      const imageData = new ImageData(new Uint8ClampedArray(e.data.imageData), e.data.width, e.data.height);
      const results = await faceLandmarker.detect(imageData);
      const [eye_state, mouth_state] = processLandmarks(results.faceBlendshapes[0].categories);
      postMessage({ type: 'prediction', faceLandmarks: {eye_state, mouth_state, timestamp: e.data.timestamp}, landmarks: results.faceBlendshapes[0].categories});
    } catch (error: any) {
      postMessage({ type: 'error', message: 'Failed to predict: ' + error.message });
    }
  }
};
