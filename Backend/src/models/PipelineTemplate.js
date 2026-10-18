const mongoose = require('mongoose');

const pipelineTemplateSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    stages: [
      {
        key: { type: String, required: true },
        name: { type: String, required: true },
        type: {
          type: String,
          enum: ['active', 'offer', 'hired', 'rejected'],
          default: 'active',
        },
        slaDays: { type: Number, default: 5, min: 1 },
        order: { type: Number, required: true },
        color: { type: String, default: '#2563eb' },
      },
    ],
  },
  { timestamps: true }
);

pipelineTemplateSchema.index({ organizationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('PipelineTemplate', pipelineTemplateSchema);
