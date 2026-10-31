const mongoose = require('mongoose');

const CHANGE_TYPES = [
  'promotion',
  'transfer',
  'designation_change',
  'manager_change',
  'grade_change',
  'employment_type_change',
];

const jobHistorySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    changeType: {
      type: String,
      enum: CHANGE_TYPES,
      required: true,
      index: true,
    },
    previousDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    newDepartmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    previousDesignation: {
      type: String,
      default: '',
    },
    newDesignation: {
      type: String,
      default: '',
    },
    previousGrade: {
      type: String,
      default: '',
    },
    newGrade: {
      type: String,
      default: '',
    },
    previousManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    newManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    effectiveDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

jobHistorySchema.index({ organizationId: 1, employeeId: 1, effectiveDate: -1 });

module.exports = mongoose.model('JobHistory', jobHistorySchema);
module.exports.CHANGE_TYPES = CHANGE_TYPES;
