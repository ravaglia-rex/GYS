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
  const navigate = useNavigate();
  const studentPayments = useSelector((state: RootState) => state.studentPayments.payments);

  const handleStartExam = () => {
    setLoading(true);
    // if studentPayments isn't loaded yet, load it first
    const hasPaid = studentPayments.some((payment) => payment.formId === formId && payment.paymentStatus === 'completed');

    if (!hasPaid && paymentNeeded) {
      alert('You need to pay for this exam before you can start it');
      setLoading(false);
      return;
    }

    setDialogOpen(true);
  };

  const confirmStartExam = () => {
    localStorage.setItem('currentFormId', formId);
    localStorage.setItem('isProctored', JSON.stringify(isProctored));

    if (isProctored) {
      navigate('/camera-microphone-access');
    } else {
      navigate('/testing');
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setLoading(false);
  };

  const handleDialogStateChange = (isOpen: boolean) => {
    if (!isOpen) {
      setLoading(false);
      setDialogOpen(false);
    }
  };

  return (
    <>
      <Button className="w-full" onClick={handleStartExam} disabled={loading}>
        {loading ? <Spinner className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />} Start Exam
      </Button>
      
      <Dialog open={dialogOpen} onOpenChange={handleDialogStateChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              You have to complete this exam in one sitting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={handleDialogClose} 
              className="bg-red-500 text-white hover:bg-red-600"
            >
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button 
              onClick={confirmStartExam} 
              className="bg-green-500 text-white hover:bg-green-600"
            >
              <Check className="mr-2 h-4 w-4" /> Yes, Start Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StartExamButton;
