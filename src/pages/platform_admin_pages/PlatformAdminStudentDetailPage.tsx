import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  deletePlatformAdminStudent,
  formatDate,
  formatInrFromPaise,
  getPlatformAdminStudent,
  type PlatformAdminStudentDetail,
} from '../../db/platformAdminCollection';
import {
  platformAdminCardSx,
  platformAdminDialogFieldLabelSx,
  platformAdminDialogPaperSx,
  platformAdminDialogTextFieldSx,
  platformAdminPageContainerSx,
  platformAdminTableHeadRowSx,
  platformAdminTablePaperSx,
  platformAdminTableSx,
} from './platformAdminPageStyles';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { PlatformAdminChip } from './platformAdminComponents';
import { isPlatformAdminTestStudent } from './platformAdminTestStudents';
import { MEMBERSHIP_LEVEL_LABEL } from '../../utils/studentMembershipPricing';

function studentDisplayName(student: PlatformAdminStudentDetail): string {
  return [student.first_name, student.last_name].filter(Boolean).join(' ').trim() || student.email || student.uid;
}

function studentConfirmToken(student: PlatformAdminStudentDetail): string {
  return (student.email || student.uid).trim();
}

function confirmTokensMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function membershipLabel(level: number | null | undefined): string {
  if (level == null) return ' - ';
  if (level === 1 || level === 2 || level === 3 || level === 4) {
    return `Level ${level} · ${MEMBERSHIP_LEVEL_LABEL[level]}`;
  }
  return `Level ${level}`;
}

function paymentKindLabel(kind: string): string {
  if (kind === 'student_registration_signup') return 'Package signup';
  if (kind === 'student_membership_upgrade') return 'Membership upgrade';
  if (kind === 'student_membership_renewal') return 'Renewal';
  if (kind === 'failed') return 'Failed';
  return kind || ' - ';
}

const PlatformAdminStudentDetailPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<PlatformAdminStudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deleteAuth, setDeleteAuth] = useState(true);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPlatformAdminStudent(studentId);
      setStudent(data);
    } catch {
      setStudent(null);
      setError('Failed to load student details.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDeleteDialog = () => {
    if (!student) return;
    setDeleteConfirmEmail('');
    setDeleteAuth(true);
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const handleDeleteStudent = async () => {
    if (!studentId || !student) return;
    const expected = studentConfirmToken(student);
    if (!confirmTokensMatch(deleteConfirmEmail, expected)) {
      setDeleteError(`Type "${expected}" exactly to confirm.`);
      return;
    }

    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      const result = await deletePlatformAdminStudent(studentId, {
        confirm_email: deleteConfirmEmail.trim(),
        delete_auth: deleteAuth,
      });
      const name = studentDisplayName(student);
      setDeleteOpen(false);
      navigate('/platform-admin/students', {
        replace: true,
        state: {
          deleteSuccess: `${name} deleted.${
            result.authDeleted
              ? ' Auth login removed.'
              : result.authSkipped
                ? ' Auth login kept (shared account).'
                : ''
          }${
            result.pendingRedemptionsRemoved > 0
              ? ` ${result.pendingRedemptionsRemoved} pending redemption(s) removed.`
              : ''
          }`,
        },
      });
    } catch (e: unknown) {
      let msg = 'Failed to delete student.';
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as { error?: string; message?: string } | undefined;
        const status = e.response?.status;
        if (typeof data?.error === 'string' && data.error.trim()) {
          msg = data.error;
        } else if (typeof data?.message === 'string' && data.message.trim()) {
          msg = data.message;
        } else if (status === 403) {
          msg = 'Forbidden: super admin access required.';
        } else if (status === 404) {
          msg =
            'Delete API not found on the server (or student missing). Point the app at the local emulator or redeploy functions:api, then retry.';
        } else if (status) {
          msg = `Failed to delete student (HTTP ${status}).`;
        }
      } else if (e instanceof Error && e.message) {
        msg = e.message;
      }
      setDeleteError(msg);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ ...platformAdminPageContainerSx, display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: ip.navy }} />
      </Box>
    );
  }

  if (!student) {
    return (
      <Box sx={platformAdminPageContainerSx}>
        <Alert severity="error">{error || 'Student not found.'}</Alert>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/platform-admin/students')}
          sx={{ mt: 2, textTransform: 'none', color: ip.navy }}
        >
          Back to students
        </Button>
      </Box>
    );
  }

  const deleteEmailMatches = confirmTokensMatch(deleteConfirmEmail, studentConfirmToken(student));
  const paymentHistory = student.payment_history ?? [];

  return (
    <Box sx={platformAdminPageContainerSx}>
      <Button
        startIcon={<BackIcon />}
        onClick={() => navigate('/platform-admin/students')}
        sx={{ mb: 2, textTransform: 'none', color: ip.navy, fontWeight: 600 }}
      >
        Back to students
      </Button>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: ip.heading }}>
              {studentDisplayName(student)}
            </Typography>
            {isPlatformAdminTestStudent(student) && <PlatformAdminChip label="Test" tone="info" />}
            {student.self_paid && <PlatformAdminChip label="Self-paid" tone="success" />}
            {student.password_setup_complete ? (
              <PlatformAdminChip label="Password set" tone="success" />
            ) : (
              <PlatformAdminChip label="No password yet" tone="warning" />
            )}
            {student.approval_status && (
              <PlatformAdminChip
                label={student.approval_status}
                tone={student.approval_status.toLowerCase() === 'approved' ? 'success' : 'warning'}
              />
            )}
          </Box>
          <Typography variant="body2" sx={{ color: ip.subtext }}>
            {student.uid}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2.5,
        }}
      >
        <Card sx={platformAdminCardSx}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: ip.heading, mb: 2 }}>
              Profile
            </Typography>
            <DetailRow label="Email" value={student.email || ' - '} />
            <DetailRow label="First name" value={student.first_name || ' - '} />
            <DetailRow label="Last name" value={student.last_name || ' - '} />
            <DetailRow label="Phone" value={student.phone_number || ' - '} />
            <DetailRow label="Grade" value={student.grade != null ? String(student.grade) : ' - '} />
            <DetailRow label="Heard from" value={student.heard_from || ' - '} />
            <DetailRow label="Joined" value={formatDate(student.created_at)} />
            <DetailRow label="Updated" value={formatDate(student.updated_at)} />
          </CardContent>
        </Card>

        <Card sx={platformAdminCardSx}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: ip.heading, mb: 2 }}>
              Parent / guardian
            </Typography>
            <DetailRow label="Name" value={student.parent_name || ' - '} />
            <DetailRow label="Email" value={student.parent_email || ' - '} />
            <DetailRow label="Phone" value={student.parent_phone || ' - '} />
          </CardContent>
        </Card>

        <Card sx={platformAdminCardSx}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: ip.heading, mb: 2 }}>
              School & account
            </Typography>
            <DetailRow label="School" value={student.school_name || ' - '} />
            <DetailRow label="School ID" value={student.school_id || ' - '} />
            <DetailRow label="Signup school name" value={student.signup_school_name || ' - '} />
            <DetailRow
              label="Password setup"
              value={student.password_setup_complete ? 'Complete' : 'Not set'}
            />
            <DetailRow label="Registration status" value={student.registration_status || ' - '} />
            <DetailRow label="Approval" value={student.approval_status || ' - '} />
            <DetailRow label="Achievement tier" value={student.achievement_tier || ' - '} />
            <DetailRow label="Argus coins" value={String(student.argus_coins ?? 0)} />
          </CardContent>
        </Card>

        <Card sx={platformAdminCardSx}>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: ip.heading, mb: 2 }}>
              Membership & payment
            </Typography>
            <DetailRow label="Membership" value={membershipLabel(student.membership_level)} />
            <DetailRow
              label="School-covered level"
              value={
                student.school_covered_membership_level != null &&
                student.school_covered_membership_level > 0
                  ? membershipLabel(student.school_covered_membership_level)
                  : 'None'
              }
            />
            <DetailRow
              label="Complimentary level"
              value={
                student.complimentary_invite_membership_level != null &&
                student.complimentary_invite_membership_level > 0
                  ? membershipLabel(student.complimentary_invite_membership_level)
                  : 'None'
              }
            />
            <DetailRow label="Self-paid" value={student.self_paid ? 'Yes' : 'No'} />
            <DetailRow label="Payment status" value={student.payment_status || ' - '} />
            <DetailRow
              label="Amount paid"
              value={
                student.razorpay_amount_paise != null
                  ? formatInrFromPaise(student.razorpay_amount_paise)
                  : ' - '
              }
            />
            <DetailRow label="Paid at" value={formatDate(student.paid_at)} />
            <DetailRow label="Razorpay payment ID" value={student.razorpay_payment_id || ' - '} />
            <DetailRow label="Razorpay order ID" value={student.razorpay_order_id || ' - '} />
            <DetailRow label="Invoice" value={student.billing_invoice_number || ' - '} />
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ ...platformAdminCardSx, mt: 2.5 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: ip.heading, mb: 2 }}>
            Payment history
          </Typography>
          {paymentHistory.length === 0 ? (
            <Typography variant="body2" sx={{ color: ip.subtext }}>
              No individual payments recorded.
            </Typography>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={platformAdminTablePaperSx}>
              <Table size="medium" sx={platformAdminTableSx}>
                <TableHead>
                  <TableRow sx={platformAdminTableHeadRowSx}>
                    <TableCell>When</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Payment ID</TableCell>
                    <TableCell>Invoice</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentHistory.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{formatDate(row.paid_at)}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: ip.heading, fontSize: '0.875rem' }}>
                          {paymentKindLabel(row.kind)}
                        </Typography>
                        <Typography sx={{ color: ip.subtext, fontSize: '0.75rem' }}>
                          {row.description}
                        </Typography>
                      </TableCell>
                      <TableCell>{row.payment_status || ' - '}</TableCell>
                      <TableCell>
                        {row.amount_paise != null ? formatInrFromPaise(row.amount_paise) : ' - '}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>
                        {row.payment_id || ' - '}
                      </TableCell>
                      <TableCell>{row.invoice_number || ' - '}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Card
        sx={{
          ...platformAdminCardSx,
          mt: 3,
          borderColor: '#fecaca',
          bgcolor: '#fffafa',
        }}
      >
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#991b1b', mb: 1 }}>
            Danger zone
          </Typography>
          <Typography variant="body2" sx={{ color: ip.subtext, mb: 2, lineHeight: 1.55, maxWidth: 720 }}>
            Permanently delete this student and all related Firestore data (attempts, reports, payments,
            gamification). Optionally remove their Firebase Auth login.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={openDeleteDialog}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Delete student
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={deleteOpen}
        onClose={() => !deleteSubmitting && setDeleteOpen(false)}
        maxWidth="sm"
        fullWidth
        scroll="paper"
        slotProps={{
          backdrop: { sx: { bgcolor: 'rgba(15, 23, 42, 0.5)' } },
        }}
        PaperProps={{ sx: platformAdminDialogPaperSx }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#991b1b', px: 3, pt: 2.5, pb: 2 }}>
          Delete student permanently?
        </DialogTitle>
        <DialogContent dividers sx={{ px: 3, py: 2.5 }}>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDeleteError(null)}>
              {deleteError}
            </Alert>
          )}
          <Alert severity="error" sx={{ mb: 2 }}>
            This cannot be undone. You are about to delete{' '}
            <strong>{studentDisplayName(student)}</strong> ({student.email}) and all student data stored
            in Firestore (attempts, reports, payments, gamification).
          </Alert>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={deleteAuth}
                  onChange={(e) => setDeleteAuth(e.target.checked)}
                  sx={{ color: ip.navy, '&.Mui-checked': { color: ip.navy } }}
                />
              }
              label={
                <Typography sx={{ color: ip.heading, fontSize: '0.9rem' }}>
                  Delete Firebase Auth login (skipped if this email is a platform admin or school contact)
                </Typography>
              }
            />

            <Box>
              <Typography
                sx={platformAdminDialogFieldLabelSx}
                component="label"
                htmlFor="delete-confirm-email"
              >
                Type student email to confirm
              </Typography>
              <TextField
                id="delete-confirm-email"
                size="small"
                fullWidth
                value={deleteConfirmEmail}
                onChange={(e) => {
                  setDeleteConfirmEmail(e.target.value);
                  if (deleteError) setDeleteError(null);
                }}
                placeholder={studentConfirmToken(student)}
                error={deleteConfirmEmail.length > 0 && !deleteEmailMatches}
                helperText={
                  deleteConfirmEmail.length > 0 && !deleteEmailMatches
                    ? `Must match "${studentConfirmToken(student)}" exactly`
                    : 'Delete stays disabled until the email matches exactly'
                }
                sx={platformAdminDialogTextFieldSx}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            gap: 1.5,
            bgcolor: '#f8fafc',
            borderTop: `1px solid ${ip.cardBorder}`,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          <Button
            type="button"
            onClick={() => setDeleteOpen(false)}
            disabled={deleteSubmitting}
            sx={{ textTransform: 'none', color: ip.subtext }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="contained"
            color="error"
            disabled={deleteSubmitting || !deleteEmailMatches}
            onClick={() => void handleDeleteStudent()}
            startIcon={deleteSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 148,
              bgcolor: '#dc2626',
              '&:hover': { bgcolor: '#b91c1c' },
              '&.Mui-disabled': {
                bgcolor: '#fecaca',
                color: '#991b1b',
                opacity: 1,
              },
            }}
          >
            {deleteSubmitting ? 'Deleting…' : 'Delete permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

function DetailRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, gap: 2 }}>
        <Typography variant="body2" sx={{ color: ip.subtext, flexShrink: 0 }}>
          {label}
        </Typography>
        {children ?? (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              textAlign: 'right',
              color: ip.heading,
              wordBreak: 'break-word',
            }}
          >
            {value}
          </Typography>
        )}
      </Box>
      <Divider />
    </>
  );
}

export default PlatformAdminStudentDetailPage;
