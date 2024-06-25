import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { ExamDetailsPayload } from "../../state_data/examDetailsSlice";
import { auth } from "../../firebase/firebase";
import { handleOrderExam } from "../../functions/payment_handling/razorpay_functions";
import RenderRazorpay from "./RenderRazorpay";
import {LoadingSpinner as Spinner } from "../ui/spinner"; // Import the Spinner component

const PendingPaymentsTable: React.FC<{ payments: ExamDetailsPayload[] }> = ({ payments }) => {
  const [displayRazorpay, setDisplayRazorpay] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState({
    amount: -1,
    form_id: "",
    title: "",
    id: "",
    currency: "",
    uid: auth.currentUser?.uid || "",
  });

  const handlePayNow = async (formId: string, title: string, cost: number, currency: string) => {
    setLoadingPayment(formId);
    try {
      const data = await handleOrderExam(cost, currency, formId);

      if (data && data.id) {
        setOrderDetails({
          amount: data.amount,
          form_id: formId,
          title: title,
          id: data.id,
          currency: data.currency,
          uid: auth.currentUser?.uid || "",
        });
        setDisplayRazorpay(true);
      }
    } catch (error) {
      console.error("Error creating order:", error);
    } finally {
      setLoadingPayment(null); // Reset loading state
    }
  };

  return (
    <div>
      <Card>
        <CardHeader className="px-7">
          <CardTitle>Pending Payments</CardTitle>
          <CardDescription>Exams assigned to you that haven't been paid yet.</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name of the Exam</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Pay Now</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((exam) => (
                  <TableRow key={exam.formId}>
                    <TableCell>{exam.cardTitle}</TableCell>
                    <TableCell>{exam.duration} hours</TableCell>
                    <TableCell>{exam.currency} {exam.cost.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handlePayNow(exam.formId, exam.cardTitle, exam.cost, exam.currency)}
                        disabled={loadingPayment === exam.formId}
                      >
                        {loadingPayment === exam.formId ? <Spinner /> : "Pay Now"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex justify-center items-center h-48">
              <p className="text-gray-500">No pending payments found.</p>
            </div>
          )}
        </CardContent>
      </Card>
      {displayRazorpay && (
        <RenderRazorpay
          amount={orderDetails.amount}
          currency={orderDetails.currency}
          form_id={orderDetails.form_id}
          title={orderDetails.title}
          id={orderDetails.id}
          uid={orderDetails.uid}
          keyID={process.env.REACT_APP_RAZORPAY_KEY_ID || ""}
        />
      )}
    </div>
  );
}

export default PendingPaymentsTable;
