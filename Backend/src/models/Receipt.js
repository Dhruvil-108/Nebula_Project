const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    uploadedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpenseClaim',
      default: null,
      index: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      default: 'image/jpeg',
    },
    fileSizeBytes: {
      type: Number,
      default: 0,
    },
    contentHash: {
      type: String,
      required: true,
      index: true, // SHA-256 hash for duplicate detection
    },
    ocrRaw: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

receiptSchema.index({ organizationId: 1, contentHash: 1 });

module.exports = mongoose.model('Receipt', receiptSchema);
