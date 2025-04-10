const { TeamMember } = require('../models');
const { formatResponse } = require('../utils/responseFormatter');
const crypto = require('crypto');

/**
 * @desc    Get team members for an organization
 * @route   GET /api/organizations/:organizationId/team
 * @access  Private/OrgMember
 */
const getTeamMembers = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const teamMembers = await TeamMember.find({ organizationId })
      .select('-inviteToken');
    
    res.json(formatResponse(true, { teamMembers }));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

/**
 * @desc    Add a team member (invite)
 * @route   POST /api/organizations/:organizationId/team
 * @access  Private/Admin
 */
const inviteTeamMember = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { email, name, role } = req.body;
    
    // Generate invite token
    const inviteToken = crypto.randomBytes(20).toString('hex');
    
    // Check if member already exists
    const existingMember = await TeamMember.findOne({ 
      organizationId, 
      email 
    });
    
    if (existingMember) {
      return res.status(400).json(formatResponse(false, null, 'Team member already exists'));
    }
    
    const teamMember = await TeamMember.create({
      userId: null, // Will be set when the user accepts the invite
      email,
      name,
      organizationId,
      role,
      inviteAccepted: false,
      inviteToken
    });
    
    // In a real app, you would send an email with the invite link here
    // For now, we'll just return the invite token in the response
    
    res.status(201).json(formatResponse(true, { 
      teamMember: {
        _id: teamMember._id,
        email: teamMember.email,
        name: teamMember.name,
        role: teamMember.role,
        inviteAccepted: teamMember.inviteAccepted,
        inviteToken: teamMember.inviteToken // In production, don't expose this
      }
    }, 'Invitation sent successfully'));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

/**
 * @desc    Accept team invitation
 * @route   POST /api/organizations/invites/:token
 * @access  Private
 */
const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.auth.userId;
    const userEmail = req.auth.sessionClaims.email;
    
    const teamMember = await TeamMember.findOne({ 
      inviteToken: token,
      inviteAccepted: false
    });
    
    if (!teamMember) {
      return res.status(404).json(formatResponse(false, null, 'Invalid or expired invitation'));
    }
    
    // Verify the email matches
    if (teamMember.email.toLowerCase() !== userEmail.toLowerCase()) {
      return res.status(403).json(formatResponse(false, null, 'This invitation is for a different email address'));
    }
    
    // Update the team member
    teamMember.userId = userId;
    teamMember.inviteAccepted = true;
    teamMember.inviteToken = null;
    teamMember.lastActive = new Date();
    
    await teamMember.save();
    
    res.json(formatResponse(true, { 
      organizationId: teamMember.organizationId 
    }, 'Invitation accepted successfully'));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

/**
 * @desc    Update team member role
 * @route   PUT /api/organizations/:organizationId/team/:memberId
 * @access  Private/Admin
 */
const updateTeamMember = async (req, res) => {
  try {
    const { organizationId, memberId } = req.params;
    const { role } = req.body;
    
    const teamMember = await TeamMember.findOne({ 
      _id: memberId,
      organizationId 
    });
    
    if (!teamMember) {
      return res.status(404).json(formatResponse(false, null, 'Team member not found'));
    }
    
    // Prevent changing your own role if you're an admin
    if (teamMember.userId === req.auth.userId) {
      return res.status(400).json(formatResponse(false, null, 'You cannot change your own role'));
    }
    
    teamMember.role = role;
    await teamMember.save();
    
    res.json(formatResponse(true, { teamMember }, 'Team member updated successfully'));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
}

