/** Class section: presets A–G, or free-text Other (always stored uppercase). */

export const STUDENT_SECTION_PRESETS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
export type StudentSectionPreset = (typeof STUDENT_SECTION_PRESETS)[number];

/** UI sentinel for the Other option (never stored on the student doc). */
export const STUDENT_SECTION_OTHER = 'OTHER';

const SECTION_MAX_LEN = 12;

export function isStudentSectionPreset(value: string): value is StudentSectionPreset {
  return (STUDENT_SECTION_PRESETS as readonly string[]).includes(value);
}

/** Trim, strip junk, uppercase — empty when absent. */
export function normalizeStudentSection(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-zA-Z0-9\s\-.]/g, '')
    .slice(0, SECTION_MAX_LEN)
    .trim()
    .toUpperCase();
}

export type StudentSectionUiChoice = '' | StudentSectionPreset | typeof STUDENT_SECTION_OTHER;

/** Map a stored section onto dropdown choice + Other text. */
export function studentSectionToUi(stored: unknown): {
  choice: StudentSectionUiChoice;
  otherText: string;
} {
  const normalized = normalizeStudentSection(stored);
  if (!normalized) return { choice: '', otherText: '' };
  if (isStudentSectionPreset(normalized)) return { choice: normalized, otherText: '' };
  return { choice: STUDENT_SECTION_OTHER, otherText: normalized };
}

/** Resolve dropdown choice (+ optional Other text) to the value we store. */
export function studentSectionFromUi(
  choice: StudentSectionUiChoice,
  otherText = ''
): string {
  if (!choice) return '';
  if (choice === STUDENT_SECTION_OTHER) return normalizeStudentSection(otherText);
  return normalizeStudentSection(choice);
}
