import {
    collection,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import db from "./db";

// FETCH EXAM ID BASED ON SCHOOL ID
export const getExamId = async (schoolId: string) => {
    try {
        const examMappingRef = collection(db, "exam_mappings");
        const examQuery = query(examMappingRef, where("school_id", "==", schoolId));
        const examSnapshot = await getDocs(examQuery);

        if (examSnapshot.empty) {
            throw new Error(`No matching exam mapping found for school ID ${schoolId}. Please contact talentsearch@argus.ai`);
        }
        const examData = examSnapshot.docs[0].data();
        return examData.exam_link;
    } catch (error) {
        throw new Error(`Error fetching exam ID for school ID ${schoolId}. Please contact talentsearch@argus.ai`);
    }
}