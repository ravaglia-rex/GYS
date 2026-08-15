import type { AssessmentProgress, StudentRow } from '../db/schoolAdminCollection';
import { isHiddenStaffStudentEmail } from '../constants/hiddenStaffStudents';

export function normalizeRosterEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Drop staff shadow student aliases from school-facing invite / roster lists. */
export function filterHiddenStaffStudentEmails(emails: string[]): string[] {
  return emails.filter((email) => !isHiddenStaffStudentEmail(normalizeRosterEmail(email)));
}

export function isVisibleSchoolRosterStudent(student: Pick<StudentRow, 'email'>): boolean {
  return !isHiddenStaffStudentEmail(student.email);
}

/** Parse emails from CSV-ish text: newlines, commas, semicolons. */
export function parseEmailsFromBulkText(text: string): string[] {
  const parts = text
    .split(/[\n\r,;]+/g)
    .map(s => s.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  const simple = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const p of parts) {
    const n = normalizeRosterEmail(p);
    if (!simple.test(n) || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

export function countAssessmentsFromProgress(progress: Record<string, AssessmentProgress> | undefined): number {
  if (!progress) return 0;
  let n = 0;
  for (const p of Object.values(progress)) {
    if (slotHasGradedAttempt(p)) n += 1;
  }
  return n;
}

/** Graded attempt or finished non-scored exam - not merely unlocked (`available`). */
export function slotHasGradedAttempt(p: {
  status?: string;
  best_score?: number | null;
  attempts_count?: number;
  latest_attempt_score?: number | null;
}): boolean {
  const st = String(p.status ?? '').toLowerCase();
  if (st === 'tier_advanced' || st === 'completed') return true;
  const attempts = Number(p.attempts_count);
  if (Number.isFinite(attempts) && attempts > 0) return true;
  if (p.latest_attempt_score != null && Number.isFinite(Number(p.latest_attempt_score))) return true;
  if (p.best_score != null && Number.isFinite(Number(p.best_score))) return true;
  return false;
}

export function mergeRegistrationEmailLists(current: string[], additions: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of [...current, ...additions]) {
    const n = normalizeRosterEmail(e);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

export function dashboardRowByUid(students: StudentRow[] | undefined, uid: string): StudentRow | undefined {
  return (students ?? []).find(s => s.uid === uid);
}
