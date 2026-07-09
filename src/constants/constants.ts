// FIREBASE FUNCTIONS PATH
export const SCHOOLS_APIS = '/schools';
export const SCHOOL_ADMINS_APIS = '/schooladmins';
export const STUDENTS_APIS = '/students';
export const ASSESSMENTS_APIS = '/assessments';
export const PRACTICE_APIS = '/practice';
export const GAMIFICATION_APIS = '/gamification';
export const RAZORPAY_APIS = '/razorpay';
export const EMAIL_CHECK_APIS = '/emailCheck';
export const PLATFORM_ADMIN_APIS = '/platform-admin';

// Platform admin portal
export const PLATFORM_ADMIN_ME = '/me';
export const PLATFORM_ADMIN_OVERVIEW = '/overview';
export const PLATFORM_ADMIN_SCHOOLS = '/schools';
export const PLATFORM_ADMIN_STUDENTS = '/students';
export const PLATFORM_ADMIN_STUDENTS_STATS = '/students/stats';
export const PLATFORM_ADMIN_PENDING_REDEMPTIONS = '/pending-redemptions';
export const PLATFORM_ADMIN_REDEMPTION_HISTORY = '/redemption-history';
export const PLATFORM_ADMIN_FULFILL_REDEMPTION = '/fulfill-redemption';
export const PLATFORM_ADMIN_RUN_PIPELINE = '/run-pipeline';
export const PLATFORM_ADMIN_AUTHENTICATE = '/authenticate';
export const PLATFORM_ADMIN_NOTIFICATIONS = '/notifications';
export const PLATFORM_ADMIN_NOTIFICATIONS_MARK_READ = '/notifications/mark-read';
export const PLATFORM_ADMIN_NOTIFICATIONS_MARK_ALL_READ = '/notifications/mark-all-read';
export const PLATFORM_ADMIN_MARK_SCHOOL_PAID = '/mark-paid';
export const PLATFORM_ADMIN_UPDATE_SCHOOL_BILLING = '/update-billing';
export const PLATFORM_ADMIN_DELETE_SCHOOL = '/delete';
export const PLATFORM_ADMIN_BILLING_INVOICE_DOWNLOAD_URL = '/billing-invoice-download-url';

// Schools
export const CREATE_EXPEDITED_SCHOOL='/createExpeditedSchool';
export const REGISTER_SCHOOL='/registerSchool';
export const AMEND_SCHOOL_REGISTRATION='/amendSchoolRegistration';
export const RESUME_SCHOOL_CHECKOUT='/resumeSchoolCheckout';
export const LOOKUP_SCHOOL_REGISTRATION_PAYMENT='/lookupSchoolRegistrationPayment';
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
export const RECORD_PROCTORING_EVENT='/recordProctoringEvent';
export const GET_PROCTORING_UPLOAD_URL='/getProctoringUploadUrl';
export const GET_ATTEMPT_PROCTORING='/getAttemptProctoring';

// Practice bank (skill drills – authenticated)
export const GET_PRACTICE_POOL_COUNTS='/poolCounts';
export const GET_PRACTICE_QUESTIONS='/questions';
export const RECORD_PRACTICE_OUTCOME='/recordOutcome';
export const RECORD_PRACTICE_SESSION_OUTCOMES='/recordSessionOutcomes';
export const RESET_PRACTICE_PROGRESS='/resetProgress';

// Gamification (Argus Coins, QoD, rewards)
export const GET_GAMIFICATION_QOD = '/qod';
export const POST_GAMIFICATION_QOD_ANSWER = '/qod/answer';
/** @deprecated Legacy route alias — kept for older deployed backends */
export const GET_GAMIFICATION_QOD_LEGACY = '/qotd';
/** @deprecated Legacy route alias — kept for older deployed backends */
export const POST_GAMIFICATION_QOD_ANSWER_LEGACY = '/qotd/answer';
export const POST_GAMIFICATION_RECORD_DAILY_LOGIN = '/recordDailyLogin';
export const GET_GAMIFICATION_REWARDS = '/rewards';
export const POST_GAMIFICATION_REDEEM = '/redeem';

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