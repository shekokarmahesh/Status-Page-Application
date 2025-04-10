const express = require('express');
const router = express.Router();
const { 
  getPublicStatus, 
  getPublicIncidents, 
  getPublicIncidentById 
} = require('../controllers/publicController');

// Get public status page
router.get(
  '/:domain/status', 
  getPublicStatus
);

// Get public incident history
router.get(
  '/:domain/incidents', 
  getPublicIncidents
);

// Get public incident details
router.get(
  '/:domain/incidents/:incidentId', 
  getPublicIncidentById
);

module.exports = router;
