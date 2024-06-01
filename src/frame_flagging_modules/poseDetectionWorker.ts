import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { KEYPOINT_CONFIDENCE_THRESHOLD, VERTICAL_POSE_THRESHOLD, HORIZONTAL_POSE_THRESHOLD, ANGLE_THRESHOLD } from '../constants/constants';

let detector: poseDetection.PoseDetector | null = null;

interface Keypoint {
    x: number;
    y: number;
}

interface FaceAnchorPoints {
    nose: Keypoint;
    left_eye: Keypoint;
    right_eye: Keypoint;
    left_ear: Keypoint;
    right_ear: Keypoint;
}

interface ShoulderAnchorPoints {
    left_shoulder: Keypoint;
    right_shoulder: Keypoint;
}

interface FaceAndShoulderAnchorPoints {
    nose: Keypoint;
    left_eye: Keypoint;
    right_eye: Keypoint;
    left_ear: Keypoint;
    right_ear: Keypoint;
    left_shoulder: Keypoint;
    right_shoulder: Keypoint;
}

const detectFaceTilt = (face_points: FaceAnchorPoints): string[] => {
    const { left_eye, right_eye, left_ear, right_ear } = face_points;

    const verticalThreshold = VERTICAL_POSE_THRESHOLD;
    const horizontalThreshold = HORIZONTAL_POSE_THRESHOLD;

    // Vertical tilt calculation
    const eyeLevel = (left_eye.y + right_eye.y) / 2;
    const earLevel = (left_ear.y + right_ear.y) / 2;
    let tilt = [];

    if (eyeLevel < earLevel - verticalThreshold) {
        tilt.push('down');
    } else if (eyeLevel > earLevel + verticalThreshold) {
        tilt.push('down');
    }

    const leftDist = Math.abs(left_eye.x - left_ear.x);
    const rightDist = Math.abs(right_eye.x - right_ear.x);

    if (leftDist < rightDist - horizontalThreshold) {
        tilt.push('left');
    } else if (rightDist < leftDist - horizontalThreshold) {
        tilt.push('right');
    }

    if (tilt.length === 0) {
        return ['center'];
    }
    return tilt;
};

const detectshoulderTilt = (shoulder_points: ShoulderAnchorPoints): string => {
    // If the shoulders are not level, the person is tilting,
    // all this function does is check if person is tilted
    // or level
    // for determining this, calculate the angle of tilt and if its more than 10 degrees then the person is tilted
    const { left_shoulder, right_shoulder } = shoulder_points;
    const angle = Math.atan2(Math.abs(right_shoulder.y - left_shoulder.y), Math.abs(right_shoulder.x - left_shoulder.x)) * 180 / Math.PI;
    if (angle > ANGLE_THRESHOLD) {
        return 'tilted';
    }
    return 'level';
};

const predictAction = (pose: FaceAndShoulderAnchorPoints): string => {
    const face_tilts = detectFaceTilt({
        nose: pose.nose,
        left_eye: pose.left_eye,
        right_eye: pose.right_eye,
        left_ear: pose.left_ear,
        right_ear: pose.right_ear
    });

    const shoulder_tilt = detectshoulderTilt({
        left_shoulder: pose.left_shoulder,
        right_shoulder: pose.right_shoulder
    });

    // Analyze combinations of face and shoulder tilts to predict the action
    if (face_tilts.includes('down') && shoulder_tilt === 'level') {
        return 'Typing';
    } else if (face_tilts.includes('down') && shoulder_tilt === 'tilted') {
        return 'Writing';
    } else if (face_tilts.includes('left') || face_tilts.includes('right')) {
        return 'Looking or reacting to something sideways';
    } else if (!face_tilts.includes('down') && shoulder_tilt === 'level') {
        return 'Looking at the screen';
    }

    // Default case if no particular action is detected
    return 'No specific action detected';
};

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
            if(pose[0].keypoints.length > 0){
                const face_points: FaceAnchorPoints = {
                    nose: {x: pose[0].keypoints[0].x, y: pose[0].keypoints[0].y},
                    left_eye: {x: pose[0].keypoints[1].x, y: pose[0].keypoints[1].y},
                    right_eye: {x: pose[0].keypoints[2].x, y: pose[0].keypoints[2].y},
                    left_ear: {x: pose[0].keypoints[3].x, y: pose[0].keypoints[3].y},
                    right_ear: {x: pose[0].keypoints[4].x, y: pose[0].keypoints[4].y}
                };
                const shoulder_points: ShoulderAnchorPoints = {
                    left_shoulder: {x: pose[0].keypoints[5].x, y: pose[0].keypoints[5].y},
                    right_shoulder: {x: pose[0].keypoints[6].x, y: pose[0].keypoints[6].y}
                };
                const face_and_shoulder_points: FaceAndShoulderAnchorPoints = {
                    ...face_points,
                    ...shoulder_points
                };
                // filter out those keypoints which are below a certain confidence level
                pose[0].keypoints = pose[0].keypoints.filter((keypoint) => keypoint.score && keypoint.score > KEYPOINT_CONFIDENCE_THRESHOLD);
                let poseResults = {
                    pose,
                    action: predictAction(face_and_shoulder_points),
                    timestamp: e.data.timestamp
                };
                postMessage({type: 'prediction', poseResults});
            } else {
                postMessage({type: 'error', message: 'No keypoints found'});
            }
            input.dispose();
        } catch(error: any){
            postMessage({type: 'error', message: 'Failed to load model: '+error.message});
        }
    }
};