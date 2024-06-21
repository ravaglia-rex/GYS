import {
    collection,
    query,
    where,
    getDocs,
    setDoc,
    doc
} from "firebase/firestore";
import db from "./db";

export const checkEmailExists = async (email: string) => {
    try {
        const emailMappingRef = collection(db, "student_email_mappings");
        const emailQuery = query(emailMappingRef, where("email", "==", email));
        const querySnapshot = await getDocs(emailQuery);

        if (querySnapshot.docs.length === 0) {
            return false;
        }
        return true;
    } catch (error) {
        throw new Error(`Error fetching email for ${email}. Please contact us at talentsearch@argus.ai`);
    }
};

export const addEmailMapping = async (uid: string, email: string) => {
    try {
        const emailMappingRef = collection(db, "student_email_mappings");
        const emailDocRef = doc(emailMappingRef, uid);
        await setDoc(emailDocRef, {
            email,
        });
    } catch (error) {
        throw new Error(`Error adding email for ${email}. Please contact us at talentsearch@argus.ai`);
    }
};