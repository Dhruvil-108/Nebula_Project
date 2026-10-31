const mongoose = require('mongoose');

const fxRateSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    baseCurrency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    foreignCurrency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0.000001,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    source: {
      type: String,
      default: 'manual',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

fxRateSchema.index({ organizationId: 1, baseCurrency: 1, foreignCurrency: 1, effectiveDate: -1 });

module.exports = mongoose.model('FxRate', fxRateSchema);
