import { collection, query, where, getDocs, addDoc, updateDoc } from "firebase/firestore";
import db from "./db";

export const getExamIds = async (uid: string) => {
  try {
    const examMappingRef = collection(db, "student_exam_mappings");
    const examQuery = query(examMappingRef, where("uid", "==", uid));
    const examSnapshot = await getDocs(examQuery);
    if (examSnapshot.empty) {
      return { formLinks: [], completed: [], eligibility_at: [] };
    }

    let formLinks: string[] = [];
    let completed: boolean[] = [];
    let eligibility_at: string[] = [];

    examSnapshot.forEach(doc => {
      const examData = doc.data();
      formLinks.push(examData.form_link);
      completed.push(examData.completed);
      eligibility_at.push(examData.eligibility_at);
    });

    return { formLinks, completed, eligibility_at };
  } catch (error) {
    throw new Error(`Error fetching exam IDs for user. Please contact talentsearch@argus.ai`);
  }
};

export const assignExamToUser = async (uid: string, formLink: string, completed: boolean, eligibilityDateTime: string) => {
  try {
  const examMappingRef = collection(db, "student_exam_mappings");
  const newExamData = {
    uid,
    form_link: formLink,
    completed,
    eligibility_at: eligibilityDateTime,
  }
  await addDoc(examMappingRef, newExamData);
  return {success: true, message: "Exam assigned successfully"};
  } catch (error) {
    throw new Error(`Error assigning exam to user. Please contact talentsearch@argus.ai`);
  }
}

export const markExamComplete = async (uid: string, formLink: string) => {
  try {
    const studentExamMappingRef = collection(db, 'student_exam_mappings');
    const examQuery = query(studentExamMappingRef, where('uid', '==', uid), where('form_link', '==', formLink));
    const querySnapshot = await getDocs(examQuery);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      await updateDoc(doc.ref, { completed: true });
      return { success: true, message: "Exam marked as complete" };
    } else {
      throw new Error("No matching exam record found");
    }
  } catch (error) {
    throw new Error(`Error marking exam complete. Please contact talentsearch@argus.ai`);
  }
}