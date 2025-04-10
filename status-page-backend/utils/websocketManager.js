/**
 * WebSocket manager for real-time updates
 */
let io;

/**
 * Initialize Socket.IO with HTTP server
 * @param {object} server - HTTP server instance
 * @returns {object} Socket.IO instance
 */
const initializeSocketIO = (server) => {
  io = require('socket.io')(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected', socket.id);
    
    // Join organization-specific room
    socket.on('join-organization', (organizationId) => {
      console.log(`Socket ${socket.id} joining org room: org-${organizationId}`);
      socket.join(`org-${organizationId}`);
    });
    
    // Join public status page room
    socket.on('join-public', (organizationDomain) => {
      console.log(`Socket ${socket.id} joining public room: public-${organizationDomain}`);
      socket.join(`public-${organizationDomain}`);
    });
    
    // Leave rooms
    socket.on('leave-organization', (organizationId) => {
      console.log(`Socket ${socket.id} leaving org room: org-${organizationId}`);
      socket.leave(`org-${organizationId}`);
    });
    
    socket.on('leave-public', (organizationDomain) => {
      console.log(`Socket ${socket.id} leaving public room: public-${organizationDomain}`);
      socket.leave(`public-${organizationDomain}`);
    });
    
    socket.on('disconnect', () => {
      console.log('User disconnected', socket.id);
    });
  });

  return io;
};

/**
 * Get Socket.IO instance
 * @returns {object} Socket.IO instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * Emit event to organization room
 * @param {string} organizationId - Organization ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
const emitToOrganization = (organizationId, event, data) => {
  try {
    getIO().to(`org-${organizationId}`).emit(event, data);
    console.log(`Emitted ${event} to org-${organizationId}`);
  } catch (error) {
    console.error('Socket emission error:', error);
  }
};

/**
 * Emit event to public status page room
 * @param {string} organizationDomain - Organization domain
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
const emitToPublic = (organizationDomain, event, data) => {
  try {
    getIO().to(`public-${organizationDomain}`).emit(event, data);
    console.log(`Emitted ${event} to public-${organizationDomain}`);
  } catch (error) {
    console.error('Socket emission error:', error);
  }
};

module.exports = {
  initializeSocketIO,
  getIO,
  emitToOrganization,
  emitToPublic
};
