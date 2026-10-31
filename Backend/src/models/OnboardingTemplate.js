const mongoose = require('mongoose');

const onboardingTaskDefSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    assignedRole: {
      type: String,
      enum: ['hr', 'it', 'finance', 'manager', 'employee'],
      required: true,
      default: 'hr',
    },
    daysDueFromJoining: { type: Number, default: 0 },
    isRequired: { type: Boolean, default: true },
  },
  { _id: true }
);

const onboardingTemplateSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Designation',
      default: null,
    },
    tasks: [onboardingTaskDefSchema],
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

onboardingTemplateSchema.index({ organizationId: 1, isDefault: 1 });

module.exports = mongoose.model('OnboardingTemplate', onboardingTemplateSchema);
