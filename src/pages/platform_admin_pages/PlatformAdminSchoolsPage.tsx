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
  Button,
  Alert,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  InfoOutlined as InfoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  listPlatformAdminSchools,
  formatDate,
  type PlatformAdminSchoolSummary,
} from '../../db/platformAdminCollection';
import {
  PlatformAdminPageHeader,
  PlatformAdminChip,
  paymentStatusChipTone,
  platformAdminCardSx,
  platformAdminPageContainerSx,
  platformAdminPalette as ip,
  platformAdminTableContainerSx,
  platformAdminTableHeadCellSx,
  platformAdminTextFieldSx,
  platformAdminOutlinedButtonSx,
} from './platformAdminPageStyles';

type PaymentFilter = 'all' | 'paid' | 'pending' | 'wire';
type VerifiedFilter = 'all' | 'yes' | 'no';
type PlanFilter = 'all' | 'entry' | 'standard' | 'premium';

const PAYMENT_LABELS: Record<PaymentFilter, string> = {
  all: 'All payments',
  paid: 'Paid',
  pending: 'Unpaid',
  wire: 'Wire capture needed',
};

const POC_LABELS: Record<VerifiedFilter, string> = {
  all: 'All POC setup',
  yes: 'POC complete',
  no: 'POC pending',
};

const PLAN_LABELS: Record<PlanFilter, string> = {
  all: 'All plans',
  entry: 'Entry',
  standard: 'Standard',
  premium: 'Premium',
};

const filterSelectSx = {
  minWidth: { xs: '100%', sm: 148 },
  flex: { xs: '1 1 100%', sm: '0 0 auto' },
  bgcolor: '#fff',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: ip.cardBorder },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94a3b8' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ip.navy },
};

const PlatformAdminSchoolsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPayment = (searchParams.get('filter') as PaymentFilter) || 'all';
  const initialVerified = (searchParams.get('verified') as VerifiedFilter) || 'all';
  const initialPlan = (searchParams.get('plan') as PlanFilter) || 'all';

  const [schools, setSchools] = useState<PlatformAdminSchoolSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>(
    ['all', 'paid', 'pending', 'wire'].includes(initialPayment) ? initialPayment : 'all'
  );
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>(
    ['all', 'yes', 'no'].includes(initialVerified) ? initialVerified : 'all'
  );
  const [planFilter, setPlanFilter] = useState<PlanFilter>(
    ['all', 'entry', 'standard', 'premium'].includes(initialPlan) ? initialPlan : 'all'
  );

  const hasActiveFilters =
    paymentFilter !== 'all' || verifiedFilter !== 'all' || planFilter !== 'all' || search.trim().length > 0;

  const clearFilters = () => {
    setSearch('');
    setPaymentFilter('all');
    setVerifiedFilter('all');
    setPlanFilter('all');
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (paymentFilter !== 'all') params.set('filter', paymentFilter);
    if (verifiedFilter !== 'all') params.set('verified', verifiedFilter);
    if (planFilter !== 'all') params.set('plan', planFilter);
    setSearchParams(params, { replace: true });
  }, [paymentFilter, verifiedFilter, planFilter, setSearchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPlatformAdminSchools({
        payment: paymentFilter === 'all' ? undefined : paymentFilter,
        verified: verifiedFilter === 'all' ? undefined : verifiedFilter,
        plan: planFilter === 'all' ? undefined : planFilter,
        search: search.trim() || undefined,
        limit: 200,
      });
      setSchools(data);
    } catch {
      setError('Failed to load schools.');
    } finally {
      setLoading(false);
    }
  }, [paymentFilter, verifiedFilter, planFilter, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const filteredSchools = useMemo(() => {
    if (!search.trim()) return schools;
    const q = search.trim().toLowerCase();
    return schools.filter(
      (s) =>
        s.school_name.toLowerCase().includes(q) ||
        s.poc_email.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }, [schools, search]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onDelete: () => void }[] = [];
    if (paymentFilter !== 'all') {
      chips.push({
        key: 'payment',
        label: PAYMENT_LABELS[paymentFilter],
        onDelete: () => setPaymentFilter('all'),
      });
    }
    if (verifiedFilter !== 'all') {
      chips.push({
        key: 'poc',
        label: POC_LABELS[verifiedFilter],
        onDelete: () => setVerifiedFilter('all'),
      });
    }
    if (planFilter !== 'all') {
      chips.push({
        key: 'plan',
        label: PLAN_LABELS[planFilter],
        onDelete: () => setPlanFilter('all'),
      });
    }
    if (search.trim()) {
      chips.push({
        key: 'search',
        label: `Search: ${search.trim()}`,
        onDelete: () => setSearch(''),
      });
    }
    return chips;
  }, [paymentFilter, verifiedFilter, planFilter, search]);

  return (
    <Box sx={platformAdminPageContainerSx}>
      <PlatformAdminPageHeader
        title="Schools"
        subtitle="Monitor registration, payments, and institutional status"
      />

      <Card sx={{ ...platformAdminCardSx, mb: 2.5 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.25,
              alignItems: 'center',
            }}
          >
            <TextField
              size="small"
              placeholder="Search by name, email, or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                flex: '1 1 240px',
                minWidth: 200,
                mb: 0,
                ...platformAdminTextFieldSx,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: ip.subtext }} />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={filterSelectSx}>
              <InputLabel>Payment</InputLabel>
              <Select
                value={paymentFilter}
                label="Payment"
                onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
              >
                {(Object.keys(PAYMENT_LABELS) as PaymentFilter[]).map((value) => (
                  <MenuItem key={value} value={value}>
                    {PAYMENT_LABELS[value]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={filterSelectSx}>
              <InputLabel>POC setup</InputLabel>
              <Select
                value={verifiedFilter}
                label="POC setup"
                onChange={(e) => setVerifiedFilter(e.target.value as VerifiedFilter)}
              >
                {(Object.keys(POC_LABELS) as VerifiedFilter[]).map((value) => (
                  <MenuItem key={value} value={value}>
                    {POC_LABELS[value]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={filterSelectSx}>
              <InputLabel>Plan</InputLabel>
              <Select
                value={planFilter}
                label="Plan"
                onChange={(e) => setPlanFilter(e.target.value as PlanFilter)}
              >
                {(Object.keys(PLAN_LABELS) as PlanFilter[]).map((value) => (
                  <MenuItem key={value} value={value}>
                    {PLAN_LABELS[value]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {hasActiveFilters && (
              <Button
                size="small"
                onClick={clearFilters}
                startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                sx={{
                  textTransform: 'none',
                  color: ip.subtext,
                  fontWeight: 600,
                  flexShrink: 0,
                  '&:hover': { bgcolor: ip.cardMutedBg },
                }}
              >
                Clear
              </Button>
            )}
          </Box>

          {activeFilterChips.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1.25, alignItems: 'center' }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: ip.subtext, mr: 0.5 }}>
                Active:
              </Typography>
              {activeFilterChips.map((chip) => (
                <Chip
                  key={chip.key}
                  label={chip.label}
                  size="small"
                  onDelete={chip.onDelete}
                  sx={{
                    height: 26,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    bgcolor: ip.sidebarActiveBg,
                    color: ip.sidebarActiveText,
                    '& .MuiChip-deleteIcon': { color: ip.sidebarActiveText, fontSize: 16 },
                  }}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

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
                <TableCell sx={{ ...platformAdminTableHeadCellSx, maxWidth: 280, width: '32%' }}>School</TableCell>
                <TableCell sx={platformAdminTableHeadCellSx}>Plan</TableCell>
                <TableCell sx={platformAdminTableHeadCellSx}>Payment</TableCell>
                <TableCell sx={platformAdminTableHeadCellSx}>
                  <Tooltip title="School official completed password setup and can sign in to the school admin portal">
                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      POC setup
                      <InfoIcon sx={{ fontSize: 14, color: ip.subtext }} />
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell sx={platformAdminTableHeadCellSx}>Registered</TableCell>
                <TableCell align="right" sx={platformAdminTableHeadCellSx}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSchools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: ip.subtext }}>
                    No schools match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSchools.map((school) => (
                  <TableRow key={school.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ maxWidth: 280, width: '32%' }}>
                      <Tooltip title={school.school_name} placement="top-start">
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: ip.heading,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 260,
                          }}
                        >
                          {school.school_name}
                        </Typography>
                      </Tooltip>
                      <Typography
                        variant="caption"
                        sx={{
                          color: ip.subtext,
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 260,
                        }}
                      >
                        {school.id}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: ip.heading }}>{school.subscription_plan || '—'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        <PlatformAdminChip label={school.payment_status} tone={paymentStatusChipTone(school.payment_status)} />
                        {school.pending_wire_capture && (
                          <PlatformAdminChip label="Wire capture needed" tone="warning" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <PlatformAdminChip
                        label={school.verified ? 'Complete' : 'Pending'}
                        tone={school.verified ? 'success' : 'neutral'}
                      />
                    </TableCell>
                    <TableCell sx={{ color: ip.subtext }}>{formatDate(school.created_at)}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => navigate(`/platform-admin/schools/${school.id}`)}
                        sx={{ ...platformAdminOutlinedButtonSx, color: ip.navy }}
                      >
                        View
                      </Button>
                    </TableCell>
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

export default PlatformAdminSchoolsPage;
