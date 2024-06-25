import { collection, query, where, getDocs } from "firebase/firestore";
import db from "./db";

interface Payment {
  paid_on: string;
  payment_method: string;
  payment_status: string;
  transaction_id: string;
  uid: string;
  form_id: string;
  amount: number;
}

export const getPayments = async (uid: string): Promise<Payment[]> => {
  try {
    const paymentsMappingsRef = collection(db, "student_payment_mappings");
    const paymentQuery = query(paymentsMappingsRef, where("uid", "==", uid));
    const paymentSnapshot = await getDocs(paymentQuery);

    if (paymentSnapshot.empty) {
      return [];
    }

    const payments: Payment[] = [];
    paymentSnapshot.forEach(doc => {
      const paymentData = doc.data();
      payments.push({
        paid_on: paymentData.paid_on,
        payment_method: paymentData.payment_method,
        payment_status: paymentData.payment_status,
        transaction_id: paymentData.transaction_id,
        uid: paymentData.uid,
        form_id: paymentData.form_id,
        amount: paymentData.amount,
      });
    });

    return payments;
  } catch (error) {
    throw new Error(`Error fetching payments for user. Please contact support.`);
  }
};