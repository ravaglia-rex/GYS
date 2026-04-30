import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  LEADERBOARD_DEFAULT_EXPANDED_EXAM_IDS,
  LEADERBOARD_GRADES,
  MOCK_LEADERBOARD_BY_GRADE,
  MOCK_LEADERBOARD_LAST_UPDATED,
  formatLeaderboardDateTime,
  type LeaderboardGrade,
} from '../../data/leaderboardMock';
import { EXAM_MAX_SCORE_POINTS } from '../../utils/assessmentGating';

export interface StudentLeaderboardPanelProps {
  /** Default grade shown in the toggle (e.g. signed-in student grade when wired to profile). */
  initialGrade?: LeaderboardGrade;
}

export default function StudentLeaderboardPanel({ initialGrade = 10 }: StudentLeaderboardPanelProps) {
  const [grade, setGrade] = useState<LeaderboardGrade>(initialGrade);
  const [expandedExamIds, setExpandedExamIds] = useState<Set<string>>(
    () => new Set(LEADERBOARD_DEFAULT_EXPANDED_EXAM_IDS)
  );
  useEffect(() => {
    setGrade(initialGrade);
  }, [initialGrade]);
  const sections = useMemo(() => MOCK_LEADERBOARD_BY_GRADE[grade], [grade]);

  const handleGrade = (_: React.SyntheticEvent, value: LeaderboardGrade | null) => {
    if (value != null) setGrade(value);
  };

  const lastUpdatedText = formatLeaderboardDateTime(MOCK_LEADERBOARD_LAST_UPDATED);

  return (
    <Box>
      <Typography
        variant="body2"
        sx={{
          color: 'rgba(226, 232, 240, 0.92)',
          mb: 2,
          maxWidth: 720,
          lineHeight: 1.55,
          fontSize: '0.875rem',
        }}
      >
       
      
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 2,
        }}
      >
        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>
          Grade
        </Typography>
        <Typography
          variant="caption"
          component="div"
          sx={{
            color: 'rgba(255,255,255,0.5)',
            textAlign: { xs: 'left', sm: 'right' },
            maxWidth: 280,
            lineHeight: 1.45,
          }}
        >
          Last updated{' '}
          <Box component="span" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
            {lastUpdatedText}
          </Box>
        </Typography>
      </Box>
      <ToggleButtonGroup
        exclusive
        value={grade}
        onChange={handleGrade}
        aria-label="Leaderboard grade"
        sx={{
          flexWrap: 'wrap',
          gap: 0.75,
          mb: 3,
          '& .MuiToggleButtonGroup-grouped': {
            border: '1px solid rgba(255,255,255,0.15) !important',
            borderRadius: '8px !important',
            mx: 0,
            px: 1.75,
            py: 0.75,
            color: 'rgba(255,255,255,0.75)',
            '&.Mui-selected': {
              bgcolor: 'rgba(139, 92, 246, 0.28)',
              color: '#e9d5ff',
              borderColor: 'rgba(167, 139, 250, 0.5) !important',
            },
            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
          },
        }}
      >
        {LEADERBOARD_GRADES.map((g) => (
          <ToggleButton key={g} value={g}>
            Grade {g}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {sections.map((section) => (
          <Accordion
            key={section.examId}
            expanded={expandedExamIds.has(section.examId)}
            onChange={(_, isExpanded) => {
              setExpandedExamIds((prev) => {
                const next = new Set(prev);
                if (isExpanded) next.add(section.examId);
                else next.delete(section.examId);
                return next;
              });
            }}
            disableGutters
            elevation={0}
            sx={{
              bgcolor: 'rgba(30, 41, 59, 0.65)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px !important',
              '&:before': { display: 'none' },
              overflow: 'hidden',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: '#c4b5fd' }} />}
              sx={{
                minHeight: 52,
                '& .MuiAccordionSummary-content': { my: 1.25 },
                px: 2,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.25 }}>
                <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                  {section.examName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  Top 10 at your school — best official score (out of {EXAM_MAX_SCORE_POINTS}). “Exam taken” is when that
                  score was earned.
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0, pt: 0, pb: 1.5 }}>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 520, '& .MuiTableCell-root': { borderColor: 'rgba(255,255,255,0.08)' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 600, width: 48 }}>#</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }}>Student</TableCell>
                      <TableCell sx={{ color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>Exam taken</TableCell>
                      <TableCell
                        align="right"
                        sx={{ color: '#94a3b8', fontWeight: 600, minWidth: 108, whiteSpace: 'nowrap' }}
                      >
                        Score
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {section.entries.map((row) => (
                      <TableRow key={row.rank} hover sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}>
                        <TableCell sx={{ color: rankColor(row.rank), fontWeight: 700 }}>{row.rank}</TableCell>
                        <TableCell sx={{ color: '#e2e8f0' }}>{row.studentName}</TableCell>
                        <TableCell sx={{ color: 'rgba(226,232,240,0.92)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                          {formatLeaderboardDateTime(row.examTakenAtISO)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: '#f8fafc', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          {row.scorePoints} on {EXAM_MAX_SCORE_POINTS}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
}

function rankColor(rank: number): string {
  if (rank === 1) return '#fcd34d';
  if (rank === 2) return '#cbd5e1';
  if (rank === 3) return '#fb923c';
  return '#94a3b8';
}
