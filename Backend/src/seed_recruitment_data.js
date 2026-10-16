/**
 * Seed realistic Recruitment (ATS) data for Nebula Hub.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Organization = require('./models/Organization');
const User = require('./models/User');
const Department = require('./models/Department');
const Employee = require('./models/Employee');
const JobOpening = require('./models/JobOpening');
const Candidate = require('./models/Candidate');
const Interview = require('./models/Interview');
const JobOffer = require('./models/JobOffer');
const RecruitmentActivity = require('./models/RecruitmentActivity');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nebula';

async function seedRecruitment() {
  console.log('Connecting to MongoDB at:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  // Find target organization (first active org or by name)
  let org = await Organization.findOne({ isActive: true });
  if (!org) {
    org = await Organization.findOne();
  }
  if (!org) {
    console.error('No organization found to seed recruitment data.');
    process.exit(1);
  }

  const orgId = org._id;
  console.log(`Target Organization: ${org.name} (${orgId})`);

  // Find users for hiring managers / recruiters / interviewers
  const users = await User.find({ organizationId: orgId }).limit(10);
  const adminUser = users.find((u) => u.role === 'super_admin' || u.role === 'admin') || users[0];
  const hrUser = users.find((u) => u.role === 'hr' || u.role === 'recruiter') || adminUser;

  // Find departments
  let departments = await Department.find({ organizationId: orgId });
  if (departments.length === 0) {
    console.log('Creating default departments...');
    const eng = await Department.create({ organizationId: orgId, name: 'Engineering', code: 'ENG' });
    const prod = await Department.create({ organizationId: orgId, name: 'Product & Design', code: 'PROD' });
    const sales = await Department.create({ organizationId: orgId, name: 'Sales & Marketing', code: 'SALES' });
    departments = [eng, prod, sales];
  }

  const engDept = departments.find((d) => /eng/i.test(d.name)) || departments[0];
  const prodDept = departments.find((d) => /prod/i.test(d.name)) || departments[1] || departments[0];
  const salesDept = departments.find((d) => /sales/i.test(d.name)) || departments[2] || departments[0];

  // Clean existing recruitment demo data for this org
  console.log('Clearing existing recruitment records for clean seed...');
  await JobOpening.deleteMany({ organizationId: orgId });
  await Candidate.deleteMany({ organizationId: orgId });
  await Interview.deleteMany({ organizationId: orgId });
  await JobOffer.deleteMany({ organizationId: orgId });
  await RecruitmentActivity.deleteMany({ organizationId: orgId });

  // 1. Create Job Openings
  console.log('Creating Job Openings...');
  const jobsData = [
    {
      organizationId: orgId,
      jobCode: 'JOB-2026-001',
      title: 'Senior Full-Stack Engineer (React & Node)',
      departmentId: engDept._id,
      locationType: 'hybrid',
      location: 'San Francisco, CA',
      employmentType: 'full_time',
      experienceLevel: 'senior',
      salaryRange: { min: 140000, max: 185000, currency: 'USD', isPublic: true },
      openPositions: 2,
      filledPositions: 0,
      status: 'published',
      hiringManagerId: adminUser._id,
      assignedRecruiters: [hrUser._id],
      description: 'Lead architecture of high-throughput web apps and microservices using React, TypeScript, and Node.js.',
      skills: ['React', 'TypeScript', 'Node.js', 'MongoDB', 'Docker', 'GraphQL'],
      publishedAt: new Date(Date.now() - 14 * 86400000),
    },
    {
      organizationId: orgId,
      jobCode: 'JOB-2026-002',
      title: 'Staff Platform & Cloud Architect',
      departmentId: engDept._id,
      locationType: 'remote',
      location: 'Remote (US/EU)',
      employmentType: 'full_time',
      experienceLevel: 'lead',
      salaryRange: { min: 175000, max: 220000, currency: 'USD', isPublic: true },
      openPositions: 1,
      filledPositions: 0,
      status: 'published',
      hiringManagerId: adminUser._id,
      assignedRecruiters: [hrUser._id],
      description: 'Scale our Kubernetes cloud infrastructure, enhance observability, and lead automated CI/CD pipelines.',
      skills: ['Kubernetes', 'AWS', 'Terraform', 'Golang', 'CI/CD', 'Prometheus'],
      publishedAt: new Date(Date.now() - 10 * 86400000),
    },
    {
      organizationId: orgId,
      jobCode: 'JOB-2026-003',
      title: 'Lead Product Designer (UI/UX)',
      departmentId: prodDept._id,
      locationType: 'hybrid',
      location: 'Austin, TX',
      employmentType: 'full_time',
      experienceLevel: 'lead',
      salaryRange: { min: 130000, max: 165000, currency: 'USD', isPublic: true },
      openPositions: 1,
      filledPositions: 0,
      status: 'published',
      hiringManagerId: adminUser._id,
      assignedRecruiters: [hrUser._id],
      description: 'Define the design system, intuitive workflows, and responsive micro-interactions for the Nebula platform.',
      skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping', 'CSS3', 'Accessibility'],
      publishedAt: new Date(Date.now() - 8 * 86400000),
    },
    {
      organizationId: orgId,
      jobCode: 'JOB-2026-004',
      title: 'Enterprise Account Executive',
      departmentId: salesDept._id,
      locationType: 'on_site',
      location: 'New York, NY',
      employmentType: 'full_time',
      experienceLevel: 'mid',
      salaryRange: { min: 95000, max: 130000, currency: 'USD', isPublic: true },
      openPositions: 2,
      filledPositions: 1,
      status: 'published',
      hiringManagerId: adminUser._id,
      assignedRecruiters: [hrUser._id],
      description: 'Drive outbound pipeline, conduct product demonstrations, and close high-value B2B enterprise SaaS contracts.',
      skills: ['B2B SaaS', 'Outbound Sales', 'Salesforce', 'Negotiation', 'CRM'],
      publishedAt: new Date(Date.now() - 20 * 86400000),
    },
  ];

  const jobs = await JobOpening.create(jobsData);
  console.log(`Created ${jobs.length} job openings.`);

  const [jobEng, jobCloud, jobDesign, jobSales] = jobs;

  // 2. Create Candidates across ATS stages
  console.log('Creating Candidates across ATS pipeline stages...');
  const candidatesData = [
    {
      organizationId: orgId,
      candidateCode: 'CAND-2026-0001',
      jobOpeningId: jobEng._id,
      fullName: 'Alex Vance',
      email: 'alex.vance@example.com',
      phone: '+1 (415) 890-1234',
      currentCompany: 'Linear Labs',
      currentDesignation: 'Senior Frontend Engineer',
      totalExperienceYears: 6,
      skills: ['React', 'TypeScript', 'Tailwind', 'Next.js', 'Redux'],
      expectedSalary: 160000,
      noticePeriodDays: 30,
      source: 'linkedin',
      stage: 'interview_round_2',
      rating: 4.5,
      tags: ['Top Talent', 'Frontend Lead'],
      notes: 'Strong design sensibility and deep understanding of modern React 19 / TanStack.',
      stageHistory: [
        { fromStage: 'applied', toStage: 'screening', changedAt: new Date(Date.now() - 6 * 86400000) },
        { fromStage: 'screening', toStage: 'interview_round_1', changedAt: new Date(Date.now() - 4 * 86400000) },
        { fromStage: 'interview_round_1', toStage: 'interview_round_2', changedAt: new Date(Date.now() - 1 * 86400000) },
      ],
    },
    {
      organizationId: orgId,
      candidateCode: 'CAND-2026-0002',
      jobOpeningId: jobEng._id,
      fullName: 'Marcus Brody',
      email: 'marcus.brody@example.com',
      phone: '+1 (512) 345-6789',
      currentCompany: 'Shopify',
      currentDesignation: 'Full Stack Developer',
      totalExperienceYears: 4,
      skills: ['Node.js', 'React', 'PostgreSQL', 'Docker'],
      expectedSalary: 145000,
      noticePeriodDays: 15,
      source: 'referral',
      stage: 'offer_sent',
      rating: 4.8,
      tags: ['Offer Pending', 'Culture Fit'],
      notes: 'Exceptional system design and problem-solving interview round.',
      stageHistory: [
        { fromStage: 'applied', toStage: 'screening', changedAt: new Date(Date.now() - 12 * 86400000) },
        { fromStage: 'screening', toStage: 'interview_round_1', changedAt: new Date(Date.now() - 9 * 86400000) },
        { fromStage: 'interview_round_1', toStage: 'technical_assessment', changedAt: new Date(Date.now() - 5 * 86400000) },
        { fromStage: 'technical_assessment', toStage: 'offer_sent', changedAt: new Date(Date.now() - 2 * 86400000) },
      ],
    },
    {
      organizationId: orgId,
      candidateCode: 'CAND-2026-0003',
      jobOpeningId: jobCloud._id,
      fullName: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      phone: '+1 (206) 555-7890',
      currentCompany: 'Datadog',
      currentDesignation: 'Site Reliability Engineer II',
      totalExperienceYears: 7,
      skills: ['Kubernetes', 'Golang', 'Terraform', 'Prometheus', 'AWS'],
      expectedSalary: 195000,
      noticePeriodDays: 45,
      source: 'recruiter_outreach',
      stage: 'technical_assessment',
      rating: 4.2,
      tags: ['Infra Specialist'],
      notes: 'Deep Kubernetes internals and multi-region failover experience.',
    },
    {
      organizationId: orgId,
      candidateCode: 'CAND-2026-0004',
      jobOpeningId: jobDesign._id,
      fullName: 'Chloe Bennett',
      email: 'chloe.design@example.com',
      phone: '+1 (310) 777-8899',
      currentCompany: 'Figma Agency',
      currentDesignation: 'Senior Product Designer',
      totalExperienceYears: 5,
      skills: ['Figma', 'Design Systems', 'Micro-interactions', 'User Journey Mapping'],
      expectedSalary: 140000,
      noticePeriodDays: 30,
      source: 'careers_page',
      stage: 'interview_round_1',
      rating: 4.0,
      tags: ['Portfolio Wow'],
      notes: 'Stunning design portfolio showcasing responsive B2B dashboards.',
    },
    {
      organizationId: orgId,
      candidateCode: 'CAND-2026-0005',
      jobOpeningId: jobEng._id,
      fullName: 'Devon Miller',
      email: 'devon.miller@example.com',
      phone: '+1 (650) 432-1098',
      currentCompany: 'Twilio',
      currentDesignation: 'Software Engineer',
      totalExperienceYears: 3,
      skills: ['TypeScript', 'Express', 'React', 'MongoDB'],
      expectedSalary: 130000,
      noticePeriodDays: 30,
      source: 'careers_page',
      stage: 'screening',
      rating: 3.5,
      tags: ['Promising Junior'],
    },
    {
      organizationId: orgId,
      candidateCode: 'CAND-2026-0006',
      jobOpeningId: jobSales._id,
      fullName: 'Jordan Taylor',
      email: 'jordan.taylor@example.com',
      phone: '+1 (212) 888-9900',
      currentCompany: 'HubSpot',
      currentDesignation: 'Senior Account Executive',
      totalExperienceYears: 5,
      skills: ['Enterprise SaaS', 'B2B Sales', 'Prospecting', 'Demos'],
      expectedSalary: 125000,
      noticePeriodDays: 14,
      source: 'job_portal',
      stage: 'applied',
      rating: 0,
      tags: ['New Application'],
    },
  ];

  const candidates = await Candidate.create(candidatesData);
  console.log(`Created ${candidates.length} candidates.`);

  const [candAlex, candMarcus, candElena, candChloe, candDevon, candJordan] = candidates;

  // 3. Create Scheduled & Completed Interviews
  console.log('Creating Interviews & Scorecards...');
  const interviewsData = [
    {
      organizationId: orgId,
      candidateId: candAlex._id,
      jobOpeningId: jobEng._id,
      title: 'Round 1: Problem Solving & Architecture',
      roundType: 'technical',
      interviewers: [adminUser._id],
      scheduledStart: new Date(Date.now() - 3 * 86400000),
      scheduledEnd: new Date(Date.now() - 3 * 86400000 + 3600000),
      meetingLink: 'https://meet.google.com/xyz-nebula-tech',
      status: 'completed',
      scorecard: {
        rating: 5,
        decision: 'strong_hire',
        technicalSkillScore: 5,
        communicationScore: 4,
        cultureFitScore: 5,
        notes: 'Demonstrated mastery of distributed state synchronization and optimistic UI rendering.',
        submittedBy: adminUser._id,
        submittedAt: new Date(Date.now() - 3 * 86400000 + 4000000),
      },
    },
    {
      organizationId: orgId,
      candidateId: candAlex._id,
      jobOpeningId: jobEng._id,
      title: 'Round 2: System Scalability & Microservices',
      roundType: 'technical',
      interviewers: [adminUser._id],
      scheduledStart: new Date(Date.now() + 2 * 86400000 + 14 * 3600000), // In 2 days
      scheduledEnd: new Date(Date.now() + 2 * 86400000 + 15 * 3600000),
      meetingLink: 'https://meet.google.com/abc-nebula-arch',
      status: 'scheduled',
    },
    {
      organizationId: orgId,
      candidateId: candChloe._id,
      jobOpeningId: jobDesign._id,
      title: 'Design System & UI Craft Interview',
      roundType: 'culture_fit',
      interviewers: [hrUser._id],
      scheduledStart: new Date(Date.now() + 1 * 86400000 + 10 * 3600000), // Tomorrow 10am
      scheduledEnd: new Date(Date.now() + 1 * 86400000 + 11 * 3600000),
      meetingLink: 'https://meet.google.com/des-nebula-figma',
      status: 'scheduled',
    },
  ];

  await Interview.create(interviewsData);
  console.log('Created Interviews.');

  // 4. Create Job Offer for Marcus Brody
  console.log('Creating Job Offer...');
  const joiningDate = new Date();
  joiningDate.setDate(joiningDate.getDate() + 25);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 7);

  const offer = await JobOffer.create({
    organizationId: orgId,
    offerCode: 'OFF-2026-001',
    candidateId: candMarcus._id,
    jobOpeningId: jobEng._id,
    designation: 'Senior Full-Stack Engineer',
    departmentId: engDept._id,
    offeredSalary: 155000,
    currency: 'USD',
    joiningDate,
    validUntil,
    status: 'sent',
    benefits: ['Comprehensive Medical, Dental & Vision', '401(k) 5% Match', 'Annual $3,000 Learning Budget', 'Flexible Work Setup'],
    notes: 'Welcome package including MacBook Pro M3 Max and 4K displays.',
    approvedBy: adminUser._id,
    sentAt: new Date(Date.now() - 2 * 86400000),
  });
  console.log(`Created Job Offer ${offer.offerCode}.`);

  // 5. Create Activity Trail
  console.log('Creating Recruitment Activities...');
  await RecruitmentActivity.create([
    {
      organizationId: orgId,
      candidateId: candAlex._id,
      jobOpeningId: jobEng._id,
      type: 'stage_change',
      title: 'Candidate Advanced to Interview R2',
      description: 'Alex Vance cleared Round 1 with Strong Hire recommendation.',
      performedBy: adminUser._id,
    },
    {
      organizationId: orgId,
      candidateId: candMarcus._id,
      jobOpeningId: jobEng._id,
      type: 'offer_created',
      title: 'Job Offer OFF-2026-001 Issued',
      description: 'Offer sent to Marcus Brody ($155,000 USD / year).',
      performedBy: hrUser._id,
    },
    {
      organizationId: orgId,
      jobOpeningId: jobEng._id,
      type: 'note_added',
      title: 'New Job Opening Published',
      description: 'Senior Full-Stack Engineer (React & Node) opened for 2 headcounts.',
      performedBy: adminUser._id,
    },
  ]);

  console.log('✅ Recruitment Module seeding completed successfully!');
  await mongoose.disconnect();
}

seedRecruitment().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
