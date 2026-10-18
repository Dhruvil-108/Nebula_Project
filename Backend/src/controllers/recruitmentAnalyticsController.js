const mongoose = require('mongoose');
const recruitmentAnalyticsService = require('../services/recruitmentAnalyticsService');
const semanticSearchService = require('../services/semanticSearchService');
const exportService = require('../services/exportService');
const Candidate = require('../models/Candidate');
const JobOffer = require('../models/JobOffer');
const { scopedFilter } = require('../middleware/tenant');

// GET /api/v1/recruitment/analytics/overview
const getOverview = async (req, res) => {
  try {
    const kpis = await recruitmentAnalyticsService.getOverviewKpis(req.organizationId);
    return res.json(kpis);
  } catch (err) {
    console.error('[analyticsController.getOverview] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve analytics overview.' });
  }
};

// GET /api/v1/recruitment/analytics/funnel
const getFunnel = async (req, res) => {
  try {
    const { jobOpeningId } = req.query;
    const funnel = await recruitmentAnalyticsService.getFunnelConversion(req.organizationId, {
      jobOpeningId,
    });
    return res.json(funnel);
  } catch (err) {
    console.error('[analyticsController.getFunnel] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve pipeline funnel analytics.' });
  }
};

// GET /api/v1/recruitment/analytics/sources
const getSources = async (req, res) => {
  try {
    const sources = await recruitmentAnalyticsService.getSourcingChannelRoi(req.organizationId);
    return res.json(sources);
  } catch (err) {
    console.error('[analyticsController.getSources] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve sourcing channel ROI.' });
  }
};

// GET /api/v1/recruitment/analytics/velocity
const getVelocity = async (req, res) => {
  try {
    const velocity = await recruitmentAnalyticsService.getVelocityMetrics(req.organizationId);
    return res.json(velocity);
  } catch (err) {
    console.error('[analyticsController.getVelocity] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve velocity metrics.' });
  }
};

// POST /api/v1/recruitment/search/semantic
const semanticSearch = async (req, res) => {
  try {
    const { query, minRating, silverMedalistsOnly } = req.body;
    const results = await semanticSearchService.searchCandidates(req.organizationId, query, {
      minRating,
      silverMedalistsOnly,
    });
    return res.json({ success: true, count: results.length, candidates: results });
  } catch (err) {
    console.error('[analyticsController.semanticSearch] Error:', err);
    return res.status(500).json({ error: 'Failed to perform semantic talent search.' });
  }
};

// GET /api/v1/recruitment/jobs/:jobId/silver-medalists
const getSilverMedalists = async (req, res) => {
  try {
    const { jobId } = req.params;
    const medalists = await semanticSearchService.findSilverMedalists(req.organizationId, jobId);
    return res.json({ success: true, medalists });
  } catch (err) {
    console.error('[analyticsController.getSilverMedalists] Error:', err);
    return res.status(500).json({ error: 'Failed to find silver medalist candidates.' });
  }
};

// POST /api/v1/recruitment/reports/export
const exportReport = async (req, res) => {
  try {
    const { reportType = 'pipeline' } = req.body;

    if (reportType === 'offers') {
      const offers = await JobOffer.find(scopedFilter(req, {}))
        .populate('candidateId', 'fullName candidateCode')
        .populate('departmentId', 'name')
        .lean();

      const csvContent = exportService.generateOffersCsv(offers);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=nebula_offers_${Date.now()}.csv`);
      return res.send(csvContent);
    }

    // Default: pipeline export
    const candidates = await Candidate.find(scopedFilter(req, {}))
      .populate('jobOpeningId', 'title jobCode')
      .lean();

    const csvContent = exportService.generatePipelineCsv(candidates);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=nebula_pipeline_${Date.now()}.csv`);
    return res.send(csvContent);
  } catch (err) {
    console.error('[analyticsController.exportReport] Error:', err);
    return res.status(500).json({ error: 'Failed to generate report export.' });
  }
};

module.exports = {
  getOverview,
  getFunnel,
  getSources,
  getVelocity,
  semanticSearch,
  getSilverMedalists,
  exportReport,
};
