/**
 * Razorpay Import Flow limits surfaced on the school registration form (customer + shipping on order).
 * Customer name error example: "Customer name length should be between 5 and 50".
 */
export const RAZORPAY_PARTY_NAME_MIN = 5;
export const RAZORPAY_PARTY_NAME_MAX = 50;

/** Shipping address line1 - Razorpay input_validation_failed if too short/long. */
export const RAZORPAY_SHIP_LINE1_MIN = 5;
export const RAZORPAY_SHIP_LINE1_MAX = 255;

export const RAZORPAY_SHIP_LINE2_MAX = 255;

export const RAZORPAY_CITY_MIN = 2;
export const RAZORPAY_CITY_MAX = 100;

export const INDIA_PIN_LENGTH = 6;

export function partyNameLengthOk(trimmed: string): boolean {
  const n = trimmed.length;
  return n >= RAZORPAY_PARTY_NAME_MIN && n <= RAZORPAY_PARTY_NAME_MAX;
}

export function shipLine1Ok(trimmed: string): boolean {
  const n = trimmed.length;
  return n >= RAZORPAY_SHIP_LINE1_MIN && n <= RAZORPAY_SHIP_LINE1_MAX;
}

export function cityOk(trimmed: string): boolean {
  const n = trimmed.length;
  return n >= RAZORPAY_CITY_MIN && n <= RAZORPAY_CITY_MAX;
}
