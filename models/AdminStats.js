const mongoose = require('mongoose');

const adminStatsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'global'
  },
  dashboard: {
    resetAt: {
      type: Date,
      default: null
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminStats', adminStatsSchema);
