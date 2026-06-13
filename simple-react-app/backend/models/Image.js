const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: String,
  data: {
    type: Buffer,
    required: true
  },
  mimetype: {
    type: String,
    enum: ['image/jpeg', 'image/png'],
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  width: Number,
  height: Number,
  format: String,
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Delete old files after 30 days (optional TTL)
imageSchema.index({ uploadedAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Image', imageSchema);
