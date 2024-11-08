import React, { useState, useEffect } from "react";
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
import { ExamDetailsPayload } from "../../state_data/examDetailsSlice";
import { ChevronDown } from 'lucide-react';
import PayeeDetailsForm from "./PayeeDetailsForm";
import { useToast } from "../ui/use-toast";

type PendingPaymentsTableProps = {
  payments: ExamDetailsPayload[];
  highlightPaymentsEntry?: string;
};

const PendingPaymentsTable: React.FC<PendingPaymentsTableProps> = ({ payments, highlightPaymentsEntry }) => {
  const [openRows, setOpenRows] = useState<{ [key: string]: boolean }>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [highlightedRow, setHighlightedRow] = useState<string | null>(highlightPaymentsEntry || null);
  const { toast } = useToast();

  useEffect(() => {
    if (highlightPaymentsEntry) {
      // Display a toast notification
      toast({
        variant: 'default',
        title: 'Payment Required',
        description: 'Please complete the payment for the selected exam.',
        duration: 2000,
      });

      setHighlightedRow(highlightPaymentsEntry);

      // Remove highlight after 3 seconds
      const timer = setTimeout(() => setHighlightedRow(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [highlightPaymentsEntry, toast]);

  const handleToggle = (formId: string) => {
    setOpenRows((prevOpenRows) => ({
      ...prevOpenRows,
      [formId]: !prevOpenRows[formId],
    }));
    setIsDialogOpen(!isDialogOpen);
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
                  <TableHead>Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((exam) => (
                  <React.Fragment key={exam.formId}>
                    <TableRow className={`transition duration-300 ease-in-out ${highlightedRow === exam.formId ? 'highlight-row' : ''}`}>
                      <TableCell>{exam.cardTitle}</TableCell>
                      <TableCell>{exam.duration} hours</TableCell>
                      <TableCell>{exam.currency} {exam.cost.toFixed(2)}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggle(exam.formId)}
                          className="flex items-center space-x-2"
                        >
                          <ChevronDown className={`transition-transform duration-300 ${openRows[exam.formId] ? 'transform rotate-180' : ''}`} />
                        </button>
                      </TableCell>
                    </TableRow>
                    {openRows[exam.formId] && (
                      <TableRow>
                        <TableCell colSpan={4} className="p-0">
                          <div className="p-4">
                            <PayeeDetailsForm
                              formId={exam.formId}
                              currency={exam.currency}
                              cost={exam.cost}
                              title={exam.cardTitle}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
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
    </div>
  );
};

export default PendingPaymentsTable;
