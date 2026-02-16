import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  LinearProgress,
  Breadcrumbs,
  Link,
  Divider,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Email,
  Edit,
  Delete,
  Visibility,
  People,
  AttachMoney,
  CalendarToday,
  NavigateNext,
  Event as EventIcon,
  BookOnline,
  TrendingUp,
  AccountBalanceWallet,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI, bookingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { Event } from '../types/event';
import WalletSummary from '../components/Wallet/WalletSummary';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wallet, loading: walletLoading } = useWallet();
  const queryClient = useQueryClient();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [emailTestLoading, setEmailTestLoading] = useState(false);
  const [emailTestMessage, setEmailTestMessage] = useState<string | null>(null);

  // Get user ID with backward compatibility
  const userId = user?._id || user?.id;

  // Fetch user's events using the correct endpoint
  const { data: eventsData, isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ['user-events', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/events`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      return { data };
    },
    enabled: !!userId,
  });

  // Fetch recent bookings for user's events
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['recent-bookings', userId],
    queryFn: () => bookingsAPI.getAll({ limit: 10 }),
    enabled: !!userId,
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => eventsAPI.delete(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      setAnchorEl(null);
      setSelectedEvent(null);
    },
    onError: (error) => {
      console.error('Failed to delete event:', error);
    },
  });

  // Event handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, eventData: Event) => {
    setAnchorEl(event.currentTarget);
    setSelectedEvent(eventData);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEvent(null);
  };

  const handleEditEvent = () => {
    if (selectedEvent) {
      navigate(`/events/${selectedEvent._id}/edit`);
    }
    handleMenuClose();
  };

  const handleDeleteEvent = () => {
    if (selectedEvent && window.confirm('Are you sure you want to delete this event?')) {
      deleteEventMutation.mutate(selectedEvent._id);
    }
  };

  const handleViewEvent = () => {
    if (selectedEvent) {
      navigate(`/events/${selectedEvent._id}`);
    }
    handleMenuClose();
  };

  // Test email function
  const testEmail = async () => {
    if (!user?.email) {
      setEmailTestMessage('No email address found for user');
      return;
    }

    setEmailTestLoading(true);
    setEmailTestMessage(null);

    try {
      const response = await fetch('/api/bookings/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email: user.email })
      });

      if (response.ok) {
        setEmailTestMessage(`✅ Test email sent successfully! Check ${user.email}`);
      } else {
        const errorData = await response.json();
        setEmailTestMessage(`❌ Failed to send test email: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      setEmailTestMessage(`❌ Failed to send test email: ${error.message}`);
    } finally {
      setEmailTestLoading(false);
    }
  };

  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getEventImage = (event: Event) => {
    const primaryImage = event.images?.find(img => img.isPrimary);
    return primaryImage?.url || event.images?.[0]?.url || '/placeholder-event.jpg';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  // Get user's events (already filtered by the API)
  const getMyEvents = (): Event[] => {
    if (!eventsData?.data?.events || !userId) {
      return [];
    }
    
    return eventsData.data.events;
  };

  // Calculate statistics
  const getTotalRevenue = (): number => {
    const myEvents = getMyEvents();
    if (myEvents.length === 0) return 0;

    return myEvents.reduce((total, event) => {
      const tiers = event.pricing?.tiers || [];
      
      // Calculate revenue from pricing tiers
      const tierRevenue = tiers.reduce((tierTotal, tier) => {
        const price = Number(tier.price || 0);
        const sold = Number(tier.sold || 0);
        return tierTotal + (price * sold);
      }, 0);
      
      // Also check if there's a general capacity sold count
      const capacitySold = Number(event.capacity?.sold || 0);
      const generalPrice = event.pricing?.isFree ? 0 : (tiers[0]?.price || 0);
      
      // Use the higher of tier revenue or general capacity * price
      const eventRevenue = Math.max(tierRevenue, capacitySold * generalPrice);
      
      return total + eventRevenue;
    }, 0);
  };

  const getTotalTicketsSold = (): number => {
    const myEvents = getMyEvents();
    
    return myEvents.reduce((total, event) => {
      // Check both capacity.sold and sum of tier.sold
      const capacitySold = Number(event.capacity?.sold || 0);
      const tierSold = (event.pricing?.tiers || []).reduce((sum, tier) => 
        sum + Number(tier.sold || 0), 0
      );
      
      // Use the higher of the two values
      return total + Math.max(capacitySold, tierSold);
    }, 0);
  };

  const getUpcomingEvents = (): number => {
    const myEvents = getMyEvents();
    const now = new Date();
    return myEvents.filter(event => {
      const eventDate = new Date(event.dateTime?.start || '');
      return eventDate > now && event.status === 'published';
    }).length;
  };

  const getRecentBookings = () => {
    if (!bookingsData?.data?.bookings) return [];
    
    // Filter bookings for user's events
    const myEventIds = getMyEvents().map(event => event._id);
    return bookingsData.data.bookings.filter((booking: any) => 
      myEventIds.includes(booking.event?._id)
    ).slice(0, 5);
  };

  const myEvents = getMyEvents();
  const recentBookings = getRecentBookings();

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
          <Typography color="text.primary">Dashboard</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Dashboard
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Welcome back, {user?.name || 'Organizer'}!
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Email />}
              onClick={testEmail}
              disabled={emailTestLoading}
            >
              {emailTestLoading ? 'Testing...' : 'Test Email'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/events/create')}
              size="large"
            >
              Create Event
            </Button>
          </Box>
        </Box>

        {/* Email Test Message */}
        {emailTestMessage && (
          <Alert 
            severity={emailTestMessage.includes('✅') ? 'success' : 'error'} 
            sx={{ mb: 3 }}
            onClose={() => setEmailTestMessage(null)}
          >
            {emailTestMessage}
          </Alert>
        )}

        {/* Error Messages */}
        {eventsError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load events. Please try again.
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <EventIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {myEvents.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Events
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
                  <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                    <CalendarToday />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {getUpcomingEvents()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upcoming Events
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
                    <People />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {getTotalTicketsSold()}
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
                    <AttachMoney />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      ${getTotalRevenue().toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Revenue
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Wallet Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <WalletSummary />
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccountBalanceWallet sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Quick Actions
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/events/create')}
                    fullWidth
                  >
                    Create New Event
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<BookOnline />}
                    onClick={() => navigate('/bookings')}
                    fullWidth
                  >
                    View All Bookings
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AccountBalanceWallet />}
                    onClick={() => navigate('/wallet')}
                    fullWidth
                  >
                    Manage Wallet
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={4}>
          {/* My Events */}
          <Grid item xs={12} lg={8}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  My Events
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/events')}
                >
                  View All
                </Button>
              </Box>

              {eventsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : myEvents.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No events yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Create your first event to get started
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate('/events/create')}
                  >
                    Create Event
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {myEvents.slice(0, 6).map((event: Event) => (
                    <Grid item xs={12} sm={6} key={event._id}>
                      <Card
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': { transform: 'translateY(-4px)' },
                        }}
                        onClick={() => navigate(`/events/${event._id}`)}
                      >
                        <Box sx={{ position: 'relative' }}>
                          <img
                            src={getEventImage(event)}
                            alt={event.title}
                            style={{
                              width: '100%',
                              height: '200px',
                              objectFit: 'cover',
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-event.jpg';
                            }}
                          />
                          <Chip
                            label={event.status}
                            color={getStatusColor(event.status) as any}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                            }}
                          />
                        </Box>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="h3" gutterBottom>
                            {event.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {event.shortDescription || event.description?.substring(0, 100)}...
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CalendarToday fontSize="small" color="action" />
                            <Typography variant="body2">
                              {formatDate(event.dateTime?.start || '')} at {formatTime(event.dateTime?.start || '')}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <People fontSize="small" color="action" />
                            <Typography variant="body2">
                              {event.capacity?.sold || 0} tickets sold
                            </Typography>
                          </Box>
                          {event.capacity?.total && (
                            <Box sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="caption">
                                  Capacity: {event.capacity.sold || 0}/{event.capacity.total}
                                </Typography>
                                <Typography variant="caption">
                                  {Math.round(((event.capacity.sold || 0) / event.capacity.total) * 100)}%
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={((event.capacity.sold || 0) / event.capacity.total) * 100}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          )}
                        </CardContent>
                        <Box sx={{ p: 2, pt: 0 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/events/${event._id}`);
                              }}
                            >
                              View
                            </Button>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMenuOpen(e, event);
                              }}
                            >
                              <MoreVert />
                            </IconButton>
                          </Box>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>

          {/* Recent Bookings */}
          <Grid item xs={12} lg={4}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  Recent Bookings
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/bookings')}
                >
                  View All
                </Button>
              </Box>

              {bookingsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : recentBookings.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <BookOnline sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    No bookings yet
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Event</TableCell>
                        <TableCell>Attendee</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentBookings.map((booking: any) => (
                        <TableRow key={booking._id}>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {booking.event?.title || 'Unknown Event'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(booking.event?.dateTime?.start || '')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {booking.attendeeInfo?.name || 'Unknown'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={booking.status}
                              size="small"
                              color={booking.status === 'confirmed' ? 'success' : 'warning'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Event Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleViewEvent}>
            <Visibility sx={{ mr: 1 }} />
            View Event
          </MenuItem>
          <MenuItem onClick={handleEditEvent}>
            <Edit sx={{ mr: 1 }} />
            Edit Event
          </MenuItem>
          <MenuItem 
            onClick={handleDeleteEvent} 
            sx={{ color: 'error.main' }}
            disabled={deleteEventMutation.isPending}
          >
            <Delete sx={{ mr: 1 }} />
            {deleteEventMutation.isPending ? 'Deleting...' : 'Delete Event'}
          </MenuItem>
        </Menu>
      </Container>
    </Box>
  );
};

export default Dashboard;