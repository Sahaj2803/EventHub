const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Event = require('../models/Event');
const Category = require('../models/Category');
const { auth, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/events
// @desc    Get all events with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isMongoId().withMessage('Invalid category ID'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('status').optional().isIn(['draft', 'published', 'cancelled', 'completed']).withMessage('Invalid status'),
  query('sortBy').optional().isIn(['date', 'title', 'createdAt', 'views']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], optionalAuth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 12,
      category,
      search,
      status = 'published',
      sortBy = 'dateTime.start',
      sortOrder = 'asc',
      featured,
      upcoming,
      location
    } = req.query;

    // Build filter object
    const filter = {};

    // Only show published events to non-authenticated users
    if (!req.user || req.user.role === 'user') {
      filter.status = 'published';
      filter.visibility = 'public';
    } else {
      if (status) filter.status = status;
    }

    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;
    if (upcoming === 'true') filter['dateTime.start'] = { $gte: new Date() };

    // Search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Location filter
    if (location) {
      filter['venue.address.city'] = { $regex: location, $options: 'i' };
    }

    // Build sort object
    const sort = {};
    if (sortBy === 'date') {
      sort['dateTime.start'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'title') {
      sort.title = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'createdAt') {
      sort.createdAt = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'views') {
      sort['analytics.views'] = sortOrder === 'desc' ? -1 : 1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const events = await Event.find(filter)
      .populate('organizer', 'name avatar')
      .populate('category', 'name slug color')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Event.countDocuments(filter);

    res.json({
      events,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalEvents: total,
        hasNext: skip + events.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error while fetching events' });
  }
});

// @route   GET /api/events/featured
// @desc    Get featured events
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const events = await Event.find({
      featured: true,
      status: 'published',
      visibility: 'public',
      featuredUntil: { $gte: new Date() }
    })
      .populate('organizer', 'name avatar')
      .populate('category', 'name slug color')
      .sort({ 'dateTime.start': 1 })
      .limit(6)
      .lean();

    res.json({ events });
  } catch (error) {
    console.error('Get featured events error:', error);
    res.status(500).json({ message: 'Server error while fetching featured events' });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name avatar email phone')
      .populate('category', 'name slug color description');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user can view this event
    if (event.visibility === 'private' && (!req.user || req.user._id.toString() !== event.organizer._id.toString())) {
      return res.status(403).json({ message: 'Access denied to private event' });
    }

    // Increment view count
    await Event.findByIdAndUpdate(req.params.id, {
      $inc: { 'analytics.views': 1 }
    });

    res.json({ event });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error while fetching event' });
  }
});

// @route   POST /api/events
// @desc    Create a new event
// @access  Private (Organizer/Admin)
router.post('/', auth, authorize('organizer', 'admin'), [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('category').isMongoId().withMessage('Valid category is required'),
  body('dateTime.start').isISO8601().withMessage('Valid start date is required'),
  body('dateTime.end').isISO8601().withMessage('Valid end date is required'),
  body('venue.name').trim().isLength({ min: 1 }).withMessage('Venue name is required'),
  body('venue.address.city').trim().isLength({ min: 1 }).withMessage('City is required'),
  body('venue.address.country').trim().isLength({ min: 1 }).withMessage('Country is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const eventData = {
      ...req.body,
      organizer: req.user._id
    };

    // Validate category exists
    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(400).json({ message: 'Category not found' });
    }

    // Validate date logic
    if (new Date(req.body.dateTime.start) >= new Date(req.body.dateTime.end)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const event = new Event(eventData);
    await event.save();

    await event.populate('organizer', 'name avatar');
    await event.populate('category', 'name slug color');

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error while creating event' });
  }
});

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private (Organizer/Admin)
router.put('/:id', auth, authorize('organizer', 'admin'), [
  body('title').optional().trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('category').optional().isMongoId().withMessage('Valid category is required'),
  body('dateTime.start').optional().isISO8601().withMessage('Valid start date is required'),
  body('dateTime.end').optional().isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user can update this event
    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate category if provided
    if (req.body.category) {
      const category = await Category.findById(req.body.category);
      if (!category) {
        return res.status(400).json({ message: 'Category not found' });
      }
    }

    // Validate date logic if dates are provided
    if (req.body.dateTime) {
      const startDate = req.body.dateTime.start ? new Date(req.body.dateTime.start) : event.dateTime.start;
      const endDate = req.body.dateTime.end ? new Date(req.body.dateTime.end) : event.dateTime.end;
      
      if (startDate >= endDate) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('organizer', 'name avatar')
      .populate('category', 'name slug color');

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error while updating event' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private (Organizer/Admin)
router.delete('/:id', auth, authorize('organizer', 'admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user can delete this event
    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error while deleting event' });
  }
});

// @route   POST /api/events/:id/like
// @desc    Like/unlike an event
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Toggle like (implement like logic based on your requirements)
    // This is a simplified version - you might want to create a separate likes collection
    
    res.json({ message: 'Event liked successfully' });
  } catch (error) {
    console.error('Like event error:', error);
    res.status(500).json({ message: 'Server error while liking event' });
  }
});

module.exports = router;
