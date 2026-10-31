const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Project code is required'],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    crmAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    budgetLimit: {
      type: Number,
      default: 0, // 0 = unlimited
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

projectSchema.index({ organizationId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Project', projectSchema);
