const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Middleware to check if validation errors exist
 */
const checkValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }
  next();
};

/**
 * Validate organization creation/update
 */
const validateOrganization = [
  body('name')
    .trim()
    .notEmpty().withMessage('Organization name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('domain')
    .trim()
    .notEmpty().withMessage('Domain is required')
    .isLength({ min: 2, max: 100 }).withMessage('Domain must be between 2 and 100 characters')
    .matches(/^[a-zA-Z0-9-]+$/).withMessage('Domain can only contain letters, numbers, and hyphens'),
  checkValidationErrors
];

/**
 * Validate team member invite/update
 */
const validateTeamMember = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('role')
    .trim()
    .notEmpty().withMessage('Role is required')
    .isIn(['Admin', 'Editor', 'Viewer']).withMessage('Invalid role'),
  checkValidationErrors
];

/**
 * Validate service creation/update
 */
const validateService = [
  body('name')
    .trim()
    .notEmpty().withMessage('Service name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('organizationId')
    .if(body('organizationId').exists())
    .custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid organization ID'),
  checkValidationErrors
];

/**
 * Validate service status update
 */
const validateServiceStatus = [
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['Operational', 'Degraded Performance', 'Partial Outage', 'Major Outage'])
    .withMessage('Invalid status'),
  checkValidationErrors
];

/**
 * Validate incident creation/update
 */
const validateIncident = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 2, max: 200 }).withMessage('Title must be between 2 and 200 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required'),
  body('type')
    .trim()
    .notEmpty().withMessage('Type is required')
    .isIn(['Incident', 'Maintenance']).withMessage('Invalid type'),
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['Investigating', 'Identified', 'Monitoring', 'Resolved']).withMessage('Invalid status'),
  body('impact')
    .trim()
    .notEmpty().withMessage('Impact is required')
    .isIn(['None', 'Minor', 'Major', 'Critical']).withMessage('Invalid impact'),
  body('organizationId')
    .if(body('organizationId').exists())
    .custom(value => mongoose.Types.ObjectId.isValid(value)).withMessage('Invalid organization ID'),
  body('affectedServices')
    .isArray().withMessage('Affected services must be an array')
    .custom(services => {
      if (!services.every(service => mongoose.Types.ObjectId.isValid(service))) {
        throw new Error('Invalid service ID in affected services');
      }
      return true;
    }),
  checkValidationErrors
];

/**
 * Validate incident update
 */
const validateIncidentUpdate = [
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required'),
  body('status')
    .trim()
    .notEmpty().withMessage('Status is required')
    .isIn(['Investigating', 'Identified', 'Monitoring', 'Resolved']).withMessage('Invalid status'),
  checkValidationErrors
];

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = [
  param('id').custom(value => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid ID format');
    }
    return true;
  }),
  checkValidationErrors
];

module.exports = {
  validateOrganization,
  validateTeamMember,
  validateService,
  validateServiceStatus,
  validateIncident,
  validateIncidentUpdate,
  validateObjectId,
  checkValidationErrors
};
