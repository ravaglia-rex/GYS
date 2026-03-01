import admin from 'firebase-admin';
import * as fs from 'fs';

// Initialize Firebase Admin SDK
if (!admin.apps || admin.apps.length === 0) {
  const serviceAccountPath = '/Users/srishtilodha/Desktop/Argus/Argus_India/argus-frontend/argus-talent-search-12b4f493ad6d.json';
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Configuration
const SCHOOL_ID = 'Y1Sb1wfhlomIIg98J6y8';
const EMAIL = 'srishti+11@argus.ai';

async function updateSchoolEmail() {
  try {
    console.log('🚀 Starting school email update script...\n');
    console.log(`📋 School ID: ${SCHOOL_ID}`);
    console.log(`📧 Email: ${EMAIL}\n`);

    // Get the school document
    const schoolRef = db.collection('schools').doc(SCHOOL_ID);
    const schoolDoc = await schoolRef.get();

    if (!schoolDoc.exists) {
      throw new Error(`School with ID ${SCHOOL_ID} not found`);
    }

    const schoolData = schoolDoc.data();
    
    if (!schoolData) {
      throw new Error(`School document exists but has no data`);
    }

    // Display current school info
    console.log('📊 Current school data:');
    console.log(`   School Name: ${schoolData.school_name || 'not set'}`);
    console.log(`   Current Email: ${schoolData.email || 'not set'}\n`);

    // Update the document
    console.log('💾 Updating school document...');
    await schoolRef.update({
      email: EMAIL,
      verified: false,
    });

    console.log('✅ School email updated successfully!\n');
    console.log('📊 Updated school data:');
    console.log(`   School Name: ${schoolData.school_name || 'not set'}`);
    console.log(`   Email: ${EMAIL}`);
    console.log(`   Verified: false\n`);

    console.log('🎉 Script completed successfully!');

  } catch (error) {
    console.error('❌ Error updating school email:', error);
    throw error;
  }
}

// Run the script if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  updateSchoolEmail()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { updateSchoolEmail };