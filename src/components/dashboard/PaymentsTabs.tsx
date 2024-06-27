import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import PastPaymentsTable from "./PastPaymentsTable";
import PendingPaymentsTable from "./PendingPaymentsTable";
import { getPayments } from '../../db/studentPaymentMappings';
import { setPayments } from '../../state_data/studentPaymentsSlice';
import { getExamIds } from "../../db/studentExamMappings";
import { getExamDetails } from "../../db/examDetailsCollection";
import { setExamDetails, ExamDetailsPayload } from '../../state_data/examDetailsSlice';
import { RootState } from "../../state_data/reducer";

const PaymentsTabs: React.FC<{ uid: string }> = ({ uid }) => {
  const dispatch = useDispatch();
  const payments = useSelector((state: RootState) => state.studentPayments.payments);
  const paymentsLoaded = useSelector((state: RootState) => state.studentPayments.paymentsLoaded);
  const examDetails = useSelector((state: RootState) => state.examDetails.examDetails);
  const examDetailsLoaded = useSelector((state: RootState) => state.examDetails.examDetailsLoaded);
  const [loading, setLoading] = useState(!paymentsLoaded || !examDetailsLoaded);
  const [error, setError] = useState<string | null>(null);

  const transformPaymentData = (paymentData: any) => {
    return {
      paidOn: new Date(paymentData.paid_on.seconds * 1000 + paymentData.paid_on.nanoseconds / 1000000),
      paymentMethod: paymentData.payment_method,
      paymentStatus: paymentData.payment_status,
      transactionId: paymentData.transaction_id,
      uid: paymentData.uid,
      formId: paymentData.form_id,
      amount: paymentData.amount,
    };
  };

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const paymentsData = await getPayments(uid);
        const transformedData = paymentsData.map(transformPaymentData);
        dispatch(setPayments(transformedData));
        setLoading(false);
      } catch (error: any) {
        setError(error.message);
        setLoading(false);
      }
    };

    const loadExamDetails = async () => {
      try {
        const { formLinks, completed } = await getExamIds(uid);
        if (formLinks.length > 0) {
          const details = await getExamDetails(formLinks);
          const validDetails: ExamDetailsPayload[] = details
            .filter((detail: any): detail is any => detail !== null && typeof detail === 'object')
            .map((detail: any, index: number) => ({
              formId: formLinks[index],
              additionalInstructions: detail.additional_instructions,
              examDetails: detail.exam_details,
              duration: detail.duration,
              cardTitle: detail.card_title,
              cardDescription: detail.card_description,
              paymentNeeded: detail.payment_needed,
              completed: completed[index],
              cost: detail.cost,
              currency: detail.currency,
              isProctored: detail.is_proctored,
            }));

          dispatch(setExamDetails({ examDetails: validDetails, examDetailsLoaded: true }));
        }
        setLoading(false);
      } catch (error: any) {
        setError(error.message);
        setLoading(false);
      }
    };

    if (!paymentsLoaded) {
      loadPayments();
    }

    if (!examDetailsLoaded) {
      loadExamDetails();
    }

  }, [uid, dispatch, paymentsLoaded, examDetailsLoaded]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  const paidExamIds = payments.map(payment => payment.formId);
  const pendingPayments = examDetails.filter(exam => !paidExamIds.includes(exam.formId) && exam.paymentNeeded);

  return (
    <Tabs defaultValue="pendingPayments" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="pendingPayments">Pending Payments</TabsTrigger>
        <TabsTrigger value="paymentsHistory">Payments History</TabsTrigger>
      </TabsList>
      <TabsContent value="pendingPayments">
        <PendingPaymentsTable payments={pendingPayments} />
      </TabsContent>
      <TabsContent value="paymentsHistory">
        <PastPaymentsTable payments={payments} />
      </TabsContent>
    </Tabs>
  );
}

export default PaymentsTabs;
