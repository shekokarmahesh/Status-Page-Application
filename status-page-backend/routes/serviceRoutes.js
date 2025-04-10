const express = require('express');
const router = express.Router();
const { 
  createService, 
  getOrganizationServices, 
  getServiceById, 
  updateService, 
  updateServiceStatus, 
  deleteService 
} = require('../controllers/serviceController');
const { 
  requireAuth, 
  requireOrgMember, 
  requireEditor, 
  requireAdmin 
} = require('../middleware/authMiddleware');
const { 
  validateService, 
  validateServiceStatus 
} = require('../middleware/validationMiddleware');

// Create service
router.post(
  '/', 
  requireAuth, 
  requireEditor, 
  validateService, 
  createService
);

// Get services for organization
router.get(
  '/organizations/:organizationId/services', 
  requireAuth, 
  requireOrgMember, 
  getOrganizationServices
);

// Get service by ID
router.get(
  '/:serviceId', 
  requireAuth, 
  getServiceById
);

// Update service
router.put(
  '/:serviceId', 
  requireAuth, 
  requireEditor, 
  validateService, 
  updateService
);

// Update service status
router.put(
  '/:serviceId/status', 
  requireAuth, 
  requireEditor, 
  validateServiceStatus, 
  updateServiceStatus
);

// Delete service
router.delete(
  '/:serviceId', 
  requireAuth, 
  requireAdmin, 
  deleteService
);

module.exports = router;
