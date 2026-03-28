import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Grid,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  MoreVert,
  Cancel,
  Download,
  QrCode,
  NavigateNext,
  CalendarToday,
  LocationOn,
  AttachMoney,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { Booking } from '../types/booking';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`bookings-tabpanel-${index}`}
      aria-labelledby={`bookings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const formatTicketCurrency = (amount: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const getBookingAttendees = (booking: Booking) => {
  const attendeeInfo = booking.attendeeInfo as Booking['attendeeInfo'] | Booking['attendeeInfo'][];
  return Array.isArray(attendeeInfo)
    ? attendeeInfo
    : attendeeInfo
      ? [attendeeInfo]
      : [];
};

const getVenueAddress = (booking: Booking) =>
  [
    booking.event.venue.address.street,
    booking.event.venue.address.city,
    booking.event.venue.address.state,
    booking.event.venue.address.country,
  ]
    .filter(Boolean)
    .join(', ');

const Bookings: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrImage, setQrImage] = useState<string>('');

  // Fetch user's bookings
  const { data: bookingsData, isLoading, error } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => bookingsAPI.getAll(),
  });

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) =>
      bookingsAPI.cancel(bookingId, { reason }),
    onSuccess: () => {
      toast.success('Booking cancelled. 50% refund processed to wallet (if applicable).');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      // Refresh wallet balance and transactions
      queryClient.invalidateQueries({ queryKey: ['wallet', user?._id] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions', user?._id] });
      setCancelDialogOpen(false);
      setCancelReason('');
      setAnchorEl(null);
      setSelectedBooking(null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to cancel booking';
      toast.error(message);
    }
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, booking: Booking) => {
    setAnchorEl(event.currentTarget);
    setSelectedBooking(booking);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBooking(null);
  };

  const handleCancelBooking = () => {
    if (selectedBooking) {
      // Open dialog but keep selectedBooking; just close the menu
      setCancelDialogOpen(true);
      setAnchorEl(null);
    }
  };

  const handleConfirmCancel = () => {
    if (selectedBooking) {
      cancelBookingMutation.mutate({
        bookingId: selectedBooking._id,
        reason: cancelReason,
      });
    }
  };

  const handleDownloadTicket = async () => {
    try {
      if (!selectedBooking) return;
      const booking = selectedBooking;
      const doc = new jsPDF({
        unit: 'pt',
        format: 'a4',
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 32;
      const contentWidth = pageWidth - margin * 2;
      const attendees = getBookingAttendees(booking);
      const tickets = booking.tickets || [];
      const venueAddress = getVenueAddress(booking);
      const totalTickets = tickets.reduce(
        (sum, ticket) => sum + Number(ticket.quantity || 0),
        0
      );
      const primaryGuest =
        attendees[0]?.name || booking.user?.name || 'EventHub Guest';

      const drawPageBackground = (showMiniHeader = false) => {
        doc.setFillColor(243, 246, 251);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        if (showMiniHeader) {
          doc.setFillColor(15, 23, 42);
          doc.roundedRect(margin, 24, contentWidth, 66, 18, 18, 'F');
          doc.setTextColor(147, 197, 253);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text('EVENTHUB PREMIUM PASS', margin + 18, 46);
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(18);
          doc.text(booking.event.title, margin + 18, 67, {
            maxWidth: contentWidth - 170,
          });
          doc.setFillColor(37, 99, 235);
          doc.roundedRect(pageWidth - 156, 36, 110, 24, 12, 12, 'F');
          doc.setFontSize(8);
          doc.text(booking.bookingReference, pageWidth - 101, 52, {
            align: 'center',
          });
        }
      };

      const drawSectionTitle = (title: string, subtitle: string, y: number) => {
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(title, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.text(subtitle, margin, y + 18);
        return y + 34;
      };

      const drawInfoCard = (
        x: number,
        y: number,
        width: number,
        label: string,
        value: string,
        copy: string
      ) => {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(219, 228, 240);
        doc.roundedRect(x, y, width, 94, 18, 18, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(29, 78, 216);
        doc.text(label.toUpperCase(), x + 16, y + 18);
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.text(value, x + 16, y + 42, {
          maxWidth: width - 32,
        });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        const wrappedCopy = doc.splitTextToSize(copy, width - 32);
        doc.text(wrappedCopy, x + 16, y + 62);
      };

      let cursorY = 28;
      drawPageBackground();

      doc.setFillColor(15, 23, 42);
      doc.roundedRect(margin, cursorY, contentWidth, 196, 24, 24, 'F');
      doc.setFillColor(29, 78, 216);
      doc.circle(pageWidth - 86, 72, 42, 'F');
      doc.setFillColor(236, 72, 153);
      doc.circle(pageWidth - 136, 122, 24, 'F');
      doc.setFillColor(51, 65, 85);
      doc.roundedRect(margin + 22, cursorY + 18, 154, 24, 12, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('EVENTHUB PREMIUM PASS', margin + 40, cursorY + 34);
      doc.setFontSize(26);
      doc.text(booking.event.title, margin + 22, cursorY + 76, {
        maxWidth: contentWidth - 210,
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(203, 213, 225);
      const heroCopy = doc.splitTextToSize(
        'Curated access pass for a polished entry experience. Keep this ticket ready for venue check-in.',
        contentWidth - 220
      );
      doc.text(heroCopy, margin + 22, cursorY + 108);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(147, 197, 253);
      doc.text('BOOKING REF', margin + 22, cursorY + 158);
      doc.text('PRIMARY GUEST', margin + 168, cursorY + 158);
      doc.text('TOTAL PAID', margin + 330, cursorY + 158);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text(booking.bookingReference, margin + 22, cursorY + 176);
      doc.text(primaryGuest, margin + 168, cursorY + 176, { maxWidth: 140 });
      doc.text(formatTicketCurrency(booking.totalAmount, booking.currency), margin + 330, cursorY + 176);

      // Ensure QR is available (prefer server-generated)
      let qrDataUrl = qrImage;
      if (!qrDataUrl) {
        const resp = await bookingsAPI.getQRCode(booking._id);
        qrDataUrl = resp.data.qrCode;
        setQrImage(qrDataUrl);
      }

      doc.setFillColor(255, 255, 255);
      doc.roundedRect(pageWidth - 162, cursorY + 18, 118, 134, 18, 18, 'F');
      doc.addImage(qrDataUrl, 'PNG', pageWidth - 150, cursorY + 28, 94, 94);
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Scan at check-in', pageWidth - 102, cursorY + 136, {
        align: 'center',
      });

      cursorY += 234;
      cursorY = drawSectionTitle(
        'Event Essentials',
        'Everything you need before you arrive at the venue.',
        cursorY
      );

      const cardWidth = (contentWidth - 14) / 2;
      drawInfoCard(
        margin,
        cursorY,
        cardWidth,
        'Event Date',
        formatDate(booking.event.dateTime.start),
        'Arrive a little early for smoother entry.'
      );
      drawInfoCard(
        margin + cardWidth + 14,
        cursorY,
        cardWidth,
        'Start Time',
        formatTime(booking.event.dateTime.start),
        'Please keep your pass open at the gate.'
      );
      cursorY += 108;

      drawInfoCard(
        margin,
        cursorY,
        cardWidth,
        'Venue',
        booking.event.venue.name,
        venueAddress || booking.event.venue.address.city
      );
      drawInfoCard(
        margin + cardWidth + 14,
        cursorY,
        cardWidth,
        'Pass Summary',
        `${totalTickets} ticket${totalTickets === 1 ? '' : 's'}`,
        `${String(booking.paymentMethod || 'online').toUpperCase()} payment`
      );
      cursorY += 120;

      cursorY = drawSectionTitle(
        'Booking Snapshot',
        'Quick reference details for verification and support.',
        cursorY
      );

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(219, 228, 240);
      doc.roundedRect(margin, cursorY, contentWidth, 84, 18, 18, 'FD');
      const stats = [
        ['Status', booking.status.toUpperCase()],
        ['Payment', booking.paymentStatus.toUpperCase()],
        ['Method', booking.paymentMethod.toUpperCase()],
        ['Amount', formatTicketCurrency(booking.totalAmount, booking.currency)],
      ];
      const statWidth = contentWidth / stats.length;
      stats.forEach(([label, value], index) => {
        const x = margin + statWidth * index;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(29, 78, 216);
        doc.text(label.toUpperCase(), x + 16, cursorY + 20);
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(13);
        doc.text(value, x + 16, cursorY + 44, {
          maxWidth: statWidth - 22,
        });
      });
      cursorY += 104;

      const attendeesToShow = attendees.length
        ? attendees
        : [
            {
              name: booking.user?.name || 'Guest',
              email: booking.user?.email || '',
              phone: booking.user?.phone,
            },
          ];

      cursorY = drawSectionTitle(
        'Guest List',
        'Attendee details attached to this booking.',
        cursorY
      );

      attendeesToShow.forEach((attendee, index) => {
        const cardHeight = attendee.phone ? 86 : 72;
        if (cursorY + cardHeight > pageHeight - 120) {
          doc.addPage();
          drawPageBackground(true);
          cursorY = 112;
        }

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(219, 228, 240);
        doc.roundedRect(margin, cursorY, contentWidth, cardHeight, 18, 18, 'FD');
        doc.setFillColor(219, 234, 254);
        doc.roundedRect(margin + 16, cursorY + 14, 74, 22, 11, 11, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(29, 78, 216);
        doc.text(`GUEST ${index + 1}`, margin + 36, cursorY + 29, {
          align: 'center',
        });
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(15);
        doc.text(attendee.name || 'Guest', margin + 16, cursorY + 55);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        doc.text(attendee.email || 'Email unavailable', margin + 240, cursorY + 34, {
          maxWidth: contentWidth - 260,
        });
        if (attendee.phone) {
          doc.text(attendee.phone, margin + 240, cursorY + 54, {
            maxWidth: contentWidth - 260,
          });
        }
        cursorY += cardHeight + 12;
      });

      cursorY += 4;
      cursorY = drawSectionTitle(
        'Ticket Breakdown',
        'Pricing summary for each pass in this booking.',
        cursorY
      );

      tickets.forEach((ticket, index) => {
        if (cursorY + 84 > pageHeight - 120) {
          doc.addPage();
          drawPageBackground(true);
          cursorY = 112;
        }

        const lineTotal = Number(ticket.totalPrice || ticket.tier.price * ticket.quantity || 0);
        doc.setFillColor(255, 247, 237);
        doc.setDrawColor(252, 211, 153);
        doc.roundedRect(margin, cursorY, contentWidth, 72, 18, 18, 'FD');
        doc.setFillColor(253, 230, 138);
        doc.roundedRect(margin + 16, cursorY + 14, 68, 22, 11, 11, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(146, 64, 14);
        doc.text(`PASS ${index + 1}`, margin + 50, cursorY + 29, {
          align: 'center',
        });
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(15);
        doc.text(ticket.tier.name, margin + 16, cursorY + 52, {
          maxWidth: 230,
        });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        doc.text(
          `${ticket.quantity} x ${formatTicketCurrency(ticket.tier.price, booking.currency)}`,
          pageWidth - 210,
          cursorY + 30,
          { align: 'right' }
        );
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(15, 23, 42);
        doc.text(formatTicketCurrency(lineTotal, booking.currency), pageWidth - 50, cursorY + 48, {
          align: 'right',
        });
        cursorY += 86;
      });

      if (cursorY + 140 > pageHeight - 80) {
        doc.addPage();
        drawPageBackground(true);
        cursorY = 112;
      }

      cursorY = drawSectionTitle(
        'Ready For Entry',
        'Keep these final notes in mind before heading to the event.',
        cursorY
      );
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(219, 228, 240);
      doc.roundedRect(margin, cursorY, contentWidth, 116, 18, 18, 'FD');

      [
        'Carry this pass on your phone or as a clear printout.',
        'Bring a valid government ID matching the booking details.',
        'Show the QR code at check-in for faster venue access.',
        'Contact EventHub support before the event if you need assistance.',
      ].forEach((note, index) => {
        const noteY = cursorY + 18 + index * 22;
        doc.setFillColor(219, 234, 254);
        doc.circle(margin + 24, noteY - 3, 10, 'F');
        doc.setTextColor(29, 78, 216);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(String(index + 1), margin + 24, noteY, {
          align: 'center',
        });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        doc.text(note, margin + 44, noteY, {
          maxWidth: contentWidth - 60,
        });
      });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text('Thank you for choosing EventHub.', pageWidth / 2, pageHeight - 38, {
        align: 'center',
      });

      doc.save(`ticket-${booking.bookingReference}.pdf`);
    } catch (e) {
      console.error('Ticket download failed', e);
    } finally {
      handleMenuClose();
    }
  };

  const handleViewQRCode = async () => {
    if (!selectedBooking) return;
    const booking = selectedBooking;
    try {
      const resp = await bookingsAPI.getQRCode(booking._id);
      setQrImage(resp.data.qrCode);
    } catch (e) {
      console.error('Failed to load QR code', e);
      setQrImage('');
    }
    setQrDialogOpen(true);
    handleMenuClose();
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  const getEventImage = (event: any) => {
    const primaryImage = event.images.find((img: any) => img.isPrimary);
    return primaryImage?.url || event.images[0]?.url || '/placeholder-event.jpg';
  };

  const upcomingBookings = bookingsData?.data.bookings.filter(
    (booking: Booking) => 
      booking.status === 'confirmed' && 
      new Date(booking.event.dateTime.start) > new Date()
  ) || [];

  const pastBookings = bookingsData?.data.bookings.filter(
    (booking: Booking) => 
      booking.status === 'confirmed' && 
      new Date(booking.event.dateTime.start) <= new Date()
  ) || [];

  const cancelledBookings = bookingsData?.data.bookings.filter(
    (booking: Booking) => 
      booking.status === 'cancelled' || booking.status === 'refunded'
  ) || [];

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load bookings. Please try again.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{
      py: 6,
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 45%, #ec4899 100%)',
    }}>
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
          <Typography color="text.primary">My Bookings</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{
          mb: 5,
          p: { xs: 2.5, md: 4 },
          borderRadius: 4,
          backdropFilter: 'blur(10px)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.3)'
        }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800, color: 'white', fontSize: { xs: '2rem', md: '3rem' } }}>
            My Bookings
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.85)' }}>
            Manage your event bookings and tickets
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper elevation={0} sx={{
          mb: 4,
          borderRadius: 4,
          backdropFilter: 'blur(10px)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.25)'
        }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'fullWidth'}
            scrollButtons="auto"
            TabIndicatorProps={{ style: { height: 4, borderRadius: 4, background: 'linear-gradient(90deg, #38bdf8, #a78bfa, #f472b6)' } }}
            textColor="inherit"
            sx={{
              '& .MuiTab-root': { color: 'rgba(255,255,255,0.9)', fontWeight: 700 },
              '& .Mui-selected': { color: 'white' }
            }}
          >
            <Tab label={`Upcoming (${upcomingBookings.length})`} />
            <Tab label={`Past (${pastBookings.length})`} />
            <Tab label={`Cancelled (${cancelledBookings.length})`} />
          </Tabs>
        </Paper>

        {/* Upcoming Bookings */}
        <TabPanel value={tabValue} index={0}>
          {upcomingBookings.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CalendarToday sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                No upcoming bookings
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                You don't have any upcoming event bookings
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/events')}
              >
                Browse Events
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {upcomingBookings.map((booking: Booking) => (
                <Grid item xs={12} md={6} key={booking._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 4,
                      overflow: 'hidden',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                      background: 'linear-gradient(160deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))',
                      backdropFilter: 'blur(10px)',
                      '&:hover': { transform: 'translateY(-6px) scale(1.01)', boxShadow: '0 30px 60px rgba(0,0,0,0.35)' },
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <img
                        src={getEventImage(booking.event)}
                        alt={booking.event.title}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                        }}
                      />
                      <Chip
                        label={booking.status}
                        color={getStatusColor(booking.status) as any}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backdropFilter: 'blur(6px)',
                          background: 'rgba(0,0,0,0.45)',
                          color: 'white'
                        }}
                      />
                    </Box>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 800 }}>
                        {booking.event.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Booking #{booking.bookingReference}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2">
                          {formatDate(booking.event.dateTime.start)} at {formatTime(booking.event.dateTime.start)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Typography variant="body2">
                          {booking.event.venue.address.city}, {booking.event.venue.address.country}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <AttachMoney fontSize="small" color="action" />
                        <Typography variant="body2">
                          Total: ${booking.totalAmount} {booking.currency}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={booking.paymentStatus}
                          color={getPaymentStatusColor(booking.paymentStatus) as any}
                          size="small"
                        />
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, booking)}
                          sx={{
                            background: 'linear-gradient(135deg, #38bdf8, #a78bfa)',
                            color: 'white',
                            borderRadius: 2,
                            transition: 'transform 0.2s ease',
                            '&:hover': { background: 'linear-gradient(135deg, #22d3ee, #c084fc)', transform: 'scale(1.05)' }
                          }}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Past Bookings */}
        <TabPanel value={tabValue} index={1}>
          {pastBookings.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CalendarToday sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                No past bookings
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Your past event bookings will appear here
              </Typography>
            </Box>
          ) : (
            isMobile ? (
              <Grid container spacing={2.5}>
                {pastBookings.map((booking: Booking) => (
                  <Grid item xs={12} key={booking._id}>
                    <Card sx={{ borderRadius: 4 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>{booking.event.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          #{booking.bookingReference}
                        </Typography>
                        <Stack spacing={1}>
                          <Typography variant="body2">{formatDate(booking.event.dateTime.start)} at {formatTime(booking.event.dateTime.start)}</Typography>
                          <Typography variant="body2">{booking.event.venue.name}, {booking.event.venue.address.city}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>${booking.totalAmount}</Typography>
                        </Stack>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Chip label={booking.status} color={getStatusColor(booking.status) as any} size="small" />
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, booking)}>
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Venue</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pastBookings.map((booking: Booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {booking.event.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            #{booking.bookingReference}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(booking.event.dateTime.start)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(booking.event.dateTime.start)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {booking.event.venue.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {booking.event.venue.address.city}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          ${booking.totalAmount}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status}
                          color={getStatusColor(booking.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, booking)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            )
          )}
        </TabPanel>

        {/* Cancelled Bookings */}
        <TabPanel value={tabValue} index={2}>
          {cancelledBookings.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Cancel sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                No cancelled bookings
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Your cancelled bookings will appear here
              </Typography>
            </Box>
          ) : (
            isMobile ? (
              <Grid container spacing={2.5}>
                {cancelledBookings.map((booking: Booking) => (
                  <Grid item xs={12} key={booking._id}>
                    <Card sx={{ borderRadius: 4 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>{booking.event.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          #{booking.bookingReference}
                        </Typography>
                        <Stack spacing={1}>
                          <Typography variant="body2">{formatDate(booking.event.dateTime.start)}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>${booking.totalAmount}</Typography>
                          <Typography variant="body2" color="text.secondary">{booking.notes || 'No reason provided'}</Typography>
                        </Stack>
                        <Box sx={{ mt: 2 }}>
                          <Chip label={booking.status} color={getStatusColor(booking.status) as any} size="small" />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cancelledBookings.map((booking: Booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {booking.event.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            #{booking.bookingReference}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(booking.event.dateTime.start)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          ${booking.totalAmount}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status}
                          color={getStatusColor(booking.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {booking.notes || 'No reason provided'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            )
          )}
        </TabPanel>

        {/* Booking Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              borderRadius: 3,
              backdropFilter: 'blur(8px)',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.88))',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
            }
          }}
        >
          <MenuItem onClick={handleDownloadTicket}>
            <Download sx={{ mr: 1 }} />
            Download Ticket
          </MenuItem>
          <MenuItem onClick={handleViewQRCode}>
            <QrCode sx={{ mr: 1 }} />
            View QR Code
          </MenuItem>
          {selectedBooking?.status === 'confirmed' && (
            <MenuItem onClick={handleCancelBooking} sx={{ color: 'error.main' }}>
              <Cancel sx={{ mr: 1 }} />
              Cancel Booking
            </MenuItem>
          )}
        </Menu>

        {/* Cancel Booking Dialog */}
        <Dialog
          open={cancelDialogOpen}
          onClose={() => setCancelDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Cancel Booking</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to cancel your booking for "{selectedBooking?.event.title}"?
            </Typography>
            <TextField
              fullWidth
              label="Reason for cancellation (optional)"
              multiline
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialogOpen(false)}>
              Keep Booking
            </Button>
            <Button
              onClick={handleConfirmCancel}
              color="error"
              variant="contained"
              disabled={cancelBookingMutation.isPending}
            >
              {cancelBookingMutation.isPending ? (
                <CircularProgress size={20} />
              ) : (
                'Cancel Booking'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* QR Code Dialog */}
        <Dialog
          open={qrDialogOpen}
          onClose={() => setQrDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              backdropFilter: 'blur(10px)',
              background: 'linear-gradient(160deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
              boxShadow: '0 30px 60px rgba(0,0,0,0.25)'
            }
          }}
        >
          <DialogTitle>Booking QR Code</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
            {selectedBooking && (
              <>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                  {selectedBooking.event.title}
                </Typography>
                {qrImage ? (
                  <img src={qrImage} alt="Booking QR" style={{ width: 200, height: 200 }} />
                ) : (
                  <Typography variant="body2">Loading QR...</Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                  #{selectedBooking.bookingReference}
                </Typography>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDownloadTicket} startIcon={<Download />}>Download Ticket</Button>
            <Button onClick={() => setQrDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Bookings;
