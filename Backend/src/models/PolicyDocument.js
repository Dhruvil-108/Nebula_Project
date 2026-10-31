const mongoose = require('mongoose');

const acknowledgementSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    acknowledgedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const policyDocumentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['leave_wfh', 'conduct_ethics', 'it_security', 'compensation', 'health_safety', 'general'],
      default: 'general',
      index: true,
    },
    version: { type: String, default: '1.0' },
    effectiveDate: { type: Date, default: Date.now },
    content: { type: String, required: true },
    isRequiredAcknowledgement: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    acknowledgements: [acknowledgementSchema],
  },
  { timestamps: true }
);

policyDocumentSchema.index({ organizationId: 1, category: 1 });

module.exports = mongoose.model('PolicyDocument', policyDocumentSchema);
