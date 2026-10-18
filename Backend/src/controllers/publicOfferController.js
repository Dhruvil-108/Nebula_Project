const crypto = require('crypto');
const JobOffer = require('../models/JobOffer');
const Candidate = require('../models/Candidate');
const Organization = require('../models/Organization');
const RecruitmentActivity = require('../models/RecruitmentActivity');
const offerLetterService = require('../services/offerLetterService');
const pdfService = require('../services/pdfService');

/**
 * Public Candidate E-Signature Controller
 * Zero-login secure token-based portal for reviewing, signing, or declining employment offers.
 */

// ─────────────────────────────────────────────────────────
// GET /api/v1/recruitment/public/offers/:token — Get offer review details
// ─────────────────────────────────────────────────────────
const getPublicOffer = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ error: 'Offer signing token is required.' });
    }

    const offer = await JobOffer.findOne({ 'eSignature.signToken': token })
      .populate('candidateId', 'fullName candidateCode email phone')
      .populate('jobOpeningId', 'title jobCode location locationType')
      .populate('departmentId', 'name')
      .lean();

    if (!offer) {
      return res.status(404).json({ error: 'Invalid or expired offer token.' });
    }

    if (offer.eSignature?.tokenExpiresAt && new Date(offer.eSignature.tokenExpiresAt) < new Date()) {
      return res.status(410).json({ error: 'This offer link has expired. Please contact your hiring team.' });
    }

    const organization = await Organization.findById(offer.organizationId).lean();
    const letterHtml = offerLetterService.generateOfferLetterHtml(offer, organization || {});

    return res.json({
      success: true,
      offer: {
        _id: offer._id,
        offerCode: offer.offerCode,
        candidateName: offer.candidateId?.fullName,
        candidateEmail: offer.candidateId?.email,
        jobTitle: offer.jobOpeningId?.title,
        designation: offer.designation,
        departmentName: offer.departmentId?.name,
        offeredSalary: offer.offeredSalary,
        currency: offer.currency,
        compensationBreakdown: offer.compensationBreakdown,
        joiningDate: offer.joiningDate,
        validUntil: offer.validUntil,
        status: offer.status,
        benefits: offer.benefits,
        eSignature: offer.eSignature,
      },
      organization: {
        name: organization?.name || 'Nebula Enterprise Hub',
        logo: organization?.logoUrl || '',
      },
      letterHtml,
    });
  } catch (err) {
    console.error('[publicOfferController.getPublicOffer] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve offer document.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/public/offers/:token/sign — Candidate E-Sign Acceptance
// ─────────────────────────────────────────────────────────
const signPublicOffer = async (req, res) => {
  try {
    const { token } = req.params;
    const { signerName, signatureImageUrl } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Offer signing token is required.' });
    }
    if (!signerName || !signerName.trim()) {
      return res.status(400).json({ error: 'Legal signer name is required.' });
    }

    const offer = await JobOffer.findOne({ 'eSignature.signToken': token });
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found or invalid token.' });
    }

    if (offer.status === 'accepted') {
      return res.status(400).json({ error: 'This offer has already been accepted and signed.' });
    }
    if (offer.status === 'declined' || offer.status === 'revoked') {
      return res.status(400).json({ error: `Cannot sign an offer that has been ${offer.status}.` });
    }

    if (offer.eSignature?.tokenExpiresAt && new Date(offer.eSignature.tokenExpiresAt) < new Date()) {
      return res.status(410).json({ error: 'This offer link has expired.' });
    }

    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      'Verified Candidate Client';
    const clientUserAgent = req.headers['user-agent'] || 'Web Browser';

    offer.status = 'accepted';
    offer.respondedAt = new Date();
    offer.eSignature.signedAt = new Date();
    offer.eSignature.signedIp = clientIp;
    offer.eSignature.signedUserAgent = clientUserAgent;
    offer.eSignature.signerName = signerName.trim();
    if (signatureImageUrl) {
      offer.eSignature.signatureImageUrl = signatureImageUrl;
    }

    await offer.save();

    // Advance Candidate stage history
    const candidate = await Candidate.findById(offer.candidateId);
    if (candidate && candidate.stage !== 'hired') {
      const prevStage = candidate.stage;
      candidate.stage = 'offer_sent';
      candidate.stageHistory.push({
        fromStage: prevStage,
        toStage: 'offer_sent',
        changedAt: new Date(),
        note: `Offer ${offer.offerCode} accepted & digitally signed by ${signerName.trim()} (IP: ${clientIp}). Ready for HRMS onboarding.`,
      });
      await candidate.save();
    }

    await RecruitmentActivity.create({
      organizationId: offer.organizationId,
      candidateId: offer.candidateId,
      jobOpeningId: offer.jobOpeningId,
      type: 'offer_status_change',
      title: 'Offer Digitally Accepted & Sealed',
      description: `Candidate ${signerName} signed and accepted Offer ${offer.offerCode} from IP ${clientIp}.`,
      metadata: {
        offerId: offer._id,
        signerName,
        signedIp: clientIp,
        signedAt: offer.eSignature.signedAt,
      },
    });

    return res.json({
      success: true,
      message: '🎉 Offer successfully accepted and digitally signed!',
      offer: {
        _id: offer._id,
        offerCode: offer.offerCode,
        status: offer.status,
        eSignature: offer.eSignature,
      },
    });
  } catch (err) {
    console.error('[publicOfferController.signPublicOffer] Error:', err);
    return res.status(500).json({ error: 'Failed to process offer digital signature.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/public/offers/:token/decline — Candidate Decline
// ─────────────────────────────────────────────────────────
const declinePublicOffer = async (req, res) => {
  try {
    const { token } = req.params;
    const { reason, notes } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Offer signing token is required.' });
    }

    const offer = await JobOffer.findOne({ 'eSignature.signToken': token });
    if (!offer) {
      return res.status(404).json({ error: 'Offer not found or invalid token.' });
    }

    if (offer.status === 'accepted') {
      return res.status(400).json({ error: 'Cannot decline an offer that has already been signed.' });
    }

    offer.status = 'declined';
    offer.respondedAt = new Date();
    offer.eSignature.declineReason = reason || 'Declined by candidate';
    offer.eSignature.declineNotes = notes || '';

    await offer.save();

    // Update candidate stage
    const candidate = await Candidate.findById(offer.candidateId);
    if (candidate) {
      candidate.stage = 'rejected';
      candidate.rejectionReason = `Candidate declined offer: ${reason || 'No specific reason given'}. ${notes || ''}`.trim();
      candidate.stageHistory.push({
        fromStage: 'offer_sent',
        toStage: 'rejected',
        changedAt: new Date(),
        note: `Candidate declined offer ${offer.offerCode}: ${reason || 'N/A'}.`,
      });
      await candidate.save();
    }

    await RecruitmentActivity.create({
      organizationId: offer.organizationId,
      candidateId: offer.candidateId,
      jobOpeningId: offer.jobOpeningId,
      type: 'offer_status_change',
      title: 'Offer Declined by Candidate',
      description: `Offer ${offer.offerCode} was declined. Reason: ${reason || 'None provided'}.`,
      metadata: { offerId: offer._id, reason, notes },
    });

    return res.json({
      success: true,
      message: 'Offer decline response recorded.',
    });
  } catch (err) {
    console.error('[publicOfferController.declinePublicOffer] Error:', err);
    return res.status(500).json({ error: 'Failed to process offer response.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/recruitment/public/offers/:token/pdf — Download PDF for public candidate
// ─────────────────────────────────────────────────────────
const downloadPublicOfferPdf = async (req, res) => {
  try {
    const { token } = req.params;
    const offer = await JobOffer.findOne({ 'eSignature.signToken': token })
      .populate('candidateId', 'fullName candidateCode email phone')
      .populate('jobOpeningId', 'title jobCode location locationType')
      .populate('departmentId', 'name')
      .lean();

    if (!offer) {
      return res.status(404).json({ error: 'Invalid or expired offer token.' });
    }

    const organization = await Organization.findById(offer.organizationId).lean();
    const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
    const signUrl = `${frontendOrigin}/offers/sign/${token}`;

    const pdfBuffer = await pdfService.generateOfferLetterPdf({
      offer,
      organization: organization || {},
      candidate: offer.candidateId,
      signUrl,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Offer_Letter_${offer.offerCode || 'OFFER'}.pdf`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('[publicOfferController.downloadPublicOfferPdf] Error:', err);
    return res.status(500).json({ error: 'Failed to generate offer letter PDF.' });
  }
};

module.exports = {
  getPublicOffer,
  signPublicOffer,
  declinePublicOffer,
  downloadPublicOfferPdf,
};
