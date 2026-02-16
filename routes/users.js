const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

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

    // Check if user has events
    const eventCount = await Event.countDocuments({ organizer: req.params.id });
    if (eventCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete user. They have ${eventCount} events.` 
      });
    }

    // Check if user has bookings
    const bookingCount = await Booking.countDocuments({ user: req.params.id });
    if (bookingCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete user. They have ${bookingCount} bookings.` 
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });
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
    const totalUsers = await User.countDocuments();
    const totalOrganizers = await User.countDocuments({ role: 'organizer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const verifiedUsers = await User.countDocuments({ isVerified: true });

    // Recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // Users by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Revenue statistics - calculate from actual bookings if revenue fields are 0
    const revenueStats = await Event.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$revenue.totalRevenue' },
          platformRevenue: { $sum: '$revenue.platformRevenue' },
          organizerRevenue: { $sum: '$revenue.organizerRevenue' },
          totalTicketsSold: { $sum: '$revenue.totalTicketsSold' }
        }
      }
    ]);

    let revenue = revenueStats[0] || {
      totalRevenue: 0,
      platformRevenue: 0,
      organizerRevenue: 0,
      totalTicketsSold: 0
    };

    // If revenue is 0, calculate from actual bookings
    if (revenue.totalRevenue === 0) {
      const bookingStats = await Booking.aggregate([
        {
          $match: {
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
        revenue = {
          totalRevenue: bookingData.totalRevenue,
          platformRevenue: bookingData.totalRevenue * 0.5,
          organizerRevenue: bookingData.totalRevenue * 0.5,
          totalTicketsSold: bookingData.totalTicketsSold
        };
      }
    }

    res.json({
      totalUsers,
      totalOrganizers,
      totalAdmins,
      verifiedUsers,
      recentUsers,
      usersByRole,
      totalRevenue: revenue.totalRevenue,
      platformRevenue: revenue.platformRevenue,
      organizerRevenue: revenue.organizerRevenue,
      totalTicketsSold: revenue.totalTicketsSold
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error while fetching user statistics' });
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
          stats.organizerRevenue = bookingData.totalRevenue * 0.5;
          stats.platformRevenue = bookingData.totalRevenue * 0.5;
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
