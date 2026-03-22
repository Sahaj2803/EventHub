const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Favorite = require('../models/Favorite');
const AdminStats = require('../models/AdminStats');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
const PLATFORM_REVENUE_SHARE = 0.7;
const ORGANIZER_REVENUE_SHARE = 0.3;
const ADMIN_STATS_KEY = 'global';

const roundCurrency = (value) => Number((value || 0).toFixed(2));

const buildRevenueStats = (totalRevenue = 0, totalTicketsSold = 0) => ({
  totalRevenue: roundCurrency(totalRevenue),
  platformRevenue: roundCurrency(totalRevenue * PLATFORM_REVENUE_SHARE),
  organizerRevenue: roundCurrency(totalRevenue * ORGANIZER_REVENUE_SHARE),
  totalTicketsSold,
  avgTicketPrice: totalTicketsSold > 0 ? roundCurrency(totalRevenue / totalTicketsSold) : 0
});

const getDashboardResetAt = async () => {
  const adminStats = await AdminStats.findOne({ key: ADMIN_STATS_KEY }).lean();
  return adminStats?.dashboard?.resetAt ? new Date(adminStats.dashboard.resetAt) : null;
};

const getAdminOverviewStats = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalUsers,
    totalOrganizers,
    totalAdmins,
    verifiedUsers,
    recentUsers,
    usersByRole,
    resetAt
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'organizer' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    getDashboardResetAt()
  ]);

  const bookingsFilter = resetAt ? { createdAt: { $gte: resetAt } } : {};
  const totalBookings = await Booking.countDocuments(bookingsFilter);

  const paidBookingMatch = {
    ...bookingsFilter,
    status: 'confirmed',
    paymentStatus: 'paid'
  };

  const bookingStats = await Booking.aggregate([
    { $match: paidBookingMatch },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        totalTicketsSold: { $sum: { $sum: '$tickets.quantity' } }
      }
    }
  ]);

  const bookingData = bookingStats[0] || {
    totalRevenue: 0,
    totalTicketsSold: 0
  };

  const revenue = buildRevenueStats(bookingData.totalRevenue, bookingData.totalTicketsSold);

  return {
    totalUsers,
    totalOrganizers,
    totalAdmins,
    verifiedUsers,
    recentUsers,
    usersByRole,
    totalBookings,
    ...revenue,
    resetAt
  };
};

