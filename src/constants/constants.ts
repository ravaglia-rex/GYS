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
export const DOWNLOAD_SPEED_THRESHOLD = 1;
export const UPLOAD_SPEED_THRESHOLD = 0.5;
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
export const SCHOOL_ADMINS_APIS = '/schooladmins';
export const STUDENTS_APIS = '/students';
export const ASSESSMENTS_APIS = '/assessments';
export const PRACTICE_APIS = '/practice';
export const RAZORPAY_APIS = '/razorpay';
export const EMAIL_CHECK_APIS = '/emailCheck';

// Schools
export const CREATE_EXPEDITED_SCHOOL='/createExpeditedSchool';
export const REGISTER_SCHOOL='/registerSchool';
export const SUBMIT_INSTITUTION_DEMO_REQUEST='/submitInstitutionDemoRequest';
export const AMEND_SCHOOL_REGISTRATION='/amendSchoolRegistration';
export const RESUME_SCHOOL_CHECKOUT='/resumeSchoolCheckout';
export const FETCH_SCHOOL_NAME='/getSchoolDetails';
export const CHECK_SCHOOL_EMAIL = '/checkSchoolEmail';
export const VERIFY_SCHOOL_EMAIL = '/verifySchoolEmail';
export const VERIFY_SCHOOL_ADMIN_AND_SEND_PASSWORD_SETUP = '/verifySchoolAdminAndSendPasswordSetup';
export const RESOLVE_REGISTRATION_SCHOOL = '/resolveRegistrationSchool';

// Students
export const SIGN_UP_TRANSACTION='/runSignUpTransaction';
export const PREPARE_SIGN_UP_TRANSACTION='/prepareSignUpTransaction';
export const FETCH_STUDENT_DATA='/getStudentDetails';
export const UPDATE_STUDENT_DATA='/updateStudentDetails';
export const FETCH_PAYMENTS='/getPayments';
export const FETCH_STUDENT_SCHOOL_LEADERBOARD='/schoolLeaderboard';
export const LIST_STUDENT_REPORTS='/listReports';
export const STUDENT_REPORT_DOWNLOAD_URL='/reportDownloadUrl';
export const SEND_NOTIFICATION_EMAILS='/sendNotificationEmails';

// School admins
export const FETCH_SCHOOL_ADMIN_DATA='/getSchoolAdminDetails';
export const FETCH_SCHOOL_DASHBOARD='/getSchoolDashboard';
export const STUDENT_REGISTRATION_EMAILS='/studentRegistrationEmails';
export const UPDATE_SCHOOL_PROFILE='/schoolProfile';
export const DISMISS_SCHOOL_TUTORIAL='/tutorialDismissal';
export const QUARTERLY_REPORTS='/quarterlyReports';
export const QUARTERLY_REPORT_DOWNLOAD_URL='/quarterlyReportDownloadUrl';
export const BILLING_INVOICE_DOWNLOAD_URL='/billingInvoiceDownloadUrl';
export const SCHOOL_NOTIFICATIONS='/notifications';
export const SCHOOL_SEND_NOTIFICATION_EMAILS='/sendNotificationEmails';

// Assessments
export const GET_ASSESSMENT_CONFIG='/getAssessmentConfig';
export const GET_STUDENT_ASSESSMENTS='/getStudentAssessments';
export const INITIALIZE_EXAM='/initializeExam';
export const RECORD_ANSWER='/recordAnswer';
export const COMPLETE_EXAM='/completeExam';
export const ABANDON_EXAM='/abandonExam';
export const REPORT_QUESTION_PROBLEM='/reportQuestionProblem';

// Practice bank (skill drills – authenticated)
export const GET_PRACTICE_POOL_COUNTS='/poolCounts';
export const GET_PRACTICE_QUESTIONS='/questions';
export const RECORD_PRACTICE_OUTCOME='/recordOutcome';
export const RECORD_PRACTICE_SESSION_OUTCOMES='/recordSessionOutcomes';
export const RESET_PRACTICE_PROGRESS='/resetProgress';

// Razorpay
export const CREATE_SCHOOL_RAZORPAY_ORDER='/createSchoolOrder';
export const VERIFY_SCHOOL_RAZORPAY_PAYMENT='/verifySchoolPayment';
export const MARK_SCHOOL_WIRE_TRANSFER_ATTEMPT='/markSchoolWireTransferAttempt';
export const CREATE_SCHOOL_UPGRADE_ORDER='/createSchoolUpgradeOrder';
export const VERIFY_SCHOOL_UPGRADE_PAYMENT='/verifySchoolUpgradePayment';
export const CREATE_STUDENT_REGISTRATION_ORDER = '/createStudentRegistrationOrder';
export const VERIFY_STUDENT_REGISTRATION_PAYMENT = '/verifyStudentRegistrationPayment';
export const CREATE_STUDENT_UPGRADE_ORDER = '/createStudentUpgradeOrder';
export const VERIFY_STUDENT_UPGRADE_PAYMENT = '/verifyStudentUpgradePayment';

// Email check
export const CHECK_EMAIL_EXISTS='/checkEmailExists';

// Temporary launch gate: keep official student exams hidden until real question banks are ready.
export const STUDENT_OFFICIAL_ASSESSMENTS_ENABLED = false;