const mongoose = require('mongoose');
const JobOffer = require('../models/JobOffer');
const Candidate = require('../models/Candidate');
const JobOpening = require('../models/JobOpening');
const RecruitmentActivity = require('../models/RecruitmentActivity');
const { scopedFilter } = require('../middleware/tenant');

const USER_FIELDS = 'fullName email role';

// Helper to generate unique Offer Code: OFF-YYYY-XXX
const generateOfferCode = async (orgId) => {
  const currentYear = new Date().getFullYear();
  const prefix = `OFF-${currentYear}-`;
  const count = await JobOffer.countDocuments({
    organizationId: orgId,
    offerCode: new RegExp(`^${prefix}`),
  });
  return `${prefix}${String(count + 1).padStart(3, '0')}`;
};

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
      .populate('jobOpeningId', 'title jobCode departmentId')
      .populate('departmentId', 'name')
      .populate('approvedBy', USER_FIELDS)
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
    } = req.body;

    if (!candidateId || !mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({ error: 'A valid candidate is required.' });
    }
    if (!offeredSalary || offeredSalary <= 0) {
      return res.status(400).json({ error: 'Offered salary must be greater than zero.' });
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
    const offerCode = await generateOfferCode(req.organizationId);

    const offer = await JobOffer.create({
      organizationId: req.organizationId,
      offerCode,
      candidateId,
      jobOpeningId: resolvedJobId,
      designation: designation.trim(),
      departmentId,
      offeredSalary: Number(offeredSalary),
      currency: currency || 'USD',
      joiningDate: new Date(joiningDate),
      validUntil: new Date(validUntil),
      benefits: Array.isArray(benefits) ? benefits : [],
      notes: notes || '',
      offerLetterUrl: offerLetterUrl || '',
      status: 'pending_approval',
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
        note: `Offer ${offer.offerCode} created with salary ${offer.currency} ${offer.offeredSalary.toLocaleString()}`,
      });
      await candidate.save();
    }

    const populated = await JobOffer.findById(offer._id)
      .populate('candidateId', 'fullName candidateCode email phone stage')
      .populate('jobOpeningId', 'title jobCode')
      .populate('departmentId', 'name')
      .lean();

    await RecruitmentActivity.create({
      organizationId: req.organizationId,
      candidateId,
      jobOpeningId: resolvedJobId,
      type: 'offer_created',
      title: 'Job Offer Generated',
      description: `Offer ${offer.offerCode} prepared for ${candidate.fullName} as ${offer.designation} (${offer.currency} ${offer.offeredSalary.toLocaleString()}).`,
      performedBy: req.user._id,
      metadata: { offerId: offer._id, offerCode: offer.offerCode, offeredSalary: offer.offeredSalary },
    });

    return res.status(201).json(populated);
  } catch (err) {
    console.error('[offerController.createOffer] Error:', err);
    return res.status(500).json({ error: 'Failed to create job offer.' });
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
          note: `Offer ${offer.offerCode} accepted by candidate. Ready for HRMS onboarding.`,
        });
        await candidate.save();
      }
    }

    const populated = await JobOffer.findById(offer._id)
      .populate('candidateId', 'fullName candidateCode email phone stage convertedEmployeeId')
      .populate('jobOpeningId', 'title jobCode')
      .populate('departmentId', 'name')
      .populate('approvedBy', USER_FIELDS)
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
};
