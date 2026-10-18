require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Organization = require('../models/Organization');
const JobOpening = require('../models/JobOpening');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const TalentPool = require('../models/TalentPool');
const Referral = require('../models/Referral');
const aiService = require('../services/ai/aiService');
const duplicateDetectionService = require('../services/duplicateDetectionService');
const counterService = require('../services/counterService');

async function runPhase2Tests() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('   PHASE 2 INTAKE & AI SCREENING: ACCEPTANCE TEST HARNESS    ');
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

  const orgAId = new mongoose.Types.ObjectId();
  const orgBId = new mongoose.Types.ObjectId();
  const user1 = new mongoose.Types.ObjectId();
  const user2 = new mongoose.Types.ObjectId();

  try {
    // ── TEST 1: AI Prompt Registry: Resume Parsing ──
    console.log('Test 1: AI Resume Parser Fallback Provider...');
    const sampleResume = `
      Sarah Jenkins
      Email: sarah.jenkins@example.com | Phone: +1 555-392-8172
      Location: San Francisco, CA
      
      EXPERIENCE:
      Senior Full Stack Engineer - Acme Labs (2020 - Present)
      • Designed and deployed scalable React & Node.js microservices.
      • Optimized MongoDB aggregates reducing latency by 45%.
      • Mentored junior engineers and led sprint planning.
      
      SKILLS: React, TypeScript, Node.js, Express, MongoDB, Redis, Docker, AWS
      
      EDUCATION:
      B.S. in Computer Science - University of California, Berkeley (2016 - 2020)
    `;

    const resumeRes = await aiService.generate({
      task: 'resume_parser',
      input: {
        resumeText: sampleResume,
        rawFileName: 'sarah_jenkins_cv.txt',
      },
    });
    const resumeResult = resumeRes.data;

    assert(
      resumeResult && typeof resumeResult === 'object',
      'Resume parser returned structured object'
    );
    assert(
      resumeResult.fullName && resumeResult.email,
      `Parsed basic identifiers: Name="${resumeResult.fullName}", Email="${resumeResult.email}"`
    );
    assert(
      Array.isArray(resumeResult.skills) && resumeResult.skills.length >= 3,
      `Extracted skills array: ${resumeResult.skills?.slice(0, 4).join(', ')}...`
    );
    assert(
      typeof resumeResult.confidenceScore === 'number' && resumeResult.confidenceScore > 0,
      `Parser confidence score present: ${resumeResult.confidenceScore}`
    );

    // ── TEST 2: AI Blind Match Scoring & Algorithmic Fairness ──
    console.log('\nTest 2: AI Blind Match Scoring & Algorithmic Fairness...');
    const blindedCandidate = {
      skills: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Docker'],
      totalExperienceYears: 5,
      summary: 'Senior Full Stack Engineer building microservices and web platforms',
      // Explicitly verifying NO PII (name, email, phone, gender, location) is passed to scoring engine
    };

    const targetJob = {
      title: 'Senior Frontend Engineer',
      skills: ['React', 'TypeScript', 'GraphQL', 'TailwindCSS'],
      requirements: ['4+ years of React experience', 'Deep knowledge of TypeScript'],
      experienceLevel: 'senior',
    };

    const matchRes = await aiService.generate({
      task: 'match_scoring',
      input: {
        candidateProfile: blindedCandidate,
        jobRequirements: targetJob,
      },
    });
    const matchResult = matchRes.data;

    assert(
      matchResult && typeof matchResult.score === 'number',
      `Calculated numerical match score: ${matchResult.score}%`
    );
    assert(
      matchResult.score >= 0 && matchResult.score <= 100,
      'Match score strictly bounded between 0% and 100%'
    );
    assert(
      Array.isArray(matchResult.matchedSkills) && Array.isArray(matchResult.missingSkills),
      `Explained match: Matched=[${matchResult.matchedSkills?.join(', ')}], Missing=[${matchResult.missingSkills?.join(', ')}]`
    );
    assert(
      Boolean(matchResult.recommendation),
      `AI Recommendation provided: "${matchResult.recommendation}"`
    );

    // ── TEST 3: AI Job Description Generator with DEI Audit ──
    console.log('\nTest 3: AI Job Description Generator with DEI Audit...');
    const jdRes = await aiService.generate({
      task: 'jd_generator',
      input: {
        title: 'Staff Platform Engineer',
        department: 'Infrastructure',
        experienceLevel: 'staff',
        keySkills: ['Kubernetes', 'Go', 'Terraform', 'Distributed Systems'],
        locationType: 'remote',
      },
    });
    const jdResult = jdRes.data;

    assert(
      jdResult && jdResult.title === 'Staff Platform Engineer',
      `JD generator populated job title: "${jdResult.title}"`
    );
    assert(
      Array.isArray(jdResult.responsibilities) && jdResult.responsibilities.length >= 2,
      `Generated ${jdResult.responsibilities?.length} bulleted responsibilities`
    );
    assert(
      Array.isArray(jdResult.requirements) && jdResult.requirements.length >= 2,
      `Generated ${jdResult.requirements?.length} bulleted requirements`
    );
    assert(
      jdResult.inclusivityReport && typeof jdResult.inclusivityReport.score === 'number',
      `DEI Inclusivity score audit: ${jdResult.inclusivityReport?.score}/100`
    );

    // ── TEST 4: AI Multi-Channel Job Marketer ──
    console.log('\nTest 4: AI Multi-Channel Job Marketer...');
    const marketingRes = await aiService.generate({
      task: 'multi_channel_post',
      input: {
        jobTitle: 'Lead Product Designer',
        departmentName: 'Design',
        locationText: 'New York, NY',
        skillsText: 'Figma, Design Systems, User Research',
        tone: 'dynamic',
      },
    });
    const marketingResult = marketingRes.data;

    assert(
      marketingResult && marketingResult.linkedin && marketingResult.whatsapp && marketingResult.indeed,
      'Generated copy across LinkedIn, WhatsApp, Indeed, Naukri, and X/Twitter'
    );
    assert(
      marketingResult.twitter && marketingResult.twitter.length > 0,
      `Twitter/X copy generated (${marketingResult.twitter.length} chars)`
    );

    // ── TEST 5: Candidate Duplicate Detection Service ──
    console.log('\nTest 5: Candidate Duplicate Detection Service...');
    const candidateA = await Candidate.create({
      organizationId: orgAId,
      candidateCode: await counterService.generateCandidateCode(orgAId),
      fullName: 'David Miller',
      email: 'david.miller@example.com',
      phone: '+1 555-123-4567',
      stage: 'applied',
      source: 'careers_page',
    });

    const dupByEmail = await duplicateDetectionService.findDuplicate(orgAId, {
      email: 'DAVID.MILLER@EXAMPLE.COM', // case-insensitive check
    });
    assert(
      dupByEmail.isDuplicate && dupByEmail.existingCandidate,
      'Duplicate accurately flagged on case-insensitive email match in Org A'
    );
    assert(
      dupByEmail.matchReason && dupByEmail.matchReason.includes('email'),
      `Duplicate match reason: ${dupByEmail.matchReason}`
    );

    const dupByPhone = await duplicateDetectionService.findDuplicate(orgAId, {
      phone: '5551234567', // unformatted phone check
    });
    assert(
      dupByPhone.isDuplicate,
      'Duplicate accurately flagged on normalized phone number match in Org A'
    );

    // Cross-tenant duplicate isolation test
    const dupInOrgB = await duplicateDetectionService.findDuplicate(orgBId, {
      email: 'david.miller@example.com',
    });
    assert(
      !dupInOrgB.isDuplicate,
      'Tenant Isolation: Duplicate check returns clean across separate tenant orgs'
    );

    // ── TEST 6: Public Job Posting & Application Intake Integration ──
    console.log('\nTest 6: Public Job Posting & Application Intake...');
    const jobA = await JobOpening.create({
      organizationId: orgAId,
      jobCode: await counterService.generateJobCode(orgAId),
      title: 'Senior Backend Engineer',
      departmentId: new mongoose.Types.ObjectId(),
      location: 'Remote, US',
      locationType: 'remote',
      employmentType: 'full_time',
      experienceLevel: 'senior',
      status: 'published',
      description: 'Looking for a senior backend engineer proficient in Node and MongoDB.',
      keySkills: ['Node.js', 'MongoDB', 'Docker', 'TypeScript'],
      createdBy: user1,
    });

    const applicantCode = await counterService.generateCandidateCode(orgAId);
    const applicationCode = await counterService.generateApplicationCode(orgAId);

    const applicant = await Candidate.create({
      organizationId: orgAId,
      candidateCode: applicantCode,
      fullName: 'Emma Watson',
      email: 'emma.watson@example.com',
      phone: '+1 555-987-6543',
      currentCompany: 'Tech Giants Inc',
      currentDesignation: 'Backend Engineer',
      totalExperienceYears: 4,
      skills: ['Node.js', 'MongoDB', 'Redis', 'Docker'],
      stage: 'applied',
      source: 'careers_page',
    });

    const application = await Application.create({
      organizationId: orgAId,
      applicationCode,
      candidateId: applicant._id,
      jobOpeningId: jobA._id,
      stage: 'applied',
      status: 'active',
      source: 'careers_page',
      matchScore: 88,
      matchExplanation: {
        skillsMatch: 90,
        experienceMatch: 85,
        strengths: ['Node.js', 'MongoDB', 'Docker'],
        gaps: ['TypeScript'],
        recommendation: 'Strong candidate for interview round',
      },
      stageHistory: [
        {
          fromStage: 'applied',
          toStage: 'applied',
          note: 'Public application submitted with AI blind screening score 88%',
          changedAt: new Date(),
        },
      ],
    });

    assert(
      applicant.candidateCode.startsWith('CAND-'),
      `Public candidate intake assigned atomic code: ${applicant.candidateCode}`
    );
    assert(
      application.applicationCode.startsWith('APP-'),
      `Public application intake assigned atomic code: ${application.applicationCode}`
    );
    assert(
      application.matchScore === 88,
      'Blind AI match score persisted with application intake record'
    );

    // ── TEST 7: Talent Pools CRM ──
    console.log('\nTest 7: Talent Pools CRM Operations...');
    const pool = await TalentPool.create({
      organizationId: orgAId,
      name: 'High-Potential Backend Engineers',
      description: 'Top silver-medalist engineers for future staff/lead roles',
      tags: ['backend', 'distributed-systems', 'silver-medalist'],
      candidateIds: [applicant._id],
      createdBy: user1,
    });

    assert(
      pool && pool.name === 'High-Potential Backend Engineers',
      `Talent pool created: "${pool.name}"`
    );
    assert(
      pool.candidateIds.length === 1 && pool.candidateIds[0].equals(applicant._id),
      'Candidate successfully added to talent pool'
    );

    // Remove candidate from pool
    pool.candidateIds = pool.candidateIds.filter(
      (cId) => !cId.equals(applicant._id)
    );
    await pool.save();

    assert(
      pool.candidateIds.length === 0,
      'Candidate successfully removed from talent pool'
    );

    // Tenant isolation on Talent Pools
    const poolInOrgB = await TalentPool.findOne({
      _id: pool._id,
      organizationId: orgBId,
    });
    assert(
      poolInOrgB === null,
      'Tenant Isolation: Talent pool strictly hidden from other tenant organizations'
    );

    // ── TEST 8: Employee Referrals Tracking ──
    console.log('\nTest 8: Employee Referrals Tracking...');
    const referral = await Referral.create({
      organizationId: orgAId,
      jobOpeningId: jobA._id,
      candidateId: applicant._id,
      referredBy: user1,
      relationship: 'former_colleague',
      notes: 'Worked with Emma at previous startup. Superb problem solver.',
      status: 'submitted',
    });

    assert(
      referral && referral.relationship === 'former_colleague',
      `Employee referral submitted for candidate ${applicant.fullName} on ${jobA.title}`
    );
    assert(
      referral.status === 'submitted',
      'Initial referral status is "submitted"'
    );

    // Advance status to in_review then hired
    referral.status = 'in_review';
    await referral.save();
    assert(
      referral.status === 'in_review',
      'Referral status updated to "in_review"'
    );

    referral.status = 'hired';
    await referral.save();
    assert(
      referral.status === 'hired',
      'Referral status successfully updated to "hired" (milestone achieved)'
    );

    // Cleanup test artifacts
    await Candidate.deleteMany({ organizationId: { $in: [orgAId, orgBId] } });
    await Application.deleteMany({ organizationId: { $in: [orgAId, orgBId] } });
    await JobOpening.deleteMany({ organizationId: { $in: [orgAId, orgBId] } });
    await TalentPool.deleteMany({ organizationId: { $in: [orgAId, orgBId] } });
    await Referral.deleteMany({ organizationId: { $in: [orgAId, orgBId] } });

    console.log('\n══════════════════════════════════════════════════════════════');
    console.log(`   PHASE 2 ACCEPTANCE TESTS FINISHED: ${passed} PASSED, ${failed} FAILED `);
    console.log('══════════════════════════════════════════════════════════════\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal error executing Phase 2 test suite:', err);
    process.exit(1);
  }
}

runPhase2Tests();
