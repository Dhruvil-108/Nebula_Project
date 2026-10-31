const mongoose = require('mongoose');

const mileageRateSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    vehicleType: {
      type: String,
      enum: ['car', 'motorcycle', 'bicycle', 'electric', 'van'],
      default: 'car',
    },
    ratePerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      enum: ['km', 'mile'],
      default: 'km',
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    effectiveTo: {
      type: Date,
      default: null,
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

mileageRateSchema.index({ organizationId: 1, vehicleType: 1, active: 1 });

module.exports = mongoose.model('MileageRate', mileageRateSchema);
