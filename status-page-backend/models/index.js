// models/index.js
const Organization = require('./Organization');
const TeamMember = require('./TeamMember');
const Service = require('./Service');
const Incident = require('./Incident');
const IncidentUpdate = require('./IncidentUpdate');
const Subscriber = require('./Subscriber'); // Optional

module.exports = {
  Organization,
  TeamMember,
  Service,
  Incident,
  IncidentUpdate,
  Subscriber // Optional
};
