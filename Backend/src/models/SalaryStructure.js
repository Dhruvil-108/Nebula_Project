const mongoose = require('mongoose');

const salaryStructureSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    templateName: {
      type: String,
      trim: true,
      default: 'Standard Full-Time',
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'USD',
    },
    annualCtc: {
      type: Number,
      required: true,
      min: 0,
    },
    monthlyCtc: {
      type: Number,
      required: true,
      min: 0,
    },
    earnings: {
      basic: { type: Number, default: 0, min: 0 },
      hra: { type: Number, default: 0, min: 0 },
      specialAllowance: { type: Number, default: 0, min: 0 },
      conveyance: { type: Number, default: 0, min: 0 },
      medicalAllowance: { type: Number, default: 0, min: 0 },
      performanceBonus: { type: Number, default: 0, min: 0 },
      otherEarnings: { type: Number, default: 0, min: 0 },
    },
    deductions: {
      providentFund: { type: Number, default: 0, min: 0 }, // Employee PF contribution
      professionalTax: { type: Number, default: 0, min: 0 },
      incomeTaxTds: { type: Number, default: 0, min: 0 }, // Monthly TDS
      esi: { type: Number, default: 0, min: 0 }, // Employee State Insurance
      otherDeductions: { type: Number, default: 0, min: 0 },
    },
    employerContributions: {
      pfEmployer: { type: Number, default: 0, min: 0 },
      esiEmployer: { type: Number, default: 0, min: 0 },
      gratuityAccrual: { type: Number, default: 0, min: 0 },
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

salaryStructureSchema.index({ organizationId: 1, employeeId: 1, isActive: 1 });

module.exports = mongoose.model('SalaryStructure', salaryStructureSchema);
