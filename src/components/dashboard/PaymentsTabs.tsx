import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, CircularProgress, Typography } from "@mui/material";

import PastPaymentsTable from "./PastPaymentsTable";
import { getPayments } from '../../db/studentPaymentMappings';
import { setPayments } from '../../state_data/studentPaymentsSlice';
import { RootState } from "../../state_data/reducer";
import { auth } from "../../firebase/firebase";

import * as Sentry from '@sentry/react';
import segment from '../../segment/segment';

type PaymentsTabsProps = {
  uid: string;
};

const PaymentsTabs: React.FC<PaymentsTabsProps> = ({ uid }) => {
  const dispatch = useDispatch();
  const payments = useSelector((state: RootState) => state.studentPayments.payments);
  const paymentsLoaded = useSelector((state: RootState) => state.studentPayments.paymentsLoaded);
  const [loading, setLoading] = useState(!paymentsLoaded);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid?.trim()) {
      setLoading(false);
      return;
    }

    const needPayments = !paymentsLoaded;
    if (!needPayments) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadPayments = async () => {
      const startTime = performance.now();
      try {
        const paymentsData = await getPayments(uid);
        dispatch(setPayments(paymentsData));
      } catch (error: unknown) {
        Sentry.withScope((scope) => {
          scope.setTag('location', 'PaymentsTabs.loadPayments');
          scope.setExtra('email', auth.currentUser?.email);
          Sentry.captureException(error);
        });
        throw error;
      } finally {
        const endTime = performance.now();
        segment.track('Fetch Payments Data Time', {
          fetchTime: endTime - startTime,
          email: auth.currentUser?.email,
          url: window.location.href
        });
      }
    };

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        if (needPayments) await loadPayments();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Something went wrong';
        if (!cancelled) setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [uid, dispatch, paymentsLoaded]);

  if (!uid?.trim()) {
    return (
      <Box sx={{ py: 3, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
          Sign in to load your payments.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, py: 6 }}>
        <CircularProgress size={28} sx={{ color: '#8b5cf6' }} />
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          Loading payments…
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" sx={{ color: '#fecaca' }}>
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <div className="w-full payments-tabs">
      <PastPaymentsTable payments={payments} />
    </div>
  );
}

export default PaymentsTabs;
