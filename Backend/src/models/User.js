const mongoose = require('mongoose');
const { ALL_ROLES } = require('../config/roles');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [150, 'Full name cannot exceed 150 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: {
        values: ALL_ROLES,
        message: '{VALUE} is not a valid role',
      },
      required: [true, 'Role is required'],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'invited', 'disabled'],
        message: '{VALUE} is not a valid status',
      },
      default: 'active',
    },
    /**
     * We store a bcrypt hash of the refresh token, never the raw token.
     * On refresh, we compare the incoming token against this hash.
     * Null means no active session.
     */
    refreshTokenHash: {
      type: String,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

/**
 * Compound unique index: email is unique WITHIN an organization.
 * The same person can have accounts across different organizations
 * (though in our current login flow we treat email as globally unique).
 */
userSchema.index({ email: 1, organizationId: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
