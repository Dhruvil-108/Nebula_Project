const mongoose = require('mongoose');

const manpowerRequisitionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    requisitionCode: {
      type: String,
      required: true,
      trim: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Designation',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    openingsCount: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    justification: {
      type: String,
      enum: ['growth', 'backfill', 'restructuring', 'project_demand'],
      default: 'growth',
    },
    targetJoiningDate: {
      type: Date,
      required: true,
    },
    salaryRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'job_opened', 'fulfilled', 'rejected'],
      default: 'pending_approval',
      index: true,
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    linkedJobOpeningId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOpening',
      default: null,
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

manpowerRequisitionSchema.index({ organizationId: 1, requisitionCode: 1 }, { unique: true });
manpowerRequisitionSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('ManpowerRequisition', manpowerRequisitionSchema);
