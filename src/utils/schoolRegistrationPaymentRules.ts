/**
 * Razorpay Import Flow limits for school registration (customer + shipping on order).
 * @see https://razorpay.com/docs/payments/international-payments/accept-international-payments-from-indian-customers/custom-integration/build-integration/
 */
export const RAZORPAY_PARTY_NAME_MIN = 5;
export const RAZORPAY_PARTY_NAME_MAX = 50;

export const RAZORPAY_SHIP_LINE1_MIN = 3;
export const RAZORPAY_SHIP_LINE1_MAX = 100;

/** When provided, line2 must meet the same rules as line1. */
export const RAZORPAY_SHIP_LINE2_MIN = 3;
export const RAZORPAY_SHIP_LINE2_MAX = 100;

export const RAZORPAY_CITY_MIN = 3;
export const RAZORPAY_CITY_MAX = 50;

export const RAZORPAY_STATE_MIN = 3;
export const RAZORPAY_STATE_MAX = 50;

export const RAZORPAY_EMAIL_LOCAL_MAX = 64;

export const INDIA_PIN_LENGTH = 6;

/** City and state: English letters and spaces only. */
export const RAZORPAY_LATIN_NAME_RE = /^[A-Za-z ]+$/;

/** Razorpay customer/order party names are safest with English letters and spaces only. */
export const RAZORPAY_PARTY_NAME_CHARS_RE = RAZORPAY_LATIN_NAME_RE;

/** Address lines: alphanumeric plus Razorpay-allowed punctuation (no regional scripts). */
export const RAZORPAY_SHIP_LINE_CHARS_RE = /^[A-Za-z0-9 *&/\-()#_+[\]:'",.]+$/;

function lengthOk(n: number, min: number, max: number): boolean {
  return n >= min && n <= max;
}

export function partyNameLengthOk(trimmed: string): boolean {
  return lengthOk(trimmed.length, RAZORPAY_PARTY_NAME_MIN, RAZORPAY_PARTY_NAME_MAX);
}

export function partyNameCharsOk(trimmed: string): boolean {
  return RAZORPAY_PARTY_NAME_CHARS_RE.test(trimmed);
}

export function sanitizePartyNameInput(raw: string): string {
  return raw.replace(/[^A-Za-z ]/g, '');
}

export function sanitizeShipLineInput(raw: string): string {
  return raw.replace(/[^A-Za-z0-9 *&/\-()#_+[\]:'",.]/g, '');
}

export function sanitizeLatinNameInput(raw: string): string {
  return raw.replace(/[^A-Za-z ]/g, '');
}

export function shipLine1Ok(trimmed: string): boolean {
  const n = trimmed.length;
  return (
    lengthOk(n, RAZORPAY_SHIP_LINE1_MIN, RAZORPAY_SHIP_LINE1_MAX) &&
    RAZORPAY_SHIP_LINE_CHARS_RE.test(trimmed)
  );
}

export function shipLine2Ok(trimmed: string): boolean {
  if (!trimmed) return true;
  const n = trimmed.length;
  return (
    lengthOk(n, RAZORPAY_SHIP_LINE2_MIN, RAZORPAY_SHIP_LINE2_MAX) &&
    RAZORPAY_SHIP_LINE_CHARS_RE.test(trimmed)
  );
}

export function cityOk(trimmed: string): boolean {
  const n = trimmed.length;
  return (
    lengthOk(n, RAZORPAY_CITY_MIN, RAZORPAY_CITY_MAX) && RAZORPAY_LATIN_NAME_RE.test(trimmed)
  );
}

export function stateOk(trimmed: string): boolean {
  const n = trimmed.length;
  return (
    lengthOk(n, RAZORPAY_STATE_MIN, RAZORPAY_STATE_MAX) && RAZORPAY_LATIN_NAME_RE.test(trimmed)
  );
}

export function razorpayEmailOk(email: string): boolean {
  const trimmed = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;
  const local = trimmed.split('@')[0] ?? '';
  return local.length > 0 && local.length <= RAZORPAY_EMAIL_LOCAL_MAX;
}

export function shipLineCharsError(fieldLabel: string): string {
  return `${fieldLabel} may only use English letters, numbers, spaces, and these symbols: *&/-()#_+[]:'",.`;
}

export function partyNameCharsError(fieldLabel: string): string {
  return `${fieldLabel} may only use English letters and spaces. Please remove numbers, commas, periods, apostrophes, and other symbols.`;
}
