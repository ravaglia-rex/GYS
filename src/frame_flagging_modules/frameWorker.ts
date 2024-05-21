import * as cocoSSD from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import { FlaggedFrameType, FlaggedFrame } from './frameFlagClass.ts';

let model: cocoSSD.ObjectDetection|null = null;

const loadModel = async () => {
    if(!model){
        model = await cocoSSD.load();
    }
    return model;
}

onmessage = async (e) => {
    const model = await loadModel();
    if(model && e.data.imageData){
        const predictions = await model.detect(e.data.imageData);
        let person_count = 0;
        let device_detected = false;
        let multiple_people = false;
        let person_looking_away = false; // Assume this can be detected somehow or set conditionally
        let person_speaking = false; // Assume this can be detected or set conditionally

        predictions.forEach(prediction => {
            if (['cell phone', 'laptop'].includes(prediction.class)) {
                device_detected = true;
            }
            if (prediction.class === 'person') {
                person_count++;
            }
        });

        if (person_count > 1) {
            multiple_people = true; // More than one person detected
        }

        let violation_types = [];
        if (device_detected) {
            violation_types.push(FlaggedFrameType.ALWAYSCONNECTED);
        }
        if (multiple_people) {
            violation_types.push(FlaggedFrameType.UNITEDWESTAND);
        }
        if (person_looking_away) {
            violation_types.push(FlaggedFrameType.THEOSTRICH);
        }
        if (person_speaking) {
            violation_types.push(FlaggedFrameType.CHATTERBOX);
        }
        if (violation_types.length === 0) {
            violation_types.push(FlaggedFrameType.PERFECTGUY); // No violations, normal behavior
        }

        // Create a FlaggedFrame instance with the types of violations found
        const flaggedFrame = new FlaggedFrame(violation_types, e.data.timestamp, {
            predictions: predictions.map(p => ({
                class: p.class,
                score: p.score.toFixed(2),
                bbox: p.bbox
            }))
        });

        // Send the flagged frame back to the main thread
        postMessage(predictions);
    }
}
