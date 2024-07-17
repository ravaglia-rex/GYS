import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { KEYPOINT_CONFIDENCE_THRESHOLD } from '../constants/constants';

let detector: poseDetection.PoseDetector | null = null;

onmessage = async (e) => {
  if (e.data.type === 'loadModel') {
    try {
      await tf.setBackend('webgl');
      await tf.ready();
      const model = poseDetection.SupportedModels.MoveNet;
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
      };
      detector = await poseDetection.createDetector(model, detectorConfig);
      postMessage({ type: 'modelLoaded' });
    } catch (error: any) {
      postMessage({ type: 'error', message: 'Failed to load model: ' + error.message });
    }
  } else if (e.data.type === 'predict' && detector) {
    try {
      const imageData = new ImageData(new Uint8ClampedArray(e.data.imageData), e.data.width, e.data.height);
      const input = tf.browser.fromPixels(imageData);
      let poses = await detector.estimatePoses(input, {
        flipHorizontal: false,
      });
      input.dispose();

      // We are only interested in the first person. The first person is the one closest to the camera
      if (poses[0].keypoints.length > 0) {
        // Filter out those keypoints which are below a certain confidence level
        poses[0].keypoints = poses[0].keypoints.filter((keypoint) => keypoint.score && keypoint.score > KEYPOINT_CONFIDENCE_THRESHOLD);
        // Get me the x and y coordinates of the left ear and right ear
        const left_ear = poses[0].keypoints.find(keypoint => keypoint.name === 'left_ear');
        const right_ear = poses[0].keypoints.find(keypoint => keypoint.name === 'right_ear');

        if (left_ear && right_ear) {
          postMessage({
            type: 'prediction',
            left_ear_x: left_ear?.x,
            left_ear_y: left_ear?.y,
            right_ear_x: right_ear?.x,
            right_ear_y: right_ear?.y,
            timestamp: e.data.timestamp,
          });
        } else {
          postMessage({ type: 'error', message: 'No ear keypoint found' });
        }
      } else {
        postMessage({ type: 'error', message: 'No keypoints found' });
      }
    } catch (error: any) {
      postMessage({ type: 'error', message: 'Failed to predict: ' + error.message });
    }
  }
};
