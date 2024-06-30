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

interface WaitlistDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const WaitlistDialog: React.FC<WaitlistDialogProps> = ({ isOpen, onClose }) => {
    return (
        <Dialog open={isOpen}>
            <DialogContent className="sm:max-w-[425px] p-5">
                <DialogHeader>
                    <DialogTitle>You’re on the Waitlist!</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    <p>Thank you for participating in the Global Young Scholar Talent Search. While you have not qualified as a Global Young Scholar Candidate this time, your efforts have been recognized.</p>
                    <p>We would like to place you on our waitlist for future opportunities. Being on the waitlist means you’re still in the running to participate in the Global Young Scholar Talent Challenge.</p>
                    <p>Thank you for your hard work and dedication. We look forward to possibly welcoming you to the Global Young Scholar program in the near future.</p>
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

export default WaitlistDialog;