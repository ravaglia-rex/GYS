/**
 * Razorpay `notes.invoice_number` / billing display: readable GYS label plus a short unique tail
 * from the order id. Must stay aligned with backend `schoolBillingInvoiceNumber`.
 */
export function gysPaymentInvoiceNumberFromOrderId(orderId: string): string {
  const raw = orderId.trim();
  const stripped = raw.replace(/^order_/i, '');
  const compact = stripped.replace(/[^a-zA-Z0-9]/g, '').slice(0, 22);
  if (compact.length > 0) {
    return `GYS_Invoice_${compact}`;
  }
  const fallback = raw.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^order_/i, '');
  const tail = fallback.slice(0, 22);
  return `GYS_Invoice_${tail.length > 0 ? tail : 'REF'}`;
}
