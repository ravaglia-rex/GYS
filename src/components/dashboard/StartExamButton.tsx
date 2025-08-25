import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Check, XCircle } from 'lucide-react';
import { RootState } from '../../state_data/reducer';
import { Button } from '../ui/button';
import { LoadingSpinner as Spinner } from '../ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

type StartExamButtonProps = {
  formId: string;
  paymentNeeded: boolean;
  isProctored: boolean;
};

const StartExamButton: React.FC<StartExamButtonProps> = ({ formId, paymentNeeded, isProctored }) => {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false); // State for payment confirmation checkbox
  const navigate = useNavigate();
  const studentPayments = useSelector((state: RootState) => state.studentPayments.payments);

  const enterFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    }
  };

  const handleStartExam = (e: React.MouseEvent<HTMLButtonElement>) => {
    setLoading(true);
    // if studentPayments isn't loaded yet, load it first
    const hasPaid = studentPayments.some((payment) => payment.formId === formId && payment.paymentStatus === 'completed');

    if (!hasPaid && paymentNeeded) {
      // set highlightPaymentsEntry to formId to highlight the payment entry in the table
      navigate('/payments', { state: { highlightPaymentsEntry: formId } });

    } else {
      startExam();
    }
  };

  const startExam = () => {
    localStorage.setItem('currentFormId', formId);
    localStorage.setItem('isProctored', JSON.stringify(isProctored));

    if (isProctored) {
      enterFullScreen();
      navigate('/camera-microphone-access');
    } else {
      navigate('/testing');
    }
  };

  const confirmStartExam = () => {
    startExam();
    setDialogOpen(false);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setLoading(false);
    setPaymentConfirmed(false); // Reset payment confirmation state on dialog close
  };

  const handleDialogStateChange = (isOpen: boolean) => {
    if (!isOpen) {
      setLoading(false);
      setDialogOpen(false);
      setPaymentConfirmed(false); // Reset payment confirmation state on dialog close
    }
  };

  return (
    <>
      <Button
        type='button' 
        className="w-full" 
        onClick={handleStartExam} 
        disabled={loading}
      >
        {loading ? <Spinner className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />} Start Exam
      </Button>
      
      <Dialog open={dialogOpen} onOpenChange={handleDialogStateChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            You have to complete this exam in one sitting.
              <ul className='mt-2 ml-4 list-disc'>
                {isProctored && <li>This is a proctored exam. You need to enable camera and microphone access for the duration of the exam.</li>}
                <li>Make sure you have a stable internet connection</li>
                <li>Refrain from refreshing or pressing the back button</li>
                {paymentNeeded && <li>There's a fee for the exam, and you will be billed prior to receiving the score report (If you've already paid there are no other payments to be made).</li>}
              </ul>
            <label className="flex items-center mt-2">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-green-500"
                checked={paymentConfirmed}
                onChange={() => setPaymentConfirmed(!paymentConfirmed)}
              />
              <span className="ml-2">By checking this box, I agree to the terms and conditions for the exam</span>
            </label>
          </DialogDescription>
          <DialogFooter>
            <Button 
              onClick={handleDialogClose} 
              className="bg-red-500 text-white hover:bg-red-600"
            >
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button 
              onClick={confirmStartExam} 
              className={`bg-green-500 text-white hover:bg-green-600 ${!paymentConfirmed && 'opacity-50 cursor-not-allowed'}`}
              disabled={!paymentConfirmed}
            >
              <Check className="mr-2 h-4 w-4" /> Yes, Start Exam
            </Button>
          </DialogFooter>
          <DialogDescription>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StartExamButton;
