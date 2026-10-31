const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Shift name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Shift code is required'],
      trim: true,
      uppercase: true,
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required (HH:MM format)'],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, 'End time is required (HH:MM format)'],
      trim: true,
    },
    graceMinutes: {
      type: Number,
      default: 15,
      min: 0,
      max: 120,
    },
    halfDayMinutes: {
      type: Number,
      default: 270, // 4.5 hours
      min: 60,
    },
    fullDayMinutes: {
      type: Number,
      default: 480, // 8.0 hours
      min: 120,
    },
    workWeekDays: {
      type: [Number], // 0 = Sun, 1 = Mon ... 6 = Sat
      default: [1, 2, 3, 4, 5],
    },
    isNightShift: {
      type: Boolean,
      default: false,
    },
    breakDurationMinutes: {
      type: Number,
      default: 60,
      min: 0,
    },
    color: {
      type: String,
      default: '#f97316',
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

shiftSchema.index({ organizationId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Shift', shiftSchema);
