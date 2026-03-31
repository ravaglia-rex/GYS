import type { AssessmentProgress, StudentRow } from '../db/schoolAdminCollection';

export function normalizeRosterEmail(raw: string): string {
  return raw.trim().toLowerCase();
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
    if (p.status === 'tier_advanced' || (p.best_score != null && p.best_score > 0)) n += 1;
  }
  return n;
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
