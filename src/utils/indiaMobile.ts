/** Same rules as backend `normalizeIndiaMobileE164` - E.164 India mobile. */
export function normalizeIndiaMobileE164(raw: string): string | null {
  const s = raw.trim().replace(/\s/g, '');
  if (!s) return null;
  const digitsOnly = s.replace(/\D/g, '');
  if (digitsOnly.length === 10 && /^[6-9]\d{9}$/.test(digitsOnly)) {
    return `+91${digitsOnly}`;
  }
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0') && /^0[6-9]\d{9}$/.test(digitsOnly)) {
    return `+91${digitsOnly.slice(1)}`;
  }
  if (
    digitsOnly.length === 12 &&
    digitsOnly.startsWith('91') &&
    /^91[6-9]\d{9}$/.test(digitsOnly)
  ) {
    return `+${digitsOnly}`;
  }
  if (/^\+91[6-9]\d{9}$/.test(s)) {
    return s;
  }
  return null;
}

export function isValidIndiaMobile(raw: string): boolean {
  return normalizeIndiaMobileE164(raw) !== null;
}

export function toIndiaMobileNationalDigits(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, '');
  if (digitsOnly.length >= 12 && digitsOnly.startsWith('91')) {
    return digitsOnly.slice(2, 12);
  }
  if (digitsOnly.length >= 11 && digitsOnly.startsWith('0')) {
    return digitsOnly.slice(1, 11);
  }
  return digitsOnly.slice(0, 10);
}

export function withIndiaCountryCode(nationalDigits: string): string {
  const digits = toIndiaMobileNationalDigits(nationalDigits);
  return digits ? `+91${digits}` : '';
}

/** Dial codes allowed on school registration (India + Qatar). */
export type SchoolPhoneDialCode = '91' | '974';

/** Qatar mobiles are 8 digits (commonly starting 3–7). */
export function normalizeQatarMobileE164(raw: string): string | null {
  const s = raw.trim().replace(/\s/g, '');
  if (!s) return null;
  const digitsOnly = s.replace(/\D/g, '');
  if (digitsOnly.length === 8 && /^[3-7]\d{7}$/.test(digitsOnly)) {
    return `+974${digitsOnly}`;
  }
  if (
    digitsOnly.length === 11 &&
    digitsOnly.startsWith('974') &&
    /^974[3-7]\d{7}$/.test(digitsOnly)
  ) {
    return `+${digitsOnly}`;
  }
  if (/^\+974[3-7]\d{7}$/.test(s)) {
    return s;
  }
  return null;
}

export function toSchoolMobileNationalDigits(
  raw: string,
  dial: SchoolPhoneDialCode
): string {
  const digitsOnly = raw.replace(/\D/g, '');
  if (dial === '974') {
    if (digitsOnly.length >= 11 && digitsOnly.startsWith('974')) {
      return digitsOnly.slice(3, 11);
    }
    return digitsOnly.slice(0, 8);
  }
  return toIndiaMobileNationalDigits(raw);
}

export function isValidSchoolRegistrationMobile(
  nationalDigits: string,
  dial: SchoolPhoneDialCode
): boolean {
  if (dial === '974') {
    return normalizeQatarMobileE164(nationalDigits) !== null;
  }
  return isValidIndiaMobile(nationalDigits);
}

export function withSchoolCountryCode(
  nationalDigits: string,
  dial: SchoolPhoneDialCode
): string {
  const digits = toSchoolMobileNationalDigits(nationalDigits, dial);
  if (!digits) return '';
  if (dial === '974') {
    return normalizeQatarMobileE164(digits) ?? `+974${digits}`;
  }
  return withIndiaCountryCode(digits);
}

export function schoolPhoneDialForCountry(country: 'India' | 'Qatar'): SchoolPhoneDialCode {
  return country === 'Qatar' ? '974' : '91';
}

export function schoolPhoneDialFromE164(raw: string): SchoolPhoneDialCode {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('974') || raw.trim().startsWith('+974')) return '974';
  return '91';
}

export function schoolPhoneMaxNationalDigits(dial: SchoolPhoneDialCode): number {
  return dial === '974' ? 8 : 10;
}

export function schoolPhoneValidationMessage(dial: SchoolPhoneDialCode): string {
  return dial === '974'
    ? 'Enter a valid 8-digit Qatar mobile number.'
    : 'Enter a valid 10-digit Indian mobile number starting with 6–9.';
}

export function isValidAnyRegistrationMobile(raw: string): boolean {
  return (
    normalizeIndiaMobileE164(raw) !== null || normalizeQatarMobileE164(raw) !== null
  );
}

export function parseSchoolCountry(raw: unknown): 'India' | 'Qatar' {
  return raw === 'Qatar' ? 'Qatar' : 'India';
}
