const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['technical', 'leadership', 'functional', 'soft_skills', 'compliance', 'tools'],
      default: 'technical',
      index: true,
    },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

skillSchema.index({ organizationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Skill', skillSchema);
