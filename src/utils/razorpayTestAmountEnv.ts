/**
 * Mirrors optional `RAZORPAY_TEST_AMOUNT_PAISE` on Cloud Functions (e.g. 100 = ₹1 live smoke test).
 * Set `REACT_APP_RAZORPAY_TEST_AMOUNT_PAISE` in `argus-frontend/.env` to the same value for UI hints.
 */

export function getReactAppRazorpayTestAmountPaise(): number | null {
  const raw = (process.env.REACT_APP_RAZORPAY_TEST_AMOUNT_PAISE ?? '').trim();
  if (!raw) {
    return null;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) {
    return null;
  }
  return Math.round(n);
}

export function razorpayTestAmountDisplayLabel(): string | null {
  const p = getReactAppRazorpayTestAmountPaise();
  if (p === null) {
    return null;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(p / 100);
}
