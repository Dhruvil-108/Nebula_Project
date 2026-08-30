const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [200, 'Organization name cannot exceed 200 characters'],
    },
    companySize: {
      type: String,
      enum: {
        values: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
        message: '{VALUE} is not a valid company size',
      },
      default: null,
    },
    industry: {
      type: String,
      trim: true,
      default: null,
    },
    primaryFocus: {
      type: [String],
      enum: {
        values: ['crm', 'hrms', 'recruitment', 'expenses', 'inventory', 'analytics', 'all'],
        message: '{VALUE} is not a valid focus area',
      },
      default: ['all'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Set after user creation within the transaction
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
