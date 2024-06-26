import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import db from "./db";

export const getExamIds = async (uid: string) => {
  try {
    const examMappingRef = collection(db, "student_exam_mappings");
    const examQuery = query(examMappingRef, where("uid", "==", uid));
    const examSnapshot = await getDocs(examQuery);
    if (examSnapshot.empty) {
      return { formLinks: [], completed: [] };
    }

    let formLinks: string[] = [];
    let completed: boolean[] = [];

    examSnapshot.forEach(doc => {
      const examData = doc.data();
      formLinks.push(examData.form_link);
      completed.push(examData.completed);
    });

    return { formLinks, completed };
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