const { Service, Organization } = require('../models');
const { formatResponse } = require('../utils/responseFormatter');
const { emitToOrganization, emitToPublic } = require('../utils/websocketManager');

/**
 * @desc    Create a new service
 * @route   POST /api/services
 * @access  Private/Editor
 */
const createService = async (req, res) => {
  try {
    const { name, description, group, isPublic, organizationId } = req.body;

    // Verify organization exists
    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return res.status(404).json(formatResponse(false, null, 'Organization not found'));
    }

    // Get count of existing services to set order
    const servicesCount = await Service.countDocuments({ organizationId });

    const service = await Service.create({
      name,
      description,
      group: group || 'Default',
      isPublic: isPublic !== undefined ? isPublic : true,
      organizationId,
      order: servicesCount
    });

    // Emit socket event
    emitToOrganization(organizationId, 'service-created', { service });

    res.status(201).json(formatResponse(true, { service }, 'Service created successfully'));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

/**
 * @desc    Get services for an organization
 * @route   GET /api/organizations/:organizationId/services
 * @access  Private/OrgMember
 */
const getOrganizationServices = async (req, res) => {
  try {
    const { organizationId } = req.params;

    const services = await Service.find({ organizationId })
      .sort({ group: 1, order: 1 });

    res.json(formatResponse(true, { services }));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

/**
 * @desc    Get service by ID
 * @route   GET /api/services/:serviceId
 * @access  Private/OrgMember
 */
const getServiceById = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json(formatResponse(false, null, 'Service not found'));
    }

    res.json(formatResponse(true, { service }));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

/**
 * @desc    Update service
 * @route   PUT /api/services/:serviceId
 * @access  Private/Editor
 */
const updateService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { name, description, group, isPublic, order } = req.body;

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json(formatResponse(false, null, 'Service not found'));
    }

    // Update fields
    if (name) service.name = name;
    if (description !== undefined) service.description = description;
    if (group) service.group = group;
    if (isPublic !== undefined) service.isPublic = isPublic;
    if (order !== undefined) service.order = order;

    await service.save();

    // Emit socket event
    emitToOrganization(service.organizationId, 'service-updated', { service });

    res.json(formatResponse(true, { service }, 'Service updated successfully'));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

/**
 * @desc    Update service status
 * @route   PUT /api/services/:serviceId/status
 * @access  Private/Editor
 */
const updateServiceStatus = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { status } = req.body;

    const service = await Service.findById(serviceId).populate('organizationId', 'domain');

    if (!service) {
      return res.status(404).json(formatResponse(false, null, 'Service not found'));
    }

    // Update status
    service.status = status;

    // Add to uptime history
    service.uptimeHistory.push({
      date: new Date(),
      status,
      duration: 0 // This would be calculated when the status changes again
    });

    await service.save();

    // Emit socket events
    emitToOrganization(service.organizationId, 'status-update', { 
      serviceId: service._id,
      status
    });

    emitToPublic(service.organizationId.domain, 'status-update', { 
      serviceId: service._id,
      status
    });

    res.json(formatResponse(true, { service }, 'Service status updated successfully'));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

/**
 * @desc    Delete service
 * @route   DELETE /api/services/:serviceId
 * @access  Private/Admin
 */
const deleteService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json(formatResponse(false, null, 'Service not found'));
    }

    await Service.deleteOne({ _id: serviceId });

    // Emit socket event
    emitToOrganization(service.organizationId, 'service-deleted', { serviceId });

    res.json(formatResponse(true, null, 'Service deleted successfully'));
  } catch (error) {
    res.status(400).json(formatResponse(false, null, error.message));
  }
};

module.exports = {
  createService,
  getOrganizationServices,
  getServiceById,
  updateService,
  updateServiceStatus,
  deleteService
};
