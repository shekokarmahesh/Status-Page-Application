const express = require('express');
const router = express.Router();
const { 
  createOrganization, 
  getUserOrganizations, 
  getOrganizationById, 
  updateOrganization, 
  deleteOrganization 
} = require('../controllers/organizationController');
const { 
  requireAuth, 
  requireAdmin 
} = require('../middleware/authMiddleware');
const { 
  validateOrganization, 
  validateObjectId 
} = require('../middleware/validationMiddleware');

// Get all organizations for current user
router.get('/', requireAuth, getUserOrganizations);

// Create new organization
router.post('/', requireAuth, validateOrganization, createOrganization);

// Get organization by ID
router.get('/:organizationId', requireAuth, getOrganizationById);

// Update organization
router.put(
  '/:organizationId', 
  requireAuth, 
  requireAdmin, 
  validateOrganization, 
  updateOrganization
);

// Delete organization
router.delete(
  '/:organizationId', 
  requireAuth, 
  requireAdmin, 
  deleteOrganization
);

module.exports = router;
