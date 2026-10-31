const mongoose = require('mongoose');

const peerReviewSchema = new mongoose.Schema(
  {
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    feedback: {
      type: String,
      default: '',
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const performanceReviewSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    reviewCycleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReviewCycle',
      required: true,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    selfReview: {
      summary: { type: String, default: '', trim: true },
      strengths: { type: String, default: '', trim: true },
      growthAreas: { type: String, default: '', trim: true },
      achievements: { type: String, default: '', trim: true },
      rating: { type: Number, min: 1, max: 5, default: null },
      submittedAt: { type: Date, default: null },
    },
    managerReview: {
      summary: { type: String, default: '', trim: true },
      strengths: { type: String, default: '', trim: true },
      growthAreas: { type: String, default: '', trim: true },
      rating: { type: Number, min: 1, max: 5, default: null },
      potentialRating: { type: Number, min: 1, max: 3, default: null }, // 1=low, 2=med, 3=high
      recommendations: { type: String, default: '', trim: true },
      submittedAt: { type: Date, default: null },
    },
    peerReviews: [peerReviewSchema],
    calibration: {
      nineBoxGrid: {
        performanceScore: { type: Number, min: 1, max: 3, default: 2 }, // 1=low, 2=medium, 3=high
        potentialScore: { type: Number, min: 1, max: 3, default: 2 },   // 1=low, 2=medium, 3=high
        boxLabel: {
          type: String,
          default: 'Core Contributor',
          enum: [
            'Risk / Underperformer',
            'Dilemma / Inconsistent',
            'Enigma / High Potential',
            'Effective Professional',
            'Core Contributor',
            'Growth Player',
            'Trusted Master',
            'High Performer',
            'Future Leader / Star',
          ],
        },
      },
      promotionRecommended: { type: Boolean, default: false },
      salaryIncrementPercentage: { type: Number, default: 0 },
      calibrationNotes: { type: String, default: '' },
      calibratedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      calibratedAt: { type: Date, default: null },
    },
    status: {
      type: String,
      enum: ['pending_self', 'pending_manager', 'in_calibration', 'completed'],
      default: 'pending_self',
      index: true,
    },
    sharedWithEmployee: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

performanceReviewSchema.index({ organizationId: 1, reviewCycleId: 1, employeeId: 1 }, { unique: true });
performanceReviewSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('PerformanceReview', performanceReviewSchema);
