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
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  InfoOutlined as InfoIcon,
  Close as CloseIcon,
  Payment as PaymentIcon,
  School as SchoolIcon,
  CheckCircleOutline as CheckCircleIcon,
  CurrencyRupee as RupeeIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  getPlatformAdminOverview,
  listPlatformAdminSchools,
  formatInrFromPaise,
  resolvePlatformAdminSchoolPaymentPayee,
  PLATFORM_ADMIN_PAYMENT_PAYEE_LABELS,
  type PlatformAdminOverviewStats,
  type PlatformAdminSchoolSummary,
} from '../../db/platformAdminCollection';
import {
  platformAdminCardSx,
  platformAdminClearFiltersButtonSx,
  platformAdminFilterToolbarRowSx,
  platformAdminPageContainerSx,
  platformAdminSearchFieldSx,
  platformAdminStatsGridSx,
  platformAdminTableHeadRowSx,
  platformAdminTablePaperSx,
  platformAdminTableSx,
  platformAdminTextButtonSx,
} from './platformAdminPageStyles';
import { institutionalPalette as ip } from '../../theme/institutionalPalette';
import {
  PlatformAdminPageHeader,
  PlatformAdminChip,
  PlatformAdminStatCard,
  PlatformAdminFilterControl,
  PlatformAdminTableSection,
  formatPaymentStatusLabel,
  paymentStatusChipTone,
} from './platformAdminComponents';
import { isPlatformAdminTestSchool } from './platformAdminTestSchools';

type PaymentFilter = 'all' | 'paid' | 'pending' | 'wire';
type PayeeFilter = 'all' | 'education_world' | 'argus';
type VerifiedFilter = 'all' | 'yes' | 'no';
type PlanFilter = 'all' | 'entry' | 'standard' | 'premium';

const PAYMENT_LABELS: Record<PaymentFilter, string> = {
  all: 'All payments',
  paid: 'Paid',
  pending: 'Unpaid',
  wire: 'Wire capture needed',
};

