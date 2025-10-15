// import admin from 'firebase-admin';

// // Initialize Firebase Admin SDK
// if (!admin.apps || admin.apps.length === 0) {
//   try {
//     admin.initializeApp({
//       credential: admin.credential.cert('/Users/srishtilodha/Desktop/Argus/Argus_India/argus-frontend/argus-talent-search-12b4f493ad6d.json'),
//     });
//     console.log('✅ Firebase Admin initialized successfully');
//   } catch (error) {
//     console.error('❌ Failed to initialize Firebase Admin:', error);
//     process.exit(1);
//   }
// } else {
//   console.log('✅ Firebase Admin already initialized');
// }

// const db = admin.firestore();

// interface ResponseDataItem {
//   key: string;
//   label: string;
//   type: string;
//   value: string | string[];
//   options?: Array<{
//     id: string;
//     text: string;
//   }>;
//   category?: {
//     main: string;
//     sub: string;
//     subSub?: string; // New field for the bracket content
//   };
// }

// interface Phase2ExamResponse {
//   responseData?: ResponseDataItem[] | any;
//   [key: string]: any;
// }

// interface Phase2AnswerKey {
//   [questionId: string]: {
//     concept: string;
//     type: string;
//     difficulty_level: number;
//     options?: { [key: string]: { score: number } };
//   };
// }

// /**
//  * Parse a concept string to extract main category, sub category, and sub-sub category
//  * Examples:
//  * - "Algebra (Creating and Solving Linear Models)" -> main: "Algebra", sub: "Algebra", subSub: "Creating and Solving Linear Models"
//  * - "Functions (Composition of Functions)" -> main: "Functions", sub: "Functions", subSub: "Composition of Functions"
//  * - "Author's Purpose" -> main: "reading", sub: "Author's Purpose", subSub: undefined
//  */
// function parseCategory(concept: string, mainType: string): {
//   main: string;
//   sub: string;
//   subSub?: string;
// } {
//   // Check if concept contains parentheses
//   const match = concept.match(/^(.+?)\s*\((.+?)\)$/);
  
//   if (match) {
//     const [, beforeParen, insideParen] = match;
//     return {
//       main: mainType,
//       sub: beforeParen.trim(),
//       subSub: insideParen.trim()
//     };
//   } else {
//     // No parentheses found, treat the entire concept as sub category
//     return {
//       main: mainType,
//       sub: concept.trim()
//     };
//   }
// }

// async function fetchAnswerKey(): Promise<Phase2AnswerKey> {
//   console.log('📖 Fetching answer key...');
//   const answerKeyDoc = await db.collection('phase_2_answer_key').doc('phase2_exam_001').get();
  
//   if (!answerKeyDoc.exists) {
//     throw new Error('Answer key document not found');
//   }
  
//   const answerKey = answerKeyDoc.data() as Phase2AnswerKey;
//   console.log(`✅ Answer key loaded with ${Object.keys(answerKey).length} questions`);
//   return answerKey;
// }

// async function fetchAllPhase2Responses(): Promise<{ id: string; data: Phase2ExamResponse }[]> {
//   console.log('📋 Fetching all phase 2 exam responses...');
//   const responsesSnapshot = await db.collection('phase_2_exam_responses').get();
  
//   const responses: { id: string; data: Phase2ExamResponse }[] = [];
//   responsesSnapshot.forEach((doc) => {
//     responses.push({
//       id: doc.id,
//       data: doc.data() as Phase2ExamResponse
//     });
//   });
  
//   console.log(`✅ Found ${responses.length} student responses`);
//   return responses;
// }

// function updateCategoryStructure(responseData: ResponseDataItem[], answerKey: Phase2AnswerKey): {
//   updatedData: ResponseDataItem[];
//   warnings: string[];
//   stats: {
//     totalQuestions: number;
//     questionsWithBrackets: number;
//     questionsWithoutBrackets: number;
//   };
// } {
//   const warnings: string[] = [];
//   let questionsWithBrackets = 0;
//   let questionsWithoutBrackets = 0;
  
//   // Handle case where responseData is not an array or is undefined
//   if (!Array.isArray(responseData)) {
//     warnings.push(`⚠️  responseData is not an array, skipping document`);
//     return { 
//       updatedData: responseData || [], 
//       warnings,
//       stats: { totalQuestions: 0, questionsWithBrackets: 0, questionsWithoutBrackets: 0 }
//     };
//   }
  
//   const updatedData = responseData.map((item) => {
//     const answerKeyItem = answerKey[item.key];
    
//     if (!answerKeyItem) {
//       warnings.push(`⚠️  Question "${item.key}" not found in answer key`);
//       return item; // Return unchanged
//     }
    
