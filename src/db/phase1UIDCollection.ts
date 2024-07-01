import { 
    setDoc,
    doc, 
    collection, 
    query, 
    where, 
    getDocs 
} from "firebase/firestore";
import db from "./db";

export const addExamIDToPhase1 = async (examID: string): Promise<void> => {
    try {
        const sanitizedExamID = examID.replace(/\//g, "_");
        await setDoc(doc(db, "phase_1_uids", sanitizedExamID), {
            examID: examID
        });
    } catch (error) {
        throw new Error(`Error adding Exam ID: ${examID}`);
    }
};

export const checkExamIDExists = async (examID: string): Promise<boolean> => {
    try {
        const phase1Collection = collection(db, "phase_1_uids");
        const q = query(phase1Collection, where("examID", "==", examID.trim()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
};