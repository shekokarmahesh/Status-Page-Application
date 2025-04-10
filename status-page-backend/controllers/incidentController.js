const { Incident, IncidentUpdate, Service, Organization } = require('../models');
const { formatResponse } = require('../utils/responseFormatter');
const { emitToOrganization, emitToPublic } = require('../utils/websocketManager');

/**
 * @desc    Create a new incident
 * @route   POST /api/incidents
 * @access  Private/Editor
 */
const createIncident = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      type, 
      status, 
      impact, 
      affectedServices, 
      organizationId,
      isPublic,
      scheduledFor,
      scheduledUntil
    } = req.body;
    
    const userId = req.auth.userId;
    
    // Verify organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json(formatResponse(false, null, 'Organization not found'));
    }
    
    // Create incident
    const incident = await Incident.create({
      title,
      description,
      type,
      status,
      impact,
      affectedServices,
      organizationId,
      createdBy: userId,
      isPublic: isPublic !== undefined ? isPublic : true,
      scheduledFor: type === 'Maintenance' ? scheduledFor : undefined,
      scheduledUntil: type === 'Maintenance' ? scheduledUntil : undefined
    });
    
    // Create initial update
    await IncidentUpdate.create({
      incidentId: incident._id,
      message: description,
      status,
      createdBy: userId,
      isPublic: isPublic !== undefined ? isPublic : true
    });
    
    // Update affected services status if this is an incident (not maintenance)
    if (type === 'Incident' && affectedServices && affectedServices.length > 0) {
      let serviceStatus;
      
      // Determine service status based on incident impact
      switch (impact) {
        case 'Critical':
          serviceStatus = 'Major Outage';
          break;
        case 'Major':
          serviceStatus = 'Partial Outage';
          break;
        case 'Minor':
          serviceStatus = 'Degraded Performance';
          break;
        default:
          serviceStatus = 'Operational';
      }
      
      // Update each affected service
      for (const serviceId of affectedServices) {
        const service = await Service.findById(serviceId);
        if (service) {
          service.status = serviceStatus;
          service.uptimeHistory.push({
            date: new Date(),
            status: serviceStatus,
            duration: 0
          });
          await service.save();
          
          // Emit socket events for service status update
          emitToOrganization(organizationId, 'status-update', { 
            serviceId: service._id,
            status: serviceStatus
          });
          
          emitToPublic(organization.domain, 'status-update', { 
            serviceId: service._id,
            status: serviceStatus
          });
        }
      }
    }
    
    // Emit socket events for new incident
    emitToOrganization(organizationId, 'incident-created', { incident });
    
    if (isPublic !== false) {
      emitToPublic(organization.domain, 'incident-created', { incident });
    }
    
    res.status(201).json(formatResponse(true, { incident }, 'Incident created successfully'));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

/**
 * @desc    Get incidents for an organization
 * @route   GET /api/organizations/:organizationId/incidents
 * @access  Private/OrgMember
 */
