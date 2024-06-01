// FRAME CAPTURE CONSTANTS
export const FRAME_RATE = 0.1;
export const KEYPOINT_CONFIDENCE_THRESHOLD = 0.3;
export const VERTICAL_POSE_THRESHOLD = 70;
export const HORIZONTAL_POSE_THRESHOLD = 40;
export const ANGLE_THRESHOLD = 10;
export const BRIGHTNESS_LOWER_THRESHOLD = 50;
export const BRIGHTNESS_UPPER_THRESHOLD = 200;

// AUDIO CAPTURE CONSTANTS
export const SAMPLE_SIZE = 16;
export const SAMPLE_RATE = 16000;
export const AUDIO_RATE = 3000;

// INTERNET BANDWIDTH MONITORING CONSTANTS
export const SPEED_TEST_INTERVAL = 1000*20;
export const DOWNLOAD_SPEED_THRESHOLD = 2;
export const UPLOAD_SPEED_THRESHOLD = 1;
export const DOWNLOAD_SIZE = 50000;
export const DOWNLOAD_URL = `https://eu.httpbin.org/stream-bytes/${DOWNLOAD_SIZE}`;
export const UPLOAD_SIZE = 20000;
export const UPLOAD_URL = 'https://eu.httpbin.org/post';

// S3 UPLOAD CONSTANTS
export const FRAME_API_GATEWAY_ROUTE='https://2esqoxnli5.execute-api.us-west-1.amazonaws.com/default/argus-proctoring-gen-presigned-url';