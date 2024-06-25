import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ExamCard from '../../components/dashboard/ExamCard';
import { getExamIds } from "../../db/studentExamMappings";
import { getExamDetails } from "../../db/examDetailsCollection";
import { RootState } from '../../state_data/reducer';
import { setExamDetails, ExamDetailsPayload } from '../../state_data/examDetailsSlice';

const ExamCardsGroup: React.FC<{ uid: string }> = ({ uid }) => {
  const dispatch = useDispatch();
  const examDetailsState = useSelector((state: RootState) => state.examDetails.examDetails);
  const examDetailsLoaded = useSelector((state: RootState) => state.examDetails.examDetailsLoaded);
  const [loading, setLoading] = useState(!examDetailsLoaded);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExamData = async () => {
      if (!examDetailsLoaded) {
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
              }));

            dispatch(setExamDetails({ examDetails: validDetails, examDetailsLoaded: true }));
          }
        } catch (error: any) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [uid, dispatch, examDetailsLoaded]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  const incompleteExams = examDetailsState.filter((data) => !data.completed);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {incompleteExams.map((data, index) => (
        <ExamCard
          key={index}
          cardTitle={data.cardTitle}
          duration={data.duration}
          cardDescription={data.cardDescription}
          examDetails={data.examDetails}
          additionalInstructions={data.additionalInstructions}
          paymentNeeded={data.paymentNeeded}
        />
      ))}
    </div>
  );
};

export default ExamCardsGroup;
