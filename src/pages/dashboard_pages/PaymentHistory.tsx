import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Chip,
  Avatar,
  Button,
  Grid,
  LinearProgress,
  Alert
} from '@mui/material';
import { 
  CreditCard, 
  Receipt, 
  TrendingUp, 
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state_data/reducer';
import DashboardLayout from '../../layouts/DashboardLayout';
import * as Sentry from '@sentry/react';

const PaymentHistory: React.FC = () => {
  const payments = useSelector((state: RootState) => state.studentPayments.payments);
  const [loading, setLoading] = useState(false);

  // Calculate payment statistics
  const totalPayments = payments.length;
  const completedPayments = payments.filter(p => p.paymentStatus === 'completed').length;
  const pendingPayments = payments.filter(p => p.paymentStatus === 'pending').length;
  const totalAmount = payments
    .filter(p => p.paymentStatus === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle size={16} />;
      case 'pending':
        return <Clock size={16} />;
      case 'failed':
        return <AlertCircle size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Box sx={{ maxWidth: '100%' }}>
      {/* Payment Statistics */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 3, 
        mb: 4 
      }}>
          <Card sx={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{
                  width: 48,
                  height: 48,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                }}>
                  <DollarSign size={24} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {formatCurrency(totalAmount)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Total Spent
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{
                  width: 48,
                  height: 48,
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white',
                }}>
                  <Receipt size={24} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {totalPayments}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Total Transactions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{
                  width: 48,
                  height: 48,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                }}>
                  <CheckCircle size={24} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {completedPayments}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{
                  width: 48,
                  height: 48,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white',
                }}>
                  <Clock size={24} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                    {pendingPayments}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Pending
                  </Typography>
                  </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Payment Success Rate */}
        <Card sx={{
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          mb: 4
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: 'white',
              }}>
                <TrendingUp size={24} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  Payment Success Rate
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Track your successful payment completion
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 }}>
              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                  Success Rate
                </Typography>
                <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 700, mb: 2 }}>
                  {totalPayments > 0 ? Math.round((completedPayments / totalPayments) * 100) : 0}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: 'linear-gradient(90deg, #10b981, #059669)',
                    }
                  }}
                />
              </Box>

              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                  Average Transaction
                </Typography>
                <Typography variant="h4" sx={{ color: '#3b82f6', fontWeight: 700 }}>
                  {completedPayments > 0 ? formatCurrency(totalAmount / completedPayments) : formatCurrency(0)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Per successful payment
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Billing Information */}
        <Card sx={{
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          mb: 4
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: 'white',
              }}>
                <CreditCard size={24} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  Billing Information
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Manage your payment methods and billing details
                </Typography>
              </Box>
            </Box>

            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 3 
            }}>
              <Box sx={{ 
                p: 3, 
                borderRadius: 2, 
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, mb: 2 }}>
                  Current Plan
                </Typography>
                <Typography variant="h5" sx={{ color: '#10b981', fontWeight: 700, mb: 1 }}>
                  Student Plan
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                  Access to basic exams and features
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: '#10b981',
                    color: '#10b981',
                    '&:hover': { borderColor: '#059669', backgroundColor: 'rgba(16, 185, 129, 0.1)' }
                  }}
                >
                  View Plans
                </Button>
              </Box>

              <Box sx={{ 
                p: 3, 
                borderRadius: 2, 
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, mb: 2 }}>
                  Payment Methods
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                  Manage your saved payment options
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: '#8b5cf6',
                    color: '#8b5cf6',
                    '&:hover': { borderColor: '#7c3aed', backgroundColor: 'rgba(139, 92, 246, 0.1)' }
                  }}
                >
                  Manage Cards
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Payment Transactions Table */}
        <Card sx={{
          background: 'rgba(30, 41, 59, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{
                width: 48,
                height: 48,
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white',
              }}>
                <CreditCard size={24} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  Transaction History 💳
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  Detailed view of all your payment transactions
                </Typography>
              </Box>
            </Box>

            {payments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  No payment history yet
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Your payment transactions will appear here once you make your first payment.
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ 
                backgroundColor: 'transparent',
                boxShadow: 'none',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
              }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600, border: 'none' }}>
                        Transaction ID
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600, border: 'none' }}>
                        Exam
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600, border: 'none' }}>
                        Amount
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600, border: 'none' }}>
                        Payment Method
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600, border: 'none' }}>
                        Status
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600, border: 'none' }}>
                        Date
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((payment, index) => (
                      <TableRow 
                        key={index}
                        sx={{ 
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                          }
                        }}
                      >
                        <TableCell sx={{ color: 'white', border: 'none', fontFamily: 'monospace' }}>
                          {payment.transactionId || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ color: 'white', border: 'none' }}>
                          {payment.formId}
                        </TableCell>
                        <TableCell sx={{ color: 'white', border: 'none', fontWeight: 600 }}>
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)', border: 'none' }}>
                          {payment.paymentMethod || 'Online'}
                        </TableCell>
                        <TableCell sx={{ border: 'none' }}>
                          <Chip
                            icon={getStatusIcon(payment.paymentStatus)}
                            label={payment.paymentStatus}
                            color={getStatusColor(payment.paymentStatus) as any}
                            size="small"
                            sx={{ 
                              fontWeight: 600,
                              '& .MuiChip-icon': { color: 'inherit' }
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255, 255, 255, 0.8)', border: 'none' }}>
                          {formatDate(payment.paidOn)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>
  );
};

export default PaymentHistory;