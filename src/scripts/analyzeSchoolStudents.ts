import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert('/Users/srishtilodha/Desktop/Argus/Argus_India/argus-frontend/argus-talent-search-12b4f493ad6d.json'),
  });
}

const db = admin.firestore();

// Configuration
const SCHOOL_ID = 't113qJrvxEm1ASdrbftA';
const OUTPUT_DIR = path.join(__dirname, '../../school_analysis_output');

// Phase 1 form IDs (based on grade)
const PHASE1_FORM_IDS = ['wzdOWZ', 'mRjg8v', 'mOEg8k', '3E6g8A'];
// Phase 2 form IDs
const PHASE2_FORM_IDS = ['mOGkN8', 'mVy95J'];
// Past exam result form ID
const PAST_EXAM_FORM_ID = 'npByEB';

// Interface definitions
interface Student {
  uid: string;
  first_name: string;
  last_name: string;
  school_id: string;
  grade: number;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  phone_number?: string;
}

interface SubmissionMapping {
  submission_id: string;
  form_id: string;
  submission_time: any;
  student_uid: string;
}

interface ExamMapping {
  uid: string;
  form_link: string;
  completed: boolean;
  eligibility_at?: any;
  result?: boolean | null;
}

interface PaymentMapping {
  uid: string;
  form_id: string;
  payment_status: string;
  transaction_id?: string;
  paid_on?: any;
  amount?: number;
  payment_method?: string;
}

interface Phase2ExamResponse {
  submissionId: string;
  studentId: string;
  [key: string]: any;
}

interface StudentAnalysis {
  student: Student;
  phase1Submissions: SubmissionMapping[];
  phase2Qualified: boolean;
  phase2QualifiedReason: string;
  phase2Paid: boolean;
  phase2PaymentDetails?: PaymentMapping[];
  phase2ExamTaken: boolean;
  phase2SubmissionId?: string;
  multipleSubmissions: boolean;
}

// Helper function to create output directory
function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

// Helper function to convert data to CSV
function convertToCSV(data: any[], headers: string[]): string {
  const rows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      if (value instanceof Date) return value.toISOString();
      if (value instanceof admin.firestore.Timestamp) return value.toDate().toISOString();
      return String(value).replace(/"/g, '""');
    }).map(val => `"${val}"`).join(',');
  });
  
  return [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
}

// Helper function to process Firestore data in batches
async function processInBatches<T>(
  items: string[],
  batchSize: number,
  processor: (batch: string[]) => Promise<T[]>
): Promise<T[]> {
  const results: T[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }
  return results;
}

/**
 * Main function to analyze school students
 * 
 * COLLECTION REFERENCES:
 * 1. students - Query by school_id to get all students
 * 2. student_submission_mappings - Check phase 1 submissions (form_id in PHASE1_FORM_IDS) and phase 2 (form_id = PHASE2_FORM_ID)
 * 3. student_exam_mappings - Check qualification (form_link = PHASE2_FORM_ID or form_link = PAST_EXAM_FORM_ID with result = true)
 * 4. student_payment_mappings - Check payments (form_id = PHASE2_FORM_ID)
 * 5. phase_2_exam_responses - Check if students took phase 2 exam
 */
