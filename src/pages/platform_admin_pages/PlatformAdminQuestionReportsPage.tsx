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
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
  formatDate,
  formatDateTime,
  deletePlatformAdminQuestionProblemReport,
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
import { MathJaxContext } from 'better-react-mathjax';
import { EXAM_MATHJAX_CONFIG } from '../../components/assessment/examMathJaxConfig';
import { AdminExamQuestionBody } from './PlatformAdminExamQuestionCard';

type SourceFilter = 'all' | 'official' | 'practice';
type StatusFilter = 'open' | 'archived';

const toggleGroupSx = {
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
} as const;

function ReportedQuestionBody({ item }: { item: PlatformAdminQuestionProblemReportItem }) {
  const body = (
    <AdminExamQuestionBody
      q={item}
      emptyLabel="(no prompt)"
      optionStatus={(optIdx) => {
        const isCorrect = item.correct_index === optIdx;
        return {
          isCorrect,
          caption: isCorrect ? 'correct' : '',
        };
      }}
    />
  );
  return (
    <Box sx={{ mb: 1.5 }}>
      {item.exam_id === 'mathematical_reasoning' ? (
        <MathJaxContext version={3} config={EXAM_MATHJAX_CONFIG}>
          {body}
        </MathJaxContext>
      ) : (
        body
      )}
    </Box>
  );
}

