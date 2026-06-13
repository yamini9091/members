const Image = require('../models/Image');
const ImageService = require('./imageService');
const UserService = require('./userService');
const { HTTP_STATUS, IMAGE_MESSAGES, ERROR_CODES } = require('../constants/messages');

class ImageOperationService {
  static async uploadImage(userId, file) {
    if (!file) {
      const error = new Error(IMAGE_MESSAGES.NO_FILE_PROVIDED);
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      throw error;
    }

    const filename = ImageService.generateFilename(userId);
    const metadata = await ImageService.getMetadata(file.buffer);
    const preview = ImageService.bufferToBase64(file.buffer);

    const image = await ImageService.saveImage(
      file.buffer,
      filename,
      userId,
      file.mimetype
    );

    await UserService.addImage(userId, {
      filename,
      size: file.size,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      uploadedAt: new Date(),
    });

    await UserService.addImageAction(userId, {
      type: 'upload',
      filename,
      details: { size: file.size, width: metadata.width, height: metadata.height, format: metadata.format },
      timestamp: new Date(),
    });

    return {
      imageId: image._id,
      filename,
      filepath: filename,
      size: file.size,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      preview,
    };
  }

  static async processImage(userId, filename, operation, params) {
    this._validateFilename(filename);

    const user = await UserService.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const imageRecord = user.images?.find((img) => img.filename === filename);
    if (!imageRecord) {
      const error = new Error(IMAGE_MESSAGES.UNAUTHORIZED_IMAGE);
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      error.code = ERROR_CODES.UNAUTHORIZED_IMAGE;
      throw error;
    }

    const image = await ImageService.getImageByFilename(filename, userId);
    if (!image) {
      const error = new Error(IMAGE_MESSAGES.IMAGE_NOT_FOUND);
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      error.code = ERROR_CODES.FILE_NOT_FOUND;
      throw error;
    }

    const format = params.format || 'jpeg';
    let processed = await ImageService.applyFilter(image.data, operation, {
      blurAmount: params.blurAmount,
      brightness: params.brightness,
      contrast: params.contrast,
      sharpen: params.sharpen,
    });

    const { processed: processedBuffer, mimeType } = await ImageService.convertFormat(
      await processed.toBuffer(),
      format
    );

    try {
      await UserService.addImageAction(userId, {
        type: 'process',
        filename,
        operation,
        details: {
          blurAmount: params.blurAmount,
          brightness: params.brightness,
          contrast: params.contrast,
          sharpen: params.sharpen,
          outputFormat: format,
        },
        timestamp: new Date(),
      });
    } catch (dbError) {
      console.error('Action logging error:', dbError);
    }

    const preview = ImageService.bufferToBase64(processedBuffer, mimeType);

    return {
      preview,
      operation,
      format,
      mimeType,
    };
  }

  static async deleteImage(userId, filename) {
    this._validateFilename(filename);

    const user = await UserService.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const imageRecord = user.images?.find((img) => img.filename === filename);
    if (!imageRecord) {
      const error = new Error(IMAGE_MESSAGES.UNAUTHORIZED_IMAGE);
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      error.code = ERROR_CODES.UNAUTHORIZED_IMAGE;
      throw error;
    }

    const deleted = await ImageService.deleteImageByFilename(filename, userId);
    if (!deleted) {
      const error = new Error(IMAGE_MESSAGES.IMAGE_NOT_FOUND);
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      error.code = ERROR_CODES.FILE_NOT_FOUND;
      throw error;
    }

    try {
      await UserService.addImageAction(userId, {
        type: 'delete',
        filename,
        details: { imageSize: imageRecord.size, imageFormat: imageRecord.format },
        timestamp: new Date(),
      });

      await UserService.removeImage(userId, filename);
    } catch (dbError) {
      console.error('Database error:', dbError);
      const error = new Error('Failed to update database');
      error.statusCode = HTTP_STATUS.INTERNAL_ERROR;
      throw error;
    }

    return { filename, deleted: true, timestamp: new Date() };
  }

  static async getImageHistory(userId) {
    const user = await UserService.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const images = (user.images || []).sort(
      (a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)
    );

    return { totalImages: images.length, images };
  }

  static async getImageActions(userId) {
    const user = await UserService.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const actions = (user.imageActions || []).sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    return { totalActions: actions.length, actions };
  }

  static getImageStatus() {
    return {
      storage: 'MongoDB',
      maxFileSize: '300MB',
      uploadFormats: ['JPEG', 'PNG'],
      outputFormats: ['JPEG', 'PNG', 'WebP'],
      operations: ['original', 'grayscale', 'blur', 'sharpen', 'brightness', 'contrast', 'rotate', 'thumbnail', 'enhance', 'invert'],
      parameters: {
        blurAmount: '0-20',
        brightness: '0.5-2.0',
        contrast: '0.5-2.0',
        sharpen: 'boolean',
        format: 'jpeg|png|webp',
      },
    };
  }

  static _validateFilename(filename) {
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      const error = new Error(IMAGE_MESSAGES.INVALID_FILENAME);
      error.statusCode = HTTP_STATUS.BAD_REQUEST;
      error.code = ERROR_CODES.INVALID_FILENAME;
      throw error;
    }
  }
}

module.exports = ImageOperationService;
