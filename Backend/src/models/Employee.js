const mongoose = require('mongoose');

const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'intern'];
const EMPLOYEE_STATUSES = ['active', 'on_notice', 'exited'];

const employeeSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    // Link to the login account, if the employee has one
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    employeeCode: {
      type: String,
      required: [true, 'Employee code is required'],
      trim: true,
      uppercase: true,
      maxlength: [32, 'Employee code cannot exceed 32 characters'],
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [150, 'Full name cannot exceed 150 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BranchLocation',
      default: null,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Designation',
      default: null,
      index: true,
    },
    designation: {
      type: String,
      trim: true,
      default: '',
    },
    grade: {
      type: String,
      trim: true,
      default: '',
    },
    joiningDate: {
      type: Date,
      default: null,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
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
    status: {
      type: String,
      enum: {
        values: EMPLOYEE_STATUSES,
        message: '{VALUE} is not a valid employee status',
      },
      default: 'active',
      index: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    // ── 360° Dossier: Personal & Demographic ──
    personalInfo: {
      dateOfBirth: { type: Date, default: null },
      gender: { type: String, trim: true, default: '' },
      maritalStatus: { type: String, trim: true, default: '' },
      bloodGroup: { type: String, trim: true, default: '' },
      nationality: { type: String, trim: true, default: 'Indian' },
      address: { type: String, trim: true, default: '' },
    },
    // ── 360° Dossier: Statutory & Tax Identification ──
    statutoryIds: {
      taxId: { type: String, trim: true, uppercase: true, default: '' }, // PAN / Tax ID
      nationalId: { type: String, trim: true, default: '' }, // Aadhaar / SSN
      passportNumber: { type: String, trim: true, uppercase: true, default: '' },
      drivingLicense: { type: String, trim: true, uppercase: true, default: '' },
    },
    // ── 360° Dossier: Bank & Payroll Disbursement ──
    bankDetails: {
      accountName: { type: String, trim: true, default: '' },
      accountNumber: { type: String, trim: true, default: '' },
      bankName: { type: String, trim: true, default: '' },
      ifscOrRouting: { type: String, trim: true, uppercase: true, default: '' },
      branchName: { type: String, trim: true, default: '' },
    },
    // ── 360° Dossier: Emergency Contacts ──
    emergencyContacts: [
      {
        name: { type: String, trim: true, default: '' },
        relationship: { type: String, trim: true, default: '' },
        phone: { type: String, trim: true, default: '' },
        email: { type: String, trim: true, default: '' },
        address: { type: String, trim: true, default: '' },
      },
    ],
    // ── 360° Dossier: Education & Academic Qualifications ──
    education: [
      {
        degree: { type: String, trim: true, default: '' },
        fieldOfStudy: { type: String, trim: true, default: '' },
        institution: { type: String, trim: true, default: '' },
        graduationYear: { type: Number, default: null },
        gradeOrGpa: { type: String, trim: true, default: '' },
      },
    ],
    // ── 360° Dossier: Prior Work Experience ──
    workHistory: [
      {
        companyName: { type: String, trim: true, default: '' },
        role: { type: String, trim: true, default: '' },
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
        description: { type: String, trim: true, default: '' },
      },
    ],
  },
  { timestamps: true }
);

// Employee code is unique within an organization
employeeSchema.index({ organizationId: 1, employeeCode: 1 }, { unique: true });
employeeSchema.index({ organizationId: 1, departmentId: 1 });
employeeSchema.index({ organizationId: 1, managerId: 1 });
employeeSchema.index({ organizationId: 1, status: 1 });
employeeSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('Employee', employeeSchema);
module.exports.EMPLOYMENT_TYPES = EMPLOYMENT_TYPES;
module.exports.EMPLOYEE_STATUSES = EMPLOYEE_STATUSES;
