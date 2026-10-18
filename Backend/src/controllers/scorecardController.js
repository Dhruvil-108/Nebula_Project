const mongoose = require('mongoose');
const Scorecard = require('../models/Scorecard');
const ScorecardTemplate = require('../models/ScorecardTemplate');
const Interview = require('../models/Interview');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const { scopedFilter } = require('../middleware/tenant');

/**
 * Scorecard & Calibration Controller
 * Manages evaluator scorecards, competency rubrics, and debrief calibration.
 */
class ScorecardController {
  /**
   * GET /recruitment/interviews/:interviewId/scorecards
   * Retrieves all submitted scorecards for a specific interview round.
   */
  async getInterviewScorecards(req, res) {
    try {
      const { interviewId } = req.params;
      const filter = scopedFilter(req, { interviewId });

      const scorecards = await Scorecard.find(filter)
        .populate('interviewerId', 'fullName firstName lastName email role')
        .sort({ createdAt: 1 });

      return res.json({ success: true, scorecards });
    } catch (err) {
      console.error('[ScorecardController.getInterviewScorecards]', err);
      return res.status(500).json({ error: 'Failed to retrieve scorecards' });
    }
  }

  /**
   * POST /recruitment/interviews/:interviewId/scorecards
   * Submits or updates an evaluator scorecard for the current authenticated user.
   */
  async submitScorecard(req, res) {
    try {
      const { interviewId } = req.params;
      const organizationId = req.organizationId || req.user?.organizationId;
      const interviewerId = req.user?._id;

      if (!organizationId || !interviewerId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const interview = await Interview.findOne(scopedFilter(req, { _id: interviewId }));
      if (!interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }

      const {
        competencyRatings = [],
        overallRating,
        recommendation,
        strengths = '',
        areasOfConcern = '',
        seal = false,
      } = req.body;

      if (!overallRating || !recommendation) {
        return res.status(400).json({ error: 'Overall rating and recommendation are required' });
      }

      // Check existing scorecard
      let scorecard = await Scorecard.findOne(
        scopedFilter(req, { interviewId, interviewerId })
      );

      if (scorecard && scorecard.isSealed) {
        return res.status(400).json({
          error: 'This scorecard has already been sealed and cannot be modified.',
        });
      }

      const scorecardData = {
        organizationId,
        interviewId,
        candidateId: interview.candidateId,
        applicationId: interview.applicationId,
        jobOpeningId: interview.jobOpeningId,
        interviewerId,
        competencyRatings,
        overallRating,
        recommendation,
        strengths,
        areasOfConcern,
        isSealed: Boolean(seal),
        sealedAt: seal ? new Date() : null,
      };

      if (scorecard) {
        Object.assign(scorecard, scorecardData);
        await scorecard.save();
      } else {
        scorecard = await Scorecard.create(scorecardData);
      }

      // Also maintain backward-compatible embedded scorecard on interview if lead interviewer
      interview.scorecard = {
        rating: overallRating,
        decision: recommendation,
        technicalSkillScore: competencyRatings[0]?.rating || overallRating,
        communicationScore: competencyRatings[1]?.rating || overallRating,
        cultureFitScore: competencyRatings[2]?.rating || overallRating,
        notes: strengths ? `${strengths}\n${areasOfConcern}` : areasOfConcern,
        submittedBy: interviewerId,
        submittedAt: new Date(),
      };
      await interview.save();

      return res.status(200).json({
        success: true,
        message: seal ? 'Scorecard sealed and submitted.' : 'Scorecard saved as draft.',
        scorecard,
      });
    } catch (err) {
      console.error('[ScorecardController.submitScorecard]', err);
      return res.status(500).json({ error: err.message || 'Failed to submit scorecard' });
    }
  }

  /**
   * POST /recruitment/scorecards/:id/seal
   * Seals a scorecard, locking it from retro-active edits.
   */
  async sealScorecard(req, res) {
    try {
      const { id } = req.params;
      const scorecard = await Scorecard.findOne(scopedFilter(req, { _id: id }));

      if (!scorecard) {
        return res.status(404).json({ error: 'Scorecard not found' });
      }

      scorecard.isSealed = true;
      scorecard.sealedAt = new Date();
      await scorecard.save();

      return res.json({ success: true, message: 'Scorecard sealed successfully.', scorecard });
    } catch (err) {
      console.error('[ScorecardController.sealScorecard]', err);
      return res.status(500).json({ error: 'Failed to seal scorecard' });
    }
  }

  /**
   * GET /recruitment/interviews/:interviewId/debrief
   * Generates a synthesized debrief summary with side-by-side evaluator metrics and variance alerts.
   */
  async getInterviewDebrief(req, res) {
    try {
      const { interviewId } = req.params;
      const interview = await Interview.findOne(scopedFilter(req, { _id: interviewId }))
        .populate('candidateId', 'fullName candidateCode email phone currentCompany')
        .populate('jobOpeningId', 'title jobCode department')
        .populate('interviewers', 'fullName firstName lastName email role');

      if (!interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }

      const scorecards = await Scorecard.find(scopedFilter(req, { interviewId }))
        .populate('interviewerId', 'fullName firstName lastName email role');

      // Calculate aggregated metrics
      const totalScorecards = scorecards.length;
      let averageOverallRating = 0;
      let varianceAlert = false;
      let ratingSpread = 0;

      if (totalScorecards > 0) {
        const ratings = scorecards.map((s) => s.overallRating);
        const sum = ratings.reduce((acc, r) => acc + r, 0);
        averageOverallRating = Math.round((sum / totalScorecards) * 10) / 10;

        const maxRating = Math.max(...ratings);
        const minRating = Math.min(...ratings);
        ratingSpread = maxRating - minRating;

        // If spread >= 2 stars (e.g. 5 vs 3, or 4 vs 2), trigger variance alert
        if (ratingSpread >= 2) {
          varianceAlert = true;
        }
      }

      // Tally recommendations
      const recommendationTallies = {
        strong_hire: scorecards.filter((s) => s.recommendation === 'strong_hire').length,
        hire: scorecards.filter((s) => s.recommendation === 'hire').length,
        neutral: scorecards.filter((s) => s.recommendation === 'neutral').length,
        no_hire: scorecards.filter((s) => s.recommendation === 'no_hire').length,
        strong_no_hire: scorecards.filter((s) => s.recommendation === 'strong_no_hire').length,
      };

      return res.json({
        success: true,
        interview,
        totalScorecards,
        averageOverallRating,
        ratingSpread,
        varianceAlert,
        recommendationTallies,
        scorecards,
        consensusOutcome: interview.consensusOutcome || { decision: 'pending' },
      });
    } catch (err) {
      console.error('[ScorecardController.getInterviewDebrief]', err);
      return res.status(500).json({ error: 'Failed to generate interview debrief' });
    }
  }

  /**
   * POST /recruitment/interviews/:interviewId/consensus
   * Records hiring manager consensus decision from debrief meeting.
   */
  async recordConsensus(req, res) {
    try {
      const { interviewId } = req.params;
      const { decision, notes = '', advanceStage = false, targetStage = '' } = req.body;

      const interview = await Interview.findOne(scopedFilter(req, { _id: interviewId }));
      if (!interview) {
        return res.status(404).json({ error: 'Interview not found' });
      }

      interview.consensusOutcome = {
        decision,
        notes,
        decidedBy: req.user?._id || null,
        decidedAt: new Date(),
      };
      interview.status = 'completed';
      await interview.save();

      // Optionally advance candidate stage if approved
      if (advanceStage && targetStage && interview.candidateId) {
        await Candidate.findOneAndUpdate(
          scopedFilter(req, { _id: interview.candidateId }),
          { $set: { stage: targetStage } }
        );

        if (interview.applicationId) {
          await Application.findOneAndUpdate(
            scopedFilter(req, { _id: interview.applicationId }),
            {
              $set: { stage: targetStage },
              $push: {
                stageHistory: {
                  fromStage: 'interview',
                  toStage: targetStage,
                  note: `Consensus decision: ${decision}. ${notes}`,
                  changedBy: req.user?._id,
                  changedAt: new Date(),
                },
              },
            }
          );
        }
      }

      return res.json({
        success: true,
        message: 'Consensus decision recorded successfully.',
        consensusOutcome: interview.consensusOutcome,
      });
    } catch (err) {
      console.error('[ScorecardController.recordConsensus]', err);
      return res.status(500).json({ error: 'Failed to record consensus outcome' });
    }
  }

  /**
   * GET /recruitment/settings/scorecard-templates
   * Lists all competency rubric templates.
   */
  async getScorecardTemplates(req, res) {
    try {
      const templates = await ScorecardTemplate.find(scopedFilter(req, {}))
        .sort({ isDefault: -1, createdAt: -1 });

      return res.json({ success: true, templates });
    } catch (err) {
      console.error('[ScorecardController.getScorecardTemplates]', err);
      return res.status(500).json({ error: 'Failed to retrieve templates' });
    }
  }

  /**
   * POST /recruitment/settings/scorecard-templates
   * Creates a new competency rubric template.
   */
  async createScorecardTemplate(req, res) {
    try {
      const organizationId = req.user?.organizationId;
      const { name, department = 'General', roleType = 'all', competencies = [], isDefault = false } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Template name is required' });
      }

      const template = await ScorecardTemplate.create({
        organizationId,
        name,
        department,
        roleType,
        competencies,
        isDefault: Boolean(isDefault),
        createdBy: req.user?._id,
      });

      return res.status(201).json({ success: true, template });
    } catch (err) {
      console.error('[ScorecardController.createScorecardTemplate]', err);
      return res.status(500).json({ error: 'Failed to create scorecard template' });
    }
  }
}

module.exports = new ScorecardController();
