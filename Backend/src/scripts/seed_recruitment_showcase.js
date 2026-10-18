require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Department = require('../models/Department');
const Employee = require('../models/Employee');
const Requisition = require('../models/Requisition');
const JobOpening = require('../models/JobOpening');
const Candidate = require('../models/Candidate');
const Interview = require('../models/Interview');
const ScorecardTemplate = require('../models/ScorecardTemplate');
const Scorecard = require('../models/Scorecard');
const JobOffer = require('../models/JobOffer');
const TalentPool = require('../models/TalentPool');
const EeoSurvey = require('../models/EeoSurvey');
const RecruitmentActivity = require('../models/RecruitmentActivity');
const onboardingBridgeService = require('../services/onboardingBridgeService');
const crypto = require('crypto');

async function seedRecruitmentShowcase() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('   NEBULA RECRUITMENT ENGINE: ENTERPRISE SHOWCASE SEED        ');
  console.log('══════════════════════════════════════════════════════════════\n');

  await connectDB();

  const showcaseSlug = 'nebula-showcase';

  try {
    // ── 1. Create or Find Showcase Organization ──
    console.log('[1/7] Seeding Showcase Organization...');
    let org = await Organization.findOne({ slug: showcaseSlug });
    if (!org) {
      org = await Organization.create({
        name: 'Nebula Global Technologies',
        slug: showcaseSlug,
        companyId: 'NEBULA-SHOWCASE',
        industry: 'Enterprise Cloud & AI Solutions',
        companySize: '201-1000',
        website: 'https://nebula.global',
        branding: {
          primaryColor: '#f97316',
          logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop',
        },
        isActive: true,
      });
      console.log(`  ✓ Created Organization: ${org.name} (${org.slug})`);
    } else {
      console.log(`  ✓ Found Existing Organization: ${org.name}`);
    }

    const orgId = org._id;

    // ── 2. Seed Departments & Users ──
    console.log('\n[2/7] Seeding Departments & Key Users...');
    const depts = [
      { name: 'Engineering', code: 'ENG' },
      { name: 'Product & Design', code: 'PRD' },
      { name: 'Sales & Growth', code: 'SLS' },
      { name: 'People Operations', code: 'PPL' },
    ];

    const deptDocs = {};
    for (const d of depts) {
      let dept = await Department.findOne({ organizationId: orgId, code: d.code });
      if (!dept) {
        dept = await Department.create({ organizationId: orgId, name: d.name, code: d.code });
      }
      deptDocs[d.code] = dept;
    }
    console.log(`  ✓ Seeded 4 Departments: ENG, PRD, SLS, PPL`);

    // Create Evaluators / Key Users
    const leadEvaluator = new mongoose.Types.ObjectId();
    const panelEvaluator = new mongoose.Types.ObjectId();
    const hiringManager = new mongoose.Types.ObjectId();

    // ── 3. Seed Scorecard Rubric Templates ──
    console.log('\n[3/7] Seeding Structured Scorecard Rubric Templates...');
    let template = await ScorecardTemplate.findOne({ organizationId: orgId, name: 'Principal Architecture Rubric' });
    if (!template) {
      template = await ScorecardTemplate.create({
        organizationId: orgId,
        name: 'Principal Architecture Rubric',
        department: 'Engineering',
        roleType: 'technical',
        competencies: [
          {
            name: 'Distributed Systems & Fault Tolerance',
            description: 'Assesses architectural mastery, consensus models, and failure modes',
            weight: 40,
            rubric: {
              1: 'Unfamiliar with distributed data consistency trade-offs',
              3: 'Understands sharding, caching, and basic failover patterns',
              5: 'Deep mastery of multi-region high availability, Raft/Paxos, and CAP theorem',
            },
          },
          {
            name: 'System Design & Scalability',
            description: 'High throughput API design, message queues, and async event loops',
            weight: 35,
            rubric: {
              1: 'Designs tightly coupled synchronous systems',
              3: 'Uses message brokers and background queues appropriately',
              5: 'Designs resilient event-driven architectures with backpressure & idempotency',
            },
          },
          {
            name: 'Engineering Leadership & Culture',
            description: 'Mentorship, code review rigor, and blameless retrospective mindset',
            weight: 25,
            rubric: {
              1: 'Isolated contributor with defensive posture to feedback',
              3: 'Good team player, conducts thorough code reviews',
              5: 'Empathetic technical leader, uplifts entire engineering culture',
            },
          },
        ],
        isDefault: true,
      });
      console.log(`  ✓ Created Scorecard Template: ${template.name}`);
    }

    // ── 4. Seed Requisitions & Job Openings ──
    console.log('\n[4/7] Seeding Headcount Requisitions & Job Openings...');
    let reqArch = await Requisition.findOne({ organizationId: orgId, reqCode: 'REQ-2026-ENG-001' });
    if (!reqArch) {
      reqArch = await Requisition.create({
        organizationId: orgId,
        reqCode: 'REQ-2026-ENG-001',
        title: 'Staff Distributed Systems Architect',
        departmentId: deptDocs['ENG']._id,
        employmentType: 'full_time',
        experienceLevel: 'senior',
        locationType: 'hybrid',
        location: 'San Francisco, CA / Remote',
        openPositions: 2,
        budget: { min: 160000, max: 200000, currency: 'USD' },
        reason: 'expansion',
        justification: 'Critical hire to scale distributed event backbone for high enterprise growth.',
        requestedBy: hiringManager,
        status: 'approved',
      });
    }

    let jobArch = await JobOpening.findOne({ organizationId: orgId, jobCode: 'JOB-2026-ENG-001' });
    if (!jobArch) {
      jobArch = await JobOpening.create({
        organizationId: orgId,
        jobCode: 'JOB-2026-ENG-001',
        title: 'Staff Distributed Systems Architect',
        departmentId: deptDocs['ENG']._id,
        department: 'Engineering',
        locationType: 'hybrid',
        location: 'San Francisco, CA',
        employmentType: 'full_time',
        experienceLevel: 'senior',
        salaryRange: { min: 160000, max: 200000, currency: 'USD' },
        skills: ['TypeScript', 'Node.js', 'Go', 'Distributed Systems', 'PostgreSQL', 'Kafka', 'Kubernetes'],
        description: 'Lead the next generation of Nebula Cloud Core distributed storage and message streaming engines.',
        status: 'published',
        openPositions: 2,
        filledPositions: 0,
        publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      });
      console.log(`  ✓ Published Job: ${jobArch.title} (${jobArch.jobCode})`);
    }

    let jobDesign = await JobOpening.findOne({ organizationId: orgId, jobCode: 'JOB-2026-PRD-001' });
    if (!jobDesign) {
      jobDesign = await JobOpening.create({
        organizationId: orgId,
        jobCode: 'JOB-2026-PRD-001',
        title: 'Senior Product Designer',
        departmentId: deptDocs['PRD']._id,
        department: 'Product & Design',
        locationType: 'remote',
        location: 'Remote, US',
        employmentType: 'full_time',
        experienceLevel: 'senior',
        salaryRange: { min: 130000, max: 165000, currency: 'USD' },
        skills: ['Figma', 'Design Systems', 'UX Research', 'Information Architecture', 'Prototyping'],
        description: 'Craft intuitive, enterprise-grade workflows and design tokens across all Nebula cloud modules.',
        status: 'published',
        openPositions: 1,
        filledPositions: 0,
        publishedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      });
      console.log(`  ✓ Published Job: ${jobDesign.title} (${jobDesign.jobCode})`);
    }

    // ── 5. Seed Candidate Pipeline across All 7 Stages ──
    console.log('\n[5/7] Seeding Candidate Pipeline across all 7 ATS Stages...');

    const candidateProfiles = [
      {
        candidateCode: 'CAN-SHOW-001',
        fullName: 'Sarah Connor',
        email: 'sarah.connor@nebula-demo.com',
        phone: '+1 415-555-0101',
        jobOpeningId: jobArch._id,
        stage: 'hired',
        source: 'linkedin',
        rating: 5,
        skills: ['Distributed Systems', 'Go', 'Kubernetes', 'High Throughput', 'PostgreSQL'],
        tags: ['top_performer', 'architect', 'verified'],
      },
      {
        candidateCode: 'CAN-SHOW-002',
        fullName: 'Marcus Wright',
        email: 'marcus.wright@nebula-demo.com',
        phone: '+1 415-555-0102',
        jobOpeningId: jobArch._id,
        stage: 'offer_sent',
        source: 'referral',
        rating: 4.8,
        skills: ['TypeScript', 'Node.js', 'Distributed Systems', 'Kafka', 'Redis'],
        tags: ['strong_culture_fit', 'offer_pending'],
      },
      {
        candidateCode: 'CAN-SHOW-003',
        fullName: 'Elena Rostova',
        email: 'elena.rostova@nebula-demo.com',
        phone: '+1 415-555-0103',
        jobOpeningId: jobArch._id,
        stage: 'hr_round',
        source: 'careers_page',
        rating: 4.5,
        skills: ['Node.js', 'Go', 'Microservices', 'AWS'],
        tags: ['leadership_material'],
      },
      {
        candidateCode: 'CAN-SHOW-004',
        fullName: 'David Chen',
        email: 'david.chen@nebula-demo.com',
        phone: '+1 415-555-0104',
        jobOpeningId: jobArch._id,
        stage: 'technical_assessment',
        source: 'recruiter_outreach',
        rating: 4.2,
        skills: ['Distributed Systems', 'Python', 'C++', 'Data Consistency'],
      },
      {
        candidateCode: 'CAN-SHOW-005',
        fullName: 'Aisha Patel',
        email: 'aisha.patel@nebula-demo.com',
        phone: '+1 415-555-0105',
        jobOpeningId: jobDesign._id,
        stage: 'interview_round_1',
        source: 'careers_page',
        rating: 4.0,
        skills: ['Figma', 'Design Systems', 'UX Research'],
      },
      {
        candidateCode: 'CAN-SHOW-006',
        fullName: 'Lucas Silva',
        email: 'lucas.silva@nebula-demo.com',
        phone: '+1 415-555-0106',
        jobOpeningId: jobDesign._id,
        stage: 'screening',
        source: 'job_portal',
        rating: 3.5,
        skills: ['Figma', 'Prototyping', 'UI/UX'],
      },
      {
        candidateCode: 'CAN-SHOW-007',
        fullName: 'Chloe Zhao',
        email: 'chloe.zhao@nebula-demo.com',
        phone: '+1 415-555-0107',
        jobOpeningId: jobDesign._id,
        stage: 'applied',
        source: 'careers_page',
        rating: 0,
        skills: ['Product Design', 'Visual Design'],
      },
      {
        candidateCode: 'CAN-SHOW-008',
        fullName: 'Ryan Reynolds',
        email: 'ryan.reynolds@nebula-demo.com',
        phone: '+1 415-555-0108',
        jobOpeningId: jobArch._id,
        stage: 'interview_round_2',
        source: 'referral',
        rating: 4.1,
        skills: ['Node.js', 'Distributed Systems', 'React'],
        tags: ['silver_medalist'],
      },
    ];

    const candMap = {};
    for (const c of candidateProfiles) {
      let cand = await Candidate.findOne({ organizationId: orgId, candidateCode: c.candidateCode });
      if (!cand) {
        cand = await Candidate.create({
          organizationId: orgId,
          ...c,
          appliedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        });
      }
      candMap[c.candidateCode] = cand;
    }
    console.log(`  ✓ Seeded 8 Candidates representing all pipeline stages.`);

    // ── 6. Seed Interviews, Scorecards & Offers ──
    console.log('\n[6/7] Seeding Multi-Panel Interviews, Sealed Scorecards & Offers...');

    // Interview for Marcus Wright
    let interviewMarcus = await Interview.findOne({ organizationId: orgId, candidateId: candMap['CAN-SHOW-002']._id });
    if (!interviewMarcus) {
      interviewMarcus = await Interview.create({
        organizationId: orgId,
        candidateId: candMap['CAN-SHOW-002']._id,
        jobOpeningId: jobArch._id,
        title: 'Round 2: Architecture Deep Dive & CAP Analysis',
        roundType: 'technical',
        interviewers: [leadEvaluator, panelEvaluator],
        scheduledStart: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        scheduledEnd: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 3600000),
        timezone: 'America/Los_Angeles',
        meetingPlatform: 'google_meet',
        meetingLink: 'https://meet.google.com/neb-arch-deep',
        status: 'completed',
      });

      // Submit Sealed Scorecard for Evaluator A
      await Scorecard.create({
        organizationId: orgId,
        interviewId: interviewMarcus._id,
        candidateId: candMap['CAN-SHOW-002']._id,
        jobOpeningId: jobArch._id,
        interviewerId: leadEvaluator,
        competencyRatings: [
          { name: 'Distributed Systems & Fault Tolerance', rating: 5, notes: 'Exceptional grasp of consensus algorithms and log replication' },
          { name: 'System Design & Scalability', rating: 5, notes: 'Clear understanding of backpressure, Kafka partitions, and dead letter queues' },
          { name: 'Engineering Leadership & Culture', rating: 4, notes: 'High empathy, blameless mindset' },
        ],
        overallRating: 5,
        recommendation: 'strong_hire',
        strengths: 'World-class distributed storage instincts; Clean, modular system decomposition',
        areasOfConcern: 'Notice period is 30 days',
        isSealed: true,
        sealedAt: new Date(),
      });
    }

    // Offer 1: Sarah Connor (Accepted, Signed & Employee Provisioned)
    let offerSarah = await JobOffer.findOne({ organizationId: orgId, candidateId: candMap['CAN-SHOW-001']._id });
    if (!offerSarah) {
      offerSarah = await JobOffer.create({
        organizationId: orgId,
        offerCode: 'OFF-SHOW-001',
        candidateId: candMap['CAN-SHOW-001']._id,
        jobOpeningId: jobArch._id,
        designation: 'Staff Distributed Systems Architect',
        departmentId: deptDocs['ENG']._id,
        offeredSalary: 190000,
        currency: 'USD',
        compensationBreakdown: {
          baseSalary: 150000,
          variableBonus: 20000,
          equity: { shares: 5000, estimatedValue: 20000, vestingSchedule: '4-year vesting with 1-year cliff' },
          totalCtc: 190000,
        },
        joiningDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'accepted',
        eSignature: {
          signToken: crypto.randomBytes(32).toString('hex'),
          signedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          signedIp: '198.51.100.42',
          signedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          signerName: 'Sarah Connor',
        },
      });

      // Transition to HRMS Employee using Onboarding Bridge
      await onboardingBridgeService.provisionEmployeeFromCandidate(candMap['CAN-SHOW-001']._id, offerSarah._id);
      console.log(`  ✓ Offer OFF-SHOW-001 accepted & Sarah Connor provisioned as active Employee in HRMS!`);
    }

    // Offer 2: Marcus Wright (Sent, Out-of-Band Escalation Approved, Live E-Sign Token Active)
    let offerMarcus = await JobOffer.findOne({ organizationId: orgId, candidateId: candMap['CAN-SHOW-002']._id });
    if (!offerMarcus) {
      const liveSignToken = 'demo-sign-marcus-wright-2026';
      offerMarcus = await JobOffer.create({
        organizationId: orgId,
        offerCode: 'OFF-SHOW-002',
        candidateId: candMap['CAN-SHOW-002']._id,
        jobOpeningId: jobArch._id,
        designation: 'Staff Distributed Systems Architect',
        departmentId: deptDocs['ENG']._id,
        offeredSalary: 205000,
        currency: 'USD',
        compensationBreakdown: {
          baseSalary: 160000,
          variableBonus: 25000,
          equity: { shares: 6000, estimatedValue: 20000 },
          totalCtc: 205000,
        },
        bandGovernance: {
          bandMin: 160000,
          bandMax: 200000,
          isDeviation: true,
          deviationPercent: 2.5,
          justification: 'Critical strategic talent acquisition. Exceeded band max by 2.5% to outbid competing FAANG offer.',
        },
        approvalChain: [
          { stepNumber: 1, role: 'recruiter', status: 'approved', actionedAt: new Date() },
          { stepNumber: 2, role: 'hiring_manager', status: 'approved', actionedAt: new Date() },
          { stepNumber: 3, role: 'finance_head', status: 'approved', comments: 'Budget exception authorized by CFO', actionedAt: new Date() },
          { stepNumber: 4, role: 'hr_director', status: 'approved', actionedAt: new Date() },
        ],
        joiningDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        validUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        status: 'sent',
        eSignature: {
          signToken: liveSignToken,
          tokenExpiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        },
      });
      console.log(`  ✓ Offer OFF-SHOW-002 created & sent. E-Sign URL: /offers/sign/${liveSignToken}`);
    }

    // ── 7. Seed Anonymous EEO Compliance Demographic Data ──
    console.log('\n[7/7] Seeding Anonymous EEO Demographic Records (Zero PII Linkage)...');
    const existingSurveys = await EeoSurvey.countDocuments({ organizationId: orgId });
    if (existingSurveys < 25) {
      // Benchmark: Male (12 applicants, 6 hires = 50% selection rate)
      for (let i = 0; i < 6; i++) {
        await EeoSurvey.create({ organizationId: orgId, gender: 'male', ethnicity: 'white', stageReached: 'hired' });
      }
      for (let i = 0; i < 6; i++) {
        await EeoSurvey.create({ organizationId: orgId, gender: 'male', ethnicity: 'white', stageReached: 'applied' });
      }

      // Comparison: Female (12 applicants, 4 hires = 33.3% selection rate -> Impact ratio 0.67 < 0.80 -> Disparity Alert!)
      for (let i = 0; i < 4; i++) {
        await EeoSurvey.create({ organizationId: orgId, gender: 'female', ethnicity: 'asian', stageReached: 'hired' });
      }
      for (let i = 0; i < 8; i++) {
        await EeoSurvey.create({ organizationId: orgId, gender: 'female', ethnicity: 'asian', stageReached: 'applied' });
      }

      // Non-binary & Veterans
      for (let i = 0; i < 4; i++) {
        await EeoSurvey.create({
          organizationId: orgId,
          gender: 'non_binary',
          ethnicity: 'two_or_more_races',
          veteranStatus: 'veteran',
          stageReached: 'applied',
        });
      }
      console.log(`  ✓ Seeded 28 Anonymous EEO survey records (Four-Fifths Diagnostic ready).`);
    }

    console.log('\n══════════════════════════════════════════════════════════════');
    console.log('   ENTERPRISE RECRUITMENT SHOWCASE SEEDED SUCCESSFULLY!     ');
    console.log('══════════════════════════════════════════════════════════════\n');
    console.log(`🔗 Careers Portal:    http://localhost:5173/careers/${showcaseSlug}`);
    console.log(`🔗 Demo Offer E-Sign:  http://localhost:5173/offers/sign/demo-sign-marcus-wright-2026`);
    console.log(`📊 ATS Dashboard:     http://localhost:5173/dashboard/recruitment`);
    console.log(`📈 Funnel Analytics:  http://localhost:5173/dashboard/recruitment/analytics`);
    console.log(`⚖️  EEO Compliance:    http://localhost:5173/dashboard/recruitment/compliance\n`);

  } catch (err) {
    console.error('Showcase Seeding Failed:', err);
  } finally {
    await mongoose.connection.close();
  }
}

if (require.main === module) {
  seedRecruitmentShowcase();
}

module.exports = seedRecruitmentShowcase;
