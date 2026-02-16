import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  Receipt,
} from '@mui/icons-material';
import { useWallet } from '../../contexts/WalletContext';
import { WalletTransaction } from '../../types/auth';

const TransactionsList: React.FC = () => {
  const { transactions, transactionsLoading, loadTransactions, wallet } = useWallet();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [totalPages] = useState(1);

  const limit = 10;

  useEffect(() => {
    loadTransactions(page, limit, typeFilter || undefined);
  }, [page, typeFilter, loadTransactions]);

  const handleTypeFilterChange = (event: any) => {
    setTypeFilter(event.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const handlePageChange = (event: any, newPage: number) => {
    setPage(newPage);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: wallet?.currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return <TrendingUp color="success" />;
      case 'debit':
        return <TrendingDown color="error" />;
      case 'refund':
        return <Refresh color="info" />;
      default:
        return <Receipt />;
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  if (transactionsLoading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Transaction History</Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter by Type</InputLabel>
            <Select
              value={typeFilter}
              onChange={handleTypeFilterChange}
              label="Filter by Type"
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="credit">Credits</MenuItem>
              <MenuItem value="debit">Debits</MenuItem>
              <MenuItem value="refund">Refunds</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {transactions.length === 0 ? (
        <Alert severity="info">
          No transactions found. Start by recharging your wallet!
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction: WalletTransaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getTransactionIcon(transaction.type)}
                        <Typography variant="body2" textTransform="capitalize">
                          {transaction.type}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {transaction.description}
                      </Typography>
                      {transaction.bookingId && (
                        <Typography variant="caption" color="text.secondary">
                          Booking ID: {transaction.bookingId}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={
                          transaction.type === 'credit' || transaction.type === 'refund'
                            ? 'success.main'
                            : 'error.main'
                        }
                      >
                        {transaction.type === 'credit' || transaction.type === 'refund' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.paymentMethod}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.status}
                        size="small"
                        color={getStatusColor(transaction.status) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(transaction.createdAt)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default TransactionsList;
