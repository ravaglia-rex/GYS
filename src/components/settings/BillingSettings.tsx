import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Grid,
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Shield,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  Receipt,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

const BillingSettings: React.FC = () => {
  const [showAddCard, setShowAddCard] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      type: 'credit',
      last4: '4242',
      brand: 'Visa',
      expiry: '12/25',
      isDefault: true,
      name: 'John Doe'
    },
    {
      id: 2,
      type: 'credit',
      last4: '8888',
      brand: 'Mastercard',
      expiry: '08/26',
      isDefault: false,
      name: 'John Doe'
    }
  ]);

  const [billingHistory] = useState([
    {
      id: 1,
      date: '2024-01-15',
      description: 'NP By EB Exam',
      amount: 1500,
      status: 'paid',
      invoice: 'INV-001'
    },
    {
      id: 2,
      date: '2024-01-10',
      description: 'Math Assessment',
      amount: 800,
      status: 'paid',
      invoice: 'INV-002'
    },
    {
      id: 3,
      date: '2024-01-05',
      description: 'English Test',
      amount: 600,
      status: 'pending',
      invoice: 'INV-003'
    }
  ]);

  const [currentPlan] = useState({
    name: 'Student Plan',
    price: 0,
    features: [
      'Access to basic exams',
      'Standard support',
      'Basic analytics',
      'Email notifications'
    ],
    nextBilling: '2024-02-15'
  });

  const handleAddCard = () => {
    setShowAddCard(true);
  };

  const handleRemoveCard = (id: number) => {
    setPaymentMethods(prev => prev.filter(card => card.id !== id));
  };

  const handleSetDefault = (id: number) => {
    setPaymentMethods(prev => prev.map(card => ({
      ...card,
      isDefault: card.id === id
    })));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
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
    switch (status) {
      case 'paid':
        return <CheckCircle size={16} />;
      case 'pending':
        return <Clock size={16} />;
      case 'failed':
        return <Shield size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Box>
      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Payment method added successfully!
        </Alert>
      )}

      {/* Current Plan */}
      <Card sx={{
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        mb: 4
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar sx={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
            }}>
              <Shield size={32} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                Current Plan: {currentPlan.name}
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                You're currently on the {currentPlan.name} with access to all basic features
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {currentPlan.features.map((feature, index) => (
                  <Chip
                    key={index}
                    label={feature}
                    size="small"
                    icon={<CheckCircle size={16} />}
                    sx={{
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  />
                ))}
              </Box>
            </Box>
            
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                {currentPlan.price === 0 ? 'Free' : formatCurrency(currentPlan.price)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                per month
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                Next billing: {formatDate(currentPlan.nextBilling)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Payment Methods */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
            height: 'fit-content'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                      Payment Methods
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Manage your payment options
                    </Typography>
                  </Box>
                </Box>
                
                <Button
                  variant="contained"
                  startIcon={<Plus size={16} />}
                  onClick={handleAddCard}
                  sx={{
                    backgroundColor: '#10b981',
                    '&:hover': { backgroundColor: '#059669' }
                  }}
                >
                  Add Card
                </Button>
              </Box>

              <List sx={{ p: 0 }}>
                {paymentMethods.map((card, index) => (
                  <React.Fragment key={card.id}>
                    <ListItem sx={{ 
                      px: 0, 
                      py: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 2,
                      mb: 1
                    }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Avatar sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: card.brand === 'Visa' ? '#1a1f71' : '#eb001b',
                          color: 'white',
                          fontSize: '0.875rem'
                        }}>
                          {card.brand === 'Visa' ? 'V' : 'M'}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                              {card.brand} •••• {card.last4}
                            </Typography>
                            {card.isDefault && (
                              <Chip
                                label="Default"
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                  color: '#10b981',
                                  fontSize: '0.75rem'
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            Expires {card.expiry} • {card.name}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {!card.isDefault && (
                            <Button
                              size="small"
                              onClick={() => handleSetDefault(card.id)}
                              sx={{
                                color: '#8b5cf6',
                                '&:hover': { backgroundColor: 'rgba(139, 92, 246, 0.1)' }
                              }}
                            >
                              Set Default
                            </Button>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveCard(card.id)}
                            sx={{ color: '#ef4444' }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < paymentMethods.length - 1 && (
                      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Billing History */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{
                  width: 48,
                  height: 48,
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: 'white',
                }}>
                  <Receipt size={24} />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    Billing History
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    View your recent transactions
                  </Typography>
                </Box>
              </Box>

              <List sx={{ p: 0 }}>
                {billingHistory.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem sx={{ 
                      px: 0, 
                      py: 2,
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 2,
                      mb: 1
                    }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        <Avatar sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          color: '#3b82f6',
                        }}>
                          <DollarSign size={20} />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                            {item.description}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            {formatDate(item.date)} • {item.invoice}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                            {formatCurrency(item.amount)}
                          </Typography>
                          <Chip
                            icon={getStatusIcon(item.status)}
                            label={item.status}
                            color={getStatusColor(item.status) as any}
                            size="small"
                            sx={{ 
                              fontWeight: 600,
                              '& .MuiChip-icon': { color: 'inherit' }
                            }}
                          />
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < billingHistory.length - 1 && (
                      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 1 }} />
                    )}
                  </React.Fragment>
                ))}
              </List>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<Download size={16} />}
                  sx={{
                    borderColor: '#3b82f6',
                    color: '#3b82f6',
                    '&:hover': { borderColor: '#2563eb', backgroundColor: 'rgba(59, 130, 246, 0.1)' }
                  }}
                >
                  Download All Invoices
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add Payment Method Dialog */}
      <Dialog 
        open={showAddCard} 
        onClose={() => setShowAddCard(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          Add Payment Method
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Card Number"
                placeholder="1234 5678 9012 3456"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Expiry Date"
                placeholder="MM/YY"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="CVV"
                placeholder="123"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cardholder Name"
                placeholder="John Doe"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&.Mui-focused fieldset': { borderColor: '#8b5cf6' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#8b5cf6' },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
          <Button 
            onClick={() => setShowAddCard(false)}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowAddCard(false);
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 3000);
            }}
            sx={{
              backgroundColor: '#10b981',
              '&:hover': { backgroundColor: '#059669' }
            }}
          >
            Add Card
          </Button>
        </DialogActions>
      </Dialog>

      {/* Billing Info */}
      <Box sx={{ mt: 4, p: 3, borderRadius: 2, backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center' }}>
          💳 <strong>Need Help?</strong> Our billing team is here to help with any payment-related questions. Contact us at billing@argus.com or call +91-XXX-XXX-XXXX
        </Typography>
      </Box>
    </Box>
  );
};

export default BillingSettings;
