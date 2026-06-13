const ApiResponse = require('./response');
const SecurityUtils = require('./security');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('Request error:', SecurityUtils.sanitizeForLogging(error));

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server error. Please try again later.';
    const code = error.code || 'INTERNAL_ERROR';

    ApiResponse.error(res, message, statusCode, code);
  });
};

module.exports = asyncHandler;
