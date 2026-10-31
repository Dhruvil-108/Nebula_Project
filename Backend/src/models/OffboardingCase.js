const mongoose = require('mongoose');

const clearanceDeptSchema = new mongoose.Schema(
  {
    isCleared: { type: Boolean, default: false },
    clearedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    clearedAt: { type: Date, default: null },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const offboardingCaseSchema = new mongoose.Schema(
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
    resignationDate: { type: Date, required: true, default: Date.now },
    noticePeriodDays: { type: Number, default: 30 },
    lastWorkingDate: { type: Date, required: true },
    reason: {
      type: String,
      enum: ['better_opportunity', 'relocation', 'higher_studies', 'health', 'personal', 'involuntary', 'other'],
      default: 'better_opportunity',
    },
    reasonDetails: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending_approval', 'approved', 'in_clearance', 'completed', 'rejected', 'withdrawn'],
      default: 'pending_approval',
      index: true,
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    clearances: {
      it: { type: clearanceDeptSchema, default: () => ({}) },
      finance: { type: clearanceDeptSchema, default: () => ({}) },
      adminAssets: {
        isCleared: { type: Boolean, default: false },
        clearedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        clearedAt: { type: Date, default: null },
        notes: { type: String, default: '' },
        pendingAssetsCount: { type: Number, default: 0 },
      },
      hr: { type: clearanceDeptSchema, default: () => ({}) },
    },
    exitInterview: {
      completed: { type: Boolean, default: false },
      conductedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      notes: { type: String, default: '' },
      overallExperienceRating: { type: Number, min: 1, max: 5, default: null },
    },
    fnfSettlement: {
      isHandedOff: { type: Boolean, default: false },
      settlementAmount: { type: Number, default: 0 },
      settledAt: { type: Date, default: null },
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

offboardingCaseSchema.index({ organizationId: 1, employeeId: 1 });
offboardingCaseSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('OffboardingCase', offboardingCaseSchema);
