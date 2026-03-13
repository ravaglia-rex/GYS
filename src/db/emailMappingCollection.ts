import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

export const checkEmailExists = async (email: string): Promise<boolean> => {
  try {
    // First check student_email_mappings collection
    const emailMappingRef = collection(db, 'student_email_mappings');
    const emailQuery = query(emailMappingRef, where('email', '==', email));
    const querySnapshot = await getDocs(emailQuery);

    if (!querySnapshot.empty) {
      return true;
    }

    // If not found in student mappings, check schools collection (email and poc_email)
    const schoolsRef = collection(db, 'schools');
    const schoolsByEmail = query(schoolsRef, where('email', '==', email));
    const schoolsByPocEmail = query(schoolsRef, where('poc_email', '==', email));
    const [emailSnapshot, pocEmailSnapshot] = await Promise.all([
      getDocs(schoolsByEmail),
      getDocs(schoolsByPocEmail),
    ]);

    if (!emailSnapshot.empty || !pocEmailSnapshot.empty) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('checkEmailExists failed:', error);
    return false; // ✅ fail safe instead of throwing
  }
};
  

export const addEmailMapping = async (uid: string, email: string) => {
  try {
    const emailMappingRef = collection(db, 'student_email_mappings');
    const emailDocRef = doc(emailMappingRef, uid);
    await setDoc(emailDocRef, {
      email,
    });
  } catch (error) {
    throw new Error(
      `Error adding email for ${email}. Please contact us at talentsearch@argus.ai`
    );
  }
};