import React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import { useSelector } from "react-redux";
import { RootState } from "../../state_data/reducer";

interface Payment {
  paidOn: Date;
  paymentMethod: string;
  paymentStatus: string;
  transactionId: string;
  uid: string;
  formId: string;
  amount: number;
}

const PastPaymentsTable: React.FC<{ payments: Payment[] }> = ({ payments }) => {
  const examDetails = useSelector((state: RootState) => state.examDetails.examDetails);

  const getExamDetails = (formId: string) => {
    return examDetails.find((exam) => exam.formId === formId) || { cardTitle: "Unknown Exam", currency: "USD" };
  }

  return (
    <Card>
      <CardHeader className="px-7">
        <CardTitle>Payments</CardTitle>
        <CardDescription>Recent payments for exams.</CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name of the Exam</TableHead>
                <TableHead>Date of Purchase</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => {
                const exam = getExamDetails(payment.formId);
                return (
                  <TableRow key={payment.transactionId}>
                    <TableCell>{exam.cardTitle}</TableCell>
                    <TableCell>{payment.paidOn.toLocaleDateString()}</TableCell>
                    <TableCell>{payment.paymentStatus}</TableCell>
                    <TableCell>{exam.currency} {payment.amount.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex justify-center items-center h-48">
            <p className="text-gray-500">No previous payments found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PastPaymentsTable;