const mongoose = require('mongoose');
const Application = require('../models/Application');
const Candidate = require('../models/Candidate');
const JobOpening = require('../models/JobOpening');
const Interview = require('../models/Interview');
const JobOffer = require('../models/JobOffer');
const RecruitmentActivity = require('../models/RecruitmentActivity');
const { scopedFilter } = require('../middleware/tenant');

const USER_FIELDS = 'fullName email role';

// ─────────────────────────────────────────────────────────
// GET /api/v1/recruitment/applications — List applications
// ─────────────────────────────────────────────────────────
exports.getApplications = async (req, res) => {
  try {
    const { jobOpeningId, candidateId, stage, status, search, rating } = req.query;
    const extra = {};

    if (stage) extra.stage = stage;
    if (status) extra.status = status;
    if (rating) extra.rating = { $gte: Number(rating) };
    if (jobOpeningId && mongoose.Types.ObjectId.isValid(jobOpeningId)) {
      extra.jobOpeningId = jobOpeningId;
    }
    if (candidateId && mongoose.Types.ObjectId.isValid(candidateId)) {
      extra.candidateId = candidateId;
    }

    let applications = await Application.find(scopedFilter(req, extra))
      .populate('candidateId', 'fullName email phone currentCompany currentDesignation totalExperienceYears resumeUrl skills candidateCode')
      .populate('jobOpeningId', 'title jobCode departmentId status')
      .populate('referredBy', 'fullName employeeCode')
      .populate('rejectionReasonId', 'code label category')
      .sort({ updatedAt: -1 })
      .limit(1000)
      .lean();

    // In-memory text filter across populated candidate fields if search query provided
    if (search && String(search).trim()) {
      const q = String(search).trim().toLowerCase();
      applications = applications.filter((app) => {
        const cand = app.candidateId || {};
        return (
          app.applicationCode?.toLowerCase().includes(q) ||
          cand.fullName?.toLowerCase().includes(q) ||
          cand.email?.toLowerCase().includes(q) ||
          cand.currentCompany?.toLowerCase().includes(q) ||
          (cand.skills || []).some((s) => s.toLowerCase().includes(q))
        );
      });
    }

    return res.json(applications);
  } catch (err) {
    console.error('[applicationController.getApplications] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve applications.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/recruitment/applications/:id — Detail dossier
// ─────────────────────────────────────────────────────────
exports.getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid application ID.' });
    }

    const application = await Application.findOne(scopedFilter(req, { _id: id }))
      .populate('candidateId')
      .populate('jobOpeningId', 'title jobCode departmentId status')
      .populate('referredBy', 'fullName employeeCode')
      .populate('stageHistory.changedBy', USER_FIELDS)
      .populate('rejectionReasonId', 'code label category')
      .lean();

    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    // Attach linked interviews and offer
    const [interviews, offer, activities] = await Promise.all([
      Interview.find(scopedFilter(req, { applicationId: id }))
        .populate('interviewers', USER_FIELDS)
        .populate('scorecard.submittedBy', USER_FIELDS)
        .sort({ scheduledStart: 1 })
        .lean(),
      JobOffer.findOne(scopedFilter(req, { applicationId: id }))
        .populate('departmentId', 'name')
        .populate('approvedBy', USER_FIELDS)
        .lean(),
      RecruitmentActivity.find(scopedFilter(req, { applicationId: id }))
        .populate('performedBy', USER_FIELDS)
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    return res.json({
      ...application,
      interviews,
      offer,
      activities,
    });
  } catch (err) {
    console.error('[applicationController.getApplicationById] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve application dossier.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/recruitment/applications/:id/stage — Move stage
// ─────────────────────────────────────────────────────────
exports.moveApplicationStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid application ID.' });
    }
    if (!stage) {
      return res.status(400).json({ error: 'Stage is required.' });
    }

    const application = await Application.findOne(scopedFilter(req, { _id: id }));
    if (!application) {
      return res.status(404).json({ error: 'Application not found.' });
    }

    const oldStage = application.stage;
    if (oldStage === stage) {
      return res.json(application);
    }

    application.stage = stage;
    application.stageHistory.push({
      fromStage: oldStage,
      toStage: stage,
      changedBy: req.user._id,
      changedAt: new Date(),
      note: note || `Stage moved from ${oldStage} to ${stage}`,
    });

    if (stage === 'hired' && !application.hiredAt) {
      application.hiredAt = new Date();
      application.status = 'hired';
      await JobOpening.findOneAndUpdate(
        scopedFilter(req, { _id: application.jobOpeningId }),
        { $inc: { filledPositions: 1 } }
      );
    } else if (stage === 'rejected') {
      application.status = 'rejected';
    } else if (stage === 'withdrawn') {
      application.status = 'withdrawn';
    } else {
      application.status = 'active';
    }

    await application.save();

    // Dual-write to candidate for backward compatibility
    await Candidate.findOneAndUpdate(
      scopedFilter(req, { _id: application.candidateId }),
      { $set: { stage, updatedAt: new Date() } }
    );

    await RecruitmentActivity.create({
      organizationId: req.organizationId,
      applicationId: application._id,
      candidateId: application.candidateId,
      jobOpeningId: application.jobOpeningId,
      type: 'stage_change',
      title: 'Application Stage Advanced',
      description: `Application ${application.applicationCode} moved to "${stage.replace(/_/g, ' ')}" by ${req.user.fullName || 'User'}.`,
      performedBy: req.user._id,
      metadata: { fromStage: oldStage, toStage: stage },
    });

    const populated = await Application.findById(application._id)
      .populate('candidateId', 'fullName email phone')
      .populate('jobOpeningId', 'title jobCode')
      .lean();

    return res.json(populated);
  } catch (err) {
    console.error('[applicationController.moveApplicationStage] Error:', err);
    return res.status(500).json({ error: 'Failed to update application stage.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/applications/bulk-move
// ─────────────────────────────────────────────────────────
exports.bulkMoveApplications = async (req, res) => {
  try {
    const { applicationIds, targetStage, note = '' } = req.body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ error: 'applicationIds array is required.' });
    }
    if (!targetStage) {
      return res.status(400).json({ error: 'targetStage is required.' });
    }

    const applications = await Application.find(
      scopedFilter(req, { _id: { $in: applicationIds } })
    );

    let movedCount = 0;
    for (const app of applications) {
      if (app.stage === targetStage) continue;
      const oldStage = app.stage;
      app.stage = targetStage;
      app.stageHistory.push({
        fromStage: oldStage,
        toStage: targetStage,
        changedBy: req.user._id,
        changedAt: new Date(),
        note: note || `Bulk moved to ${targetStage}`,
      });
      if (targetStage === 'hired') app.status = 'hired';
      else if (targetStage === 'rejected') app.status = 'rejected';
      else if (targetStage === 'withdrawn') app.status = 'withdrawn';
      else app.status = 'active';

      await app.save();
      movedCount++;

      // Log activity
      await RecruitmentActivity.create({
        organizationId: req.organizationId,
        applicationId: app._id,
        candidateId: app.candidateId,
        jobOpeningId: app.jobOpeningId,
        type: 'stage_change',
        title: 'Bulk Stage Move',
        description: `Bulk moved from ${oldStage} to ${targetStage} by ${req.user.fullName || 'User'}.`,
        performedBy: req.user._id,
        metadata: { fromStage: oldStage, toStage: targetStage },
      });
    }

    return res.json({
      success: true,
      totalRequested: applicationIds.length,
      movedCount,
      targetStage,
    });
  } catch (err) {
    console.error('[applicationController.bulkMoveApplications] Error:', err);
    return res.status(500).json({ error: 'Failed to bulk move applications.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/applications/bulk-reject
// ─────────────────────────────────────────────────────────
exports.bulkRejectApplications = async (req, res) => {
  try {
    const { applicationIds, rejectionReasonId, rejectionNotes = '' } = req.body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ error: 'applicationIds array is required.' });
    }

    const applications = await Application.find(
      scopedFilter(req, { _id: { $in: applicationIds } })
    );

    let rejectedCount = 0;
    for (const app of applications) {
      const oldStage = app.stage;
      app.stage = 'rejected';
      app.status = 'rejected';
      if (rejectionReasonId && mongoose.Types.ObjectId.isValid(rejectionReasonId)) {
        app.rejectionReasonId = rejectionReasonId;
      }
      app.rejectionNotes = rejectionNotes;
      app.stageHistory.push({
        fromStage: oldStage,
        toStage: 'rejected',
        changedBy: req.user._id,
        changedAt: new Date(),
        note: `Bulk rejected: ${rejectionNotes || 'Disqualified'}`,
      });

      await app.save();
      rejectedCount++;

      await RecruitmentActivity.create({
        organizationId: req.organizationId,
        applicationId: app._id,
        candidateId: app.candidateId,
        jobOpeningId: app.jobOpeningId,
        type: 'stage_change',
        title: 'Application Rejected',
        description: `Bulk rejected by ${req.user.fullName || 'User'}: ${rejectionNotes || 'Disqualified'}.`,
        performedBy: req.user._id,
        metadata: { rejectionReasonId, fromStage: oldStage, toStage: 'rejected' },
      });
    }

    return res.json({
      success: true,
      totalRequested: applicationIds.length,
      rejectedCount,
    });
  } catch (err) {
    console.error('[applicationController.bulkRejectApplications] Error:', err);
    return res.status(500).json({ error: 'Failed to bulk reject applications.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/applications/bulk-tag
// ─────────────────────────────────────────────────────────
exports.bulkTagApplications = async (req, res) => {
  try {
    const { applicationIds, tags } = req.body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({ error: 'applicationIds array is required.' });
    }
    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).json({ error: 'tags array is required.' });
    }

    const result = await Application.updateMany(
      scopedFilter(req, { _id: { $in: applicationIds } }),
      { $addToSet: { tags: { $each: tags } } }
    );

    return res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      tagsAdded: tags,
    });
  } catch (err) {
    console.error('[applicationController.bulkTagApplications] Error:', err);
    return res.status(500).json({ error: 'Failed to bulk tag applications.' });
  }
};
