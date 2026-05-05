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
