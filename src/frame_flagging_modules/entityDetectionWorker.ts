import * as cocoSSD from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

let model: cocoSSD.ObjectDetection | null = null;

const loadModel = async () => {
  if (!model) {
    model = await cocoSSD.load();
  }
  return model;
}

onmessage = async (e) => {
  if (e.data.type === 'loadModel') {
    try {
      await loadModel();
      postMessage({ type: 'modelLoaded' });
    } catch (error: any) {
      postMessage({ type: 'error', message: 'Failed to load model: ' + error.message });
    }
  } else if (e.data.type === 'predict' && model) {
    try {
      const imageData = new ImageData(new Uint8ClampedArray(e.data.imageData), e.data.width, e.data.height);
      const predictions = await model.detect(imageData);
      let person_count = 0;
      let cell_phone_detected = false;
      let laptop_detected = false;

      predictions.forEach(prediction => {
        if (prediction.class === 'cell phone') {
          cell_phone_detected = true;
        }
        if (prediction.class === 'laptop') {
          laptop_detected = true;
        }
        if (prediction.class === 'person') {
          person_count++;
        }
      });

      const flaggedFrame = {
        person_count,
        cell_phone: cell_phone_detected,
        laptop: laptop_detected, 
        timestamp: e.data.timestamp, 
        additional_info: {
          predictions: predictions.map(p => ({
            class: p.class,
            score: p.score.toFixed(2),
            bbox: p.bbox
          }))
        }
      };

      postMessage({ type: 'prediction', flaggedFrame });
    } catch (error: any) {
      postMessage({ type: 'error', message: 'Prediction error: ' + error.message });
    }
  }
};