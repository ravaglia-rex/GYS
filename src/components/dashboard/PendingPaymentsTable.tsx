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
import { Button } from "../ui/button";
import { ExamDetailsPayload } from "../../state_data/examDetailsSlice";

const PendingPaymentsTable: React.FC<{ payments: ExamDetailsPayload[] }> = ({ payments }) => {
  const handlePayNow = (formId: string) => {
    console.log(`Pay now for formId: ${formId}`);
  };

  return (
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
                    <Button onClick={() => handlePayNow(exam.formId)}>Pay Now</Button>
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
  )
}

export default PendingPaymentsTable;
