const crypto = require('crypto');
const User = require('../models/User');
const UserService = require('./userService');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const { AUTH_MESSAGES, ERROR_CODES, HTTP_STATUS } = require('../constants/messages');

class AuthService {
  static async register(name, email, password) {
    const existingUser = await UserService.findByEmail(email);
    if (existingUser) {
      const error = new Error(AUTH_MESSAGES.EMAIL_ALREADY_EXISTS);
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      error.code = ERROR_CODES.EMAIL_EXISTS;
      throw error;
    }

    const user = await UserService.create({ name, email, password });
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    const emailSent = await sendVerificationEmail(email, verificationToken, name);

    return {
      userId: user._id,
      email: user.email,
      emailVerified: user.isEmailVerified,
      message: emailSent
        ? AUTH_MESSAGES.REGISTRATION_SUCCESS
        : AUTH_MESSAGES.REGISTRATION_SUCCESS_NO_EMAIL,
    };
  }

  static async verifyEmail(token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      const error = new Error(AUTH_MESSAGES.INVALID_VERIFICATION_TOKEN);
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    await UserService.verifyEmail(user._id);
    return { message: AUTH_MESSAGES.EMAIL_VERIFICATION_SUCCESS };
  }

  static async login(email, password) {
    const user = await UserService.findByEmail(email);

    if (!user) {
      const error = new Error(AUTH_MESSAGES.INVALID_CREDENTIALS);
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      error.code = ERROR_CODES.INVALID_CREDENTIALS;
      throw error;
    }

    if (user.isAccountLocked()) {
      const error = new Error(AUTH_MESSAGES.ACCOUNT_LOCKED);
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      error.code = ERROR_CODES.ACCOUNT_LOCKED;
      error.lockUntil = user.lockUntil;
      throw error;
    }

    if (!user.isEmailVerified && process.env.NODE_ENV === 'production') {
      const error = new Error(AUTH_MESSAGES.EMAIL_NOT_VERIFIED);
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      error.code = 'EMAIL_NOT_VERIFIED';
      throw error;
    }

    const userWithPassword = await UserService.findByIdWithPassword(user._id);
    const isMatch = await userWithPassword.matchPassword(password);

    if (!isMatch) {
      await userWithPassword.incLoginAttempts();
      const error = new Error(AUTH_MESSAGES.INVALID_CREDENTIALS);
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      error.code = ERROR_CODES.INVALID_CREDENTIALS;
      throw error;
    }

    await userWithPassword.resetLoginAttempts();

    const { accessToken, refreshToken } = generateTokens(user._id);

    return {
      accessToken,
      refreshToken,
      user: await UserService.getFormattedUser(user),
    };
  }

  static async refreshToken(token) {
    if (!token) {
      const error = new Error(AUTH_MESSAGES.REFRESH_TOKEN_REQUIRED);
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    const decoded = verifyRefreshToken(token);
    if (!decoded) {
      const error = new Error(AUTH_MESSAGES.INVALID_REFRESH_TOKEN);
      error.statusCode = HTTP_STATUS.UNAUTHORIZED;
      error.code = ERROR_CODES.INVALID_TOKEN;
      throw error;
    }

    const user = await UserService.findById(decoded.id);
    if (!user) {
      const error = new Error(AUTH_MESSAGES.USER_NOT_FOUND);
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    return { accessToken, refreshToken: newRefreshToken };
  }

  static async forgotPassword(email) {
    const user = await UserService.findByEmail(email);
    if (!user) {
      const error = new Error(AUTH_MESSAGES.USER_NOT_FOUND);
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    const emailSent = await sendPasswordResetEmail(email, resetToken, user.name);

    if (!emailSent) {
      await UserService.clearPasswordResetToken(user._id);
      const error = new Error('Error sending reset email');
      error.statusCode = HTTP_STATUS.INTERNAL_ERROR;
      throw error;
    }

    return { message: AUTH_MESSAGES.PASSWORD_RESET_EMAIL_SENT };
  }

  static async resetPassword(token, password) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      const error = new Error('Invalid or expired password reset token');
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    await UserService.updatePassword(user._id, password);
    await UserService.clearPasswordResetToken(user._id);

    return { message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS };
  }

  static async getCurrentUser(userId) {
    const user = await UserService.findById(userId);
    if (!user) {
      const error = new Error(AUTH_MESSAGES.USER_NOT_FOUND);
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return await UserService.getFormattedUser(user);
  }

  static async logout(userId) {
    // Clear all image history and action logs
    await UserService.clearAllImageData(userId);
    return { message: 'Logged out successfully. All image history cleared.' };
  }
}

module.exports = AuthService;
