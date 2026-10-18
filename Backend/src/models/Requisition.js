const mongoose = require('mongoose');

const REQUISITION_STATUSES = ['draft', 'pending_approval', 'approved', 'rejected', 'converted_to_job'];
const REQUISITION_REASONS = ['new_headcount', 'replacement', 'expansion'];

const requisitionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    reqCode: {
      type: String,
      required: [true, 'Requisition code is required'],
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, 'Role title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
      index: true,
    },
    employmentType: {
      type: String,
      default: 'full_time',
    },
    experienceLevel: {
      type: String,
      default: 'mid',
    },
    locationType: {
      type: String,
      default: 'hybrid',
    },
    location: {
      type: String,
      default: '',
    },
    openPositions: {
      type: Number,
      default: 1,
      min: [1, 'Open positions must be at least 1'],
    },
    budget: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'USD', uppercase: true },
    },
    reason: {
      type: String,
      enum: {
        values: REQUISITION_REASONS,
        message: '{VALUE} is not a valid requisition reason',
      },
      default: 'new_headcount',
    },
    replacementForEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    justification: {
      type: String,
      required: [true, 'Business justification is required'],
      trim: true,
    },
    targetStartDate: {
      type: Date,
      default: null,
    },
    approvalChain: [
      {
        stepNumber: { type: Number, required: true },
        approverRole: { type: String, required: true },
        approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
        comments: { type: String, default: '' },
        actionedAt: { type: Date, default: null },
      },
    ],
    status: {
      type: String,
      enum: {
        values: REQUISITION_STATUSES,
        message: '{VALUE} is not a valid requisition status',
      },
      default: 'draft',
      index: true,
    },
    jobOpeningId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOpening',
      default: null,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

requisitionSchema.index({ organizationId: 1, reqCode: 1 }, { unique: true });
requisitionSchema.index({ organizationId: 1, status: 1 });
requisitionSchema.index({ organizationId: 1, departmentId: 1 });
requisitionSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('Requisition', requisitionSchema);
module.exports.REQUISITION_STATUSES = REQUISITION_STATUSES;
module.exports.REQUISITION_REASONS = REQUISITION_REASONS;
