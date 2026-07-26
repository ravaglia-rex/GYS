import React from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Coins } from 'lucide-react';
import { useCoinsLeaderboard } from '../../query/hooks';
import type { CoinsLeaderboardEntry } from '../../db/studentLeaderboardCollection';

export interface CoinsLeaderboardWidgetProps {
  uid?: string;
  /** Static preview data — skips the live API. */
  previewData?: {
    global: CoinsLeaderboardEntry[];
    school: CoinsLeaderboardEntry[];
    schoolName?: string | null;
    generatedAt?: string | null;
    notEnoughSchoolData?: boolean;
    viewerUid?: string;
  };
}

function displayName(entry: CoinsLeaderboardEntry): string {
  const first = entry.first_name?.trim() || 'Student';
  const initial = entry.last_initial?.trim();
  return initial ? `${first} ${initial}.` : first;
}

function formatGeneratedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function rankColor(rank: number): string {
  if (rank === 1) return '#fcd34d';
  if (rank === 2) return '#cbd5e1';
  if (rank === 3) return '#fb923c';
  return '#94a3b8';
}

const MiniBoard: React.FC<{
  title: string;
  subtitle: string;
  entries: CoinsLeaderboardEntry[];
  viewerUid?: string;
  mode: 'global' | 'school';
  emptyMessage: string;
}> = ({ title, subtitle, entries, viewerUid, mode, emptyMessage }) => (
  <Card
    sx={{
      background: 'rgba(30, 41, 59, 0.8)',
      border: '1px solid rgba(234, 179, 8, 0.22)',
      borderRadius: 3,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
      height: '100%',
      minWidth: 0,
    }}
  >
    <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700, mb: 0.25 }}>
        {title}
      </Typography>
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', display: 'block', mb: 1.5 }}>
        {subtitle}
      </Typography>

      {entries.length === 0 ? (
        <Alert
          severity="info"
          sx={{
            bgcolor: 'rgba(59, 130, 246, 0.12)',
            color: '#e2e8f0',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            '& .MuiAlert-icon': { color: '#93c5fd' },
          }}
        >
          {emptyMessage}
        </Alert>
      ) : (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table
            size="small"
            sx={{
              minWidth: mode === 'global' ? 280 : 240,
              '& .MuiTableCell-root': { borderColor: 'rgba(255,255,255,0.08)', py: 0.75 },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 600, width: 36 }}>#</TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }}>Student</TableCell>
                <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }}>
                  {mode === 'global' ? 'School' : 'Class'}
                </TableCell>
                <TableCell align="right" sx={{ color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Coins
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((row, index) => {
                const rank = index + 1;
                const isSelf = Boolean(viewerUid && row.uid === viewerUid);
                return (
                  <TableRow
                    key={row.uid || rank}
                    sx={{
                      bgcolor: isSelf ? 'rgba(234, 179, 8, 0.12)' : 'transparent',
                      '&:hover': { bgcolor: isSelf ? 'rgba(234, 179, 8, 0.16)' : 'rgba(255,255,255,0.03)' },
                    }}
                  >
                    <TableCell sx={{ color: rankColor(rank), fontWeight: 700 }}>{rank}</TableCell>
                    <TableCell
                      sx={{
                        color: isSelf ? '#fde68a' : '#e2e8f0',
                        fontWeight: isSelf ? 700 : 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {displayName(row)}
                      {isSelf ? ' (you)' : ''}
                    </TableCell>
                    <TableCell sx={{ color: 'rgba(226,232,240,0.85)', fontSize: '0.8125rem' }}>
                      {mode === 'global'
                        ? row.school_name?.trim() || '—'
                        : row.grade != null
                          ? `Class ${row.grade}`
                          : '—'}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: '#fde68a',
                        fontWeight: 700,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {row.coins_lifetime_earned.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </CardContent>
  </Card>
);

const CoinsLeaderboardWidget: React.FC<CoinsLeaderboardWidgetProps> = ({ uid, previewData }) => {
  const live = useCoinsLeaderboard(uid, Boolean(uid) && !previewData);
  const data = previewData
    ? {
        global: previewData.global,
        school: previewData.school,
        schoolName: previewData.schoolName ?? null,
        generatedAt: previewData.generatedAt ?? null,
        notEnoughSchoolData: previewData.notEnoughSchoolData ?? previewData.school.length === 0,
        viewerUid: previewData.viewerUid ?? uid ?? '',
      }
    : live.data;

  const generatedText = formatGeneratedAt(data?.generatedAt);
  const schoolTitle = data?.schoolName?.trim()
    ? `Top 10 at ${data.schoolName.trim()}`
    : 'Top 10 at my school';

  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              color: '#fde68a',
            }}
          >
            <Coins size={18} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}>
              Argus Coins Leaderboard
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>
              Lifetime coins earned — refreshes daily
            </Typography>
          </Box>
        </Box>
        {generatedText && (
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
            Updated {generatedText}
          </Typography>
        )}
      </Box>

      {!previewData && live.isLoading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 4,
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.08)',
            bgcolor: 'rgba(30, 41, 59, 0.5)',
          }}
        >
          <CircularProgress size={28} sx={{ color: '#fde68a' }} />
        </Box>
      ) : !previewData && live.isError ? (
        <Alert
          severity="warning"
          sx={{
            bgcolor: 'rgba(245, 158, 11, 0.12)',
            color: '#fde68a',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            '& .MuiAlert-icon': { color: '#fbbf24' },
          }}
        >
          Could not load the coins leaderboard right now. Check back later.
        </Alert>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
          }}
        >
          <MiniBoard
            title="Top 10 overall"
            subtitle="Name · school · lifetime coins"
            entries={data?.global ?? []}
            viewerUid={data?.viewerUid}
            mode="global"
            emptyMessage="No overall coins rankings yet. Keep earning!"
          />
          <MiniBoard
            title={schoolTitle}
            subtitle="Name · class · lifetime coins"
            entries={data?.school ?? []}
            viewerUid={data?.viewerUid}
            mode="school"
            emptyMessage={
              data?.notEnoughSchoolData
                ? 'Not enough activity yet at your school. Earn coins via exams, practice, and Question of the Day.'
                : 'No school coins rankings yet.'
            }
          />
        </Box>
      )}
    </Box>
  );
};

export default CoinsLeaderboardWidget;
