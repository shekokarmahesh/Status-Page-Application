// models/IncidentUpdate.js
const mongoose = require('mongoose');

const incidentUpdateSchema = new mongoose.Schema({
  incidentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Incident',
    required: [true, 'Incident ID is required']
  },
  message: { 
    type: String, 
    required: [true, 'Update message is required'],
    trim: true
  },
  status: { 
    type: String, 
    enum: ['Investigating', 'Identified', 'Monitoring', 'Resolved'], 
    required: [true, 'Status is required']
  },
  createdBy: {
    type: String, // Clerk user ID
    required: [true, 'Creator ID is required']
  },
  isPublic: {
    type: Boolean,
    default: true // Whether the update is visible on the public status page
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: { createdAt: true, updatedAt: false } // Only track creation time
});

// Add indexes for faster queries
incidentUpdateSchema.index({ incidentId: 1 });
incidentUpdateSchema.index({ incidentId: 1, createdAt: -1 });

module.exports = mongoose.model('IncidentUpdate', incidentUpdateSchema);
