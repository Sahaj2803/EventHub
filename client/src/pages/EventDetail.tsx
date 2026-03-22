// @ts-nocheck
import React, { useState } from 'react';
import {
  Alert, Avatar, Box, Breadcrumbs, Button, CardMedia, Chip, CircularProgress, Container,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, Link, List, ListItem,
  ListItemIcon, ListItemText, MenuItem, Paper, Select, Snackbar, Stack, TextField, Typography
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { alpha, useTheme } from '@mui/material/styles';
import {
  CalendarToday, Facebook, Instagram, Language, LinkedIn, LocationOn, NavigateNext,
  People, Person, Phone, ShoppingCart, AccessTime, Twitter, VerifiedUser
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingsAPI, eventsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { CreateBookingData } from '../types/booking';
import EventCardActions from '../components/common/EventCardActions';

const EventDetail: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { wallet, loading: walletLoading, error: walletError, refreshWallet } = useWallet();
  const queryClient = useQueryClient();
  const isDark = theme.palette.mode === 'dark';

  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<{ [key: string]: number }>({});
  const [attendeeInfo, setAttendeeInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    specialRequirements: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const { data: eventData, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsAPI.getById(id!),
    enabled: !!id,
  });

  const event = eventData?.data?.event;

  const createBookingMutation = useMutation({
    mutationFn: (data: CreateBookingData) => bookingsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      refreshWallet();
      setBookingDialogOpen(false);
      setSnackbar({ open: true, message: 'Ticket booked successfully! Check your email for the ticket.', severity: 'success' });
      navigate('/bookings');
    },
    onError: (err: any) => {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to book ticket. Please try again.',
        severity: 'error',
      });
    },
  });

  const shellSx = {
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
    py: { xs: 4, md: 6 },
    background: isDark
      ? 'linear-gradient(135deg, #020617 0%, #111827 40%, #312e81 100%)'
      : 'linear-gradient(135deg, #eef6ff 0%, #eef2ff 42%, #fae8ff 100%)',
  };

  const panelSx = {
    borderRadius: { xs: 4, md: 5 },
    border: `1px solid ${isDark ? alpha('#e2e8f0', 0.08) : alpha('#0f172a', 0.08)}`,
    background: isDark
      ? `linear-gradient(180deg, ${alpha('#0f172a', 0.84)} 0%, ${alpha('#111827', 0.78)} 100%)`
      : `linear-gradient(180deg, ${alpha('#ffffff', 0.9)} 0%, ${alpha('#f8fbff', 0.96)} 100%)`,
    backdropFilter: 'blur(18px)',
    boxShadow: isDark ? '0 24px 60px rgba(2, 6, 23, 0.44)' : '0 24px 60px rgba(15, 23, 42, 0.12)',
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 3,
      backgroundColor: isDark ? alpha('#020617', 0.6) : alpha('#ffffff', 0.94),
      color: isDark ? '#f8fafc' : '#0f172a',
      '& fieldset': { borderColor: isDark ? alpha('#e2e8f0', 0.12) : alpha('#0f172a', 0.12) },
      '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.5) },
      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
    },
    '& .MuiInputBase-input': { color: isDark ? '#f8fafc' : '#0f172a' },
    '& .MuiInputLabel-root': { color: isDark ? alpha('#e2e8f0', 0.78) : alpha('#0f172a', 0.62) },
    '& .MuiInputAdornment-root, & .MuiSvgIcon-root': { color: isDark ? alpha('#e2e8f0', 0.74) : alpha('#0f172a', 0.58) },
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const getEventImage = () => {
    const primary = event?.images?.find((img) => img.isPrimary);
    return primary?.url || event?.images?.[0]?.url || '/placeholder-event.jpg';
  };

  const getTotalPrice = () => !event ? 0 : Object.entries(selectedTickets).reduce((total, [tierName, quantity]) => {
    const tier = event.pricing.tiers.find((t) => t.name === tierName);
    return total + (tier ? tier.price * quantity : 0);
  }, 0);
  const getTotalTickets = () => Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  const isWalletBalanceSufficient = () => event?.pricing?.isFree || (!!wallet && wallet.balance >= getTotalPrice());

  const handleBookEvent = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/events/${id}` } } });
      return;
    }
    setBookingDialogOpen(true);
  };

  const handleTicketQuantityChange = (tierName: string, quantity: number) => {
    const tier = event?.pricing?.tiers?.find((t) => t.name === tierName);
    if (!tier) return;
    const totalAfterChange =
      Object.entries(selectedTickets).reduce((total, [name, qty]) => {
        const found = event.pricing.tiers.find((candidate) => candidate.name === name);
        return total + (found ? found.price * qty : 0);
      }, 0) -
      (selectedTickets[tierName] || 0) * tier.price +
      quantity * tier.price;

    if ((wallet?.balance || 0) < totalAfterChange) {
      setSnackbar({
        open: true,
        message: `Insufficient wallet balance. You have Rs ${(wallet?.balance || 0).toFixed(2)} but need Rs ${totalAfterChange.toFixed(2)}.`,
        severity: 'warning',
      });
      return;
    }
    setSelectedTickets((prev) => ({ ...prev, [tierName]: quantity }));
  };

  const handleBookingSubmit = () => {
    if (!event || !id) return;
    const selected = Object.entries(selectedTickets).filter(([, q]) => q > 0).map(([tier, quantity]) => ({ tier, quantity }));
    const tickets = selected.length
      ? selected
      : event.pricing.isFree && event.pricing.tiers?.[0]
        ? [{ tier: event.pricing.tiers[0].name, quantity: 1 }]
        : [];

    if (!tickets.length) {
      setSnackbar({ open: true, message: 'Please select at least one ticket.', severity: 'warning' });
      return;
    }
    if (!event.pricing.isFree && !wallet) {
      setSnackbar({ open: true, message: 'Wallet not found. Please set up your wallet to proceed.', severity: 'error' });
      return;
    }
    if (!event.pricing.isFree && !isWalletBalanceSufficient()) {
      setSnackbar({ open: true, message: 'Insufficient wallet balance. Please recharge your wallet.', severity: 'error' });
      return;
    }
    if (!attendeeInfo.name || !attendeeInfo.email) {
      setSnackbar({ open: true, message: 'Please fill in attendee information.', severity: 'warning' });
      return;
    }

    createBookingMutation.mutate({
      eventId: id,
      tickets,
      attendeeInfo,
      paymentMethod: 'wallet',
    });
  };

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }

  if (error || !event) {
    return <Container maxWidth="lg" sx={{ py: 4 }}><Alert severity="error">Event not found or failed to load.</Alert></Container>;
  }

  const socialLinks = [
    { href: event.socialLinks?.website, icon: <Language /> },
    { href: event.socialLinks?.facebook, icon: <Facebook /> },
    { href: event.socialLinks?.twitter, icon: <Twitter /> },
    { href: event.socialLinks?.instagram, icon: <Instagram /> },
    { href: event.socialLinks?.linkedin, icon: <LinkedIn /> },
  ].filter((item) => item.href);

  return (
    <Box sx={shellSx}>
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: isDark
        ? 'radial-gradient(circle at top left, rgba(56, 189, 248, 0.14), transparent 24%), radial-gradient(circle at 82% 14%, rgba(236, 72, 153, 0.16), transparent 22%)'
        : 'radial-gradient(circle at top left, rgba(14, 165, 233, 0.16), transparent 24%), radial-gradient(circle at 82% 14%, rgba(236, 72, 153, 0.12), transparent 22%)' }} />

      <Container maxWidth="xl" sx={{ position: 'relative' }}>
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3, color: isDark ? alpha('#e2e8f0', 0.72) : '#64748b' }}>
          <Link underline="hover" color="inherit" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</Link>
          <Link underline="hover" color="inherit" href="/events" onClick={(e) => { e.preventDefault(); navigate('/events'); }}>Events</Link>
          <Typography color={isDark ? '#f8fafc' : '#0f172a'}>{event.title}</Typography>
        </Breadcrumbs>

        <Paper elevation={0} sx={{ ...panelSx, overflow: 'hidden', mb: 4 }}>
          <Box sx={{ position: 'relative' }}>
            <CardMedia component="img" height="420" image={getEventImage()} alt={event.title} />
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,23,42,0.08) 0%, rgba(15,23,42,0.82) 100%)' }} />
            <Box sx={{ position: 'absolute', left: { xs: 20, md: 28 }, right: { xs: 20, md: 28 }, bottom: { xs: 20, md: 28 } }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                <Box>
                  <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
                    <Chip label={event.category?.name || 'Uncategorized'} sx={{ bgcolor: event.category?.color || '#0f172a', color: 'white', fontWeight: 700 }} />
                    {event.featured && <Chip label="Featured" sx={{ bgcolor: alpha('#0f172a', 0.75), color: 'white', fontWeight: 700 }} />}
                  </Stack>
                  <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3.5rem' }, lineHeight: 1, fontWeight: 900, color: 'white', mb: 1.2 }}>
                    {event.title}
                  </Typography>
                  <Typography variant="h6" sx={{ maxWidth: 760, color: alpha('#ffffff', 0.82), fontWeight: 500 }}>
                    {event.shortDescription || 'A premium booking experience for an event worth planning around.'}
                  </Typography>
                </Box>
                <Paper elevation={0} sx={{ p: 1, borderRadius: 999, backgroundColor: alpha('#ffffff', 0.14), backdropFilter: 'blur(10px)' }}>
                  <EventCardActions eventId={event._id} title={event.title} image={getEventImage()} categoryName={event.category?.name} />
                </Paper>
              </Stack>
            </Box>
          </Box>
        </Paper>

        <Grid container spacing={3.5}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Grid container spacing={3}>
              {[
                { icon: <CalendarToday fontSize="small" />, label: 'Date', value: formatDate(event.dateTime.start) },
                { icon: <AccessTime fontSize="small" />, label: 'Time', value: `${formatTime(event.dateTime.start)} - ${formatTime(event.dateTime.end)}` },
                { icon: <LocationOn fontSize="small" />, label: 'Venue', value: `${event.venue.name}, ${event.venue.address.city}` },
                { icon: <People fontSize="small" />, label: 'Capacity', value: `${event.capacity?.available ?? 0} spots left` },
              ].map((item) => (
                <Grid size={{ xs: 12, sm: 6 }} key={item.label}>
                  <Paper elevation={0} sx={{ ...panelSx, p: 2.2, height: '100%' }}>
                    <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: theme.palette.primary.main, backgroundColor: isDark ? alpha('#38bdf8', 0.12) : alpha('#2563eb', 0.08), mb: 1.2 }}>
                      {item.icon}
                    </Box>
                    <Typography variant="caption" sx={{ color: isDark ? alpha('#cbd5e1', 0.72) : '#64748b' }}>{item.label}</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>{item.value}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Paper elevation={0} sx={{ ...panelSx, p: 3, mt: 3 }}>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 1.5, color: isDark ? '#f8fafc' : '#0f172a' }}>About this event</Typography>
              <Typography variant="body1" sx={{ color: isDark ? alpha('#e2e8f0', 0.76) : '#334155', lineHeight: 1.8 }}>
                {event.description}
              </Typography>
            </Paper>

            <Grid container spacing={3} sx={{ mt: 0.2 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ ...panelSx, p: 3, height: '100%' }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, mb: 2, color: isDark ? '#f8fafc' : '#0f172a' }}>Organizer</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={event.organizer?.avatar} sx={{ width: 64, height: 64 }}>
                      {event.organizer?.name?.charAt(0)?.toUpperCase() || '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>{event.organizer?.name || 'Unknown Organizer'}</Typography>
                      {event.organizer?.email && <Typography variant="body2" sx={{ color: isDark ? alpha('#cbd5e1', 0.72) : '#475569' }}>{event.organizer.email}</Typography>}
                      {event.organizer?.phone && <Typography variant="body2" sx={{ color: isDark ? alpha('#cbd5e1', 0.72) : '#475569' }}>{event.organizer.phone}</Typography>}
                    </Box>
                  </Box>
                  {!!socialLinks.length && (
                    <>
                      <Divider sx={{ my: 2.5 }} />
                      <Stack direction="row" spacing={1}>
                        {socialLinks.map((item, index) => (
                          <IconButton key={index} onClick={() => window.open(item.href, '_blank')} sx={{ color: theme.palette.primary.main, backgroundColor: isDark ? alpha('#ffffff', 0.04) : alpha('#0f172a', 0.04) }}>
                            {item.icon}
                          </IconButton>
                        ))}
                      </Stack>
                    </>
                  )}
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={0} sx={{ ...panelSx, p: 3, height: '100%' }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, mb: 2, color: isDark ? '#f8fafc' : '#0f172a' }}>Requirements</Typography>
                  {event.requirements ? (
                    <List dense sx={{ p: 0 }}>
                      {event.requirements.ageRestriction && (
                        <ListItem sx={{ px: 0 }}><ListItemIcon><VerifiedUser /></ListItemIcon><ListItemText primary={`Age ${event.requirements.ageRestriction}+`} secondary="Minimum age requirement" /></ListItem>
                      )}
                      {event.requirements.dressCode && (
                        <ListItem sx={{ px: 0 }}><ListItemIcon><Person /></ListItemIcon><ListItemText primary="Dress code" secondary={event.requirements.dressCode} /></ListItem>
                      )}
                      {!!event.requirements.itemsToBring?.length && (
                        <ListItem sx={{ px: 0 }}><ListItemIcon><ShoppingCart /></ListItemIcon><ListItemText primary="Bring along" secondary={event.requirements.itemsToBring.join(', ')} /></ListItem>
                      )}
                    </List>
                  ) : (
                    <Typography variant="body2" sx={{ color: isDark ? alpha('#cbd5e1', 0.72) : '#475569' }}>No special requirements listed for this event.</Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper elevation={0} sx={{ ...panelSx, p: 3, position: { lg: 'sticky' }, top: 24 }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a', mb: 0.8 }}>
                {event.pricing.isFree ? 'Free Event Access' : 'Premium Booking Panel'}
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? alpha('#cbd5e1', 0.74) : '#64748b', mb: 2.5 }}>
                Choose your ticket tier, review your total, and complete your booking in one place.
              </Typography>

              {!event.pricing.isFree && (
                <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mb: 2.5, backgroundColor: isDark ? alpha('#ffffff', 0.05) : alpha('#ffffff', 0.72) }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: isDark ? '#f8fafc' : '#0f172a' }}>Wallet balance</Typography>
                  {walletLoading ? (
                    <Typography variant="body2" sx={{ color: isDark ? alpha('#cbd5e1', 0.74) : '#64748b' }}>Loading wallet...</Typography>
                  ) : walletError ? (
                    <Typography variant="body2" color="error">Error loading wallet: {walletError.message}</Typography>
                  ) : wallet ? (
                    <Typography variant="h6" sx={{ fontWeight: 900, color: theme.palette.primary.main }}>Rs {wallet.balance.toFixed(2)}</Typography>
                  ) : (
                    <Stack spacing={1}>
                      <Typography variant="body2" color="error">Wallet not found. Refresh or visit wallet page.</Typography>
                      <Button variant="outlined" onClick={() => navigate('/wallet')} sx={{ borderRadius: 999 }}>Open Wallet</Button>
                    </Stack>
                  )}
                </Paper>
              )}

              <Stack spacing={2}>
                {event.pricing.isFree ? (
                  <Paper elevation={0} sx={{ p: 2.2, borderRadius: 3, backgroundColor: isDark ? alpha('#ffffff', 0.05) : alpha('#ffffff', 0.72) }}>
                    <Typography variant="body1" sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 700 }}>
                      This is a free event. Reserve your access in one click.
                    </Typography>
                  </Paper>
                ) : (
                  event.pricing.tiers.map((tier) => (
                    <Paper key={tier.name} elevation={0} sx={{ p: 2.2, borderRadius: 3, backgroundColor: isDark ? alpha('#ffffff', 0.05) : alpha('#ffffff', 0.72) }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>{tier.name}</Typography>
                          {tier.description && <Typography variant="body2" sx={{ color: isDark ? alpha('#cbd5e1', 0.72) : '#64748b' }}>{tier.description}</Typography>}
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: theme.palette.primary.main }}>Rs {tier.price}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: isDark ? alpha('#cbd5e1', 0.72) : '#64748b' }}>
                          {(tier.quantity ?? 0) - (tier.sold ?? 0)} left
                        </Typography>
                        <Select
                          size="small"
                          value={selectedTickets[tier.name] || 0}
                          onChange={(e) => handleTicketQuantityChange(tier.name, Number(e.target.value))}
                          sx={{ minWidth: 92, borderRadius: 2.5 }}
                        >
                          {[0, 1, 2, 3, 4, 5].map((qty) => <MenuItem key={qty} value={qty}>{qty}</MenuItem>)}
                        </Select>
                      </Box>
                    </Paper>
                  ))
                )}
              </Stack>

              {(event.pricing.isFree || getTotalTickets() > 0) && (
                <Paper elevation={0} sx={{ p: 2.2, borderRadius: 3, mt: 2.5, backgroundColor: isDark ? alpha('#ffffff', 0.05) : alpha('#ffffff', 0.72) }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body1" sx={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 700 }}>
                      {event.pricing.isFree ? 'Free registration' : `${getTotalTickets()} ticket${getTotalTickets() > 1 ? 's' : ''}`}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: theme.palette.primary.main }}>
                      {event.pricing.isFree ? 'Rs 0' : `Rs ${getTotalPrice().toFixed(2)}`}
                    </Typography>
                  </Box>
                  {!event.pricing.isFree && wallet && wallet.balance < getTotalPrice() && (
                    <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                      Wallet balance insufficient for current selection.
                    </Typography>
                  )}
                </Paper>
              )}

              <Button
                variant="contained"
                fullWidth
                size="large"
                startIcon={<ShoppingCart />}
                onClick={handleBookEvent}
                disabled={!event.pricing.isFree && (getTotalTickets() === 0 || !wallet)}
                sx={{
                  mt: 2.5,
                  py: 1.55,
                  borderRadius: 999,
                  fontWeight: 800,
                  background: 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 55%, #ec4899 100%)',
                }}
              >
                {event.pricing.isFree ? 'Register for Free' : 'Complete Booking'}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Dialog open={bookingDialogOpen} onClose={() => setBookingDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, ...panelSx } }}>
        <DialogTitle sx={{ fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a' }}>Complete your booking</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: isDark ? '#f8fafc' : '#0f172a' }}>{event.title}</Typography>

            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mb: 2.5, backgroundColor: isDark ? alpha('#ffffff', 0.05) : alpha('#ffffff', 0.72) }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: isDark ? '#f8fafc' : '#0f172a' }}>Selected tickets</Typography>
              {event.pricing.isFree && !Object.values(selectedTickets).some((q) => q > 0) && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                  <Typography variant="body2">Complimentary pass</Typography>
                  <Typography variant="body2">Rs 0.00</Typography>
                </Box>
              )}
              {Object.entries(selectedTickets).filter(([, q]) => q > 0).map(([tierName, quantity]) => {
                const tier = event.pricing.tiers.find((t) => t.name === tierName);
                return (
                  <Box key={tierName} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                    <Typography variant="body2">{tierName} x {quantity}</Typography>
                    <Typography variant="body2">Rs {tier ? (tier.price * quantity).toFixed(2) : '0.00'}</Typography>
                  </Box>
                );
              })}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Total</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: theme.palette.primary.main }}>Rs {getTotalPrice().toFixed(2)}</Typography>
              </Box>
            </Paper>

            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.2, color: isDark ? '#f8fafc' : '#0f172a' }}>Attendee information</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Full Name" value={attendeeInfo.name} onChange={(e) => setAttendeeInfo((p) => ({ ...p, name: e.target.value }))} sx={fieldSx} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Email" type="email" value={attendeeInfo.email} onChange={(e) => setAttendeeInfo((p) => ({ ...p, email: e.target.value }))} sx={fieldSx} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Phone" value={attendeeInfo.phone} onChange={(e) => setAttendeeInfo((p) => ({ ...p, phone: e.target.value }))} sx={fieldSx} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth multiline rows={3} label="Special Requirements" value={attendeeInfo.specialRequirements} onChange={(e) => setAttendeeInfo((p) => ({ ...p, specialRequirements: e.target.value }))} sx={fieldSx} />
              </Grid>
            </Grid>

            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, mt: 2.5, backgroundColor: isDark ? alpha('#ffffff', 0.05) : alpha('#ffffff', 0.72) }}>
              {event.pricing.isFree ? (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.6, color: isDark ? '#f8fafc' : '#0f172a' }}>Free registration</Typography>
                  <Alert severity="success">No payment needed. Your complimentary booking will be created directly.</Alert>
                </Box>
              ) : (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.6, color: isDark ? '#f8fafc' : '#0f172a' }}>Wallet payment</Typography>
                  {walletLoading ? (
                    <Typography variant="body2">Loading wallet information...</Typography>
                  ) : walletError ? (
                    <Alert severity="error">Error loading wallet: {walletError.message}</Alert>
                  ) : wallet ? (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>Available balance: <strong>Rs {wallet.balance.toFixed(2)}</strong></Typography>
                      <Typography variant="body2">Total cost: <strong>Rs {getTotalPrice().toFixed(2)}</strong></Typography>
                      {wallet.balance < getTotalPrice() ? (
                        <Stack spacing={1.2} sx={{ mt: 1.2 }}>
                          <Alert severity="error">Insufficient balance. Recharge your wallet to complete this booking.</Alert>
                          <Button variant="outlined" sx={{ alignSelf: 'flex-start', borderRadius: 999 }} onClick={() => navigate('/wallet')}>Recharge Wallet</Button>
                        </Stack>
                      ) : (
                        <Alert severity="success" sx={{ mt: 1.2 }}>You have enough balance to complete this booking.</Alert>
                      )}
                    </Box>
                  ) : (
                    <Alert severity="error">Wallet not found. Please refresh or contact support.</Alert>
                  )}
                </>
              )}
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setBookingDialogOpen(false)} sx={{ borderRadius: 999 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleBookingSubmit}
            disabled={createBookingMutation.isPending || !attendeeInfo.name || !attendeeInfo.email || !isWalletBalanceSufficient()}
            sx={{ borderRadius: 999, fontWeight: 800, background: 'linear-gradient(90deg, #0ea5e9 0%, #6366f1 55%, #ec4899 100%)' }}
          >
            {createBookingMutation.isPending ? <CircularProgress size={18} color="inherit" /> : 'Complete Booking'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
        <Alert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity as any}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EventDetail;
