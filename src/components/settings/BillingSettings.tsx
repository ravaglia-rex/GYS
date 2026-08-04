import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Paper, Divider } from '@mui/material';
import PaymentsTabs from '../dashboard/PaymentsTabs';
import MembershipUpgradeSection from '../dashboard/MembershipUpgradeSection';
import { auth } from '../../firebase/firebase';
import { studentSectionHeadingSx } from '../../styles/studentTypography';

/** Billing content for the Profile → Billing & Payment tab (no page chrome). */
const BillingSettings: React.FC = () => {
  const location = useLocation();
  const membershipAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (location.hash === '#membership-upgrade') {
      membershipAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  return (
    <Box>
      <Paper
        data-tutorial-id="student-payments-main"
        sx={{
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          p: 3,
          mb: 4,
        }}
      >
        <Typography variant="h6" sx={{ ...studentSectionHeadingSx, mb: 2 }}>
          Billing Overview
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
          Student package purchases and membership upgrades are processed securely through Razorpay.
          View your payment history below.
        </Typography>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 2 }} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h5" sx={{ color: '#8b5cf6', fontWeight: 700, mb: 1 }}>
              Secure
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              All payments are encrypted and secure
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h5" sx={{ color: '#8b5cf6', fontWeight: 700, mb: 1 }}>
              Instant
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Immediate access after payment
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h5" sx={{ color: '#8b5cf6', fontWeight: 700, mb: 1 }}>
              Transparent
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Clear pricing with no hidden fees
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Box ref={membershipAnchorRef} id="membership-upgrade" data-tutorial-id="student-payments-upgrade">
        <MembershipUpgradeSection />
      </Box>

      <Typography variant="h5" sx={{ ...studentSectionHeadingSx, mb: 2 }}>
        Payment Management
      </Typography>
      <Paper
        data-tutorial-id="student-payments-tabs"
        sx={{
          backgroundColor: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          mb: 2,
          overflow: 'hidden',
        }}
      >
        <PaymentsTabs uid={auth.currentUser?.uid || ''} />
      </Paper>
    </Box>
  );
};

export default BillingSettings;