const recomputeEventMetrics = async (eventId) => {
  const event = await Event.findById(eventId);
  if (!event) return;

  const [bookingStats, tierSales] = await Promise.all([
    Booking.aggregate([
      {
        $match: {
          event: event._id,
          status: 'confirmed',
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalTicketsSold: { $sum: { $sum: '$tickets.quantity' } }
        }
      }
    ]),
    Booking.aggregate([
      {
        $match: {
          event: event._id,
          status: 'confirmed',
          paymentStatus: 'paid'
        }
      },
      { $unwind: '$tickets' },
      {
        $group: {
          _id: '$tickets.tier.name',
          sold: { $sum: '$tickets.quantity' }
        }
      }
    ])
  ]);

  const totals = bookingStats[0] || {
    totalRevenue: 0,
    totalTicketsSold: 0
  };

  const tierSalesMap = new Map(tierSales.map((entry) => [entry._id, entry.sold]));

  if (event.capacity) {
    event.capacity.sold = totals.totalTicketsSold;
    if (typeof event.capacity.total === 'number') {
      event.capacity.available = Math.max(event.capacity.total - totals.totalTicketsSold, 0);
    }
  }

  event.revenue.totalRevenue = roundCurrency(totals.totalRevenue);
  event.revenue.platformRevenue = roundCurrency(totals.totalRevenue * PLATFORM_REVENUE_SHARE);
  event.revenue.organizerRevenue = roundCurrency(totals.totalRevenue * ORGANIZER_REVENUE_SHARE);
  event.revenue.totalTicketsSold = totals.totalTicketsSold;

  if (Array.isArray(event.pricing?.tiers)) {
    event.pricing.tiers.forEach((tier) => {
      tier.sold = tierSalesMap.get(tier.name) || 0;
    });
  }

  await event.save();
};

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private
router.get('/', auth, authorize('admin'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['user', 'organizer', 'admin']).withMessage('Invalid role'),
  query('search').optional().isString().withMessage('Search must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, role, search } = req.query;

    // Build filter object
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// @route   POST /api/users
// @desc    Create a new user (Admin only)
// @access  Private
router.post('/', auth, authorize('admin'), [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'organizer', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role = 'user' } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = new User({
      name,
      email,
      password,
      role
    });

    await user.save();

    const createdUser = await User.findById(user._id).select('-password');

    res.status(201).json({
      message: 'User created successfully',
      user: createdUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error while creating user' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Users can only view their own profile unless they're admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error while fetching user' });
  }
});

// @route   GET /api/users/:id/events
// @desc    Get events created by a user
// @access  Public
router.get('/:id/events', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['draft', 'published', 'cancelled', 'completed']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 12, status } = req.query;

    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build filter
    const filter = { organizer: req.params.id };
    if (status) filter.status = status;

    // Only show published events to non-authenticated users
    if (!req.user || req.user.role === 'user') {
      filter.status = 'published';
      filter.visibility = 'public';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(filter)
      .populate('category', 'name slug color')
      .sort({ 'dateTime.start': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(filter);

    res.json({
      events,
      organizer: {
        id: user._id,
        name: user.name,
        avatar: user.avatar
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalEvents: total
      }
    });
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({ message: 'Server error while fetching user events' });
  }
});

// @route   GET /api/users/:id/bookings
// @desc    Get bookings for a user
// @access  Private
router.get('/:id/bookings', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['pending', 'confirmed', 'cancelled', 'refunded']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Users can only view their own bookings unless they're admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10, status } = req.query;

    const filter = { user: req.params.id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(filter)
      .populate('event', 'title dateTime venue images')
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
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Server error while fetching user bookings' });
  }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role
// @access  Private (Admin only)
router.put('/:id/role', auth, authorize('admin'), [
  body('role').isIn(['user', 'organizer', 'admin']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from changing their own role
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    user.role = role;
    await user.save();

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error while updating user role' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const userEvents = await Event.find({ organizer: req.params.id }).select('_id');
    const userEventIds = userEvents.map((event) => event._id);
    const userEventIdSet = new Set(userEventIds.map((id) => id.toString()));

    const userBookings = await Booking.find({ user: req.params.id }).select('event');
    const impactedExternalEventIds = [
      ...new Set(
        userBookings
          .map((booking) => booking.event?.toString())
          .filter((eventId) => eventId && !userEventIdSet.has(eventId))
      )
    ];

    const bookingDeleteFilter = userEventIds.length > 0
      ? { $or: [{ user: req.params.id }, { event: { $in: userEventIds } }] }
      : { user: req.params.id };

    await Promise.all([
      Favorite.deleteMany(userEventIds.length > 0
        ? { $or: [{ user: req.params.id }, { event: { $in: userEventIds } }] }
        : { user: req.params.id }),
      Booking.deleteMany(bookingDeleteFilter),
      userEventIds.length > 0 ? Event.deleteMany({ _id: { $in: userEventIds } }) : Promise.resolve()
    ]);

    if (impactedExternalEventIds.length > 0) {
      await Promise.all(impactedExternalEventIds.map((eventId) => recomputeEventMetrics(eventId)));
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: 'User deleted successfully',
      deletedEvents: userEventIds.length,
      updatedEvents: impactedExternalEventIds.length
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
});

// @route   GET /api/users/stats/overview
// @desc    Get user statistics overview
// @access  Private (Admin only)
router.get('/stats/overview', auth, authorize('admin'), async (req, res) => {
  try {
    const stats = await getAdminOverviewStats();
    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error while fetching user statistics' });
  }
});

// @route   POST /api/users/stats/reset
// @desc    Reset admin dashboard revenue and booking counters
// @access  Private (Admin only)
router.post('/stats/reset', auth, authorize('admin'), async (req, res) => {
  try {
    const resetAt = new Date();

    await AdminStats.findOneAndUpdate(
      { key: ADMIN_STATS_KEY },
      {
        $set: {
          dashboard: {
            resetAt,
            updatedBy: req.user._id
          }
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    const stats = await getAdminOverviewStats();

    res.json({
      message: 'Admin dashboard stats reset successfully',
      stats
    });
  } catch (error) {
    console.error('Reset admin stats error:', error);
    res.status(500).json({ message: 'Server error while resetting dashboard statistics' });
  }
});

// @route   GET /api/users/:id/wallet
// @desc    Get user wallet information
// @access  Private
router.get('/:id/wallet', auth, async (req, res) => {
  try {
    console.log('🔍 Wallet API called for user:', req.params.id);
    
    // Disable caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    // Users can only view their own wallet unless they're admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      console.log('❌ User not found:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('👤 User found:', user.name, 'Wallet exists:', !!user.wallet);

    // Initialize wallet if it doesn't exist (for existing users)
    if (!user.wallet) {
      console.log('🔧 Initializing wallet for user:', user.name);
      user.wallet = {
        balance: 0,
        currency: 'USD',
        transactions: []
      };
      await user.save();
      console.log('✅ Wallet initialized successfully');
    }

    console.log('💰 Returning wallet:', user.wallet);
    res.json({ wallet: user.wallet });
  } catch (error) {
    console.error('❌ Get wallet error:', error);
    res.status(500).json({ message: 'Server error while fetching wallet' });
  }
});

// @route   POST /api/users/:id/wallet/recharge
// @desc    Recharge user wallet
// @access  Private
router.post('/:id/wallet/recharge', auth, [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
  body('paymentMethod').isIn(['stripe', 'paypal', 'bank_transfer']).withMessage('Invalid payment method'),
  body('description').optional().isString().withMessage('Description must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Users can only recharge their own wallet unless they're admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { amount, paymentMethod, description = 'Wallet recharge' } = req.body;

    const user = await User.findById(req.params.id);
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
    }

    // In a real application, you would integrate with payment processors here
    // For now, we'll simulate a successful payment
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await user.addToWallet(
      amount,
      description,
      paymentMethod,
      null
    );

    // Update the transaction with the generated transaction ID
    const latestTransaction = user.wallet.transactions[user.wallet.transactions.length - 1];
    latestTransaction.transactionId = transactionId;
    await user.save();

    res.json({
      message: 'Wallet recharged successfully',
      wallet: user.wallet,
      transactionId
    });
  } catch (error) {
    console.error('Recharge wallet error:', error);
    res.status(500).json({ message: 'Server error while recharging wallet' });
  }
});

// @route   GET /api/users/:id/wallet/transactions
// @desc    Get user wallet transactions
// @access  Private
router.get('/:id/wallet/transactions', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['credit', 'debit', 'refund']).withMessage('Invalid transaction type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Users can only view their own transactions unless they're admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 20, type } = req.query;

    const user = await User.findById(req.params.id);
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

    let transactions = user.wallet.transactions;

    // Filter by type if specified
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }

    // Sort by creation date (newest first)
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedTransactions = transactions.slice(skip, skip + parseInt(limit));

    res.json({
      transactions: paginatedTransactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(transactions.length / parseInt(limit)),
        totalTransactions: transactions.length
      },
      wallet: {
        balance: user.wallet.balance,
        currency: user.wallet.currency
      }
    });
  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({ message: 'Server error while fetching wallet transactions' });
  }
});

// @route   GET /api/users/:id/revenue
// @desc    Get organizer revenue statistics
// @access  Private
router.get('/:id/revenue', auth, async (req, res) => {
  try {
    // Users can only view their own revenue unless they're admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only organizers can have revenue
    if (user.role !== 'organizer' && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'User is not an organizer' });
    }

    // Get revenue statistics for this organizer's events
    const revenueStats = await Event.aggregate([
      { $match: { organizer: user._id } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$revenue.totalRevenue' },
          organizerRevenue: { $sum: '$revenue.organizerRevenue' },
          platformRevenue: { $sum: '$revenue.platformRevenue' },
          totalTicketsSold: { $sum: '$revenue.totalTicketsSold' },
          totalEvents: { $sum: 1 },
          activeEvents: {
            $sum: {
              $cond: [
                { $in: ['$status', ['published', 'draft']] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // If revenue is 0, calculate from actual bookings for this organizer's events
    let stats = revenueStats[0] || {
      totalRevenue: 0,
      organizerRevenue: 0,
      platformRevenue: 0,
      totalTicketsSold: 0,
      totalEvents: 0,
      activeEvents: 0
    };

    if (stats.totalRevenue === 0) {
      const organizerEvents = await Event.find({ organizer: user._id }).select('_id');
      const eventIds = organizerEvents.map(event => event._id);

      if (eventIds.length > 0) {
        const bookingStats = await Booking.aggregate([
          {
            $match: {
              event: { $in: eventIds },
              status: { $in: ['confirmed'] },
              paymentStatus: { $in: ['paid'] }
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$totalAmount' },
              totalTicketsSold: { $sum: { $sum: '$tickets.quantity' } }
            }
          }
        ]);

        if (bookingStats.length > 0) {
          const bookingData = bookingStats[0];
          stats.totalRevenue = bookingData.totalRevenue;
          stats.organizerRevenue = roundCurrency(bookingData.totalRevenue * ORGANIZER_REVENUE_SHARE);
          stats.platformRevenue = roundCurrency(bookingData.totalRevenue * PLATFORM_REVENUE_SHARE);
          stats.totalTicketsSold = bookingData.totalTicketsSold;
        }
      }
    }

    // Get monthly revenue breakdown
    const monthlyRevenue = await Event.aggregate([
      { $match: { organizer: user._id } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$revenue.organizerRevenue' },
          ticketsSold: { $sum: '$revenue.totalTicketsSold' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);


    res.json({
      organizer: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      revenue: stats,
      monthlyRevenue
    });
  } catch (error) {
    console.error('Get organizer revenue error:', error);
    res.status(500).json({ message: 'Server error while fetching organizer revenue' });
  }
});

// @route   POST /api/users/:id/wallet/initialize
// @desc    Initialize wallet for a specific user
// @access  Private
router.post('/:id/wallet/initialize', auth, async (req, res) => {
  try {
    console.log('🔧 Initializing wallet for user:', req.params.id);
    
    // Users can only initialize their own wallet unless they're admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id);
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
      console.log('✅ Wallet initialized for user:', user.name);
    }

    res.json({
      message: 'Wallet initialized successfully',
      wallet: user.wallet
    });
  } catch (error) {
    console.error('❌ Wallet initialization error:', error);
    res.status(500).json({ message: 'Server error during wallet initialization' });
  }
});

// @route   POST /api/users/initialize-wallets
// @desc    Initialize wallets for all users who don't have them (Admin only)
// @access  Private (Admin only)
router.post('/initialize-wallets', auth, authorize('admin'), async (req, res) => {
  try {
    console.log('🔧 Starting wallet initialization for all users...');
    
    const users = await User.find({});
    let initializedCount = 0;
    
    for (const user of users) {
      if (!user.wallet) {
        user.wallet = {
          balance: 0,
          currency: 'USD',
          transactions: []
        };
        await user.save();
        initializedCount++;
        console.log(`✅ Initialized wallet for user: ${user.name} (${user.email})`);
      }
    }
    
    res.json({
      message: `Wallet initialization completed. ${initializedCount} wallets initialized.`,
      totalUsers: users.length,
      initializedWallets: initializedCount
    });
  } catch (error) {
    console.error('❌ Wallet initialization error:', error);
    res.status(500).json({ message: 'Server error during wallet initialization' });
  }
});

module.exports = router;