export const analyzeSchoolStudents = async () => {
  try {
    console.log('🚀 Starting school student analysis...');
    console.log(`📊 School ID: ${SCHOOL_ID}`);
    ensureOutputDir();

    // Step 1: Query all students for the school
    console.log(`\n1️⃣  Querying students collection for school_id: ${SCHOOL_ID}`);
    const studentsSnapshot = await db.collection('students')
      .where('school_id', '==', SCHOOL_ID)
      .get();

    if (studentsSnapshot.empty) {
      console.log('❌ No students found for this school_id');
      return;
    }

    const students: Student[] = [];
    studentsSnapshot.forEach(doc => {
      students.push({ uid: doc.id, ...doc.data() } as Student);
    });

    console.log(`✅ Found ${students.length} students`);

    // Step 2: Calculate grade-wise statistics
    console.log('\n2️⃣  Calculating grade-wise statistics...');
    const gradeStats: Record<number, number> = {};
    students.forEach(student => {
      gradeStats[student.grade] = (gradeStats[student.grade] || 0) + 1;
    });

    console.log('\n═══════════════════════════════════════');
    console.log('   GRADE-WISE STATISTICS');
    console.log('═══════════════════════════════════════');
    Object.keys(gradeStats).sort((a, b) => Number(a) - Number(b)).forEach(grade => {
      console.log(`   Grade ${grade}: ${gradeStats[Number(grade)]} students`);
    });
    console.log('═══════════════════════════════════════\n');

    // Step 3: Get all student UIDs
    const studentUids = students.map(s => s.uid);

    // Step 4: Query phase 1 submissions (student_submission_mappings)
    console.log('3️⃣  Querying student_submission_mappings for phase 1 submissions...');
    const allSubmissions: SubmissionMapping[] = [];
    const submissionsByStudent: Record<string, SubmissionMapping[]> = {};

    // Query submissions for each student
    for (let i = 0; i < studentUids.length; i += 10) {
      const batch = studentUids.slice(i, i + 10);
      const promises = batch.map(uid => 
        db.collection('student_submission_mappings')
          .where('student_uid', '==', uid)
          .where('form_id', 'in', PHASE1_FORM_IDS)
          .get()
      );
      
      const results = await Promise.all(promises);
      results.forEach((snapshot, index) => {
        const uid = batch[index];
        if (!submissionsByStudent[uid]) {
          submissionsByStudent[uid] = [];
        }
        snapshot.forEach(doc => {
          const submission = { ...doc.data() } as SubmissionMapping;
          allSubmissions.push(submission);
          submissionsByStudent[uid].push(submission);
        });
      });
    }

    console.log(`✅ Found ${allSubmissions.length} total phase 1 submissions`);
    
    // Identify students with multiple submissions
    const multipleSubmissions: Record<string, SubmissionMapping[]> = {};
    Object.keys(submissionsByStudent).forEach(uid => {
      if (submissionsByStudent[uid].length > 1) {
        multipleSubmissions[uid] = submissionsByStudent[uid];
      }
    });

    console.log('\n═══════════════════════════════════════');
    console.log('   PHASE 1 SUBMISSION STATISTICS');
    console.log('═══════════════════════════════════════');
    console.log(`   Total students who gave phase 1 exam: ${Object.keys(submissionsByStudent).length}`);
    console.log(`   Total phase 1 submissions: ${allSubmissions.length}`);
    console.log(`   Students with multiple submissions: ${Object.keys(multipleSubmissions).length}`);
    if (Object.keys(multipleSubmissions).length > 0) {
      console.log('\n   ⚠️  Students with multiple submissions:');
      Object.keys(multipleSubmissions).forEach(uid => {
        const student = students.find(s => s.uid === uid);
        console.log(`      - ${student?.first_name} ${student?.last_name} (${uid}): ${multipleSubmissions[uid].length} submissions`);
      });
    }
    console.log('═══════════════════════════════════════\n');

    // Step 5: Check phase 2 qualification and completion (student_exam_mappings)
    console.log('4️⃣  Checking student_exam_mappings for phase 2 qualification and completion...');
    const qualifiedStudents: string[] = [];
    const qualificationDetails: Record<string, { 
      qualified: boolean; 
      reason: string;
      completed: boolean;
      phase2ExamMapping?: ExamMapping;
      phase2FormId?: string;
    }> = {};
    const examMappingsByStudent: Record<string, ExamMapping[]> = {};
    
    // Query exam mappings for each student
    for (let i = 0; i < studentUids.length; i += 10) {
      const batch = studentUids.slice(i, i + 10);
      const promises = batch.map(uid =>
        db.collection('student_exam_mappings')
          .where('uid', '==', uid)
          .get()
      );

      const results = await Promise.all(promises);
      results.forEach((snapshot, index) => {
        const uid = batch[index];
        if (!examMappingsByStudent[uid]) {
          examMappingsByStudent[uid] = [];
        }
        snapshot.forEach(doc => {
          examMappingsByStudent[uid].push({ ...doc.data() } as ExamMapping);
        });
      });
    }

    // Check qualification: has mOGkN8 or mVy95J (phase 2 form) in student_exam_mappings
    // Also check completion status from the same mapping
    students.forEach(student => {
      const mappings = examMappingsByStudent[student.uid] || [];
      let qualified = false;
      let completed = false;
      let reason = 'Not qualified';
      let phase2ExamMapping: ExamMapping | undefined;
      let phase2FormId: string | undefined;

      // Check for phase 2 form links (mOGkN8 or mVy95J)
      const phase2Mapping = mappings.find(m => PHASE2_FORM_IDS.includes(m.form_link));
      
      if (phase2Mapping) {
        qualified = true;
        completed = phase2Mapping.completed || false;
        phase2ExamMapping = phase2Mapping;
        phase2FormId = phase2Mapping.form_link;
        reason = completed 
          ? `Has phase 2 exam form (${phase2Mapping.form_link}) - Exam completed`
          : `Has phase 2 exam form (${phase2Mapping.form_link}) - Exam not completed`;
      } else {
        // Check for past exam result showing qualification (fallback)
        const pastExamResult = mappings.find(m => m.form_link === PAST_EXAM_FORM_ID && m.result === true);
        if (pastExamResult) {
          qualified = true;
          reason = 'Qualified based on past exam result (npByEB with result=true) but no phase 2 exam mapping found';
        }
      }

      qualificationDetails[student.uid] = { 
        qualified, 
        reason,
        completed,
        phase2ExamMapping,
        phase2FormId
      };
      if (qualified) {
        qualifiedStudents.push(student.uid);
      }
    });

    console.log(`✅ Found ${qualifiedStudents.length} qualified students`);
    console.log('\n═══════════════════════════════════════');
    console.log('   PHASE 2 QUALIFICATION STATISTICS');
    console.log('═══════════════════════════════════════');
    console.log(`   Total students qualified for phase 2: ${qualifiedStudents.length}`);
    if (qualifiedStudents.length > 0) {
      console.log('\n   Qualified students:');
      qualifiedStudents.forEach(uid => {
        const student = students.find(s => s.uid === uid);
        const details = qualificationDetails[uid];
        console.log(`      - ${student?.first_name} ${student?.last_name} (${uid})`);
        console.log(`        Reason: ${details.reason}`);
      });
    }
    console.log('═══════════════════════════════════════\n');

    // Step 6: Check payments (student_payment_mappings)
    console.log('5️⃣  Checking student_payment_mappings for phase 2 payments...');
    const paymentDetails: Record<string, PaymentMapping[]> = {};
    const paidStudents: string[] = [];

    if (qualifiedStudents.length > 0) {
      for (let i = 0; i < qualifiedStudents.length; i += 10) {
        const batch = qualifiedStudents.slice(i, i + 10);
        const promises = batch.map(uid =>
          db.collection('student_payment_mappings')
            .where('uid', '==', uid)
            .where('form_id', 'in', PHASE2_FORM_IDS) // Use array for 'in' query
            .get()
        );

        const results = await Promise.all(promises);
        results.forEach((snapshot, index) => {
          const uid = batch[index];
          if (!paymentDetails[uid]) {
            paymentDetails[uid] = [];
          }
          snapshot.forEach(doc => {
            paymentDetails[uid].push({ ...doc.data() } as PaymentMapping);
          });
          if (paymentDetails[uid].length > 0) {
            paidStudents.push(uid);
          }
        });
      }
    }

    console.log(`✅ Found ${paidStudents.length} students who paid`);
    console.log('\n═══════════════════════════════════════');
    console.log('   PHASE 2 PAYMENT STATISTICS');
    console.log('═══════════════════════════════════════');
    console.log(`   Students who paid for phase 2: ${paidStudents.length}`);
    if (paidStudents.length > 0) {
      console.log('\n   Paid students:');
      paidStudents.forEach(uid => {
        const student = students.find(s => s.uid === uid);
        const payments = paymentDetails[uid];
        console.log(`      - ${student?.first_name} ${student?.last_name} (${uid})`);
        payments.forEach(payment => {
          console.log(`        Payment Status: ${payment.payment_status}, Amount: ${payment.amount || 'N/A'}`);
        });
      });
    }
    console.log('═══════════════════════════════════════\n');

    // Step 7: Check phase 2 exam submissions (using student_exam_mappings completion status)
    console.log('6️⃣  Checking phase 2 exam completion status from student_exam_mappings...');
    const phase2ExamTakenStudents: string[] = [];
    const phase2CompletionDetails: Record<string, { completed: boolean; examMapping?: ExamMapping }> = {};

    // Use the qualification details which already have completion status
    qualifiedStudents.forEach(uid => {
      const details = qualificationDetails[uid];
      if (details.completed && details.phase2ExamMapping) {
        phase2ExamTakenStudents.push(uid);
        phase2CompletionDetails[uid] = {
          completed: true,
          examMapping: details.phase2ExamMapping
        };
      }
    });

    // Also check student_submission_mappings for submission_id (for additional details)
    const phase2Submissions: Record<string, { submissionId?: string; examMapping?: ExamMapping; formId?: string }> = {};
    
    if (phase2ExamTakenStudents.length > 0) {
      for (let i = 0; i < phase2ExamTakenStudents.length; i += 10) {
        const batch = phase2ExamTakenStudents.slice(i, i + 10);
        const promises = batch.map(uid =>
          db.collection('student_submission_mappings')
            .where('student_uid', '==', uid)
            .where('form_id', 'in', PHASE2_FORM_IDS) // Use array for 'in' query
            .get()
        );

        const results = await Promise.all(promises);
        results.forEach((snapshot, index) => {
          const uid = batch[index];
          if (!phase2Submissions[uid]) {
            phase2Submissions[uid] = {};
          }
          if (!snapshot.empty) {
            const submission = snapshot.docs[0].data() as SubmissionMapping;
            phase2Submissions[uid].submissionId = submission.submission_id;
            phase2Submissions[uid].formId = submission.form_id;
          }
          // Add exam mapping details
          phase2Submissions[uid].examMapping = phase2CompletionDetails[uid]?.examMapping;
        });
      }
    }

    console.log(`✅ Found ${phase2ExamTakenStudents.length} students who took phase 2 exam`);
    console.log('\n═══════════════════════════════════════');
    console.log('   PHASE 2 EXAM STATISTICS');
    console.log('═══════════════════════════════════════');
    console.log(`   Students who gave phase 2 exam: ${phase2ExamTakenStudents.length}`);
    if (phase2ExamTakenStudents.length > 0) {
      console.log('\n   Students who gave phase 2 exam:');
      phase2ExamTakenStudents.forEach(uid => {
        const student = students.find(s => s.uid === uid);
        const submission = phase2Submissions[uid];
        console.log(`      - ${student?.first_name} ${student?.last_name} (${uid})`);
        console.log(`        Submission ID: ${submission?.submissionId || 'N/A'}`);
      });
    }
    console.log('═══════════════════════════════════════\n');

    // Step 8: Compile comprehensive analysis
    console.log('7️⃣  Compiling comprehensive analysis...');
    const analysis: StudentAnalysis[] = students.map(student => {
      const phase1Subs = submissionsByStudent[student.uid] || [];
      const qualified = qualificationDetails[student.uid]?.qualified || false;
      const payments = paymentDetails[student.uid] || [];
      const phase2Taken = phase2ExamTakenStudents.includes(student.uid);
      const phase2Submission = phase2Submissions[student.uid];

      return {
        student,
        phase1Submissions: phase1Subs,
        phase2Qualified: qualified,
        phase2QualifiedReason: qualificationDetails[student.uid]?.reason || 'Not qualified',
        phase2Paid: payments.length > 0,
        phase2PaymentDetails: payments.length > 0 ? payments : undefined,
        phase2ExamTaken: phase2Taken,
        phase2SubmissionId: phase2Submission?.submissionId,
        multipleSubmissions: phase1Subs.length > 1
      };
    });

    // Step 9: Generate CSV files
    console.log('\n8️⃣  Generating CSV files...');

    // CSV 1: All students with basic info
    const allStudentsCSV = convertToCSV(students, [
      'uid', 'first_name', 'last_name', 'grade', 'parent_name', 
      'parent_email', 'parent_phone', 'phone_number', 'school_id'
    ]);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'all_students.csv'), allStudentsCSV);
    console.log('   ✅ Created all_students.csv');

    // CSV 2: Phase 1 submissions
    const phase1SubmissionsCSV = convertToCSV(allSubmissions, [
      'submission_id', 'student_uid', 'form_id', 'submission_time'
    ]);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'phase1_submissions.csv'), phase1SubmissionsCSV);
    console.log('   ✅ Created phase1_submissions.csv');

    // CSV 3: Students with multiple submissions
    if (Object.keys(multipleSubmissions).length > 0) {
      const multipleSubsData: any[] = [];
      Object.keys(multipleSubmissions).forEach(uid => {
        const student = students.find(s => s.uid === uid);
        multipleSubmissions[uid].forEach(sub => {
          multipleSubsData.push({
            uid,
            first_name: student?.first_name,
            last_name: student?.last_name,
            grade: student?.grade,
            submission_id: sub.submission_id,
            form_id: sub.form_id,
            submission_time: sub.submission_time,
            submission_count: multipleSubmissions[uid].length
          });
        });
      });
      const multipleSubsCSV = convertToCSV(multipleSubsData, [
        'uid', 'first_name', 'last_name', 'grade', 'submission_id',
        'form_id', 'submission_time', 'submission_count'
      ]);
      fs.writeFileSync(path.join(OUTPUT_DIR, 'multiple_submissions.csv'), multipleSubsCSV);
      console.log('   ✅ Created multiple_submissions.csv');
    }

    // CSV 4: Phase 2 qualified students
    if (qualifiedStudents.length > 0) {
      const qualifiedData = qualifiedStudents.map(uid => {
        const student = students.find(s => s.uid === uid);
        const details = qualificationDetails[uid];
        return {
          uid,
          first_name: student?.first_name,
          last_name: student?.last_name,
          grade: student?.grade,
          parent_email: student?.parent_email,
          qualified_reason: details.reason
        };
      });
      const qualifiedCSV = convertToCSV(qualifiedData, [
        'uid', 'first_name', 'last_name', 'grade', 'parent_email', 'qualified_reason'
      ]);
      fs.writeFileSync(path.join(OUTPUT_DIR, 'phase2_qualified_students.csv'), qualifiedCSV);
      console.log('   ✅ Created phase2_qualified_students.csv');
    }

    // CSV 5: Payment details
    if (paidStudents.length > 0) {
      const paymentData: any[] = [];
      paidStudents.forEach(uid => {
        const student = students.find(s => s.uid === uid);
        paymentDetails[uid].forEach(payment => {
          paymentData.push({
            uid,
            first_name: student?.first_name,
            last_name: student?.last_name,
            grade: student?.grade,
            form_id: payment.form_id,
            payment_status: payment.payment_status,
            transaction_id: payment.transaction_id,
            paid_on: payment.paid_on,
            amount: payment.amount,
            payment_method: payment.payment_method
          });
        });
      });
      const paymentCSV = convertToCSV(paymentData, [
        'uid', 'first_name', 'last_name', 'grade', 'form_id',
        'payment_status', 'transaction_id', 'paid_on', 'amount', 'payment_method'
      ]);
      fs.writeFileSync(path.join(OUTPUT_DIR, 'phase2_payments.csv'), paymentCSV);
      console.log('   ✅ Created phase2_payments.csv');
    }

    // CSV 6: Phase 2 exam takers (completed students)
    if (phase2ExamTakenStudents.length > 0) {
      const phase2TakersData = phase2ExamTakenStudents.map(uid => {
        const student = students.find(s => s.uid === uid);
        const submission = phase2Submissions[uid];
        const examMapping = qualificationDetails[uid]?.phase2ExamMapping;
        return {
          uid,
          first_name: student?.first_name,
          last_name: student?.last_name,
          grade: student?.grade,
          form_id: submission?.formId || qualificationDetails[uid]?.phase2FormId || '',
          submission_id: submission?.submissionId || '',
          eligibility_at: examMapping?.eligibility_at || '',
          completed: true
        };
      });
      const phase2TakersCSV = convertToCSV(phase2TakersData, [
        'uid', 'first_name', 'last_name', 'grade', 'form_id', 'submission_id', 'eligibility_at', 'completed'
      ]);
      fs.writeFileSync(path.join(OUTPUT_DIR, 'phase2_exam_takers.csv'), phase2TakersCSV);
      console.log('   ✅ Created phase2_exam_takers.csv');
    }

    // CSV 7: Comprehensive analysis
    const comprehensiveData = analysis.map(a => ({
      uid: a.student.uid,
      first_name: a.student.first_name,
      last_name: a.student.last_name,
      grade: a.student.grade,
      parent_email: a.student.parent_email,
      phase1_submission_count: a.phase1Submissions.length,
      multiple_submissions: a.multipleSubmissions,
      phase2_qualified: a.phase2Qualified,
      phase2_qualified_reason: a.phase2QualifiedReason,
      phase2_completed: a.phase2ExamTaken,
      phase2_paid: a.phase2Paid,
      phase2_submission_id: a.phase2SubmissionId
    }));
    const comprehensiveCSV = convertToCSV(comprehensiveData, [
      'uid', 'first_name', 'last_name', 'grade', 'parent_email',
      'phase1_submission_count', 'multiple_submissions',
      'phase2_qualified', 'phase2_qualified_reason', 'phase2_completed',
      'phase2_paid', 'phase2_submission_id'
    ]);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'comprehensive_analysis.csv'), comprehensiveCSV);
    console.log('   ✅ Created comprehensive_analysis.csv');

    // Step 10: Print final statistics
    console.log('\n═══════════════════════════════════════');
    console.log('   FINAL SUMMARY STATISTICS');
    console.log('═══════════════════════════════════════');
    console.log(`\n   Total Students: ${students.length}`);
    console.log(`\n   Grade-wise breakdown:`);
    Object.keys(gradeStats).sort((a, b) => Number(a) - Number(b)).forEach(grade => {
      console.log(`      Grade ${grade}: ${gradeStats[Number(grade)]}`);
    });
    console.log(`\n   Phase 1 Exam:`);
    console.log(`      Students who gave phase 1 exam: ${Object.keys(submissionsByStudent).length}`);
    console.log(`      Total phase 1 submissions: ${allSubmissions.length}`);
    console.log(`      Students with multiple submissions: ${Object.keys(multipleSubmissions).length}`);
    console.log(`\n   Phase 2 Qualification:`);
    console.log(`      Qualified students: ${qualifiedStudents.length}`);
    console.log(`      Paid students: ${paidStudents.length}`);
    console.log(`      Students who gave phase 2 exam: ${phase2ExamTakenStudents.length}`);
    console.log('\n═══════════════════════════════════════\n');

    console.log(`✅ Analysis complete! All CSV files saved to: ${OUTPUT_DIR}`);
    console.log(`\n📁 Collection References Used:`);
    console.log(`   1. students - Query by school_id`);
    console.log(`   2. student_submission_mappings - Phase 1 & Phase 2 submissions`);
    console.log(`   3. student_exam_mappings - Phase 2 qualification`);
    console.log(`   4. student_payment_mappings - Phase 2 payments`);
    console.log(`   5. phase_2_exam_responses - Phase 2 exam responses`);

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    throw error;
  }
};

// Run the script if executed directly
if (require.main === module) {
  analyzeSchoolStudents()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
