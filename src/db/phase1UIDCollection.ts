import { 
    setDoc, 
    getDoc, 
    doc 
} from "firebase/firestore";
import db from "./db";

export const addExamIDToPhase1 = async (examID: string): Promise<void> => {
    try {
        await setDoc(doc(db, "phase_1_uids", examID), {
            examID: examID
        });
    } catch (error) {
        throw new Error(`Error adding Exam ID: ${examID}`);
    }
};

export const checkExamIDExists = async (uid: string): Promise<boolean> => {
    try {
        const docRef = doc(db, "phase_1_uids", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        return false;
    }
};