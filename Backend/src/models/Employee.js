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
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    designation: {
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
