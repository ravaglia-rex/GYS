import {
    collection,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import db from "./db";

type UserData =
    | { daysDifference: number }
    | { remainingDays: number; remainingHours: number }
    | { message: string };

const calculateDateDifference = (createdAt: string) => {
    const currentDate = new Date();
    const createdAtDate = new Date(createdAt);
    const differenceInTime = currentDate.getTime() - createdAtDate.getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));

    if (differenceInDays >= 7) {
        return { daysDifference: differenceInDays };
    } else {
        const remainingDays = 7 - differenceInDays;
        const remainingHours = 24 - new Date(differenceInTime).getUTCHours();
        return { remainingDays, remainingHours };
    }
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

        const dateDifference = calculateDateDifference(resultData.createdAt);

        if (resultData.result) {
            return dateDifference;
        } else if ('daysDifference' in dateDifference) {
            return { message: "User has to be waitlisted" };
        } else {
            return dateDifference;
        }
    } catch (error) {
        throw new Error(`Error fetching result for UID ${uid}. Please contact talentsearch@argus.ai`);
    }
};
