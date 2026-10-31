const mongoose = require('mongoose');

const taxCodeSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    ratePercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    isRecoverable: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
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

taxCodeSchema.index({ organizationId: 1, code: 1, active: 1 });

module.exports = mongoose.model('TaxCode', taxCodeSchema);
