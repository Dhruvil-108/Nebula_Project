const mongoose = require('mongoose');

const rejectionReasonSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    label: {
      type: String,
      required: [true, 'Reason label is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['competency', 'compensation', 'behavioral', 'process', 'candidate_choice', 'other'],
      default: 'competency',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

rejectionReasonSchema.index({ organizationId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('RejectionReason', rejectionReasonSchema);
