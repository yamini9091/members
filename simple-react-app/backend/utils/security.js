// Security utility to prevent credential exposure

class SecurityUtils {
  // Sensitive environment variables to never expose
  static SENSITIVE_KEYS = [
    'MONGODB_URI',
    'JWT_SECRET',
    'REFRESH_TOKEN_SECRET',
    'EMAIL_PASSWORD',
    'DATABASE_PASSWORD',
    'API_KEY',
    'SECRET_KEY'
  ];

  // Sanitize error messages to remove sensitive data
  static sanitizeError(error) {
    let message = error.message || String(error);

    // Remove MongoDB connection strings
    message = message.replace(
      /mongodb\+srv:\/\/[^:]+:[^@]+@[^\s?]+/gi,
      'mongodb+srv://***:***@***'
    );

    // Remove JWT secrets
    if (process.env.JWT_SECRET) {
      message = message.replace(new RegExp(process.env.JWT_SECRET, 'g'), '***JWT_SECRET***');
    }

    // Remove email passwords
    if (process.env.EMAIL_PASSWORD) {
      message = message.replace(new RegExp(process.env.EMAIL_PASSWORD, 'g'), '***EMAIL_PASSWORD***');
    }

    return message;
  }

  // Sanitize error for logging (more verbose but still safe)
  static sanitizeForLogging(error) {
    const sanitized = this.sanitizeError(error);
    return {
      message: sanitized,
      code: error.code,
      stack: error.stack ? error.stack.split('\n')[0] : undefined
    };
  }

  // Validate that no sensitive keys are in error response
  static validateResponse(response) {
    const json = JSON.stringify(response);
    for (const key of this.SENSITIVE_KEYS) {
      if (process.env[key] && json.includes(process.env[key])) {
        throw new Error(`SECURITY: Response contains ${key}`);
      }
    }
    return response;
  }

  // Mask sensitive data in logs
  static maskEnv() {
    const masked = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (this.SENSITIVE_KEYS.includes(key)) {
        masked[key] = '***HIDDEN***';
      } else {
        masked[key] = value;
      }
    }
    return masked;
  }

  // Check if error contains sensitive data
  static containsSensitiveData(error) {
    const message = String(error);
    for (const key of this.SENSITIVE_KEYS) {
      if (process.env[key] && message.includes(process.env[key])) {
        return true;
      }
    }
    return false;
  }
}

module.exports = SecurityUtils;
