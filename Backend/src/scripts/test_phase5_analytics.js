require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Organization = require('../models/Organization');
const JobOpening = require('../models/JobOpening');
const Candidate = require('../models/Candidate');
const JobOffer = require('../models/JobOffer');
const Department = require('../models/Department');
const EeoSurvey = require('../models/EeoSurvey');
const TalentPool = require('../models/TalentPool');
const recruitmentAnalyticsService = require('../services/recruitmentAnalyticsService');
const eeoComplianceService = require('../services/eeoComplianceService');
const exportService = require('../services/exportService');
const semanticSearchService = require('../services/semanticSearchService');
const fallbackProvider = require('../services/ai/providers/fallbackProvider');
const recruiterCopilotPrompt = require('../services/ai/prompts/recruiterCopilot.v1');

async function runPhase5Tests() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  PHASE 5 ANALYTICS, COMPLIANCE & COPILOT: ACCEPTANCE TESTS  ');
  console.log('══════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  await connectDB();

  const orgId = new mongoose.Types.ObjectId();
  const testTenantSlug = `test-org-p5-${Date.now()}`;
  const deptEngineeringId = new mongoose.Types.ObjectId();
  const deptSalesId = new mongoose.Types.ObjectId();
  const jobOpening1Id = new mongoose.Types.ObjectId();
  const jobOpening2Id = new mongoose.Types.ObjectId();

  try {
    // ── Setup Test Organization & Departments ──
    const org = await Organization.create({
      _id: orgId,
      name: 'Phase 5 Analytics Corp',
      slug: testTenantSlug,
      branding: { primaryColor: '#f97316' },
    });

    const deptEng = await Department.create({
      _id: deptEngineeringId,
      organizationId: orgId,
      name: 'Engineering',
      code: 'ENG',
    });

    const deptSales = await Department.create({
      _id: deptSalesId,
      organizationId: orgId,
      name: 'Sales & Growth',
      code: 'S&G',
    });

    // ── Setup Test Job Openings ──
    const jobEng = await JobOpening.create({
      _id: jobOpening1Id,
      organizationId: orgId,
      jobCode: 'JOB-P5-ENG-001',
      title: 'Staff Fullstack Architect',
      departmentId: deptEngineeringId,
      department: 'Engineering',
      status: 'published',
      openPositions: 2,
      filledPositions: 1,
      skills: ['TypeScript', 'Node.js', 'React', 'Distributed Systems'],
      openedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    });

    const jobSales = await JobOpening.create({
      _id: jobOpening2Id,
      organizationId: orgId,
      jobCode: 'JOB-P5-SLS-001',
      title: 'Senior Account Executive',
      departmentId: deptSalesId,
      department: 'Sales & Growth',
      status: 'published',
      openPositions: 1,
      filledPositions: 1,
      skills: ['B2B SaaS Sales', 'Enterprise Closing', 'Salesforce CRM'],
      openedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      closedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });

    // ── Setup Test Candidates across Stages & Sources ──
    console.log('Setup: Seeding candidate pipeline across stages & sources...');

    // Candidate 1: Hired via LinkedIn (Engineering)
    const cand1 = await Candidate.create({
      organizationId: orgId,
      candidateCode: 'CAN-P5-001',
      jobOpeningId: jobOpening1Id,
      fullName: 'Alice Turing',
      email: 'alice.turing@example.com',
      phone: '+1 555-0101',
      stage: 'hired',
      source: 'linkedin',
      rating: 5,
      skills: ['TypeScript', 'Node.js', 'React', 'Distributed Systems'],
      tags: ['top_performer', 'architect'],
      appliedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      hiredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });

    // Candidate 2: Silver Medalist (interview_round_2) via Referral (Engineering)
    const cand2 = await Candidate.create({
      organizationId: orgId,
      candidateCode: 'CAN-P5-002',
      jobOpeningId: jobOpening1Id,
      fullName: 'Bob Lovelace',
      email: 'bob.lovelace@example.com',
      phone: '+1 555-0102',
      stage: 'interview_round_2',
      source: 'referral',
      rating: 4,
      skills: ['TypeScript', 'Node.js', 'React', 'Distributed Systems'],
      tags: ['strong_culture_fit', 'silver_medalist'],
      appliedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    });

    // Candidate 3: Technical Assessment via Career Portal (Engineering)
    const cand3 = await Candidate.create({
      organizationId: orgId,
      candidateCode: 'CAN-P5-003',
      jobOpeningId: jobOpening1Id,
      fullName: 'Charlie Shannon',
      email: 'charlie.shannon@example.com',
      phone: '+1 555-0103',
      stage: 'technical_assessment',
      source: 'careers_page',
      rating: 3,
      skills: ['Go', 'Kubernetes', 'Microservices'],
      tags: ['backend'],
      appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    });

    // Candidate 4: Applied (Top of funnel) via Job Portal
    const cand4 = await Candidate.create({
      organizationId: orgId,
      candidateCode: 'CAN-P5-004',
      jobOpeningId: jobOpening1Id,
      fullName: 'Diana Hopper',
      email: 'diana.hopper@example.com',
      phone: '+1 555-0104',
      stage: 'applied',
      source: 'job_portal',
      rating: 2,
      skills: ['Java', 'Spring Boot'],
      appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });

    // Candidate 5: Hired via Referral (Sales)
    const cand5 = await Candidate.create({
      organizationId: orgId,
      candidateCode: 'CAN-P5-005',
      jobOpeningId: jobOpening2Id,
      fullName: 'Evan Bell',
      email: 'evan.bell@example.com',
      phone: '+1 555-0105',
      stage: 'hired',
      source: 'referral',
      rating: 5,
      skills: ['B2B SaaS Sales', 'Enterprise Closing', 'Salesforce CRM'],
      tags: ['quota_crusher'],
      appliedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      hiredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    });

    // ── Setup Test Job Offers ──
    await JobOffer.create({
      organizationId: orgId,
      offerCode: 'OFF-P5-001',
      candidateId: cand1._id,
      jobOpeningId: jobOpening1Id,
      designation: 'Staff Fullstack Architect',
      departmentId: deptEngineeringId,
      offeredSalary: 180000,
      joiningDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      compensationBreakdown: {
        totalCtc: 180000,
        baseSalary: 140000,
        variableBonus: 20000,
        equity: { estimatedValue: 20000 },
      },
      status: 'accepted',
    });

    await JobOffer.create({
      organizationId: orgId,
      offerCode: 'OFF-P5-002',
      candidateId: cand5._id,
      jobOpeningId: jobOpening2Id,
      designation: 'Senior Account Executive',
      departmentId: deptSalesId,
      offeredSalary: 150000,
      joiningDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      compensationBreakdown: {
        totalCtc: 150000,
        baseSalary: 90000,
        variableBonus: 60000,
      },
      status: 'accepted',
    });

    await JobOffer.create({
      organizationId: orgId,
      offerCode: 'OFF-P5-003',
      candidateId: cand3._id,
      jobOpeningId: jobOpening1Id,
      designation: 'Staff Fullstack Architect',
      departmentId: deptEngineeringId,
      offeredSalary: 130000,
      joiningDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      compensationBreakdown: {
        totalCtc: 130000,
        baseSalary: 110000,
        variableBonus: 20000,
      },
      status: 'declined',
    });

    // ───────────────────────────────────────────────────────────────────
    // SECTION 1: RECRUITMENT ANALYTICS ENGINE
    // ───────────────────────────────────────────────────────────────────
    console.log('\n--- SECTION 1: Recruitment Analytics Engine ---');

    // TEST 1: Overview KPIs
    console.log('Test 1: Overview KPIs aggregation...');
    const kpis = await recruitmentAnalyticsService.getOverviewKpis(orgId);
    assert(kpis.activeCandidates === 3, `Active candidates count is 3 (got ${kpis.activeCandidates})`);
    assert(kpis.totalHires === 2, `Total hired count is 2 (got ${kpis.totalHires})`);
    assert(kpis.openJobOpenings === 2, `Open job openings count is 2 (got ${kpis.openJobOpenings})`);
    assert(kpis.avgTimeToHireDays > 0, `Average days to hire is calculated (>0) (got ${kpis.avgTimeToHireDays} days)`);
    assert(kpis.offerAcceptanceRate === 66.7, `Offer acceptance rate is 66.7% (2 accepted out of 3) (got ${kpis.offerAcceptanceRate}%)`);

    // TEST 2: Funnel Drop-off Analysis
    console.log('\nTest 2: Sequential Funnel Drop-off Analysis...');
    const funnelResult = await recruitmentAnalyticsService.getFunnelConversion(orgId);
    assert(Array.isArray(funnelResult.funnel) && funnelResult.funnel.length >= 6, `Funnel returns stages array (count: ${funnelResult.funnel.length})`);
    assert(funnelResult.totalCandidates === 5, `Total candidates entering funnel is 5 (got ${funnelResult.totalCandidates})`);
    
    const appliedStage = funnelResult.funnel.find(s => s.stage === 'applied');
    const hiredStage = funnelResult.funnel.find(s => s.stage === 'hired');
    assert(appliedStage && appliedStage.count === 5, `Applied stage contains 5 candidates (got ${appliedStage?.count})`);
    assert(hiredStage && hiredStage.count === 2, `Hired stage contains 2 candidates (got ${hiredStage?.count})`);
    assert(appliedStage && appliedStage.passThroughRate === 100, `Top of funnel pass-through rate is 100%`);

    // TEST 3: Sourcing Channel ROI
    console.log('\nTest 3: Sourcing Channel ROI tracking...');
    const sourcingRoi = await recruitmentAnalyticsService.getSourcingChannelRoi(orgId);
    assert(Array.isArray(sourcingRoi) && sourcingRoi.length >= 4, `Sourcing ROI tracks distinct channels (count: ${sourcingRoi.length})`);
    
    const referralSource = sourcingRoi.find(s => s.source === 'referral');
    assert(referralSource && referralSource.applicants === 2, 'Referral tracked 2 applicants');
    assert(referralSource && referralSource.hires === 1, 'Referral produced 1 hire');
    assert(referralSource && referralSource.conversionRate === 50, `Referral conversion rate is 50% (got ${referralSource?.conversionRate}%)`);
    assert(referralSource && referralSource.avgRating === 4.5, `Referral average rating is 4.5 (got ${referralSource?.avgRating})`);

    // TEST 4: Velocity Metrics by Department
    console.log('\nTest 4: Department Hiring Velocity Metrics...');
    const velocity = await recruitmentAnalyticsService.getVelocityMetrics(orgId);
    assert(Array.isArray(velocity) && velocity.length >= 2, `Velocity metrics grouped by department (count: ${velocity.length})`);
    
    const engDept = velocity.find(v => v.department === 'Engineering');
    assert(engDept && engDept.filledPositions === 1, 'Engineering department has 1 filled position');
    assert(engDept && engDept.openPositions === 1, 'Engineering department has 1 open position');

    // ───────────────────────────────────────────────────────────────────
    // SECTION 2: EEO & DEI COMPLIANCE & FOUR-FIFTHS RULE
    // ───────────────────────────────────────────────────────────────────
    console.log('\n--- SECTION 2: EEO Compliance & Adverse Impact Diagnostic ---');

    // TEST 5: Anonymous EEO Survey Intake (Strictly Decoupled)
    console.log('Test 5: Anonymous EEO Survey intake (Zero Candidate PII Linkage)...');
    const survey1 = await eeoComplianceService.recordSurveyResponse(
      orgId,
      jobOpening1Id,
      {
        gender: 'female',
        ethnicity: 'asian',
        veteranStatus: 'non_veteran',
        disabilityStatus: 'no_disability',
        stageReached: 'hired',
      }
    );

    assert(survey1._id != null, 'EEO survey record persisted with unique ID');
    assert(survey1.candidateId === undefined, 'No candidateId field exists in EEO Survey (Guaranteed Anti-Bias)');
    assert(survey1.applicantId === undefined, 'No applicantId field exists in EEO Survey');

    // Seed demographic survey records for adverse impact diagnostic
    // Benchmark group (Male): 10 applicants, 5 hired -> Selection Rate = 50%
    for (let i = 0; i < 5; i++) {
      await EeoSurvey.create({
        organizationId: orgId,
        gender: 'male',
        ethnicity: 'white',
        stageReached: 'hired',
      });
    }
    for (let i = 0; i < 5; i++) {
      await EeoSurvey.create({
        organizationId: orgId,
        gender: 'male',
        ethnicity: 'white',
        stageReached: 'applied',
      });
    }

    // Disparate comparison group (Female): 10 applicants, 1 hired -> Selection Rate = 10%
    // 10% / 50% = 0.20 (20% < 80% four-fifths threshold -> ADVERSE IMPACT DETECTED)
    for (let i = 0; i < 9; i++) {
      await EeoSurvey.create({
        organizationId: orgId,
        gender: 'female',
        ethnicity: 'asian',
        stageReached: 'applied',
      });
    }

    // TEST 6: Demographic Distributions
    console.log('\nTest 6: EEO Demographic Distributions Summary...');
    const demoSummary = await eeoComplianceService.getDemographicsSummary(orgId);
    assert(demoSummary.totalSubmissions >= 20, `Total anonymous responses recorded >= 20 (got ${demoSummary.totalSubmissions})`);
    assert(demoSummary.gender.length >= 2, 'Gender breakdown contains both male and female groups');

    // TEST 7: Four-Fifths (80%) Rule Adverse Impact Analysis
    console.log('\nTest 7: Four-Fifths (80%) Rule Adverse Impact Diagnostic...');
    const adverseGender = await eeoComplianceService.calculateAdverseImpact(orgId);
    assert(adverseGender.benchmarkGroup === 'male', `Benchmark group correctly identified as male (got ${adverseGender.benchmarkGroup})`);
    const hasAnyAdverse = adverseGender.groups.some(g => g.hasAdverseImpactNotice === true);
    assert(hasAnyAdverse === true, 'Adverse impact successfully detected across demographic groups');
    
    const femaleAnalysis = adverseGender.groups.find(a => a.group === 'female');
    assert(femaleAnalysis && femaleAnalysis.hasAdverseImpactNotice === true, 'Female demographic group flagged with hasAdverseImpactNotice');
    assert(femaleAnalysis && femaleAnalysis.impactRatio < 0.80, `Female impact ratio is ${femaleAnalysis?.impactRatio} (< 0.80)`);

    // ───────────────────────────────────────────────────────────────────
    // SECTION 3: ON-DEMAND CSV REPORTING & EXPORT
    // ───────────────────────────────────────────────────────────────────
    console.log('\n--- SECTION 3: On-Demand CSV Reporting Export ---');

    // TEST 8: Pipeline CSV Export
    console.log('Test 8: Candidate Pipeline CSV Export Generation...');
    const candidateList = await Candidate.find({ organizationId: orgId }).populate('jobOpeningId', 'title jobCode');
    const pipelineCsv = exportService.generatePipelineCsv(candidateList);
    assert(typeof pipelineCsv === 'string', 'Pipeline CSV generated as string');
    assert(pipelineCsv.includes('Candidate Code,Full Name,Email,Phone,Target Job,Stage,Rating,Source,Created Date'), 'CSV contains required standard headers');
    assert(pipelineCsv.includes('Alice Turing'), 'CSV contains Alice Turing');
    assert(pipelineCsv.includes('alice.turing@example.com'), 'CSV contains email');
    assert(pipelineCsv.includes('hired'), 'CSV reflects hired status');

    // TEST 9: Offers CSV Export
    console.log('\nTest 9: Job Offers CSV Export Generation...');
    const offerList = await JobOffer.find({ organizationId: orgId })
      .populate('candidateId', 'fullName candidateCode')
      .populate('departmentId', 'name');
    const offersCsv = exportService.generateOffersCsv(offerList);
    assert(typeof offersCsv === 'string', 'Offers CSV generated as string');
    assert(offersCsv.includes('Offer Code,Candidate Name,Designation,Department,Total CTC,Currency,Status,Joining Date,E-Signed Date'), 'Offers CSV contains compensation headers');
    assert(offersCsv.includes('180000'), 'Offers CSV contains 180000 total CTC');
    assert(offersCsv.includes('accepted'), 'Offers CSV contains accepted offer');

    // ───────────────────────────────────────────────────────────────────
    // SECTION 4: SEMANTIC TALENT REDISCOVERY & SILVER MEDALISTS
    // ───────────────────────────────────────────────────────────────────
    console.log('\n--- SECTION 4: Semantic Talent Rediscovery & Silver Medalists ---');

    // TEST 10: Semantic Candidate Search
    console.log('Test 10: Semantic Natural Language Candidate Search...');
    const searchResults = await semanticSearchService.searchCandidates(orgId, 'TypeScript Distributed Systems React');
    assert(Array.isArray(searchResults) && searchResults.length > 0, `Search returned results (count: ${searchResults.length})`);
    assert(searchResults[0].fullName === 'Alice Turing', `Top semantic candidate match is Alice Turing (got ${searchResults[0]?.fullName})`);
    assert(searchResults[0].relevanceScore > 0, `Semantic relevance score calculated: ${searchResults[0]?.relevanceScore}`);

    // TEST 11: Silver Medalist Discovery
    console.log('\nTest 11: Silver-Medalist Discovery for Re-engagement...');
    const silverMedalists = await semanticSearchService.findSilverMedalists(orgId, jobOpening1Id);
    assert(Array.isArray(silverMedalists), 'Silver medalists returned as array');
    const bob = silverMedalists.find(s => s.fullName === 'Bob Lovelace');
    assert(bob != null, 'Bob Lovelace identified as silver medalist (interview_round_2 with 4-star rating)');
    assert(bob && bob.stage === 'interview_round_2', 'Stage is interview_round_2');

    // ───────────────────────────────────────────────────────────────────
    // SECTION 5: RECRUITER AI COPILOT SYNTHESIS
    // ───────────────────────────────────────────────────────────────────
    console.log('\n--- SECTION 5: Recruiter AI Copilot Synthesis ---');

    // TEST 12: Recruiter Copilot Prompt Validation
    console.log('Test 12: Recruiter Copilot Prompt Schema Validation...');
    const sampleCopilotInput = {
      action: 'summarize_dossier',
      candidate: {
        name: 'Bob Lovelace',
        currentTitle: 'Senior Backend Engineer',
        appliedRole: 'Staff Fullstack Architect',
        experienceYears: 7,
        skills: ['TypeScript', 'Node.js', 'React', 'Distributed Systems'],
        stage: 'interview_round_2',
        rating: 4,
        notes: ['Strong system design instincts, cultural leader'],
      },
      job: {
        title: 'Staff Fullstack Architect',
        department: 'Engineering',
        requiredSkills: ['TypeScript', 'Distributed Systems'],
      },
    };

    const validatedInput = recruiterCopilotPrompt.inputSchema.parse(sampleCopilotInput);
    assert(validatedInput.action === 'summarize_dossier', 'Zod validates recruiter copilot input schema');

    // TEST 13: Recruiter Copilot Dossier Summarization (Fallback Engine)
    console.log('\nTest 13: Recruiter Copilot Dossier Synthesis...');
    const dossierResult = fallbackProvider.generateRecruiterCopilot({
      action: 'summarize_dossier',
      candidateName: 'Bob Lovelace',
      jobTitle: 'Staff Fullstack Architect',
    });
    assert(dossierResult.executiveSummary && dossierResult.executiveSummary.length > 20, 'Executive summary synthesized');
    assert(Array.isArray(dossierResult.keyStrengths) && dossierResult.keyStrengths.length > 0, 'Key strengths extracted');
    assert(Array.isArray(dossierResult.areasOfConcern), 'Areas of concern generated');
    assert(dossierResult.overallRecommendation && dossierResult.overallRecommendation.length > 0, 'Overall recommendation generated');
    assert(Array.isArray(dossierResult.suggestedNextSteps) && dossierResult.suggestedNextSteps.length > 0, 'Suggested next steps generated');

    // TEST 14: Recruiter Copilot Candidate Comparison
    console.log('\nTest 14: Recruiter Copilot Candidate Comparison...');
    const compareInput = {
      action: 'compare_candidates',
      candidateNames: ['Alice Turing', 'Bob Lovelace'],
      jobTitle: 'Staff Fullstack Architect',
    };
    const compareResult = fallbackProvider.generateRecruiterCopilot(compareInput);
    assert(compareResult.title.includes('Alice Turing') && compareResult.title.includes('Bob Lovelace'), 'Comparison synthesizes both candidates');

    // TEST 15: Recruiter Copilot Briefing Notes
    console.log('\nTest 15: Recruiter Copilot Interview Briefing Notes...');
    const briefingInput = {
      action: 'briefing_notes',
      candidateName: 'Charlie Shannon',
      jobTitle: 'Staff Fullstack Architect',
    };
    const briefingResult = fallbackProvider.generateRecruiterCopilot(briefingInput);
    assert(briefingResult.suggestedNextSteps.length > 0, 'Briefing notes output suggested next steps for interviewer');

  } catch (err) {
    console.error('Unhandled Exception in Phase 5 Test Suite:', err);
    failed++;
  } finally {
    // Clean up test data
    console.log('\nTeardown: Cleaning up Phase 5 test records...');
    await Organization.deleteOne({ _id: orgId });
    await Department.deleteMany({ organizationId: orgId });
    await JobOpening.deleteMany({ organizationId: orgId });
    await Candidate.deleteMany({ organizationId: orgId });
    await JobOffer.deleteMany({ organizationId: orgId });
    await EeoSurvey.deleteMany({ organizationId: orgId });
    await mongoose.connection.close();
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`  PHASE 5 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5Tests();