//     // Parse the category structure
//     const parsedCategory = parseCategory(answerKeyItem.concept, answerKeyItem.type);
    
//     // Track statistics
//     if (parsedCategory.subSub) {
//       questionsWithBrackets++;
//     } else {
//       questionsWithoutBrackets++;
//     }
    
//     // Update category information
//     return {
//       ...item,
//       category: parsedCategory
//     };
//   });
  
//   return { 
//     updatedData, 
//     warnings,
//     stats: {
//       totalQuestions: responseData.length,
//       questionsWithBrackets,
//       questionsWithoutBrackets
//     }
//   };
// }

// async function updateDocumentsInBatch(
//   responses: { id: string; data: Phase2ExamResponse }[],
//   answerKey: Phase2AnswerKey,
//   dryRun: boolean = false
// ): Promise<void> {
//   console.log(`🔄 Processing ${responses.length} documents${dryRun ? ' (DRY RUN)' : ''}...`);
  
//   const batch = db.batch();
//   let processedCount = 0;
//   let totalWarnings = 0;
//   let totalStats = {
//     totalQuestions: 0,
//     questionsWithBrackets: 0,
//     questionsWithoutBrackets: 0
//   };
  
//   for (const { id, data } of responses) {
//     const { updatedData, warnings, stats } = updateCategoryStructure(data.responseData, answerKey);
    
//     totalWarnings += warnings.length;
//     totalStats.totalQuestions += stats.totalQuestions;
//     totalStats.questionsWithBrackets += stats.questionsWithBrackets;
//     totalStats.questionsWithoutBrackets += stats.questionsWithoutBrackets;
    
//     // Log warnings for this document
//     if (warnings.length > 0) {
//       console.log(`\n📄 Document ${id}:`);
//       warnings.forEach(warning => console.log(`  ${warning}`));
//     }
    
//     // Only update if responseData actually changed
//     if (JSON.stringify(updatedData) !== JSON.stringify(data.responseData)) {
//       if (!dryRun) {
//         const docRef = db.collection('phase_2_exam_responses').doc(id);
//         batch.update(docRef, {
//           responseData: updatedData
//         });
//       }
      
//       console.log(`✅ ${dryRun ? 'Would update' : 'Updated'} document ${id}`);
//     } else {
//       console.log(`⏭️  Document ${id} already has updated categories or no changes needed`);
//     }
    
//     processedCount++;
    
//     // Log progress every 10 documents
//     if (processedCount % 10 === 0) {
//       console.log(`📊 Progress: ${processedCount}/${responses.length} documents processed`);
//     }
//   }
  
//   if (!dryRun) {
//     console.log('💾 Committing batch update...');
//     await batch.commit();
//     console.log('✅ Batch update completed successfully');
//   } else {
//     console.log('🔍 Dry run completed - no changes were made');
//   }
  
//   console.log(`\n📈 Summary:`);
//   console.log(`  - Documents processed: ${processedCount}`);
//   console.log(`  - Total warnings: ${totalWarnings}`);
//   console.log(`  - Total questions: ${totalStats.totalQuestions}`);
//   console.log(`  - Questions with brackets (sub-sub categories): ${totalStats.questionsWithBrackets}`);
//   console.log(`  - Questions without brackets: ${totalStats.questionsWithoutBrackets}`);
//   console.log(`  - Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
// }

// async function main() {
//   try {
//     console.log('🚀 Starting Phase 2 Category Structure Update Script\n');
//     console.log('📝 This script will parse category fields and create sub-sub categories from bracket content\n');
    
//     // Check for dry-run flag
//     const dryRun = process.argv.includes('--dry-run');
//     if (dryRun) {
//       console.log('🔍 Running in DRY RUN mode - no changes will be made\n');
//     }
    
//     // Fetch data
//     const [answerKey, responses] = await Promise.all([
//       fetchAnswerKey(),
//       fetchAllPhase2Responses()
//     ]);
    
//     if (responses.length === 0) {
//       console.log('ℹ️  No responses found to process');
//       return;
//     }
    
//     // Show some examples of what will be parsed
//     console.log('🔍 Examples of category parsing:');
//     const exampleConcepts = Object.values(answerKey).slice(0, 5);
//     exampleConcepts.forEach(item => {
//       const parsed = parseCategory(item.concept, item.type);
//       console.log(`  "${item.concept}" -> main: "${parsed.main}", sub: "${parsed.sub}"${parsed.subSub ? `, subSub: "${parsed.subSub}"` : ''}`);
//     });
//     console.log('');
    
//     // Process and update documents
//     await updateDocumentsInBatch(responses, answerKey, dryRun);
    
//     console.log('\n🎉 Script completed successfully!');
    
//   } catch (error) {
//     console.error('❌ Script failed:', error);
//     process.exit(1);
//   }
// }