const getOrganizationIncidents = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { type, status, limit = 20, page = 1 } = req.query;
    
    // Build query
    const query = { organizationId };
    
    if (type) {
      query.type = type;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get incidents
    const incidents = await Incident.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('affectedServices', 'name status');
    
    // Get total count
    const total = await Incident.countDocuments(query);
    
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
 * @desc    Get incident by ID
 * @route   GET /api/incidents/:incidentId
 * @access  Private/OrgMember
 */
const getIncidentById = async (req, res) => {
  try {
    const { incidentId } = req.params;
    
    const incident = await Incident.findById(incidentId)
      .populate('affectedServices', 'name status');
    
    if (!incident) {
      return res.status(404).json(formatResponse(false, null, 'Incident not found'));
    }
    
    // Get updates
    const updates = await IncidentUpdate.find({ incidentId })
      .sort({ createdAt: 1 });
    
    res.json(formatResponse(true, { incident, updates }));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

/**
 * @desc    Update incident
 * @route   PUT /api/incidents/:incidentId
 * @access  Private/Editor
 */
const updateIncident = async (req, res) => {
  try {
    const { incidentId } = req.params;
    const { 
      title, 
      type, 
      impact, 
      affectedServices, 
      isPublic,
      scheduledFor,
      scheduledUntil
    } = req.body;
    
    const incident = await Incident.findById(incidentId);
    
    if (!incident) {
      return res.status(404).json(formatResponse(false, null, 'Incident not found'));
    }
    
    // Update fields
    if (title) incident.title = title;
    if (type) incident.type = type;
    if (impact) incident.impact = impact;
    if (affectedServices) incident.affectedServices = affectedServices;
    if (isPublic !== undefined) incident.isPublic = isPublic;
    
    if (type === 'Maintenance') {
      if (scheduledFor) incident.scheduledFor = scheduledFor;
      if (scheduledUntil) incident.scheduledUntil = scheduledUntil;
    }
    
    await incident.save();
    
    // Emit socket events
    emitToOrganization(incident.organizationId, 'incident-updated', { incident });
    
    if (incident.isPublic) {
      const organization = await Organization.findById(incident.organizationId);
      emitToPublic(organization.domain, 'incident-updated', { incident });
    }
    
    res.json(formatResponse(true, { incident }, 'Incident updated successfully'));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

/**
 * @desc    Add incident update
 * @route   POST /api/incidents/:incidentId/updates
 * @access  Private/Editor
 */
const addIncidentUpdate = async (req, res) => {
  try {
    const { incidentId } = req.params;
    const { message, status, isPublic } = req.body;
    const userId = req.auth.userId;
    
    const incident = await Incident.findById(incidentId)
      .populate('organizationId', 'domain');
    
    if (!incident) {
      return res.status(404).json(formatResponse(false, null, 'Incident not found'));
    }
    
    // Create update
    const update = await IncidentUpdate.create({
      incidentId,
      message,
      status,
      createdBy: userId,
      isPublic: isPublic !== undefined ? isPublic : incident.isPublic
    });
    
    // Update incident status
    incident.status = status;
    
    // If resolved, set resolvedAt
    if (status === 'Resolved' && !incident.resolvedAt) {
      incident.resolvedAt = new Date();
      
      // If this is an incident (not maintenance), update affected services back to operational
      if (incident.type === 'Incident' && incident.affectedServices && incident.affectedServices.length > 0) {
        for (const serviceId of incident.affectedServices) {
          const service = await Service.findById(serviceId);
          if (service) {
            service.status = 'Operational';
            service.uptimeHistory.push({
              date: new Date(),
              status: 'Operational',
              duration: 0
            });
            await service.save();
            
            // Emit socket events for service status update
            emitToOrganization(incident.organizationId, 'status-update', { 
              serviceId: service._id,
              status: 'Operational'
            });
            
            emitToPublic(incident.organizationId.domain, 'status-update', { 
              serviceId: service._id,
              status: 'Operational'
            });
          }
        }
      }
    }
    
    await incident.save();
    
    // Emit socket events
    emitToOrganization(incident.organizationId, 'incident-update', { 
      incidentId: incident._id,
      update,
      status: incident.status
    });
    
    if (update.isPublic) {
      emitToPublic(incident.organizationId.domain, 'incident-update', { 
        incidentId: incident._id,
        update,
        status: incident.status
      });
    }
    
    res.status(201).json(formatResponse(true, { update }, 'Update added successfully'));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

/**
 * @desc    Delete incident
 * @route   DELETE /api/incidents/:incidentId
 * @access  Private/Admin
 */
const deleteIncident = async (req, res) => {
  try {
    const { incidentId } = req.params;
    
    const incident = await Incident.findById(incidentId);
    
    if (!incident) {
      return res.status(404).json(formatResponse(false, null, 'Incident not found'));
    }
    
    // Delete incident and all updates
    await Incident.deleteOne({ _id: incidentId });
    await IncidentUpdate.deleteMany({ incidentId });
    
    // Emit socket event
    emitToOrganization(incident.organizationId, 'incident-deleted', { incidentId });
    
    res.json(formatResponse(true, null, 'Incident deleted successfully'));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

module.exports = {
  createIncident,
  getOrganizationIncidents,
  getIncidentById,
  updateIncident,
  addIncidentUpdate,
  deleteIncident
};
