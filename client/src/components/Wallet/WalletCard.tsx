import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Add,
  Refresh,
  TrendingUp,
} from '@mui/icons-material';
import { useWallet } from '../../contexts/WalletContext';

interface WalletCardProps {
  onRecharge: () => void;
  onRefresh: () => void;
}

const WalletCard: React.FC<WalletCardProps> = ({ onRecharge, onRefresh }) => {
  const { wallet, loading } = useWallet();

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <AccountBalanceWallet sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Wallet Balance</Typography>
          </Box>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (!wallet) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <AccountBalanceWallet sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Wallet Balance</Typography>
          </Box>
          <Typography color="text.secondary">Loading wallet...</Typography>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: wallet.currency,
    }).format(amount);
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <AccountBalanceWallet sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Wallet Balance</Typography>
          </Box>
          <Box>
            <Tooltip title="Refresh">
              <IconButton onClick={onRefresh} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Recharge">
              <IconButton onClick={onRecharge} size="small" color="primary">
                <Add />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box mb={2}>
          <Typography variant="h4" color="primary" fontWeight="bold">
            {formatCurrency(wallet.balance)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Available Credits
          </Typography>
        </Box>

        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip
            icon={<TrendingUp />}
            label="Ready to Book"
            color="success"
            size="small"
            variant="outlined"
          />
          <Chip
            icon={<AccountBalanceWallet />}
            label={`${wallet.transactions.length} Transactions`}
            color="default"
            size="small"
            variant="outlined"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default WalletCard;
