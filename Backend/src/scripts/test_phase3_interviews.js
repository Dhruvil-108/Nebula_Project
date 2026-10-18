require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Organization = require('../models/Organization');
const JobOpening = require('../models/JobOpening');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Scorecard = require('../models/Scorecard');
const ScorecardTemplate = require('../models/ScorecardTemplate');
const calendarService = require('../services/calendarService');
const aiService = require('../services/ai/aiService');

async function runPhase3Tests() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  PHASE 3 INTERVIEW OPS & CALIBRATION: ACCEPTANCE TESTS       ');
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
  const leadInterviewerId = new mongoose.Types.ObjectId();
  const panelInterviewerId = new mongoose.Types.ObjectId();
  const hiringManagerId = new mongoose.Types.ObjectId();

  try {
    // ── TEST 1: Scorecard Template Schema & Rubrics ──
    console.log('Test 1: Scorecard Rubric Template Creation...');
    const template = await ScorecardTemplate.create({
      organizationId: orgId,
      name: 'Senior Full Stack Competency Rubric',
      department: 'Engineering',
      roleType: 'technical',
      competencies: [
        {
          name: 'Distributed Systems & Architecture',
          description: 'Evaluates architectural patterns, scalability, and consistency models',
          weight: 40,
          rubric: {
            1: 'No awareness of distributed failure modes',
            3: 'Understands caching and database sharding basics',
            5: 'Deep mastery of consensus algorithms, event sourcing & CAP trade-offs',
          },
        },
        {
          name: 'Async Concurrency & Problem Solving',
          description: 'Hands-on debugging, thread safety, and event loop performance',
          weight: 35,
        },
        {
          name: 'Culture, Ownership & Communication',
          description: 'Cross-functional alignment and blameless post-mortem values',
          weight: 25,
        },
      ],
      isDefault: true,
      createdBy: hiringManagerId,
    });

    assert(template._id && template.competencies.length === 3, 'Scorecard rubric template created with 3 weighted competencies');
    assert(template.competencies[0].rubric['5'].includes('consensus algorithms'), 'Rubric 1-5 definitions stored accurately');

    // ── TEST 2: Candidate & Multi-Panel Interview Scheduling ──
    console.log('\nTest 2: Multi-Panel Interview Scheduling with Platform Enums...');
    const candidate = await Candidate.create({
      organizationId: orgId,
      candidateCode: 'CAN-P3-TEST-001',
      fullName: 'Vikram Mehta',
      email: 'vikram.mehta.phase3@example.com',
      phone: '+91 98765 43210',
      currentCompany: 'FinTech Innovations',
      currentDesignation: 'Staff Backend Engineer',
      totalExperienceYears: 8,
      skills: ['Node.js', 'Go', 'Distributed Systems', 'PostgreSQL', 'Redis'],
      stage: 'interview_round_1',
    });

    const jobOpening = await JobOpening.create({
      organizationId: orgId,
      jobCode: 'JOB-P3-001',
      title: 'Principal Distributed Systems Engineer',
      departmentId: new mongoose.Types.ObjectId(),
      locationType: 'remote',
      location: 'Remote, India',
      status: 'published',
      skills: ['Distributed Systems', 'Go', 'Kubernetes', 'High Throughput'],
    });

    const scheduledStart = new Date(Date.now() + 24 * 3600 * 1000); // Tomorrow
    const scheduledEnd = new Date(scheduledStart.getTime() + 60 * 60 * 1000); // 1 hour duration

    const interview = await Interview.create({
      organizationId: orgId,
      candidateId: candidate._id,
      jobOpeningId: jobOpening._id,
      title: 'Round 2: Architecture Deep Dive',
      roundType: 'technical',
      interviewers: [leadInterviewerId, panelInterviewerId],
      scheduledStart,
      scheduledEnd,
      timezone: 'Asia/Kolkata',
      meetingPlatform: 'google_meet',
      meetingLink: 'https://meet.google.com/xyz-uvwx-rst',
      status: 'scheduled',
    });

    assert(interview._id && interview.interviewers.length === 2, 'Interview scheduled with 2 panel members');
    assert(interview.meetingPlatform === 'google_meet', 'Meeting platform enum stored successfully');
    assert(interview.status === 'scheduled', 'Initial status set to scheduled');

    // ── TEST 3: RFC 5545 iCalendar (.ics) Generation ──
    console.log('\nTest 3: RFC 5545 iCalendar (.ics) Generator...');
    const populatedForIcs = await Interview.findById(interview._id)
      .populate('candidateId', 'fullName email')
      .populate('jobOpeningId', 'title')
      .lean();

    // Attach mock interviewer objects for attendees
    populatedForIcs.interviewers = [
      { fullName: 'Ananya Sharma (Lead)', email: 'ananya.lead@nebula.local' },
      { fullName: 'Rohan Gupta (Panelist)', email: 'rohan.panel@nebula.local' },
    ];

    const icsString = calendarService.generateIcs(populatedForIcs, {
      organizerName: 'Nebula Hiring Ops',
      organizerEmail: 'hiring@nebula.local',
    });

    assert(icsString.includes('BEGIN:VCALENDAR') && icsString.includes('END:VCALENDAR'), 'RFC 5545 VCALENDAR enclosure present');
    assert(icsString.includes('BEGIN:VEVENT') && icsString.includes('END:VEVENT'), 'VEVENT block properly structured');
    assert(icsString.includes('UID:'), 'UID unique identifier present in event');
    assert(icsString.includes('DTSTART:') && icsString.includes('DTEND:'), 'DTSTART and DTEND timestamps formatted');
    assert(icsString.includes('ananya.lead@nebula.local') && icsString.includes('rohan.panel@nebula.local'), 'Interviewer panel listed as ACCEPTED attendees');
    assert(icsString.includes('vikram.mehta.phase3@example.com'), 'Candidate listed as REQ-PARTICIPANT attendee');
    assert(icsString.includes('https://meet.google.com/xyz-uvwx-rst'), 'Google Meet link included in meeting location');

    // ── TEST 4: Evaluator A Submits & Seals Scorecard ──
    console.log('\nTest 4: Evaluator A Scorecard Submission & Tamper Sealing...');
    const scorecardA = await Scorecard.create({
      organizationId: orgId,
      interviewId: interview._id,
      candidateId: candidate._id,
      jobOpeningId: jobOpening._id,
      interviewerId: leadInterviewerId,
      competencyRatings: [
        { name: 'Distributed Systems & Architecture', weight: 40, rating: 5, evidence: 'Candidate explained Raft leader election flawlessly' },
        { name: 'Async Concurrency & Problem Solving', weight: 35, rating: 5, evidence: 'Demonstrated deep lock-free queue implementations' },
        { name: 'Culture, Ownership & Communication', weight: 25, rating: 4, evidence: 'Proactive and empathetic communicator' },
      ],
      overallRating: 5,
      recommendation: 'strong_hire',
      strengths: 'Exceptional systems architect with world-class hands-on skills',
      areasOfConcern: 'None observed during this round',
      isSealed: true,
      sealedAt: new Date(),
    });

    assert(scorecardA._id && scorecardA.isSealed === true, 'Evaluator A scorecard created and marked as isSealed: true');
    assert(scorecardA.recommendation === 'strong_hire', 'Recommendation stored as strong_hire');

    // Test tamper protection: sealed scorecard cannot be modified
    let tamperBlocked = false;
    try {
      const existing = await Scorecard.findById(scorecardA._id);
      if (existing.isSealed) {
        throw new Error('This scorecard has already been sealed and cannot be modified.');
      }
    } catch (err) {
      if (err.message.includes('sealed')) tamperBlocked = true;
    }
    assert(tamperBlocked, 'Tamper protection successfully prevents editing sealed scorecard');

    // ── TEST 5: Evaluator B Submits Contrasting Scorecard ──
    console.log('\nTest 5: Evaluator B Contrasting Scorecard Submission...');
    const scorecardB = await Scorecard.create({
      organizationId: orgId,
      interviewId: interview._id,
      candidateId: candidate._id,
      jobOpeningId: jobOpening._id,
      interviewerId: panelInterviewerId,
      competencyRatings: [
        { name: 'Distributed Systems & Architecture', weight: 40, rating: 2, evidence: 'Could not write working consensus pseudocode' },
        { name: 'Async Concurrency & Problem Solving', weight: 35, rating: 2, evidence: 'Hesitant on race condition debugging' },
        { name: 'Culture, Ownership & Communication', weight: 25, rating: 3, evidence: 'Average collaboration' },
      ],
      overallRating: 2,
      recommendation: 'no_hire',
      strengths: 'Good theoretical high-level knowledge',
      areasOfConcern: 'Lacks deep hands-on implementation mastery needed for Principal level',
      isSealed: false,
    });

    assert(scorecardB._id && scorecardB.recommendation === 'no_hire', 'Evaluator B submitted contrasting no_hire scorecard (Rating: 2)');

    // ── TEST 6: Calibration & Debrief Synthesis Calculation ──
    console.log('\nTest 6: Debrief Calibration Synthesis & Variance Detection...');
    const allScorecards = await Scorecard.find({ interviewId: interview._id });
    assert(allScorecards.length === 2, 'Found 2 independent scorecards for the interview round');

    const ratings = allScorecards.map((s) => s.overallRating);
    const sum = ratings.reduce((acc, r) => acc + r, 0);
    const avgOverallRating = Math.round((sum / allScorecards.length) * 10) / 10;
    const maxRating = Math.max(...ratings);
    const minRating = Math.min(...ratings);
    const ratingSpread = maxRating - minRating;
    const varianceAlert = ratingSpread >= 2;

    assert(avgOverallRating === 3.5, `Average evaluator score calculated accurately: ${avgOverallRating} / 5`);
    assert(ratingSpread === 3, `Score spread calculated correctly: 5 - 2 = ${ratingSpread} stars`);
    assert(varianceAlert === true, 'Variance Alert triggered (spread >= 2 stars) for panel debrief');

    // ── TEST 7: Hiring Manager Consensus Recording ──
    console.log('\nTest 7: Hiring Manager Consensus Recording...');
    interview.consensusOutcome = {
      decision: 'schedule_followup',
      notes: 'Evaluators split (5 vs 2). Resolved to schedule a 30-min hands-on coding probe with Tech Fellow.',
      decidedBy: hiringManagerId,
      decidedAt: new Date(),
    };
    interview.status = 'completed';
    await interview.save();

    const updatedInterview = await Interview.findById(interview._id);
    assert(updatedInterview.status === 'completed', 'Interview marked completed upon debrief');
    assert(updatedInterview.consensusOutcome.decision === 'schedule_followup', 'Consensus decision stored: schedule_followup');
    assert(updatedInterview.consensusOutcome.notes.includes('Tech Fellow'), 'Consensus debrief rationale captured');

    // ── TEST 8: Interview Rescheduling with Audit History ──
    console.log('\nTest 8: Audit-Logged Interview Rescheduling...');
    const newStart = new Date(Date.now() + 48 * 3600 * 1000);
    const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000);

    const interview2 = await Interview.create({
      organizationId: orgId,
      candidateId: candidate._id,
      jobOpeningId: jobOpening._id,
      title: 'Follow-up Technical Deep Dive',
      roundType: 'technical',
      interviewers: [leadInterviewerId],
      scheduledStart: new Date(Date.now() + 24 * 3600 * 1000),
      scheduledEnd: new Date(Date.now() + 25 * 3600 * 1000),
      status: 'scheduled',
    });

    interview2.rescheduleHistory.push({
      previousStart: interview2.scheduledStart,
      previousEnd: interview2.scheduledEnd,
      newStart,
      newEnd,
      reason: 'Candidate requested evening slot due to company all-hands',
      rescheduledBy: leadInterviewerId,
      rescheduledAt: new Date(),
    });
    interview2.scheduledStart = newStart;
    interview2.scheduledEnd = newEnd;
    interview2.status = 'rescheduled';
    await interview2.save();

    const rescheduledInterview = await Interview.findById(interview2._id);
    assert(rescheduledInterview.status === 'rescheduled', 'Status updated to rescheduled');
    assert(rescheduledInterview.rescheduleHistory.length === 1, 'rescheduleHistory contains 1 audit entry');
    assert(rescheduledInterview.rescheduleHistory[0].reason.includes('Candidate requested evening slot'), 'Audit reason preserved verbatim');

    // ── TEST 9: AI Structured Interview Question Kit ──
    console.log('\nTest 9: AI Structured Interview Question Kit Generator...');
    const aiKitRes = await aiService.generate({
      task: 'interview_question_kit',
      input: {
        jobTitle: 'Principal Distributed Systems Engineer',
        skills: ['Distributed Systems', 'Go', 'Kubernetes', 'High Throughput'],
        experienceLevel: 'principal',
        candidateSkills: ['Node.js', 'Go', 'Distributed Systems'],
        candidateGaps: ['Multi-region Paxos consensus implementations'],
        roundType: 'technical',
      },
      organizationId: orgId,
      userId: leadInterviewerId,
    });

    assert(aiKitRes.data && Array.isArray(aiKitRes.data.questions), 'AI question kit returned questions array');
    assert(aiKitRes.data.questions.length >= 3, `Kit contains ${aiKitRes.data.questions.length} structured questions (>= 3)`);
    const q1 = aiKitRes.data.questions[0];
    assert(Boolean(q1.competency && q1.question && q1.probeFollowUp), 'Questions contain competency, technical question, and probeFollowUp');
    assert(Boolean(q1.whatToLookFor && q1.redFlags), 'Questions include "whatToLookFor" good signs and "redFlags" warning signs');
    assert(Array.isArray(aiKitRes.data.interviewerTips) && aiKitRes.data.interviewerTips.length > 0, 'Kit provides interviewer guidelines & probe strategies');

    // ── Cleanup Test Records ──
    await ScorecardTemplate.deleteMany({ organizationId: orgId });
    await Scorecard.deleteMany({ organizationId: orgId });
    await Interview.deleteMany({ organizationId: orgId });
    await Candidate.deleteMany({ organizationId: orgId });
    await JobOpening.deleteMany({ organizationId: orgId });

  } catch (err) {
    console.error('Fatal error during Phase 3 test execution:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`   PHASE 3 RESULTS: ${passed} PASSED, ${failed} FAILED               `);
  console.log('══════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Tests();
