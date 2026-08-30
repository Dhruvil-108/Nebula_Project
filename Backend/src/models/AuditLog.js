const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    /** The user who performed the action. Null for system actions (e.g., expired token cleanup). */
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    /** e.g., "signup" | "login" | "logout" | "invite_sent" | "password_reset" */
    action: {
      type: String,
      required: true,
      index: true,
    },
    /** The model/entity type affected, e.g., "Organization" | "User" | "Invite" */
    entity: {
      type: String,
      required: true,
    },
    /** The specific document ID affected. */
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    /** Arbitrary key-value metadata for the action (e.g., userAgent, role assigned). */
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    /** Client IP address. May be null if not available. */
    ip: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    // Audit logs are append-only; disable Mongoose versionKey (__v)
    versionKey: false,
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
