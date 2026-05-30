/** Razorpay Checkout `method` - "1" enabled, "0" hidden in the payment modal. */
export const RAZORPAY_CHECKOUT_METHOD = {
  upi: '1',
  card: '1',
  netbanking: '1',
  wallet: '0',
  paylater: '0',
} as const;
