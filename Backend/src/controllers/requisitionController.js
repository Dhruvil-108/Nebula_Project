const mongoose = require('mongoose');
const Requisition = require('../models/Requisition');
const JobOpening = require('../models/JobOpening');
const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const RecruitmentActivity = require('../models/RecruitmentActivity');
const counterService = require('../services/counterService');
const { scopedFilter } = require('../middleware/tenant');

const USER_FIELDS = 'fullName email role';

/**
 * Default approval chain generator if no workflow configured
 */
const getDefaultApprovalChain = (req) => {
  return [
    {
      stepNumber: 1,
      approverRole: 'hr',
      status: 'pending',
      comments: '',
    },
    {
      stepNumber: 2,
      approverRole: 'super_admin',
      status: 'pending',
      comments: '',
    },
  ];
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/recruitment/requisitions — List requisitions
// ─────────────────────────────────────────────────────────
exports.getRequisitions = async (req, res) => {
  try {
    const { status, departmentId, reason, search } = req.query;
    const extra = {};

    if (status) extra.status = status;
    if (reason) extra.reason = reason;
    if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
      extra.departmentId = departmentId;
    }
    if (search && String(search).trim()) {
      const rx = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      extra.$or = [{ title: rx }, { reqCode: rx }, { justification: rx }];
    }

    const requisitions = await Requisition.find(scopedFilter(req, extra))
      .populate('departmentId', 'name')
      .populate('requestedBy', USER_FIELDS)
      .populate('replacementForEmployeeId', 'fullName employeeCode')
      .populate('approvalChain.approverId', USER_FIELDS)
      .populate('jobOpeningId', 'title jobCode status')
      .sort({ createdAt: -1 })
      .lean();

    return res.json(requisitions);
  } catch (err) {
    console.error('[requisitionController.getRequisitions] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve requisitions.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/requisitions — Create requisition
// ─────────────────────────────────────────────────────────
exports.createRequisition = async (req, res) => {
  try {
    const {
      title,
      departmentId,
      employmentType,
      experienceLevel,
      locationType,
      location,
      openPositions,
      budget,
      reason,
      replacementForEmployeeId,
      justification,
      targetStartDate,
      submitNow,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Requisition title is required.' });
    }
    if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ error: 'A valid department is required.' });
    }
    if (!justification || !justification.trim()) {
      return res.status(400).json({ error: 'Business justification is required.' });
    }

    const reqCode = await counterService.generateRequisitionCode(req.organizationId);

    // Look for configured workflow template
    let workflow = await ApprovalWorkflow.findOne(
      scopedFilter(req, { entityType: 'requisition', departmentId })
    ).lean();

    if (!workflow) {
      workflow = await ApprovalWorkflow.findOne(
        scopedFilter(req, { entityType: 'requisition', isDefault: true })
      ).lean();
    }

    let approvalChain = [];
    if (workflow && Array.isArray(workflow.steps) && workflow.steps.length > 0) {
      approvalChain = workflow.steps.map((s, idx) => ({
        stepNumber: s.order || idx + 1,
        approverRole: s.role,
        approverId: s.specificUserId || null,
        status: 'pending',
        comments: '',
      }));
    } else {
      approvalChain = getDefaultApprovalChain(req);
    }

    const initialStatus = submitNow ? 'pending_approval' : 'draft';

    const requisition = await Requisition.create({
      organizationId: req.organizationId,
      reqCode,
      title: title.trim(),
      departmentId,
      employmentType: employmentType || 'full_time',
      experienceLevel: experienceLevel || 'mid',
      locationType: locationType || 'hybrid',
      location: location || '',
      openPositions: openPositions ? Math.max(1, Number(openPositions)) : 1,
      budget: budget || { min: 0, max: 0, currency: 'USD' },
      reason: reason || 'new_headcount',
      replacementForEmployeeId:
        replacementForEmployeeId && mongoose.Types.ObjectId.isValid(replacementForEmployeeId)
          ? replacementForEmployeeId
          : null,
      justification: justification.trim(),
      targetStartDate: targetStartDate ? new Date(targetStartDate) : null,
      approvalChain,
      status: initialStatus,
      requestedBy: req.user._id,
    });

    const populated = await Requisition.findById(requisition._id)
      .populate('departmentId', 'name')
      .populate('requestedBy', USER_FIELDS)
      .lean();

    await RecruitmentActivity.create({
      organizationId: req.organizationId,
      type: 'note_added',
      title: 'Manpower Requisition Created',
      description: `Requisition ${reqCode} (${requisition.title}) created by ${req.user.fullName || 'User'}.`,
      performedBy: req.user._id,
      metadata: { reqId: requisition._id, reqCode, status: initialStatus },
    });

    return res.status(201).json(populated);
  } catch (err) {
    console.error('[requisitionController.createRequisition] Error:', err);
    return res.status(500).json({ error: 'Failed to create requisition.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/recruitment/requisitions/:id — Get details
// ─────────────────────────────────────────────────────────
exports.getRequisitionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid requisition ID.' });
    }

    const requisition = await Requisition.findOne(scopedFilter(req, { _id: id }))
      .populate('departmentId', 'name')
      .populate('requestedBy', USER_FIELDS)
      .populate('replacementForEmployeeId', 'fullName employeeCode')
      .populate('approvalChain.approverId', USER_FIELDS)
      .populate('jobOpeningId', 'title jobCode status')
      .lean();

    if (!requisition) {
      return res.status(404).json({ error: 'Requisition not found.' });
    }

    return res.json(requisition);
  } catch (err) {
    console.error('[requisitionController.getRequisitionById] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve requisition details.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/requisitions/:id/submit — Submit for approval
// ─────────────────────────────────────────────────────────
exports.submitRequisition = async (req, res) => {
  try {
    const { id } = req.params;
    const requisition = await Requisition.findOne(scopedFilter(req, { _id: id }));

    if (!requisition) {
      return res.status(404).json({ error: 'Requisition not found.' });
    }

    if (requisition.status !== 'draft' && requisition.status !== 'rejected') {
      return res.status(400).json({ error: `Cannot submit requisition in "${requisition.status}" status.` });
    }

    // Reset pending status on approval chain
    for (const step of requisition.approvalChain) {
      step.status = 'pending';
      step.comments = '';
      step.actionedAt = null;
    }

    requisition.status = 'pending_approval';
    await requisition.save();

    return res.json(requisition);
  } catch (err) {
    console.error('[requisitionController.submitRequisition] Error:', err);
    return res.status(500).json({ error: 'Failed to submit requisition for approval.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/requisitions/:id/approve — Approve current step
// ─────────────────────────────────────────────────────────
exports.approveRequisitionStep = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments = '' } = req.body;

    const requisition = await Requisition.findOne(scopedFilter(req, { _id: id }));
    if (!requisition) {
      return res.status(404).json({ error: 'Requisition not found.' });
    }

    if (requisition.status !== 'pending_approval') {
      return res.status(400).json({ error: 'Requisition is not awaiting approval.' });
    }

    // Find the first pending step
    const currentStep = requisition.approvalChain.find((s) => s.status === 'pending');
    if (!currentStep) {
      requisition.status = 'approved';
      await requisition.save();
      return res.json(requisition);
    }

    // Authorize approver: super_admin can approve anything, otherwise check role or approverId
    const isSuperAdmin = req.user.role === 'super_admin';
    const isRoleMatch = req.user.role === currentStep.approverRole;
    const isUserMatch = currentStep.approverId && String(currentStep.approverId) === String(req.user._id);

    if (!isSuperAdmin && !isRoleMatch && !isUserMatch) {
      return res.status(403).json({
        error: `Permission denied. Step ${currentStep.stepNumber} requires approver with role "${currentStep.approverRole}".`,
      });
    }

    currentStep.status = 'approved';
    currentStep.approverId = req.user._id;
    currentStep.comments = comments || 'Approved';
    currentStep.actionedAt = new Date();

    // Check if any further steps remain pending
    const remainingPending = requisition.approvalChain.find((s) => s.status === 'pending');
    if (!remainingPending) {
      requisition.status = 'approved';
    }

    await requisition.save();

    await RecruitmentActivity.create({
      organizationId: req.organizationId,
      type: 'note_added',
      title: 'Requisition Step Approved',
      description: `Step ${currentStep.stepNumber} for requisition ${requisition.reqCode} approved by ${req.user.fullName || 'User'}. Status: ${requisition.status}.`,
      performedBy: req.user._id,
      metadata: { reqId: requisition._id, stepNumber: currentStep.stepNumber, status: requisition.status },
    });

    return res.json(requisition);
  } catch (err) {
    console.error('[requisitionController.approveRequisitionStep] Error:', err);
    return res.status(500).json({ error: 'Failed to approve requisition step.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/requisitions/:id/reject — Reject step
// ─────────────────────────────────────────────────────────
exports.rejectRequisitionStep = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    if (!comments || !comments.trim()) {
      return res.status(400).json({ error: 'Rejection reason / comment is required.' });
    }

    const requisition = await Requisition.findOne(scopedFilter(req, { _id: id }));
    if (!requisition) {
      return res.status(404).json({ error: 'Requisition not found.' });
    }

    const currentStep = requisition.approvalChain.find((s) => s.status === 'pending');
    if (currentStep) {
      currentStep.status = 'rejected';
      currentStep.approverId = req.user._id;
      currentStep.comments = comments.trim();
      currentStep.actionedAt = new Date();
    }

    requisition.status = 'rejected';
    await requisition.save();

    await RecruitmentActivity.create({
      organizationId: req.organizationId,
      type: 'note_added',
      title: 'Requisition Rejected',
      description: `Requisition ${requisition.reqCode} rejected by ${req.user.fullName || 'User'}: "${comments.trim()}".`,
      performedBy: req.user._id,
      metadata: { reqId: requisition._id, status: 'rejected' },
    });

    return res.json(requisition);
  } catch (err) {
    console.error('[requisitionController.rejectRequisitionStep] Error:', err);
    return res.status(500).json({ error: 'Failed to reject requisition.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/requisitions/:id/convert-to-job
// Guarded strictly by approval status
// ─────────────────────────────────────────────────────────
exports.convertToJob = async (req, res) => {
  try {
    const { id } = req.params;
    const requisition = await Requisition.findOne(scopedFilter(req, { _id: id }));

    if (!requisition) {
      return res.status(404).json({ error: 'Requisition not found.' });
    }

    // Strict approval enforcement
    if (requisition.status !== 'approved') {
      return res.status(400).json({
        error: `Cannot convert requisition to job vacancy. Status must be "approved" (current: "${requisition.status}").`,
      });
    }

    if (requisition.jobOpeningId) {
      return res.status(400).json({
        error: 'Requisition has already been converted to a job opening.',
        jobOpeningId: requisition.jobOpeningId,
      });
    }

    const jobCode = await counterService.generateJobCode(req.organizationId);

    const newJob = await JobOpening.create({
      organizationId: req.organizationId,
      jobCode,
      title: requisition.title,
      departmentId: requisition.departmentId,
      locationType: requisition.locationType || 'hybrid',
      location: requisition.location || '',
      employmentType: requisition.employmentType || 'full_time',
      experienceLevel: requisition.experienceLevel || 'mid',
      salaryRange: {
        min: requisition.budget?.min || 0,
        max: requisition.budget?.max || 0,
        currency: requisition.budget?.currency || 'USD',
        isPublic: false,
      },
      openPositions: requisition.openPositions || 1,
      status: 'draft',
      description: requisition.justification || '',
      hiringManagerId: requisition.requestedBy,
    });

    requisition.status = 'converted_to_job';
    requisition.jobOpeningId = newJob._id;
    await requisition.save();

    await RecruitmentActivity.create({
      organizationId: req.organizationId,
      jobOpeningId: newJob._id,
      type: 'note_added',
      title: 'Job Spawned from Requisition',
      description: `Job Opening ${newJob.jobCode} spawned from approved Requisition ${requisition.reqCode}.`,
      performedBy: req.user._id,
      metadata: { reqId: requisition._id, jobId: newJob._id },
    });

    return res.status(201).json({
      message: 'Requisition successfully converted to job vacancy.',
      requisition,
      jobOpening: newJob,
    });
  } catch (err) {
    console.error('[requisitionController.convertToJob] Error:', err);
    return res.status(500).json({ error: 'Failed to convert requisition to job opening.' });
  }
};
