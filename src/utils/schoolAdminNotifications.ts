import { useCallback, useEffect, useState } from 'react';

const DISMISSED_KEY_PREFIX = 'argus.dismissedSchoolAdminNotificationIds';
const READ_KEY_PREFIX = 'argus.readSchoolAdminNotificationIds';
const DISMISSED_EVENT = 'argus:dismissed-school-admin-notifications';
const READ_EVENT = 'argus:read-school-admin-notifications';

export type SchoolAdminNotificationType = 'success' | 'info' | 'warning' | 'error';
export type SchoolAdminNotificationCategory = 'payment' | 'system' | 'general' | 'report';

export const SCHOOL_ADMIN_NOTIFICATION_COLORS = {
  report: '#3b82f6',
  payment: '#22c55e',
  membershipExpiringSoon: '#f97316',
  membershipExpiringUrgent: '#ef4444',
  system: '#8b5cf6',
  general: '#94a3b8',
} as const;

export interface SchoolAdminNotificationEventSource {
  id: string;
  type: SchoolAdminNotificationType;
  title: string;
  message: string;
  created_at_iso: string;
  category: SchoolAdminNotificationCategory;
  color: string;
}

export interface SchoolAdminAlert {
  id: string;
  type: SchoolAdminNotificationType;
  category: SchoolAdminNotificationCategory;
  title: string;
  body: string;
  time: string;
  read: boolean;
  color: string;
}

function storageKey(prefix: string, schoolId: string): string {
  return `${prefix}.${schoolId}`;
}

function readIdSet(prefix: string, schoolId: string): Set<string> {
  if (!schoolId) return new Set();
  try {
    const raw = window.localStorage.getItem(storageKey(prefix, schoolId));
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0));
  } catch {
    return new Set();
  }
}

function writeIdSet(prefix: string, schoolId: string, ids: Set<string>, eventName: string) {
  if (!schoolId) return;
  try {
    window.localStorage.setItem(storageKey(prefix, schoolId), JSON.stringify(Array.from(ids)));
    window.dispatchEvent(new Event(eventName));
  } catch {
    // Ignore storage failures; dismissal/read is a convenience feature.
  }
}

export function dismissSchoolAdminNotification(schoolId: string, id: string) {
  const ids = readIdSet(DISMISSED_KEY_PREFIX, schoolId);
  ids.add(id);
  writeIdSet(DISMISSED_KEY_PREFIX, schoolId, ids, DISMISSED_EVENT);
}

export function markSchoolAdminNotificationRead(schoolId: string, id: string) {
  const ids = readIdSet(READ_KEY_PREFIX, schoolId);
  ids.add(id);
  writeIdSet(READ_KEY_PREFIX, schoolId, ids, READ_EVENT);
}

export function markAllSchoolAdminNotificationsRead(schoolId: string, notificationIds: string[]) {
  const ids = readIdSet(READ_KEY_PREFIX, schoolId);
  notificationIds.forEach((id) => ids.add(id));
  writeIdSet(READ_KEY_PREFIX, schoolId, ids, READ_EVENT);
}

function getNotificationColor(event: SchoolAdminNotificationEventSource): string {
  if (event.id.includes('subscription-renewal-7-')) {
    return SCHOOL_ADMIN_NOTIFICATION_COLORS.membershipExpiringUrgent;
  }
  if (event.id.includes('subscription-renewal-30-')) {
    return SCHOOL_ADMIN_NOTIFICATION_COLORS.membershipExpiringSoon;
  }
  switch (event.category) {
    case 'report':
      return SCHOOL_ADMIN_NOTIFICATION_COLORS.report;
    case 'payment':
      return SCHOOL_ADMIN_NOTIFICATION_COLORS.payment;
    case 'system':
      return SCHOOL_ADMIN_NOTIFICATION_COLORS.system;
    case 'general':
      return SCHOOL_ADMIN_NOTIFICATION_COLORS.general;
    default:
      return event.color;
  }
}

export function formatSchoolAdminAlertTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const datePart = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${datePart} • ${timePart}`;
}

export function generateSchoolAdminAlerts(params: {
  schoolId: string;
  backendNotificationEvents: SchoolAdminNotificationEventSource[];
  dismissedIds?: Set<string>;
  readIds?: Set<string>;
}): SchoolAdminAlert[] {
  const dismissed = params.dismissedIds ?? new Set<string>();
  const read = params.readIds ?? new Set<string>();

  return params.backendNotificationEvents
    .filter((event) => !dismissed.has(event.id))
    .map((event) => ({
      id: event.id,
      type: event.type,
      category: event.category,
      title: event.title,
      body: event.message,
      time: formatSchoolAdminAlertTime(event.created_at_iso),
      read: read.has(event.id),
      color: getNotificationColor(event),
    }));
}

export function useDismissedSchoolAdminNotificationIds(schoolId: string) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => readIdSet(DISMISSED_KEY_PREFIX, schoolId));

  useEffect(() => {
    setDismissedIds(readIdSet(DISMISSED_KEY_PREFIX, schoolId));
  }, [schoolId]);

  useEffect(() => {
    const refresh = () => setDismissedIds(readIdSet(DISMISSED_KEY_PREFIX, schoolId));
    window.addEventListener(DISMISSED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(DISMISSED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [schoolId]);

  const dismissOne = useCallback((id: string) => {
    dismissSchoolAdminNotification(schoolId, id);
  }, [schoolId]);

  return { dismissedIds, dismissOne };
}

export function useReadSchoolAdminNotificationIds(schoolId: string) {
  const [readIds, setReadIds] = useState<Set<string>>(() => readIdSet(READ_KEY_PREFIX, schoolId));

  useEffect(() => {
    setReadIds(readIdSet(READ_KEY_PREFIX, schoolId));
  }, [schoolId]);

  useEffect(() => {
    const refresh = () => setReadIds(readIdSet(READ_KEY_PREFIX, schoolId));
    window.addEventListener(READ_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(READ_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [schoolId]);

  const markRead = useCallback((id: string) => {
    markSchoolAdminNotificationRead(schoolId, id);
  }, [schoolId]);

  const markAllRead = useCallback((notificationIds: string[]) => {
    markAllSchoolAdminNotificationsRead(schoolId, notificationIds);
  }, [schoolId]);

  return { readIds, markRead, markAllRead };
}
