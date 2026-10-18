const aiService = require('../services/ai/aiService');
const Candidate = require('../models/Candidate');
const JobOpening = require('../models/JobOpening');
const Scorecard = require('../models/Scorecard');
const { scopedFilter } = require('../middleware/tenant');

// POST /api/v1/recruitment/ai/copilot
const synthesizeCopilot = async (req, res) => {
  try {
    const { action = 'summarize_dossier', candidateId, candidateIds, jobOpeningId, notes } = req.body;

    let candidateName = 'Candidate';
    let skills = [];
    let jobTitle = 'Target Role';
    let candidateNames = [];
    let scorecards = [];

    if (candidateId) {
      const cand = await Candidate.findOne(scopedFilter(req, { _id: candidateId })).lean();
      if (cand) {
        candidateName = cand.fullName;
        skills = cand.skills || [];
      }
      // Load candidate's scorecards
      scorecards = await Scorecard.find(scopedFilter(req, { candidateId })).lean();
    }

    if (Array.isArray(candidateIds) && candidateIds.length > 0) {
      const candidates = await Candidate.find(scopedFilter(req, { _id: { $in: candidateIds } }))
        .select('fullName')
        .lean();
      candidateNames = candidates.map((c) => c.fullName);
    }

    if (jobOpeningId) {
      const job = await JobOpening.findOne(scopedFilter(req, { _id: jobOpeningId })).lean();
      if (job) {
        jobTitle = job.title;
      }
    }

    const { data: synthesis, provider } = await aiService.generate({
      task: 'recruiter_copilot',
      input: {
        action,
        candidateName,
        jobTitle,
        candidateNames,
        scorecards: scorecards.map((s) => ({
          overallRating: s.overallRating,
          recommendation: s.recommendation,
          strengths: s.strengths,
          areasOfConcern: s.areasOfConcern,
        })),
        skills,
        notes: notes || '',
      },
      organizationId: req.organizationId,
      userId: req.user?._id,
      entityType: 'Candidate',
      entityId: candidateId || null,
    });

    return res.json({
      success: true,
      provider,
      synthesis,
    });
  } catch (err) {
    console.error('[recruiterCopilotController.synthesizeCopilot] Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate Recruiter Copilot synthesis.' });
  }
};

module.exports = {
  synthesizeCopilot,
};
