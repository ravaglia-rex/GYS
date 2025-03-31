// DEPRECATED: This component is no longer used in the application

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
interface PaymentsDialogProps {
  isOpen: boolean;
  onClose: () => void;  // Function to handle closing the dialog
}

// Apply the interface to the component function
const PaymentsDialog: React.FC<PaymentsDialogProps> = ({ isOpen, onClose }) => {
    return (
        <Dialog open={isOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Pay option is currently disabled</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    <p>We're currently working with our vendors to provide a better payments experience and expand our supported payment options</p>
                    <p>The pay option remains disabled till we work through this</p>
                    <p>Thank you for your patience. We hope to get this up and ready soon!</p>
                </DialogDescription>
                <DialogFooter>
                    <DialogTrigger asChild>
                        <Button onClick={onClose}>I understand</Button>
                    </DialogTrigger>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default PaymentsDialog;