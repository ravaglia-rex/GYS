import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

let detector: poseDetection.PoseDetector | null = null;

onmessage = async (e) => {
    if(e.data.type==='loadModel'){
        try {
            await tf.setBackend('webgl');
            await tf.ready();
            const model = poseDetection.SupportedModels.MoveNet;
            const detectorConfig = {
                modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
            };
            detector = await poseDetection.createDetector(model, detectorConfig);
            postMessage({type: 'modelLoaded'});
        } catch(error: any){
            postMessage({type: 'error', message: 'Failed to load model: '+error.message});
        }
    } else if (e.data.type==='predict' && detector){
        try{
            const imageData = new ImageData(new Uint8ClampedArray(e.data.imageData), e.data.width, e.data.height);
            const input = tf.browser.fromPixels(imageData);
            let pose = await detector.estimatePoses(input, {
                flipHorizontal: false,
            });
            const poseResults = {pose, timestamp: e.data.timestamp};
            postMessage({type: 'prediction', poseResults});
            input.dispose();
        } catch(error: any){
            postMessage({type: 'error', message: 'Failed to load model: '+error.message});
        }
    }
};