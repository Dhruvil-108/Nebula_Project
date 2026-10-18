const mongoose = require('mongoose');

const aiRunSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    task: {
      type: String,
      required: [true, 'Task identifier is required'],
      index: true,
    },
    promptVersion: {
      type: String,
      default: 'v1',
    },
    model: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      enum: ['gemini', 'fallback', 'other'],
      required: true,
    },
    inputHash: {
      type: String,
      default: '',
    },
    output: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    tokens: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    cost: {
      type: Number,
      default: 0,
    },
    entityType: {
      type: String,
      default: '',
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    humanDisposition: {
      type: String,
      enum: ['pending', 'accepted', 'edited', 'discarded'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

aiRunSchema.index({ organizationId: 1, task: 1, createdAt: -1 });
aiRunSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('AiRun', aiRunSchema);
