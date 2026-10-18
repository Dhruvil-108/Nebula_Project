const mongoose = require('mongoose');

const talentPoolSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Talent pool name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    candidateIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
      },
    ],
    tags: {
      type: [String],
      default: [],
    },
    color: {
      type: String,
      default: '#f97316',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

talentPoolSchema.index({ organizationId: 1, name: 1 });
talentPoolSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('TalentPool', talentPoolSchema);
