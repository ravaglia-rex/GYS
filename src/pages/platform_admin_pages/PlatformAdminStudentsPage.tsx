import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import {
  formatDate,
  listPlatformAdminStudents,
  type PlatformAdminStudentRow,
} from '../../db/platformAdminCollection';
import {
  PlatformAdminPageHeader,
  PlatformAdminChip,
  platformAdminPageContainerSx,
  platformAdminPalette as ip,
  platformAdminTableContainerSx,
  platformAdminTableHeadCellSx,
  platformAdminTextFieldSx,
} from './platformAdminPageStyles';

function isSeedMockStudentEmail(email: string): boolean {
  return email.toLowerCase().endsWith('@seed.argus.test');
}

const PlatformAdminStudentsPage: React.FC = () => {
  const [students, setStudents] = useState<PlatformAdminStudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPlatformAdminStudents({ limit: 100, search: search.trim() || undefined });
      setStudents(data);
    } catch {
      setError('Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const filteredStudents = useMemo(() => {
    const realStudents = students.filter((s) => !isSeedMockStudentEmail(s.email));
    if (!search.trim()) return realStudents;
    const q = search.trim().toLowerCase();
    return realStudents.filter(
      (s) =>
        s.email.toLowerCase().includes(q) ||
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        s.uid.toLowerCase().includes(q) ||
        (s.school_id ?? '').toLowerCase().includes(q)
    );
  }, [students, search]);

  return (
    <Box sx={platformAdminPageContainerSx}>
      <PlatformAdminPageHeader
        title="Students"
        subtitle="Browse registered students and membership levels"
      />

      <TextField
        size="small"
        placeholder="Search by name, email, school ID, or UID…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ minWidth: 320, mb: 3, ...platformAdminTextFieldSx }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" sx={{ color: ip.subtext }} />
            </InputAdornment>
          ),
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: ip.navy }} />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={platformAdminTableContainerSx}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={platformAdminTableHeadCellSx}>Name</TableCell>
                <TableCell sx={platformAdminTableHeadCellSx}>Email</TableCell>
                <TableCell sx={platformAdminTableHeadCellSx}>School</TableCell>
                <TableCell sx={platformAdminTableHeadCellSx}>Grade</TableCell>
                <TableCell sx={platformAdminTableHeadCellSx}>Membership</TableCell>
                <TableCell sx={platformAdminTableHeadCellSx}>Status</TableCell>
                <TableCell sx={platformAdminTableHeadCellSx}>Joined</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: ip.subtext }}>
                    No students match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.uid} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ fontWeight: 600, color: ip.heading }}>
                      {[student.first_name, student.last_name].filter(Boolean).join(' ') || '—'}
                    </TableCell>
                    <TableCell sx={{ color: ip.heading }}>{student.email || '—'}</TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: ip.subtext }}>{student.school_id || '—'}</Typography>
                    </TableCell>
                    <TableCell sx={{ color: ip.heading }}>{student.grade ?? '—'}</TableCell>
                    <TableCell sx={{ color: ip.heading }}>
                      {student.membership_level != null ? `Level ${student.membership_level}` : '—'}
                    </TableCell>
                    <TableCell>
                      {student.approval_status ? (
                        <PlatformAdminChip label={student.approval_status} tone="info" />
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell sx={{ color: ip.subtext }}>{formatDate(student.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default PlatformAdminStudentsPage;
