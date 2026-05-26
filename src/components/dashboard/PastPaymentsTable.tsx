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
import type { StudentPaymentHistoryItem } from "../../db/studentPaymentMappings";

function formatPaymentDate(raw: string | null): string {
  if (!raw) return "Pending";
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString() : "Pending";
}

function formatAmountPaise(raw: number | null): string {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(raw / 100);
}

function statusLabel(status: StudentPaymentHistoryItem["payment_status"]): string {
  if (status === "captured") return "Paid";
  if (status === "failed") return "Failed";
  return "Pending";
}

const PastPaymentsTable: React.FC<{ payments: StudentPaymentHistoryItem[] }> = ({ payments }) => {

  return (
    <Card className="!bg-[rgba(30,41,59,0.8)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.1)]">
      <CardHeader className="px-7 border-b border-[rgba(255,255,255,0.1)]">
        <CardTitle className="text-white">Payment History</CardTitle>
        <CardDescription className="text-[rgba(255,255,255,0.7)]">
          Package purchases, membership upgrades, renewals, and failed attempts.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {payments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-[rgba(30,41,59,0.6)] border-b border-[rgba(255,255,255,0.1)]">
                <TableHead className="text-white font-semibold">Description</TableHead>
                <TableHead className="text-white font-semibold">Date</TableHead>
                <TableHead className="text-white font-semibold">Status</TableHead>
                <TableHead className="text-white font-semibold">Method</TableHead>
                <TableHead className="text-white font-semibold">Transaction</TableHead>
                <TableHead className="text-white font-semibold">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.payment_id || payment.id} className="transition duration-300 ease-in-out hover:bg-[rgba(255,255,255,0.05)]">
                  <TableCell className="text-white font-medium">{payment.description}</TableCell>
                  <TableCell className="text-[rgba(255,255,255,0.7)]">{formatPaymentDate(payment.paid_at)}</TableCell>
                  <TableCell className={payment.payment_status === "failed" ? "text-red-300 font-semibold" : "text-[#8b5cf6] font-semibold"}>
                    {statusLabel(payment.payment_status)}
                  </TableCell>
                  <TableCell className="text-[rgba(255,255,255,0.7)]">{payment.payment_method}</TableCell>
                  <TableCell className="text-[rgba(255,255,255,0.7)]">{payment.payment_id}</TableCell>
                  <TableCell className="text-[#8b5cf6] font-semibold">{formatAmountPaise(payment.amount_paise)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
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