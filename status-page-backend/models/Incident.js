// models/Incident.js
const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Incident title is required'],
    trim: true
  },
  description: { 
    type: String, 
    required: [true, 'Incident description is required'],
    trim: true
  },
  type: { 
    type: String, 
    enum: ['Incident', 'Maintenance'], 
    required: [true, 'Incident type is required']
  },
  status: { 
    type: String, 
    enum: ['Investigating', 'Identified', 'Monitoring', 'Resolved'], 
    default: 'Investigating' 
  },
  impact: { 
    type: String, 
    enum: ['None', 'Minor', 'Major', 'Critical'], 
    default: 'Minor' 
  },
  affectedServices: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service' 
  }],
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization',
    required: [true, 'Organization ID is required']
  },
  createdBy: {
    type: String, // Clerk user ID
    required: [true, 'Creator ID is required']
  },
  scheduledFor: { 
    type: Date // For maintenance only
  },
  scheduledUntil: { 
    type: Date // For maintenance only
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  isPublic: {
    type: Boolean,
    default: true // Whether the incident is visible on the public status page
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

// Add indexes for faster queries
incidentSchema.index({ organizationId: 1 });
incidentSchema.index({ organizationId: 1, status: 1 });
incidentSchema.index({ organizationId: 1, type: 1 });
incidentSchema.index({ 'affectedServices': 1 });

module.exports = mongoose.model('Incident', incidentSchema);
