import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { useWallet } from '../../contexts/WalletContext';

interface RechargeDialogProps {
  open: boolean;
  onClose: () => void;
}

const RechargeDialog: React.FC<RechargeDialogProps> = ({ open, onClose }) => {
  const { rechargeWallet } = useWallet();
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('stripe');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isRecharging, setIsRecharging] = useState(false);

  const predefinedAmounts = [10, 25, 50, 100, 250, 500];

  const handleRecharge = async () => {
    if (amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsRecharging(true);
    setError('');

    try {
      await rechargeWallet(amount, paymentMethod, description || 'Wallet recharge');
      handleClose();
    } catch (err: any) {
      console.error('RechargeDialog: Recharge error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to recharge wallet';
      setError(errorMessage);
    } finally {
      setIsRecharging(false);
    }
  };

  const handleClose = () => {
    setAmount(0);
    setPaymentMethod('stripe');
    setDescription('');
    setError('');
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Recharge Wallet</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Select Amount
          </Typography>
          <Grid container spacing={1}>
            {predefinedAmounts.map((predefinedAmount) => (
              <Grid item xs={4} sm={2} key={predefinedAmount}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: amount === predefinedAmount ? 2 : 1,
                    borderColor: amount === predefinedAmount ? 'primary.main' : 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  }}
                  onClick={() => setAmount(predefinedAmount)}
                >
                  <CardContent sx={{ p: 1, textAlign: 'center' }}>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(predefinedAmount)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <TextField
          fullWidth
          label="Custom Amount"
          type="number"
          value={amount || ''}
          onChange={(e) => setAmount(Number(e.target.value))}
          margin="normal"
          inputProps={{ min: 1, step: 0.01 }}
          helperText="Enter amount in USD"
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Payment Method</InputLabel>
          <Select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            label="Payment Method"
          >
            <MenuItem value="stripe">Credit/Debit Card (Stripe)</MenuItem>
            <MenuItem value="paypal">PayPal</MenuItem>
            <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={2}
          placeholder="Add a note for this recharge..."
        />

        {amount > 0 && (
          <Box mt={2} p={2} bgcolor="primary.50" borderRadius={1}>
            <Typography variant="body2" color="primary">
              <strong>You will be charged:</strong> {formatCurrency(amount)}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isRecharging}>
          Cancel
        </Button>
        <Button
          onClick={handleRecharge}
          variant="contained"
          disabled={amount <= 0 || isRecharging}
          startIcon={isRecharging ? <CircularProgress size={20} /> : null}
        >
          {isRecharging ? 'Processing...' : 'Recharge Wallet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RechargeDialog;
