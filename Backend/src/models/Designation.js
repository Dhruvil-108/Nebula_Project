const mongoose = require('mongoose');

const GRADE_LEVELS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'];

const designationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Designation title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    code: {
      type: String,
      required: [true, 'Designation code is required'],
      trim: true,
      uppercase: true,
      maxlength: [30, 'Code cannot exceed 30 characters'],
    },
    gradeLevel: {
      type: String,
      enum: GRADE_LEVELS,
      default: 'L2',
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    minExperienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

designationSchema.index({ organizationId: 1, code: 1 }, { unique: true });
designationSchema.index({ organizationId: 1, title: 1 });

module.exports = mongoose.model('Designation', designationSchema);
module.exports.GRADE_LEVELS = GRADE_LEVELS;
