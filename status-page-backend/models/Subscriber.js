// models/Subscriber.js
const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    trim: true,
    lowercase: true
  },
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization',
    required: [true, 'Organization ID is required']
  },
  verificationToken: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  subscriptionPreferences: {
    allServices: {
      type: Boolean,
      default: true
    },
    specificServices: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    }]
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Create compound index for email and organizationId to ensure a subscriber can only subscribe once per organization
subscriberSchema.index({ email: 1, organizationId: 1 }, { unique: true });
// Index for faster queries by organization
subscriberSchema.index({ organizationId: 1 });

module.exports = mongoose.model('Subscriber', subscriberSchema);
