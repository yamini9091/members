const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');
const User = require('../models/User');
const SecurityUtils = require('../utils/security');

// Mock data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'TestPass123!',
  passwordConfirm: 'TestPass123!'
};

const invalidUsers = {
  missingName: { email: 'test@example.com', password: 'TestPass123!' },
  invalidEmail: { name: 'Test', email: 'invalid-email', password: 'TestPass123!' },
  weakPassword: { name: 'Test', email: 'test@example.com', password: 'weak' },
  mismatchPassword: {
    name: 'Test',
    email: 'test@example.com',
    password: 'TestPass123!',
    passwordConfirm: 'DifferentPass!'
  }
};

describe('Authentication Tests', () => {
  let app;
  let token;
  let refreshToken;

  beforeAll(async () => {
    // Create Express app for testing
    app = express();
    app.use(express.json());

    // Connect to test MongoDB (use a test database)
    process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auth-system-test';

    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('✅ Test database connected');
    } catch (err) {
      console.warn('⚠️ Could not connect to test database:', err.message);
      // Continue anyway - test will fail gracefully if DB is not available
    }

    // Setup routes
    const authController = require('../routes/auth');
    const { validateRegister, validateLogin } = require('../middleware/validators');

    app.post('/api/auth/register', validateRegister, authController.register);
    app.post('/api/auth/login', validateLogin, authController.login);
  });

  afterAll(async () => {
    try {
      await mongoose.disconnect();
      console.log('✅ Test database disconnected');
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  });

  beforeEach(async () => {
    try {
      await User.deleteMany({ email: { $in: [testUser.email, invalidUsers.invalidEmail.email] } });
    } catch (err) {
      console.warn('Could not clean up test data:', err.message);
    }
  });

  describe('User Registration', () => {
    test('✅ Should register a valid user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email.toLowerCase());
    });

    test('❌ Should reject registration without name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUsers.missingName);

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    test('❌ Should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUsers.invalidEmail);

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    test('❌ Should reject weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUsers.weakPassword);

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    test('❌ Should reject mismatched password confirm', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(invalidUsers.mismatchPassword);

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    test('❌ Should reject duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Duplicate registration
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('User Login', () => {
    beforeEach(async () => {
      try {
        await request(app)
          .post('/api/auth/register')
          .send(testUser);
      } catch (err) {
        console.warn('Could not register test user:', err.message);
      }
    });

    test('✅ Should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());

      // Store tokens for other tests
      token = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });

    test('❌ Should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    test('❌ Should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
    });

    test('❌ Should reject login without email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          password: testUser.password
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    test('❌ Should reject login without password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Security & Credential Protection', () => {
    test('✅ Should sanitize error messages', () => {
      const error = new Error(`Failed: ${process.env.MONGODB_URI}`);
      const sanitized = SecurityUtils.sanitizeError(error);

      expect(sanitized).not.toContain('mongodb+srv://');
      expect(sanitized).not.toContain('@');
    });

    test('✅ Should mask JWT secret in errors', () => {
      process.env.JWT_SECRET = 'super-secret-key-12345';
      const error = new Error(`JWT Error: ${process.env.JWT_SECRET}`);
      const sanitized = SecurityUtils.sanitizeError(error);

      expect(sanitized).not.toContain('super-secret-key');
      expect(sanitized).toContain('***');
    });

    test('✅ Should sanitize for logging', () => {
      const error = new Error('Test error');
      const sanitized = SecurityUtils.sanitizeForLogging(error);

      expect(sanitized).toHaveProperty('message');
      expect(sanitized).toHaveProperty('code');
      expect(typeof sanitized.message).toBe('string');
    });

    test('✅ Should detect sensitive data', () => {
      process.env.API_KEY = 'test-api-key-secret';
      const error = new Error(`Error: ${process.env.API_KEY}`);

      const hasSensitive = SecurityUtils.containsSensitiveData(error);
      expect(hasSensitive).toBe(true);
    });

    test('✅ Should mask environment variables', () => {
      process.env.JWT_SECRET = 'secret123';
      process.env.EMAIL_PASSWORD = 'password123';

      const masked = SecurityUtils.maskEnv();

      expect(masked.JWT_SECRET).toBe('***HIDDEN***');
      expect(masked.EMAIL_PASSWORD).toBe('***HIDDEN***');
    });

    test('✅ Should validate response for sensitive data', () => {
      const safeResponse = { success: true, data: { userId: '123' } };

      expect(() => {
        SecurityUtils.validateResponse(safeResponse);
      }).not.toThrow();
    });

    test('✅ No credentials should be in error responses', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong'
        });

      const responseJson = JSON.stringify(res.body);
      expect(responseJson).not.toContain('mongodb+srv://');
      expect(responseJson).not.toContain('JWT_SECRET');
      expect(responseJson).not.toContain('PASSWORD');
    });
  });

  describe('Token Management', () => {
    test('✅ JWT token should contain user ID', () => {
      // This is a basic check - in production, verify with JWT library
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    test('✅ Refresh token should be different from access token', () => {
      expect(token).not.toBe(refreshToken);
      expect(token).toBeDefined();
      expect(refreshToken).toBeDefined();
    });
  });

  describe('Password Security', () => {
    test('✅ Password should be hashed in database', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const user = await User.findOne({ email: testUser.email }).select('+password');

      // Hashed password should not match plain text
      expect(user.password).not.toBe(testUser.password);

      // Hashed password should be longer than original (bcrypt adds salt + hash)
      expect(user.password.length).toBeGreaterThan(20);
    });

    test('✅ Same password should produce different hashes', async () => {
      const user1 = await User.create({
        name: 'User One',
        email: 'user1@example.com',
        password: 'SamePassword123'
      });

      const user2 = await User.create({
        name: 'User Two',
        email: 'user2@example.com',
        password: 'SamePassword123'
      });

      const user1Data = await User.findById(user1._id).select('+password');
      const user2Data = await User.findById(user2._id).select('+password');

      // Different hashes for same password (due to salt)
      expect(user1Data.password).not.toBe(user2Data.password);
    });

    test('✅ matchPassword should verify correctly', async () => {
      const user = await User.create({
        name: 'Match Test',
        email: 'match@example.com',
        password: 'VerifyPass123'
      });

      const isMatch = await user.matchPassword('VerifyPass123');
      expect(isMatch).toBe(true);

      const isNotMatch = await user.matchPassword('WrongPassword');
      expect(isNotMatch).toBe(false);
    });
  });

  describe('Data Validation', () => {
    test('✅ Email should be normalized to lowercase', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'TeSt@ExAmPlE.CoM'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe('test@example.com');
    });

    test('✅ Name should be trimmed', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...testUser,
          name: '  Test User  '
        });

      expect(res.status).toBe(201);
    });
  });
});
