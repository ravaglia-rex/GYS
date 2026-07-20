import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  DeleteOutline as RemoveIcon,
  EditOutlined as EditIcon,
  MailOutline as InviteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  addPlatformAdmin,
  formatDateTime,
  invitePlatformAdmin,
  listPlatformAdminsDirectory,
  removePlatformAdmin,
  updatePlatformAdmin,
  type PlatformAdminDirectoryRow,
} from '../../db/platformAdminCollection';
import {
  platformAdminCardSx,
  platformAdminDialogFieldLabelSx,
  platformAdminDialogPaperSx,
  platformAdminDialogTextFieldSx,
  platformAdminOutlinedButtonSx,
  platformAdminPageContainerSx,
  platformAdminPrimaryButtonSx,
  platformAdminTableHeadRowSx,
  platformAdminTablePaperSx,
  platformAdminTableSx,
  platformAdminTextButtonSx,
} from './platformAdminPageStyles';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import { PlatformAdminChip, PlatformAdminPageHeader } from './platformAdminComponents';

function axiosErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'error' in error.response.data &&
    typeof (error.response.data as { error?: unknown }).error === 'string'
  ) {
    return (error.response.data as { error: string }).error;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

const PlatformAdminAdminsPage: React.FC = () => {
  const [admins, setAdmins] = useState<PlatformAdminDirectoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addName, setAddName] = useState('');
  const [addPosition, setAddPosition] = useState('Team Member');
  const [addSendInvite, setAddSendInvite] = useState(true);
  const [addBusy, setAddBusy] = useState(false);

  const [editAdmin, setEditAdmin] = useState<PlatformAdminDirectoryRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editBusy, setEditBusy] = useState(false);

  const [removeAdmin, setRemoveAdmin] = useState<PlatformAdminDirectoryRow | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  const [inviteBusyEmail, setInviteBusyEmail] = useState<string | null>(null);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listPlatformAdminsDirectory();
      setAdmins(rows);
    } catch (e) {
      setError(axiosErrorMessage(e, 'Failed to load platform admins.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  const activeCount = useMemo(() => admins.filter((a) => a.active).length, [admins]);

  const openAdd = () => {
    setAddEmail('');
    setAddName('');
    setAddPosition('Team Member');
    setAddSendInvite(true);
    setAddOpen(true);
    setMessage(null);
  };

  const handleAdd = async () => {
    const email = addEmail.trim().toLowerCase();
    if (!email) return;
    setAddBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await addPlatformAdmin({
        email,
        name: addName.trim() || undefined,
        position: addPosition.trim() || undefined,
        send_invite: addSendInvite,
      });
      setAddOpen(false);
      setMessage(
        result.invite_sent
          ? `Added ${result.admin.email} and sent a password-setup invitation.`
          : `Added ${result.admin.email}.`
      );
      await loadAdmins();
    } catch (e) {
      setError(axiosErrorMessage(e, 'Failed to add platform admin.'));
    } finally {
      setAddBusy(false);
    }
  };

  const openEdit = (admin: PlatformAdminDirectoryRow) => {
    setEditAdmin(admin);
    setEditName(admin.name);
    setEditPosition(admin.position);
    setMessage(null);
  };

  const handleEdit = async () => {
    if (!editAdmin) return;
    setEditBusy(true);
    setError(null);
    try {
      await updatePlatformAdmin({
        email: editAdmin.email,
        name: editName.trim(),
        position: editPosition.trim(),
      });
      setEditAdmin(null);
      setMessage(`Updated ${editAdmin.email}.`);
      await loadAdmins();
    } catch (e) {
      setError(axiosErrorMessage(e, 'Failed to update platform admin.'));
    } finally {
      setEditBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!removeAdmin) return;
    setRemoveBusy(true);
    setError(null);
    try {
      await removePlatformAdmin(removeAdmin.email);
      setRemoveAdmin(null);
      setMessage(`Removed access for ${removeAdmin.email}.`);
      await loadAdmins();
    } catch (e) {
      setError(axiosErrorMessage(e, 'Failed to remove platform admin.'));
    } finally {
      setRemoveBusy(false);
    }
  };

  const handleInvite = async (email: string) => {
    setInviteBusyEmail(email);
    setError(null);
    setMessage(null);
    try {
      await invitePlatformAdmin(email);
      setMessage(`Password-setup invitation sent to ${email}.`);
    } catch (e) {
      setError(axiosErrorMessage(e, 'Failed to send invitation.'));
    } finally {
      setInviteBusyEmail(null);
    }
  };

  const handleReactivate = async (admin: PlatformAdminDirectoryRow) => {
    setError(null);
    setMessage(null);
    try {
      const result = await addPlatformAdmin({
        email: admin.email,
        name: admin.name,
        position: admin.position,
        send_invite: false,
      });
      setMessage(`Reactivated ${result.admin.email}.`);
      await loadAdmins();
    } catch (e) {
      setError(axiosErrorMessage(e, 'Failed to reactivate platform admin.'));
    }
  };

  return (
    <Box sx={platformAdminPageContainerSx}>
      <PlatformAdminPageHeader
        title="Admin Management"
        subtitle="Add or remove platform admins — visible only to the head admin (srishti@argus.ai)"
        action={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => void loadAdmins()}
              disabled={loading}
              sx={platformAdminOutlinedButtonSx}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openAdd}
              sx={platformAdminPrimaryButtonSx}
            >
              Add admin
            </Button>
          </Box>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {message && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}

      <Box sx={{ ...platformAdminCardSx, p: { xs: 2, sm: 2.5 }, mb: 2 }}>
        <Typography sx={{ color: ip.subtext, fontSize: '0.9rem' }}>
          {activeCount} active admin{activeCount === 1 ? '' : 's'}
          {admins.length > activeCount ? ` · ${admins.length - activeCount} deactivated` : ''}
          . Member admins can view Overview, Schools, Students, and Rewards. Only you can run
          pipelines, billing actions, deletes, complimentary invites, and this page. Last active
          updates when they use the portal (even if they never log out).
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={36} />
        </Box>
      ) : (
        <TableContainer sx={platformAdminTablePaperSx}>
          <Table sx={{ ...platformAdminTableSx, minWidth: 1100 }} size="small">
            <TableHead>
              <TableRow sx={platformAdminTableHeadRowSx}>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Password</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Last active</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>Last invite</TableCell>
                <TableCell align="right" sx={{ width: 1, whiteSpace: 'nowrap', pr: 2 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Typography sx={{ color: ip.subtext, py: 2 }}>No platform admins found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => {
                  const isSuper = admin.role === 'super';
                  const inviteBusy = inviteBusyEmail === admin.email;
                  const lastActive = admin.last_seen_at || admin.last_login_at;
                  return (
                    <TableRow key={admin.email}>
                      <TableCell sx={{ fontWeight: 600 }}>{admin.name || '—'}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{admin.position || '—'}</TableCell>
                      <TableCell>
                        <PlatformAdminChip
                          label={isSuper ? 'Head admin' : 'Member'}
                          tone={isSuper ? 'info' : 'neutral'}
                        />
                      </TableCell>
                      <TableCell>
                        <PlatformAdminChip
                          label={admin.active ? 'Active' : 'Deactivated'}
                          tone={admin.active ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>
                        <PlatformAdminChip
                          label={admin.password_setup_complete ? 'Set up' : 'Needs setup'}
                          tone={admin.password_setup_complete ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip
                          title={
                            admin.last_seen_at
                              ? `Portal activity${
                                  admin.last_login_at
                                    ? ` · Last sign-in ${formatDateTime(admin.last_login_at)}`
                                    : ''
                                }`
                              : admin.last_login_at
                                ? 'Firebase sign-in only (no portal activity recorded yet)'
                                : 'No activity yet'
                          }
                        >
                          <span>{formatDateTime(lastActive)}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {admin.last_invite_sent_at ? (
                          <Tooltip
                            title={
                              admin.last_invited_by
                                ? `Sent by ${admin.last_invited_by}`
                                : 'Invite sent'
                            }
                          >
                            <span>{formatDateTime(admin.last_invite_sent_at)}</span>
                          </Tooltip>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ width: 1, whiteSpace: 'nowrap', pr: 2, pl: 1 }}>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            gap: 0.5,
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            flexShrink: 0,
                          }}
                        >
                          <Tooltip title="Edit name / position">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => openEdit(admin)}
                                aria-label={`Edit ${admin.email}`}
                                sx={{ color: ip.navy }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          {admin.active && !isSuper && (
                            <Tooltip title="Send password-setup invitation">
                              <span>
                                <IconButton
                                  size="small"
                                  disabled={inviteBusy}
                                  onClick={() => void handleInvite(admin.email)}
                                  aria-label={`Invite ${admin.email}`}
                                  sx={{ color: ip.navy }}
                                >
                                  {inviteBusy ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <InviteIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          {!admin.active && !isSuper && (
                            <Button
                              size="small"
                              onClick={() => void handleReactivate(admin)}
                              sx={platformAdminTextButtonSx}
                            >
                              Reactivate
                            </Button>
                          )}
                          {admin.active && !isSuper && (
                            <Tooltip title="Remove access">
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setRemoveAdmin(admin)}
                                  aria-label={`Remove ${admin.email}`}
                                >
                                  <RemoveIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={addOpen}
        onClose={() => !addBusy && setAddOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: platformAdminDialogPaperSx }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: ip.heading, px: 3, pt: 2.5, pb: 1 }}>
          Add platform admin
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: 3, pt: 1, pb: 1 }}>
          <Typography variant="body2" sx={{ color: ip.subtext, lineHeight: 1.55 }}>
            New admins get member access (view-only portal). They cannot be promoted to head admin.
          </Typography>
          <Box>
            <Typography sx={platformAdminDialogFieldLabelSx} component="label" htmlFor="add-admin-email">
              Email
            </Typography>
            <TextField
              id="add-admin-email"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              required
              fullWidth
              autoFocus
              placeholder="admin@argus.ai"
              sx={platformAdminDialogTextFieldSx}
            />
          </Box>
          <Box>
            <Typography sx={platformAdminDialogFieldLabelSx} component="label" htmlFor="add-admin-name">
              Name
            </Typography>
            <TextField
              id="add-admin-name"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              fullWidth
              placeholder="Full name"
              sx={platformAdminDialogTextFieldSx}
            />
          </Box>
          <Box>
            <Typography
              sx={platformAdminDialogFieldLabelSx}
              component="label"
              htmlFor="add-admin-position"
            >
              Position
            </Typography>
            <TextField
              id="add-admin-position"
              value={addPosition}
              onChange={(e) => setAddPosition(e.target.value)}
              fullWidth
              placeholder="e.g. Operations"
              sx={platformAdminDialogTextFieldSx}
            />
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={addSendInvite}
                onChange={(e) => setAddSendInvite(e.target.checked)}
              />
            }
            label="Send password-setup invitation email"
            sx={{ color: ip.heading, ml: 0, alignItems: 'center' }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button onClick={() => setAddOpen(false)} disabled={addBusy} sx={platformAdminTextButtonSx}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleAdd()}
            disabled={addBusy || !addEmail.trim()}
            sx={platformAdminPrimaryButtonSx}
          >
            {addBusy ? <CircularProgress size={20} color="inherit" /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(editAdmin)}
        onClose={() => !editBusy && setEditAdmin(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: platformAdminDialogPaperSx }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: ip.heading, px: 3, pt: 2.5, pb: 1 }}>
          Edit platform admin
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: 3, pt: 1, pb: 1 }}>
          <Typography variant="body2" sx={{ color: ip.subtext, lineHeight: 1.55 }}>
            {editAdmin?.email}
          </Typography>
          <Box>
            <Typography sx={platformAdminDialogFieldLabelSx} component="label" htmlFor="edit-admin-name">
              Name
            </Typography>
            <TextField
              id="edit-admin-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              fullWidth
              sx={platformAdminDialogTextFieldSx}
            />
          </Box>
          <Box>
            <Typography
              sx={platformAdminDialogFieldLabelSx}
              component="label"
              htmlFor="edit-admin-position"
            >
              Position
            </Typography>
            <TextField
              id="edit-admin-position"
              value={editPosition}
              onChange={(e) => setEditPosition(e.target.value)}
              fullWidth
              sx={platformAdminDialogTextFieldSx}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button onClick={() => setEditAdmin(null)} disabled={editBusy} sx={platformAdminTextButtonSx}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleEdit()}
            disabled={editBusy}
            sx={platformAdminPrimaryButtonSx}
          >
            {editBusy ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(removeAdmin)}
        onClose={() => !removeBusy && setRemoveAdmin(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: platformAdminDialogPaperSx }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#991b1b', px: 3, pt: 2.5, pb: 1 }}>
          Remove platform admin?
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 1, pb: 1 }}>
          <Typography variant="body2" sx={{ color: ip.heading, lineHeight: 1.55 }}>
            This deactivates <strong>{removeAdmin?.email}</strong>. They will lose platform admin
            access immediately. You can reactivate them later from this page.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button
            onClick={() => setRemoveAdmin(null)}
            disabled={removeBusy}
            sx={platformAdminTextButtonSx}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void handleRemove()}
            disabled={removeBusy}
          >
            {removeBusy ? <CircularProgress size={20} color="inherit" /> : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlatformAdminAdminsPage;
