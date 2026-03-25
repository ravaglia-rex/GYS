import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Chip, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Send as SendIcon,
  FileDownload as DownloadIcon,
  ContentCopy as CopyIcon,
  Search as SearchIcon,
  CheckCircle as UsedIcon,
  Schedule as PendingIcon,
} from '@mui/icons-material';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';

// Mock invitation codes for UI demonstration
const MOCK_CODES = [
  { code: 'GYS-XKLA-9M2F', status: 'used',      usedBy: 'Arjun Mehta',    usedOn: '12 Feb 2027' },
  { code: 'GYS-QPRT-7B3D', status: 'available',  usedBy: null,             usedOn: null },
  { code: 'GYS-WNZV-4C1E', status: 'used',       usedBy: 'Priya Sharma',   usedOn: '2 Mar 2027' },
  { code: 'GYS-HJKY-8A5G', status: 'available',  usedBy: null,             usedOn: null },
  { code: 'GYS-MFDT-2R6P', status: 'used',       usedBy: 'Vikram Singh',   usedOn: '28 Jan 2027' },
  { code: 'GYS-LSBU-5N9Q', status: 'available',  usedBy: null,             usedOn: null },
];

const SchoolAdminInvitationsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [bulkEmailDialogOpen, setBulkEmailDialogOpen] = useState(false);
  const [generateCount, setGenerateCount] = useState('10');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filtered = MOCK_CODES.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    (c.usedBy ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const usedCount = MOCK_CODES.filter(c => c.status === 'used').length;
  const availCount = MOCK_CODES.filter(c => c.status === 'available').length;

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ color: ip.heading, fontWeight: 700, mb: 0.5 }}>
          Invitation Codes
        </Typography>
        <Typography variant="body2" sx={{ color: ip.subtext }}>
          Generate and distribute invitation codes (GYS-XXXX-XXXX format) for instant student onboarding
        </Typography>
      </Box>

      {/* Stats row */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        {[
          { label: 'Total Generated', value: MOCK_CODES.length, color: ip.statBlue },
          { label: 'Codes Used', value: usedCount, color: '#16a34a' },
          { label: 'Available', value: availCount, color: ip.navy },
        ].map(s => (
          <Box key={s.label} sx={{ flex: 1, minWidth: 130, textAlign: 'center', bgcolor: ip.cardMutedBg, borderRadius: 2, p: 2.5, border: `1px solid ${ip.cardBorder}` }}>
            <Typography variant="h4" sx={{ color: s.color, fontWeight: 700 }}>{s.value}</Typography>
            <Typography variant="caption" sx={{ color: ip.subtext, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5 }}>{s.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setGenerateDialogOpen(true)}
          sx={{ bgcolor: ip.navy, fontWeight: 600, '&:hover': { bgcolor: '#0c356f' }, borderRadius: 1.5 }}
        >
          Generate New Codes
        </Button>
        <Button
          variant="outlined"
          startIcon={<SendIcon />}
          onClick={() => setBulkEmailDialogOpen(true)}
          sx={{ borderColor: ip.cardBorder, color: ip.heading, fontWeight: 600, '&:hover': { bgcolor: ip.cardMutedBg }, borderRadius: 1.5 }}
        >
          Send Bulk Invitations
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          sx={{ borderColor: ip.cardBorder, color: ip.heading, fontWeight: 600, '&:hover': { bgcolor: ip.cardMutedBg }, borderRadius: 1.5 }}
        >
          Download Code List
        </Button>
      </Box>

      {/* Code table */}
      <Card sx={{ bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, borderRadius: 2, boxShadow: 'none' }}>
        <CardContent sx={{ p: '24px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" sx={{ color: ip.heading, fontWeight: 700 }}>All Codes</Typography>
            <TextField
              size="small"
              placeholder="Search codes or names…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: ip.subtext, fontSize: '1rem' }} /></InputAdornment>,
                sx: { bgcolor: ip.cardMutedBg, color: ip.heading, border: `1px solid ${ip.cardBorder}`, borderRadius: 1.5, fontSize: '0.82rem' },
              }}
              sx={{ width: 240, '& fieldset': { border: 'none' } }}
            />
          </Box>
          <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {['Code', 'Status', 'Used By', 'Used On', 'Action'].map(h => (
                    <TableCell key={h} sx={{ color: ip.subtext, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.6, borderBottom: `1px solid ${ip.cardBorder}`, py: 1 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((row, i) => (
                  <TableRow key={row.code} sx={{ '& td': { borderBottom: `1px solid ${ip.cardBorder}` }, '&:hover': { bgcolor: 'rgba(37,99,235,0.04)' } }}>
                    <TableCell sx={{ color: ip.heading, fontFamily: 'monospace', fontWeight: 600, py: 1.5 }}>{row.code}</TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      {row.status === 'used' ? (
                        <Chip icon={<UsedIcon sx={{ fontSize: '0.8rem !important' }} />} label="Used" size="small" sx={{ bgcolor: 'rgba(16,185,129,0.12)', color: '#10b981', height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                      ) : (
                        <Chip icon={<PendingIcon sx={{ fontSize: '0.8rem !important' }} />} label="Available" size="small" sx={{ bgcolor: 'rgba(99,102,241,0.12)', color: '#818cf8', height: 20, fontSize: '0.68rem', fontWeight: 600 }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ color: ip.subtext, py: 1.5 }}>{row.usedBy ?? '—'}</TableCell>
                    <TableCell sx={{ color: ip.subtext, py: 1.5 }}>{row.usedOn ?? '—'}</TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      {row.status === 'available' && (
                        <Button
                          size="small"
                          startIcon={<CopyIcon sx={{ fontSize: '0.75rem !important' }} />}
                          onClick={() => handleCopy(row.code)}
                          sx={{ color: copiedCode === row.code ? '#10b981' : '#64748b', fontSize: '0.72rem', p: 0, minWidth: 0, '&:hover': { bgcolor: 'transparent', color: '#94a3b8' } }}
                        >
                          {copiedCode === row.code ? 'Copied!' : 'Copy'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Generate codes dialog */}
      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} PaperProps={{ sx: { bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, borderRadius: 2 } }}>
        <DialogTitle sx={{ color: ip.heading, fontWeight: 700 }}>Generate New Invitation Codes</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: ip.subtext, mb: 2 }}>
            New codes will be in GYS-XXXX-XXXX format and immediately available for distribution.
          </Typography>
          <TextField
            label="Number of codes"
            type="number"
            value={generateCount}
            onChange={e => setGenerateCount(e.target.value)}
            fullWidth
            size="small"
            InputProps={{ sx: { color: ip.heading } }}
            InputLabelProps={{ sx: { color: ip.subtext } }}
            sx={{ '& fieldset': { borderColor: ip.cardBorder }, '& .MuiOutlinedInput-root:hover fieldset': { borderColor: ip.navy } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setGenerateDialogOpen(false)} sx={{ color: ip.subtext }}>Cancel</Button>
          <Button variant="contained" onClick={() => setGenerateDialogOpen(false)} sx={{ bgcolor: ip.navy, '&:hover': { bgcolor: '#0c356f' }, fontWeight: 600 }}>
            Generate {generateCount} Codes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk email dialog */}
      <Dialog open={bulkEmailDialogOpen} onClose={() => setBulkEmailDialogOpen(false)} PaperProps={{ sx: { bgcolor: '#fff', border: `1px solid ${ip.cardBorder}`, borderRadius: 2 } }}>
        <DialogTitle sx={{ color: ip.heading, fontWeight: 700 }}>Send Bulk Invitations</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: ip.subtext, mb: 2 }}>
            Paste email addresses (one per line) to send invitation codes via email.
          </Typography>
          <TextField
            multiline
            rows={6}
            fullWidth
            placeholder="student1@email.com&#10;student2@email.com&#10;..."
            InputProps={{ sx: { color: ip.heading, fontFamily: 'monospace', fontSize: '0.82rem' } }}
            sx={{ '& fieldset': { borderColor: ip.cardBorder }, '& .MuiOutlinedInput-root:hover fieldset': { borderColor: ip.navy } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBulkEmailDialogOpen(false)} sx={{ color: ip.subtext }}>Cancel</Button>
          <Button variant="contained" onClick={() => setBulkEmailDialogOpen(false)} sx={{ bgcolor: ip.navy, '&:hover': { bgcolor: '#0c356f' }, fontWeight: 600 }}>
            Send Invitations
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SchoolAdminInvitationsPage;
