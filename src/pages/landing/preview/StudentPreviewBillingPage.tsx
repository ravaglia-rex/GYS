import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Avatar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Tooltip,
  Alert,
} from '@mui/material';
import { CreditCard, TrendingUp } from 'lucide-react';
import { MEMBERSHIP_LEVEL_LABEL } from '../../../utils/studentMembershipPricing';
import { PREVIEW_MEMBERSHIP_LEVEL } from '../../../data/studentPreviewMock';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

/** Membership purchases only (Rev 13 list + GST - illustrative). Newest first. */
const MOCK_PAID = [
  {
    transactionId: 'rzp_preview_skills_upgrade',
    lineName: `Upgrade to ${MEMBERSHIP_LEVEL_LABEL[3]} (annual, difference incl. GST)`,
    paidOn: new Date('2026-03-18'),
    status: 'Paid',
    amount: 1062,
    currency: 'INR',
  },
  {
    transactionId: 'rzp_preview_triad_initial',
    lineName: `${MEMBERSHIP_LEVEL_LABEL[2]} - Membership`,
    paidOn: new Date('2026-01-09'),
    status: 'Paid',
    amount: 1061,
    currency: 'INR',
  },
];

/** Preview-only title (global label still includes “Early offer” for live app / email). */
const PREVIEW_TRIAL_DISCOVERY_NAME = 'Trial - Discovery';

type PackageRow = {
  level: 1 | 2 | 3 | 4;
  name: string;
  blurb: string;
  note: string;
};

const MEMBERSHIP_PACKAGES: PackageRow[] = [
  {
    level: 1,
    name: PREVIEW_TRIAL_DISCOVERY_NAME,
    blurb: 'One-time Trial entry - Symbolic Reasoning (Exam 1).',
    note: 'Not annual',
  },
  {
    level: 2,
    name: MEMBERSHIP_LEVEL_LABEL[2],
    blurb: 'Annual - Exams 1–3 (Reasoning track).',
    note: 'Annual billing',
  },
  {
    level: 3,
    name: MEMBERSHIP_LEVEL_LABEL[3],
    blurb: 'Annual - adds English & AI (Exams 4–5).',
    note: 'Annual billing',
  },
  {
    level: 4,
    name: MEMBERSHIP_LEVEL_LABEL[4],
    blurb: 'Annual - Insight exams & counseling features (6–7).',
    note: 'Annual billing',
  },
];

/**
 * Billing UI for the sample dashboard - mock payments only; no gateways or Firestore.
 */
