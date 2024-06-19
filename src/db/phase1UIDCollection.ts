import { 
    setDoc, 
    getDoc, 
    doc 
} from "firebase/firestore";
import db from "./db";

// Function to add a UID to the phase_1_uids collection with UID as the document ID
export const addUidToPhase1 = async (uid: string): Promise<void> => {
    try {
        await setDoc(doc(db, "phase_1_uids", uid), {
            uid: uid
        });
    } catch (error) {
        throw new Error(`Error adding UID: ${uid}`);
    }
};

// Function to check if a UID already exists in the phase_1_uids collection
export const checkUidExists = async (uid: string): Promise<boolean> => {
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