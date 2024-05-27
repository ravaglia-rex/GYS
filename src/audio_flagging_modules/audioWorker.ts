import * as tf from '@tensorflow/tfjs';

let audio_model: any = null;

onmessage = async (e) => {
  if (e.data.type === 'loadModel') {
    try {
      const modelUrl = 'http://localhost:3000/models/audio/model.json';
      audio_model = await tf.loadGraphModel(modelUrl, { fromTFHub: false });
      postMessage({ type: 'modelLoaded' });
    } catch (error: any) {
      postMessage({ type: 'error', message: 'Failed to load model: ' + error.message });
    }
  } else if (e.data.type === 'predict' && audio_model) {
    try {
      let audioData = new Float32Array(e.data.audioData);
      const max_val = Math.max(...e.data.audioData.map(Math.abs));
      const padding = (4 - (audioData.byteLength % 4)) % 4;
      if (padding !== 0) {
        const paddedData = new Float32Array(audioData.byteLength + padding);
        paddedData.set(audioData, padding); // Add padding at the beginning
        audioData = paddedData;
      }
      
      const normalizedData = audioData.map(sample => sample/max_val);
      const tensor = tf.tensor1d(normalizedData, 'float32');
      const predictions = await audio_model.predict(tensor);

      const scores = predictions[0];
      const meanScores = scores.mean(0);
      const topClassIndex = meanScores.argMax().dataSync()[0];

      postMessage({ type: 'prediction', classIndex: topClassIndex });
    } catch (error: any) {
      postMessage({ type: 'error', message: 'Prediction error: ' + error.message});
    }
  }
};
