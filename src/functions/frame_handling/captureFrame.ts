import React from "react";
import { BRIGHTNESS_LOWER_THRESHOLD, BRIGHTNESS_UPPER_THRESHOLD } from "../../constants/constants";
import { pushFrameData } from "../object_storage/push_frame_data";
import { pushStateData } from "../object_storage/push_state_data";
import { internetSpeedState } from "../../state_data/internetSpeedSlice";
import { tabSwitchingState } from "../../state_data/tabSwitchingSlice";

export const captureFrame = (
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>,
  user_id: string,
  entityWorkerRef: Worker,
  poseWorkerRef: Worker,
  faceLandmarksRef: Worker
) => {
  if (videoRef.current && canvasRef.current) {
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d', {willReadFrequently: true});
    if (context) {
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const timestamp = new Date();

      const imageDataBuffer1 = new Uint8ClampedArray(imageData.data).buffer;
      const imageDataBuffer2 = new Uint8ClampedArray(imageData.data).buffer;
      const imageDataBuffer3 = new Uint8ClampedArray(imageData.data).buffer;

      entityWorkerRef.postMessage({
        type: 'predict',
        imageData: imageDataBuffer1,
        width: canvas.width,
        height: canvas.height,
        timestamp
      }, [imageDataBuffer1]);

      poseWorkerRef.postMessage({
        type: 'predict',
        imageData: imageDataBuffer2,
        width: canvas.width,
        height: canvas.height,
        timestamp
      }, [imageDataBuffer2]);
      faceLandmarksRef.postMessage({
        type: 'predict',
        imageData: imageDataBuffer3,
        width: canvas.width,
        height: canvas.height,
        timestamp
      }, [imageDataBuffer3]);


      canvas.toBlob(async (blob) => {
        if (blob) {
          const arrayBuffer = await blob.arrayBuffer();
          pushFrameData(user_id, 'abcd', timestamp.toISOString(), arrayBuffer);
        }
      }, 'image/png');
    }
  }
};

export const analyzeLighting = (
  videoRef: React.RefObject<HTMLVideoElement>,
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>
  ): boolean => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
    if (!context) return false;

    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
      totalBrightness += brightness;
    }

    const averageBrightness = totalBrightness / (data.length / 4);

    return averageBrightness > BRIGHTNESS_LOWER_THRESHOLD && averageBrightness < BRIGHTNESS_UPPER_THRESHOLD;
  }
  return false;
};

type states_type = [React.MutableRefObject<any[]>, React.MutableRefObject<any[]>, React.MutableRefObject<any[]>, internetSpeedState, tabSwitchingState];

export const triggerMetadataUpdate = async (event_type: string, event_data: any, states: states_type, user_id: string) => {
  switch (event_type) {
    case 'entityDetection':
      states[0].current.push(event_data);
      break;
    case 'poseDetection':
      states[1].current.push(event_data);
      break;
    case 'faceLandmarks':
      states[2].current.push(event_data);
      break;
    default:
      break;
  }
  if(states[0].current.length >= 1 && states[1].current.length >= 1 && states[2].current.length >= 1){
    // upload to object storage and reset states
    const entityDetectionState = states[0].current[states[0].current.length - 1];
    const poseDetectionState = states[1].current[states[1].current.length - 1];
    const faceLandmarksState = states[2].current[states[2].current.length - 1];
    const currentState = {
      "entity_detection": entityDetectionState,
      "pose_detection": poseDetectionState,
      "face_landmarks": faceLandmarksState,
      "internet_speed": {
        "upload_speed": states[3].upload_speed,
        "download_speed": states[3].download_speed,
        "timestamp": states[3].timestamp
      },
      "tab_switching": {
        "tab_switched": states[4].tab_switch_count,
        "timestamp": states[4].timestamp
      }
    };
    
    pushStateData(user_id, 'abcd', entityDetectionState.timestamp.toISOString(), currentState);
    states[0].current = [];
    states[1].current = [];
    states[2].current = [];
  }
};