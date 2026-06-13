const sharp = require('sharp');
const Image = require('../models/Image');

class ImageService {
  // Save image to MongoDB
  static async saveImage(buffer, filename, userId, mimetype) {
    const metadata = await this.getMetadata(buffer);

    const image = new Image({
      userId,
      filename,
      originalName: filename,
      data: buffer,
      mimetype,
      size: buffer.length,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format
    });

    await image.save();
    return image;
  }

  // Get image from MongoDB
  static async getImage(imageId, userId) {
    return await Image.findOne({ _id: imageId, userId });
  }

  // Get image by filename for user
  static async getImageByFilename(filename, userId) {
    return await Image.findOne({ filename, userId });
  }

  // Get metadata
  static async getMetadata(buffer) {
    return await sharp(buffer).metadata();
  }

  // Convert buffer to base64
  static bufferToBase64(buffer, mimeType = 'image/jpeg') {
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  // Apply image filter
  static async applyFilter(buffer, operation, params = {}) {
    let image = sharp(buffer);

    switch (operation) {
      case 'grayscale':
        image = image.grayscale();
        break;
      case 'blur':
        const blurAmount = Math.min(Math.max(params.blurAmount || 10, 0), 20);
        image = image.blur(blurAmount);
        break;
      case 'sharpen':
        image = image.sharpen({ sigma: 2 });
        break;
      case 'brightness':
        const brightness = Math.min(Math.max(params.brightness || 1, 0.5), 2.0);
        image = image.modulate({ brightness });
        break;
      case 'contrast':
        const contrast = Math.min(Math.max(params.contrast || 1, 0.5), 2.0);
        image = image.modulate({ saturation: contrast });
        break;
      case 'rotate':
        image = image.rotate(90);
        break;
      case 'thumbnail':
        image = image.resize(200, 200, { fit: 'cover' });
        break;
      case 'enhance':
        image = image.normalize();
        break;
      case 'invert':
        image = image.negate();
        break;
      case 'original':
        break;
      default:
        throw new Error('Invalid operation');
    }

    // Apply additional modulations
    if (operation !== 'brightness' && params.brightness && params.brightness !== 1) {
      const brightness = Math.min(Math.max(params.brightness, 0.5), 2.0);
      image = image.modulate({ brightness });
    }

    if (operation !== 'contrast' && params.contrast && params.contrast !== 1) {
      const contrast = Math.min(Math.max(params.contrast, 0.5), 2.0);
      image = image.modulate({ saturation: contrast });
    }

    if (params.sharpen) {
      image = image.sharpen({ sigma: 1 });
    }

    return image;
  }

  // Convert to specified format
  static async convertFormat(buffer, format = 'jpeg') {
    let image = sharp(buffer);
    let mimeType;

    switch (format.toLowerCase()) {
      case 'png':
        image = image.png();
        mimeType = 'image/png';
        break;
      case 'webp':
        image = image.webp({ quality: 90 });
        mimeType = 'image/webp';
        break;
      case 'jpeg':
      default:
        image = image.jpeg({ quality: 90 });
        mimeType = 'image/jpeg';
    }

    const processed = await image.toBuffer();
    return { processed, mimeType };
  }

  // Delete image from MongoDB
  static async deleteImage(imageId, userId) {
    const result = await Image.findOneAndDelete({ _id: imageId, userId });
    return !!result;
  }

  // Delete image by filename
  static async deleteImageByFilename(filename, userId) {
    const result = await Image.findOneAndDelete({ filename, userId });
    return !!result;
  }

  // Get user's images
  static async getUserImages(userId) {
    return await Image.find({ userId }).sort({ uploadedAt: -1 });
  }

  // Count user's images
  static async countUserImages(userId) {
    return await Image.countDocuments({ userId });
  }

  // Generate filename
  static generateFilename(userId) {
    const timestamp = Date.now();
    return `${timestamp}-${userId}.jpg`;
  }

  // Get image size in MB
  static getImageSizeMB(sizeInBytes) {
    return (sizeInBytes / 1024 / 1024).toFixed(2);
  }
}

module.exports = ImageService;
