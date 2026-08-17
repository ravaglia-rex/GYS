export type ProctoringEventType =
  | 'face_missing'
  | 'multiple_faces'
  | 'tab_background'
  | 'fullscreen_exit'
  | 'window_blur'
  | 'camera_denied'
  | 'print_screen'
  | 'other';

export type ProctoringEventSeverity = 'low' | 'medium' | 'high';

export interface ProctoringConfig {
  enabled: boolean;
  min_face_checks?: number;
  snapshot_on_violation?: boolean;
  check_interval_sec?: number;
}

export const DEFAULT_PROCTORING_CONFIG: ProctoringConfig = {
  enabled: false,
  min_face_checks: 1,
  snapshot_on_violation: true,
  check_interval_sec: 45,
};

export interface ProctoringSummary {
  risk_score: number;
  violation_counts: Record<string, number>;
  reviewed: boolean;
  flagged: boolean;
}

export interface ProctoringEventRecord {
  id: string;
  type: ProctoringEventType;
  severity: ProctoringEventSeverity;
  client_timestamp: number;
  snapshot_s3_key?: string | null;
  snapshot_url?: string | null;
}

export interface FlaggedProctoringAttempt {
  attempt_id: string;
  assessment_id: string | null;
  proficiency_tier: number | null;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  proctoring_summary: ProctoringSummary;
  events: ProctoringEventRecord[];
}
