const Referral = require('../models/Referral');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const JobOpening = require('../models/JobOpening');
const counterService = require('../services/counterService');
const duplicateDetectionService = require('../services/duplicateDetectionService');
const { scopedFilter } = require('../middleware/moduleAccess');

exports.getReferrals = async (req, res) => {
  try {
    const filter = scopedFilter(req);
    const referrals = await Referral.find(filter)
      .populate('jobOpeningId', 'title jobCode locationType')
      .populate('candidateId', 'fullName candidateCode email phone stage')
      .populate('applicationId', 'applicationCode stage status')
      .populate('referredBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json(referrals);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error fetching referrals' });
  }
};

exports.createReferral = async (req, res) => {
  try {
    const { jobOpeningId, fullName, email, phone, relationship, notes, resumeUrl } = req.body;
    if (!jobOpeningId || !fullName || !email || !relationship) {
      return res.status(400).json({ message: 'jobOpeningId, fullName, email, and relationship are required.' });
    }

    const orgId = req.user.organizationId;
    const job = await JobOpening.findOne({ _id: jobOpeningId, organizationId: orgId });
    if (!job) {
      return res.status(404).json({ message: 'Target job opening not found' });
    }

    // 1. Check duplicate candidate or reuse
    const dup = await duplicateDetectionService.findDuplicate(orgId, { email, phone, fullName });
    let candidate = null;

    if (dup.isDuplicate && dup.existingCandidate) {
      candidate = dup.existingCandidate;
      if (resumeUrl && !candidate.resumeUrl) candidate.resumeUrl = resumeUrl;
      await candidate.save();
    } else {
      const candidateCode = await counterService.generateCandidateCode(orgId);
      candidate = await Candidate.create({
        organizationId: orgId,
        candidateCode,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : '',
        resumeUrl: resumeUrl || '',
        stage: 'applied',
        jobOpeningId: job._id,
        source: 'referral',
        referredBy: req.user._id,
      });
    }

    // 2. Check if already referred for this job
    const existingReferral = await Referral.findOne({
      organizationId: orgId,
      jobOpeningId: job._id,
      candidateId: candidate._id,
    });
    if (existingReferral) {
      return res.status(409).json({ message: 'This candidate has already been referred for this specific job opening.' });
    }

    // 3. Create Application
    const applicationCode = await counterService.generateApplicationCode(orgId);
    const application = await Application.create({
      organizationId: orgId,
      applicationCode,
      candidateId: candidate._id,
      jobOpeningId: job._id,
      stage: 'applied',
      status: 'active',
      source: 'referral',
      stageHistory: [
        {
          fromStage: 'applied',
          toStage: 'applied',
          changedBy: req.user._id,
          changedAt: new Date(),
          note: `Referred by ${req.user.fullName || req.user.email} (${relationship})`,
        },
      ],
    });

    // 4. Create Referral Record
    const referral = await Referral.create({
      organizationId: orgId,
      jobOpeningId: job._id,
      candidateId: candidate._id,
      applicationId: application._id,
      referredBy: req.user._id,
      relationship: relationship.trim(),
      notes: notes ? notes.trim() : '',
      status: 'submitted',
    });

    res.status(201).json(referral);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error creating referral' });
  }
};

exports.updateReferralStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const filter = scopedFilter(req, { _id: req.params.id });
    const referral = await Referral.findOne(filter);
    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    referral.status = status;
    await referral.save();
    res.json(referral);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error updating referral' });
  }
};
