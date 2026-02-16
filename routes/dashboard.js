const express = require('express');
const Event = require('../models/Event');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard-data
// @desc    Get dashboard statistics (total events, upcoming events, tickets sold, total revenue)
// @access  Private (Admin/Organizer)
router.get('/dashboard-data', auth, authorize('admin', 'organizer'), async (req, res) => {
  try {
    // Build filter based on user role
    const filter = {};
    
    // If user is organizer (not admin), only show their events
    if (req.user.role === 'organizer') {
      filter.organizer = req.user._id;
    }
    
    // Only count published events
    filter.status = 'published';

    // Aggregation pipeline to calculate dashboard metrics
    const dashboardData = await Event.aggregate([
      // Match events based on filter
      { $match: filter },
      
      // Project fields we need and ensure non-negative values
      {
        $project: {
          ticketsSold: {
            $max: [
              { $ifNull: ['$capacity.sold', 0] },
              0
            ]
          },
          totalRevenue: {
            $max: [
              { $ifNull: ['$revenue.totalRevenue', 0] },
              0
            ]
          },
          startDate: '$dateTime.start',
          status: '$status'
        }
      },
      
      // Group and calculate totals
      {
        $group: {
          _id: null,
          totalEvents: { $sum: 1 },
          ticketsSold: { $sum: '$ticketsSold' },
          totalRevenue: { $sum: '$totalRevenue' },
          upcomingEvents: {
            $sum: {
              $cond: [
                { $gte: ['$startDate', new Date()] },
                1,
                0
              ]
            }
          }
        }
      },
      
      // Project final result
      {
        $project: {
          _id: 0,
          totalEvents: { $ifNull: ['$totalEvents', 0] },
          upcomingEvents: { $ifNull: ['$upcomingEvents', 0] },
          ticketsSold: { $ifNull: ['$ticketsSold', 0] },
          totalRevenue: { $ifNull: ['$totalRevenue', 0] }
        }
      }
    ]);

    // If no events found, return zero values
    const result = dashboardData.length > 0 ? dashboardData[0] : {
      totalEvents: 0,
      upcomingEvents: 0,
      ticketsSold: 0,
      totalRevenue: 0
    };

    res.json(result);
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
