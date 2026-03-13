import admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin SDK
if (!admin.apps || admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert('/Users/srishtilodha/Desktop/Argus/Argus_India/argus-frontend/argus-india-v2-firebase-adminsdk-fbsvc-cc980e26ea.json'),
  });
}

const db = admin.firestore();

// Configuration
const OUTPUT_DIR = path.join(process.cwd(), 'school_analytics_output');

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

interface SchoolInfo {
  id: string;
  name: string;
}

interface SchoolMetrics {
  schoolId: string;
  schoolName: string;
  totalStudents: number;
  gradeBreakdown: Record<number, number>;
  phase1ExamTakers: number;
  phase2Qualified: number;
  phase2ExamTakers: number;
  phase2Paid?: number;
  phase1ToPhase2Conversion?: number;
  qualificationToCompletionRate?: number;
}

interface SchoolAnalyticsResult {
  school: SchoolInfo;
  metrics: SchoolMetrics;
  timestamp: string;
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

// Resolve school names to IDs
async function resolveSchoolIds(schoolInputs: (string | { id: string; name: string })[]): Promise<SchoolInfo[]> {
  const schools: SchoolInfo[] = [];
  
  for (const input of schoolInputs) {
    if (typeof input === 'object' && input.id) {
      // Already has ID
      schools.push({ id: input.id, name: input.name || input.id });
    } else if (typeof input === 'string') {
      // Could be ID or name
      // First, try to get by ID
      try {
        const schoolDoc = await db.collection('schools').doc(input).get();
        if (schoolDoc.exists) {
          const data = schoolDoc.data();
          schools.push({ id: input, name: data?.school_name || input });
        } else {
          // Try to find by name
          const schoolsQuery = await db.collection('schools')
            .where('school_name', '==', input)
            .limit(1)
            .get();
          
          if (!schoolsQuery.empty) {
            const doc = schoolsQuery.docs[0];
            schools.push({ id: doc.id, name: input });
          } else {
            console.warn(`⚠️  School not found: ${input}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error resolving school ${input}:`, error);
      }
    }
  }
  
  return schools;
}

// Analyze a single school
async function analyzeSchool(school: SchoolInfo): Promise<SchoolMetrics> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Analyzing: ${school.name} (${school.id})`);
  console.log(`${'='.repeat(60)}`);

  // Step 1: Query all students for the school
  console.log(`\n1️⃣  Querying students collection for school_id: ${school.id}`);
  const studentsSnapshot = await db.collection('students')
    .where('school_id', '==', school.id)
    .get();

  const students: Student[] = [];
  studentsSnapshot.forEach(doc => {
    students.push({ uid: doc.id, ...doc.data() } as Student);
  });

  console.log(`✅ Found ${students.length} students`);

  if (students.length === 0) {
    return {
      schoolId: school.id,
      schoolName: school.name,
      totalStudents: 0,
      gradeBreakdown: {},
      phase1ExamTakers: 0,
      phase2Qualified: 0,
      phase2ExamTakers: 0,
    };
  }

  // Step 2: Calculate grade-wise statistics
  console.log('\n2️⃣  Calculating grade-wise statistics...');
  const gradeBreakdown: Record<number, number> = {};
  students.forEach(student => {
    gradeBreakdown[student.grade] = (gradeBreakdown[student.grade] || 0) + 1;
  });

  console.log('\n   Grade-wise breakdown:');
  Object.keys(gradeBreakdown).sort((a, b) => Number(a) - Number(b)).forEach(grade => {
    console.log(`      Grade ${grade}: ${gradeBreakdown[Number(grade)]} students`);
  });

  // Step 3: Get all student UIDs
  const studentUids = students.map(s => s.uid);

  // Step 4: Query phase 1 submissions
  console.log('\n3️⃣  Querying phase 1 exam submissions...');
  const phase1SubmissionsByStudent: Record<string, SubmissionMapping[]> = {};
  let totalPhase1Submissions = 0;

  // Query submissions in batches
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
      if (!phase1SubmissionsByStudent[uid]) {
        phase1SubmissionsByStudent[uid] = [];
      }
      snapshot.forEach(doc => {
        const submission = { ...doc.data() } as SubmissionMapping;
        phase1SubmissionsByStudent[uid].push(submission);
        totalPhase1Submissions++;
      });
    });
  }

  const phase1ExamTakers = Object.keys(phase1SubmissionsByStudent).length;
  console.log(`✅ Found ${phase1ExamTakers} students who gave phase 1 exam`);
  console.log(`   Total phase 1 submissions: ${totalPhase1Submissions}`);

  // Step 5: Check phase 2 qualification
  console.log('\n4️⃣  Checking phase 2 qualification...');
  const qualifiedStudents: string[] = [];
  const examMappingsByStudent: Record<string, ExamMapping[]> = {};
  
  // Query exam mappings in batches
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

  // Check qualification: has phase 2 form link in student_exam_mappings
  students.forEach(student => {
    const mappings = examMappingsByStudent[student.uid] || [];
    const phase2Mapping = mappings.find(m => PHASE2_FORM_IDS.includes(m.form_link));
    
    if (phase2Mapping) {
      qualifiedStudents.push(student.uid);
    } else {
      // Check for past exam result showing qualification (fallback)
      const pastExamResult = mappings.find(m => m.form_link === PAST_EXAM_FORM_ID && m.result === true);
      if (pastExamResult) {
        qualifiedStudents.push(student.uid);
      }
    }
  });

  console.log(`✅ Found ${qualifiedStudents.length} students qualified for phase 2`);

  // Step 6: Check phase 2 exam completion
  console.log('\n5️⃣  Checking phase 2 exam completion...');
  const phase2ExamTakers: string[] = [];

  qualifiedStudents.forEach(uid => {
    const mappings = examMappingsByStudent[uid] || [];
    const phase2Mapping = mappings.find(m => PHASE2_FORM_IDS.includes(m.form_link));
    
    if (phase2Mapping && phase2Mapping.completed) {
      phase2ExamTakers.push(uid);
    }
  });

  console.log(`✅ Found ${phase2ExamTakers.length} students who gave phase 2 exam`);

  // Step 7: Check payments (optional metric)
  console.log('\n6️⃣  Checking phase 2 payments...');
  const paidStudents: string[] = [];

  if (qualifiedStudents.length > 0) {
    for (let i = 0; i < qualifiedStudents.length; i += 10) {
      const batch = qualifiedStudents.slice(i, i + 10);
      const promises = batch.map(uid =>
        db.collection('student_payment_mappings')
          .where('uid', '==', uid)
          .where('form_id', 'in', PHASE2_FORM_IDS)
          .get()
      );

      const results = await Promise.all(promises);
      results.forEach((snapshot, index) => {
        const uid = batch[index];
        if (!snapshot.empty) {
          paidStudents.push(uid);
        }
      });
    }
  }

  console.log(`✅ Found ${paidStudents.length} students who paid for phase 2`);

  // Calculate conversion rates
  const phase1ToPhase2Conversion = phase1ExamTakers > 0 
    ? ((qualifiedStudents.length / phase1ExamTakers) * 100).toFixed(2)
    : '0.00';
  
  const qualificationToCompletionRate = qualifiedStudents.length > 0
    ? ((phase2ExamTakers.length / qualifiedStudents.length) * 100).toFixed(2)
    : '0.00';

  const metrics: SchoolMetrics = {
    schoolId: school.id,
    schoolName: school.name,
    totalStudents: students.length,
    gradeBreakdown,
    phase1ExamTakers,
    phase2Qualified: qualifiedStudents.length,
    phase2ExamTakers: phase2ExamTakers.length,
    phase2Paid: paidStudents.length,
    phase1ToPhase2Conversion: parseFloat(phase1ToPhase2Conversion),
    qualificationToCompletionRate: parseFloat(qualificationToCompletionRate),
  };

  // Print summary
  console.log('\n═══════════════════════════════════════');
  console.log('   SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`   Total Students: ${metrics.totalStudents}`);
  console.log(`   Phase 1 Exam Takers: ${metrics.phase1ExamTakers}`);
  console.log(`   Phase 2 Qualified: ${metrics.phase2Qualified}`);
  console.log(`   Phase 2 Exam Takers: ${metrics.phase2ExamTakers}`);
  console.log(`   Phase 2 Paid: ${metrics.phase2Paid}`);
  console.log(`   Phase 1 → Phase 2 Conversion: ${phase1ToPhase2Conversion}%`);
  console.log(`   Qualification → Completion Rate: ${qualificationToCompletionRate}%`);
  console.log('═══════════════════════════════════════\n');

  return metrics;
}

// Main function
async function analyzeMultipleSchools(schoolInputs: (string | { id: string; name: string })[]): Promise<void> {
  try {
    console.log('🚀 Starting multi-school analytics...');
    console.log(`📋 Processing ${schoolInputs.length} school(s)\n`);
    
    ensureOutputDir();

    // Resolve school IDs
    console.log('🔍 Resolving school IDs...');
    const schools = await resolveSchoolIds(schoolInputs);
    console.log(`✅ Resolved ${schools.length} school(s)\n`);

    if (schools.length === 0) {
      console.log('❌ No valid schools found. Exiting.');
      return;
    }

    // Analyze each school
    const results: SchoolAnalyticsResult[] = [];
    
    for (let i = 0; i < schools.length; i++) {
      const school = schools[i];
      console.log(`\n[${i + 1}/${schools.length}] Processing school...`);
      
      try {
        const metrics = await analyzeSchool(school);
        results.push({
          school,
          metrics,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`❌ Error analyzing school ${school.name}:`, error);
        results.push({
          school,
          metrics: {
            schoolId: school.id,
            schoolName: school.name,
            totalStudents: 0,
            gradeBreakdown: {},
            phase1ExamTakers: 0,
            phase2Qualified: 0,
            phase2ExamTakers: 0,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Generate summary report
    console.log('\n\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('   COMPREHENSIVE SUMMARY - ALL SCHOOLS');
    console.log('═══════════════════════════════════════════════════════════════');
    
    results.forEach((result, index) => {
      const m = result.metrics;
      console.log(`\n${index + 1}. ${m.schoolName}`);
      console.log(`   Total Students: ${m.totalStudents}`);
      console.log(`   Phase 1 Exam Takers: ${m.phase1ExamTakers}`);
      console.log(`   Phase 2 Qualified: ${m.phase2Qualified}`);
      console.log(`   Phase 2 Exam Takers: ${m.phase2ExamTakers}`);
      console.log(`   Phase 2 Paid: ${m.phase2Paid || 0}`);
      if (m.phase1ToPhase2Conversion !== undefined) {
        console.log(`   Phase 1 → Phase 2 Conversion: ${m.phase1ToPhase2Conversion}%`);
      }
      if (m.qualificationToCompletionRate !== undefined) {
        console.log(`   Qualification → Completion Rate: ${m.qualificationToCompletionRate}%`);
      }
    });

    // Calculate totals
    const totals = {
      totalStudents: results.reduce((sum, r) => sum + r.metrics.totalStudents, 0),
      totalPhase1Takers: results.reduce((sum, r) => sum + r.metrics.phase1ExamTakers, 0),
      totalPhase2Qualified: results.reduce((sum, r) => sum + r.metrics.phase2Qualified, 0),
      totalPhase2Takers: results.reduce((sum, r) => sum + r.metrics.phase2ExamTakers, 0),
      totalPhase2Paid: results.reduce((sum, r) => sum + (r.metrics.phase2Paid || 0), 0),
    };

    console.log('\n═══════════════════════════════════════');
    console.log('   TOTALS ACROSS ALL SCHOOLS');
    console.log('═══════════════════════════════════════');
    console.log(`   Total Students: ${totals.totalStudents}`);
    console.log(`   Total Phase 1 Exam Takers: ${totals.totalPhase1Takers}`);
    console.log(`   Total Phase 2 Qualified: ${totals.totalPhase2Qualified}`);
    console.log(`   Total Phase 2 Exam Takers: ${totals.totalPhase2Takers}`);
    console.log(`   Total Phase 2 Paid: ${totals.totalPhase2Paid}`);
    console.log('═══════════════════════════════════════\n');

    // Save results to JSON
    const jsonPath = path.join(OUTPUT_DIR, `school_analytics_${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
    console.log(`✅ Saved detailed results to: ${jsonPath}`);

    // Save summary to CSV
    const csvData = results.map(r => ({
      school_id: r.metrics.schoolId,
      school_name: r.metrics.schoolName,
      total_students: r.metrics.totalStudents,
      grade_breakdown: JSON.stringify(r.metrics.gradeBreakdown),
      phase1_exam_takers: r.metrics.phase1ExamTakers,
      phase2_qualified: r.metrics.phase2Qualified,
      phase2_exam_takers: r.metrics.phase2ExamTakers,
      phase2_paid: r.metrics.phase2Paid || 0,
      phase1_to_phase2_conversion: r.metrics.phase1ToPhase2Conversion || 0,
      qualification_to_completion_rate: r.metrics.qualificationToCompletionRate || 0,
    }));

    const csvPath = path.join(OUTPUT_DIR, `school_analytics_summary_${Date.now()}.csv`);
    const csvHeaders = [
      'school_id', 'school_name', 'total_students', 'grade_breakdown',
      'phase1_exam_takers', 'phase2_qualified', 'phase2_exam_takers',
      'phase2_paid', 'phase1_to_phase2_conversion', 'qualification_to_completion_rate'
    ];
    fs.writeFileSync(csvPath, convertToCSV(csvData, csvHeaders));
    console.log(`✅ Saved summary CSV to: ${csvPath}`);

    // Save grade breakdown CSV
    const gradeBreakdownData: any[] = [];
    results.forEach(r => {
      Object.keys(r.metrics.gradeBreakdown).forEach(grade => {
        gradeBreakdownData.push({
          school_id: r.metrics.schoolId,
          school_name: r.metrics.schoolName,
          grade: Number(grade),
          student_count: r.metrics.gradeBreakdown[Number(grade)],
        });
      });
    });

    if (gradeBreakdownData.length > 0) {
      const gradeCsvPath = path.join(OUTPUT_DIR, `school_grade_breakdown_${Date.now()}.csv`);
      fs.writeFileSync(gradeCsvPath, convertToCSV(gradeBreakdownData, ['school_id', 'school_name', 'grade', 'student_count']));
      console.log(`✅ Saved grade breakdown CSV to: ${gradeCsvPath}`);
    }

    console.log('\n✅ Analysis complete!');
    console.log(`📁 All files saved to: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    throw error;
  }
}

// Example usage - modify this array with your school names or IDs
const SCHOOLS_TO_ANALYZE: (string | { id: string; name: string })[] = [
    // Main schools
    'Blue Bells Public School',
    'The millenium School',
    'The PSBB Millennium school',
    'Wisdom High International School',
    'Sunbeam School',
    'Birla High School, Kolkata -Vidya Mandir Society - Kolkata',
    'Utpal Shanghvi Global School',
    'Gurukul The School, Ghaziabad',
    'JBCN',
    'The Shishukunj International School',
    'Sir padampat- Kanpur',
    'Chirec International Academy',
    'St.Michael\'s school',
    'LK Singhania Education Centre, Gotan',
    'Guru Kripa Divine Grace Public School',
    'The Assam Valley School',
    'Sir padampat- Kota',
    // DTME schools
    'Miles Bronson Residential School',
    'Jayshree Periwal High School',
    'KC High',
    'aLphabet internationaL schooL',
  ];

// Run the script if executed directly
if (require.main === module) {
  if (SCHOOLS_TO_ANALYZE.length === 0) {
    console.log('⚠️  Please add schools to analyze in the SCHOOLS_TO_ANALYZE array');
    console.log('   You can use school names or school IDs');
    process.exit(1);
  }

  analyzeMultipleSchools(SCHOOLS_TO_ANALYZE)
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { analyzeMultipleSchools, analyzeSchool, resolveSchoolIds };