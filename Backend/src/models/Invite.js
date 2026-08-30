const mongoose = require('mongoose');
const { INVITABLE_ROLES } = require('../config/roles');

const inviteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Invite email is required'],
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: {
        values: INVITABLE_ROLES,
        message: '{VALUE} is not a valid invitable role',
      },
      required: [true, 'Role is required for invite'],
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /** Unique, cryptographically random token sent in the invite email link. */
    token: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'expired'],
        message: '{VALUE} is not a valid invite status',
      },
      default: 'pending',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

/** TTL index: MongoDB will auto-delete expired invites after their expiresAt date. */
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Invite', inviteSchema);
