import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { AccountBalanceWallet, Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../contexts/WalletContext';

const WalletSummary: React.FC = () => {
  const navigate = useNavigate();
  const { wallet, loading } = useWallet();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: wallet?.currency || 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  const balance = wallet?.balance || 0;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            <AccountBalanceWallet />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Wallet Balance
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Available Credits
            </Typography>
          </Box>
        </Box>

        <Box mb={2}>
          <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
            {formatCurrency(balance)}
          </Typography>
        </Box>

        <Box display="flex" gap={1}>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={() => navigate('/wallet')}
          >
            Recharge
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/wallet')}
          >
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WalletSummary;
