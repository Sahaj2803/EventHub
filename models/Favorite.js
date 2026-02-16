const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  }
}, {
  timestamps: true
});

// Ensure unique combination of user and event
favoriteSchema.index({ user: 1, event: 1 }, { unique: true });

// Index for better query performance
favoriteSchema.index({ user: 1 });
favoriteSchema.index({ event: 1 });

module.exports = mongoose.model('Favorite', favoriteSchema);
