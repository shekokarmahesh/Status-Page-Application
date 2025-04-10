// models/TeamMember.js
const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: [true, 'Clerk user ID is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization',
    required: [true, 'Organization ID is required']
  },
  role: { 
    type: String, 
    enum: ['Admin', 'Editor', 'Viewer'], 
    default: 'Viewer' 
  },
  inviteAccepted: {
    type: Boolean,
    default: false
  },
  inviteToken: {
    type: String,
    default: null
  },
  lastActive: {
    type: Date,
    default: null
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

// Create compound index for userId and organizationId to ensure a user can only have one role per organization
teamMemberSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
// Index for faster queries by organization
teamMemberSchema.index({ organizationId: 1 });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