// // Run the script if called directly
// if (import.meta.url === `file://${process.argv[1]}`) {
//   main();
// }

// export { main as updatePhase2CategoryStructure };

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps || admin.apps.length === 0) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert('/Users/srishtilodha/Desktop/Argus/Argus_India/argus-frontend/argus-talent-search-12b4f493ad6d.json'),
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    process.exit(1);
  }
} else {
  console.log('✅ Firebase Admin already initialized');
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
    subSub?: string;
  };
}

interface Phase2ExamResponse {
  responseData?: ResponseDataItem[];
  [key: string]: any;
}

// Capitalization fixes mapping - same as in structure.ts
const capitalizationFixes: { [key: string]: string } = {
  'analytical reasoning': 'Analytical Reasoning',
  'vocab in context': 'Vocab in Context',
  'main idea': 'Main Idea',
  'tone': 'Tone',
  'character': 'Character'
};

function fixCapitalization(concept: string): string {
  const lowerConcept = concept.toLowerCase();
  
  // Check if the concept matches any of our fixes
  for (const [incorrect, correct] of Object.entries(capitalizationFixes)) {
    if (lowerConcept === incorrect) {
      return correct;
    }
    // Also check if it's part of a bracketed concept
    if (concept.includes('(') && concept.includes(')')) {
      const match = concept.match(/^(.+?)\s*\((.+?)\)$/);
      if (match) {
        const [, beforeParen, insideParen] = match;
        if (insideParen.toLowerCase() === incorrect) {
          return `${beforeParen} (${correct})`;
        }
      }
    }
  }
  
  return concept; // Return unchanged if no fix needed
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

function fixResponseDataCapitalization(responseData: ResponseDataItem[]): {
  updatedData: ResponseDataItem[];
  changesCount: number;
  changes: string[];
} {
  let changesCount = 0;
  const changes: string[] = [];
  
  // Handle case where responseData is not an array or is undefined
  if (!Array.isArray(responseData)) {
    return { 
      updatedData: responseData || [], 
      changesCount: 0,
      changes: []
    };
  }
  
  const updatedData = responseData.map((item) => {
    if (!item.category || !item.category.sub) {
      return item; // Return unchanged if no category.sub
    }
    
    const originalSub = item.category.sub;
    const fixedSub = fixCapitalization(originalSub);
    
    if (originalSub !== fixedSub) {
      changesCount++;
      changes.push(`"${originalSub}" → "${fixedSub}"`);
      
      return {
        ...item,
        category: {
          ...item.category,
          sub: fixedSub
        }
      };
    }
    
    return item; // Return unchanged
  });
  
  return { updatedData, changesCount, changes };
}

async function updateDocumentsInBatch(
  responses: { id: string; data: Phase2ExamResponse }[],
  dryRun: boolean = false
): Promise<void> {
  console.log(`🔄 Processing ${responses.length} documents${dryRun ? ' (DRY RUN)' : ''}...`);
  
  const batch = db.batch();
  let processedCount = 0;
  let totalChanges = 0;
  const allChanges: string[] = [];
  
  for (const { id, data } of responses) {
    const { updatedData, changesCount, changes } = fixResponseDataCapitalization(data.responseData || []);
    
    totalChanges += changesCount;
    allChanges.push(...changes);
    
    // Log changes for this document
    if (changesCount > 0) {
      console.log(`\n📄 Document ${id} - ${changesCount} changes:`);
      changes.forEach(change => console.log(`  ${change}`));
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
      console.log(`⏭️  Document ${id} no capitalization changes needed`);
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
  console.log(`  - Total changes: ${totalChanges}`);
  console.log(`  - Mode: ${dryRun ? 'DRY RUN' : 'LIVE UPDATE'}`);
  
  if (totalChanges > 0) {
    console.log(`\n🔧 All capitalization fixes applied:`);
    const uniqueChanges = Array.from(new Set(allChanges));
    uniqueChanges.forEach(change => console.log(`  ${change}`));
  }
}

async function main() {
  try {
    console.log('🚀 Starting Phase 2 Response Capitalization Fix Script\n');
    console.log('📝 This script will fix capitalization issues in category.sub fields\n');
    
    // Check for dry-run flag
    const dryRun = process.argv.includes('--dry-run');
    if (dryRun) {
      console.log('🔍 Running in DRY RUN mode - no changes will be made\n');
    }
    
    // Fetch and process responses
    const responses = await fetchAllPhase2Responses();
    
    if (responses.length === 0) {
      console.log('ℹ️  No responses found to process');
      return;
    }
    
    // Process and update documents
    await updateDocumentsInBatch(responses, dryRun);
    
    console.log('\n🎉 Script completed successfully!');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
main();