import React, { useState, useEffect } from "react";

import { auth } from "../../firebase/firebase";
import {
  handleOrderExam,
  getRazorpayPayees,
} from "../../functions/payment_handling/razorpay_functions";

import RenderRazorpay from "./RenderRazorpay";
import AddPayeeDialog from "./AddPayeeDialog";
import RefundPolicyDialog from "./RefundPolicyDialog";
import PayeesInput from "../autocomplete/PayeesInput";
import { useToast } from '../ui/use-toast';
import * as Sentry from '@sentry/react';

interface PayeeDetailsFormProps {
  formId: string;
  currency: string;
  cost: number;
  title: string;
}

interface Payee {
  id: string;
  name: string;
  email: string;
  contact: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
}

const PayeeDetailsForm: React.FC<PayeeDetailsFormProps> = ({
  formId,
  currency,
  cost,
  title,
}) => {
  const [payees, setPayees] = useState<Payee[]>([]);
  const [order_id, setOrder_id] = useState<string>("");

  const [selectedPayee, setSelectedPayee] = useState<Payee | null>(null);
  const [isAddPayeeOpen, setIsAddPayeeOpen] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [canProceed, setCanProceed] = useState<boolean>(false);

  const email = auth.currentUser?.email || "";
  const uid = auth.currentUser?.uid || "";

  const { toast } = useToast();

  useEffect(() => {
    const fetchPayees = async () => {
      try {
        const res = await getRazorpayPayees(uid);
        // Change razorpay_id to id for consistency
        res.forEach((payee:any) => {
          payee.id = payee.razorpay_id;
          payee.address_line_1 = payee.line1;
          payee.address_line_2 = payee.line2;
          delete payee.razorpay_id;
          delete payee.line1;
          delete payee.line2;
        });
        setPayees(res);
      } catch (e) {
        Sentry.withScope((scope) => {
          scope.setTag('location', 'PayeeDetailsForm.fetchPayees');
          scope.setExtra('userID', uid);
          Sentry.captureException(e);
        });
        toast({
          variant: 'destructive',
          title: 'Uh oh!',
          description: 'Error fetching payees',
        });
      }
    };
    fetchPayees();
  }, [uid, toast]);

  const handlePayeeSelection = (payeeId: string) => {
    if (payeeId === "new") {
      setIsAddPayeeOpen(true);
    } else {
      const selected = payees.find((payee) => payee.id === payeeId);
      if (selected) {
        setSelectedPayee(selected);
        setCanProceed(false); // Reset proceed state
      }
    }
  };

  const handleAddPayee = (newPayee: any) => {
    setPayees((prevPayees) => [...prevPayees, newPayee]);
    // Before setting the new payee as selected, we need to cast it as a Payee object
    try {
      const newPayeeObj = {
        id: newPayee.id,
        name: newPayee.name,
        email: newPayee.email,
        contact: newPayee.contact,
        address_line_1: newPayee.notes.line1,
        address_line_2: newPayee.notes.line2,
        city: newPayee.notes.city,
        state: newPayee.notes.state,
        country: newPayee.notes.country,
        zipcode: newPayee.notes.zipcode,
      };
      setSelectedPayee(newPayeeObj);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Uh oh!',
        description: newPayee.message,
      });
      Sentry.withScope((scope) => {
        scope.setTag('location', 'PayeeDetailsForm.handleAddPayee');
        scope.setExtra('newPayee', newPayee);
        Sentry.captureException(error);
      });
    }
  };

  const handleConfirm = async () => {
    if (!selectedPayee) return;

    setIsConfirming(true); // Show spinner
    try {
      const order = await handleOrderExam(
        cost*1.18,
        currency,
        selectedPayee.name,
        selectedPayee.contact,
        selectedPayee.email,
        selectedPayee.address_line_1,
        selectedPayee.address_line_2,
        selectedPayee.city,
        selectedPayee.state,
        selectedPayee.zipcode,
        selectedPayee.country,
        formId,
        title,
        uid
      );
      setOrder_id(order.id);
      setCanProceed(true); // Allow proceeding to payment
    } catch (error) {
      console.error("Error confirming order:", error);
    } finally {
      setIsConfirming(false); // Hide spinner
    }
  };
 
  useEffect(() => {
    const styleId = "remove-tr-hover";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        /* Remove hover background */
        tr:hover.bg-muted\\/50,
        tr.hover\\:bg-muted\\/50:hover {
          background-color: transparent !important;
        }
  
        /* Remove purple left border */
        td > div.border-l-4.border-\\[\\#8b5cf6\\] {
          border-left: none !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  


  return (
    <div>
      <RefundPolicyDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
      <AddPayeeDialog
        isOpen={isAddPayeeOpen}
        onClose={() => setIsAddPayeeOpen(false)}
        onAddPayee={handleAddPayee}
      />
      <div>
        <label htmlFor="payee-select" className="mb-2 block font-medium text-white text-lg">
          Select Payer:
        </label>
        <PayeesInput
          payees={payees}
          onSelect={(payeeId) => handlePayeeSelection(payeeId)}
          loading={!payees}
        />
      </div>

      {selectedPayee && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-white mb-3">Payer Details:</h3>
          
          <ul className="mb-4 space-y-1 text-white [&_li:hover]:bg-transparent [&_li:hover]:text-white">

            <li><strong>Name:</strong> {selectedPayee.name}</li>
            <li><strong>Email:</strong> {selectedPayee.email}</li>
            <li><strong>Contact:</strong> {selectedPayee.contact}</li>
            <li><strong>Address:</strong> {selectedPayee.address_line_1}, {selectedPayee.address_line_2}</li>
            <li>
              <strong>Location:</strong> {selectedPayee.city}, {selectedPayee.state}, {selectedPayee.country} - {selectedPayee.zipcode}
            </li>
            <li>
              <strong>Cost:</strong> {cost} {currency}
            </li>
            <li>
              <strong>GST:</strong> 18%
            </li>
            <li>
              <strong>Total:</strong> {cost + cost * 0.18} {currency}
            </li>
          </ul>

          {!canProceed ? (
            // Add a link to the refund policy dialog
            <div className="mb-4">
              <p className="mb-2 text-white">By proceeding, you agree to our refund policy:</p>
              <p className="text-blue-600 underline cursor-pointer mb-4" onClick={() => setIsDialogOpen(true)}>Refund Policy</p>
            
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={isConfirming}
            >
              {isConfirming ? "Confirming..." : "Confirm"}
            </button>
          </div>
          ) : !isPaying ? (
            <button
              onClick={() => setIsPaying(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Proceed to Pay
            </button>
          ) : (
            <RenderRazorpay
              amount={cost * 100 * 1.18}
              currency={currency}
              order_id={order_id}
              form_id={formId}
              title={title}
              payee_name={selectedPayee.name}
              payee_email={selectedPayee.email}
              payee_contact={selectedPayee.contact}
              id={selectedPayee.id}
              uid={uid}
              email={email}
              address_line_1={selectedPayee.address_line_1}
              city={selectedPayee.city}
              state={selectedPayee.state}
              zipcode={selectedPayee.zipcode}
              country={selectedPayee.country}
              keyID={process.env.REACT_APP_RAZORPAY_KEY_ID || ""}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PayeeDetailsForm;
