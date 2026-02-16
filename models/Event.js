const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxlength: 200
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  tags: [String],
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  venue: {
    name: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    capacity: Number,
    amenities: [String]
  },
  dateTime: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  pricing: {
    isFree: {
      type: Boolean,
      default: false
    },
    currency: {
      type: String,
      default: 'USD'
    },
    tiers: [{
      name: String,
      price: Number,
      description: String,
      quantity: Number,
      sold: { type: Number, default: 0 }
    }]
  },
  capacity: {
    total: Number,
    available: Number,
    sold: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'public'
  },
  requirements: {
    ageRestriction: Number,
    dressCode: String,
    itemsToBring: [String],
    restrictions: [String]
  },
  socialLinks: {
    website: String,
    facebook: String,
    twitter: String,
    instagram: String,
    linkedin: String
  },
  analytics: {
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 }
  },
  revenue: {
    totalRevenue: { type: Number, default: 0 },
    platformRevenue: { type: Number, default: 0 },
    organizerRevenue: { type: Number, default: 0 },
    totalTicketsSold: { type: Number, default: 0 }
  },
  featured: {
    type: Boolean,
    default: false
  },
  featuredUntil: Date
}, {
  timestamps: true
});

// Index for better search performance
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ 'dateTime.start': 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ status: 1, visibility: 1 });

// Virtual for checking if event is sold out
eventSchema.virtual('isSoldOut').get(function() {
  return this.capacity && this.capacity.sold >= this.capacity.total;
});

// Virtual for checking if event is upcoming
eventSchema.virtual('isUpcoming').get(function() {
  return new Date() < this.dateTime.start;
});

// Virtual for checking if event is past
eventSchema.virtual('isPast').get(function() {
  return new Date() > this.dateTime.end;
});

// Virtual for checking if event is live
eventSchema.virtual('isLive').get(function() {
  const now = new Date();
  return now >= this.dateTime.start && now <= this.dateTime.end;
});

module.exports = mongoose.model('Event', eventSchema);
