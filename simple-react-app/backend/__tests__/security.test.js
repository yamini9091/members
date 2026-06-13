const SecurityUtils = require('../utils/security');

describe('Security Utils Tests', () => {
  describe('Credential Masking', () => {
    test('✅ Should sanitize MongoDB URI in error messages', () => {
      const error = new Error('Connection failed: mongodb+srv://user:password@cluster.mongodb.net/db');
      const sanitized = SecurityUtils.sanitizeError(error);

      // The actual password should be masked
      expect(sanitized).not.toContain('user:password');
      expect(sanitized).not.toContain('cluster.mongodb.net');
      expect(sanitized).toContain('***');
    });

    test('✅ Should mask JWT secret in errors', () => {
      const testSecret = 'super-secret-key-12345';
      process.env.JWT_SECRET = testSecret;

      const error = new Error(`Auth failed with secret: ${testSecret}`);
      const sanitized = SecurityUtils.sanitizeError(error);

      expect(sanitized).not.toContain(testSecret);
      expect(sanitized).not.toContain('super-secret');
    });

    test('✅ Should mask email password in errors', () => {
      const testPassword = 'gmail-app-password-xyz';
      process.env.EMAIL_PASSWORD = testPassword;

      const error = new Error(`Email error: ${testPassword}`);
      const sanitized = SecurityUtils.sanitizeError(error);

      expect(sanitized).not.toContain(testPassword);
      expect(sanitized).not.toContain('gmail-app');
    });
  });

  describe('Logging Safety', () => {
    test('✅ Should structure logs safely', () => {
      const error = new Error('Test error');
      const sanitized = SecurityUtils.sanitizeForLogging(error);

      expect(sanitized).toHaveProperty('message');
      expect(sanitized).toHaveProperty('code');
      expect(typeof sanitized.message).toBe('string');
    });

    test('✅ Should provide code property in logs', () => {
      const error = new Error('Test');
      error.code = 'TEST_ERROR';

      const sanitized = SecurityUtils.sanitizeForLogging(error);
      expect(sanitized.code).toBe('TEST_ERROR');
    });

    test('✅ Should provide stack trace start in logs', () => {
      const error = new Error('Test error');
      const sanitized = SecurityUtils.sanitizeForLogging(error);

      if (error.stack) {
        expect(sanitized.stack).toBeDefined();
      }
    });
  });

  describe('Sensitive Data Detection', () => {
    test('✅ Should detect MongoDB URI in error', () => {
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.net/db';
      const error = new Error(`Failed: ${process.env.MONGODB_URI}`);

      const hasSensitive = SecurityUtils.containsSensitiveData(error);
      expect(hasSensitive).toBe(true);
    });

    test('✅ Should detect API key in error', () => {
      process.env.API_KEY = 'secret-api-key-12345';
      const error = new Error(`API Error: ${process.env.API_KEY}`);

      const hasSensitive = SecurityUtils.containsSensitiveData(error);
      expect(hasSensitive).toBe(true);
    });

    test('✅ Should return false for safe errors', () => {
      const error = new Error('User not found');
      const hasSensitive = SecurityUtils.containsSensitiveData(error);
      expect(hasSensitive).toBe(false);
    });
  });

  describe('Environment Variable Masking', () => {
    test('✅ Should mask all sensitive keys', () => {
      process.env.JWT_SECRET = 'secret123';
      process.env.EMAIL_PASSWORD = 'password123';
      process.env.MONGODB_URI = 'mongodb+srv://...';

      const masked = SecurityUtils.maskEnv();

      expect(masked.JWT_SECRET).toBe('***HIDDEN***');
      expect(masked.EMAIL_PASSWORD).toBe('***HIDDEN***');
      expect(masked.MONGODB_URI).toBe('***HIDDEN***');
    });

    test('✅ Should not mask non-sensitive keys', () => {
      process.env.NODE_ENV = 'test';
      process.env.PORT = '5001';

      const masked = SecurityUtils.maskEnv();

      expect(masked.NODE_ENV).toBe('test');
      expect(masked.PORT).toBe('5001');
    });

    test('✅ Should preserve structure of masked env', () => {
      const masked = SecurityUtils.maskEnv();

      expect(typeof masked).toBe('object');
      expect(Object.keys(masked).length).toBeGreaterThan(0);
    });
  });

  describe('Response Validation', () => {
    test('✅ Should accept safe response', () => {
      const safeResponse = {
        success: true,
        data: { userId: '123', username: 'john' }
      };

      expect(() => {
        SecurityUtils.validateResponse(safeResponse);
      }).not.toThrow();
    });

    test('✅ Should validate error response structure', () => {
      const errorResponse = {
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      };

      expect(() => {
        SecurityUtils.validateResponse(errorResponse);
      }).not.toThrow();
    });

    test('✅ Should handle nested objects safely', () => {
      const complexResponse = {
        success: true,
        data: {
          user: {
            id: '123',
            email: 'test@example.com',
            profile: {
              name: 'Test User'
            }
          }
        }
      };

      expect(() => {
        SecurityUtils.validateResponse(complexResponse);
      }).not.toThrow();
    });
  });

  describe('Sensitive Keys List', () => {
    test('✅ Should have required sensitive keys', () => {
      const requiredKeys = [
        'MONGODB_URI',
        'JWT_SECRET',
        'REFRESH_TOKEN_SECRET',
        'EMAIL_PASSWORD'
      ];

      requiredKeys.forEach(key => {
        expect(SecurityUtils.SENSITIVE_KEYS).toContain(key);
      });
    });

    test('✅ Should protect database credentials', () => {
      expect(SecurityUtils.SENSITIVE_KEYS).toContain('MONGODB_URI');
      expect(SecurityUtils.SENSITIVE_KEYS).toContain('DATABASE_PASSWORD');
    });

    test('✅ Should protect authentication secrets', () => {
      expect(SecurityUtils.SENSITIVE_KEYS).toContain('JWT_SECRET');
      expect(SecurityUtils.SENSITIVE_KEYS).toContain('REFRESH_TOKEN_SECRET');
    });
  });

  describe('Error Message Sanitization', () => {
    test('✅ Should preserve error message clarity', () => {
      const error = new Error('User validation failed');
      const sanitized = SecurityUtils.sanitizeError(error);

      expect(sanitized.length).toBeGreaterThan(0);
      expect(typeof sanitized).toBe('string');
    });

    test('✅ Should handle undefined messages gracefully', () => {
      const error = new Error();
      const sanitized = SecurityUtils.sanitizeError(error);

      expect(sanitized).toBeDefined();
    });

    test('✅ Should handle errors without message property', () => {
      const error = { code: 'TEST_ERROR' };
      const sanitized = SecurityUtils.sanitizeError(error);

      expect(typeof sanitized).toBe('string');
    });
  });
});
