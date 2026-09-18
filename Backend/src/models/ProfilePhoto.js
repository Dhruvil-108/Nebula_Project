const mongoose = require('mongoose');

/**
 * ProfilePhoto — exactly one profile photo per user, enforced by a
 * unique index on userId. Re-uploading overwrites the stored photo
 * (upsert), so there can never be duplicates or cross-user conflicts.
 *
 * The image is stored as a base64 data URL so no external storage
 * service is required.
 */
const profilePhotoSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId is required'],
    },
    /** Full data URL, e.g. "data:image/png;base64,..." */
    dataUrl: {
      type: String,
      required: [true, 'Photo data is required'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'uploadedBy is required'],
    },
  },
  { timestamps: true }
);

// Uniqueness guarantee: one photo document per user, period.
profilePhotoSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('ProfilePhoto', profilePhotoSchema);
