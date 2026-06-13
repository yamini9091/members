const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed');
    console.error('Error:', err.message);
    console.error('\n⚠️  IMPORTANT: Add your IP to MongoDB Atlas Network Access:');
    console.error('1. Go to: https://www.mongodb.com/cloud/atlas');
    console.error('2. Go to: Security → Network Access');
    console.error('3. Click: "+ Add IP Address"');
    console.error('4. Add your current IP (or 0.0.0.0/0 for development)');
    console.error('5. Try again\n');
  });

// MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('📡 Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('📡 Mongoose disconnected from MongoDB');
});

// Middleware
app.use(express.json({ limit: '300mb' }));
app.use(express.urlencoded({ extended: true, limit: '300mb' }));

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests, please try again later'
});

app.use('/api/auth/', limiter);

// Routes
const authController = require('./routes/auth');
const imageRouter = require('./routes/image');
const { protect } = require('./middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateForgotPassword,
  validateResetPassword,
} = require('./middleware/validators');

// Auth Routes
app.post('/api/auth/register', validateRegister, authController.register);
app.post('/api/auth/verify-email', validateVerifyEmail, authController.verifyEmail);
app.post('/api/auth/login', validateLogin, authController.login);
app.post('/api/auth/refresh-token', authController.refreshToken);
app.post('/api/auth/forgot-password', validateForgotPassword, authController.forgotPassword);
app.post('/api/auth/reset-password', validateResetPassword, authController.resetPassword);
app.get('/api/auth/me', protect, authController.getMe);
app.post('/api/auth/logout', protect, authController.logout);

// Image Routes
app.use('/api/images', imageRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server error'
  });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
