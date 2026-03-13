import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps || admin.apps.length === 0) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert('/Users/srishtilodha/Desktop/Argus/Argus_India/argus-frontend/argus-india-v2-firebase-adminsdk-fbsvc-cc980e26ea.json'),
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