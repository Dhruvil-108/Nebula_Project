const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    entityType: {
      type: String,
      required: [true, 'entityType is required'],
      trim: true,
      lowercase: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index guaranteeing uniqueness per tenant and entity type
counterSchema.index({ organizationId: 1, entityType: 1 }, { unique: true });

module.exports = mongoose.model('Counter', counterSchema);
