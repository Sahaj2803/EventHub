// @ts-nocheck
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Divider,
  Avatar,
  IconButton,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  CalendarToday,
  LocationOn,
  People,
  Share,
  BookmarkBorder,
  Bookmark,
  NavigateNext,
  Person,
  Phone,
  Email,
  AccessTime,
  Language,
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  ShoppingCart,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsAPI, bookingsAPI, walletAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { CreateBookingData } from '../types/booking';
import { Snackbar, Alert } from '@mui/material';

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { wallet, loading: walletLoading, error: walletError, refreshWallet } = useWallet();
  const queryClient = useQueryClient();

  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<{ [key: string]: number }>({});
  const [attendeeInfo, setAttendeeInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    specialRequirements: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // Fetch event details
  const { data: eventData, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsAPI.getById(id!),
    enabled: !!id,
  });

  // Debug logging
  console.log("🔍 Wallet Debug Info:");
  console.log("- user:", user);
  console.log("- user._id:", user?._id);
  console.log("- isAuthenticated:", isAuthenticated);
  console.log("- wallet:", wallet);
  console.log("- walletError:", walletError);
  console.log("- walletLoading:", walletLoading);

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: (data: CreateBookingData) => bookingsAPI.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      refreshWallet(); // Refresh wallet using WalletContext
      setBookingDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Ticket booked successfully! Check your email for the ticket.',
        severity: 'success',
      });
      navigate('/bookings');
    },
    onError: (error: any) => {
      console.error('Booking error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to book ticket. Please try again.';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    },
  });

  const event = eventData?.data.event;

  const handleBookEvent = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }
    setBookingDialogOpen(true);
  };

  const handleTicketQuantityChange = (tierName: string, quantity: number) => {
    const tier = event.pricing.tiers.find(t => t.name === tierName);
    if (!tier) return;
  
    // Calculate total price after this change
    const totalAfterChange =
      Object.entries(selectedTickets).reduce((total, [name, qty]) => {
        const t = event.pricing.tiers.find(ti => ti.name === name);
        return total + (t ? t.price * qty : 0);
      }, 0) -
      (selectedTickets[tierName] || 0) * tier.price +
      quantity * tier.price;
  
    // Check if wallet balance is sufficient
    const walletBalance = wallet?.balance || 0;
    
    if (walletBalance < totalAfterChange) {
      setSnackbar({
        open: true,
        message: `⚠️ Insufficient wallet balance! You have ₹${walletBalance.toFixed(2)}, but need ₹${totalAfterChange.toFixed(2)}`,
        severity: 'warning',
      });
      return;
    }
  
    setSelectedTickets(prev => ({
      ...prev,
      [tierName]: quantity,
    }));
  };
  

  const isWalletBalanceSufficient = () => {
    if (!wallet) return false;
    return wallet.balance >= getTotalPrice();
  };

  const handleBookingSubmit = () => {
    if (!event || !id) return;

    const tickets = Object.entries(selectedTickets)
      .filter(([_, quantity]) => quantity > 0)
      .map(([tier, quantity]) => ({ tier, quantity }));

    if (tickets.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one ticket',
        severity: 'warning',
      });
      return;
    }

    const totalPrice = getTotalPrice();

    // Check wallet balance
    if (!wallet) {
      setSnackbar({
        open: true,
        message: 'No wallet found. Please set up your wallet to proceed.',
        severity: 'error',
      });
      return;
    }
    const walletBalance = wallet.balance;
    if (walletBalance < totalPrice) {
      setSnackbar({
        open: true,
        message: `Insufficient wallet balance! You have ₹${walletBalance.toFixed(2)}, but need ₹${totalPrice.toFixed(2)}. Please recharge your wallet.`,
        severity: 'error',
      });
      return;
    }

    // Validate attendee info
    if (!attendeeInfo.name || !attendeeInfo.email) {
      setSnackbar({
        open: true,
        message: 'Please fill in all attendee information',
        severity: 'warning',
      });
      return;
    }

    const bookingData: CreateBookingData = {
      eventId: id,
      tickets,
      attendeeInfo,
      paymentMethod: 'wallet',
    };

    createBookingMutation.mutate(bookingData);
  };

  const getTotalPrice = () => {
    if (!event) return 0;
    
    return Object.entries(selectedTickets).reduce((total, [tierName, quantity]) => {
      const tier = event.pricing.tiers.find(t => t.name === tierName);
      return total + (tier ? tier.price * quantity : 0);
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((total, quantity) => total + quantity, 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getEventImage = () => {
    if (!event) return '/placeholder-event.jpg';
    const primaryImage = event.images.find(img => img.isPrimary);
    return primaryImage?.url || event.images[0]?.url || '/placeholder-event.jpg';
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !event) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Event not found or failed to load.
        </Alert>
      </Container>
    );
  }

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
            href="/events"
            onClick={(e) => {
              e.preventDefault();
              navigate('/events');
            }}
          >
            Events
          </Link>
          <Typography color="text.primary">{event.title}</Typography>
        </Breadcrumbs>

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid xs={12} md={8}>
            {/* Event Image */}
            <Card sx={{ mb: 3 }}>
              <CardMedia
                component="img"
                height="400"
                image={getEventImage()}
                alt={event.title}
              />
            </Card>

            {/* Event Details */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Chip
                    label={event.category.name}
                    sx={{
                      bgcolor: event.category.color,
                      color: 'white',
                      mr: 2,
                    }}
                  />
                  {event.featured && (
                    <Chip
                      label="Featured"
                      color="warning"
                      size="small"
                    />
                  )}
                </Box>

                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {event.title}
                </Typography>

                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                  {event.description}
                </Typography>

                {/* Event Info */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Date & Time
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(event.dateTime.start)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatTime(event.dateTime.start)} - {formatTime(event.dateTime.end)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Venue
                        </Typography>
                        <Typography variant="body1">
                          {event.venue.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {event.venue.address.street && `${event.venue.address.street}, `}
                          {event.venue.address.city}, {event.venue.address.country}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                {/* Organizer Info */}
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Organizer
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={event?.organizer?.avatar}
                    sx={{ mr: 2, width: 56, height: 56 }}
                  >
                    {event?.organizer?.name
                      ? event.organizer.name.charAt(0).toUpperCase()
                      : "?"}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {event?.organizer?.name || "Unknown Organizer"}
                    </Typography>
                    {event?.organizer?.email && (
                      <Typography variant="body2" color="text.secondary">
                        {event.organizer.email}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Social Links */}
                {event.socialLinks && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Connect
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {event.socialLinks.website && (
                        <IconButton 
                          color="primary"
                          onClick={() => window.open(event.socialLinks.website, '_blank')}
                        >
                          <Language />
                        </IconButton>
                      )}
                      {event.socialLinks.facebook && (
                        <IconButton 
                          color="primary"
                          onClick={() => window.open(event.socialLinks.facebook, '_blank')}
                        >
                          <Facebook />
                        </IconButton>
                      )}
                      {event.socialLinks.twitter && (
                        <IconButton 
                          color="primary"
                          onClick={() => window.open(event.socialLinks.twitter, '_blank')}
                        >
                          <Twitter />
                        </IconButton>
                      )}
                      {event.socialLinks.instagram && (
                        <IconButton 
                          color="primary"
                          onClick={() => window.open(event.socialLinks.instagram, '_blank')}
                        >
                          <Instagram />
                        </IconButton>
                      )}
                      {event.socialLinks.linkedin && (
                        <IconButton 
                          color="primary"
                          onClick={() => window.open(event.socialLinks.linkedin, '_blank')}
                        >
                          <LinkedIn />
                        </IconButton>
                      )}
                    </Box>
                  </>
                )}

                {/* Requirements */}
                {event.requirements && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Event Requirements
                    </Typography>
                    <List dense>
                      {event.requirements.ageRestriction && (
                        <ListItem>
                          <ListItemIcon>
                            <People />
                          </ListItemIcon>
                          <ListItemText
                            primary="Age Restriction"
                            secondary={`Must be ${event.requirements.ageRestriction}+ years old`}
                          />
                        </ListItem>
                      )}
                      {event.requirements.dressCode && (
                        <ListItem>
                          <ListItemIcon>
                            <Person />
                          </ListItemIcon>
                          <ListItemText
                            primary="Dress Code"
                            secondary={event.requirements.dressCode}
                          />
                        </ListItem>
                      )}
                      {event.requirements.itemsToBring && event.requirements.itemsToBring.length > 0 && (
                        <ListItem>
                          <ListItemIcon>
                            <ShoppingCart />
                          </ListItemIcon>
                          <ListItemText
                            primary="Items to Bring"
                            secondary={event.requirements.itemsToBring.join(', ')}
                          />
                        </ListItem>
                      )}
                    </List>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid xs={12} md={4}>
            {/* Booking Card */}
            <Card sx={{ position: "sticky", top: 20 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
                  {event.pricing.isFree ? "Free Event" : "Get Tickets"}
                </Typography>

                {!event.pricing.isFree && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Payment Method
                    </Typography>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "primary.50",
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "primary.200",
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: "bold", color: "primary.main" }}
                      >
                        💳 Wallet Balance
                      </Typography>
                      
                      {walletLoading ? (
                        <Typography variant="body2" color="text.secondary">
                          Loading wallet...
                        </Typography>
                      ) : walletError ? (
                        <Typography variant="body2" color="error">
                          Error loading wallet: {walletError.message}
                        </Typography>
                      ) : !user?._id ? (
                        <Typography variant="body2" color="error">
                          User not authenticated. Please log in again.
                        </Typography>
                      ) : wallet ? (
                        <Typography variant="body2" color="text.secondary">
                          Available Balance: ₹{wallet.balance.toFixed(2)}
                        </Typography>
                      ) : (
                        <Box>
                          <Typography variant="body2" color="error">
                            Wallet not found. Click below to initialize your wallet.
                          </Typography>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            sx={{ mt: 1, mr: 1 }}
                            disabled={!user?._id}
                            onClick={async () => {
                              try {
                                await refreshWallet();
                                setSnackbar({
                                  open: true,
                                  message: 'Wallet refreshed successfully!',
                                  severity: 'success',
                                });
                              } catch (error) {
                                console.error("❌ Failed to refresh wallet:", error);
                                setSnackbar({
                                  open: true,
                                  message: 'Failed to refresh wallet. Please try again.',
                                  severity: 'error',
                                });
                              }
                            }}
                          >
                            Refresh Wallet
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ mt: 1 }}
                            disabled={!user?._id}
                            onClick={() => {
                              refreshWallet();
                            }}
                          >
                            Retry Load
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Ticket Tiers */}
                {event.pricing.tiers.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    {event.pricing.tiers.map((tier) => (
                      <Box key={tier.name} sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1,
                          }}
                        >
                          <Box>

                                                            <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                                            {tier.name}
                                                          </Typography>
                                                          <Typography variant="h6" color="primary">
                                                            ₹{tier.price}
                                                          </Typography>
                                                        </Box>
                                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                          <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() =>
                                                              handleTicketQuantityChange(
                                                                tier.name,
                                                                Math.max(0, (selectedTickets[tier.name] || 0) - 1)
                                                              )
                                                            }
                                                            disabled={
                                                              !selectedTickets[tier.name] ||
                                                              selectedTickets[tier.name] <= 0
                                                            }
                                                          >
                                                            -
                                                          </Button>
                              
                                                          <Typography
                                                            variant="body1"
                                                            sx={{ minWidth: 20, textAlign: "center" }}
                                                          >
                                                            {selectedTickets[tier.name] || 0}
                                                          </Typography>
                              
                                                          {/* ✅ Fixed “+” button logic */}
                                                          <Button
                                                            size="small"
                                                            variant="outlined"
                                                            onClick={() =>
                                                              handleTicketQuantityChange(
                                                                tier.name,
                                                                (selectedTickets[tier.name] || 0) + 1
                                                              )
                                                            }
                                                            disabled={
                                                              ((tier.quantity ?? Infinity) !== Infinity &&
                                                                tier.sold + (selectedTickets[tier.name] || 0) >=
                                                                  (tier.quantity as number)) ||
                                                              !wallet  // FIXED: Check if wallet exists
                                                            }
                                                          >
                                                            +
                                                          </Button>
                                                        </Box>
                                                      </Box>
                              
                                                      {tier.description && (
                                                        <Typography variant="body2" color="text.secondary">
                                                          {tier.description}
                                                        </Typography>
                                                      )}
                                                      {typeof tier.quantity === "number" && (
                                                        <Typography variant="caption" color="text.secondary">
                                                          {tier.quantity - tier.sold} tickets remaining
                                                        </Typography>
                                                      )}
                                                    </Box>
                                                  ))}
                                                </Box>
                                              )}
                              
                                              {/* Total Section */}
                                              {getTotalTickets() > 0 && (
                                                <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                                                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                                                    <Typography variant="body2">
                                                      {getTotalTickets()} ticket{getTotalTickets() > 1 ? "s" : ""}
                                                    </Typography>
                                                    <Typography variant="h6" color="primary">
                                                      ₹{getTotalPrice()}
                                                    </Typography>
                                                  </Box>
                              
                                                  {wallet && (
                                                    <Box
                                                      sx={{
                                                        mt: 1,
                                                        pt: 1,
                                                        borderTop: "1px solid",
                                                        borderColor: "divider",
                                                      }}
                                                    >
                                                      <Typography variant="caption" color="text.secondary">
                                                        Wallet Balance: ₹{wallet.balance.toFixed(2)}
                                                      </Typography>
                              
                                                      {wallet.balance < getTotalPrice() && (
                                                        <Typography
                                                          variant="caption"
                                                          color="error"
                                                          sx={{ display: "block", mt: 0.5 }}
                                                        >
                                                          ⚠️ Insufficient balance for this selection
                                                        </Typography>
                                                      )}
                                                    </Box>
                                                  )}
                                                </Box>
                                              )}
                              
                                              {/* Book Button */}
                                              <Button
                                                variant="contained"
                                                fullWidth
                                                size="large"
                                                startIcon={<ShoppingCart />}
                                                onClick={handleBookEvent}
                                                disabled={getTotalTickets() === 0 || !wallet}  // FIXED: Disable if no wallet
                                                sx={{ mb: 2 }}
                                              >
                                                {event.pricing.isFree ? "Register for Free" : "Buy Tickets"}
                                              </Button>
                              
                                              <Box sx={{ display: "flex", gap: 1 }}>
                                                <Button variant="outlined" fullWidth startIcon={<Share />}>
                                                  Share
                                                </Button>
                                                <Button variant="outlined" startIcon={<BookmarkBorder />}>
                                                  Save
                                                </Button>
                                              </Box>
                                            </CardContent>
                                          </Card>
                                        </Grid>
                                      </Grid>
                              
                                      {/* Booking Dialog */}
                                      <Dialog
                                        open={bookingDialogOpen}
                                        onClose={() => setBookingDialogOpen(false)}
                                        maxWidth="sm"
                                        fullWidth
                                      >
                                        <DialogTitle>Complete Your Booking</DialogTitle>
                              
                                        <DialogContent>
                                          <Box sx={{ pt: 2 }}>
                                            <Typography variant="h6" gutterBottom>
                                              {event.title}
                                            </Typography>
                              
                                            {/* Selected Tickets Summary */}
                                            <Box sx={{ mb: 3 }}>
                                              <Typography variant="subtitle2" gutterBottom>
                                                Selected Tickets
                                              </Typography>
                                              {Object.entries(selectedTickets)
                                                .filter(([_, quantity]) => quantity > 0)
                                                .map(([tierName, quantity]) => {
                                                  const tier = event.pricing.tiers.find((t) => t.name === tierName);
                                                  return (
                                                    <Box
                                                      key={tierName}
                                                      sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
                                                    >
                                                      <Typography variant="body2">
                                                        {tierName} x {quantity}
                                                      </Typography>
                                                      <Typography variant="body2">
                                                        ₹{tier ? tier.price * quantity : 0}
                                                      </Typography>
                                                    </Box>
                                                  );
                                                })}
                                              <Divider sx={{ my: 1 }} />
                                              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                                  Total
                                                </Typography>
                                                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                                  ₹{getTotalPrice()}
                                                </Typography>
                                              </Box>
                                            </Box>
                              
                                            {/* Attendee Info */}
                                            <Typography variant="subtitle2" gutterBottom>
                                              Attendee Information
                                            </Typography>
                                            <Grid container spacing={2}>
                                              <Grid xs={12} sm={6}>
                                                <TextField
                                                  fullWidth
                                                  label="Full Name"
                                                  value={attendeeInfo.name}
                                                  onChange={(e) =>
                                                    setAttendeeInfo((prev) => ({ ...prev, name: e.target.value }))
                                                  }
                                                  required
                                                />
                                              </Grid>
                                              <Grid xs={12} sm={6}>
                                                <TextField
                                                  fullWidth
                                                  label="Email"
                                                  type="email"
                                                  value={attendeeInfo.email}
                                                  onChange={(e) =>
                                                    setAttendeeInfo((prev) => ({ ...prev, email: e.target.value }))
                                                  }
                                                  required
                                                />
                                              </Grid>
                                              <Grid xs={12} sm={6}>
                                                <TextField
                                                  fullWidth
                                                  label="Phone"
                                                  value={attendeeInfo.phone}
                                                  onChange={(e) =>
                                                    setAttendeeInfo((prev) => ({ ...prev, phone: e.target.value }))
                                                  }
                                                />
                                              </Grid>
                                              <Grid xs={12}>
                                                <TextField
                                                  fullWidth
                                                  label="Special Requirements"
                                                  multiline
                                                  rows={3}
                                                  value={attendeeInfo.specialRequirements}
                                                  onChange={(e) =>
                                                    setAttendeeInfo((prev) => ({
                                                      ...prev,
                                                      specialRequirements: e.target.value,
                                                    }))
                                                  }
                                                />
                                              </Grid>
                                            </Grid>
                              
                                            {/* Payment Section */}
                                            <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                                              Payment Method
                                            </Typography>
                                            <Box
                                              sx={{
                                                p: 2,
                                                bgcolor: "primary.50",
                                                borderRadius: 1,
                                                border: "1px solid",
                                                borderColor: "primary.200",
                                                mb: 2,
                                              }}
                                            >
                                              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                                <Typography
                                                  variant="body1"
                                                  sx={{ fontWeight: "bold", color: "primary.main" }}
                                                >
                                                  💳 Wallet Balance Payment
                                                </Typography>
                                              </Box>
                                              <Typography variant="body2" color="text.secondary">
                                                Payment will be deducted from your wallet balance
                                              </Typography>
                                            </Box>
                              
                                            {/* Wallet Display */}
                                            {walletLoading ? (
                                              <Box sx={{ mt: 2, p: 2, bgcolor: "primary.50", borderRadius: 1 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                  Loading wallet information...
                                                </Typography>
                                              </Box>
                                            ) : walletError ? (
                                              <Alert severity="error" sx={{ mt: 2 }}>
                                                Error loading wallet: {walletError.message}
                                              </Alert>
                                            ) : wallet ? (
                                              <Box sx={{ mt: 2, p: 2, bgcolor: "primary.50", borderRadius: 1 }}>
                                                <Typography variant="body2" color="primary" gutterBottom>
                                                  <strong>Wallet Balance:</strong> ₹{wallet.balance.toFixed(2)}
                                                </Typography>
                              
                                                <Typography variant="body2" color="text.secondary">
                                                  <strong>Total Cost:</strong> ₹{getTotalPrice().toFixed(2)}
                                                </Typography>
                              
                                                {wallet.balance < getTotalPrice() ? (
                                                  <Box>
                                                    <Alert severity="error" sx={{ mt: 1 }}>
                                                      <strong>Insufficient Balance!</strong>
                                                      <br />
                                                      You have ₹{wallet.balance.toFixed(2)} but need ₹{getTotalPrice().toFixed(2)}.
                                                      <br />
                                                      Please recharge your wallet to complete this booking.
                                                    </Alert>
                                                    <Button
                                                      variant="outlined"
                                                      color="primary"
                                                      size="small"
                                                      sx={{ mt: 1 }}
                                                      onClick={() => navigate("/wallet")}
                                                    >
                                                      Recharge Wallet
                                                    </Button>
                                                  </Box>
                                                ) : (
                                                  <Alert severity="success" sx={{ mt: 1 }}>
                                                    <strong>Sufficient Balance!</strong>
                                                    <br />
                                                    You can complete this booking with your wallet.
                                                  </Alert>
                                                )}
                                              </Box>
                                            ) : (
                                              <Alert severity="error" sx={{ mt: 2 }}>
                                                Wallet not found. Please refresh the page or contact support.
                                              </Alert>
                                            )}
                                          </Box>
                                        </DialogContent>
                              
                                        {/* Booking Actions */}
                                        <DialogActions>
                                          <Button onClick={() => setBookingDialogOpen(false)}>Cancel</Button>
                                          <Button
                                            variant="contained"
                                            onClick={handleBookingSubmit}
                                            disabled={
                                              createBookingMutation.isPending ||
                                              !attendeeInfo.name ||
                                              !attendeeInfo.email ||
                                              !isWalletBalanceSufficient()
                                            }
                                          >
                                            {createBookingMutation.isPending ? (
                                              <CircularProgress size={20} />
                                            ) : (
                                              "Complete Booking"
                                            )}
                                          </Button>
                                        </DialogActions>
                                      </Dialog>
                              
                                      {/* Snackbar */}
                                      <Snackbar
                                        open={snackbar.open}
                                        autoHideDuration={6000}
                                        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                                      >
                                        <Alert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity}>
                                          {snackbar.message}
                                        </Alert>
                                      </Snackbar>
                                    </Container>
                                  </Box>
                                );
                              };
                              
                              export default EventDetail;