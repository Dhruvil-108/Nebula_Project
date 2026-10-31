const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const HrSetting = require('../models/HrSetting');
const Organization = require('../models/Organization');
const { logAuditEvent, getAuditLogs: queryAuditLogs } = require('../services/auditService');
const { getInbox, actOnStep } = require('../services/approvalWorkflowEngine');
const { saveFile, verifySignedUrl, generateSignedUrl } = require('../services/fileStorageService');
const { getHrmsNotifications, markHrmsNotificationRead } = require('../services/hrmsNotificationService');

/**
 * GET /api/v1/hr/settings
 */
const getHrSettings = async (req, res) => {
  try {
    let settings = await HrSetting.findOne({ organizationId: req.organizationId }).lean();
    if (!settings) {
      settings = await HrSetting.create({ organizationId: req.organizationId });
    }
    const org = await Organization.findById(req.organizationId).select('timezone shiftStartTime').lean();
    return res.json({
      ...settings,
      timezone: org?.timezone || 'Asia/Kolkata',
      shiftStartTime: org?.shiftStartTime || settings.defaultShiftStartTime,
    });
  } catch (err) {
    console.error('[hrSettings.getHrSettings] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve HR settings.' });
  }
};

/**
 * PATCH /api/v1/hr/settings
 */
const updateHrSettings = async (req, res) => {
  try {
    if (!['super_admin', 'admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only Admins and HR can update HR settings.' });
    }

    const before = await HrSetting.findOne({ organizationId: req.organizationId }).lean();

    const allowedFields = [
      'workWeekDays',
      'defaultShiftStartTime',
      'defaultShiftEndTime',
      'gracePeriodMinutes',
      'halfDayHours',
      'fullDayHours',
      'allowWebClockIn',
      'enableGeofencing',
      'geofenceRadiusMeters',
      'allowSelfRegularization',
      'leaveYearStartMonth',
      'sandwichLeaveRule',
      'notifyManagerOnLeaveRequest',
      'notifyEmployeeOnApproval',
      'notifyOnLateArrival',
      'aiCopilotEnabled',
      'aiAutomatedScreening',
    ];

    const updatePayload = { updatedBy: req.user._id };
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updatePayload[key] = req.body[key];
      }
    }

    const updated = await HrSetting.findOneAndUpdate(
      { organizationId: req.organizationId },
      { $set: updatePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    // Sync org shiftStartTime if changed
    if (req.body.defaultShiftStartTime || req.body.timezone) {
      const orgUpdate = {};
      if (req.body.defaultShiftStartTime) orgUpdate.shiftStartTime = req.body.defaultShiftStartTime;
      if (req.body.timezone) orgUpdate.timezone = req.body.timezone;
      await Organization.findByIdAndUpdate(req.organizationId, { $set: orgUpdate });
    }

    // Audit log
    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'settings.update',
      entityType: 'HrSetting',
      entityId: updated._id,
      before,
      after: updated,
      req,
    });

    return res.json({ message: 'HR settings updated successfully.', settings: updated });
  } catch (err) {
    console.error('[hrSettings.updateHrSettings] Error:', err);
    return res.status(500).json({ error: 'Failed to update HR settings.' });
  }
};

/**
 * GET /api/v1/hr/audit-logs
 */
const getAuditLogs = async (req, res) => {
  try {
    if (!['super_admin', 'admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Audit logs require Admin or HR permissions.' });
    }

    const { entityType, entityId, actorUserId, action, startDate, endDate, page, limit } = req.query;

    const result = await queryAuditLogs({
      organizationId: req.organizationId,
      entityType,
      entityId,
      actorUserId,
      action,
      startDate,
      endDate,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 30,
    });

    return res.json(result);
  } catch (err) {
    console.error('[hrSettings.getAuditLogs] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
};

/**
 * GET /api/v1/hr/workflows/inbox
 */
const getWorkflowInbox = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const inbox = await getInbox({
      organizationId: req.organizationId,
      userId: req.user._id,
      role: req.user.role,
      status,
    });
    return res.json(inbox);
  } catch (err) {
    console.error('[hrSettings.getWorkflowInbox] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve workflow inbox.' });
  }
};

