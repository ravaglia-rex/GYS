import { collection, query, where, getDocs } from "firebase/firestore";
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
