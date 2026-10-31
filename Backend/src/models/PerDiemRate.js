const mongoose = require('mongoose');

const perDiemRateSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      default: '',
      trim: true,
    },
    tier: {
      type: String,
      enum: ['standard', 'tier_1', 'tier_2', 'tier_3', 'high_cost'],
      default: 'standard',
    },
    ratePerDay: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    breakfastDeductionPercent: {
      type: Number,
      default: 20, // 20% deduction if breakfast provided
      min: 0,
      max: 100,
    },
    lunchDeductionPercent: {
      type: Number,
      default: 30, // 30% deduction if lunch provided
      min: 0,
      max: 100,
    },
    dinnerDeductionPercent: {
      type: Number,
      default: 50, // 50% deduction if dinner provided
      min: 0,
      max: 100,
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

perDiemRateSchema.index({ organizationId: 1, destination: 1, active: 1 });

module.exports = mongoose.model('PerDiemRate', perDiemRateSchema);
