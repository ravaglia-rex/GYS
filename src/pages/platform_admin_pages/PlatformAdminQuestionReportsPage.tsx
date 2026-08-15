import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import UnarchiveOutlinedIcon from '@mui/icons-material/UnarchiveOutlined';
import {
  formatDateTime,
  getPlatformAdminQuestionProblemReportItem,
  listPlatformAdminQuestionProblemReports,
  setPlatformAdminQuestionProblemReportArchived,
  type PlatformAdminQuestionProblemReport,
  type PlatformAdminQuestionProblemReportItem,
} from '../../db/platformAdminCollection';
import {
  platformAdminDangerTextButtonSx,
  platformAdminDialogPaperSx,
  platformAdminPageContainerSx,
  platformAdminPrimaryButtonSx,
  platformAdminTableHeadRowSx,
  platformAdminTablePaperSx,
  platformAdminTableSx,
  platformAdminTextButtonSx,
} from './platformAdminPageStyles';
import { PlatformAdminPageHeader, PlatformAdminStatCard, PlatformAdminTableSection } from './platformAdminComponents';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { ExamQuestionStimulus } from '../../components/assessment/ExamQuestionBody';
import {
  ExamMarkdown,
  ExamRichPrompt,
  looksLikeExamMarkdown,
  shouldRenderStructuredStimulus,
} from '../../components/assessment/ExamMarkdown';
import type { ExamQuestion } from '../../db/assessmentCollection';

type SourceFilter = 'all' | 'official' | 'practice';

function toStimulusExamQuestion(item: PlatformAdminQuestionProblemReportItem): ExamQuestion {
  return {
    id: item.item_id,
    prompt: item.prompt || '',
    options: (item.options || []).map((o) => o.text),
    stimulus: item.stimulus,
    stimulus_type: item.stimulus_type ?? undefined,
  };
}

