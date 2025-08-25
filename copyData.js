// const admin = require("firebase-admin");
// const { Firestore } = require("@google-cloud/firestore");

// // 🔹 Init Cloud Firestore with service account
// const serviceAccount = require("./argus-talent-search-12b4f493ad6d.json");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });
// const cloudDb = admin.firestore();

// // 🔹 Init Emulator Firestore
// const emulatorDb = new Firestore({
//   projectId: "argus-talent-search", // can be anything
// });
// emulatorDb.settings({
//   host: "localhost:9999", // or 9999 if your emulator runs there
//   ssl: false,
// });

// async function copyCollection(collectionName) {
//   const snapshot = await cloudDb.collection(collectionName).get();
//   console.log(`Copying ${snapshot.size} docs from ${collectionName}`);
//   for (const doc of snapshot.docs) {
//     await emulatorDb.collection(collectionName).doc(doc.id).set(doc.data());
//   }
// }

// async function main() {
//   const collections = await cloudDb.listCollections();
//   for (const col of collections) {
//     await copyCollection(col.id);
//   }
//   console.log("✅ Data copied to emulator");
// }

// main().catch(console.error);



//--------------------------------



// const admin = require("firebase-admin");
// const { Firestore } = require("@google-cloud/firestore");

// // 🔹 Init Cloud Firestore with service account
// const serviceAccount = require("./argus-talent-search-12b4f493ad6d.json");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });
// const cloudDb = admin.firestore();

// // 🔹 Init Emulator Firestore
// const emulatorDb = new Firestore({
//   projectId: "argus-talent-search",
// });
// emulatorDb.settings({
//   host: "localhost:9999",
//   ssl: false,
// });

// async function copyCollection(collectionName) {
//   try {
//     const cloudSnapshot = await cloudDb.collection(collectionName).get();
//     const emulatorSnapshot = await emulatorDb.collection(collectionName).get();

//     console.log(`\n--- Collection: ${collectionName} ---`);
//     console.log(`Source (Cloud) docs: ${cloudSnapshot.size}`);
//     console.log(`Target (Emulator) docs: ${emulatorSnapshot.size}`);

//     // Filter out docs already in emulator
//     const emulatorDocIds = new Set(emulatorSnapshot.docs.map(doc => doc.id));
//     const docsToCopy = cloudSnapshot.docs.filter(doc => !emulatorDocIds.has(doc.id));

//     if (docsToCopy.length === 0) {
//       console.log(`✅ All docs already copied, skipping collection.`);
//       return;
//     }

//     console.log(`Copying ${docsToCopy.length} new docs...`);

//     let copiedCount = 0;
//     for (const doc of docsToCopy) {
//       try {
//         await emulatorDb.collection(collectionName).doc(doc.id).set(doc.data());
//         copiedCount++;
//         if (copiedCount % 500 === 0 || copiedCount === docsToCopy.length) {
//           console.log(`Copied ${copiedCount} / ${docsToCopy.length} new docs so far...`);
//         }
//       } catch (docError) {
//         console.error(`Error copying doc ${doc.id}:`, docError.message);
//       }
//     }

//     console.log(`✅ Finished copying ${copiedCount} new docs from ${collectionName}`);
//   } catch (err) {
//     console.error(`Error processing collection ${collectionName}:`, err.message);
//   }
// }

// async function main() {
//   const collections = await cloudDb.listCollections();

//   for (const col of collections) {
//     await copyCollection(col.id);
//   }

//   console.log("\n🎉 All collections processed");
// }

// main().catch(console.error);


const admin = require("firebase-admin");
const { Firestore } = require("@google-cloud/firestore");

// Init Cloud Firestore
const serviceAccount = require("./argus-talent-search-12b4f493ad6d.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const cloudDb = admin.firestore();

// Init Emulator Firestore
const emulatorDb = new Firestore({
  projectId: "argus-talent-search",
});
emulatorDb.settings({
  host: "localhost:9999",
  ssl: false,
});

// Change this if you want smaller or larger batches
const BATCH_SIZE = 500;

async function copyExamResponses() {
  const collectionName = "exam_responses";

  // Count already copied docs in emulator
  const targetSnapshot = await emulatorDb.collection(collectionName).get();
  const alreadyCopied = targetSnapshot.size;
  console.log(`Docs already in emulator: ${alreadyCopied}`);

  let lastDoc = null;
  let copiedCount = 0;

  while (true) {
    let query = cloudDb.collection(collectionName).orderBy("__name__").limit(BATCH_SIZE);
    if (lastDoc) query = query.startAfter(lastDoc);

    const snapshot = await query.get();
    if (snapshot.empty) break;

    for (const doc of snapshot.docs) {
      const targetDoc = await emulatorDb.collection(collectionName).doc(doc.id).get();
      if (!targetDoc.exists) {
        await emulatorDb.collection(collectionName).doc(doc.id).set(doc.data());
        copiedCount++;
      }
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    console.log(`Copied ${copiedCount} new docs so far...`);
  }

  console.log(`✅ Finished copying exam_responses. Total new docs copied: ${copiedCount}`);
}

copyExamResponses().catch(console.error);
