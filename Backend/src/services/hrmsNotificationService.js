const queueService = require('./queueService');

const hrmsNotificationHistory = [];

/**
 * Supported HRMS notification event types
 */
const HRMS_EVENT_TYPES = {
  LEAVE_SUBMITTED: 'leave.submitted',
  LEAVE_APPROVED: 'leave.approved',
  LEAVE_REJECTED: 'leave.rejected',
  ATTENDANCE_REGULARIZED: 'attendance.regularized',
  DOCUMENT_UPLOADED: 'document.uploaded',
  WORKFLOW_ASSIGNED: 'workflow.assigned',
  WORKFLOW_DECISION: 'workflow.decision',
};

/**
 * Dispatches an HRMS in-app and background notification.
 */
async function sendHrmsNotification({
  organizationId,
  recipientUserIds = [],
  eventType,
  title,
  message,
  referenceId = null,
  actionUrl = null,
  actorId = null,
}) {
  const notif = {
    id: `hrms_notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    organizationId: organizationId?.toString(),
    recipientUserIds: (recipientUserIds || []).map((id) => id?.toString()),
    eventType,
    title,
    message,
    referenceId: referenceId?.toString() || null,
    actionUrl,
    actorId: actorId?.toString() || null,
    read: false,
    createdAt: new Date(),
  };

  hrmsNotificationHistory.unshift(notif);
  if (hrmsNotificationHistory.length > 500) {
    hrmsNotificationHistory.pop();
  }

  return notif;
}

/**
 * Retrieves in-app notifications for a user.
 */
function getHrmsNotifications(organizationId, userId, limit = 20) {
  const uId = userId?.toString();
  const orgId = organizationId?.toString();

  return hrmsNotificationHistory
    .filter(
      (n) =>
        n.organizationId === orgId &&
        (n.recipientUserIds.length === 0 || n.recipientUserIds.includes(uId))
    )
    .slice(0, limit);
}

module.exports = {
  HRMS_EVENT_TYPES,
  sendHrmsNotification,
  getHrmsNotifications,
};
