const mongoose = require('mongoose');

const JOB_STATUSES = ['draft', 'published', 'on_hold', 'closed'];
const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'intern'];
const LOCATION_TYPES = ['remote', 'hybrid', 'on_site'];
const EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'lead', 'executive'];

const jobOpeningSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    jobCode: {
      type: String,
      required: [true, 'Job code is required'],
      trim: true,
      uppercase: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [200, 'Job title cannot exceed 200 characters'],
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    locationType: {
      type: String,
      enum: {
        values: LOCATION_TYPES,
        message: '{VALUE} is not a valid location type',
      },
      default: 'hybrid',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    employmentType: {
      type: String,
      enum: {
        values: EMPLOYMENT_TYPES,
        message: '{VALUE} is not a valid employment type',
      },
      default: 'full_time',
      index: true,
    },
    experienceLevel: {
      type: String,
      enum: {
        values: EXPERIENCE_LEVELS,
        message: '{VALUE} is not a valid experience level',
      },
      default: 'mid',
    },
    salaryRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'USD', uppercase: true },
      isPublic: { type: Boolean, default: false },
    },
    openPositions: {
      type: Number,
      default: 1,
      min: [1, 'Open positions must be at least 1'],
    },
    filledPositions: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: {
        values: JOB_STATUSES,
        message: '{VALUE} is not a valid job status',
      },
      default: 'published',
      index: true,
    },
    hiringManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedRecruiters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    description: {
      type: String,
      default: '',
    },
    requirements: {
      type: [String],
      default: [],
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    targetCloseDate: {
      type: Date,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
jobOpeningSchema.index({ organizationId: 1, jobCode: 1 }, { unique: true });
jobOpeningSchema.index({ organizationId: 1, status: 1 });
jobOpeningSchema.index({ organizationId: 1, departmentId: 1 });
jobOpeningSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('JobOpening', jobOpeningSchema);
module.exports.JOB_STATUSES = JOB_STATUSES;
module.exports.EMPLOYMENT_TYPES = EMPLOYMENT_TYPES;
module.exports.LOCATION_TYPES = LOCATION_TYPES;
module.exports.EXPERIENCE_LEVELS = EXPERIENCE_LEVELS;
