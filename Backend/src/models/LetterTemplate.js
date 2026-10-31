const mongoose = require('mongoose');

const issuedLetterSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    letterNumber: { type: String, required: true },
    contentSnapshot: { type: String, required: true },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    issuedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const letterTemplateSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    letterType: {
      type: String,
      enum: ['experience', 'relieving', 'promotion', 'verification', 'custom'],
      default: 'verification',
      index: true,
    },
    subject: { type: String, required: true, trim: true },
    bodyTemplate: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    issuedLetters: [issuedLetterSchema],
  },
  { timestamps: true }
);

letterTemplateSchema.index({ organizationId: 1, letterType: 1 });

module.exports = mongoose.model('LetterTemplate', letterTemplateSchema);
