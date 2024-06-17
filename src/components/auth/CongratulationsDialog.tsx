import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";

// Define the props using an interface
interface CongratulationsDialogProps {
  isOpen: boolean;
  onClose: () => void;  // Function to handle closing the dialog
}

// Apply the interface to the component function
const CongratulationsDialog: React.FC<CongratulationsDialogProps> = ({ isOpen, onClose }) => {
    return (
        <Dialog open={isOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Congratulations on qualifying the GYS Talent search!</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    <p>Congratulations! Your performance on the Global Young Scholar Talent Search has made you a Global Young Scholar Candidate. Good work!</p>
                    <p>You are now invited to take the Global Young Scholar Talent Challenge, which will allow you to qualify for the Global Young Scholar (GYS) program. Being a part of this program enables talented students like you to be recognized for their academic potential.</p>
                    <p>As a GYS member, you'll enjoy fee reductions, special access to educational and enrichment programs, a global peer network, and scholarship opportunities at leading US and Indian universities.</p>
                    <p>Participating students will receive an in-depth score report detailing areas of academic strength, local, regional, and national rankings. This report provides an accurate picture of how various universities will assess their potential as future applicants.</p>
                    <p>The fee for the Global Young Scholar Exam, and for a year-long membership in the GYS program, is 1,900 INR (or the equivalent in USD).</p>
                </DialogDescription>
                <DialogFooter>
                    <DialogTrigger asChild>
                        <Button onClick={onClose}>Continue</Button>
                    </DialogTrigger>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default CongratulationsDialog;
