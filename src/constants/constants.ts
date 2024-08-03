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
export const AUDIO_RATE = 960*5;

// INTERNET BANDWIDTH MONITORING CONSTANTS
export const SPEED_TEST_INTERVAL = 1000*20;
export const DOWNLOAD_SPEED_THRESHOLD = 2;
export const UPLOAD_SPEED_THRESHOLD = 1;
export const DOWNLOAD_SIZE = 50000;
export const DOWNLOAD_URL = `https://eu.httpbin.org/stream-bytes/${DOWNLOAD_SIZE}`;
export const UPLOAD_SIZE = 20000;
export const UPLOAD_URL = 'https://eu.httpbin.org/post';
export const VIOLATION_COUNT = 3;

// S3 UPLOAD CONSTANTS
export const GEN_PRESIGNED_URLS='/argus-proctoring-gen-presigned-url';
export const STUDENTS_DATA_PHASE_1='/argusAirtableStudentsRetrieval';
export const SCHOOLS_DATA='/argusAirtableSchoolsRetrieval';

// RAZORPAY CONSTANTS
export const RAZORPAY_ORDER_EXAM='/orderExam';

// FIREBASE FUNCTIONS PATH
export const SCHOOLS_APIS = '/schools';
export const STUDENTS_APIS = '/students';
export const PHASE_1_QUERIES_APIS = '/phase1Queries';
export const EXAM_DETAILS_APIS = '/examDetails';
export const EXAM_RESPONSES_APIS = '/examResponses';
export const RAZORPAY_APIS = '/razorpay';

export const CREATE_EXPEDITED_SCHOOL='/createExpeditedSchool';
export const FETCH_SCHOOL_NAMES_AND_IDS='/fetchSchoolNamesAndIds';
export const FETCH_SCHOOL_NAME='/getSchoolDetails';

export const SIGN_UP_TRANSACTION='/runSignUpTransaction';
export const FETCH_PAYMENTS='/getPayments';
export const FETCH_EXAM_IDS='/getExamIds';

export const CHECK_EXAM_ID_USED='/checkExamIDUsed';
export const CHECK_PHASE_1_ELIBIGILITY='/getPhase1Eligibility';

export const FETCH_EXAM_DETAILS='/getExamDetails';

export const FETCH_STUDENT_DATA='/getStudentDetails';
export const UPDATE_STUDENT_DATA='/updateStudentDetails';

export const FETCH_RESULT_TOTALS='/getResultTotals';
export const FETCH_PHASE_1_RESULT_TOTALS='/getPhase1Results';

export const CREATE_RAZORPAY_CUSTOMER='/createCustomer';
export const CREATE_RAZORPAY_ORDER='/createOrder';