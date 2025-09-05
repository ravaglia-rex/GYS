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
      <Card className="!bg-[rgba(30,41,59,0.8)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.1)]">
        <CardHeader className="px-7 border-b border-[rgba(255,255,255,0.1)]">
          <CardTitle className="text-white">Pending Payments</CardTitle>
          <CardDescription className="text-[rgba(255,255,255,0.7)]">Exams assigned to you that haven't been paid yet.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-[rgba(30,41,59,0.6)] border-b border-[rgba(255,255,255,0.1)]">
                  <TableHead className="text-white font-semibold">Name of the Exam</TableHead>
                  <TableHead className="text-white font-semibold">Duration</TableHead>
                  <TableHead className="text-white font-semibold">Cost</TableHead>
                  <TableHead className="text-white font-semibold">Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((exam) => (
                  <React.Fragment key={exam.formId}>
                    <TableRow className={`transition duration-300 ease-in-out hover:bg-[rgba(255,255,255,0.05)] ${highlightedRow === exam.formId ? 'highlight-row bg-[rgba(139,92,246,0.1)]' : ''}`}>
                      <TableCell className="text-white font-medium">{exam.cardTitle}</TableCell>
                      <TableCell className="text-[rgba(255,255,255,0.7)]">{exam.duration} hours</TableCell>
                      <TableCell className="text-[#8b5cf6] font-semibold">{exam.currency} {exam.cost.toFixed(2)}</TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggle(exam.formId)}
                          className="flex items-center justify-center w-8 h-8 rounded-full bg-[rgba(139,92,246,0.2)] hover:bg-[rgba(139,92,246,0.3)] text-[#8b5cf6] transition-all duration-200"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openRows[exam.formId] ? 'transform rotate-180' : ''}`} />
                        </button>
                      </TableCell>
                    </TableRow>
                    {openRows[exam.formId] && (
                      <TableRow>
                        <TableCell colSpan={4} className="p-0 bg-[rgba(139,92,246,0.05)]">
                          <div className="p-4 border-l-4 border-[#8b5cf6]">
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
              <p className="text-[rgba(255,255,255,0.7)]">No pending payments found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingPaymentsTable;
