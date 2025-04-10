const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const { TeamMember } = require('../models');

// Basic authentication middleware
const requireAuth = ClerkExpressRequireAuth({});

// Check if user is a member of the organization
const requireOrgMember = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const { organizationId } = req.params;
    
    const teamMember = await TeamMember.findOne({ userId, organizationId });
    
    if (!teamMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not a member of this organization' 
      });
    }
    
    // Add team member to request object
    req.teamMember = teamMember;
    next();
  } catch (error) {
    next(error);
  }
};

// Check if user has admin role in the organization
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const { organizationId } = req.params;
    
    const teamMember = await TeamMember.findOne({ userId, organizationId });
    
    if (!teamMember || teamMember.role !== 'Admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin privileges required' 
      });
    }
    
    // Add team member to request object
    req.teamMember = teamMember;
    next();
  } catch (error) {
    next(error);
  }
};

// Check if user has admin or editor role
const requireEditor = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const { organizationId } = req.params;
    
    const teamMember = await TeamMember.findOne({ userId, organizationId });
    
    if (!teamMember || (teamMember.role !== 'Admin' && teamMember.role !== 'Editor')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Editor privileges required' 
      });
    }
    
    // Add team member to request object
    req.teamMember = teamMember;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireAuth, requireOrgMember, requireAdmin, requireEditor };
