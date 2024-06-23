import React, { useEffect, useState } from 'react';
import ExamCard from '../../components/dashboard/ExamCard';
import { getExamIds } from "../../db/studentExamMappings";
import { getExamDetails } from "../../db/examDetailsCollection";

const ExamCardsGroup: React.FC<{ uid: string }> = ({ uid }) => {
  const [examData, setExamData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const formLinks = await getExamIds(uid);
        if (formLinks.length > 0) {
          const details = await getExamDetails(formLinks);
          setExamData(details);
        }
      } catch (error:any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [uid]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {examData.map((data, index) => (
        <ExamCard
          key={index}
          cardTitle={data.card_title}
          duration={data.duration}
          cardDescription={data.card_description}
          examDetails={JSON.parse("[]")}
          additionalInstructions={data.additional_instructions}
        />
      ))}
    </div>
  );
};

export default ExamCardsGroup;
