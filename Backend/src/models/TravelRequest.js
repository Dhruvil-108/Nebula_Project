const mongoose = require('mongoose');

const TRAVEL_REQUEST_STATUSES = [
  'draft',
  'submitted',
  'approved',
  'rejected',
  'cancelled',
  'closed',
];

const travelRequestSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    requestNumber: {
      type: String,
      required: [true, 'Request number is required'],
      trim: true,
      uppercase: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    costCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CostCenter',
      default: null,
      index: true,
    },
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    purpose: {
      type: String,
      required: [true, 'Business purpose is required'],
      trim: true,
    },
    estimatedExpenses: {
      flights: { type: Number, default: 0, min: 0 },
      lodging: { type: Number, default: 0, min: 0 },
      meals: { type: Number, default: 0, min: 0 },
      transport: { type: Number, default: 0, min: 0 },
      incidentals: { type: Number, default: 0, min: 0 },
      other: { type: Number, default: 0, min: 0 },
    },
    totalEstimated: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: TRAVEL_REQUEST_STATUSES,
      default: 'draft',
      index: true,
    },
    approval: {
      approvedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: Date,
      comments: { type: String, default: '', trim: true },
    },
    rejection: {
      rejectedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectedAt: Date,
      reason: { type: String, default: '', trim: true },
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    submittedAt: Date,
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

travelRequestSchema.index({ organizationId: 1, requestNumber: 1 }, { unique: true });
travelRequestSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });

module.exports = mongoose.model('TravelRequest', travelRequestSchema);
