const AuditLog = require('../models/AuditLog');

/**
 * Computes a shallow/field-level diff between two states.
 */
function computeFieldDiff(before, after) {
  if (!before || !after) return [];
  const changes = [];
  const b = typeof before.toObject === 'function' ? before.toObject() : before;
  const a = typeof after.toObject === 'function' ? after.toObject() : after;

  const sensitiveFields = ['password', 'salt', 'token', 'secret', '__v', 'updatedAt'];
  const allKeys = new Set([...Object.keys(b || {}), ...Object.keys(a || {})]);

  for (const key of allKeys) {
    if (sensitiveFields.includes(key)) continue;
    const oldVal = b ? b[key] : undefined;
    const newVal = a ? a[key] : undefined;

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        field: key,
        oldVal: oldVal !== undefined ? oldVal : null,
        newVal: newVal !== undefined ? newVal : null,
      });
    }
  }

  return changes;
}

/**
 * Logs an immutable audit event for compliance and security.
 */
async function logAuditEvent({
  organizationId,
  actorId = null,
  action,
  entity,
  entityId = null,
  before = null,
  after = null,
  metadata = {},
  ip = null,
}) {
  try {
    const changes = computeFieldDiff(before, after);
    const logData = {
      organizationId,
      actor: actorId,
      action,
      entity,
      entityId,
      metadata: {
        ...metadata,
        changes: changes.length > 0 ? changes : undefined,
      },
      ip,
    };

    const entry = await AuditLog.create(logData);
    return entry;
  } catch (err) {
    console.error('[auditService.logAuditEvent] Error logging audit event:', err);
    return null;
  }
}

/**
 * Fetches paginated audit logs for an organization.
 */
async function getAuditLogs({ organizationId, entity, action, page = 1, limit = 50 }) {
  const query = { organizationId };
  if (entity) query.entity = entity;
  if (action) query.action = action;

  const skip = (Math.max(1, page) - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('actor', 'fullName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(query),
  ]);

  return {
    logs,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / limit),
  };
}

module.exports = {
  logAuditEvent,
  computeFieldDiff,
  getAuditLogs,
};
