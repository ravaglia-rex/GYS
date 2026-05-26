export type TutorialAudience = 'student' | 'school';

export type StudentTutorialPageKey =
  | 'student.dashboard'
  | 'student.leaderboard'
  | 'student.assessments'
  | 'student.practice'
  | 'student.reports'
  | 'student.payments'
  | 'student.settings';

export type SchoolTutorialPageKey =
  | 'school.dashboard'
  | 'school.students'
  | 'school.studentDetail'
  | 'school.analytics'
  | 'school.reports'
  | 'school.alerts'
  | 'school.settings'
  | 'school.subscription';

export type TutorialPageKey = StudentTutorialPageKey | SchoolTutorialPageKey;

export interface TutorialStepDefinition {
  targetId: string;
  /** Optional smaller anchor to scroll into view while still spotlighting targetId. */
  scrollTargetId?: string;
  scrollBlock?: ScrollLogicalPosition;
  title: string;
  body: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

export interface TutorialUiPreferences {
  tutorials?: {
    dismissed?: Record<string, boolean>;
  };
}

export function readTutorialDismissed(
  prefs: TutorialUiPreferences | null | undefined
): Record<string, boolean> {
  const raw = prefs?.tutorials?.dismissed;
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === true) out[k] = true;
  }
  return out;
}

export function isTutorialPageDismissed(
  dismissed: Record<string, boolean>,
  pageKey: string
): boolean {
  return dismissed[pageKey] === true;
}
