import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { Button } from "../ui/button";

interface RefundPolicyDialogProps {
  isOpen: boolean;
  onClose: () => void;  // Function to handle closing the dialog
}

const RefundPolicyDialog: React.FC<RefundPolicyDialogProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 p-6">
        <DialogHeader>
          <DialogTitle className="text-white">Refund Policy</DialogTitle>
          <DialogDescription className="text-slate-300">
            We want to ensure a transparent and hassle-free experience. Please review our refund policy before completing your purchase.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-48">
          <div className="p-4 space-y-4 text-sm text-slate-300">
            <p><strong>1. Refund Eligibility:</strong></p>
            <ul className="pl-4 list-disc space-y-2">
              <li>Refunds are available for defective services, technical disruptions, or if the service provided does not match its description.</li>
              <li>Refunds are not available for partially used or completed services (e.g., assessments).</li>
            </ul>
            <p><strong>2. How to Request a Refund:</strong></p>
            <ul className="pl-4 list-disc space-y-2">
              <li>Refund requests must be submitted within 7 days of purchase.</li>
              <li>Contact us at <a href="mailto:hello@argus.ai" className="text-blue-500 underline">hello@argus.ai</a> with your purchase details and the reason for your request.</li>
            </ul>
            <p><strong>3. Refund Timeline and Method:</strong></p>
            <ul className="pl-4 list-disc space-y-2">
              <li>Approved refunds will be processed within 7-14 working days via the original payment method. If your payment method is inactive, we will issue a store credit or alternative refund.</li>
            </ul>
            <p><strong>4. Missed Sessions or Services:</strong></p>
            <ul className="pl-4 list-disc space-y-2">
              <li>If you miss an assessment or session, you may reschedule it for a small fee, subject to availability.</li>
            </ul>
            <p><strong>5. Customer Support and Grievance Handling:</strong></p>
            <ul className="pl-4 list-disc space-y-2">
              <li>For refund inquiries, contact our Grievance Officer at <a href="mailto:hello@argus.ai" className="text-blue-500 underline">hello@argus.ai</a>.</li>
              <li>A tracking number will be issued to keep you updated on the status of your request.</li>
            </ul>
            <p><strong>6. Force Majeure Policy:</strong></p>
            <ul className="pl-4 list-disc space-y-2">
              <li>Refunds may not apply if services are affected by circumstances beyond our control, such as natural disasters.</li>
            </ul>
          </div>
          <ScrollBar />
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RefundPolicyDialog;
