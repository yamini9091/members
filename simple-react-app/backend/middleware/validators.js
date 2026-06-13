const { body, validationResult } = require('express-validator');

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors
    });
  }
  next();
};

// Registration validation
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
    .isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  body('email')
    .trim()
    .toLowerCase()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .isLength({ max: 255 }).withMessage('Email cannot exceed 255 characters'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .isLength({ max: 128 }).withMessage('Password cannot exceed 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and numbers'),

  body('passwordConfirm')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),

  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('email')
    .trim()
    .toLowerCase()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty().withMessage('Password is required'),

  handleValidationErrors
];

// Email verification validation
const validateVerifyEmail = [
  body('token')
    .trim()
    .notEmpty().withMessage('Verification token is required')
    .isLength({ min: 64 }).withMessage('Invalid verification token format'),

  handleValidationErrors
];

// Forgot password validation
const validateForgotPassword = [
  body('email')
    .trim()
    .toLowerCase()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),

  handleValidationErrors
];

// Reset password validation
const validateResetPassword = [
  body('token')
    .trim()
    .notEmpty().withMessage('Reset token is required')
    .isLength({ min: 64 }).withMessage('Invalid reset token format'),

  body('password')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and numbers'),

  body('passwordConfirm')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),

  handleValidationErrors
];

// Image process validation
const validateImageProcess = [
  body('filename')
    .trim()
    .notEmpty().withMessage('Filename is required')
    .matches(/^\d+-[a-f0-9]+\.jpg$/).withMessage('Invalid filename format'),

  body('operation')
    .trim()
    .notEmpty().withMessage('Operation is required')
    .isIn(['original', 'grayscale', 'blur', 'sharpen', 'brightness', 'contrast', 'rotate', 'thumbnail', 'enhance', 'invert'])
    .withMessage('Invalid operation. Allowed: original, grayscale, blur, sharpen, brightness, contrast, rotate, thumbnail, enhance, invert'),

  body('blurAmount')
    .optional()
    .isFloat({ min: 0, max: 20 }).withMessage('Blur amount must be between 0 and 20'),

  body('brightness')
    .optional()
    .isFloat({ min: 0.5, max: 2.0 }).withMessage('Brightness must be between 0.5 and 2.0'),

  body('contrast')
    .optional()
    .isFloat({ min: 0.5, max: 2.0 }).withMessage('Contrast must be between 0.5 and 2.0'),

  body('sharpen')
    .optional()
    .isBoolean().withMessage('Sharpen must be true or false'),

  body('format')
    .optional()
    .trim()
    .toLowerCase()
    .isIn(['jpeg', 'png', 'webp']).withMessage('Format must be jpeg, png, or webp'),

  handleValidationErrors
];

// Image cleanup validation
const validateImageCleanup = [
  body('filename')
    .trim()
    .notEmpty().withMessage('Filename is required')
    .matches(/^\d+-[a-f0-9]+\.jpg$/).withMessage('Invalid filename format'),

  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateForgotPassword,
  validateResetPassword,
  validateImageProcess,
  validateImageCleanup,
  handleValidationErrors
};
