import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Paper, Divider, Avatar } from '@mui/material';
import { CreditCard } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PaymentsTabs from '../../components/dashboard/PaymentsTabs';
import MembershipUpgradeSection from '../../components/dashboard/MembershipUpgradeSection';
import { auth } from '../../firebase/firebase';
import * as Sentry from '@sentry/react';

const BillingPage: React.FC = () => {
  const location = useLocation();
  const membershipAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (location.hash === '#membership-upgrade') {
      membershipAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag('location', 'BillingPage');
      }}
    >
      <DashboardLayout>
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{
                width: 64,
                height: 64,
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                color: 'white',
              }}>
                <CreditCard size={32} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ 
                  color: 'white', 
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #10b981, #3b82f6)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Billing & Payments
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 400 }}>
                  Manage your exam payments and view transaction history.
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Billing Overview */}
          <Paper sx={{ 
            backgroundColor: 'rgba(30, 41, 59, 0.8)', 
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            p: 3,
            mb: 4
          }}>
            <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
              Billing Overview
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
              All exam payments are processed securely through our payment partners. You can view your complete payment history below.
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

          <Box ref={membershipAnchorRef} id="membership-upgrade">
            <MembershipUpgradeSection />
          </Box>

          {/* Payment Management */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 3 }}>
              Payment Management
            </Typography>
            <PaymentsTabs uid={auth.currentUser?.uid || ""} />
          </Box>
        </Box>
      </DashboardLayout>
    </Sentry.ErrorBoundary>
  );
};

export default BillingPage;
