// models/Organization.js
const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Organization name is required'],
    trim: true
  },
  domain: { 
    type: String, 
    required: [true, 'Domain is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  logo: { 
    type: String,
    default: null
  },
  brandColor: {
    type: String,
    default: '#0066FF' // Default brand color
  },
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    publicEmail: {
      type: String,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    }
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
  timestamps: true // Automatically manage createdAt and updatedAt
});

// Add index for faster queries
organizationSchema.index({ domain: 1 });

module.exports = mongoose.model('Organization', organizationSchema);
