const express = require('express');
const router = express.Router();

const jobOpeningController = require('../controllers/jobOpeningController');
const candidateController = require('../controllers/candidateController');
const recruitmentPipelineController = require('../controllers/recruitmentPipelineController');
const interviewController = require('../controllers/interviewController');
const offerController = require('../controllers/offerController');
const hiringHrmsBridgeController = require('../controllers/hiringHrmsBridgeController');
const { getRecruitmentSummary } = require('../controllers/recruitmentSummaryController');
const recruitmentAiController = require('../controllers/recruitmentAiController');

const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../middleware/moduleAccess');

// Every Recruitment route requires an authenticated session
router.use(requireAuth);

// ── Summary / KPIs (view) ──
router.get('/summary', requireModuleAccess('recruitment', 'view'), getRecruitmentSummary);

// ── Job Openings ──
router.get('/jobs', requireModuleAccess('recruitment', 'view'), jobOpeningController.getJobs);
router.post('/jobs', requireModuleAccess('recruitment', 'create'), jobOpeningController.createJob);
router.get('/jobs/:id', requireModuleAccess('recruitment', 'view'), jobOpeningController.getJobById);
router.patch('/jobs/:id', requireModuleAccess('recruitment', 'edit'), jobOpeningController.updateJob);
router.patch('/jobs/:id/status', requireModuleAccess('recruitment', 'edit'), jobOpeningController.updateJobStatus);
router.delete('/jobs/:id', requireModuleAccess('recruitment', 'delete'), jobOpeningController.deleteJob);
router.post('/jobs/:id/linkedin-post', requireModuleAccess('recruitment', 'view'), recruitmentAiController.generateLinkedInPost);

// ── ATS Pipeline (Kanban) ──
router.get('/pipeline', requireModuleAccess('recruitment', 'view'), recruitmentPipelineController.getRecruitmentPipeline);
router.patch('/candidates/:id/stage', requireModuleAccess('recruitment', 'edit'), recruitmentPipelineController.moveCandidateStage);

// ── Candidates ──
router.get('/candidates', requireModuleAccess('recruitment', 'view'), candidateController.getCandidates);
router.post('/candidates', requireModuleAccess('recruitment', 'create'), candidateController.createCandidate);
router.get('/candidates/:id', requireModuleAccess('recruitment', 'view'), candidateController.getCandidateById);
router.patch('/candidates/:id', requireModuleAccess('recruitment', 'edit'), candidateController.updateCandidate);
router.delete('/candidates/:id', requireModuleAccess('recruitment', 'delete'), candidateController.deleteCandidate);

// ── Interviews ──
router.get('/interviews', requireModuleAccess('recruitment', 'view'), interviewController.getInterviews);
router.post('/interviews', requireModuleAccess('recruitment', 'create'), interviewController.scheduleInterview);
router.patch('/interviews/:id', requireModuleAccess('recruitment', 'edit'), interviewController.updateInterview);
router.post('/interviews/:id/scorecard', requireModuleAccess('recruitment', 'edit'), interviewController.submitScorecard);
router.delete('/interviews/:id', requireModuleAccess('recruitment', 'delete'), interviewController.cancelInterview);

// ── Offers ──
router.get('/offers', requireModuleAccess('recruitment', 'view'), offerController.getOffers);
router.post('/offers', requireModuleAccess('recruitment', 'create'), offerController.createOffer);
router.patch('/offers/:id/status', requireModuleAccess('recruitment', 'approve'), offerController.updateOfferStatus);

// ── HRMS Bridge: Onboard Hired Candidate as Employee ──
router.post(
  '/candidates/:id/onboard-employee',
  requireModuleAccess('recruitment', 'approve'),
  hiringHrmsBridgeController.onboardCandidateToEmployee
);

module.exports = router;
