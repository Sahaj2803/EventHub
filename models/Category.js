const mongoose = require('mongoose');

const slugifyCategoryName = (name = '') => name
  .toLowerCase()
  .replace(/[^a-z0-9 -]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-+|-+$/g, '');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: ''
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  image: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  eventCount: {
    type: Number,
    default: 0
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Ensure slug exists before validation runs on new documents.
categorySchema.pre('validate', function(next) {
  if (this.isModified('name')) {
    this.slug = slugifyCategoryName(this.name);
  }
  next();
});

// Keep slug in sync when categories are renamed through update queries.
categorySchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();

  if (!update) {
    return next();
  }

  const nextName = update.name ?? update.$set?.name;
  if (!nextName) {
    return next();
  }

  const slug = slugifyCategoryName(nextName);
  if (update.$set) {
    update.$set.slug = slug;
  } else {
    update.slug = slug;
  }

  next();
});

// Index for better search performance
categorySchema.index({ name: 'text', description: 'text' });
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);
