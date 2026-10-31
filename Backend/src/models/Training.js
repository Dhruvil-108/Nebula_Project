const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    status: {
      type: String,
      enum: ['enrolled', 'in_progress', 'completed', 'dropped'],
      default: 'enrolled',
    },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    score: { type: Number, default: null },
    feedback: { type: String, default: '' },
  },
  { _id: true }
);

const trainingSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    category: {
      type: String,
      enum: ['technical', 'compliance', 'leadership', 'onboarding', 'security', 'product'],
      default: 'technical',
      index: true,
    },
    trainer: { type: String, default: 'Internal L&D' },
    durationHours: { type: Number, default: 4 },
    format: {
      type: String,
      enum: ['online_self_paced', 'in_person', 'virtual_live', 'hybrid'],
      default: 'online_self_paced',
    },
    scheduledDate: { type: Date, default: null },
    maxCapacity: { type: Number, default: 50 },
    status: {
      type: String,
      enum: ['draft', 'upcoming', 'active', 'completed', 'cancelled'],
      default: 'upcoming',
      index: true,
    },
    enrollments: [enrollmentSchema],
  },
  { timestamps: true }
);

trainingSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('Training', trainingSchema);
