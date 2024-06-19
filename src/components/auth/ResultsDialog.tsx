import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface ResultsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  remainingDays: number;
  remainingHours: number;
}

const ResultsDialog: React.FC<ResultsDialogProps> = ({ isOpen, onClose, remainingDays, remainingHours }) => {
    return (
        <Dialog open={isOpen}>
            <DialogContent className="sm:max-w-[425px] p-5">
                <DialogHeader>
                    <DialogTitle>Check Exam Results</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    You need to wait {remainingDays} days and {remainingHours} hours to check your exam results.
                </DialogDescription>
                <DialogFooter>
                    <DialogTrigger asChild>
                        <Button onClick={onClose}>Close</Button>
                    </DialogTrigger>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default ResultsDialog;