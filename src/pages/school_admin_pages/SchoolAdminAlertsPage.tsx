import React, { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, Button, Divider, IconButton, CircularProgress,
} from '@mui/material';
import {
  Assessment as ReportIcon,
  NotificationsActive as AlertIcon,
  CheckCircle as ReadIcon,
  Close as DismissIcon,
} from '@mui/icons-material';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import {
  getQuarterlyReports,
  type QuarterlyReportListItem,
} from '../../db/schoolAdminCollection';

interface Alert {
  id: string;
  type: 'report_ready' | 'system';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

/** Interactive preview only (`/for-schools/preview`). */
const PREVIEW_ALERTS: Alert[] = [
  { id: 'a3', type: 'report_ready', title: 'Q2 Performance Report Ready', body: 'Your Q2 2027 institutional performance report has been generated and is available for download.', time: '1 Mar 2027 • 12:00 PM', read: false },
  { id: 'a5', type: 'report_ready', title: 'Q1 → Q2 Growth Report Ready', body: 'Your quarter-over-quarter growth report is available. Overall percentile improved by 5 points.', time: '1 Mar 2027 • 12:00 PM', read: true },
];

const ALERT_ICON: Record<string, React.ReactElement> = {
  report_ready: <ReportIcon sx={{ fontSize: '1.1rem' }} />,
  system: <AlertIcon sx={{ fontSize: '1.1rem' }} />,
};

const ALERT_COLOR: Record<string, string> = {
  report_ready: '#3b82f6',
  system: '#8b5cf6',
};

function quarterLabel(quarterKey: string): string {
  const match = /^(\d{4})-Q(\d)$/i.exec(quarterKey);
  if (!match) return quarterKey;
  return `Q${match[2]} ${match[1]}`;
}

function formatAlertTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const datePart = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${datePart} • ${timePart}`;
}

function reportsToAlerts(reports: QuarterlyReportListItem[]): Alert[] {
  return [...reports]
    .filter((r) => r.hasPdf)
    .sort((a, b) => b.quarterKey.localeCompare(a.quarterKey))
    .map((r) => ({
      id: r.quarterKey,
      type: 'report_ready' as const,
      title: `${quarterLabel(r.quarterKey)} Performance Report Ready`,
      body: r.assessmentPeriodLabel
        ? `Your ${r.assessmentPeriodLabel} institutional performance report has been generated and is available for download.`
        : `Your ${quarterLabel(r.quarterKey)} institutional performance report is available for download.`,
      time: formatAlertTime(r.generatedAt),
      read: !r.isLatest,
    }));
}

const SchoolAdminAlertsPage: React.FC = () => {
  const location = useLocation();
  const isSchoolAdminPreview = location.pathname.startsWith('/for-schools/preview');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (isSchoolAdminPreview) {
      setAlerts([...PREVIEW_ALERTS]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getQuarterlyReports();
      setAlerts(reportsToAlerts(data.reports ?? []));
    } catch (e) {
      setError((e as Error).message ?? 'Could not load alerts.');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [isSchoolAdminPreview]);

  useEffect(() => {
    void load();
  }, [load]);

  const unreadCount = alerts.filter(a => !a.read).length;

  const markRead = (id: string) =>
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));

  const dismiss = (id: string) =>
    setAlerts(prev => prev.filter(a => a.id !== id));

  const markAllRead = () =>
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress sx={{ color: ip.navy }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', pb: 6 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h4" sx={{ color: ip.heading, fontWeight: 700 }}>Alerts</Typography>
            {unreadCount > 0 && (
              <Chip label={`${unreadCount} new`} size="small" sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700, fontSize: '0.7rem' }} />
            )}
          </Box>
          <Typography variant="body2" sx={{ color: ip.subtext }}>
            Report notifications and system updates
          </Typography>
        </Box>
        {unreadCount > 0 && (
          <Button onClick={markAllRead} sx={{ color: ip.statBlue, fontWeight: 600, fontSize: '0.8rem' }}>
            Mark all as read
          </Button>
        )}
      </Box>

      {error && (
        <Typography variant="body2" sx={{ color: '#ef4444', mb: 2 }}>
          {error}
        </Typography>
      )}

      {/* Alerts list */}
      {alerts.length > 0 ? (
        <Card sx={{ bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, borderRadius: 2, boxShadow: 'none' }}>
          <CardContent sx={{ p: '0 !important' }}>
            {alerts.map((alert, idx) => {
              const color = ALERT_COLOR[alert.type] ?? ip.subtext;
              return (
                <React.Fragment key={alert.id}>
                  <Box sx={{
                    display: 'flex', alignItems: 'flex-start', gap: 2, px: 3, py: 2.5,
                    bgcolor: alert.read ? 'transparent' : ip.pendingBg,
                    transition: 'background 0.15s',
                    '&:hover': { bgcolor: ip.cardMutedBg },
                  }}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      bgcolor: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.2,
                    }}>
                      {ALERT_ICON[alert.type]}
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
                        <IconButton size="small" onClick={() => markRead(alert.id)} sx={{ color: '#64748b', '&:hover': { color: '#10b981' } }}>
                          <ReadIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton size="small" onClick={() => dismiss(alert.id)} sx={{ color: '#64748b', '&:hover': { color: '#ef4444' } }}>
                        <DismissIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  {idx < alerts.length - 1 && <Divider sx={{ borderColor: ip.cardBorder }} />}
                </React.Fragment>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <AlertIcon sx={{ color: ip.cardBorder, fontSize: '3rem', mb: 1.5 }} />
          <Typography variant="body1" sx={{ color: ip.subtext }}>No alerts</Typography>
          <Typography variant="caption" sx={{ color: ip.subtext }}>
            You&apos;re all caught up. New report notifications will appear here.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SchoolAdminAlertsPage;
