import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { AccountBalanceWallet } from '@mui/icons-material';
import WalletCard from './WalletCard';
import RechargeDialog from './RechargeDialog';
import TransactionsList from './TransactionsList';
import { useWallet } from '../../contexts/WalletContext';

const WalletPage: React.FC = () => {
  const { wallet, loading, error, refreshWallet } = useWallet();
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);

  const handleRecharge = () => {
    setRechargeDialogOpen(true);
  };

  const handleRefresh = () => {
    refreshWallet();
  };

  if (loading && !wallet) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Box display="flex" alignItems="center" mb={2}>
          <AccountBalanceWallet sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            My Wallet
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Manage your wallet balance and view transaction history
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <WalletCard
            onRecharge={handleRecharge}
            onRefresh={handleRefresh}
          />
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Box mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Quick Actions</Typography>
            </Box>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<AccountBalanceWallet />}
                onClick={handleRecharge}
                disabled={loading}
              >
                Recharge Wallet
              </Button>
              <Button
                variant="outlined"
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh Balance
              </Button>
            </Box>
          </Box>

          <TransactionsList />
        </Grid>
      </Grid>

      <RechargeDialog
        open={rechargeDialogOpen}
        onClose={() => setRechargeDialogOpen(false)}
      />
    </Container>
  );
};

export default WalletPage;
