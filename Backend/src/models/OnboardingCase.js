const mongoose = require('mongoose');

const onboardingTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    assignedRole: {
      type: String,
      enum: ['hr', 'it', 'finance', 'manager', 'employee'],
      required: true,
      default: 'hr',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    dueDate: { type: Date, required: true },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: { type: String, default: '' },
  },
  { _id: true }
);

const onboardingCaseSchema = new mongoose.Schema(
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
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OnboardingTemplate',
      default: null,
    },
    joiningDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'in_progress',
      index: true,
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    tasks: [onboardingTaskSchema],
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

onboardingCaseSchema.index({ organizationId: 1, employeeId: 1 });
onboardingCaseSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('OnboardingCase', onboardingCaseSchema);
