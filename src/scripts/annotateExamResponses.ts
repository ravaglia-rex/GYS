import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert('/Users/srishtilodha/Desktop/Argus/Argus_India/argus-frontend/argus-talent-search-12b4f493ad6d.json'),
  });
}

const db = admin.firestore();

// Type definitions
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
  correct?: boolean; // Will be added for non-big5 questions
  trait?: string; // Will be added for big5 questions
  traitScore?: number; // Will be added for big5 questions
}

interface AnswerKeyItem {
  type: string;
  concept: string;
  difficulty_level: number;
  correct_answer?: string[]; // For math, reading, writing, logic questions
  options?: { // For big5 questions
    [key: string]: {
      uuid: string;
      score: number;
    };
  };
}

interface Phase2ExamResponse {
  submissionId: string;
  studentId: string;
  responseData?: ResponseDataItem[];
  typeTotals?: Record<string, number | object>; // Will be updated with big5 object
  [key: string]: any; // Preserve other fields
}

interface Phase2AnswerKey {
  [questionId: string]: AnswerKeyItem;
}

interface Big5Totals {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

// Big5 trait mapping from concept to lowercase key
const TRAIT_MAPPING: Record<string, keyof Big5Totals> = {
  'Openness': 'openness',
  'Conscientiousness': 'conscientiousness',
  'Extraversion': 'extraversion',
  'Agreeableness': 'agreeableness',
  'Neuroticism': 'neuroticism'
};

/**
 * Fetch the answer key from Firestore
 */
async function fetchAnswerKey(): Promise<Phase2AnswerKey> {
  // Try to fetch from a document first (like in the existing script)
  const answerKeyDoc = await db.collection('phase_2_answer_key').doc('phase2_exam_001').get();
  
  if (answerKeyDoc.exists) {
    const answerKey = answerKeyDoc.data() as Phase2AnswerKey;
    return answerKey;
  }
  
  // If document doesn't exist, try to fetch all documents from the collection
  const answerKeySnapshot = await db.collection('phase_2_answer_key').get();
  
  if (answerKeySnapshot.empty) {
    throw new Error('No answer key documents found in phase_2_answer_key collection');
  }
  
  // Merge all documents into a single answer key
  const answerKey: Phase2AnswerKey = {};
  answerKeySnapshot.docs.forEach(doc => {
    const data = doc.data();
    Object.assign(answerKey, data);
  });
  
  return answerKey;
}

/**
 * Fetch all phase 2 exam responses
 */
async function fetchAllPhase2Responses(): Promise<{ id: string; data: Phase2ExamResponse }[]> {
  const responsesSnapshot = await db.collection('phase_2_exam_responses').get();
  
  const responses: { id: string; data: Phase2ExamResponse }[] = [];
  responsesSnapshot.forEach((doc) => {
    responses.push({
      id: doc.id,
      data: doc.data() as Phase2ExamResponse
    });
  });
  
  return responses;
}

/**
 * Check if two arrays have the same elements (order doesn't matter)
 */
function arraysEqual(arr1: string[], arr2: string[]): boolean {
  if (arr1.length !== arr2.length) return false;
  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();
  return sorted1.every((val, index) => val === sorted2[index]);
}

/**
 * Process a single response item and add annotations
 */
function processResponseItem(
  item: ResponseDataItem, 
  answerKey: Phase2AnswerKey
): {
  updatedItem: ResponseDataItem;
  traitScore?: number;
  traitName?: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  const answerKeyItem = answerKey[item.key];
  
  if (!answerKeyItem) {
    warnings.push(`Question "${item.key}" not found in answer key`);
    return { updatedItem: item, warnings };
  }
  
  let updatedItem: ResponseDataItem = { ...item };
  
  // Handle Big5 questions
  if (answerKeyItem.type === 'big5') {
    if (!answerKeyItem.options) {
      warnings.push(`Big5 question "${item.key}" has no options in answer key`);
      return { updatedItem, warnings };
    }
    
    // Find matching option by UUID
    let selectedScore = 0;
    
    if (typeof item.value === 'string') {
      // Single selection
      const option = Object.values(answerKeyItem.options).find(opt => opt.uuid === item.value);
      if (option) {
        selectedScore = option.score;
      } else {
        warnings.push(`Big5 question "${item.key}" selected option "${item.value}" not found in answer key`);
      }
    } else if (Array.isArray(item.value)) {
      // Multiple selections - sum the scores
      for (const selectedUuid of item.value) {
        const option = Object.values(answerKeyItem.options).find(opt => opt.uuid === selectedUuid);
        if (option) {
          selectedScore += option.score;
        } else {
          warnings.push(`Big5 question "${item.key}" selected option "${selectedUuid}" not found in answer key`);
        }
      }
    }
    
    // Add trait score to the item (trait name already exists in category.sub)
    updatedItem = {
      ...updatedItem,
      traitScore: selectedScore
    };
    
    return {
      updatedItem,
      traitScore: selectedScore,
      traitName: item.category?.sub, // Use existing trait from category.sub
      warnings
    };
  }
  
  // Handle other question types (math, reading, writing, logic)
  if (!answerKeyItem.correct_answer) {
    warnings.push(`Question "${item.key}" of type "${answerKeyItem.type}" has no correct_answer in answer key`);
    return { updatedItem, warnings };
  }
  
  // Compare selected answer(s) with correct answer(s)
  let isCorrect = false;
  
  if (typeof item.value === 'string') {
    // Single selection
    isCorrect = answerKeyItem.correct_answer.includes(item.value);
  } else if (Array.isArray(item.value)) {
    // Multiple selections
    isCorrect = arraysEqual(item.value, answerKeyItem.correct_answer);
  }
  
  // Add correctness information to the item
  updatedItem = {
    ...updatedItem,
    correct: isCorrect
  };
  
  return { updatedItem, warnings };
}

/**
 * Process all response data for a student and calculate Big5 totals
 */
function processResponseData(
  responseData: ResponseDataItem[], 
  answerKey: Phase2AnswerKey
): {
  updatedData: ResponseDataItem[];
  big5Totals: Big5Totals;
  warnings: string[];
} {
  const warnings: string[] = [];
  const big5Totals: Big5Totals = {
    openness: 0,
    conscientiousness: 0,
    extraversion: 0,
    agreeableness: 0,
    neuroticism: 0
  };
  
  // Handle case where responseData is not an array or is undefined
  if (!Array.isArray(responseData)) {
    warnings.push(`responseData is not an array, skipping document`);
    return { updatedData: responseData || [], big5Totals, warnings };
  }
  
  const updatedData = responseData.map((item) => {
    const { updatedItem, traitScore, traitName, warnings: itemWarnings } = processResponseItem(item, answerKey);
    warnings.push(...itemWarnings);
    
    // Accumulate Big5 scores
    if (traitName && traitScore !== undefined) {
      const traitKey = TRAIT_MAPPING[traitName];
      if (traitKey) {
        big5Totals[traitKey] += traitScore;
      } else {
        warnings.push(`Unknown trait name: "${traitName}"`);
      }
    }
    
    return updatedItem;
  });
  
  return { updatedData, big5Totals, warnings };
}

/**
 * Update documents in batches
 */
async function updateDocumentsInBatch(
  responses: { id: string; data: Phase2ExamResponse }[],
  answerKey: Phase2AnswerKey,
  dryRun: boolean = false
): Promise<void> {
  const batch = db.batch();
  let processedCount = 0;
  let updatedCount = 0;
  let totalWarnings = 0;
  
  for (const { id, data } of responses) {
    const { updatedData, big5Totals, warnings } = processResponseData(data.responseData || [], answerKey);
    
    totalWarnings += warnings.length;
    
    // Check if any changes were made
    const responseDataChanged = JSON.stringify(updatedData) !== JSON.stringify(data.responseData);
    const typeTotalsChanged = JSON.stringify(data.typeTotals?.big5) !== JSON.stringify(big5Totals);
    
    if (responseDataChanged || typeTotalsChanged) {
      const updateData: any = {};
      
      if (responseDataChanged) {
        updateData.responseData = updatedData;
      }
      
      if (typeTotalsChanged) {
        updateData['typeTotals.big5'] = big5Totals;
      }
      
      if (!dryRun) {
        const docRef = db.collection('phase_2_exam_responses').doc(id);
        batch.update(docRef, updateData);
      }
      
      updatedCount++;
    }
    
    processedCount++;
  }
  
  if (!dryRun && updatedCount > 0) {
    await batch.commit();
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    // Check for dry-run flag
    const dryRun = process.argv.includes('--dry-run');
    
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
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

/**
 * Utility function to check the current state of annotations
 */
const checkAnnotationStatus = async (): Promise<void> => {
  try {
    const responses = await fetchAllPhase2Responses();
    
    let totalDocs = 0;
    let docsWithCorrectness = 0;
    let docsWithBig5 = 0;
    let docsWithBoth = 0;
    let docsWithNeither = 0;
    
    responses.forEach(({ data }) => {
      totalDocs++;
      
      let hasCorrectness = false;
      let hasBig5 = false;
      
      if (Array.isArray(data.responseData)) {
        hasCorrectness = data.responseData.some(item => 'correct' in item);
        hasBig5 = data.responseData.some(item => 'trait' in item && 'traitScore' in item);
      }
      
      if (data.typeTotals?.big5 && typeof data.typeTotals.big5 === 'object') {
        hasBig5 = true;
      }
      
      if (hasCorrectness) docsWithCorrectness++;
      if (hasBig5) docsWithBig5++;
      if (hasCorrectness && hasBig5) docsWithBoth++;
      if (!hasCorrectness && !hasBig5) docsWithNeither++;
    });
    
  } catch (error) {
    console.error('❌ Error checking annotation status:', error);
    throw error;
  }
};

// Run the script if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--check')) {
    checkAnnotationStatus()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Check failed:', error);
        process.exit(1);
      });
  } else {
    main();
  }
}

export { main as annotateExamResponses, checkAnnotationStatus };