const PlatformAdminQuestionReportsPage: React.FC = () => {
  const [reports, setReports] = useState<PlatformAdminQuestionProblemReport[]>([]);
  const [officialCount, setOfficialCount] = useState(0);
  const [practiceCount, setPracticeCount] = useState(0);
  const [source, setSource] = useState<SourceFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedReport, setSelectedReport] = useState<PlatformAdminQuestionProblemReport | null>(null);
  const [itemDetail, setItemDetail] = useState<PlatformAdminQuestionProblemReportItem | null>(null);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPlatformAdminQuestionProblemReports({ limit: 300, source });
      setReports(data.reports);
      setOfficialCount(data.official_count);
      setPracticeCount(data.practice_count);
    } catch (e) {
      console.error(e);
      setError('Could not load question reports. Try again.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [source]);

  useEffect(() => {
    void load();
  }, [load]);

  const openReport = useCallback(async (row: PlatformAdminQuestionProblemReport) => {
    setSelectedReport(row);
    setItemDetail(null);
    setItemError(null);
    setItemLoading(true);
    try {
      const item = await getPlatformAdminQuestionProblemReportItem({
        source: row.source,
        exam_id: row.exam_id,
        tier_or_level: row.tier_or_level,
        item_id: row.item_id,
      });
      setItemDetail(item);
    } catch (e) {
      console.error(e);
      setItemError('Could not load this question. It may have been moved or deleted from the bank.');
    } finally {
      setItemLoading(false);
    }
  }, []);

  const closeReport = useCallback(() => {
    setSelectedReport(null);
    setItemDetail(null);
    setItemError(null);
    setItemLoading(false);
  }, []);

  const emptyMessage = useMemo(() => {
    if (source === 'official') return 'No official exam question reports yet.';
    if (source === 'practice') return 'No practice question reports yet.';
    return 'No question reports yet. New reports from exams and practice will appear here.';
  }, [source]);

  return (
    <Box sx={platformAdminPageContainerSx}>
      <PlatformAdminPageHeader
        title="Question reports"
        subtitle="Problems students flag on official exams and practice. Visible only to srishti@argus.ai and michael@argus.ai."
        action={
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => void load()}
            disabled={loading}
            sx={platformAdminPrimaryButtonSx}
          >
            Refresh
          </Button>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 2.5,
        }}
      >
        <PlatformAdminStatCard
          title="Shown"
          value={loading ? '…' : String(reports.length)}
          icon={<ReportProblemIcon />}
          accent={ip.navy}
        />
        <PlatformAdminStatCard
          title="Official (in fetch)"
          value={loading ? '…' : String(officialCount)}
          icon={<ReportProblemIcon />}
          accent="#2563eb"
        />
        <PlatformAdminStatCard
          title="Practice (in fetch)"
          value={loading ? '…' : String(practiceCount)}
          icon={<ReportProblemIcon />}
          accent="#64748b"
        />
      </Box>

      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
        <Typography sx={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Show</Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={source}
          onChange={(_e, next: SourceFilter | null) => {
            if (next) setSource(next);
          }}
          sx={{
            bgcolor: '#fff',
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              px: 1.5,
              color: ip.heading,
              borderColor: '#cbd5e1',
              fontWeight: 600,
              '&.Mui-selected': {
                bgcolor: 'rgba(16, 64, 139, 0.1)',
                color: ip.navy,
                borderColor: '#94a3b8',
                '&:hover': { bgcolor: 'rgba(16, 64, 139, 0.16)' },
              },
              '&:hover': { bgcolor: '#f8fafc' },
            },
          }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="official">Official exams</ToggleButton>
          <ToggleButton value="practice">Practice</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <PlatformAdminTableSection countLabel={`${reports.length} report${reports.length === 1 ? '' : 's'}`}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={36} sx={{ color: ip.navy }} />
          </Box>
        ) : reports.length === 0 ? (
          <Typography sx={{ color: '#64748b', py: 4, textAlign: 'center' }}>{emptyMessage}</Typography>
        ) : (
          <TableContainer component={Paper} sx={platformAdminTablePaperSx}>
            <Table sx={platformAdminTableSx} size="small">
              <TableHead>
                <TableRow sx={platformAdminTableHeadRowSx}>
                  <TableCell>When</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Exam / level</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell>Report</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>School</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={() => void openReport(row)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                      {formatDateTime(row.reported_at)}
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Chip
                        size="small"
                        label={row.source === 'official' ? 'Official' : 'Practice'}
                        sx={{
                          fontWeight: 700,
                          bgcolor: row.source === 'official' ? 'rgba(16, 64, 139, 0.1)' : '#f1f5f9',
                          color: row.source === 'official' ? ip.navy : ip.heading,
                          border: '1px solid',
                          borderColor: row.source === 'official' ? '#93c5fd' : '#cbd5e1',
                          '& .MuiChip-label': {
                            color: row.source === 'official' ? ip.navy : ip.heading,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', minWidth: 140 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                        {row.exam_title || row.exam_id}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {row.source === 'official' ? 'Level' : 'Practice level'}{' '}
                        {row.tier_or_level ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        verticalAlign: 'top',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: ip.navy,
                        textDecoration: 'underline',
                        textUnderlineOffset: 2,
                      }}
                    >
                      {row.item_id}
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', maxWidth: 360 }}>
                      <Typography
                        sx={{
                          fontSize: '0.85rem',
                          color: '#334155',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {row.text || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', minWidth: 160 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                        {row.reporter_name || 'Unknown'}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {row.reporter_email || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', minWidth: 140 }}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: ip.heading }}>
                        {row.school_name || '—'}
                      </Typography>
                      {row.school_id ? (
                        <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                          {row.school_id}
                        </Typography>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </PlatformAdminTableSection>

      <Dialog
        open={Boolean(selectedReport)}
        onClose={closeReport}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { ...platformAdminDialogPaperSx, maxWidth: 760 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: ip.heading, px: 3, pt: 2.5, pb: 1 }}>
          Reported question
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 1, pb: 2 }}>
          {selectedReport ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box
                sx={{
                  p: 1.75,
                  borderRadius: 1.5,
                  border: `1px solid ${ip.cardBorder}`,
                  bgcolor: '#f8fafc',
                }}
              >
                <Typography sx={{ fontWeight: 800, color: ip.heading, fontSize: 14, mb: 0.75 }}>
                  Student report
                </Typography>
                <Typography
                  sx={{
                    fontSize: 14,
                    color: '#334155',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    mb: 1.25,
                  }}
                >
                  {selectedReport.text || '—'}
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.55 }}>
                  {formatDateTime(selectedReport.reported_at)}
                  {' · '}
                  {selectedReport.reporter_name || 'Unknown'}
                  {selectedReport.reporter_email ? ` (${selectedReport.reporter_email})` : ''}
                  {selectedReport.school_name ? ` · ${selectedReport.school_name}` : ''}
                  {' · '}
                  {selectedReport.exam_title || selectedReport.exam_id}
                  {` · ${selectedReport.source === 'official' ? 'Level' : 'Practice level'} ${
                    selectedReport.tier_or_level ?? '—'
                  }`}
                </Typography>
              </Box>

              {itemLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                  <CircularProgress size={34} sx={{ color: ip.navy }} />
                </Box>
              ) : null}

              {itemError ? <Alert severity="error">{itemError}</Alert> : null}

              {itemDetail ? (
                <Box>
                  <Typography sx={{ fontWeight: 800, color: ip.heading, fontSize: 15, mb: 0.35 }}>
                    Question
                  </Typography>
                  <Typography sx={{ color: '#475569', fontSize: 12, mb: 1, fontFamily: 'monospace' }}>
                    {itemDetail.item_id}
                    {itemDetail.family || itemDetail.subconstruct || itemDetail.mechanic_class_derived
                      ? ` · ${[
                          itemDetail.family,
                          itemDetail.subconstruct,
                          itemDetail.mechanic_class_derived,
                        ]
                          .filter(Boolean)
                          .join(' · ')}`
                      : ''}
                  </Typography>

                  {itemDetail.instruction ? (
                    <Typography sx={{ color: '#64748b', fontSize: 13, mb: 0.75, fontStyle: 'italic' }}>
                      {itemDetail.instruction}
                    </Typography>
                  ) : null}

                  {itemDetail.passage ? (
                    <Typography
                      sx={{
                        color: ip.heading,
                        fontSize: 14,
                        mb: 1,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        p: 1.25,
                        borderRadius: 1,
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      {itemDetail.passage}
                    </Typography>
                  ) : null}

                  <Box sx={{ mb: 1.25 }}>
                    <ExamRichPrompt
                      prompt={itemDetail.prompt || ''}
                      stimulus={itemDetail.stimulus}
                      stimulusType={itemDetail.stimulus_type}
                    />
                  </Box>

                  {shouldRenderStructuredStimulus(itemDetail.stimulus, itemDetail.stimulus_type) ? (
                    <Box sx={{ mb: 1.5 }}>
                      <ExamQuestionStimulus
                        q={toStimulusExamQuestion(itemDetail)}
                        border="#cbd5e1"
                        variant="light"
                      />
                    </Box>
                  ) : null}

                  {itemDetail.options.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 1.5 }}>
                      {itemDetail.options.map((opt, optIdx) => {
                        const keyCorrect = itemDetail.correct_index === optIdx;
                        return (
                          <Box
                            key={`${itemDetail.item_id}-${opt.letter}`}
                            sx={{
                              display: 'flex',
                              gap: 1,
                              alignItems: 'flex-start',
                              px: 1.25,
                              py: 0.85,
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: keyCorrect ? '#86efac' : '#e2e8f0',
                              bgcolor: keyCorrect ? '#f0fdf4' : '#f8fafc',
                            }}
                          >
                            <Typography
                              sx={{
                                fontWeight: 800,
                                color: ip.heading,
                                minWidth: 18,
                                fontSize: 13,
                              }}
                            >
                              {opt.letter}.
                            </Typography>
                            {looksLikeExamMarkdown(opt.text) ? (
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <ExamMarkdown compact>{opt.text}</ExamMarkdown>
                              </Box>
                            ) : (
                              <Typography
                                sx={{
                                  color: ip.heading,
                                  fontSize: 16,
                                  lineHeight: 1.35,
                                  flex: 1,
                                }}
                              >
                                {opt.text}
                              </Typography>
                            )}
                            {keyCorrect ? (
                              <Typography
                                sx={{
                                  fontWeight: 700,
                                  fontSize: 12,
                                  color: '#166534',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                correct
                              </Typography>
                            ) : null}
                          </Box>
                        );
                      })}
                    </Box>
                  ) : null}

                  {itemDetail.solution_steps.length > 0 ? (
                    <Box sx={{ mb: 1.5 }}>
                      <Typography sx={{ fontWeight: 700, color: ip.heading, fontSize: 13, mb: 0.5 }}>
                        Solution steps
                      </Typography>
                      <Box component="ol" sx={{ m: 0, pl: 2.25, color: '#334155', fontSize: 13.5 }}>
                        {itemDetail.solution_steps.map((step, idx) => (
                          <li key={`${itemDetail.item_id}-step-${idx}`} style={{ marginBottom: 4 }}>
                            {step}
                          </li>
                        ))}
                      </Box>
                    </Box>
                  ) : null}

                  {itemDetail.problem_report_texts.length > 0 ? (
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: ip.heading, fontSize: 13, mb: 0.5 }}>
                        All reports on this item ({itemDetail.problem_report_count})
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        {itemDetail.problem_report_texts.map((text, idx) => (
                          <Typography
                            key={`${itemDetail.item_id}-rpt-${idx}`}
                            sx={{
                              fontSize: 13,
                              color: '#475569',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              px: 1.25,
                              py: 0.85,
                              borderRadius: 1,
                              bgcolor: '#fff7ed',
                              border: '1px solid #fed7aa',
                            }}
                          >
                            {text}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  ) : null}
                </Box>
              ) : null}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeReport} sx={platformAdminTextButtonSx}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlatformAdminQuestionReportsPage;
