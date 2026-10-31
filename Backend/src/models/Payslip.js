const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    payrollRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PayrollRun',
      required: true,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    slipCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'paid', 'void'],
      default: 'draft',
      index: true,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'USD',
    },
    // Attendance metrics for the payroll period
    attendanceSummary: {
      totalDaysInMonth: { type: Number, default: 30 },
      workingDays: { type: Number, default: 22 },
      presentDays: { type: Number, default: 0 },
      paidLeaveDays: { type: Number, default: 0 },
      weeklyOffDays: { type: Number, default: 0 },
      holidayDays: { type: Number, default: 0 },
      lopDays: { type: Number, default: 0 }, // Unpaid leave or unregularized absence
      payableDays: { type: Number, default: 0 },
    },
    // Earnings component line items
    earnings: {
      basic: { type: Number, default: 0, min: 0 },
      hra: { type: Number, default: 0, min: 0 },
      specialAllowance: { type: Number, default: 0, min: 0 },
      conveyance: { type: Number, default: 0, min: 0 },
      medicalAllowance: { type: Number, default: 0, min: 0 },
      performanceBonus: { type: Number, default: 0, min: 0 },
      reimbursements: { type: Number, default: 0, min: 0 },
      otherEarnings: { type: Number, default: 0, min: 0 },
      grossEarnings: { type: Number, default: 0, min: 0 },
    },
    // Deductions component line items
    deductions: {
      providentFund: { type: Number, default: 0, min: 0 },
      professionalTax: { type: Number, default: 0, min: 0 },
      incomeTaxTds: { type: Number, default: 0, min: 0 },
      esi: { type: Number, default: 0, min: 0 },
      lopDeduction: { type: Number, default: 0, min: 0 },
      otherDeductions: { type: Number, default: 0, min: 0 },
      totalDeductions: { type: Number, default: 0, min: 0 },
    },
    // Net pay = grossEarnings - totalDeductions
    netPay: {
      type: Number,
      required: true,
      min: 0,
    },
    // Snapshot of statutory & bank details at time of generation
    bankDetailsSnapshot: {
      bankName: { type: String, default: '' },
      branchName: { type: String, default: '' },
      accountNumberMasked: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
    },
    panSnapshot: { type: String, default: '' },
    uanSnapshot: { type: String, default: '' },
    designationSnapshot: { type: String, default: '' },
    departmentSnapshot: { type: String, default: '' },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'processing', 'paid'],
      default: 'unpaid',
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    paymentReference: {
      type: String,
      trim: true,
      default: '',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

payslipSchema.index({ organizationId: 1, employeeId: 1, year: 1, month: 1 }, { unique: true });
payslipSchema.index({ organizationId: 1, payrollRunId: 1 });

module.exports = mongoose.model('Payslip', payslipSchema);
