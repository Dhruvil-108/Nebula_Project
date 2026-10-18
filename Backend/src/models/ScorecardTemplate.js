const mongoose = require('mongoose');

const competencyDefSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    weight: {
      type: Number,
      default: 1,
      min: 0.1,
      max: 100,
    },
    rubric: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const scorecardTemplateSchema = new mongoose.Schema(
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
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    department: {
      type: String,
      default: 'General',
      trim: true,
    },
    roleType: {
      type: String,
      default: 'all',
      trim: true,
    },
    competencies: {
      type: [competencyDefSchema],
      default: [
        { name: 'Core Technical Skill', description: 'Proficiency in essential tools and frameworks', weight: 1.5 },
        { name: 'Problem Solving & Architecture', description: 'Analytical approach, design clarity, edge case handling', weight: 1.5 },
        { name: 'Communication & Collaboration', description: 'Clarity, listening skills, cross-team empathy', weight: 1 },
        { name: 'Culture & Core Values', description: 'Alignment with company mission and team dynamics', weight: 1 },
      ],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

scorecardTemplateSchema.index({ organizationId: 1, name: 1 });

module.exports = mongoose.model('ScorecardTemplate', scorecardTemplateSchema);
