const { Organization, TeamMember } = require('../models');
const { formatResponse } = require('../utils/responseFormatter');

/**
 * @desc    Create a new organization
 * @route   POST /api/organizations
 * @access  Private
 */
const createOrganization = async (req, res) => {
  try {
    const { name, domain, logo, brandColor } = req.body;
    const userId = req.auth.userId;
    const userEmail = req.auth.sessionClaims.email;
    const firstName = req.auth.sessionClaims.firstName || '';
    const lastName = req.auth.sessionClaims.lastName || '';
    const userName = `${firstName} ${lastName}`.trim();

    // Check if domain already exists
    const existingOrg = await Organization.findOne({ domain });
    if (existingOrg) {
      return res.status(400).json(formatResponse(false, null, 'Domain already in use'));
    }

    // Create organization
    const organization = await Organization.create({
      name,
      domain,
      logo,
      brandColor: brandColor || '#0066FF'
    });

    // Add current user as admin
    await TeamMember.create({
      userId,
      email: userEmail,
      name: userName,
      organizationId: organization._id,
      role: 'Admin',
      inviteAccepted: true
    });

    res.status(201).json(formatResponse(true, { organization }, 'Organization created successfully'));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

/**
 * @desc    Get organizations for current user
 * @route   GET /api/organizations
 * @access  Private
 */
const getUserOrganizations = async (req, res) => {
  try {
    const userId = req.auth.userId;
    
    // Find all team memberships for the user
    const teamMemberships = await TeamMember.find({ userId }).populate('organizationId');
    
    // Extract organizations
    const organizations = teamMemberships
      .filter(membership => membership.organizationId) // Filter out any null references
      .map(membership => ({
        _id: membership.organizationId._id,
        name: membership.organizationId.name,
        domain: membership.organizationId.domain,
        logo: membership.organizationId.logo,
        brandColor: membership.organizationId.brandColor,
        role: membership.role
      }));
    
    res.json(formatResponse(true, { organizations }));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

/**
 * @desc    Get organization by ID
 * @route   GET /api/organizations/:organizationId
 * @access  Private
 */
const getOrganizationById = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const organization = await Organization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json(formatResponse(false, null, 'Organization not found'));
    }
    
    res.json(formatResponse(true, { organization }));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

/**
 * @desc    Update organization
 * @route   PUT /api/organizations/:organizationId
 * @access  Private/Admin
 */
const updateOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { name, logo, brandColor, settings } = req.body;
    
    const organization = await Organization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json(formatResponse(false, null, 'Organization not found'));
    }
    
    // Update fields
    if (name) organization.name = name;
    if (logo !== undefined) organization.logo = logo;
    if (brandColor) organization.brandColor = brandColor;
    if (settings) {
      organization.settings = {
        ...organization.settings,
        ...settings
      };
    }
    
    await organization.save();
    
    res.json(formatResponse(true, { organization }, 'Organization updated successfully'));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

/**
 * @desc    Delete organization
 * @route   DELETE /api/organizations/:organizationId
 * @access  Private/Admin
 */
const deleteOrganization = async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const organization = await Organization.findById(organizationId);
    
    if (!organization) {
      return res.status(404).json(formatResponse(false, null, 'Organization not found'));
    }
    
    await Organization.deleteOne({ _id: organizationId });
    
    // Delete all related data (team members, services, incidents, etc.)
    await TeamMember.deleteMany({ organizationId });
    // You would also delete services, incidents, etc. here
    
    res.json(formatResponse(true, null, 'Organization deleted successfully'));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

module.exports = {
  createOrganization,
  getUserOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization
};
