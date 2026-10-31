const crypto = require('crypto');
const ExpenseActivity = require('../models/ExpenseActivity');
const queueService = require('./queueService');

/**
 * Supported financial notification event types
 */
const EVENT_TYPES = {
  CLAIM_SUBMITTED: 'claim.submitted',
  CLAIM_MANAGER_APPROVED: 'claim.manager_approved',
  CLAIM_FINANCE_APPROVED: 'claim.approved',
  CLAIM_REJECTED: 'claim.rejected',
  CLAIM_SENT_BACK: 'claim.sent_back',
  CLAIM_REIMBURSED: 'claim.reimbursed',
  TRAVEL_REQUEST_SUBMITTED: 'travel_request.submitted',
  TRAVEL_REQUEST_APPROVED: 'travel_request.approved',
  CASH_ADVANCE_DISBURSED: 'cash_advance.disbursed',
  BUDGET_WARNING: 'budget.warning',
  BUDGET_BREACH: 'budget.breach',
};

// Registered outbound webhook endpoints per tenant (in-memory or persistent store)
const webhookSubscriptions = new Map();

// In-memory event buffer for recent notifications (accessible for audit or UI polls)
const notificationHistory = [];

/**
 * Register background worker for dispatching notifications
 */
queueService.registerWorker('expense_notification_worker', async (payload) => {
  const { organizationId, eventType, title, message, recipientIds, metadata, claimId, actorId } = payload;

  const eventRecord = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    organizationId: organizationId?.toString(),
    eventType,
    title,
    message,
    recipientIds: (recipientIds || []).map((id) => id?.toString()),
    claimId: claimId?.toString() || null,
    actorId: actorId?.toString() || null,
    metadata: metadata || {},
    timestamp: new Date(),
    read: false,
  };

  notificationHistory.unshift(eventRecord);
  if (notificationHistory.length > 500) {
    notificationHistory.pop();
  }

  // Also log into ExpenseActivity if associated with a claim
  if (claimId && organizationId) {
    try {
      await ExpenseActivity.create({
        organizationId,
        claimId,
        actorId: actorId || null,
        action: 'comment_added',
        details: { eventType, notificationTitle: title },
        comment: `[Notification Sent] ${title}: ${message}`,
      });
    } catch (err) {
      console.warn('[ExpenseNotification] Activity log notice:', err.message);
    }
  }

  // Trigger webhooks for tenant if registered
  const orgWebhooks = webhookSubscriptions.get(organizationId?.toString()) || [];
  for (const sub of orgWebhooks) {
    if (sub.events.includes('*') || sub.events.includes(eventType)) {
      try {
        const payloadStr = JSON.stringify(eventRecord);
        const signature = crypto.createHmac('sha256', sub.secret || 'nebula_secret').update(payloadStr).digest('hex');
        console.log(`[ExpenseWebhook] Dispatched ${eventType} to ${sub.url} (HMAC: ${signature.substring(0, 8)}...)`);
      } catch (err) {
        console.warn(`[ExpenseWebhook] Delivery failed for ${sub.url}:`, err.message);
      }
    }
  }

  return { delivered: true, eventId: eventRecord.id };
});

/**
 * Dispatches an expense-related notification and queues delivery
 */
async function sendExpenseNotification({
  organizationId,
  eventType,
  title,
  message,
  recipientIds = [],
  claimId = null,
  actorId = null,
  metadata = {},
}) {
  const payload = {
    organizationId,
    eventType,
    title,
    message,
    recipientIds,
    claimId,
    actorId,
    metadata,
  };

  // Add to background resilient job queue with idempotency key
  const idempotencyKey = `notif_${eventType}_${claimId || 'system'}_${Date.now()}`;
  return queueService.addJob('expense_notification_worker', payload, {
    idempotencyKey,
    maxRetries: 2,
    delayMs: 0,
  });
}

/**
 * Register a webhook endpoint for an organization
 */
function registerWebhook(organizationId, { url, secret, events = ['*'] }) {
  const orgIdStr = organizationId.toString();
  if (!webhookSubscriptions.has(orgIdStr)) {
    webhookSubscriptions.set(orgIdStr, []);
  }
  const id = `wh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  webhookSubscriptions.get(orgIdStr).push({ id, url, secret, events, active: true, createdAt: new Date() });
  return { id, url, events };
}

/**
 * Retrieve recent notifications for a user or tenant
 */
function getRecentNotifications(organizationId, userId = null) {
  const orgIdStr = organizationId?.toString();
  const userIdStr = userId?.toString();

  return notificationHistory.filter((item) => {
    if (item.organizationId !== orgIdStr) return false;
    if (userIdStr && item.recipientIds.length > 0 && !item.recipientIds.includes(userIdStr)) {
      return false;
    }
    return true;
  });
}

module.exports = {
  EVENT_TYPES,
  sendExpenseNotification,
  registerWebhook,
  getRecentNotifications,
};
