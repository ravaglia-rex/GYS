import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, Button, Divider, IconButton, CircularProgress,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Payment as PaymentIcon,
  NotificationsActive as AlertIcon,
  CheckCircle as ReadIcon,
  Close as DismissIcon,
} from '@mui/icons-material';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import {
  getSchoolNotifications,
  sendSchoolNotificationEmails,
  type SchoolAdminNotificationEventSource,
} from '../../db/schoolAdminCollection';
import { GREENFIELD_PREVIEW_NOTIFICATIONS } from '../../data/schoolPreviewMock';
import PageTutorial from '../../components/tutorial/PageTutorial';
import { SchoolAdminPageHeader, schoolAdminPageContainerSx } from './schoolAdminPageStyles';
import {
  generateSchoolAdminAlerts,
  useDismissedSchoolAdminNotificationIds,
  useReadSchoolAdminNotificationIds,
  type SchoolAdminAlert,
} from '../../utils/schoolAdminNotifications';

const ALERT_ICON: Record<string, React.ReactElement> = {
  report: <ReportIcon sx={{ fontSize: '1.1rem' }} />,
  payment: <PaymentIcon sx={{ fontSize: '1.1rem' }} />,
  system: <AlertIcon sx={{ fontSize: '1.1rem' }} />,
  general: <AlertIcon sx={{ fontSize: '1.1rem' }} />,
};

const SchoolAdminAlertsPage: React.FC = () => {
  const location = useLocation();
  const isSchoolAdminPreview = location.pathname.startsWith('/for-schools/preview');
  const [backendEvents, setBackendEvents] = useState<SchoolAdminNotificationEventSource[]>([]);
  const [schoolId, setSchoolId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const notificationEmailSentRef = useRef<Set<string>>(new Set());

  const effectiveSchoolId = isSchoolAdminPreview ? 'preview-greenfield' : schoolId;
  const { dismissedIds, dismissOne } = useDismissedSchoolAdminNotificationIds(effectiveSchoolId);
  const { readIds, markRead, markAllRead } = useReadSchoolAdminNotificationIds(effectiveSchoolId);

  const load = useCallback(async () => {
    if (isSchoolAdminPreview) {
      setBackendEvents([...GREENFIELD_PREVIEW_NOTIFICATIONS]);
      setSchoolId('preview-greenfield');
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getSchoolNotifications();
      setBackendEvents(data.notifications ?? []);
      setSchoolId(data.schoolId ?? '');
    } catch (e) {
      setError((e as Error).message ?? 'Could not load alerts.');
      setBackendEvents([]);
      setSchoolId('');
    } finally {
      setLoading(false);
    }
  }, [isSchoolAdminPreview]);

  useEffect(() => {
    void load();
  }, [load]);

  const alerts = useMemo(
    () => generateSchoolAdminAlerts({
      schoolId: effectiveSchoolId,
      backendNotificationEvents: backendEvents,
      dismissedIds,
      readIds,
    }),
    [backendEvents, dismissedIds, effectiveSchoolId, readIds]
  );

  const unreadCount = alerts.filter((a) => !a.read).length;

  useEffect(() => {
    if (isSchoolAdminPreview || alerts.length === 0) return;

    const newIds = alerts
      .map((alert) => alert.id)
      .filter((id) => !notificationEmailSentRef.current.has(id));
    if (newIds.length === 0) return;
    newIds.forEach((id) => notificationEmailSentRef.current.add(id));

    void sendSchoolNotificationEmails({ notificationIds: newIds }).catch((sendError) => {
      console.warn('School notification email send skipped:', sendError);
    });
  }, [alerts, isSchoolAdminPreview]);

  const handleMarkRead = (id: string) => {
    markRead(id);
  };

  const handleDismiss = (id: string) => {
    dismissOne(id);
  };

  const handleMarkAllRead = () => {
    markAllRead(alerts.map((alert) => alert.id));
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress sx={{ color: ip.navy }} />
      </Box>
    );
  }

  return (
    <Box sx={schoolAdminPageContainerSx}>
      <PageTutorial pageKey="school.alerts" ready={!loading} />
      <SchoolAdminPageHeader
        title="Alerts"
        subtitle="Report notifications, billing updates, and system alerts"
        badge={
          unreadCount > 0 ? (
            <Chip
              label={`${unreadCount} new`}
              size="small"
              sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700, fontSize: '0.7rem' }}
            />
          ) : undefined
        }
        action={
          unreadCount > 0 ? (
            <Button onClick={handleMarkAllRead} sx={{ color: ip.statBlue, fontWeight: 600, fontSize: '0.8rem' }}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {error && (
        <Typography variant="body2" sx={{ color: '#ef4444', mb: 2 }}>
          {error}
        </Typography>
      )}

      {alerts.length > 0 ? (
        <Card
          data-tutorial-id="school-alerts-list"
          sx={{ bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, borderRadius: 2, boxShadow: 'none' }}
        >
          <CardContent sx={{ p: '0 !important' }}>
            {alerts.map((alert: SchoolAdminAlert, idx) => (
              <React.Fragment key={alert.id}>
                <Box sx={{
                  display: 'flex', alignItems: 'flex-start', gap: 2, px: 3, py: 2.5,
                  bgcolor: alert.read ? 'transparent' : ip.pendingBg,
                  transition: 'background 0.15s',
                  '&:hover': { bgcolor: ip.cardMutedBg },
                }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    bgcolor: `${alert.color}18`, color: alert.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.2,
                  }}>
                    {ALERT_ICON[alert.category] ?? ALERT_ICON.general}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
                      <Typography variant="body2" sx={{ color: ip.heading, fontWeight: alert.read ? 400 : 700 }}>
                        {alert.title}
                      </Typography>
                      {!alert.read && (
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: ip.statBlue, flexShrink: 0 }} />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: ip.subtext, mb: 0.8, lineHeight: 1.5 }}>
                      {alert.body}
                    </Typography>
                    {alert.time ? (
                      <Typography variant="caption" sx={{ color: ip.subtext }}>{alert.time}</Typography>
                    ) : null}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    {!alert.read && (
                      <IconButton size="small" onClick={() => handleMarkRead(alert.id)} sx={{ color: '#64748b', '&:hover': { color: '#10b981' } }}>
                        <ReadIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton size="small" onClick={() => handleDismiss(alert.id)} sx={{ color: '#64748b', '&:hover': { color: '#ef4444' } }}>
                      <DismissIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                {idx < alerts.length - 1 && <Divider sx={{ borderColor: ip.cardBorder }} />}
              </React.Fragment>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <AlertIcon sx={{ color: ip.cardBorder, fontSize: '3rem', mb: 1.5 }} />
          <Typography variant="body1" sx={{ color: ip.subtext }}>No alerts</Typography>
          <Typography variant="caption" sx={{ color: ip.subtext }}>
            You&apos;re all caught up. New report and billing notifications will appear here.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SchoolAdminAlertsPage;
