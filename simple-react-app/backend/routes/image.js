const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { validateImageProcess, validateImageCleanup } = require('../middleware/validators');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const ImageOperationService = require('../services/imageOperationService');
const { IMAGE_MESSAGES, HTTP_STATUS } = require('../constants/messages');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 300 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      return cb(new Error('Only JPEG and PNG images are allowed'));
    }
    cb(null, true);
  },
});

router.post('/upload', protect, upload.single('file'), asyncHandler(async (req, res) => {
  const result = await ImageOperationService.uploadImage(req.userId, req.file);
  ApiResponse.success(res, result, IMAGE_MESSAGES.UPLOAD_SUCCESS, HTTP_STATUS.OK);
}));

router.post('/process', protect, validateImageProcess, asyncHandler(async (req, res) => {
  const { filename, operation, blurAmount, brightness, contrast, sharpen, format } = req.body;

  const result = await ImageOperationService.processImage(req.userId, filename, operation, {
    blurAmount: blurAmount || 10,
    brightness: brightness || 1,
    contrast: contrast || 1,
    sharpen: sharpen || false,
    format: format || 'jpeg',
  });

  const message = IMAGE_MESSAGES.PROCESS_SUCCESS(operation, format || 'jpeg');
  ApiResponse.success(res, result, message);
}));

router.post('/cleanup', protect, validateImageCleanup, asyncHandler(async (req, res) => {
  const { filename } = req.body;

  const result = await ImageOperationService.deleteImage(req.userId, filename);
  ApiResponse.success(res, result, IMAGE_MESSAGES.CLEANUP_SUCCESS);
}));

router.get('/history', protect, asyncHandler(async (req, res) => {
  const result = await ImageOperationService.getImageHistory(req.userId);
  ApiResponse.success(res, result);
}));

router.get('/actions', protect, asyncHandler(async (req, res) => {
  const result = await ImageOperationService.getImageActions(req.userId);
  ApiResponse.success(res, result);
}));

router.get('/status', protect, (req, res) => {
  const status = ImageOperationService.getImageStatus();
  ApiResponse.success(res, status);
});

module.exports = router;
