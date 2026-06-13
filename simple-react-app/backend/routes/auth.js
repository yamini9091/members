const AuthService = require('../services/authService');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const { AUTH_MESSAGES, HTTP_STATUS } = require('../constants/messages');
const {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateForgotPassword,
  validateResetPassword,
} = require('../middleware/validators');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const result = await AuthService.register(name, email, password);
  const statusCode = result.message === AUTH_MESSAGES.REGISTRATION_SUCCESS ? HTTP_STATUS.CREATED : HTTP_STATUS.CREATED;

  ApiResponse.success(res, {
    userId: result.userId,
    email: result.email,
    emailVerified: result.emailVerified,
  }, result.message, statusCode);
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return ApiResponse.error(res, 'Verification token required', HTTP_STATUS.BAD_REQUEST);
  }

  const result = await AuthService.verifyEmail(token);
  ApiResponse.success(res, {}, result.message);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await AuthService.login(email, password);

  ApiResponse.success(res, result, AUTH_MESSAGES.LOGIN_SUCCESS);
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const result = await AuthService.refreshToken(refreshToken);

  ApiResponse.success(res, result, AUTH_MESSAGES.TOKEN_REFRESH_SUCCESS);
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return ApiResponse.error(res, 'Email required', HTTP_STATUS.BAD_REQUEST);
  }

  const result = await AuthService.forgotPassword(email);
  ApiResponse.success(res, {}, result.message);
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const result = await AuthService.resetPassword(token, password);
  ApiResponse.success(res, {}, result.message);
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await AuthService.getCurrentUser(req.userId);
  ApiResponse.success(res, { user }, AUTH_MESSAGES.USER_FETCH_SUCCESS);
});

exports.logout = asyncHandler(async (req, res) => {
  const result = await AuthService.logout(req.userId);
  ApiResponse.success(res, {}, result.message);
});
