import React from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip,
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  BarChart as BarChartIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  TableChart as TableChartIcon,
} from '@mui/icons-material';

interface ReportItem {
  id: string;
  title: string;
  description: string;
  generated: string;
  type: string;
  icon: React.ReactElement;
  accent: string;
  tag?: string;
}

const reports: ReportItem[] = [
  {
    id: 'q2-performance',
    title: 'Q2 2027 Performance Report',
    description: 'Comprehensive overview of all student assessments for Q2, including tier distribution, subject breakdowns, and grade-wise performance.',
    generated: '1 Mar 2027',
    type: '.docx',
    icon: <BarChartIcon sx={{ color: '#3b82f6', fontSize: '2rem' }} />,
    accent: '#3b82f6',
    tag: 'Latest',
  },
  {
    id: 'q1-q2-growth',
    title: 'Q1 → Q2 Growth Report',
    description: 'Quarter-over-quarter growth analysis showing improvement trends, percentile shifts, and tier upgrades/downgrades.',
    generated: '1 Mar 2027',
    type: '.docx',
    icon: <TrendingUpIcon sx={{ color: '#10b981', fontSize: '2rem' }} />,
    accent: '#10b981',
  },
  {
    id: 'grade-breakdown',
    title: 'Grade-Level Breakdown',
    description: 'Detailed performance data segmented by grade (6–12), including averages, tier distributions, and exam completion rates per grade.',
    generated: '1 Mar 2027',
    type: '.docx',
    icon: <AssessmentIcon sx={{ color: '#8b5cf6', fontSize: '2rem' }} />,
    accent: '#8b5cf6',
  },
  {
    id: 'q1-performance',
    title: 'Q1 2027 Performance Report',
    description: 'Full historical report from Q1 — avg percentile, tier distribution, and subject analysis for all students.',
    generated: '1 Dec 2026',
    type: '.docx',
    icon: <TableChartIcon sx={{ color: '#f59e0b', fontSize: '2rem' }} />,
    accent: '#f59e0b',
  },
];

const SchoolAdminReportsPage: React.FC = () => {
  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#ffffff', fontWeight: 700, mb: 0.5 }}>
          Institutional Reports
        </Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
          Downloadable performance reports for board meetings and parent communications
        </Typography>
      </Box>

      {/* Reports grid */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {reports.map(report => (
          <Card key={report.id} sx={{ bgcolor: '#1e293b', border: '1px solid #334155', transition: 'border-color 0.15s', '&:hover': { borderColor: `${report.accent}40` } }}>
            <CardContent sx={{ p: '24px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                  <Box sx={{ mt: 0.3, flexShrink: 0 }}>{report.icon}</Box>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 700 }}>
                        {report.title}
                      </Typography>
                      {report.tag && (
                        <Chip label={report.tag} size="small" sx={{ bgcolor: `${report.accent}20`, color: report.accent, fontSize: '0.62rem', height: 18, fontWeight: 700 }} />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1 }}>
                      {report.description}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Generated {report.generated}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  sx={{
                    borderColor: report.accent, color: report.accent, fontWeight: 600,
                    '&:hover': { bgcolor: `${report.accent}10`, borderColor: report.accent },
                    borderRadius: 1.5, whiteSpace: 'nowrap',
                  }}
                >
                  Download {report.type}
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Empty state note */}
      <Box sx={{ mt: 4, p: 3, bgcolor: '#1e293b', border: '1px dashed #334155', borderRadius: 2, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Reports are generated automatically after each assessment cycle. New reports appear here within 24 hours of cycle close.
        </Typography>
      </Box>
    </Box>
  );
};

export default SchoolAdminReportsPage;
