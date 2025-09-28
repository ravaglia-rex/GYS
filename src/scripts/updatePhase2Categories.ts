import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert('/Users/srishtilodha/Desktop/Argus/Argus_India/argus-frontend/argus-talent-search-12b4f493ad6d.json'),
  });
}

const db = admin.firestore();

interface ResponseDataItem {
  key: string;
  label: string;
  type: string;
  value: string | string[];
  options?: Array<{
    id: string;
    text: string;
  }>;
  category?: {
    main: string;
    sub: string;
  };
}

interface AnswerKeyItem {
  concept: string;
  type: string;
  difficulty_level: number;
  options?: { [key: string]: { score: number } };
}

interface Phase2ExamResponse {
  responseData?: ResponseDataItem[] | any; // Handle cases where responseData might not be an array
  [key: string]: any; // Preserve other fields
}

interface Phase2AnswerKey {
  [questionId: string]: AnswerKeyItem;
}

async function fetchAnswerKey(): Promise<Phase2AnswerKey> {
  console.log('📖 Fetching answer key...');
  const answerKeyDoc = await db.collection('phase_2_answer_key').doc('phase2_exam_001').get();
  
  if (!answerKeyDoc.exists) {
    throw new Error('Answer key document not found');
  }
  
  const answerKey = answerKeyDoc.data() as Phase2AnswerKey;
  console.log(`✅ Answer key loaded with ${Object.keys(answerKey).length} questions`);
  return answerKey;
}

async function fetchAllPhase2Responses(): Promise<{ id: string; data: Phase2ExamResponse }[]> {
  console.log('📋 Fetching all phase 2 exam responses...');
  const responsesSnapshot = await db.collection('phase_2_exam_responses').get();
  
  const responses: { id: string; data: Phase2ExamResponse }[] = [];
  responsesSnapshot.forEach((doc) => {
    responses.push({
      id: doc.id,
      data: doc.data() as Phase2ExamResponse
    });
  });
  
  console.log(`✅ Found ${responses.length} student responses`);
  return responses;
}

function addCategoryToResponseData(responseData: ResponseDataItem[], answerKey: Phase2AnswerKey): {
  updatedData: ResponseDataItem[];
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Handle case where responseData is not an array or is undefined
  if (!Array.isArray(responseData)) {
    warnings.push(`⚠️  responseData is not an array, skipping document`);
    return { updatedData: responseData || [], warnings };
  }
  
  const updatedData = responseData.map((item) => {
    const answerKeyItem = answerKey[item.key];
    
    if (!answerKeyItem) {
      warnings.push(`⚠️  Question "${item.key}" not found in answer key`);
      return item; // Return unchanged
    }
    
    // Add category information
    return {
      ...item,
      category: {
        main: answerKeyItem.type,
        sub: answerKeyItem.concept
      }
    };
  });
  
  return { updatedData, warnings };
}

async function updateDocumentsInBatch(
  responses: { id: string; data: Phase2ExamResponse }[],
  answerKey: Phase2AnswerKey,
  dryRun: boolean = false
): Promise<void> {
  console.log(`🔄 Processing ${responses.length} documents${dryRun ? ' (DRY RUN)' : ''}...`);
  
  const batch = db.batch();
  let processedCount = 0;
  let totalWarnings = 0;
  
  for (const { id, data } of responses) {
    const { updatedData, warnings } = addCategoryToResponseData(data.responseData, answerKey);
    
    totalWarnings += warnings.length;
    
    // Log warnings for this document
    if (warnings.length > 0) {
      console.log(`\n📄 Document ${id}:`);
      warnings.forEach(warning => console.log(`  ${warning}`));
    }
    
    // Only update if responseData actually changed
    if (JSON.stringify(updatedData) !== JSON.stringify(data.responseData)) {
      if (!dryRun) {
        const docRef = db.collection('phase_2_exam_responses').doc(id);
        batch.update(docRef, {
          responseData: updatedData
        });
      }
      
      console.log(`✅ ${dryRun ? 'Would update' : 'Updated'} document ${id}`);
    } else {
      console.log(`⏭️  Document ${id} already has categories or no changes needed`);
    }
    
    processedCount++;
    
    // Log progress every 10 documents
    if (processedCount % 10 === 0) {
      console.log(`📊 Progress: ${processedCount}/${responses.length} documents processed`);
    }
  }
  
  if (!dryRun) {
    console.log('💾 Committing batch update...');
    await batch.commit();
    console.log('✅ Batch update completed successfully');
  } else {
    console.log('🔍 Dry run completed - no changes were made');
  }
  
  console.log(`\n📈 Summary:`);
  console.log(`  - Documents processed: ${processedCount}`);
  console.log(`  - Total warnings: ${totalWarnings}`);
  console.log(`  - Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
}

async function main() {
  try {
    console.log('🚀 Starting Phase 2 Category Update Script\n');
    
    // Check for dry-run flag
    const dryRun = process.argv.includes('--dry-run');
    if (dryRun) {
      console.log('🔍 Running in DRY RUN mode - no changes will be made\n');
    }
    
    // Fetch data
    const [answerKey, responses] = await Promise.all([
      fetchAnswerKey(),
      fetchAllPhase2Responses()
    ]);
    
    if (responses.length === 0) {
      console.log('ℹ️  No responses found to process');
      return;
    }
    
    // Process and update documents
    await updateDocumentsInBatch(responses, answerKey, dryRun);
    
    console.log('\n🎉 Script completed successfully!');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export { main as updatePhase2Categories };
