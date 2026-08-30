const AuditLog = require('../models/AuditLog');

/**
 * Fire-and-forget audit log writer.
 * This NEVER blocks or rejects the request — audit failures are logged to console only.
 *
 * @param {{
 *   organizationId?: string,
 *   actor?: string,
 *   action: string,
 *   entity: string,
 *   entityId?: string,
 *   metadata?: object,
 *   ip?: string
 * }} params
 */
const createAuditLog = (params) => {
  AuditLog.create({
    organizationId: params.organizationId || null,
    actor: params.actor || null,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId || null,
    metadata: params.metadata || {},
    ip: params.ip || null,
  }).catch((err) => {
    // Audit failures must never surface to users
    console.error('[AuditLog] Failed to write audit entry:', err.message);
  });
};

module.exports = { createAuditLog };
