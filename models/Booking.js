const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  tickets: [{
    tier: {
      name: String,
      price: Number
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    totalPrice: Number
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'bank_transfer', 'cash', 'wallet'],
    default: 'stripe'
  },
  paymentIntentId: String,
  transactionId: String,
  bookingReference: {
    type: String,
    unique: true,
    required: true
  },
  attendeeInfo: {
    name: String,
    email: String,
    phone: String,
    specialRequirements: String
  },
  qrCode: String,
  checkInStatus: {
    type: String,
    enum: ['not_checked_in', 'checked_in', 'no_show'],
    default: 'not_checked_in'
  },
  checkInTime: Date,
  refundRequest: {
    requested: { type: Boolean, default: false },
    reason: String,
    requestedAt: Date,
    processedAt: Date,
    amount: Number
  },
  notes: String
}, {
  timestamps: true
});

// Generate unique booking reference
bookingSchema.pre('save', async function(next) {
  if (!this.bookingReference) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.bookingReference = `EVT-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Index for better query performance
bookingSchema.index({ user: 1 });
bookingSchema.index({ event: 1 });
bookingSchema.index({ bookingReference: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ paymentStatus: 1 });

// Virtual for total tickets
bookingSchema.virtual('totalTickets').get(function() {
  return this.tickets.reduce((total, ticket) => total + ticket.quantity, 0);
});

module.exports = mongoose.model('Booking', bookingSchema);
