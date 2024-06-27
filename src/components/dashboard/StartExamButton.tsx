import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Check } from 'lucide-react';
import { RootState } from '../../state_data/reducer';
import { Button } from '../ui/button';
import { LoadingSpinner as Spinner } from '../ui/spinner';

type StartExamButtonProps = {
  formId: string;
  paymentNeeded: boolean;
  isProctored: boolean;
};

const StartExamButton: React.FC<StartExamButtonProps> = ({ formId, paymentNeeded, isProctored }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const studentPayments = useSelector((state: RootState) => state.studentPayments.payments);

  const handleStartExam = () => {
    setLoading(true);
    const hasPaid = studentPayments.some((payment) => payment.formId === formId && payment.paymentStatus === 'success');
    if (!hasPaid && paymentNeeded) {
      alert('You need to pay for this exam before you can start it');
      setLoading(false);
      return;
    }

    // Set the form id and isProctored value in local storage or context
    localStorage.setItem('currentFormId', formId);
    localStorage.setItem('isProctored', JSON.stringify(isProctored));

    if (isProctored) {
      navigate('/camera-microphone-access');
    } else {
      navigate('/start-exam');
    }
  };

  return (
    <Button className="w-full" onClick={handleStartExam} disabled={loading}>
      {loading ? <Spinner className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />} Start Exam
    </Button>
  );
};

export default StartExamButton;