/**
 * POST /api/v1/hr/workflows/instances/:id/act
 */
const actOnWorkflow = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comments } = req.body;

    if (!['approved', 'rejected', 'send_back'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be approved, rejected, or send_back.' });
    }

    const result = await actOnStep({
      organizationId: req.organizationId,
      instanceId: id,
      actorUserId: req.user._id,
      actorRole: req.user.role,
      action,
      comments: comments || '',
    });

    return res.json(result);
  } catch (err) {
    console.error('[hrSettings.actOnWorkflow] Error:', err);
    const status = err.status || 500;
    return res.status(status).json({ error: err.message || 'Workflow action failed.' });
  }
};

/**
 * POST /api/v1/hr/documents/upload
 * Supports base64 data URL or JSON payloads
 */
const uploadDocument = async (req, res) => {
  try {
    const { fileData, originalName, fileName, mimeType, expiryDate, employeeId, docType } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: 'File data is required (base64 string or data URL).' });
    }

    const saved = await saveFile({
      organizationId: req.organizationId,
      fileData,
      originalName: originalName || fileName,
      mimeType,
      expiryDate,
    });

    // Generate 24-hour signed download URL
    const signedUrl = generateSignedUrl(saved.fileUrl, 1440);

    // Audit log
    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: 'document.upload',
      entityType: 'EmployeeDocument',
      entityId: employeeId || null,
      after: {
        fileName: saved.fileName,
        fileSizeBytes: saved.fileSizeBytes,
        mimeType: saved.mimeType,
      },
      req,
    });

    return res.status(201).json({
      message: 'Document uploaded successfully.',
      ...saved,
      signedUrl,
      docType: docType || 'other',
    });
  } catch (err) {
    console.error('[hrSettings.uploadDocument] Error:', err);
    return res.status(400).json({ error: err.message || 'Document upload failed.' });
  }
};

/**
 * GET /api/v1/hr/documents/files/:orgId/:filename
 * Secure streaming endpoint.
 */
const serveDocumentFile = async (req, res) => {
  try {
    const { orgId, filename } = req.params;
    const { expires, sig } = req.query;

    const fileUrl = `/api/v1/hr/documents/files/${orgId}/${filename}`;

    // Verify tenant match if user session is present, or verify HMAC signature if signed link
    if (req.user) {
      if (req.organizationId.toString() !== orgId.toString() && req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Access denied: Organization mismatch.' });
      }
    } else {
      const isValid = verifySignedUrl(fileUrl, expires, sig);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid or expired document link.' });
      }
    }

    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(__dirname, '../../uploads/documents', orgId, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Document file not found on disk.' });
    }

    return res.sendFile(filePath);
  } catch (err) {
    console.error('[hrSettings.serveDocumentFile] Error:', err);
    return res.status(500).json({ error: 'Failed to serve document file.' });
  }
};

/**
 * GET /api/v1/hr/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const notifications = await getHrmsNotifications({
      organizationId: req.organizationId,
      recipientUserId: req.user._id,
      limit,
    });
    return res.json(notifications);
  } catch (err) {
    console.error('[hrSettings.getNotifications] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve HR notifications.' });
  }
};

/**
 * PATCH /api/v1/hr/notifications/:id/read
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await markHrmsNotificationRead({
      organizationId: req.organizationId,
      notificationId: id,
      recipientUserId: req.user._id,
    });
    return res.json({ message: 'Marked as read.', notification });
  } catch (err) {
    console.error('[hrSettings.markNotificationAsRead] Error:', err);
    return res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
};

module.exports = {
  getHrSettings,
  updateHrSettings,
  getAuditLogs,
  getWorkflowInbox,
  actOnWorkflow,
  uploadDocument,
  serveDocumentFile,
  getNotifications,
  markNotificationAsRead,
};
