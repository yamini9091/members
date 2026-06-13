const AUTH_MESSAGES = {
  // Registration
  REGISTRATION_SUCCESS: 'User registered successfully! Check your email for verification link.',
  REGISTRATION_SUCCESS_NO_EMAIL: 'User registered successfully. You can proceed to login.',
  EMAIL_ALREADY_EXISTS: 'This email is already registered. Please login or use a different email.',
  REGISTRATION_ERROR: 'Server error during registration. Please try again later.',

  // Login
  LOGIN_SUCCESS: 'Login successful!',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_LOCKED: 'Account locked due to multiple failed login attempts. Please try again in 2 hours.',
  EMAIL_NOT_VERIFIED: 'Please verify your email before logging in. Check your inbox for the verification link.',
  LOGIN_ERROR: 'Server error during login. Please try again later.',

  // Email Verification
  EMAIL_VERIFICATION_SUCCESS: 'Email verified successfully. You can now login.',
  INVALID_VERIFICATION_TOKEN: 'Invalid or expired verification token.',
  EMAIL_VERIFICATION_ERROR: 'Error verifying email.',
  VERIFICATION_TOKEN_REQUIRED: 'Verification token required.',

  // Password Reset
  PASSWORD_RESET_EMAIL_SENT: 'Password reset link sent to your email.',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully. You can now login.',
  PASSWORD_RESET_REQUEST_ERROR: 'Error during password reset request.',
  PASSWORD_RESET_ERROR: 'Error resetting password.',
  USER_NOT_FOUND: 'User not found.',

  // Token
  TOKEN_REFRESH_SUCCESS: 'Token refreshed successfully.',
  TOKEN_REFRESH_ERROR: 'Error refreshing token.',
  REFRESH_TOKEN_REQUIRED: 'Refresh token required.',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token.',

  // User
  USER_FETCH_SUCCESS: 'User fetched successfully.',
  USER_FETCH_ERROR: 'Error fetching user data.',

  // Logout
  LOGOUT_SUCCESS: 'Logged out successfully. All image history cleared.',
  LOGOUT_ERROR: 'Error during logout. Please try again later.',
};

const IMAGE_MESSAGES = {
  UPLOAD_SUCCESS: 'Image uploaded successfully!',
  UPLOAD_ERROR: 'Image upload failed. Please try again later.',

  PROCESS_SUCCESS: (operation, format) => `Image processed with ${operation} (${format.toUpperCase()})`,
  PROCESS_ERROR: 'Image processing failed. Please try again later.',

  CLEANUP_SUCCESS: 'Image deleted successfully.',
  CLEANUP_ERROR: 'Image cleanup failed. Please try again later.',

  IMAGE_NOT_FOUND: 'Image not found in database.',
  UNAUTHORIZED_IMAGE: 'You do not have permission to process this image.',
  INVALID_FILENAME: 'Invalid filename.',
  NO_FILE_PROVIDED: 'No file provided.',

  HISTORY_ERROR: 'Failed to fetch image history.',
  ACTIONS_ERROR: 'Failed to fetch image actions.',
};

const ERROR_CODES = {
  // Auth
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  REGISTRATION_ERROR: 'REGISTRATION_ERROR',
  LOGIN_ERROR: 'LOGIN_ERROR',
  INVALID_TOKEN: 'INVALID_TOKEN',

  // Image
  UPLOAD_ERROR: 'UPLOAD_ERROR',
  PROCESSING_ERROR: 'PROCESSING_ERROR',
  CLEANUP_ERROR: 'CLEANUP_ERROR',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  UNAUTHORIZED_IMAGE: 'UNAUTHORIZED_IMAGE',
  INVALID_FILENAME: 'INVALID_FILENAME',

  // General
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

module.exports = {
  AUTH_MESSAGES,
  IMAGE_MESSAGES,
  ERROR_CODES,
  HTTP_STATUS,
};