const PAYEE_LABELS: Record<PayeeFilter, string> = {
  all: 'All payees',
  education_world: 'Education World',
  argus: 'Argus',
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

const PlatformAdminSchoolsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPayment = (searchParams.get('filter') as PaymentFilter) || 'all';
  const initialPayee = (searchParams.get('payee') as PayeeFilter) || 'all';
  const initialVerified = (searchParams.get('verified') as VerifiedFilter) || 'all';
  const initialPlan = (searchParams.get('plan') as PlanFilter) || 'all';

  const [schools, setSchools] = useState<PlatformAdminSchoolSummary[]>([]);
  const [stats, setStats] = useState<PlatformAdminOverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>(
    ['all', 'paid', 'pending', 'wire'].includes(initialPayment) ? initialPayment : 'all'
  );
  const [payeeFilter, setPayeeFilter] = useState<PayeeFilter>(
    ['all', 'education_world', 'argus'].includes(initialPayee) ? initialPayee : 'all'
  );
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>(
    ['all', 'yes', 'no'].includes(initialVerified) ? initialVerified : 'all'
  );
  const [planFilter, setPlanFilter] = useState<PlanFilter>(
    ['all', 'entry', 'standard', 'premium'].includes(initialPlan) ? initialPlan : 'all'
  );
  const deleteSuccessMessage =
    typeof location.state === 'object' &&
    location.state !== null &&
    'deleteSuccess' in location.state &&
    typeof (location.state as { deleteSuccess?: unknown }).deleteSuccess === 'string'
      ? (location.state as { deleteSuccess: string }).deleteSuccess
      : null;

  const hasActiveFilters =
    paymentFilter !== 'all' ||
    payeeFilter !== 'all' ||
    verifiedFilter !== 'all' ||
    planFilter !== 'all' ||
    search.trim().length > 0;

  const clearFilters = () => {
    setSearch('');
    setPaymentFilter('all');
    setPayeeFilter('all');
    setVerifiedFilter('all');
    setPlanFilter('all');
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (paymentFilter !== 'all') params.set('filter', paymentFilter);
    if (payeeFilter !== 'all') params.set('payee', payeeFilter);
    if (verifiedFilter !== 'all') params.set('verified', verifiedFilter);
    if (planFilter !== 'all') params.set('plan', planFilter);
    setSearchParams(params, { replace: true });
  }, [paymentFilter, payeeFilter, verifiedFilter, planFilter, setSearchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, overview] = await Promise.all([
        listPlatformAdminSchools({
          payment: paymentFilter === 'all' ? undefined : paymentFilter,
          payee: payeeFilter === 'all' ? undefined : payeeFilter,
          verified: verifiedFilter === 'all' ? undefined : verifiedFilter,
          plan: planFilter === 'all' ? undefined : planFilter,
          search: search.trim() || undefined,
          limit: 200,
        }),
        getPlatformAdminOverview(),
      ]);
      setSchools(data);
      setStats(overview);
    } catch {
      setError('Failed to load schools.');
    } finally {
      setLoading(false);
    }
  }, [paymentFilter, payeeFilter, verifiedFilter, planFilter, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const filteredSchools = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? schools.filter(
          (s) =>
            s.school_name.toLowerCase().includes(q) ||
            s.poc_email.toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q)
        )
      : schools;
    return [...list].sort((a, b) => {
      const aTest = isPlatformAdminTestSchool(a.id);
      const bTest = isPlatformAdminTestSchool(b.id);
      if (aTest !== bTest) return aTest ? 1 : -1;
      const aMs = a.created_at ? Date.parse(a.created_at) : 0;
      const bMs = b.created_at ? Date.parse(b.created_at) : 0;
      return bMs - aMs;
    });
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
    if (payeeFilter !== 'all') {
      chips.push({
        key: 'payee',
        label: `Paid to ${PAYEE_LABELS[payeeFilter]}`,
        onDelete: () => setPayeeFilter('all'),
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
  }, [paymentFilter, payeeFilter, verifiedFilter, planFilter, search]);

  return (
    <Box sx={platformAdminPageContainerSx}>
      <PlatformAdminPageHeader
        title="Schools"
        subtitle="Monitor registration, payments, and institutional status"
      />

      {stats && (
        <Card
          sx={{
            ...platformAdminCardSx,
            mb: 2,
            background: `linear-gradient(135deg, ${ip.navy} 0%, #1e3a5f 100%)`,
            borderColor: 'transparent',
          }}
        >
          <CardContent sx={{ py: 2.5, px: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  borderRadius: 2,
                  p: 1.25,
                  display: 'flex',
                }}
              >
                <RupeeIcon />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 0.25 }}>
                  Total revenue collected (excl. test schools)
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
                  {formatInrFromPaise(stats.total_revenue_paise)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {stats && (
        <Box sx={platformAdminStatsGridSx}>
          <PlatformAdminStatCard
            title="Total registered"
            value={stats.schools_total}
            subtitle="All schools on platform"
            icon={<SchoolIcon />}
            accent={ip.statBlue}
          />
          <PlatformAdminStatCard
            title="Paid"
            value={stats.schools_paid}
            subtitle={
              stats.schools_total > 0
                ? `${Math.round((stats.schools_paid / stats.schools_total) * 100)}% of total`
                : undefined
            }
            icon={<PaymentIcon />}
            accent={ip.approveGreen}
            onClick={() => {
              setPaymentFilter('paid');
              setPayeeFilter('all');
              setVerifiedFilter('all');
              setPlanFilter('all');
              setSearch('');
            }}
          />
          <PlatformAdminStatCard
            title="Pending payment"
            value={stats.schools_pending_payment}
            subtitle="Not yet paid"
            icon={<PaymentIcon />}
            accent="#d97706"
            onClick={() => {
              setPaymentFilter('pending');
              setPayeeFilter('all');
              setVerifiedFilter('all');
              setPlanFilter('all');
              setSearch('');
            }}
          />
          <PlatformAdminStatCard
            title="POC setup complete"
            value={stats.schools_verified}
            subtitle={
              stats.schools_total > 0
                ? `${stats.schools_total - stats.schools_verified} still pending`
                : undefined
            }
            icon={<CheckCircleIcon />}
            accent={ip.statBlue}
            onClick={() => {
              setVerifiedFilter('yes');
              setPaymentFilter('all');
              setPayeeFilter('all');
              setPlanFilter('all');
              setSearch('');
            }}
          />
        </Box>
      )}

      <Card sx={{ ...platformAdminCardSx, mb: 2.5 }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
          <Box sx={{ mb: activeFilterChips.length > 0 ? 1.5 : 0 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search by name, email, or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                mb: 1.5,
                ...platformAdminSearchFieldSx,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: ip.subtext }} />
                  </InputAdornment>
                ),
              }}
            />

            <Box
              sx={{
                ...platformAdminFilterToolbarRowSx,
                width: '100%',
                flexWrap: { xs: 'wrap', md: 'nowrap' },
              }}
            >
              <PlatformAdminFilterControl
                id="schools-payment-filter"
                label="Payment"
                value={paymentFilter}
                labels={PAYMENT_LABELS}
                minWidth={176}
                fullWidth
                onChange={setPaymentFilter}
              />

              <PlatformAdminFilterControl
                id="schools-payee-filter"
                label="Paid to"
                value={payeeFilter}
                labels={PAYEE_LABELS}
                minWidth={168}
                fullWidth
                onChange={setPayeeFilter}
              />

              <PlatformAdminFilterControl
                id="schools-poc-filter"
                label="POC setup"
                value={verifiedFilter}
                labels={POC_LABELS}
                minWidth={168}
                fullWidth
                onChange={setVerifiedFilter}
              />

              <PlatformAdminFilterControl
                id="schools-plan-filter"
                label="Plan"
                value={planFilter}
                labels={PLAN_LABELS}
                minWidth={148}
                fullWidth
                onChange={setPlanFilter}
              />

              {hasActiveFilters && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={clearFilters}
                  startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                  sx={{ ...platformAdminClearFiltersButtonSx, flexShrink: 0 }}
                >
                  Clear
                </Button>
              )}
            </Box>
          </Box>

          {activeFilterChips.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.75,
                pt: 1.5,
                borderTop: `1px solid ${ip.cardBorder}`,
                alignItems: 'center',
              }}
            >
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: ip.subtext, mr: 0.25 }}>
                Active filters
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

      {deleteSuccessMessage && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => navigate('/platform-admin/schools', { replace: true, state: {} })}
        >
          {deleteSuccessMessage}
        </Alert>
      )}

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
        <PlatformAdminTableSection
          countLabel={`Showing ${filteredSchools.length} school${filteredSchools.length === 1 ? '' : 's'}`}
        >
          <TableContainer component={Paper} elevation={0} sx={platformAdminTablePaperSx}>
            <Table size="medium" sx={platformAdminTableSx}>
              <TableHead>
                <TableRow sx={platformAdminTableHeadRowSx}>
                  <TableCell sx={{ maxWidth: 280, width: '34%' }}>School</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>
                    <Tooltip title="School official completed password setup and can sign in to the school admin portal">
                      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        POC setup
                        <InfoIcon sx={{ fontSize: 14, color: ip.subtext }} />
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Student emails currently on this school's invite list">
                      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        Invited
                        <InfoIcon sx={{ fontSize: 14, color: ip.subtext }} />
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSchools.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5, color: ip.subtext }}>
                      No schools match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell sx={{ maxWidth: 280, width: '34%' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            minWidth: 0,
                            maxWidth: 260,
                          }}
                        >
                          <Tooltip title={school.school_name} placement="top-start">
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: ip.heading,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                minWidth: 0,
                                flex: 1,
                              }}
                            >
                              {school.school_name}
                            </Typography>
                          </Tooltip>
                          {isPlatformAdminTestSchool(school.id) && (
                            <PlatformAdminChip label="Test" tone="info" />
                          )}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: ip.subtext,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 260,
                            mt: 0.25,
                          }}
                        >
                          {school.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: ip.heading }}>
                          {school.subscription_plan || ' - '}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                          <PlatformAdminChip
                            label={formatPaymentStatusLabel(school.payment_status)}
                            tone={paymentStatusChipTone(school.payment_status)}
                          />
                          {(() => {
                            const payee = resolvePlatformAdminSchoolPaymentPayee(school);
                            if (!payee) return null;
                            return (
                              <PlatformAdminChip
                                label={PLATFORM_ADMIN_PAYMENT_PAYEE_LABELS[payee]}
                                tone={payee === 'education_world' ? 'warning' : 'info'}
                              />
                            );
                          })()}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <PlatformAdminChip
                          label={school.verified ? 'Complete' : 'Pending'}
                          tone={school.verified ? 'success' : 'neutral'}
                        />
                      </TableCell>
                      <TableCell sx={{ color: ip.heading, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {school.students_invited ?? 0}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          startIcon={<ViewIcon sx={{ fontSize: 18 }} />}
                          onClick={() => navigate(`/platform-admin/schools/${school.id}`)}
                          sx={platformAdminTextButtonSx}
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
        </PlatformAdminTableSection>
      )}
    </Box>
  );
};

export default PlatformAdminSchoolsPage;
