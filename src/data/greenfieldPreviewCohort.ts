/**
 * Deterministic cohort mirroring `seedGreenfieldGysReport.js` for Greenfield International School
 * (srishti+6@argus.ai / school id `greenfield_international_bangalore`).
 * Same tier splits, triad counts (44 / 13 / 85), and grade mix (50×6, 52×7, 40×8) - order is fixed (no shuffle).
 */
import type { AssessmentProgress, StudentRow } from '../db/schoolAdminCollection';

export const GREENFIELD_SCHOOL_FIRESTORE_ID = 'greenfield_international_bangalore';

const CANONICAL_ASSESSMENT_IDS = [
  'symbolic_reasoning',
  'verbal_reasoning',
  'mathematical_reasoning',
  'personality_assessment',
  'english_proficiency',
  'ai_literacy',
  'comprehensive_personality',
] as const;

function baseAssessmentProgress(): Record<string, AssessmentProgress> {
  const progress: Record<string, AssessmentProgress> = {};
  for (const id of CANONICAL_ASSESSMENT_IDS) {
    progress[id] = {
      proficiency_tier: 1,
      status: 'locked',
      best_score: null,
      attempts_count: 0,
      tiers_cleared: {},
    };
  }
  return progress;
}

function scoreJitter(i: number, span: number): number {
  return (((i * 7919 + 104729) % 1000) / 1000) * span;
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

function symbolicProgressFromPerfTier(perfTier: string, studentIndex: number): AssessmentProgress {
  const t = String(perfTier).toLowerCase();
  if (t === 'gold') {
    return {
      proficiency_tier: 4,
      status: 'tier_advanced',
      best_score: round2(0.78 + scoreJitter(studentIndex, 0.12)),
      attempts_count: 3,
      tiers_cleared: { 1: true, 2: true, 3: true },
    };
  }
  if (t === 'silver') {
    return {
      proficiency_tier: 4,
      status: 'tier_advanced',
      best_score: round2(0.66 + scoreJitter(studentIndex + 11, 0.1)),
      attempts_count: 3,
      tiers_cleared: { 1: true, 2: true, 3: true },
    };
  }
  /** Proficiency Tier 1 (Bronze band) - matches dashboard Tier 1 = Bronze. */
  if (t === 'bronze') {
    return {
      proficiency_tier: 1,
      status: 'available',
      best_score: round2(0.44 + scoreJitter(studentIndex + 23, 0.08)),
      attempts_count: 1,
      tiers_cleared: {},
    };
  }
  return {
    proficiency_tier: 2,
    status: 'available',
    best_score: round2(0.38 + scoreJitter(studentIndex + 37, 0.1)),
    attempts_count: 2,
    tiers_cleared: { 1: true },
  };
}

function verbalProgressFromPerfTier(perfTier: string, studentIndex: number): AssessmentProgress {
  const t = String(perfTier).toLowerCase();
  if (t === 'gold') {
    return {
      proficiency_tier: 4,
      status: 'tier_advanced',
      best_score: round2(0.72 + scoreJitter(studentIndex + 3, 0.1)),
      attempts_count: 3,
      tiers_cleared: { 1: true, 2: true, 3: true },
    };
  }
  if (t === 'silver') {
    return {
      proficiency_tier: 4,
      status: 'tier_advanced',
      best_score: round2(0.58 + scoreJitter(studentIndex + 17, 0.09)),
      attempts_count: 3,
      tiers_cleared: { 1: true, 2: true, 3: true },
    };
  }
  if (t === 'bronze') {
    return {
      proficiency_tier: 1,
      status: 'available',
      best_score: round2(0.4 + scoreJitter(studentIndex + 29, 0.07)),
      attempts_count: 1,
      tiers_cleared: {},
    };
  }
  return {
    proficiency_tier: 2,
    status: 'available',
    best_score: round2(0.34 + scoreJitter(studentIndex + 41, 0.08)),
    attempts_count: 2,
    tiers_cleared: { 1: true },
  };
}

function mathProgressFromPerfTier(perfTier: string, studentIndex: number): AssessmentProgress {
  const t = String(perfTier).toLowerCase();
  if (t === 'gold') {
    return {
      proficiency_tier: 4,
      status: 'tier_advanced',
      best_score: round2(0.76 + scoreJitter(studentIndex + 5, 0.11)),
      attempts_count: 3,
      tiers_cleared: { 1: true, 2: true, 3: true },
    };
  }
  if (t === 'silver') {
    return {
      proficiency_tier: 4,
      status: 'tier_advanced',
      best_score: round2(0.64 + scoreJitter(studentIndex + 19, 0.09)),
      attempts_count: 3,
      tiers_cleared: { 1: true, 2: true, 3: true },
    };
  }
  if (t === 'bronze') {
    return {
      proficiency_tier: 1,
      status: 'available',
      best_score: round2(0.42 + scoreJitter(studentIndex + 31, 0.07)),
      attempts_count: 1,
      tiers_cleared: {},
    };
  }
  return {
    proficiency_tier: 2,
    status: 'available',
    best_score: round2(0.36 + scoreJitter(studentIndex + 43, 0.08)),
    attempts_count: 2,
    tiers_cleared: { 1: true },
  };
}

function buildProgress(
  symbolicPerfTier: string,
  verbalPerfTier: string,
  mathPerfTier: string,
  triadLevel: number,
  studentIndex: number
): Record<string, AssessmentProgress> {
  const p = baseAssessmentProgress();
  p.symbolic_reasoning = symbolicProgressFromPerfTier(symbolicPerfTier, studentIndex);
  if (triadLevel >= 2) {
    p.verbal_reasoning = verbalProgressFromPerfTier(verbalPerfTier, studentIndex);
  }
  if (triadLevel >= 3) {
    p.mathematical_reasoning = mathProgressFromPerfTier(mathPerfTier, studentIndex);
  }
  return p;
}

const SEED_FIRST_NAMES = [
  'Aarav', 'Aditya', 'Ananya', 'Arjun', 'Avni', 'Diya', 'Ethan', 'Ishaan', 'Kiara', 'Kavya',
  'Rohan', 'Sara', 'Vikram', 'Meera', 'Kabir', 'Neha', 'Riya', 'Siddharth', 'Tara', 'Yash',
  'Priya', 'Rahul', 'Sanjana', 'Karan', 'Nisha', 'Aryan', 'Devika', 'Farhan', 'Ishita', 'Manav',
  'Zara', 'Omar', 'Rhea', 'Varun', 'Aditi', 'Kiran', 'Lakshmi', 'Mohan', 'Pooja', 'Raj',
  'Simran', 'Tanya', 'Uma', 'Vivek', 'Akash', 'Bhavya', 'Chitra', 'Deepak', 'Elena', 'Faisal',
] as const;

const SEED_LAST_NAMES = [
  'Sharma', 'Patel', 'Reddy', 'Nair', 'Kapoor', 'Singh', 'Khanna', 'Iyer', 'Menon', 'Desai',
  'Joshi', 'Shah', 'Kulkarni', 'Rao', 'Verma', 'Agarwal', 'Malhotra', 'Banerjee', 'Mukherjee', 'Ghosh',
  'Das', 'Pillai', 'Krishnan', 'Srinivasan', 'Bose', 'Mehta', 'Jain', 'Chugh', 'Bhatia', 'Saxena',
  'Pandey', 'Mishra', 'Narayan', 'Subramanian', 'Hegde', 'Kaur', 'Gill', 'Basu', 'Sen', 'Roy',
  'Choudhary', 'Yadav', 'Khan', 'Ahmed', 'Fernandes', 'Thomas', 'Matthew', 'Rodrigues', 'Shetty', 'Varma',
] as const;

function buildSortedSeedNamePairs(count: number): { first_name: string; last_name: string }[] {
  const firstSorted = [...SEED_FIRST_NAMES].sort();
  const lastSorted = [...SEED_LAST_NAMES].sort();
  const pairs: { first_name: string; last_name: string }[] = [];
  for (const first_name of firstSorted) {
    for (const last_name of lastSorted) {
      pairs.push({ first_name, last_name });
      if (pairs.length >= count) return pairs;
    }
  }
  return pairs;
}

/** Match `patchSchoolTier1ByGrade.js` defaults so `/for-schools/preview` tier analytics align after a DB patch. */
export const GREENFIELD_TIER1_PATCH_GRADE6_COUNT = 40;
export const GREENFIELD_TIER1_PATCH_GRADE7_COUNT = 10;

/** Forces overall Tier 1 (min band): symbolic slot at proficiency band 1; other active slots unchanged. */
function forceOverallTier1Symbolic(
  progress: Record<string, AssessmentProgress>
): Record<string, AssessmentProgress> {
  const next = JSON.parse(JSON.stringify(progress)) as Record<string, AssessmentProgress>;
  const sym = next.symbolic_reasoning ?? ({} as AssessmentProgress);
  const prevScore = typeof sym.best_score === 'number' ? sym.best_score : null;
  next.symbolic_reasoning = {
    ...sym,
    proficiency_tier: 1,
    status: 'available',
    attempts_count: Math.max(1, sym.attempts_count ?? 1),
    best_score: prevScore != null ? Math.min(prevScore, 0.46) : 0.42,
    tiers_cleared: {},
  };
  return next;
}

/** Apply same grade-based Tier-1 subset as the Firestore patch script (sorted by uid). */
function applyTier1PatchSubset(students: StudentRow[]): void {
  const g6 = students.filter((s) => s.grade === 6).sort((a, b) => a.uid.localeCompare(b.uid));
  const g7 = students.filter((s) => s.grade === 7).sort((a, b) => a.uid.localeCompare(b.uid));
  const targets = new Set([
    ...g6.slice(0, GREENFIELD_TIER1_PATCH_GRADE6_COUNT).map((s) => s.uid),
    ...g7.slice(0, GREENFIELD_TIER1_PATCH_GRADE7_COUNT).map((s) => s.uid),
  ]);
  for (const s of students) {
    if (!targets.has(s.uid)) continue;
    s.assessment_progress = forceOverallTier1Symbolic(s.assessment_progress);
    s.achievement_tier = 'bronze';
    s.membership_level = 2;
  }
}

/** 142 students - same composition as Greenfield GYS Q4 seed (fixed ordering). */
export function buildGreenfieldPreviewStudentRows(): StudentRow[] {
  const grades = [...Array(50).fill(6), ...Array(52).fill(7), ...Array(40).fill(8)] as number[];
  const symbolicPerfTiers = [
    ...Array(26).fill('gold'),
    ...Array(54).fill('silver'),
    ...Array(38).fill('bronze'),
    ...Array(24).fill('explorer'),
  ] as string[];
  const verbalPerfTiers = [
    ...Array(10).fill('gold'),
    ...Array(32).fill('silver'),
    ...Array(35).fill('bronze'),
    ...Array(21).fill('explorer'),
  ] as string[];
  const mathPerfTiers = [
    ...Array(18).fill('gold'),
    ...Array(30).fill('silver'),
    ...Array(25).fill('bronze'),
    ...Array(12).fill('explorer'),
  ] as string[];

  const seedStudentNames = buildSortedSeedNamePairs(142);
  const students: StudentRow[] = [];

  for (let i = 0; i < 142; i++) {
    const triadLevel = i < 44 ? 1 : i < 57 ? 2 : 3;
    const achievementTier = symbolicPerfTiers[i]!;
    const grade = grades[i]!;
    const verbalIx = i - 44;
    const mathIx = i - 57;
    const verbalTier = triadLevel >= 2 ? verbalPerfTiers[verbalIx]! : 'bronze';
    const mathTier = triadLevel >= 3 ? mathPerfTiers[mathIx]! : 'bronze';
    const uid = `greenfield_preview_${String(i).padStart(4, '0')}`;
    const { first_name, last_name } = seedStudentNames[i]!;
    const assessment_progress = buildProgress(achievementTier, verbalTier, mathTier, triadLevel, i);

    students.push({
      uid,
      first_name,
      last_name,
      grade,
      membership_level: achievementTier === 'explorer' ? 1 : achievementTier === 'bronze' ? 2 : 3,
      approval_status: 'approved',
      achievement_tier: achievementTier,
      assessment_progress,
      created_at: null,
    });
  }

  applyTier1PatchSubset(students);
  return students;
}
