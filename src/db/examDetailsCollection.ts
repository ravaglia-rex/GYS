import { doc, getDoc } from "firebase/firestore";
import db from "./db";

export const getExamDetails = async (formLinks: string[]) => {
  try {
      const examDetailsPromises = formLinks.map(async (formLink) => {
      const examDetailsRef = doc(db, "exam_details", formLink);
      const examDetailsSnapshot = await getDoc(examDetailsRef);
      if (examDetailsSnapshot.exists()) {
        return examDetailsSnapshot.data();
      } else {
        return null;
      }
    });

    const examDetails = await Promise.all(examDetailsPromises);
    const filteredExamDetails = examDetails.filter((details) => details !== null);
    return filteredExamDetails;
  } catch (error) {
    throw new Error(`Error fetching exam details. Please contact talentsearch@argus.ai`);
  }
};
