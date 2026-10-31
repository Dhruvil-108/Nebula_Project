const mongoose = require('mongoose');

const aiRunSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    task: {
      type: String,
      required: true,
      index: true,
    },
    promptVersion: {
      type: String,
      default: 'v1.0',
    },
    model: {
      type: String,
      default: 'gemini-flash-latest',
    },
    inputHash: {
      type: String,
      index: true,
    },
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpenseClaim',
      index: true,
    },
    tokensUsed: {
      inputTokens: { type: Number, default: 0 },
      outputTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    resultSummary: {
      type: String,
    },
    userInteraction: {
      type: String,
      enum: ['pending', 'accepted', 'edited', 'discarded'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

aiRunSchema.index({ organizationId: 1, task: 1, createdAt: -1 });

module.exports = mongoose.model('AiRun', aiRunSchema);
