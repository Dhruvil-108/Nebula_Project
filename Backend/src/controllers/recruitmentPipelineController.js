const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const JobOpening = require('../models/JobOpening');
const RecruitmentActivity = require('../models/RecruitmentActivity');
const { CANDIDATE_STAGES } = require('../models/Candidate');
const { scopedFilter } = require('../middleware/tenant');

const USER_FIELDS = 'fullName email role';

// ─────────────────────────────────────────────────────────
// GET /api/v1/recruitment/pipeline — Kanban payload grouped by stage
// ─────────────────────────────────────────────────────────
const getRecruitmentPipeline = async (req, res) => {
  try {
    const { jobOpeningId, search } = req.query;
    const extra = {};

    if (jobOpeningId && mongoose.Types.ObjectId.isValid(jobOpeningId)) {
      extra.jobOpeningId = jobOpeningId;
    }
    if (search && String(search).trim()) {
      const rx = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      extra.$or = [{ fullName: rx }, { email: rx }, { candidateCode: rx }, { currentCompany: rx }, { skills: rx }];
    }

    const candidates = await Candidate.find(scopedFilter(req, extra))
      .populate('jobOpeningId', 'title jobCode departmentId status')
      .populate('referredBy', 'fullName employeeCode')
      .sort({ updatedAt: -1 })
      .limit(1000)
      .lean();

    const grouped = {};
    for (const stage of CANDIDATE_STAGES) {
      grouped[stage] = [];
    }

    for (const cand of candidates) {
      const stage = cand.stage || 'applied';
      if (grouped[stage]) {
        grouped[stage].push(cand);
      } else {
        grouped['applied'].push(cand);
      }
    }

    const counts = {};
    for (const stage of CANDIDATE_STAGES) {
      counts[stage] = grouped[stage].length;
    }

    return res.json({
      pipeline: grouped,
      counts,
      totalCandidates: candidates.length,
    });
  } catch (err) {
    console.error('[recruitmentPipelineController.getRecruitmentPipeline] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve recruitment pipeline.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/recruitment/candidates/:id/stage — Move candidate stage
// ─────────────────────────────────────────────────────────
const moveCandidateStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid candidate id.' });
    }
    if (!stage || !CANDIDATE_STAGES.includes(stage)) {
      return res.status(400).json({
        error: `Invalid stage. Must be one of: ${CANDIDATE_STAGES.join(', ')}`,
      });
    }

    const candidate = await Candidate.findOne(scopedFilter(req, { _id: id }));
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    const oldStage = candidate.stage;
    if (oldStage === stage) {
      return res.json(candidate);
    }

    candidate.stage = stage;
    candidate.stageHistory.push({
      fromStage: oldStage,
      toStage: stage,
      changedBy: req.user._id,
      changedAt: new Date(),
      note: note || `Stage moved from ${oldStage} to ${stage}`,
    });

    if (stage === 'hired' && !candidate.hiredAt) {
      candidate.hiredAt = new Date();
      // Increment filledPositions in JobOpening
      await JobOpening.findByIdAndUpdate(candidate.jobOpeningId, {
        $inc: { filledPositions: 1 },
      });
    }

    await candidate.save();

    const populated = await Candidate.findById(candidate._id)
      .populate('jobOpeningId', 'title jobCode departmentId status')
      .populate('referredBy', 'fullName employeeCode')
      .lean();

    // Log activity
    await RecruitmentActivity.create({
      organizationId: req.organizationId,
      candidateId: candidate._id,
      jobOpeningId: candidate.jobOpeningId,
      type: 'stage_change',
      title: 'Candidate Stage Advanced',
      description: `${candidate.fullName} moved to "${stage.replace(/_/g, ' ')}" by ${req.user.fullName || 'User'}.`,
      performedBy: req.user._id,
      metadata: { fromStage: oldStage, toStage: stage },
    });

    return res.json(populated);
  } catch (err) {
    console.error('[recruitmentPipelineController.moveCandidateStage] Error:', err);
    return res.status(500).json({ error: 'Failed to update candidate stage.' });
  }
};

module.exports = {
  getRecruitmentPipeline,
  moveCandidateStage,
};
