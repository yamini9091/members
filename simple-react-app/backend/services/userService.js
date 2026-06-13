const User = require('../models/User');
const { HTTP_STATUS } = require('../constants/messages');

class UserService {
  static async findByEmail(email) {
    return await User.findOne({ email: email.toLowerCase() });
  }

  static async findById(id) {
    return await User.findById(id);
  }

  static async findByIdWithPassword(id) {
    return await User.findById(id).select('+password');
  }

  static async create(userData) {
    const { name, email, password } = userData;

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
    });

    return user;
  }

  static async updatePassword(userId, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    user.password = newPassword;
    await user.save();
    return user;
  }

  static async verifyEmail(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpire = undefined;
    await user.save();

    return user;
  }

  static async clearPasswordResetToken(userId) {
    await User.findByIdAndUpdate(userId, {
      $unset: {
        passwordResetToken: 1,
        passwordResetTokenExpire: 1,
      },
    });
  }

  static async addImage(userId, imageData) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    if (!user.images) user.images = [];
    user.images.push(imageData);
    await user.save();

    return user;
  }

  static async addImageAction(userId, actionData) {
    const user = await User.findById(userId);
    if (!user) return null;

    if (!user.imageActions) user.imageActions = [];
    user.imageActions.push(actionData);
    await user.save();

    return user;
  }

  static async removeImage(userId, filename) {
    return await User.findByIdAndUpdate(
      userId,
      { $pull: { images: { filename } } },
      { new: true }
    );
  }

  static async getFormattedUser(user) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
    };
  }

  static async clearAllImageData(userId) {
    const Image = require('../models/Image');

    // Delete all image documents from Image collection
    await Image.deleteMany({ userId });

    // Clear images and actions from user document
    await User.findByIdAndUpdate(userId, {
      $set: {
        images: [],
        imageActions: [],
      },
    });

    return true;
  }
}

module.exports = UserService;
