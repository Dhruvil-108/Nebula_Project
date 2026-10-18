const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const JobOpening = require('../models/JobOpening');
const TalentPool = require('../models/TalentPool');

class SemanticSearchService {
  /**
   * Natural Language & Multi-Attribute Semantic Search across Candidate Dossiers
   */
  async searchCandidates(organizationId, queryText = '', options = {}) {
    const orgOid = new mongoose.Types.ObjectId(organizationId);
    const filter = { organizationId: orgOid };

    if (options.minRating) {
      filter.rating = { $gte: Number(options.minRating) };
    }

    if (options.silverMedalistsOnly) {
      // Silver medalists: Advanced to later interview stages or added to pools, but not hired
      filter.stage = { $in: ['interview_round_2', 'technical_assessment', 'hr_round', 'rejected'] };
    }

    const candidates = await Candidate.find(filter)
      .populate('jobOpeningId', 'title jobCode departmentId')
      .populate('talentPoolIds', 'name color')
      .lean();

    if (!queryText.trim()) {
      return candidates.slice(0, 30).map((c) => ({
        ...c,
        relevanceScore: 100,
        matchedSkills: c.skills || [],
      }));
    }

    const terms = queryText
      .toLowerCase()
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 1);

    const scored = candidates
      .map((c) => {
        let score = 0;
        const matched = [];

        const candidateSkills = (c.skills || []).map((s) => s.toLowerCase());
        const candidateNotes = (c.notes || '').toLowerCase();
        const candidateName = (c.fullName || '').toLowerCase();

        terms.forEach((term) => {
          if (candidateName.includes(term)) {
            score += 30;
          }
          if (candidateSkills.some((s) => s.includes(term))) {
            score += 25;
            matched.push(term);
          }
          if (candidateNotes.includes(term)) {
            score += 10;
          }
        });

        // Rating boost
        if (c.rating > 0) {
          score += c.rating * 5;
        }

        const normalizedScore = Math.min(100, score);
        return {
          ...c,
          relevanceScore: normalizedScore,
          matchedSkills: Array.from(new Set(matched)),
        };
      })
      .filter((c) => c.relevanceScore > 10)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    return scored.slice(0, 40);
  }

  /**
   * Finds high-potential "Silver Medalists" for a target Job Opening
   */
  async findSilverMedalists(organizationId, jobOpeningId) {
    const orgOid = new mongoose.Types.ObjectId(organizationId);
    const job = await JobOpening.findOne({ _id: jobOpeningId, organizationId: orgOid }).lean();
    if (!job) return [];

    const jobSkills = (job.skills || []).join(' ');
    return this.searchCandidates(organizationId, jobSkills, {
      silverMedalistsOnly: true,
      minRating: 3,
    });
  }
}

module.exports = new SemanticSearchService();
