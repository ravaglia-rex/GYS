import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert('/Users/srishtilodha/Desktop/Argus/Argus_India/argus-frontend/argus-india-v2-firebase-adminsdk-fbsvc-cc980e26ea.json'),
  });
}

const db = admin.firestore();

interface StudentSubmissionMapping {
  submission_id: string;
  form_id: string;
  submission_time: string;
  student_uid: string;
}

interface Phase2ExamResponse {
  submissionId: string;
  studentId: string;
  responseData: any;
  big5analysis?: string;
  createdAt?: any;
  student_uid?: string; // This is the field we're adding
}

/**
 * Script to add student_uid field to all documents in phase_2_exam_responses
 * by matching with student_submission_mappings using submission_id
 */
export const addStudentUidToPhase2Responses = async () => {
  console.log('🚀 Starting script to add student_uid to phase_2_exam_responses...');
  
  try {
    // Step 1: Get all documents from student_submission_mappings
    console.log('📋 Fetching student submission mappings...');
    const submissionMappingsSnapshot = await db.collection('student_submission_mappings').get();
    
    if (submissionMappingsSnapshot.empty) {
      console.log('❌ No student submission mappings found');
      return;
    }
    
    // Create a map for quick lookup: submission_id -> student_uid
    const submissionToStudentMap = new Map<string, string>();
    
    submissionMappingsSnapshot.docs.forEach((doc) => {
      const data = doc.data() as StudentSubmissionMapping;
      submissionToStudentMap.set(data.submission_id, data.student_uid);
    });
    
    console.log(`📊 Found ${submissionToStudentMap.size} submission mappings`);
    
    // Step 2: Get all documents from phase_2_exam_responses
    console.log('📋 Fetching phase 2 exam responses...');
    const phase2ResponsesSnapshot = await db.collection('phase_2_exam_responses').get();
    
    if (phase2ResponsesSnapshot.empty) {
      console.log('❌ No phase 2 exam responses found');
      return;
    }
    
    console.log(`📊 Found ${phase2ResponsesSnapshot.docs.length} phase 2 exam responses`);
    
    // Step 3: Process documents in batches to avoid overwhelming Firestore
    const batchSize = 100; // Firestore batch limit is 500, using 100 for safety
    const documents = phase2ResponsesSnapshot.docs;
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      const writeBatchInstance = db.batch();
      let batchUpdates = 0;
      
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)}...`);
      
      for (const docSnapshot of batch) {
        const data = docSnapshot.data() as Phase2ExamResponse;
        const docId = docSnapshot.id;
        
        // Skip if student_uid already exists
        if (data.student_uid) {
          skippedCount++;
          continue;
        }
        
        // Find matching student_uid from submission mappings
        const studentUid = submissionToStudentMap.get(data.submissionId);
        
        if (studentUid) {
          // Add student_uid to the document
          const docRef = db.collection('phase_2_exam_responses').doc(docId);
          writeBatchInstance.update(docRef, { student_uid: studentUid });
          batchUpdates++;
        } else {
          console.log(`⚠️  No student_uid found for submission_id: ${data.submissionId}`);
          errorCount++;
        }
      }
      
      // Commit the batch if there are updates
      if (batchUpdates > 0) {
        await writeBatchInstance.commit();
        updatedCount += batchUpdates;
        console.log(`✅ Updated ${batchUpdates} documents in this batch`);
      }
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < documents.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Final summary
    console.log('\n🎉 Script completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   • Total documents processed: ${documents.length}`);
    console.log(`   • Documents updated: ${updatedCount}`);
    console.log(`   • Documents skipped (already had student_uid): ${skippedCount}`);
    console.log(`   • Documents with errors (no matching submission_id): ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Error running script:', error);
    throw error;
  }
};

/**
 * Utility function to check the current state of the data
 */
export const checkPhase2ResponsesStatus = async () => {
  console.log('🔍 Checking current status of phase_2_exam_responses...');
  
  try {
    const snapshot = await db.collection('phase_2_exam_responses').get();
    
    let totalDocs = 0;
    let docsWithStudentUid = 0;
    let docsWithoutStudentUid = 0;
    const missingSubmissions: string[] = [];
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data() as Phase2ExamResponse;
      totalDocs++;
      
      if (data.student_uid) {
        docsWithStudentUid++;
      } else {
        docsWithoutStudentUid++;
        missingSubmissions.push(data.submissionId);
      }
    });
    
    console.log(`📊 Status Report:`);
    console.log(`   • Total documents: ${totalDocs}`);
    console.log(`   • Documents with student_uid: ${docsWithStudentUid}`);
    console.log(`   • Documents without student_uid: ${docsWithoutStudentUid}`);
    
    if (missingSubmissions.length > 0) {
      console.log(`   • Missing submission_ids: ${missingSubmissions.slice(0, 5).join(', ')}${missingSubmissions.length > 5 ? '...' : ''}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking status:', error);
    throw error;
  }
};

// If running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // First check the current status
  checkPhase2ResponsesStatus()
    .then(() => {
      console.log('\n' + '='.repeat(50));
      // Then run the update script
      return addStudentUidToPhase2Responses();
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}
