const mongoose = require('mongoose');

const contributingFactorSchema = new mongoose.Schema(
  {
    factor: {
      type: String,
      required: true,
      trim: true,
    },
    weight: {
      type: Number,
      required: true,
      default: 1,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    metricValue: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const attritionRiskSchema = new mongoose.Schema(
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
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 15,
      index: true,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
      index: true,
    },
    contributingFactors: [contributingFactorSchema],
    suggestedInterventions: [
      {
        type: String,
        trim: true,
      },
    ],
    lastPromotedOrIncrementedMonths: {
      type: Number,
      default: 0,
    },
    attendanceStabilityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 95,
    },
    leaveFrequencyTrend: {
      type: String,
      enum: ['stable', 'increasing', 'sporadic'],
      default: 'stable',
    },
    computedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

attritionRiskSchema.index({ organizationId: 1, employeeId: 1 }, { unique: true });
attritionRiskSchema.index({ organizationId: 1, riskLevel: 1 });

module.exports = mongoose.model('AttritionRisk', attritionRiskSchema);
