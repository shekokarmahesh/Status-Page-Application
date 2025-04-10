const { Organization, Service, Incident, IncidentUpdate } = require('../models');
const { formatResponse } = require('../utils/responseFormatter');

/**
 * @desc    Get public status page data
 * @route   GET /api/public/:domain/status
 * @access  Public
 */
const getPublicStatus = async (req, res) => {
  try {
    const { domain } = req.params;
    
    // Find organization by domain
    const organization = await Organization.findOne({ domain });
    
    if (!organization) {
      return res.status(404).json(formatResponse(false, null, 'Status page not found'));
    }
    
    // Get public services
    const services = await Service.find({ 
      organizationId: organization._id,
      isPublic: true
    }).sort({ group: 1, order: 1 });
    
    // Group services by group
    const serviceGroups = {};
    services.forEach(service => {
      if (!serviceGroups[service.group]) {
        serviceGroups[service.group] = [];
      }
      serviceGroups[service.group].push(service);
    });
    
    // Get active incidents (not resolved)
    const activeIncidents = await Incident.find({
      organizationId: organization._id,
      isPublic: true,
      status: { $ne: 'Resolved' }
    }).sort({ createdAt: -1 })
      .populate('affectedServices', 'name');
    
    // Get scheduled maintenance
    const scheduledMaintenance = await Incident.find({
      organizationId: organization._id,
      isPublic: true,
      type: 'Maintenance',
      status: { $ne: 'Resolved' },
      scheduledFor: { $exists: true }
    }).sort({ scheduledFor: 1 })
      .populate('affectedServices', 'name');
    
    // Calculate overall status
    let overallStatus = 'Operational';
    
    // If any service is not operational, update overall status
    for (const service of services) {
      if (service.status === 'Major Outage') {
        overallStatus = 'Major Outage';
        break;
      } else if (service.status === 'Partial Outage' && overallStatus !== 'Major Outage') {
        overallStatus = 'Partial Outage';
      } else if (service.status === 'Degraded Performance' && 
                overallStatus !== 'Major Outage' && 
                overallStatus !== 'Partial Outage') {
        overallStatus = 'Degraded Performance';
      }
    }
    
    res.json(formatResponse(true, { 
      organization: {
        name: organization.name,
        domain: organization.domain,
        logo: organization.logo,
        brandColor: organization.brandColor
      },
      overallStatus,
      serviceGroups,
      activeIncidents,
      scheduledMaintenance
    }));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

/**
 * @desc    Get public incident history
 * @route   GET /api/public/:domain/incidents
 * @access  Public
 */
const getPublicIncidents = async (req, res) => {
  try {
    const { domain } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Find organization by domain
    const organization = await Organization.findOne({ domain });
    
    if (!organization) {
      return res.status(404).json(formatResponse(false, null, 'Status page not found'));
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get resolved incidents
    const incidents = await Incident.find({
      organizationId: organization._id,
      isPublic: true,
      status: 'Resolved'
    }).sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('affectedServices', 'name');
    
    // Get total count
    const total = await Incident.countDocuments({
      organizationId: organization._id,
      isPublic: true,
      status: 'Resolved'
    });
    
    res.json(formatResponse(true, { 
      incidents,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    }));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

/**
 * @desc    Get public incident details
 * @route   GET /api/public/:domain/incidents/:incidentId
 * @access  Public
 */
const getPublicIncidentById = async (req, res) => {
  try {
    const { domain, incidentId } = req.params;
    
    // Find organization by domain
    const organization = await Organization.findOne({ domain });
    
    if (!organization) {
      return res.status(404).json(formatResponse(false, null, 'Status page not found'));
    }
    
    // Get incident
    const incident = await Incident.findOne({
      _id: incidentId,
      organizationId: organization._id,
      isPublic: true
    }).populate('affectedServices', 'name status');
    
    if (!incident) {
      return res.status(404).json(formatResponse(false, null, 'Incident not found'));
    }
    
    // Get updates
    const updates = await IncidentUpdate.find({ 
      incidentId,
      isPublic: true
    }).sort({ createdAt: 1 });
    
    res.json(formatResponse(true, { incident, updates }));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

module.exports = {
  getPublicStatus,
  getPublicIncidents,
  getPublicIncidentById
};
