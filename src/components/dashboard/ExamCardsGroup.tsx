import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ExamCard from '../../components/dashboard/ExamCard';
import { getExamIds } from "../../db/studentExamMappings";
import { getExamDetails } from "../../db/examDetailsCollection";
import { RootState } from '../../state_data/reducer';
import { setExamDetails, ExamDetailsPayload } from '../../state_data/examDetailsSlice';
import { getPayments } from '../../db/studentPaymentMappings';
import { setPayments } from '../../state_data/studentPaymentsSlice';

const ExamCardsGroup: React.FC<{ uid: string }> = ({ uid }) => {
  const dispatch = useDispatch();
  const examDetailsState = useSelector((state: RootState) => state.examDetails.examDetails);
  const examDetailsLoaded = useSelector((state: RootState) => state.examDetails.examDetailsLoaded);
  const paymentsLoaded = useSelector((state: RootState) => state.studentPayments.paymentsLoaded);
  const [loading, setLoading] = useState(!examDetailsLoaded);
  const [error, setError] = useState<string | null>(null);

  const checkEligibility = (eligibility_at: string) => {
    const eligibilityDate = new Date(eligibility_at);
    const currentDate = new Date();
    return currentDate >= eligibilityDate;
  };

  const transformPaymentData = (paymentData: any) => {
    return {
      paidOn: new Date(paymentData.paid_on),
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
        const { formLinks, completed, eligibility_at, result } = await getExamIds(uid);
        console.log(result);
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
              eligibility_at: eligibility_at[index],
              result: result[index],
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

  const incompleteExams = examDetailsState.filter((data) => !data.completed);
  const completedExams = examDetailsState.filter((data) => data.completed);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {completedExams.map((data, index) => (
        <ExamCard
          key={index}
          formID={data.formId}
          cardTitle={data.cardTitle}
          duration={data.duration}
          cardDescription={data.cardDescription}
          examDetails={data.examDetails}
          additionalInstructions={data.additionalInstructions}
          paymentNeeded={data.paymentNeeded}
          isProctored={data.isProctored}
          eligibilityAt={data.eligibility_at}
          isEligible={checkEligibility(data.eligibility_at)}
          hasCleared={data.result}
        />
      ))}
      {incompleteExams.map((data, index) => (
        <ExamCard
          key={index}
          formID={data.formId}
          cardTitle={data.cardTitle}
          duration={data.duration}
          cardDescription={data.cardDescription}
          examDetails={data.examDetails}
          additionalInstructions={data.additionalInstructions}
          paymentNeeded={data.paymentNeeded}
          isProctored={data.isProctored}
          eligibilityAt={data.eligibility_at}
          isEligible={checkEligibility(data.eligibility_at)}
        />
      ))}
    </div>
  );
};

export default ExamCardsGroup;