const PlatformAdminQuestionReportsPage: React.FC = () => {
  const [reports, setReports] = useState<PlatformAdminQuestionProblemReport[]>([]);
  const [officialCount, setOfficialCount] = useState(0);
  const [practiceCount, setPracticeCount] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);
  const [source, setSource] = useState<SourceFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('open');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedReport, setSelectedReport] = useState<PlatformAdminQuestionProblemReport | null>(null);
  const [itemDetail, setItemDetail] = useState<PlatformAdminQuestionProblemReportItem | null>(null);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    kind: 'archive' | 'delete';
    row: PlatformAdminQuestionProblemReport;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPlatformAdminQuestionProblemReports({ limit: 300, source, status });
      setReports(data.reports);
      setOfficialCount(data.official_count);
      setPracticeCount(data.practice_count);
      setOpenCount(data.open_count);
      setArchivedCount(data.archived_count);
    } catch (e) {
      console.error(e);
      setError('Could not load question reports. Try again.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [source, status]);

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
      setItemError('Could not load this question from the item bank.');
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

  const applyArchiveChange = useCallback(
    async (row: PlatformAdminQuestionProblemReport, archived: boolean) => {
      setActionBusyId(row.id);
      setError(null);
      try {
        await setPlatformAdminQuestionProblemReportArchived({ reportId: row.id, archived });
        if (selectedReport?.id === row.id) closeReport();
        setConfirmAction(null);
        await load();
      } catch (e) {
        console.error(e);
        setError(archived ? 'Could not archive this report.' : 'Could not restore this report.');
      } finally {
        setActionBusyId(null);
      }
    },
    [closeReport, load, selectedReport?.id]
  );

  const applyDelete = useCallback(
    async (row: PlatformAdminQuestionProblemReport) => {
      setActionBusyId(row.id);
      setError(null);
      try {
        await deletePlatformAdminQuestionProblemReport(row.id);
        if (selectedReport?.id === row.id) closeReport();
        setConfirmAction(null);
        await load();
      } catch (e) {
        console.error(e);
        setError('Could not delete this report.');
      } finally {
        setActionBusyId(null);
      }
    },
    [closeReport, load, selectedReport?.id]
  );

  const emptyMessage = useMemo(() => {
    if (status === 'archived') {
      if (source === 'official') return 'No archived official exam question reports.';
      if (source === 'practice') return 'No archived practice question reports.';
      return 'No archived question reports.';
    }
    if (source === 'official') return 'No open official exam question reports.';
    if (source === 'practice') return 'No open practice question reports.';
    return 'No open question reports. New reports from exams and practice will appear here.';
  }, [source, status]);

  return (
    <Box sx={platformAdminPageContainerSx}>
      <PlatformAdminPageHeader
        title="Question reports"
        subtitle="Problems students flag on official exams and practice. Archive to hide from the open inbox, or delete to remove the report permanently."
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
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 2.5,
        }}
      >
        <PlatformAdminStatCard
          title="Open"
          value={loading ? '…' : String(openCount)}
          icon={<ReportProblemIcon />}
          accent={ip.navy}
          selected={status === 'open'}
          onClick={() => setStatus('open')}
        />
        <PlatformAdminStatCard
          title="Archived"
          value={loading ? '…' : String(archivedCount)}
          icon={<ArchiveOutlinedIcon />}
          accent="#64748b"
          selected={status === 'archived'}
          onClick={() => setStatus('archived')}
        />
        <PlatformAdminStatCard
          title="Official (shown)"
          value={loading ? '…' : String(officialCount)}
          icon={<ReportProblemIcon />}
          accent="#2563eb"
        />
        <PlatformAdminStatCard
          title="Practice (shown)"
          value={loading ? '…' : String(practiceCount)}
          icon={<ReportProblemIcon />}
          accent="#64748b"
        />
      </Box>

      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Inbox</Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={status}
            onChange={(_e, next: StatusFilter | null) => {
              if (next) setStatus(next);
            }}
            sx={toggleGroupSx}
          >
            <ToggleButton value="open">Open ({loading ? '…' : openCount})</ToggleButton>
            <ToggleButton value="archived">Archived ({loading ? '…' : archivedCount})</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Show</Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={source}
            onChange={(_e, next: SourceFilter | null) => {
              if (next) setSource(next);
            }}
            sx={toggleGroupSx}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="official">Official exams</ToggleButton>
            <ToggleButton value="practice">Practice</ToggleButton>
          </ToggleButtonGroup>
        </Box>
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
            <Table sx={{ ...platformAdminTableSx, minWidth: 920, tableLayout: 'fixed' }} size="small">
              <TableHead>
                <TableRow sx={platformAdminTableHeadRowSx}>
                  <TableCell sx={{ width: 112 }}>When</TableCell>
                  <TableCell sx={{ width: 104 }}>Source</TableCell>
                  <TableCell sx={{ width: 168 }}>Exam / level</TableCell>
                  <TableCell>Report</TableCell>
                  <TableCell sx={{ width: 168 }}>Student</TableCell>
                  <TableCell sx={{ width: 168 }}>School</TableCell>
                  <TableCell align="right" sx={{ width: 88 }}> </TableCell>
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
                      {formatDate(row.reported_at)}
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
                    <TableCell sx={{ verticalAlign: 'top', width: 168 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                        {row.exam_title || row.exam_id}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {row.source === 'official' ? 'Level' : 'Practice level'}{' '}
                        {row.tier_or_level ?? '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top' }}>
                      <Typography
                        sx={{
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          color: ip.heading,
                          lineHeight: 1.45,
                          whiteSpace: 'pre-wrap',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {row.text || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', width: 168, maxWidth: 168 }}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={row.reporter_name || undefined}
                      >
                        {row.reporter_name || 'Unknown'}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          color: '#64748b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={row.reporter_email || undefined}
                      >
                        {row.reporter_email || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', width: 168, maxWidth: 168 }}>
                      <Typography
                        sx={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: ip.heading,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={row.school_name || undefined}
                      >
                        {row.school_name || '-'}
                      </Typography>
                      {row.school_id ? (
                        <Typography
                          sx={{
                            fontSize: '0.7rem',
                            color: '#64748b',
                            fontFamily: 'monospace',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={row.school_id}
                        >
                          {row.school_id}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ verticalAlign: 'top', whiteSpace: 'nowrap', width: 1 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
                        {row.archived ? (
                          <Tooltip title="Restore to open inbox">
                            <span>
                              <IconButton
                                size="small"
                                disabled={actionBusyId === row.id}
                                onClick={() => void applyArchiveChange(row, false)}
                                aria-label={`Restore report ${row.item_id}`}
                                sx={{ color: ip.navy }}
                              >
                                {actionBusyId === row.id ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <UnarchiveOutlinedIcon fontSize="small" />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Archive">
                            <span>
                              <IconButton
                                size="small"
                                disabled={actionBusyId === row.id}
                                onClick={() => setConfirmAction({ kind: 'archive', row })}
                                aria-label={`Archive report ${row.item_id}`}
                                sx={{ color: '#64748b' }}
                              >
                                <ArchiveOutlinedIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete permanently">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              disabled={actionBusyId === row.id}
                              onClick={() => setConfirmAction({ kind: 'delete', row })}
                              aria-label={`Delete report ${row.item_id}`}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
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
        PaperProps={{ sx: { ...platformAdminDialogPaperSx, maxWidth: 920 } }}
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
                  {selectedReport.text || '-'}
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
                    selectedReport.tier_or_level ?? '-'
                  }`}
                  {selectedReport.item_id ? ` · ${selectedReport.item_id}` : ''}
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

                  <ReportedQuestionBody item={itemDetail} />

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
        <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {selectedReport?.archived ? (
              <Button
                onClick={() => void applyArchiveChange(selectedReport, false)}
                disabled={actionBusyId === selectedReport.id}
                sx={platformAdminTextButtonSx}
              >
                Restore
              </Button>
            ) : selectedReport ? (
              <Button
                onClick={() => setConfirmAction({ kind: 'archive', row: selectedReport })}
                disabled={actionBusyId === selectedReport.id}
                sx={platformAdminTextButtonSx}
              >
                Archive
              </Button>
            ) : null}
            {selectedReport ? (
              <Button
                onClick={() => setConfirmAction({ kind: 'delete', row: selectedReport })}
                disabled={actionBusyId === selectedReport.id}
                sx={platformAdminDangerTextButtonSx}
              >
                Delete
              </Button>
            ) : null}
          </Box>
          <Button onClick={closeReport} sx={platformAdminTextButtonSx}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        PaperProps={{ sx: platformAdminDialogPaperSx }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: ip.heading }}>
          {confirmAction?.kind === 'delete' ? 'Delete this report?' : 'Archive this report?'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#475569', fontSize: 14, lineHeight: 1.55 }}>
            {confirmAction?.kind === 'delete'
              ? 'This removes the report from the inbox permanently. You cannot restore it. Matching text on the question history is also removed.'
              : 'It leaves the open inbox. You can restore it from Archived. The question item-level report history is kept.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmAction(null)} sx={platformAdminTextButtonSx}>
            Cancel
          </Button>
          {confirmAction?.kind === 'delete' ? (
            <Button
              onClick={() => confirmAction && void applyDelete(confirmAction.row)}
              disabled={!confirmAction || actionBusyId === confirmAction.row.id}
              sx={platformAdminDangerTextButtonSx}
            >
              Delete
            </Button>
          ) : (
            <Button
              onClick={() => confirmAction && void applyArchiveChange(confirmAction.row, true)}
              disabled={!confirmAction || actionBusyId === confirmAction.row.id}
              sx={platformAdminTextButtonSx}
            >
              Archive
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlatformAdminQuestionReportsPage;
