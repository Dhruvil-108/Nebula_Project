const crypto = require('crypto');
const mongoose = require('mongoose');
const JobOffer = require('../models/JobOffer');
const Candidate = require('../models/Candidate');
const JobOpening = require('../models/JobOpening');
const Organization = require('../models/Organization');
const RecruitmentActivity = require('../models/RecruitmentActivity');
const { scopedFilter } = require('../middleware/tenant');
const counterService = require('../services/counterService');
const compensationService = require('../services/compensationService');
const offerLetterService = require('../services/offerLetterService');
const emailService = require('../services/emailService');
const pdfService = require('../services/pdfService');

const USER_FIELDS = 'fullName email role firstName lastName';

// ─────────────────────────────────────────────────────────
// GET /api/v1/recruitment/offers — List job offers
// ─────────────────────────────────────────────────────────
const getOffers = async (req, res) => {
  try {
    const { status, candidateId, jobOpeningId } = req.query;
    const extra = {};

    if (status) extra.status = status;
    if (candidateId && mongoose.Types.ObjectId.isValid(candidateId)) extra.candidateId = candidateId;
    if (jobOpeningId && mongoose.Types.ObjectId.isValid(jobOpeningId)) extra.jobOpeningId = jobOpeningId;

    const offers = await JobOffer.find(scopedFilter(req, extra))
      .populate('candidateId', 'fullName candidateCode email phone stage convertedEmployeeId skills resumeUrl resumeFileName jobOpeningId')
      .populate('jobOpeningId', 'title jobCode departmentId salaryRange')
      .populate('departmentId', 'name')
      .populate('approvedBy', USER_FIELDS)
      .populate('approvalChain.approverId', USER_FIELDS)
      .sort({ createdAt: -1 })
      .lean();

    return res.json(offers);
  } catch (err) {
    console.error('[offerController.getOffers] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve offers.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/offers — Create job offer
// ─────────────────────────────────────────────────────────
const createOffer = async (req, res) => {
  try {
    const {
      candidateId,
      jobOpeningId,
      designation,
      departmentId,
      offeredSalary,
      currency,
      joiningDate,
      validUntil,
      benefits,
      notes,
      offerLetterUrl,
      compensationBreakdown,
      hiringManagerId,
      hrDirectorId,
      isDraft = false,
    } = req.body;

    if (!candidateId || !mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({ error: 'A valid candidate is required.' });
    }
    if (!designation || !designation.trim()) {
      return res.status(400).json({ error: 'Designation is required.' });
    }
    if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ error: 'A valid department is required.' });
    }
    if (!joiningDate || !validUntil) {
      return res.status(400).json({ error: 'Joining date and validity dates are required.' });
    }

    const candidate = await Candidate.findOne(scopedFilter(req, { _id: candidateId }));
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found in this organization.' });
    }

    const resolvedJobId = jobOpeningId || candidate.jobOpeningId;
    const jobOpening = await JobOpening.findById(resolvedJobId).lean();

    // Compute detailed CTC breakdown
    const cb = compensationBreakdown || {
      baseSalary: Number(offeredSalary) || 0,
    };
    const totalCtc = compensationService.calculateTotalCtc(cb) || Number(offeredSalary) || 0;
    cb.totalCtc = totalCtc;

    // Check compensation band governance
    const bandGov = compensationService.checkBandGovernance(jobOpening, totalCtc);

    // Generate multi-step approval chain
    const approvalChain = compensationService.generateApprovalChain(bandGov.isDeviation, {
      hiringManagerId: hiringManagerId || jobOpening?.hiringManagerId,
      hrDirectorId: hrDirectorId || req.user?._id,
    });

    const offerCode = await counterService.generateOfferCode(req.organizationId);

    const offer = await JobOffer.create({
      organizationId: req.organizationId,
      offerCode,
      candidateId,
      jobOpeningId: resolvedJobId,
      designation: designation.trim(),
      departmentId,
      offeredSalary: totalCtc,
      currency: currency || 'USD',
      compensationBreakdown: cb,
      bandGovernance: {
        ...bandGov,
        justification: req.body.bandJustification || '',
      },
      approvalChain,
      currentApprovalStep: 1,
      joiningDate: new Date(joiningDate),
      validUntil: new Date(validUntil),
      benefits: Array.isArray(benefits) ? benefits : [],
      notes: notes || '',
      offerLetterUrl: offerLetterUrl || '',
      status: isDraft ? 'draft' : 'pending_approval',
    });

    // Advance candidate to offer_sent stage if in earlier stage
    if (candidate.stage !== 'offer_sent' && candidate.stage !== 'hired') {
      const oldStage = candidate.stage;
      candidate.stage = 'offer_sent';
      candidate.stageHistory.push({
        fromStage: oldStage,
        toStage: 'offer_sent',
        changedBy: req.user._id,
        changedAt: new Date(),
        note: `Offer ${offer.offerCode} created with CTC ${offer.currency} ${offer.offeredSalary.toLocaleString()}${
          bandGov.isDeviation ? ` (Out-of-band: +${bandGov.deviationPercent}%)` : ''
        }`,
      });
      await candidate.save();
    }

    const populated = await JobOffer.findById(offer._id)
      .populate('candidateId', 'fullName candidateCode email phone stage')
      .populate('jobOpeningId', 'title jobCode salaryRange')
      .populate('departmentId', 'name')
      .populate('approvedBy', USER_FIELDS)
      .populate('approvalChain.approverId', USER_FIELDS)
      .lean();

    await RecruitmentActivity.create({
      organizationId: req.organizationId,
      candidateId,
      jobOpeningId: resolvedJobId,
      type: 'offer_created',
      title: 'Job Offer Generated',
      description: `Offer ${offer.offerCode} prepared for ${candidate.fullName} as ${offer.designation} (${offer.currency} ${offer.offeredSalary.toLocaleString()}).`,
      performedBy: req.user._id,
      metadata: { offerId: offer._id, offerCode: offer.offerCode, offeredSalary: offer.offeredSalary, isDeviation: bandGov.isDeviation },
    });

    return res.status(201).json(populated);
  } catch (err) {
    console.error('[offerController.createOffer] Error:', err);
    return res.status(500).json({ error: 'Failed to create job offer.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/offers/:id/submit — Submit draft for approval
// ─────────────────────────────────────────────────────────
const submitOfferForApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await JobOffer.findOne(scopedFilter(req, { _id: id }));
    if (!offer) {
      return res.status(404).json({ error: 'Job offer not found.' });
    }

    if (offer.status !== 'draft') {
      return res.status(400).json({ error: `Offer is already in status "${offer.status}".` });
    }

    offer.status = 'pending_approval';
    offer.currentApprovalStep = 1;
    await offer.save();

    const populated = await JobOffer.findById(offer._id)
      .populate('candidateId', 'fullName candidateCode email')
      .populate('jobOpeningId', 'title jobCode')
      .populate('approvalChain.approverId', USER_FIELDS)
      .lean();

    return res.json(populated);
  } catch (err) {
    console.error('[offerController.submitOfferForApproval] Error:', err);
    return res.status(500).json({ error: 'Failed to submit offer for approval.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/offers/:id/approve-step — Approve approval step
// ─────────────────────────────────────────────────────────
const approveOfferStep = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const offer = await JobOffer.findOne(scopedFilter(req, { _id: id }));
    if (!offer) {
      return res.status(404).json({ error: 'Job offer not found.' });
    }

    if (offer.status !== 'pending_approval') {
      return res.status(400).json({ error: `Offer is not awaiting approval (current status: ${offer.status}).` });
    }

    const currentStepIndex = offer.approvalChain.findIndex(
      (step) => step.stepNumber === offer.currentApprovalStep
    );

    if (currentStepIndex === -1) {
      return res.status(400).json({ error: 'Active approval step not found.' });
    }

    // Mark current step approved
    offer.approvalChain[currentStepIndex].status = 'approved';
    offer.approvalChain[currentStepIndex].approverId = req.user._id;
    offer.approvalChain[currentStepIndex].comments = comments || 'Approved';
    offer.approvalChain[currentStepIndex].actionedAt = new Date();

    const isLastStep = currentStepIndex === offer.approvalChain.length - 1;

    if (isLastStep) {
      offer.status = 'approved';
      offer.approvedBy = req.user._id;
    } else {
      offer.currentApprovalStep = offer.approvalChain[currentStepIndex + 1].stepNumber;
    }

    await offer.save();

    const populated = await JobOffer.findById(offer._id)
      .populate('candidateId', 'fullName candidateCode email')
      .populate('jobOpeningId', 'title jobCode')
      .populate('departmentId', 'name')
      .populate('approvedBy', USER_FIELDS)
      .populate('approvalChain.approverId', USER_FIELDS)
      .lean();

    await RecruitmentActivity.create({
      organizationId: req.organizationId,
      candidateId: offer.candidateId,
      jobOpeningId: offer.jobOpeningId,
      type: 'offer_status_change',
      title: isLastStep ? 'Offer Fully Approved' : `Offer Step ${offer.currentApprovalStep - 1} Approved`,
      description: `Offer ${offer.offerCode} approval signed by ${req.user.fullName}.`,
      performedBy: req.user._id,
      metadata: { offerId: offer._id, isLastStep },
    });

    return res.json(populated);
  } catch (err) {
    console.error('[offerController.approveOfferStep] Error:', err);
    return res.status(500).json({ error: 'Failed to approve offer step.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/offers/:id/reject-step — Reject approval step
// ─────────────────────────────────────────────────────────
const rejectOfferStep = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const offer = await JobOffer.findOne(scopedFilter(req, { _id: id }));
    if (!offer) {
      return res.status(404).json({ error: 'Job offer not found.' });
    }

    const currentStepIndex = offer.approvalChain.findIndex(
      (step) => step.stepNumber === offer.currentApprovalStep
    );

    if (currentStepIndex !== -1) {
      offer.approvalChain[currentStepIndex].status = 'rejected';
      offer.approvalChain[currentStepIndex].approverId = req.user._id;
      offer.approvalChain[currentStepIndex].comments = reason || 'Rejected by approver';
      offer.approvalChain[currentStepIndex].actionedAt = new Date();
    }

    offer.status = 'draft';
    await offer.save();

    const populated = await JobOffer.findById(offer._id)
      .populate('candidateId', 'fullName candidateCode email')
      .populate('jobOpeningId', 'title jobCode')
      .populate('approvalChain.approverId', USER_FIELDS)
      .lean();

    return res.json(populated);
  } catch (err) {
    console.error('[offerController.rejectOfferStep] Error:', err);
    return res.status(500).json({ error: 'Failed to reject offer step.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/offers/:id/send — Send offer with e-sign token
// ─────────────────────────────────────────────────────────
const sendOfferToCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await JobOffer.findOne(scopedFilter(req, { _id: id }));
    if (!offer) {
      return res.status(404).json({ error: 'Job offer not found.' });
    }

    if (offer.status !== 'approved' && offer.status !== 'draft') {
      return res.status(400).json({ error: `Only approved offers can be officially sent (current: ${offer.status}).` });
    }

    // Generate secure signToken
    const signToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = offer.validUntil || new Date(Date.now() + 14 * 24 * 3600 * 1000);

    offer.eSignature = {
      ...offer.eSignature,
      signToken,
      tokenExpiresAt,
    };
    offer.status = 'sent';
    offer.sentAt = new Date();

    await offer.save();

    const populated = await JobOffer.findById(offer._id)
      .populate('candidateId', 'fullName candidateCode email phone')
      .populate('jobOpeningId', 'title jobCode')
      .populate('departmentId', 'name')
      .populate('approvedBy', USER_FIELDS)
      .lean();

    const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
    const signUrl = `${frontendOrigin}/offers/sign/${signToken}`;

    // Dispatch branded Offer Letter via SMTP Email Service
    let emailResult = { success: false, simulated: true };
    try {
      const organization = await Organization.findById(req.organizationId).lean();
      emailResult = await emailService.sendOfferLetterEmail({
        candidate: populated.candidateId,
        offer: populated,
        signUrl,
        jobOpening: populated.jobOpeningId,
        department: populated.departmentId,
        organization,
      });
    } catch (emailErr) {
      console.error('[offerController.sendOfferToCandidate] Email dispatch error:', emailErr.message);
      emailResult = { success: false, error: emailErr.message };
    }

    const emailStatusNote = emailResult.success
      ? (emailResult.simulated ? ' (Simulated Dev Email)' : ' via live SMTP')
      : ' (Email delivery pending/queued)';

    await RecruitmentActivity.create({
      organizationId: req.organizationId,
      candidateId: offer.candidateId,
      jobOpeningId: offer.jobOpeningId,
      type: 'offer_status_change',
      title: 'Offer Sent to Candidate via Email',
      description: `Offer ${offer.offerCode} dispatched to ${populated.candidateId?.email || 'candidate'}${emailStatusNote} with secure E-Sign link.`,
      performedBy: req.user._id,
      metadata: {
        offerId: offer._id,
        signToken,
        signUrl,
        emailResult,
      },
    });

    return res.json({
      ...populated,
      signUrl,
      emailDelivery: emailResult,
    });
  } catch (err) {
    console.error('[offerController.sendOfferToCandidate] Error:', err);
    return res.status(500).json({ error: 'Failed to send offer to candidate.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/recruitment/offers/:id/letter — Get offer letter HTML
// ─────────────────────────────────────────────────────────
const getOfferLetterHtml = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await JobOffer.findOne(scopedFilter(req, { _id: id }))
      .populate('candidateId', 'fullName candidateCode email phone')
      .populate('jobOpeningId', 'title jobCode departmentId')
      .populate('departmentId', 'name')
      .lean();

    if (!offer) {
      return res.status(404).json({ error: 'Job offer not found.' });
    }

    const organization = await Organization.findById(req.organizationId).lean();
    const html = offerLetterService.generateOfferLetterHtml(offer, organization || {});

    return res.json({ success: true, html });
  } catch (err) {
    console.error('[offerController.getOfferLetterHtml] Error:', err);
    return res.status(500).json({ error: 'Failed to generate offer letter.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/recruitment/offers/:id/pdf — Download offer letter PDF
// ─────────────────────────────────────────────────────────
const downloadOfferLetterPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await JobOffer.findOne(scopedFilter(req, { _id: id }))
      .populate('candidateId', 'fullName candidateCode email phone')
      .populate('jobOpeningId', 'title jobCode departmentId')
      .populate('departmentId', 'name')
      .lean();

    if (!offer) {
      return res.status(404).json({ error: 'Job offer not found.' });
    }

    const organization = await Organization.findById(req.organizationId).lean();
    const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
    const signUrl = offer.eSignature?.signToken
      ? `${frontendOrigin}/offers/sign/${offer.eSignature.signToken}`
      : '';

    const pdfBuffer = await pdfService.generateOfferLetterPdf({
      offer,
      organization: organization || {},
      candidate: offer.candidateId,
      signUrl,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Offer_Letter_${offer.offerCode || 'OFFER'}.pdf`
    );
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('[offerController.downloadOfferLetterPdf] Error:', err);
    return res.status(500).json({ error: 'Failed to generate offer letter PDF.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/recruitment/offers/:id/status — Update status
// ─────────────────────────────────────────────────────────
const updateOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid offer id.' });
    }

    const validStatuses = JobOffer.schema.path('status').enumValues;
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const offer = await JobOffer.findOne(scopedFilter(req, { _id: id }));
    if (!offer) {
      return res.status(404).json({ error: 'Job offer not found.' });
    }

    offer.status = status;
    if (notes) offer.notes = notes;

    if (status === 'approved') {
      offer.approvedBy = req.user._id;
    } else if (status === 'sent') {
      offer.sentAt = new Date();
      if (!offer.eSignature?.signToken) {
        offer.eSignature = {
          ...offer.eSignature,
          signToken: crypto.randomBytes(32).toString('hex'),
          tokenExpiresAt: offer.validUntil,
        };
      }
    } else if (status === 'accepted' || status === 'declined') {
      offer.respondedAt = new Date();
    }

    await offer.save();

    // If accepted, update candidate stage if not already hired
    if (status === 'accepted') {
      const candidate = await Candidate.findById(offer.candidateId);
      if (candidate && candidate.stage !== 'hired') {
        candidate.stageHistory.push({
          fromStage: candidate.stage,
          toStage: 'offer_sent',
          changedBy: req.user._id,
          changedAt: new Date(),
          note: `Offer ${offer.offerCode} accepted. Ready for HRMS onboarding.`,
        });
        await candidate.save();
      }
    }

    const populated = await JobOffer.findById(offer._id)
      .populate('candidateId', 'fullName candidateCode email phone stage convertedEmployeeId')
      .populate('jobOpeningId', 'title jobCode salaryRange')
      .populate('departmentId', 'name')
      .populate('approvedBy', USER_FIELDS)
      .populate('approvalChain.approverId', USER_FIELDS)
      .lean();

    await RecruitmentActivity.create({
      organizationId: req.organizationId,
      candidateId: offer.candidateId,
      jobOpeningId: offer.jobOpeningId,
      type: 'offer_status_change',
      title: 'Offer Status Changed',
      description: `Offer ${offer.offerCode} status changed to "${status}".`,
      performedBy: req.user._id,
      metadata: { offerId: offer._id, status },
    });

    return res.json(populated);
  } catch (err) {
    console.error('[offerController.updateOfferStatus] Error:', err);
    return res.status(500).json({ error: 'Failed to update offer status.' });
  }
};

module.exports = {
  getOffers,
  createOffer,
  updateOfferStatus,
  submitOfferForApproval,
  approveOfferStep,
  rejectOfferStep,
  sendOfferToCandidate,
  getOfferLetterHtml,
  downloadOfferLetterPdf,
};
