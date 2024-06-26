import {
    collection,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import db from "./db";

type UserData = { 
    eligibleDateTime: string 
} | { 
    message: string 
};

const calculateEligibilityDateTime = (createdAt: string): string => {
    const createdAtDate = new Date(createdAt);
    createdAtDate.setDate(createdAtDate.getDate() + 7);
    return createdAtDate.toISOString(); // Returns date and time in ISO format
};

// FETCH RESULT BASED ON UID
export const getUserData = async (uid: string): Promise<UserData> => {
    try {
        const resultRef = collection(db, "phase_1_exam_responses");
        const resultQuery = query(resultRef, where("UserID", "==", uid));
        const resultSnapshot = await getDocs(resultQuery);

        if (resultSnapshot.empty) {
            return { message: "User not created yet" };
        }
        const resultData = resultSnapshot.docs[0].data();

        if (!resultData.createdAt) {
            throw new Error(`No createdAt field found in the result for UID ${uid}.`);
        }

        const eligibleDateTime = calculateEligibilityDateTime(resultData.createdAt);

        if (resultData.result) {
            return { eligibleDateTime };
        } else {
            return { eligibleDateTime };
        }
    } catch (error) {
        throw new Error(`Error fetching result for UID ${uid}. Please contact talentsearch@argus.ai`);
    }
};