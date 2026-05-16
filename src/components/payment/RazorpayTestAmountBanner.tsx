import React from 'react';
import { razorpayTestAmountDisplayLabel } from '../../utils/razorpayTestAmountEnv';

/** Shown when `REACT_APP_RAZORPAY_TEST_AMOUNT_PAISE` is set (local / staging alignment with Functions). */
const RazorpayTestAmountBanner: React.FC = () => {
  const label = razorpayTestAmountDisplayLabel();
  if (!label) {
    return null;
  }
  return (
    <div
      className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950"
      role="status"
    >
      <strong>Payment test mode:</strong> checkout will charge <strong>{label}</strong> when the API has{' '}
      <code className="rounded bg-amber-100/80 px-1">RAZORPAY_TEST_AMOUNT_PAISE</code> set to the same paise
      value. Other screens may still show list prices.
    </div>
  );
};

export default RazorpayTestAmountBanner;
