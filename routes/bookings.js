const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const QRCode = require('qrcode');
const emailService = require('../services/emailService');

const router = express.Router();

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate('event', 'title dateTime venue images')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalBookings: total
      }
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error while fetching bookings' });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event', 'title dateTime venue images organizer')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user can view this booking
    if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error while fetching booking' });
  }
});

// @route   GET /api/bookings/:id/qrcode
// @desc    Generate QR code for a booking
// @access  Private
router.get('/:id/qrcode', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event', 'title dateTime venue')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only the booking owner or admin can get QR
    if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const payload = {
      bookingReference: booking.bookingReference,
      event: booking.event._id,
      user: booking.user._id,
      totalAmount: booking.totalAmount,
      status: booking.status,
    };

    const dataUrl = await QRCode.toDataURL(JSON.stringify(payload), { margin: 1, width: 300 });

    return res.json({ qrCode: dataUrl });
  } catch (error) {
    console.error('Generate booking QR error:', error);
    res.status(500).json({ message: 'Server error while generating QR code' });
  }
});

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', auth, [
  body('eventId').isMongoId().withMessage('Valid event ID is required'),
  body('tickets').isArray({ min: 1 }).withMessage('At least one ticket is required'),
  body('tickets.*.tier').isString().withMessage('Ticket tier is required'),
  body('tickets.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('attendeeInfo.name').trim().isLength({ min: 2 }).withMessage('Attendee name is required'),
  body('attendeeInfo.email').isEmail().withMessage('Valid email is required'),
  body('paymentMethod').optional().isIn(['stripe', 'paypal', 'bank_transfer', 'wallet']).withMessage('Invalid payment method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventId, tickets, attendeeInfo, paymentMethod = 'stripe' } = req.body;

    // Get event details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event is available for booking
    if (event.status !== 'published') {
      return res.status(400).json({ message: 'Event is not available for booking' });
    }

    if (new Date() > event.dateTime.start) {
      return res.status(400).json({ message: 'Event has already started' });
    }

    // Calculate total amount and validate tickets
    let totalAmount = 0;
    const validatedTickets = [];

    for (const ticket of tickets) {
      const tier = event.pricing.tiers.find(t => t.name === ticket.tier);
      if (!tier) {
        return res.status(400).json({ message: `Invalid ticket tier: ${ticket.tier}` });
      }

      if (tier.quantity && (tier.sold + ticket.quantity) > tier.quantity) {
        return res.status(400).json({ message: `Not enough tickets available for ${ticket.tier}` });
      }

      const tierTotal = tier.price * ticket.quantity;
      totalAmount += tierTotal;

      validatedTickets.push({
        tier: {
          name: tier.name,
          price: tier.price
        },
        quantity: ticket.quantity,
        totalPrice: tierTotal
      });
    }

    // Check overall capacity
    const totalTickets = tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
    if (event.capacity && (event.capacity.sold + totalTickets) > event.capacity.total) {
      return res.status(400).json({ message: 'Event is sold out' });
    }

    // Handle wallet payment and booking creation with proper error handling
    let booking;
    
    try {
      // Handle wallet payment first
      if (paymentMethod === 'wallet') {
        const user = await User.findById(req.user._id);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Initialize wallet if it doesn't exist
        if (!user.wallet) {
          user.wallet = {
            balance: 0,
            currency: 'USD',
            transactions: []
          };
          await user.save();
        }

        if (user.wallet.balance < totalAmount) {
          return res.status(400).json({ 
            message: 'Insufficient wallet balance',
            required: totalAmount,
            available: user.wallet.balance
          });
        }

        // Deduct amount from wallet
        await user.deductFromWallet(
          totalAmount,
          `Event booking: ${event.title}`,
          null
        );
      }

      // Create booking
      booking = new Booking({
        user: req.user._id,
        event: eventId,
        tickets: validatedTickets,
        totalAmount,
        currency: event.pricing.currency,
        paymentMethod,
        attendeeInfo,
        status: paymentMethod === 'wallet' ? 'confirmed' : 'pending',
        paymentStatus: paymentMethod === 'wallet' ? 'paid' : 'pending',
        bookingReference: `BOOK-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      });

      await booking.save();

      // Calculate revenue (50% platform, 50% organizer)
      const platformRevenue = totalAmount * 0.5;
      const organizerRevenue = totalAmount * 0.5;

      // Update event capacity and revenue
      const updateData = {
        $inc: { 
          'capacity.sold': totalTickets,
          'revenue.totalRevenue': totalAmount,
          'revenue.platformRevenue': platformRevenue,
          'revenue.organizerRevenue': organizerRevenue,
          'revenue.totalTicketsSold': totalTickets
        }
      };

      // Update individual tier sold counts
      for (const ticket of tickets) {
        const tier = event.pricing.tiers.find(t => t.name === ticket.tier);
        if (tier) {
          await Event.findByIdAndUpdate(eventId, {
            $inc: { 'pricing.tiers.$[elem].sold': ticket.quantity }
          }, {
            arrayFilters: [{ 'elem.name': ticket.tier }]
          });
        }
      }

      // Update the main event document
      await Event.findByIdAndUpdate(eventId, updateData);

    } catch (error) {
      console.error('Booking creation error:', error);
      
      // If booking creation failed and we already deducted wallet, refund it
      if (paymentMethod === 'wallet') {
        try {
          const user = await User.findById(req.user._id);
          if (user) {
            await user.refundToWallet(
              totalAmount,
              `Refund due to booking creation failure`,
              null
            );
          }
        } catch (refundError) {
          console.error('Refund error:', refundError);
        }
      }
      
      return res.status(500).json({ message: 'Failed to create booking: ' + error.message });
    }

    // Populate the booking
    await booking.populate('event', 'title dateTime venue images category');
    await booking.populate('user', 'name email');

    // Send email with PDF ticket to attendee email (async, don't wait for it)
    const attendeeEmail = Array.isArray(booking.attendeeInfo)
      ? (booking.attendeeInfo[0]?.email || booking.user.email)
      : (booking.attendeeInfo?.email || booking.user.email);
    const attendeeName = Array.isArray(booking.attendeeInfo)
      ? (booking.attendeeInfo[0]?.name || booking.user.name)
      : (booking.attendeeInfo?.name || booking.user.name);
    
    console.log('📧 Email Debug Info:');
    console.log('Attendee Info:', booking.attendeeInfo);
    console.log('User Email:', booking.user.email);
    console.log('Selected Email:', attendeeEmail);
    
    const emailUser = {
      name: attendeeName,
      email: attendeeEmail
    };
    
    emailService.sendTicketEmail(booking, booking.event, emailUser)
      .then(result => {
        if (result.success) {
          console.log(`Ticket email sent successfully to ${attendeeEmail}:`, result.messageId);
        } else {
          console.error(`Failed to send ticket email to ${attendeeEmail}:`, result.error);
        }
      })
      .catch(error => {
        console.error(`Error sending ticket email to ${attendeeEmail}:`, error);
      });

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error while creating booking' });
  }
});

// @route   PUT /api/bookings/:id/confirm
// @desc    Confirm a booking (after payment)
// @access  Private
router.put('/:id/confirm', auth, [
  body('paymentIntentId').optional().isString().withMessage('Payment intent ID must be a string'),
  body('transactionId').optional().isString().withMessage('Transaction ID must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentIntentId, transactionId } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user can confirm this booking
    if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Booking is not in pending status' });
    }

    // Update booking status
    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    if (paymentIntentId) booking.paymentIntentId = paymentIntentId;
    if (transactionId) booking.transactionId = transactionId;

    await booking.save();

    await booking.populate('event', 'title dateTime venue images');
    await booking.populate('user', 'name email');

    res.json({
      message: 'Booking confirmed successfully',
      booking
    });
  } catch (error) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ message: 'Server error while confirming booking' });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.put('/:id/cancel', auth, [
  body('reason').optional().isString().withMessage('Reason must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reason } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user can cancel this booking
    if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

  // Load event; allow cancellation any time before event start
  const event = await Event.findById(booking.event);
  const eventHasStarted = new Date() >= new Date(event.dateTime.start);
  if (eventHasStarted) {
    return res.status(400).json({ message: 'Cannot cancel after event has started' });
  }

    try {
      // Update booking status
      const wasPaid = booking.paymentStatus === 'paid';
      booking.status = 'cancelled';
      if (reason) booking.notes = reason;

      // Handle wallet refund (50% refund policy)
      if (booking.paymentMethod === 'wallet' && wasPaid) {
        const user = await User.findById(booking.user);
        if (user) {
          // Initialize wallet if it doesn't exist
          if (!user.wallet) {
            user.wallet = {
              balance: 0,
              currency: 'USD',
              transactions: []
            };
            await user.save();
          }

          const refundAmount = Math.round(booking.totalAmount * 0.5);
          await user.refundToWallet(
            refundAmount,
            `50% refund for cancelled booking: ${booking.bookingReference}`,
            booking._id
          );
          booking.notes = booking.notes
            ? `${booking.notes} | 50% refund processed: ${refundAmount}`
            : `50% refund processed: ${refundAmount}`;
        }
      }

      // Set payment status after handling refund logic
      if (wasPaid) {
        booking.paymentStatus = 'refunded';
      }

      await booking.save();

      // Calculate refund amounts (50% platform, 50% organizer)
      const platformRefund = booking.totalAmount * 0.5;
      const organizerRefund = booking.totalAmount * 0.5;

      // Update event capacity and revenue
      const totalTickets = booking.tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
      
      // Update individual tier sold counts
      for (const ticket of booking.tickets) {
        await Event.findByIdAndUpdate(booking.event, {
          $inc: { 'pricing.tiers.$[elem].sold': -ticket.quantity }
        }, {
          arrayFilters: [{ 'elem.name': ticket.tier.name }]
        });
      }

      // Update the main event document
      await Event.findByIdAndUpdate(booking.event, {
        $inc: { 
          'capacity.sold': -totalTickets,
          'revenue.totalRevenue': -booking.totalAmount,
          'revenue.platformRevenue': -platformRefund,
          'revenue.organizerRevenue': -organizerRefund,
          'revenue.totalTicketsSold': -totalTickets
        }
      });

    } catch (error) {
      console.error('Cancellation error:', error);
      return res.status(500).json({ message: 'Failed to cancel booking: ' + error.message });
    }

    await booking.populate('event', 'title dateTime venue images');
    await booking.populate('user', 'name email');

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error while cancelling booking' });
  }
});

// @route   GET /api/bookings/event/:eventId
// @desc    Get bookings for a specific event (organizer/admin only)
// @access  Private
router.get('/event/:eventId', auth, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    // Verify user has access to this event
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const filter = { event: req.params.eventId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(filter);

    res.json({
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalBookings: total
      }
    });
  } catch (error) {
    console.error('Get event bookings error:', error);
    res.status(500).json({ message: 'Server error while fetching event bookings' });
  }
});

// @route   PUT /api/bookings/:id/checkin
// @desc    Check in attendee
// @access  Private (Organizer/Admin)
router.put('/:id/checkin', auth, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify user has access to this event
    const event = await Event.findById(booking.event);
    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.checkInStatus === 'checked_in') {
      return res.status(400).json({ message: 'Attendee is already checked in' });
    }

    booking.checkInStatus = 'checked_in';
    booking.checkInTime = new Date();
    await booking.save();

    await booking.populate('user', 'name email');
    await booking.populate('event', 'title dateTime venue');

    res.json({
      message: 'Check-in successful',
      booking
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error during check-in' });
  }
});

// @route   POST /api/bookings/test-email
// @desc    Test email service
// @access  Public (for testing)
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    // Check if email service is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ 
        message: 'Email service not configured. Please set EMAIL_USER and EMAIL_PASS in .env file',
        configured: false
      });
    }

    const result = await emailService.sendTestEmail(email);
    
    if (result.success) {
      res.json({ 
        message: 'Test email sent successfully',
        messageId: result.messageId,
        configured: true
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to send test email',
        error: result.error,
        configured: true
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ message: 'Server error while sending test email' });
  }
});

module.exports = router;
