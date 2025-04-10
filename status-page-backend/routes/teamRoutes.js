const express = require('express');
const router = express.Router();
const { 
  getTeamMembers, 
  inviteTeamMember, 
  updateTeamMember, 
  removeTeamMember,
  acceptInvitation
} = require('../controllers/teamController');
const { 
  requireAuth, 
  requireOrgMember, 
  requireAdmin 
} = require('../middleware/authMiddleware');
const { 
  validateTeamMember 
} = require('../middleware/validationMiddleware');

// Accept invitation
router.post('/invites/:token', requireAuth, acceptInvitation);

// Get team members for organization
router.get(
  '/organizations/:organizationId/team', 
  requireAuth, 
  requireOrgMember, 
  getTeamMembers
);

// Invite team member
router.post(
  '/organizations/:organizationId/team', 
  requireAuth, 
  requireAdmin, 
  validateTeamMember, 
  inviteTeamMember
);

// Update team member role
router.put(
  '/organizations/:organizationId/team/:memberId', 
  requireAuth, 
  requireAdmin, 
  updateTeamMember
);

// Remove team member
router.delete(
  '/organizations/:organizationId/team/:memberId', 
  requireAuth, 
  requireAdmin, 
  removeTeamMember
);

module.exports = router;
