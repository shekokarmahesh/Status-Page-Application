/**
 * Format response object
 * @param {boolean} success - Whether the request was successful
 * @param {object} data - Data to include in the response
 * @param {string} message - Optional message
 * @returns {object} Formatted response object
 */
const formatResponse = (success, data, message = null) => {
    const response = { success };
    
    if (data) {
      response.data = data;
    }
    
    if (message) {
      response.message = message;
    }
    
    return response;
  };
  
  module.exports = { formatResponse };
  