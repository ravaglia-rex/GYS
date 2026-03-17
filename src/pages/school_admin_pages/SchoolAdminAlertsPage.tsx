import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Button, Divider, IconButton,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Assessment as ReportIcon,
  NotificationsActive as AlertIcon,
  CheckCircle as ReadIcon,
  Close as DismissIcon,
} from '@mui/icons-material';

interface Alert {
  id: string;
  type: 'student_request' | 'report_ready' | 'system';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const INITIAL_ALERTS: Alert[] = [
  { id: 'a1', type: 'student_request', title: 'New Student Connection Request', body: 'Priya Sharma (Grade 6) has requested to connect to your school via UDISE lookup.', time: '2 Mar 2027 · 10:14 AM', read: false },
  { id: 'a2', type: 'student_request', title: 'New Student Connection Request', body: 'Rahul Patel (Grade 8) has requested to connect to your school via UDISE lookup.', time: '1 Mar 2027 · 3:22 PM', read: false },
  { id: 'a3', type: 'report_ready', title: 'Q2 Performance Report Ready', body: 'Your Q2 2027 institutional performance report has been generated and is available for download.', time: '1 Mar 2027 · 12:00 PM', read: false },
  { id: 'a4', type: 'student_request', title: 'New Student Connection Request', body: 'Ananya Krishnan (Grade 7) has requested to connect to your school via UDISE lookup.', time: '28 Feb 2027 · 9:05 AM', read: true },
  { id: 'a5', type: 'report_ready', title: 'Q1 → Q2 Growth Report Ready', body: 'Your quarter-over-quarter growth report is available. Overall percentile improved by 5 points.', time: '1 Mar 2027 · 12:00 PM', read: true },
];

const ALERT_ICON: Record<string, React.ReactElement> = {
  student_request: <PersonAddIcon sx={{ fontSize: '1.1rem' }} />,
  report_ready:    <ReportIcon sx={{ fontSize: '1.1rem' }} />,
  system:          <AlertIcon sx={{ fontSize: '1.1rem' }} />,
};

const ALERT_COLOR: Record<string, string> = {
  student_request: '#f59e0b',
  report_ready:    '#3b82f6',
  system:          '#8b5cf6',
};

const SchoolAdminAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);

  const unreadCount = alerts.filter(a => !a.read).length;

  const markRead = (id: string) =>
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));

  const dismiss = (id: string) =>
    setAlerts(prev => prev.filter(a => a.id !== id));

  const markAllRead = () =>
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', pb: 6 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700 }}>Alerts</Typography>
            {unreadCount > 0 && (
              <Chip label={`${unreadCount} new`} size="small" sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700, fontSize: '0.7rem' }} />
            )}
          </Box>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Student connection requests, report notifications, and system updates
          </Typography>
        </Box>
        {unreadCount > 0 && (
          <Button onClick={markAllRead} sx={{ color: '#3b82f6', fontWeight: 600, fontSize: '0.8rem' }}>
            Mark all as read
          </Button>
        )}
      </Box>

      {/* Alerts list */}
      {alerts.length > 0 ? (
        <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155' }}>
          <CardContent sx={{ p: '0 !important' }}>
            {alerts.map((alert, idx) => {
              const color = ALERT_COLOR[alert.type] ?? '#94a3b8';
              return (
                <React.Fragment key={alert.id}>
                  <Box sx={{
                    display: 'flex', alignItems: 'flex-start', gap: 2, px: 3, py: 2.5,
                    bgcolor: alert.read ? 'transparent' : 'rgba(59,130,246,0.04)',
                    transition: 'background 0.15s',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                  }}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      bgcolor: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.2,
                    }}>
                      {ALERT_ICON[alert.type]}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
                        <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: alert.read ? 400 : 700 }}>
                          {alert.title}
                        </Typography>
                        {!alert.read && (
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#3b82f6', flexShrink: 0 }} />
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: '#94a3b8', mb: 0.8, lineHeight: 1.5 }}>
                        {alert.body}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>{alert.time}</Typography>
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
                  {idx < alerts.length - 1 && <Divider sx={{ borderColor: '#1e293b' }} />}
                </React.Fragment>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <AlertIcon sx={{ color: '#334155', fontSize: '3rem', mb: 1.5 }} />
          <Typography variant="body1" sx={{ color: '#64748b' }}>No alerts</Typography>
          <Typography variant="caption" sx={{ color: '#475569' }}>
            You're all caught up. New student requests and report notifications will appear here.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SchoolAdminAlertsPage;
