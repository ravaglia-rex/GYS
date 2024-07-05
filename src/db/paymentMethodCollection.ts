import {
    collection,
    addDoc,
} from "firebase/firestore";
import db from "./db";

// CREATE PAYMENT RECORD
type Payment_Method = {
    student_uid: string;
    payment_method: string;
};

export const createPaymentRecord = async (payment_method: Payment_Method) => {
    try {
        const payment_obj = await addDoc(collection(db, "payment_method"), payment_method);
        return payment_obj.id;
    } catch (e) {
        throw new Error(`Error recording payment details. Please contact talentsearch@argus.ai`);
    }
};