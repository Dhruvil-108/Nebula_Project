const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Holiday name is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Holiday date is required'],
      // Midnight UTC
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

holidaySchema.index({ organizationId: 1, date: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);
