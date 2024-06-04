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
      console.log(e.data.audioData);
      // const normalizedData = audioData.map(sample => sample/Math.max(...audioData));
      // const tensor = tf.tensor1d(audioData, 'float32');
      // const predictions = await audio_model.predict(tensor);

      // const scores = predictions[0];
      // const meanScores = scores.mean(0);
      // const topClassIndex = meanScores.argMax().dataSync()[0];

      postMessage({ type: 'prediction', classIndex: 0 });
    } catch (error: any) {
      postMessage({ type: 'error', message: 'Prediction error: ' + error.message});
    }
  }
};
