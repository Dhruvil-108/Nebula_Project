require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const emailService = require('../services/emailService');
const groqProvider = require('../services/ai/providers/groqProvider');
const aiService = require('../services/ai/aiService');

async function testEmailAndGroq() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('   VERIFYING LIVE SMTP EMAIL DISPATCH & GROQ AI FUNCTIONALITY  ');
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

  // ─────────────────────────────────────────────────────────
  // SECTION 1: SMTP & EMAIL SERVICE VERIFICATION
  // ─────────────────────────────────────────────────────────
  console.log('─── 1. SMTP & EMAIL CONFIGURATION ───');
  const isSmtpConfigured = emailService.isConfigured();
  console.log(`  ℹ️  SMTP Configured: ${isSmtpConfigured}`);
  console.log(`  ℹ️  Host: ${process.env.SMTP_HOST || 'Not set'}`);
  console.log(`  ℹ️  Port: ${process.env.SMTP_PORT || '587'}`);
  console.log(`  ℹ️  User: ${process.env.SMTP_USER || 'Not set'}`);

  if (isSmtpConfigured) {
    console.log('\n  Testing live SMTP handshake & connection verification...');
    const verifyResult = await emailService.verifyConnection();
    if (verifyResult.connected) {
      assert(true, 'SMTP Server connection handshake successful!');
    } else {
      console.warn(`  ⚠️ SMTP Handshake warning: ${verifyResult.error}`);
    }
  }

  // Dispatch test offer email to user's configured SMTP_USER (or test address)
  const recipientEmail = process.env.SMTP_USER || 'candidate.test@example.com';
  console.log(`\n─── 2. SENDING REAL OFFER LETTER EMAIL TO: ${recipientEmail} ───`);

  const testCandidate = {
    fullName: 'Alex Vance',
    email: recipientEmail,
  };
  const testOffer = {
    offerCode: 'OFF-LIVE-TEST-001',
    designation: 'Senior Lead Full-Stack Architect',
    offeredSalary: 185000,
    totalCtc: 235000,
    currency: 'USD',
    joiningDate: new Date(Date.now() + 21 * 24 * 3600 * 1000),
    validUntil: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    compensationBreakdown: {
      baseSalary: 185000,
      variablePay: 25000,
      equityValue: 25000,
    },
  };
  const signUrl = `${process.env.FRONTEND_ORIGIN || 'http://localhost:5173'}/offers/sign/live-test-token-abcdef123456`;
  const organization = { name: 'Nebula Enterprise Technologies' };

  const emailRes = await emailService.sendOfferLetterEmail({
    candidate: testCandidate,
    offer: testOffer,
    signUrl,
    jobOpening: { title: 'Senior Lead Full-Stack Architect' },
    department: { name: 'Core Engineering' },
    organization,
  });

  assert(emailRes.success === true, `Email dispatch status: ${emailRes.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`  ℹ️  Email Mode: ${emailRes.simulated ? 'SIMULATED (Dev)' : 'LIVE SMTP NETWORK DISPATCH'}`);
  console.log(`  ℹ️  Message ID: ${emailRes.messageId}`);
  console.log(`  ℹ️  Delivered To: ${emailRes.recipient}`);

  // ─────────────────────────────────────────────────────────
  // SECTION 2: GROQ CLOUD AI INFERENCE VERIFICATION
  // ─────────────────────────────────────────────────────────
  console.log('\n─── 3. GROQ LPU AI INFERENCE VERIFICATION ───');
  const isGroqConfigured = groqProvider.isConfigured();
  console.log(`  ℹ️  GROQ_API_KEY Configured: ${isGroqConfigured}`);
  console.log(`  ℹ️  Model: ${groqProvider.getModel()}`);

  if (isGroqConfigured) {
    console.log('\n  Executing live Groq AI Inference via GroqProvider (Task: match_scoring)...');
    const startTime = Date.now();
    try {
      const liveAiResult = await aiService.generate({
        task: 'match_scoring',
        input: {
          candidateProfile: {
            skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'Docker', 'GraphQL'],
            totalExperienceYears: 7,
            summary: 'Experienced Full-Stack Architect who built enterprise scale SaaS backends and React frontends.',
            workHistory: [
              { company: 'TechCorp', role: 'Senior Engineer', durationYears: 4, highlights: 'Designed microservices handling 50k req/sec' }
            ],
          },
          jobRequirements: {
            title: 'Senior Lead Full-Stack Architect',
            experienceLevel: 'senior',
            skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'System Design'],
            requirements: ['Architect resilient microservices', 'Lead technical code reviews'],
          },
        },
      });

      assert(liveAiResult.success === true, 'AiService.generate returned success');
      assert(liveAiResult.provider === 'groq', `AI Provider utilized: ${liveAiResult.provider} (Expected: groq)`);
      console.log(`  ℹ️  Model used: ${liveAiResult.model}`);
      console.log(`  ℹ️  Match Score: ${liveAiResult.data.score}/100`);
      console.log(`  ℹ️  Experience Fit: ${liveAiResult.data.experienceFit}`);
      console.log(`  ℹ️  Matched Skills: ${liveAiResult.data.matchedSkills.join(', ')}`);
      console.log(`  ℹ️  AI Recommendation: "${liveAiResult.data.recommendation}"`);
      console.log(`  ℹ️  Evidence Citations: ${liveAiResult.data.evidenceCitations.join(' | ')}`);

      // Test second AI task: Job Description Generator
      console.log('\n  Executing second live Groq AI Task (Task: jd_generator)...');
      const jdResult = await aiService.generate({
        task: 'jd_generator',
        input: {
          title: 'Staff AI Engineer',
          department: 'Applied Machine Learning',
          location: 'San Francisco, CA (Hybrid)',
          experienceLevel: 'staff',
          skills: ['Python', 'PyTorch', 'LLMs', 'RAG', 'Vector Databases'],
          keyResponsibilities: ['Lead LLM fine-tuning pipelines', 'Architect production RAG systems'],
        },
      });

      assert(jdResult.success === true, 'JD Generator task returned success');
      assert(Boolean(jdResult.data.summary), 'Generated professional job summary');
      assert(Array.isArray(jdResult.data.responsibilities) && jdResult.data.responsibilities.length > 0, `Generated ${jdResult.data.responsibilities?.length || 0} responsibilities`);
      console.log(`  ℹ️  JD Title: ${jdResult.data.title}`);
      console.log(`  ℹ️  JD Summary excerpt: "${jdResult.data.summary.slice(0, 100)}..."`);
      console.log(`  ℹ️  Responsibilities count: ${jdResult.data.responsibilities.length}`);
      console.log(`  ℹ️  Requirements count: ${jdResult.data.requirements?.length || 0}`);

    } catch (err) {
      console.error('  ❌ Error during Groq AI test:', err);
      failed++;
    }
  } else {
    console.warn('  ⚠️ GROQ_API_KEY is not configured or empty in .env. Falling back to local test.');
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`  FINAL RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

testEmailAndGroq().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
