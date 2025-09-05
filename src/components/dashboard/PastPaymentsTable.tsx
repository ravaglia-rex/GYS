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
  TableFooter,
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
    <Card className="!bg-[rgba(30,41,59,0.8)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.1)]">
      <CardHeader className="px-7 border-b border-[rgba(255,255,255,0.1)]">
        <CardTitle className="text-white">Payments</CardTitle>
        <CardDescription className="text-[rgba(255,255,255,0.7)]">Recent payments for exams.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {payments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-[rgba(30,41,59,0.6)] border-b border-[rgba(255,255,255,0.1)]">
                <TableHead className="text-white font-semibold">Name of the Exam</TableHead>
                <TableHead className="text-white font-semibold">Date of Purchase</TableHead>
                <TableHead className="text-white font-semibold">Status</TableHead>
                <TableHead className="text-white font-semibold">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => {
                const exam = getExamDetails(payment.formId);
                return (
                  <TableRow key={payment.transactionId} className="transition duration-300 ease-in-out hover:bg-[rgba(255,255,255,0.05)]">
                    <TableCell className="text-white font-medium">{exam.cardTitle}</TableCell>
                    <TableCell className="text-[rgba(255,255,255,0.7)]">{payment.paidOn.toLocaleDateString()}</TableCell>
                    <TableCell className="text-[#8b5cf6] font-semibold">{payment.paymentStatus}</TableCell>
                    <TableCell className="text-[#8b5cf6] font-semibold">{exam.currency} {payment.amount.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter className="bg-[rgba(30,41,59,0.6)] border-t border-[rgba(255,255,255,0.1)]">
              <TableCell colSpan={4} className="text-[rgba(255,255,255,0.7)] text-center py-4">
                If the status is "failed", please retry payment after an hour. If the issue persists, please contact support at <a href="mailto:hello@argus.ai" className="text-[#8b5cf6] hover:underline">email</a>.
              </TableCell>
            </TableFooter>
          </Table>
        ) : (
          <div className="flex justify-center items-center h-48">
            <p className="text-[rgba(255,255,255,0.7)]">No previous payments found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PastPaymentsTable;