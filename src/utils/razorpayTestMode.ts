const TRUE_VALUES = new Set(['true', '1', 'yes', 'on']);

export const RAZORPAY_FRONTEND_TEST_MODE = TRUE_VALUES.has(
  (process.env.REACT_APP_RAZORPAY_TEST_MODE ?? '').trim().toLowerCase()
);

export function razorpayKeyMode(keyId: string): 'test' | 'live' | 'unknown' {
  if (keyId.startsWith('rzp_test_')) return 'test';
  if (keyId.startsWith('rzp_live_')) return 'live';
  return 'unknown';
}

export function assertRazorpayCheckoutKeyAllowed(keyId: string, flowName: string): void {
  const mode = razorpayKeyMode(keyId);
  if (RAZORPAY_FRONTEND_TEST_MODE && mode !== 'test') {
    throw new Error(`${flowName} is in Razorpay test mode, but checkout returned a non-test key.`);
  }

  if (process.env.NODE_ENV === 'development') {
    const prefix = keyId.slice(0, 16);
    if (mode === 'live') {
      console.warn(`[Razorpay:${flowName}] LIVE key returned: ${prefix}`);
    } else {
      console.info(`[Razorpay:${flowName}] key mode: ${mode}; prefix: ${prefix}`);
    }
    if (keyId.includes('_us_')) {
      console.warn(
        `[Razorpay:${flowName}] US test key detected. For plain INR testing, use India test keys without _us_.`
      );
    }
  }
}
