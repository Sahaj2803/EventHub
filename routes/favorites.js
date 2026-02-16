const express = require('express');
const Favorite = require('../models/Favorite');
const Event = require('../models/Event');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/favorites
// @desc    Get user's favorite events
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const favorites = await Favorite.find({ user: req.user._id })
      .populate({
        path: 'event',
        populate: {
          path: 'category',
          select: 'name slug color'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Favorite.countDocuments({ user: req.user._id });

    res.json({
      favorites: favorites.map(fav => ({
        _id: fav._id,
        event: fav.event,
        createdAt: fav.createdAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalFavorites: total
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Server error while fetching favorites' });
  }
});

// @route   POST /api/favorites/:eventId
// @desc    Add event to favorites
// @access  Private
router.post('/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      user: req.user._id,
      event: eventId
    });

    if (existingFavorite) {
      return res.status(400).json({ message: 'Event already in favorites' });
    }

    // Create favorite
    const favorite = new Favorite({
      user: req.user._id,
      event: eventId
    });

    await favorite.save();
    await favorite.populate({
      path: 'event',
      populate: {
        path: 'category',
        select: 'name slug color'
      }
    });

    res.status(201).json({
      message: 'Event added to favorites',
      favorite: {
        _id: favorite._id,
        event: favorite.event,
        createdAt: favorite.createdAt
      }
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ message: 'Server error while adding favorite' });
  }
});

// @route   DELETE /api/favorites/:eventId
// @desc    Remove event from favorites
// @access  Private
router.delete('/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      user: req.user._id,
      event: eventId
    });

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.json({ message: 'Event removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ message: 'Server error while removing favorite' });
  }
});

// @route   GET /api/favorites/check/:eventId
// @desc    Check if event is favorited by user
// @access  Private
router.get('/check/:eventId', auth, async (req, res) => {
  try {
    const { eventId } = req.params;

    const favorite = await Favorite.findOne({
      user: req.user._id,
      event: eventId
    });

    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ message: 'Server error while checking favorite' });
  }
});

// @route   DELETE /api/favorites
// @desc    Clear all favorites for user
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    await Favorite.deleteMany({ user: req.user._id });

    res.json({ message: 'All favorites cleared' });
  } catch (error) {
    console.error('Clear favorites error:', error);
    res.status(500).json({ message: 'Server error while clearing favorites' });
  }
});

module.exports = router;
