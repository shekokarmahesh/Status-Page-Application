const express = require('express');
const router = express.Router();
const { 
  createIncident, 
  getOrganizationIncidents, 
  getIncidentById, 
  updateIncident, 
  addIncidentUpdate, 
  deleteIncident 
} = require('../controllers/incidentController');
const { 
  requireAuth, 
  requireOrgMember, 
  requireEditor, 
  requireAdmin 
} = require('../middleware/authMiddleware');
const { 
  validateIncident, 
  validateIncidentUpdate 
} = require('../middleware/validationMiddleware');

// Create incident
router.post(
  '/', 
  requireAuth, 
  requireEditor, 
  validateIncident, 
  createIncident
);

// Get incidents for organization
router.get(
  '/organizations/:organizationId/incidents', 
  requireAuth, 
  requireOrgMember, 
  getOrganizationIncidents
);

// Get incident by ID
router.get(
  '/:incidentId', 
  requireAuth, 
  getIncidentById
);

// Update incident
router.put(
  '/:incidentId', 
  requireAuth, 
  requireEditor, 
  updateIncident
);

// Add incident update
router.post(
  '/:incidentId/updates', 
  requireAuth, 
  requireEditor, 
  validateIncidentUpdate, 
  addIncidentUpdate
);

// Delete incident
router.delete(
  '/:incidentId', 
  requireAuth, 
  requireAdmin, 
  deleteIncident
);

module.exports = router;
