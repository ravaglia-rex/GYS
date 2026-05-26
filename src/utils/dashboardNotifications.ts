import { useCallback, useEffect, useState } from 'react';

const DISMISSED_DASHBOARD_NOTIFICATIONS_KEY = 'argus.dismissedDashboardNotificationIds';
const DISMISSED_DASHBOARD_NOTIFICATIONS_EVENT = 'argus:dismissed-dashboard-notifications';
const MONTHLY_PERIODIC_NOTIFICATION_ID_PATTERN = /^(monthly-(?:leaderboard|badges)-updated)-(\d{4}-\d{2})$/;

export type DashboardNotificationType = 'success' | 'info' | 'warning' | 'error';
export type DashboardNotificationCategory = 'assessment' | 'payment' | 'system' | 'general' | 'leaderboard' | 'badge' | 'report';

export const DASHBOARD_NOTIFICATION_COLORS = {
  assessment: '#ec4899',
  leaderboard: '#f59e0b',
  badge: '#f59e0b',
  report: '#06b6d4',
  payment: '#22c55e',
  membershipExpiringSoon: '#f97316',
  membershipExpiringUrgent: '#ef4444',
  system: '#64748b',
  general: '#94a3b8',
} as const;

export interface CompletedAssessmentNotificationSource {
  assessmentId: string;
  assessmentName: string;
}

export interface UnlockedAssessmentNotificationSource {
  assessmentId: string;
  assessmentName: string;
}

export interface DashboardNotification {
  id: string;
  type: DashboardNotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  category: DashboardNotificationCategory;
  color: string;
}

export interface DashboardNotificationEventSource {
  id: string;
  type: DashboardNotificationType;
  title: string;
  message: string;
  created_at_iso: string;
  category: DashboardNotificationCategory;
  color: string;
}

function emphasizeFirstSentence(message: string): string {
  if (message.trim().length === 0) return message;

  const firstSentenceEnd = message.search(/[.!?](?=\s|$)/);
  if (firstSentenceEnd === -1) {
    return message.endsWith('!') ? message : `${message}!`;
  }

  if (message[firstSentenceEnd] === '!') return message;

  return `${message.slice(0, firstSentenceEnd)}!${message.slice(firstSentenceEnd + 1)}`;
}

function getBackendNotificationColor(event: DashboardNotificationEventSource): string {
  // Match anywhere in id so preview-prefixed ids (e.g. preview-membership-expiring-30-…) still map correctly.
  if (event.id.includes('membership-expiring-7-')) {
    return DASHBOARD_NOTIFICATION_COLORS.membershipExpiringUrgent;
  }

  if (event.id.includes('membership-expiring-30-')) {
    return DASHBOARD_NOTIFICATION_COLORS.membershipExpiringSoon;
  }

  switch (event.category) {
    case 'leaderboard':
      return DASHBOARD_NOTIFICATION_COLORS.leaderboard;
    case 'badge':
      return DASHBOARD_NOTIFICATION_COLORS.badge;
    case 'report':
      return DASHBOARD_NOTIFICATION_COLORS.report;
    case 'payment':
      return DASHBOARD_NOTIFICATION_COLORS.payment;
    case 'assessment':
      return DASHBOARD_NOTIFICATION_COLORS.assessment;
    case 'system':
      return DASHBOARD_NOTIFICATION_COLORS.system;
    case 'general':
      return DASHBOARD_NOTIFICATION_COLORS.general;
    default:
      return event.color;
  }
}

function readDismissedDashboardNotificationIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(DISMISSED_DASHBOARD_NOTIFICATIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0));
  } catch {
    return new Set();
  }
}

function writeDismissedDashboardNotificationIds(ids: Set<string>) {
  try {
    window.localStorage.setItem(
      DISMISSED_DASHBOARD_NOTIFICATIONS_KEY,
      JSON.stringify(Array.from(ids))
    );
    window.dispatchEvent(new Event(DISMISSED_DASHBOARD_NOTIFICATIONS_EVENT));
  } catch {
    // Ignore storage failures; dismissal is a convenience feature.
  }
}

export function dismissDashboardNotification(id: string) {
  const ids = readDismissedDashboardNotificationIds();
  ids.add(id);
  writeDismissedDashboardNotificationIds(ids);
}

