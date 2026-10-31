const mongoose = require('mongoose');

const CLAIM_STATUSES = [
  'draft',
  'submitted',
  'manager_approved',
  'approved',
  'rejected',
  'reimbursed',
  'cancelled',
];

const PAYMENT_METHODS = ['bank_transfer', 'payroll', 'company_card', 'cash', 'check'];

const expenseItemSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpenseCategory',
    required: [true, 'Expense category is required'],
  },
  expenseDate: {
    type: Date,
    required: [true, 'Expense date is required'],
  },
  merchant: {
    type: String,
    required: [true, 'Merchant name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  amount: {
    type: Number,
    required: [true, 'Item amount is required'],
    min: [0.01, 'Amount must be greater than zero'],
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative'],
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    trim: true,
  },
  receiptUrl: {
    type: String,
    trim: true,
    default: '',
  },
  receiptFileName: {
    type: String,
    trim: true,
    default: '',
  },
  receiptHash: {
    type: String,
    trim: true,
    default: '',
  },
  baseAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  fxRate: {
    type: Number,
    default: 1,
    min: 0,
  },
  lineStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
    trim: true,
    default: '',
  },
  allocations: [
    {
      costCenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'CostCenter' },
      projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
      percent: { type: Number, default: 100 },
    },
  ],
  expenseType: {
    type: String,
    enum: ['receipt', 'mileage', 'per_diem'],
    default: 'receipt',
  },
  mileageDetails: {
    distance: { type: Number, default: 0 },
    unit: { type: String, enum: ['km', 'mile'], default: 'km' },
    vehicleType: { type: String, default: 'car' },
    ratePerUnit: { type: Number, default: 0 },
  },
  perDiemDetails: {
    destination: { type: String, default: '' },
    days: { type: Number, default: 1 },
    ratePerDay: { type: Number, default: 0 },
    breakfastProvided: { type: Boolean, default: false },
    lunchProvided: { type: Boolean, default: false },
    dinnerProvided: { type: Boolean, default: false },
  },
  taxCodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaxCode',
    default: null,
  },
  isBillableToClient: {
    type: Boolean,
    default: false,
  },
  clientName: {
    type: String,
    trim: true,
    default: '',
  },
});

const expenseClaimSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    claimNumber: {
      type: String,
      required: [true, 'Claim number is required'],
      trim: true,
      uppercase: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee (User) is required'],
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Claim title is required'],
      trim: true,
    },
    items: {
      type: [expenseItemSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalTaxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    baseCurrency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    totalBase: {
      type: Number,
      default: 0,
      min: 0,
    },
    fxSnapshot: {
      type: Map,
      of: Number,
      default: {},
    },
    status: {
      type: String,
      enum: CLAIM_STATUSES,
      default: 'draft',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    costCenterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CostCenter',
      default: null,
    },
    travelRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TravelRequest',
      default: null,
      index: true,
    },
    cashAdvanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CashAdvance',
      default: null,
      index: true,
    },
    advanceDeductedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    netReimbursableAmount: {
      type: Number,
      default: 0,
    },
    paymentBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentBatch',
      default: null,
      index: true,
    },
    approvalRoute: [
      {
        stepOrder: Number,
        approverType: String,
        approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        approvedAt: Date,
        comments: { type: String, default: '' },
      },
    ],
    currentStepIndex: {
      type: Number,
      default: 0,
    },
    violations: [
      {
        policyId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpensePolicy' },
        ruleType: String,
        severity: { type: String, enum: ['info', 'warn', 'block'] },
        message: String,
        userJustification: String,
      },
    ],
    version: {
      type: Number,
      default: 1,
    },
    // Multi-tier Approval Tracking
    managerApproval: {
      approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: Date,
      comments: { type: String, default: '' },
    },
    financeApproval: {
      approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: Date,
      comments: { type: String, default: '' },
    },
    rejection: {
      rejectedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectedAt: Date,
      reason: { type: String, default: '' },
      stage: { type: String, enum: ['manager', 'finance'] },
    },
    // Reimbursement Details
    reimbursement: {
      reimbursedAt: Date,
      reimbursedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'bank_transfer' },
      transactionReference: { type: String, default: '', trim: true },
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

// Unique claim number per organization
expenseClaimSchema.index({ organizationId: 1, claimNumber: 1 }, { unique: true });
expenseClaimSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });

module.exports = mongoose.model('ExpenseClaim', expenseClaimSchema);