const StudentPreviewBillingPage: React.FC = () => {
  /** Default to history - pending is empty for this sample learner. */
  const [tab, setTab] = useState(1);
  const currentPackageLevel = PREVIEW_MEMBERSHIP_LEVEL as 1 | 2 | 3 | 4;

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              color: 'white',
            }}
          >
            <CreditCard size={32} />
          </Avatar>
          <Box>
            <Typography
              variant="h4"
              sx={{
                color: 'white',
                fontWeight: 700,
                background: 'linear-gradient(45deg, #10b981, #3b82f6)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Billing & Payments
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 400 }}>
              Manage your exam payments and view transaction history.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Alert
        severity="info"
        sx={{
          mb: 3,
          bgcolor: 'rgba(59, 130, 246, 0.15)',
          color: '#e2e8f0',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          '& .MuiAlert-icon': { color: '#93c5fd' },
        }}
      >
        Amounts and transactions below are examples only. Complete registration and log in to manage actual billing.
      </Alert>

      <Paper
        sx={{
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          p: 3,
          mb: 4,
        }}
      >
        <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
          Billing Overview
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
          Exam fees and membership upgrades are processed securely when you are signed in. This preview shows typical
          layouts only.
        </Typography>
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {['Secure', 'Instant', 'Transparent'].map((title, i) => (
            <Box key={title} sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h5" sx={{ color: '#8b5cf6', fontWeight: 700, mb: 1 }}>
                {title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {i === 0 && 'Encrypted checkout when you are signed in'}
                {i === 1 && 'Access unlocks after successful payment'}
                {i === 2 && 'Pricing shown before you confirm'}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <Paper
        sx={{
          p: 3,
          mb: 4,
          backgroundColor: 'rgba(30, 41, 59, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TrendingUp size={22} color="#a78bfa" />
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            Membership Packages
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', mb: 2 }}>
          Trial first, then three annual packages - Reasoning Triad, Reasoning + Skills, and Guided Decision. Your
          current package is highlighted.
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
          {MEMBERSHIP_PACKAGES.map((pkg) => {
            const isCurrent = pkg.level === currentPackageLevel;
            const isGuidedDecision = pkg.level === 4;
            return (
              <Paper
                key={pkg.level}
                elevation={0}
                sx={{
                  p: 2,
                  position: 'relative',
                  bgcolor: isCurrent ? 'rgba(139, 92, 246, 0.14)' : 'rgba(15, 23, 42, 0.6)',
                  border: isCurrent ? '2px solid rgba(167, 139, 250, 0.75)' : '1px solid rgba(139, 92, 246, 0.25)',
                  borderRadius: 2,
                  boxShadow: isCurrent ? '0 0 24px rgba(139, 92, 246, 0.18)' : undefined,
                }}
              >
              {isCurrent && (
                <Typography
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: '#c4b5fd',
                    textTransform: 'uppercase',
                  }}
                >
                  Current
                </Typography>
              )}
              <Typography sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {pkg.note}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700, mt: 0.75, lineHeight: 1.3, pr: isCurrent ? 5 : 0 }}>
                {pkg.name}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', mb: 2, minHeight: 44 }}>
                {pkg.blurb}
              </Typography>
              {isCurrent ? (
                <Button
                  fullWidth
                  variant="outlined"
                  disabled
                  sx={{
                    borderColor: 'rgba(167, 139, 250, 0.6)',
                    color: '#e9d5ff',
                    fontWeight: 600,
                  }}
                >
                  Current plan
                </Button>
              ) : isGuidedDecision ? (
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    /* Preview only - no payment or navigation */
                  }}
                  sx={{
                    borderColor: '#8b5cf6',
                    color: '#f5f3ff',
                    fontWeight: 600,
                    '&:hover': { borderColor: '#a78bfa', bgcolor: 'rgba(139, 92, 246, 0.2)' },
                  }}
                >
                  Upgrade
                </Button>
              ) : (
                <Tooltip title="Lower packages - your preview profile has already moved past these.">
                  <span>
                    <Button fullWidth variant="outlined" disabled sx={{ borderColor: '#64748b', color: '#94a3b8' }}>
                      Upgrade
                    </Button>
                  </span>
                </Tooltip>
              )}
            </Paper>
            );
          })}
        </Box>
      </Paper>

      <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
        Payment Management
      </Typography>

      <Paper sx={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.65)', textTransform: 'none', fontWeight: 600 },
            '& .Mui-selected': { color: '#8b5cf6' },
            '& .MuiTabs-indicator': { bgcolor: '#8b5cf6' },
          }}
        >
          <Tab label="Pending Payments" />
          <Tab label="Payments History" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <Box sx={{ p: { xs: 2, sm: 3 }, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>
              No pending payments for this sample profile.
            </Typography>
          </Box>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Box sx={{ p: { xs: 1, sm: 2 } }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { color: '#e2e8f0', borderColor: 'rgba(255,255,255,0.08)', fontWeight: 700 } }}>
                  <TableCell>Description</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {MOCK_PAID.map((p) => (
                  <TableRow key={p.transactionId} sx={{ '& td': { borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.88)' } }}>
                    <TableCell sx={{ fontWeight: 500, maxWidth: 280 }}>{p.lineName}</TableCell>
                    <TableCell>{p.paidOn.toLocaleDateString()}</TableCell>
                    <TableCell sx={{ color: '#a78bfa', fontWeight: 600 }}>{p.status}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: '#c4b5fd' }}>
                      {p.currency} {p.amount.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', py: 2, color: 'rgba(255,255,255,0.5)' }}>
              Sample only - membership charges. Your real history appears
              after sign-in.
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default StudentPreviewBillingPage;