export function dismissDashboardNotifications(idsToDismiss: string[]) {
  const ids = readDismissedDashboardNotificationIds();
  idsToDismiss.forEach(id => ids.add(id));
  writeDismissedDashboardNotificationIds(ids);
}

export function getStalePeriodicDashboardNotificationIds(notificationIds: readonly string[]): string[] {
  const grouped = new Map<string, { latestPeriod: string; ids: string[] }>();

  for (const id of notificationIds) {
    const match = MONTHLY_PERIODIC_NOTIFICATION_ID_PATTERN.exec(id);
    if (!match) continue;

    const [, group, period] = match;
    const existing = grouped.get(group);
    if (!existing) {
      grouped.set(group, { latestPeriod: period, ids: [id] });
      continue;
    }

    existing.ids.push(id);
    if (period > existing.latestPeriod) {
      existing.latestPeriod = period;
    }
  }

  return Array.from(grouped.values()).flatMap(({ latestPeriod, ids }) =>
    ids.filter(id => !id.endsWith(latestPeriod))
  );
}

export function useDismissedDashboardNotificationIds() {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() =>
    readDismissedDashboardNotificationIds()
  );

  useEffect(() => {
    const refresh = () => setDismissedIds(readDismissedDashboardNotificationIds());
    window.addEventListener(DISMISSED_DASHBOARD_NOTIFICATIONS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(DISMISSED_DASHBOARD_NOTIFICATIONS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const dismissOne = useCallback((id: string) => {
    dismissDashboardNotification(id);
  }, []);

  const dismissMany = useCallback((ids: string[]) => {
    dismissDashboardNotifications(ids);
  }, []);

  return { dismissedIds, dismissOne, dismissMany };
}

export function generateDashboardNotifications(params: {
  availableAssessmentsCount: number;
  completedAssessments: CompletedAssessmentNotificationSource[];
  unlockedAssessments?: UnlockedAssessmentNotificationSource[];
  backendNotificationEvents?: DashboardNotificationEventSource[];
  referenceDate?: Date;
}): DashboardNotification[] {
  const notifications: DashboardNotification[] = [];
  const now = params.referenceDate ?? new Date();

  (params.backendNotificationEvents ?? []).forEach((event) => {
    const timestamp = new Date(event.created_at_iso);
    notifications.push({
      id: event.id,
      type: event.type,
      title: event.title,
      message: emphasizeFirstSentence(event.message),
      timestamp: Number.isNaN(timestamp.getTime()) ? now : timestamp,
      isRead: false,
      category: event.category,
      color: getBackendNotificationColor(event),
    });
  });

  if (params.availableAssessmentsCount > 0) {
    notifications.push({
      id: 'new-assessment-available',
      type: 'info',
      title: 'New Assessment Available',
      message: emphasizeFirstSentence(`You have ${params.availableAssessmentsCount} new assessment${params.availableAssessmentsCount > 1 ? 's' : ''} available to take. Check the assessments section to get started.`),
      timestamp: new Date(now.getTime() - 30 * 60 * 1000),
      isRead: false,
      category: 'assessment',
      color: DASHBOARD_NOTIFICATION_COLORS.assessment,
    });
  }

  params.completedAssessments.forEach((assessment, index) => {
    notifications.push({
      id: `result-available-${assessment.assessmentId}`,
      type: 'success',
      title: `${assessment.assessmentName} Result Available`,
      message: emphasizeFirstSentence(`Your ${assessment.assessmentName} result is available. Open Results Available to review your performance and next steps.`),
      timestamp: new Date(now.getTime() - (index + 1) * 60 * 60 * 1000),
      isRead: false,
      category: 'assessment',
      color: DASHBOARD_NOTIFICATION_COLORS.assessment,
    });
  });

  (params.unlockedAssessments ?? []).forEach((assessment, index) => {
    notifications.push({
      id: `assessment-unlocked-${assessment.assessmentId}`,
      type: 'info',
      title: `${assessment.assessmentName} Unlocked`,
      message: emphasizeFirstSentence(`You unlocked ${assessment.assessmentName}. Start this assessment when you're ready to keep moving through the program.`),
      timestamp: new Date(now.getTime() - (index + 1) * 45 * 60 * 1000),
      isRead: false,
      category: 'assessment',
      color: DASHBOARD_NOTIFICATION_COLORS.assessment,
    });
  });

  return notifications;
}
