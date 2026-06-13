// Unified response handler for consistent API responses
class ApiResponse {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static error(res, message, statusCode = 400, code = null, errors = null) {
    const response = {
      success: false,
      message
    };
    if (code) response.code = code;
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  }

  static validationError(res, errors) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
}

module.exports = ApiResponse;
