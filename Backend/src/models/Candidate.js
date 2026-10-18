const mongoose = require('mongoose');

const CANDIDATE_STAGES = [
  'applied',
  'screening',
  'interview_round_1',
  'interview_round_2',
  'technical_assessment',
  'hr_round',
  'offer_sent',
  'hired',
  'rejected',
  'withdrawn',
];

const CANDIDATE_SOURCES = [
  'careers_page',
  'linkedin',
  'referral',
  'recruiter_outreach',
  'job_portal',
  'agency',
  'other',
];

const candidateSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    candidateCode: {
      type: String,
      required: [true, 'Candidate code is required'],
      trim: true,
      uppercase: true,
    },
    jobOpeningId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOpening',
      default: null,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [150, 'Full name cannot exceed 150 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    currentCompany: {
      type: String,
      trim: true,
      default: '',
    },
    currentDesignation: {
      type: String,
      trim: true,
      default: '',
    },
    totalExperienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    portfolioUrl: {
      type: String,
      trim: true,
      default: '',
    },
    linkedinUrl: {
      type: String,
      trim: true,
      default: '',
    },
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },
    resumeUrl: {
      type: String,
      trim: true,
      default: '',
    },
    resumeFileName: {
      type: String,
      trim: true,
      default: '',
    },
    resumeFileId: {
      type: String,
      default: '',
    },
    parsedProfile: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    talentPoolIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TalentPool',
      },
    ],
    consent: {
      capturedAt: { type: Date, default: null },
      ipAddress: { type: String, default: '' },
      consentVersion: { type: String, default: 'v1' },
    },
    doNotHire: {
      type: Boolean,
      default: false,
      index: true,
    },
    mergedInto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      default: null,
    },
    skills: {
      type: [String],
      default: [],
    },
    expectedSalary: {
      type: Number,
      default: 0,
    },
    noticePeriodDays: {
      type: Number,
      default: 30,
    },
    source: {
      type: String,
      enum: {
        values: CANDIDATE_SOURCES,
        message: '{VALUE} is not a valid candidate source',
      },
      default: 'careers_page',
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    stage: {
      type: String,
      enum: {
        values: CANDIDATE_STAGES,
        message: '{VALUE} is not a valid candidate stage',
      },
      default: 'applied',
      index: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    stageHistory: [
      {
        fromStage: { type: String, required: true },
        toStage: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
    convertedEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    hiredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

candidateSchema.index({ organizationId: 1, candidateCode: 1 }, { unique: true });
candidateSchema.index({ organizationId: 1, jobOpeningId: 1, stage: 1 });
candidateSchema.index({ organizationId: 1, email: 1 });
candidateSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('Candidate', candidateSchema);
module.exports.CANDIDATE_STAGES = CANDIDATE_STAGES;
module.exports.CANDIDATE_SOURCES = CANDIDATE_SOURCES;
