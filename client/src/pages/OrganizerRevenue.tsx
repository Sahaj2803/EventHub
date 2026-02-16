import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Breadcrumbs,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  NavigateNext,
  AttachMoney,
  TrendingUp,
  People,
  BookOnline,
  CalendarToday,
  Event,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const OrganizerRevenue: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch organizer revenue data
  const { data: revenueData, isLoading, error } = useQuery({
    queryKey: ['organizer-revenue', user?._id],
    queryFn: () => usersAPI.getRevenue(user?._id || ''),
    enabled: !!user?._id,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">
          Failed to load revenue data. Please try again.
        </Alert>
      </Container>
    );
  }

  const revenue = revenueData?.data.revenue || {
    totalRevenue: 0,
    organizerRevenue: 0,
    platformRevenue: 0,
    totalTicketsSold: 0,
    totalEvents: 0,
    activeEvents: 0,
  };

  const monthlyRevenue = revenueData?.data.monthlyRevenue || [];

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
          <Link
            color="inherit"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            Home
          </Link>
          <Link
            color="inherit"
            href="/dashboard"
            onClick={(e) => {
              e.preventDefault();
              navigate('/dashboard');
            }}
          >
            Dashboard
          </Link>
          <Typography color="text.primary">Revenue Analytics</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Revenue Analytics
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Track your event earnings and performance
          </Typography>
        </Box>

        {/* Revenue Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <AttachMoney />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(revenue.organizerRevenue)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your Earnings (50%)
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                    <TrendingUp />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(revenue.totalRevenue)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Event Revenue
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <BookOnline />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {revenue.totalTicketsSold}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tickets Sold
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                    <Event />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {revenue.totalEvents}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Events
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Event Performance */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Event Performance
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {revenue.activeEvents}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Active Events
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {revenue.totalEvents - revenue.activeEvents}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed Events
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Revenue Breakdown
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Your Earnings (50%)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(revenue.organizerRevenue)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Platform Fee (50%)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(revenue.platformRevenue)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', pt: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Total Revenue</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(revenue.totalRevenue)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Monthly Revenue Table */}
        {monthlyRevenue.length > 0 && (
          <Paper elevation={2} sx={{ mb: 4 }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Monthly Revenue Breakdown
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Month</TableCell>
                      <TableCell align="right">Tickets Sold</TableCell>
                      <TableCell align="right">Your Earnings</TableCell>
                      <TableCell align="right">Platform Fee</TableCell>
                      <TableCell align="right">Total Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {monthlyRevenue.map((month: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {new Date(month._id.year, month._id.month - 1).toLocaleDateString('en-US', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {month.ticketsSold}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {formatCurrency(month.revenue)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {formatCurrency(month.revenue)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(month.revenue * 2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Paper>
        )}

        {/* Revenue Model Explanation */}
        <Paper elevation={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Revenue Model Explanation
            </Typography>
            <Typography variant="body1" paragraph>
              Our platform operates on a <strong>50-50 revenue sharing model</strong>:
            </Typography>
            <Box sx={{ ml: 2 }}>
              <Typography variant="body2" paragraph>
                • <strong>50% goes to you (the organizer)</strong> - This is your earnings from ticket sales
              </Typography>
              <Typography variant="body2" paragraph>
                • <strong>50% goes to the platform</strong> - This covers platform maintenance, payment processing, and operational costs
              </Typography>
              <Typography variant="body2" paragraph>
                • <strong>Transparent pricing</strong> - No hidden fees, you always know exactly what you'll earn
              </Typography>
              <Typography variant="body2">
                • <strong>Automatic calculation</strong> - Revenue is calculated and tracked automatically for each booking
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default OrganizerRevenue;
