// models/Service.js
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Service name is required'],
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization',
    required: [true, 'Organization ID is required']
  },
  status: { 
    type: String, 
    enum: ['Operational', 'Degraded Performance', 'Partial Outage', 'Major Outage'],
    default: 'Operational'
  },
  group: {
    type: String,
    default: 'Default' // Services can be grouped (e.g., "API Services", "Frontend", etc.)
  },
  isPublic: {
    type: Boolean,
    default: true // Whether the service is visible on the public status page
  },
  order: {
    type: Number,
    default: 0 // For custom ordering of services
  },
  uptimeHistory: [{
    date: Date,
    status: String,
    duration: Number // Duration in minutes
  }],
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

// Add indexes for faster queries
serviceSchema.index({ organizationId: 1 });
serviceSchema.index({ organizationId: 1, group: 1 });

module.exports = mongoose.model('Service', serviceSchema);
