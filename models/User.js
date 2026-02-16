const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'organizer', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }]
  },
  wallet: {
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    transactions: [{
      type: {
        type: String,
        enum: ['credit', 'debit', 'refund'],
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
      },
      paymentMethod: {
        type: String,
        enum: ['stripe', 'paypal', 'bank_transfer', 'wallet', 'refund'],
        default: 'wallet'
      },
      transactionId: String,
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'completed'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Wallet methods
userSchema.methods.addToWallet = function(amount, description, paymentMethod = 'wallet', bookingId = null) {
  this.wallet.balance += amount;
  this.wallet.transactions.push({
    type: 'credit',
    amount,
    description,
    paymentMethod,
    bookingId,
    status: 'completed'
  });
  return this.save();
};

userSchema.methods.deductFromWallet = function(amount, description, bookingId = null) {
  if (this.wallet.balance < amount) {
    throw new Error('Insufficient wallet balance');
  }
  this.wallet.balance -= amount;
  this.wallet.transactions.push({
    type: 'debit',
    amount,
    description,
    paymentMethod: 'wallet',
    bookingId,
    status: 'completed'
  });
  return this.save();
};

userSchema.methods.refundToWallet = function(amount, description, bookingId = null) {
  this.wallet.balance += amount;
  this.wallet.transactions.push({
    type: 'refund',
    amount,
    description,
    paymentMethod: 'refund',
    bookingId,
    status: 'completed'
  });
  return this.save();
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.verificationToken;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  return user;
};

module.exports = mongoose.model('User', userSchema);
