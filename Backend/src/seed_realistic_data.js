/**
 * Seed realistic CRM & HRMS data for PVF Pvt Ltd.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Organization = require('./models/Organization');
const User = require('./models/User');
const Department = require('./models/Department');
const Employee = require('./models/Employee');
const EmployeeDocument = require('./models/EmployeeDocument');
const Company = require('./models/Company');
const Contact = require('./models/Contact');
const Lead = require('./models/Lead');
const Deal = require('./models/Deal');
const Activity = require('./models/Activity');
const LeaveType = require('./models/LeaveType');
const LeaveBalance = require('./models/LeaveBalance');
const LeaveRequest = require('./models/LeaveRequest');
const AttendanceRecord = require('./models/AttendanceRecord');
const { DEFAULT_LEAVE_TYPES, getDayMidnightUtc } = require('./utils/attendanceUtils');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nebula';

async function seed() {
  console.log('Connecting to MongoDB at:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  // 1. Locate organization: PVF Pvt Ltd.
  let org = await Organization.findOne({ name: /PVF Pvt Ltd/i });
  if (!org) {
    org = await Organization.findById('6a93d26c288d67183bc1dbb1');
  }
  if (!org) {
    console.error('Organization PVF Pvt Ltd not found!');
    process.exit(1);
  }
  const orgId = org._id;
  console.log(`Target Organization: ${org.name} (${orgId})`);

  // 2. Locate or create Users
  const passwordHash = await bcrypt.hash('Password@123', 10);

  // Existing Users:
  // Dhruvil Soni (super_admin)
  // Darshana Jigar Soni (hr)
  // Rudra Shukla (admin)
  // Sahil Shukla (employee)
  let dhruvil = await User.findOne({ organizationId: orgId, email: 'd24cs108@charusat.edu.in' });
  let darshana = await User.findOne({ organizationId: orgId, email: 'da20@gmail.com' });
  let rudra = await User.findOne({ organizationId: orgId, email: 'd24cs121@charusat.edu.in' });
  let sahil = await User.findOne({ organizationId: orgId, email: 'sahilshukla@gmail.com' });

  // Additional realistic team members
  const teamMembers = [
    { fullName: 'Aisha Patel', email: 'aisha.patel@pvf.com', role: 'manager' },
    { fullName: 'Vikram Malhotra', email: 'vikram.m@pvf.com', role: 'employee' },
    { fullName: 'Priya Sharma', email: 'priya.sharma@pvf.com', role: 'employee' },
    { fullName: 'Rohan Mehta', email: 'rohan.mehta@pvf.com', role: 'employee' },
    { fullName: 'Ananya Iyer', email: 'ananya.iyer@pvf.com', role: 'employee' },
    { fullName: 'Kavin Desai', email: 'kavin.desai@pvf.com', role: 'employee' },
  ];

  const additionalUsers = {};
  for (const tm of teamMembers) {
    let u = await User.findOne({ organizationId: orgId, email: tm.email });
    if (!u) {
      u = await User.create({
        fullName: tm.fullName,
        email: tm.email,
        passwordHash,
        role: tm.role,
        organizationId: orgId,
        status: 'active',
      });
      console.log(`Created user: ${tm.fullName} (${tm.email})`);
    }
    additionalUsers[tm.email] = u;
  }

  const allUsers = {
    dhruvil,
    darshana,
    rudra,
    sahil,
    aisha: additionalUsers['aisha.patel@pvf.com'],
    vikram: additionalUsers['vikram.m@pvf.com'],
    priya: additionalUsers['priya.sharma@pvf.com'],
    rohan: additionalUsers['rohan.mehta@pvf.com'],
    ananya: additionalUsers['ananya.iyer@pvf.com'],
    kavin: additionalUsers['kavin.desai@pvf.com'],
  };

  // 3. Seed / Ensure Departments
  console.log('Seeding departments...');
  const deptConfigs = [
    { name: 'Engineering', description: 'Core software architecture, cloud platforms, AI engines, and frontend systems.' },
    { name: 'Product & Design', description: 'User experience research, interaction design, product roadmap, and feature discovery.' },
    { name: 'Sales & Marketing', description: 'B2B enterprise sales, account expansion, inbound campaigns, and strategic partnerships.' },
    { name: 'Human Resources', description: 'People operations, organizational culture, benefits administration, and talent acquisition.' },
    { name: 'Operations & Finance', description: 'Corporate governance, accounting, financial planning, and cross-functional operations.' },
  ];

  const deptMap = {};
  for (const dc of deptConfigs) {
    let d = await Department.findOne({ organizationId: orgId, name: dc.name });
    if (!d) {
      d = await Department.create({
        organizationId: orgId,
        name: dc.name,
        description: dc.description,
      });
      console.log(`Created department: ${dc.name}`);
    } else {
      d.description = dc.description;
      await d.save();
    }
    deptMap[dc.name] = d;
  }

  // 4. Seed Employees
  console.log('Seeding employees...');
  const empDefinitions = [
    {
      code: 'PVF-ENG-001',
      user: allUsers.dhruvil,
      fullName: 'Dhruvil Soni',
      email: allUsers.dhruvil?.email || 'd24cs108@charusat.edu.in',
      phone: '+91 98250 14501',
      dept: 'Engineering',
      designation: 'Chief Technology Officer',
      joiningDate: new Date('2024-01-15'),
      type: 'full_time',
      status: 'active',
      skills: ['System Architecture', 'Node.js', 'React', 'MongoDB', 'Cloud Infrastructure'],
    },
    {
      code: 'PVF-OPS-001',
      user: allUsers.rudra,
      fullName: 'Rudra Shukla',
      email: allUsers.rudra?.email || 'd24cs121@charusat.edu.in',
      phone: '+91 97241 88302',
      dept: 'Operations & Finance',
      designation: 'VP of Business Operations',
      joiningDate: new Date('2024-02-01'),
      type: 'full_time',
      status: 'active',
      skills: ['Operations Management', 'Vendor Relations', 'Process Automation', 'Compliance'],
    },
    {
      code: 'PVF-HR-001',
      user: allUsers.darshana,
      fullName: 'Darshana Jigar Soni',
      email: allUsers.darshana?.email || 'da20@gmail.com',
      phone: '+91 94280 33119',
      dept: 'Human Resources',
      designation: 'Head of People & Culture',
      joiningDate: new Date('2024-02-15'),
      type: 'full_time',
      status: 'active',
      skills: ['Talent Acquisition', 'HR Strategy', 'Conflict Resolution', 'Employee Experience'],
    },
    {
      code: 'PVF-DES-001',
      user: allUsers.aisha,
      fullName: 'Aisha Patel',
      email: 'aisha.patel@pvf.com',
      phone: '+91 98980 44211',
      dept: 'Product & Design',
      designation: 'Lead Product Designer',
      joiningDate: new Date('2024-04-10'),
      type: 'full_time',
      status: 'active',
      skills: ['Figma', 'Design Systems', 'UX Research', 'Prototyping', 'Accessibility'],
    },
    {
      code: 'PVF-SLS-001',
      user: allUsers.vikram,
      fullName: 'Vikram Malhotra',
      email: 'vikram.m@pvf.com',
      phone: '+91 97120 55432',
      dept: 'Sales & Marketing',
      designation: 'Enterprise Sales Director',
      joiningDate: new Date('2024-03-01'),
      type: 'full_time',
      status: 'active',
      skills: ['Enterprise Sales', 'Negotiation', 'CRM', 'Pipeline Management', 'Account Strategy'],
    },
    {
      code: 'PVF-ENG-002',
      user: allUsers.sahil,
      fullName: 'Sahil Shukla',
      email: allUsers.sahil?.email || 'sahilshukla@gmail.com',
      phone: '+91 99090 77123',
      dept: 'Engineering',
      designation: 'Senior Full-Stack Engineer',
      joiningDate: new Date('2024-05-01'),
      type: 'full_time',
      status: 'active',
      skills: ['TypeScript', 'Express.js', 'React.js', 'PostgreSQL', 'Docker'],
    },
    {
      code: 'PVF-ENG-003',
      user: allUsers.rohan,
      fullName: 'Rohan Mehta',
      email: 'rohan.mehta@pvf.com',
      phone: '+91 98790 66541',
      dept: 'Engineering',
      designation: 'Cloud Infrastructure & DevOps Engineer',
      joiningDate: new Date('2024-06-15'),
      type: 'full_time',
      status: 'active',
      skills: ['AWS', 'Kubernetes', 'CI/CD Pipelines', 'Terraform', 'Prometheus'],
    },
    {
      code: 'PVF-SLS-002',
      user: allUsers.priya,
      fullName: 'Priya Sharma',
      email: 'priya.sharma@pvf.com',
      phone: '+91 96380 22345',
      dept: 'Sales & Marketing',
      designation: 'Customer Success & Account Manager',
      joiningDate: new Date('2024-07-01'),
      type: 'full_time',
      status: 'active',
      skills: ['Client Onboarding', 'Customer Success', 'Contract Renewals', 'HubSpot'],
    },
    {
      code: 'PVF-OPS-002',
      user: allUsers.ananya,
      fullName: 'Ananya Iyer',
      email: 'ananya.iyer@pvf.com',
      phone: '+91 95580 99876',
      dept: 'Operations & Finance',
      designation: 'Financial Controller',
      joiningDate: new Date('2024-08-01'),
      type: 'full_time',
      status: 'active',
      skills: ['Financial Modeling', 'Budgeting', 'Tax Compliance', 'Cost Analysis'],
    },
    {
      code: 'PVF-ENG-004',
      user: allUsers.kavin,
      fullName: 'Kavin Desai',
      email: 'kavin.desai@pvf.com',
      phone: '+91 94080 11982',
      dept: 'Engineering',
      designation: 'Frontend UI/UX Engineer',
      joiningDate: new Date('2025-01-10'),
      type: 'full_time',
      status: 'active',
      skills: ['React', 'Tailwind CSS', 'Framer Motion', 'Next.js', 'Storybook'],
    },
  ];

  const empMap = {};
  for (const def of empDefinitions) {
    let emp = await Employee.findOne({ organizationId: orgId, employeeCode: def.code });
    const payload = {
      organizationId: orgId,
      userId: def.user?._id || null,
      employeeCode: def.code,
      fullName: def.fullName,
      email: def.email,
      phone: def.phone,
      departmentId: deptMap[def.dept]?._id || null,
      designation: def.designation,
      joiningDate: def.joiningDate,
      employmentType: def.type,
      status: def.status,
      skills: def.skills,
    };

    if (!emp) {
      emp = await Employee.create(payload);
      console.log(`Created employee: ${emp.fullName} (${emp.employeeCode})`);
    } else {
      Object.assign(emp, payload);
      await emp.save();
    }
    empMap[def.code] = emp;
  }

  // Set managers
  if (empMap['PVF-ENG-002']) { empMap['PVF-ENG-002'].managerId = empMap['PVF-ENG-001']?._id; await empMap['PVF-ENG-002'].save(); }
  if (empMap['PVF-ENG-003']) { empMap['PVF-ENG-003'].managerId = empMap['PVF-ENG-001']?._id; await empMap['PVF-ENG-003'].save(); }
  if (empMap['PVF-ENG-004']) { empMap['PVF-ENG-004'].managerId = empMap['PVF-ENG-001']?._id; await empMap['PVF-ENG-004'].save(); }
  if (empMap['PVF-SLS-002']) { empMap['PVF-SLS-002'].managerId = empMap['PVF-SLS-001']?._id; await empMap['PVF-SLS-002'].save(); }
  if (empMap['PVF-OPS-002']) { empMap['PVF-OPS-002'].managerId = empMap['PVF-OPS-001']?._id; await empMap['PVF-OPS-002'].save(); }

  // Set department heads
  if (deptMap['Engineering'] && empMap['PVF-ENG-001']) { deptMap['Engineering'].headId = empMap['PVF-ENG-001']._id; await deptMap['Engineering'].save(); }
  if (deptMap['Human Resources'] && empMap['PVF-HR-001']) { deptMap['Human Resources'].headId = empMap['PVF-HR-001']._id; await deptMap['Human Resources'].save(); }
  if (deptMap['Operations & Finance'] && empMap['PVF-OPS-001']) { deptMap['Operations & Finance'].headId = empMap['PVF-OPS-001']._id; await deptMap['Operations & Finance'].save(); }
  if (deptMap['Product & Design'] && empMap['PVF-DES-001']) { deptMap['Product & Design'].headId = empMap['PVF-DES-001']._id; await deptMap['Product & Design'].save(); }
  if (deptMap['Sales & Marketing'] && empMap['PVF-SLS-001']) { deptMap['Sales & Marketing'].headId = empMap['PVF-SLS-001']._id; await deptMap['Sales & Marketing'].save(); }

  // 5. Seed Employee Documents
  console.log('Seeding employee documents...');
  await EmployeeDocument.deleteMany({ organizationId: orgId });
  const hrUploader = allUsers.darshana?._id || allUsers.dhruvil._id;
  const docSamples = [
    { empCode: 'PVF-ENG-001', docType: 'contract', fileName: 'Executive_Employment_Agreement_2024.pdf', fileUrl: 'https://example.com/docs/PVF_Exec_Dhruvil.pdf' },
    { empCode: 'PVF-ENG-001', docType: 'id_proof', fileName: 'Passport_Verification_Copy.pdf', fileUrl: 'https://example.com/docs/Passport_Dhruvil.pdf' },
    { empCode: 'PVF-HR-001', docType: 'offer_letter', fileName: 'Offer_Letter_Head_of_People.pdf', fileUrl: 'https://example.com/docs/Offer_Darshana.pdf' },
    { empCode: 'PVF-HR-001', docType: 'certificate', fileName: 'SHRM_Senior_Certified_Professional.pdf', fileUrl: 'https://example.com/docs/SHRM_Darshana.pdf' },
    { empCode: 'PVF-OPS-001', docType: 'contract', fileName: 'Corporate_Operations_Director_Agreement.pdf', fileUrl: 'https://example.com/docs/Contract_Rudra.pdf' },
    { empCode: 'PVF-ENG-002', docType: 'offer_letter', fileName: 'Offer_Letter_Senior_Engineer.pdf', fileUrl: 'https://example.com/docs/Offer_Sahil.pdf' },
    { empCode: 'PVF-ENG-002', docType: 'certificate', fileName: 'AWS_Solutions_Architect_Associate.pdf', fileUrl: 'https://example.com/docs/AWS_Cert_Sahil.pdf' },
    { empCode: 'PVF-DES-001', docType: 'contract', fileName: 'Product_Design_Lead_Contract.pdf', fileUrl: 'https://example.com/docs/Contract_Aisha.pdf' },
    { empCode: 'PVF-SLS-001', docType: 'contract', fileName: 'Enterprise_Sales_Director_Compensation_Plan.pdf', fileUrl: 'https://example.com/docs/CompPlan_Vikram.pdf' },
    { empCode: 'PVF-ENG-003', docType: 'certificate', fileName: 'Certified_Kubernetes_Administrator_CKA.pdf', fileUrl: 'https://example.com/docs/CKA_Rohan.pdf' },
    { empCode: 'PVF-SLS-002', docType: 'offer_letter', fileName: 'Customer_Success_Lead_Offer_Letter.pdf', fileUrl: 'https://example.com/docs/Offer_Priya.pdf' },
    { empCode: 'PVF-OPS-002', docType: 'certificate', fileName: 'Chartered_Financial_Analyst_CFA.pdf', fileUrl: 'https://example.com/docs/CFA_Ananya.pdf' },
    { empCode: 'PVF-OPS-002', docType: 'contract', fileName: 'Financial_Controller_Employment_Contract.pdf', fileUrl: 'https://example.com/docs/Contract_Ananya.pdf' },
    { empCode: 'PVF-ENG-004', docType: 'offer_letter', fileName: 'Frontend_Engineer_Offer_Letter.pdf', fileUrl: 'https://example.com/docs/Offer_Kavin.pdf' },
    { empCode: 'PVF-ENG-004', docType: 'certificate', fileName: 'Meta_Frontend_Developer_Specialization.pdf', fileUrl: 'https://example.com/docs/Meta_Frontend_Kavin.pdf' },
  ];

  for (const ds of docSamples) {
    const e = empMap[ds.empCode];
    if (e) {
      await EmployeeDocument.create({
        organizationId: orgId,
        employeeId: e._id,
        docType: ds.docType,
        fileName: ds.fileName,
        fileUrl: ds.fileUrl,
        uploadedBy: hrUploader,
      });
    }
  }

  // 6. Seed Companies
  console.log('Seeding companies...');
  const companiesData = [
    {
      name: 'Apex Financial Global',
      industry: 'Financial Services',
      website: 'https://apexfinancial.io',
      phone: '+1 (617) 555-0192',
      address: '100 Federal Street, Suite 2400, Boston, MA 02110',
    },
    {
      name: 'CloudScale Infrastructure',
      industry: 'Cloud & SaaS',
      website: 'https://cloudscale.tech',
      phone: '+1 (415) 555-8391',
      address: '425 Market Street, 18th Floor, San Francisco, CA 94105',
    },
    {
      name: 'Meridian Logistics & Supply',
      industry: 'Logistics & Supply Chain',
      website: 'https://meridianlogistics.com',
      phone: '+1 (312) 555-7740',
      address: '233 S Wacker Dr, Suite 5200, Chicago, IL 60606',
    },
    {
      name: 'Nexus Retail Technologies',
      industry: 'Retail & E-commerce',
      website: 'https://nexusretail.com',
      phone: '+1 (212) 555-3490',
      address: '350 5th Ave, 44th Floor, New York, NY 10118',
    },
    {
      name: 'Horizon Healthcare Systems',
      industry: 'Healthcare & Lifesciences',
      website: 'https://horizonhealth.org',
      phone: '+1 (512) 555-6612',
      address: '500 W 2nd St, Suite 1900, Austin, TX 78701',
    },
    {
      name: 'Vertex BioTech Solutions',
      industry: 'Biotechnology',
      website: 'https://vertexbiotech.com',
      phone: '+1 (617) 555-9011',
      address: '50 Hampshire St, 5th Floor, Cambridge, MA 02139',
    },
  ];

  const companyMap = {};
  for (const cd of companiesData) {
    let comp = await Company.findOne({ organizationId: orgId, name: cd.name });
    if (!comp) {
      comp = await Company.create({ organizationId: orgId, ...cd });
      console.log(`Created company: ${cd.name}`);
    } else {
      Object.assign(comp, cd);
      await comp.save();
    }
    companyMap[cd.name] = comp;
  }

  // 7. Seed Contacts
  console.log('Seeding contacts...');
  const contactsData = [
    {
      fullName: 'Marcus Vance',
      email: 'm.vance@apexfinancial.io',
      phone: '+1 (617) 555-1001',
      company: 'Apex Financial Global',
      title: 'Chief Information Officer',
      owner: allUsers.dhruvil._id,
    },
    {
      fullName: 'Kenneth Bradley',
      email: 'kbradley@apexfinancial.io',
      phone: '+1 (617) 555-1004',
      company: 'Apex Financial Global',
      title: 'Director of Vendor Procurement',
      owner: allUsers.vikram._id,
    },
    {
      fullName: 'Elena Rostova',
      email: 'elena.r@cloudscale.tech',
      phone: '+1 (415) 555-8302',
      company: 'CloudScale Infrastructure',
      title: 'VP of Platform Engineering',
      owner: allUsers.dhruvil._id,
    },
    {
      fullName: 'Sophia Martinez',
      email: 'smartinez@cloudscale.tech',
      phone: '+1 (415) 555-8309',
      company: 'CloudScale Infrastructure',
      title: 'Senior Product Operations Director',
      owner: allUsers.priya._id,
    },
    {
      fullName: 'David Chen',
      email: 'd.chen@meridianlogistics.com',
      phone: '+1 (312) 555-7788',
      company: 'Meridian Logistics & Supply',
      title: 'VP of Supply Chain Automation',
      owner: allUsers.vikram._id,
    },
    {
      fullName: 'Sarah Jenkins',
      email: 'sjenkins@nexusretail.com',
      phone: '+1 (212) 555-3412',
      company: 'Nexus Retail Technologies',
      title: 'Chief Digital Officer',
      owner: allUsers.vikram._id,
    },
    {
      fullName: 'Dr. Robert Sterling',
      email: 'rsterling@horizonhealth.org',
      phone: '+1 (512) 555-6680',
      company: 'Horizon Healthcare Systems',
      title: 'Chief Information Security Officer',
      owner: allUsers.rudra._id,
    },
    {
      fullName: 'Amara Okafor',
      email: 'a.okafor@vertexbiotech.com',
      phone: '+1 (617) 555-9055',
      company: 'Vertex BioTech Solutions',
      title: 'Head of Clinical Data Systems',
      owner: allUsers.dhruvil._id,
    },
  ];

  const contactMap = {};
  for (const c of contactsData) {
    let cont = await Contact.findOne({ organizationId: orgId, email: c.email });
    const payload = {
      organizationId: orgId,
      fullName: c.fullName,
      email: c.email,
      phone: c.phone,
      companyId: companyMap[c.company]?._id || null,
      title: c.title,
      owner: c.owner,
    };
    if (!cont) {
      cont = await Contact.create(payload);
      console.log(`Created contact: ${c.fullName} (${c.title})`);
    } else {
      Object.assign(cont, payload);
      await cont.save();
    }
    contactMap[c.fullName] = cont;
  }

  // 8. Seed Leads
  console.log('Seeding leads...');
  await Lead.deleteMany({ organizationId: orgId });
  const leadsData = [
    {
      leadName: 'Arthur Pendelton',
      company: 'Vanguard Cyber Systems',
      email: 'arthur.p@vanguardcyber.com',
      phone: '+1 (202) 555-0144',
      source: 'website',
      industry: 'Cybersecurity',
      status: 'new',
      owner: allUsers.vikram._id,
      notes: 'Inbounded through website demo request form; requested enterprise security briefing.',
    },
    {
      leadName: 'Claire Beauchamp',
      company: 'Montague Capital Partners',
      email: 'c.beauchamp@montaguecap.com',
      phone: '+1 (212) 555-0182',
      source: 'referral',
      industry: 'Private Equity',
      status: 'new',
      owner: allUsers.dhruvil._id,
      notes: 'Referred by Apex CIO Marcus Vance. Looking for portfolio-wide ops dashboard.',
    },
    {
      leadName: 'Devon Larson',
      company: 'Starlight Media Group',
      email: 'dlarson@starlightmedia.com',
      phone: '+1 (310) 555-0199',
      source: 'social',
      industry: 'Entertainment & Media',
      status: 'contacted',
      owner: allUsers.vikram._id,
      notes: 'Initial discovery call conducted on Zoom. Need multi-tenant project spaces.',
    },
    {
      leadName: 'Grace Hopper-Lee',
      company: 'Aether Robotics',
      email: 'grace@aetherrobotics.ai',
      phone: '+1 (415) 555-0176',
      source: 'event',
      industry: 'Robotics & Hardware',
      status: 'contacted',
      owner: allUsers.priya._id,
      notes: 'Met at SaaStr Annual conference booth. Needs hardware inventory & field technician module.',
    },
    {
      leadName: 'Tariq Al-Mansoor',
      company: 'Emirates Logistic Systems',
      email: 't.almansoor@emirateslogistics.ae',
      phone: '+971 4 555 1290',
      source: 'website',
      industry: 'Logistics',
      status: 'qualified',
      owner: allUsers.rudra._id,
      notes: 'Budget confirmed at $120k ARR. Evaluation committee consists of 4 directors.',
    },
    {
      leadName: 'Siddharth Rao',
      company: 'Zenith Payments India',
      email: 'siddharth@zenithpay.in',
      phone: '+91 80 4120 8899',
      source: 'referral',
      industry: 'FinTech',
      status: 'qualified',
      owner: allUsers.dhruvil._id,
      notes: 'High-growth fintech unicorn in Bangalore. Scaling from 200 to 800 seats.',
    },
    {
      leadName: 'Mei-Ling Zhou',
      company: 'Pacific Biotherapeutics',
      email: 'mlzhou@pacificbio.com',
      phone: '+1 (650) 555-0123',
      source: 'event',
      industry: 'Biotechnology',
      status: 'proposal',
      owner: allUsers.dhruvil._id,
      notes: 'RFP submitted with custom HIPAA-compliant infrastructure architecture plan.',
    },
    {
      leadName: 'Nathaniel Cross',
      company: 'Cobalt Energy Solutions',
      email: 'ncross@cobaltenergy.com',
      phone: '+1 (713) 555-0165',
      source: 'cold_call',
      industry: 'Energy & Utilities',
      status: 'proposal',
      owner: allUsers.vikram._id,
      notes: 'Formal proposal sent for 3-year enterprise software contract.',
    },
    {
      leadName: 'Katarina Novak',
      company: 'Prague Telecommunications',
      email: 'k.novak@praguetel.cz',
      phone: '+420 221 555 330',
      source: 'other',
      industry: 'Telecommunications',
      status: 'negotiation',
      owner: allUsers.vikram._id,
      notes: 'Legal & procurement redlining Master Services Agreement. Close expected this month.',
    },
    {
      leadName: 'Benjamin Scott',
      company: 'Apex Financial Global',
      email: 'bscott@apexfinancial.io',
      phone: '+1 (617) 555-0131',
      source: 'referral',
      industry: 'Financial Services',
      status: 'won',
      owner: allUsers.dhruvil._id,
      notes: 'Converted to enterprise deal and active customer.',
    },
  ];

  for (const ld of leadsData) {
    await Lead.create({
      organizationId: orgId,
      ...ld,
    });
  }
  console.log(`Created ${leadsData.length} leads.`);

  // 9. Seed Deals across all 7 pipeline stages
  console.log('Seeding deals across all stages...');
  await Deal.deleteMany({ organizationId: orgId });
  const now = new Date();
  const dealsData = [
    // 1. Stage: new
    {
      dealName: 'CloudScale - Hybrid Cloud Mesh Pilot',
      company: 'CloudScale Infrastructure',
      contact: 'Elena Rostova',
      amount: 45000,
      probability: 20,
      expectedCloseDate: new Date('2026-11-15'),
      stage: 'new',
      salesperson: allUsers.dhruvil._id,
    },
    {
      dealName: 'Meridian - Fleet Telematics Ingestion Engine',
      company: 'Meridian Logistics & Supply',
      contact: 'David Chen',
      amount: 60000,
      probability: 25,
      expectedCloseDate: new Date('2026-11-30'),
      stage: 'new',
      salesperson: allUsers.vikram._id,
    },

    // 2. Stage: contacted
    {
      dealName: 'Nexus - Real-Time Inventory Sync Suite',
      company: 'Nexus Retail Technologies',
      contact: 'Sarah Jenkins',
      amount: 85000,
      probability: 35,
      expectedCloseDate: new Date('2026-10-25'),
      stage: 'contacted',
      salesperson: allUsers.vikram._id,
    },
    {
      dealName: 'Vertex - Lab Automation Integration API',
      company: 'Vertex BioTech Solutions',
      contact: 'Amara Okafor',
      amount: 50000,
      probability: 40,
      expectedCloseDate: new Date('2026-11-10'),
      stage: 'contacted',
      salesperson: allUsers.dhruvil._id,
    },

    // 3. Stage: qualified
    {
      dealName: 'Apex - Global Multi-Region Core Rollout',
      company: 'Apex Financial Global',
      contact: 'Marcus Vance',
      amount: 140000,
      probability: 60,
      expectedCloseDate: new Date('2026-10-18'),
      stage: 'qualified',
      salesperson: allUsers.dhruvil._id,
    },
    {
      dealName: 'Horizon - EHR Interoperability Hub',
      company: 'Horizon Healthcare Systems',
      contact: 'Dr. Robert Sterling',
      amount: 95000,
      probability: 65,
      expectedCloseDate: new Date('2026-10-30'),
      stage: 'qualified',
      salesperson: allUsers.rudra._id,
    },

    // 4. Stage: proposal
    {
      dealName: 'Meridian - Automated Dispatch & Route AI',
      company: 'Meridian Logistics & Supply',
      contact: 'David Chen',
      amount: 175000,
      probability: 75,
      expectedCloseDate: new Date('2026-10-15'),
      stage: 'proposal',
      salesperson: allUsers.vikram._id,
    },
    {
      dealName: 'Nexus - Omnichannel POS Cloud Migration',
      company: 'Nexus Retail Technologies',
      contact: 'Sarah Jenkins',
      amount: 120000,
      probability: 70,
      expectedCloseDate: new Date('2026-10-20'),
      stage: 'proposal',
      salesperson: allUsers.priya._id,
    },

    // 5. Stage: negotiation
    {
      dealName: 'Apex - Tier-1 High Availability Banking Gateway',
      company: 'Apex Financial Global',
      contact: 'Kenneth Bradley',
      amount: 220000,
      probability: 90,
      expectedCloseDate: new Date('2026-09-30'),
      stage: 'negotiation',
      salesperson: allUsers.dhruvil._id,
    },
    {
      dealName: 'CloudScale - Enterprise Observability Stack',
      company: 'CloudScale Infrastructure',
      contact: 'Sophia Martinez',
      amount: 165000,
      probability: 85,
      expectedCloseDate: new Date('2026-10-05'),
      stage: 'negotiation',
      salesperson: allUsers.vikram._id,
    },

    // 6. Stage: won
    {
      dealName: 'Apex - Security & Compliance Governance Audit',
      company: 'Apex Financial Global',
      contact: 'Marcus Vance',
      amount: 95000,
      probability: 100,
      expectedCloseDate: new Date('2026-09-10'),
      stage: 'won',
      wonAt: new Date('2026-09-10T14:30:00Z'),
      salesperson: allUsers.dhruvil._id,
    },
    {
      dealName: 'Vertex - Genomic Pipeline Distributed Processing',
      company: 'Vertex BioTech Solutions',
      contact: 'Amara Okafor',
      amount: 180000,
      probability: 100,
      expectedCloseDate: new Date('2026-09-18'),
      stage: 'won',
      wonAt: new Date('2026-09-18T16:00:00Z'),
      salesperson: allUsers.dhruvil._id,
    },

    // 7. Stage: lost
    {
      dealName: 'Legacy Mainframe Bridge Migration',
      company: 'Apex Financial Global',
      contact: 'Kenneth Bradley',
      amount: 65000,
      probability: 0,
      expectedCloseDate: new Date('2026-08-20'),
      stage: 'lost',
      salesperson: allUsers.vikram._id,
    },
    {
      dealName: 'Horizon - Legacy Patient Portal Redesign',
      company: 'Horizon Healthcare Systems',
      contact: 'Dr. Robert Sterling',
      amount: 40000,
      probability: 0,
      expectedCloseDate: new Date('2026-08-15'),
      stage: 'lost',
      salesperson: allUsers.rudra._id,
    },
  ];

  const createdDeals = [];
  for (const dd of dealsData) {
    const comp = companyMap[dd.company];
    const cont = contactMap[dd.contact];
    const dealDoc = await Deal.create({
      organizationId: orgId,
      dealName: dd.dealName,
      companyId: comp?._id || null,
      contactId: cont?._id || null,
      amount: dd.amount,
      probability: dd.probability,
      expectedCloseDate: dd.expectedCloseDate,
      stage: dd.stage,
      wonAt: dd.wonAt || null,
      salesperson: dd.salesperson,
    });
    createdDeals.push(dealDoc);
  }
  console.log(`Created ${createdDeals.length} deals.`);

  // 10. Seed Activities
  console.log('Seeding activities...');
  await Activity.deleteMany({ organizationId: orgId });
  const sampleActivities = [
    {
      type: 'call',
      relatedToType: 'deal',
      relatedToId: createdDeals[8]._id, // Apex 220k negotiation
      content: 'Call with Kenneth Bradley (Procurement). Reviewed final SLA clauses; verified 99.99% uptime guarantee commitments.',
      createdBy: allUsers.dhruvil._id,
    },
    {
      type: 'meeting',
      relatedToType: 'deal',
      relatedToId: createdDeals[6]._id, // Meridian 175k proposal
      content: 'Technical demonstration of real-time AI dispatching with VP of Supply Chain David Chen. Team was enthusiastic regarding sub-second route re-planning.',
      createdBy: allUsers.vikram._id,
    },
    {
      type: 'task',
      relatedToType: 'deal',
      relatedToId: createdDeals[9]._id, // CloudScale 165k
      content: 'Send updated SOC2 Type II compliance audit packet and penetration testing summary report.',
      dueDate: new Date(Date.now() + 86400000 * 2),
      createdBy: allUsers.priya._id,
    },
    {
      type: 'email',
      relatedToType: 'contact',
      relatedToId: contactMap['Marcus Vance']._id,
      content: 'Sent executive summary and invitation to our quarterly product roadmap advisory board.',
      createdBy: allUsers.dhruvil._id,
    },
    {
      type: 'note',
      relatedToType: 'company',
      relatedToId: companyMap['Apex Financial Global']._id,
      content: 'Key account: Fiscal year renewal cycle begins in Q4. Primary sponsors: CIO Marcus Vance & Procurement Director Kenneth Bradley.',
      createdBy: allUsers.dhruvil._id,
    },
    {
      type: 'meeting',
      relatedToType: 'company',
      relatedToId: companyMap['Vertex BioTech Solutions']._id,
      content: 'Executive dinner with Dr. Amara Okafor. Discussed expanding sequencing compute clusters across EU genomics centers.',
      createdBy: allUsers.dhruvil._id,
    },
    {
      type: 'call',
      relatedToType: 'deal',
      relatedToId: createdDeals[4]._id, // Apex 140k qualified
      content: 'Architecture alignment call: resolved network egress bandwidth estimates.',
      createdBy: allUsers.dhruvil._id,
    },
    {
      type: 'task',
      relatedToType: 'deal',
      relatedToId: createdDeals[2]._id, // Nexus 85k contacted
      content: 'Prepare tailored retail inventory sync architecture diagram with Shopify Plus connectors.',
      dueDate: new Date(Date.now() + 86400000 * 3),
      completedAt: new Date(),
      createdBy: allUsers.vikram._id,
    },
  ];

  for (const act of sampleActivities) {
    await Activity.create({
      organizationId: orgId,
      ...act,
    });
  }
  console.log(`Created ${sampleActivities.length} activities.`);

  // 11. Seed Leave Types & Balances
  console.log('Seeding leave balances for all users...');
  let leaveTypes = await LeaveType.find({ organizationId: orgId });
  if (leaveTypes.length === 0) {
    leaveTypes = await LeaveType.insertMany(
      DEFAULT_LEAVE_TYPES.map((lt) => ({ ...lt, organizationId: orgId }))
    );
  }
  const ltMap = {};
  for (const lt of leaveTypes) {
    ltMap[lt.name] = lt;
  }

  const currentYear = new Date().getUTCFullYear();
  for (const userKey of Object.keys(allUsers)) {
    const u = allUsers[userKey];
    if (!u) continue;

    for (const lt of leaveTypes) {
      let lb = await LeaveBalance.findOne({
        organizationId: orgId,
        employeeId: u._id,
        leaveTypeId: lt._id,
        year: currentYear,
      });

      if (!lb) {
        let allocated = 15;
        let used = 0;
        if (lt.name.includes('Sick')) { allocated = 10; used = 2; }
        else if (lt.name.includes('Casual')) { allocated = 8; used = 1; }
        else if (lt.name.includes('Annual')) { allocated = 18; used = 3; }
        else if (lt.name.includes('Unpaid')) { allocated = 10; used = 0; }

        await LeaveBalance.create({
          organizationId: orgId,
          employeeId: u._id,
          leaveTypeId: lt._id,
          year: currentYear,
          allocated,
          used,
        });
      }
    }
  }

  // 12. Seed Leave Requests
  console.log('Seeding leave requests...');
  await LeaveRequest.deleteMany({ organizationId: orgId });
  const leaveReqs = [
    {
      employeeId: allUsers.sahil._id,
      leaveTypeId: ltMap['Casual Leave']?._id || leaveTypes[0]._id,
      startDate: new Date('2026-09-28'),
      endDate: new Date('2026-09-29'),
      totalDays: 2,
      reason: 'Attending family wedding ceremony in Ahmedabad.',
      status: 'pending',
    },
    {
      employeeId: allUsers.priya._id,
      leaveTypeId: ltMap['Annual Leave']?._id || leaveTypes[0]._id,
      startDate: new Date('2026-10-05'),
      endDate: new Date('2026-10-07'),
      totalDays: 3,
      reason: 'Pre-planned autumn family vacation.',
      status: 'pending',
    },
    {
      employeeId: allUsers.dhruvil._id,
      leaveTypeId: ltMap['Sick Leave']?._id || leaveTypes[0]._id,
      startDate: new Date('2026-09-08'),
      endDate: new Date('2026-09-08'),
      totalDays: 1,
      reason: 'Severe migraine recovery.',
      status: 'approved',
      reviewedBy: allUsers.darshana._id,
    },
    {
      employeeId: allUsers.vikram._id,
      leaveTypeId: ltMap['Casual Leave']?._id || leaveTypes[0]._id,
      startDate: new Date('2026-08-22'),
      endDate: new Date('2026-08-22'),
      totalDays: 1,
      reason: 'Home electrical and internet maintenance.',
      status: 'approved',
      reviewedBy: allUsers.darshana._id,
    },
    {
      employeeId: allUsers.rohan._id,
      leaveTypeId: ltMap['Annual Leave']?._id || leaveTypes[0]._id,
      startDate: new Date('2026-08-10'),
      endDate: new Date('2026-08-12'),
      totalDays: 3,
      reason: 'Trekking expedition in Himachal.',
      status: 'approved',
      reviewedBy: allUsers.dhruvil._id,
    },
  ];

  for (const lr of leaveReqs) {
    await LeaveRequest.create({
      organizationId: orgId,
      ...lr,
    });
  }
  console.log(`Created ${leaveReqs.length} leave requests.`);

  // 13. Seed Attendance Records for Today & Recent Days
  console.log('Seeding attendance records...');
  // We keep today's attendance fresh
  const todayUtc = getDayMidnightUtc(new Date(), 'Asia/Kolkata');

  // Let's create today's check-ins for the team:
  // Dhruvil: Checked in at 09:15 AM
  // Darshana: Checked in at 09:40 AM (Late)
  // Rudra: Checked in at 09:20 AM
  // Sahil: Checked in at 09:10 AM, on break
  // Aisha: Checked in at 09:00 AM, checked out at 06:00 PM
  // Vikram: Checked in at 09:25 AM
  // Rohan: Checked in at 09:30 AM
  // Priya: on_leave (matched with approved request or leave status)

  const todayRecords = [
    {
      user: allUsers.dhruvil,
      checkIn: new Date(Date.now() - 5.5 * 3600000), // 5.5 hrs ago
      checkOut: null,
      breaks: [],
      status: 'present',
      isLate: false,
      workedMinutes: 330,
    },
    {
      user: allUsers.darshana,
      checkIn: new Date(Date.now() - 5.0 * 3600000),
      checkOut: null,
      breaks: [],
      status: 'present',
      isLate: true,
      workedMinutes: 300,
    },
    {
      user: allUsers.rudra,
      checkIn: new Date(Date.now() - 5.3 * 3600000),
      checkOut: null,
      breaks: [],
      status: 'present',
      isLate: false,
      workedMinutes: 318,
    },
    {
      user: allUsers.sahil,
      checkIn: new Date(Date.now() - 5.4 * 3600000),
      checkOut: null,
      breaks: [{ breakInAt: new Date(Date.now() - 25 * 60000), breakOutAt: null }],
      status: 'present',
      isLate: false,
      workedMinutes: 299,
    },
    {
      user: allUsers.aisha,
      checkIn: new Date(Date.now() - 8 * 3600000),
      checkOut: new Date(Date.now() - 1 * 3600000),
      breaks: [{ breakInAt: new Date(Date.now() - 5 * 3600000), breakOutAt: new Date(Date.now() - 4.2 * 3600000) }],
      status: 'present',
      isLate: false,
      workedMinutes: 372,
    },
    {
      user: allUsers.vikram,
      checkIn: new Date(Date.now() - 5.2 * 3600000),
      checkOut: null,
      breaks: [],
      status: 'present',
      isLate: false,
      workedMinutes: 312,
    },
    {
      user: allUsers.rohan,
      checkIn: new Date(Date.now() - 5.1 * 3600000),
      checkOut: null,
      breaks: [],
      status: 'present',
      isLate: false,
      workedMinutes: 306,
    },
    {
      user: allUsers.priya,
      checkIn: null,
      checkOut: null,
      breaks: [],
      status: 'on_leave',
      isLate: false,
      workedMinutes: 0,
    },
  ];

  for (const tr of todayRecords) {
    if (!tr.user) continue;
    await AttendanceRecord.findOneAndUpdate(
      { organizationId: orgId, employeeId: tr.user._id, date: todayUtc },
      {
        organizationId: orgId,
        employeeId: tr.user._id,
        date: todayUtc,
        checkInAt: tr.checkIn,
        checkOutAt: tr.checkOut,
        breaks: tr.breaks,
        status: tr.status,
        isLate: tr.isLate,
        totalWorkedMinutes: tr.workedMinutes,
      },
      { upsert: true, new: true }
    );
  }

  // Also add 10 past working days for Dhruvil so his Monthly Attendance card has great stats!
  for (let d = 1; d <= 23; d++) {
    const dayDate = new Date(Date.UTC(2026, 8, d, 0, 0, 0)); // September 2026
    const dayOfWeek = dayDate.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

    const existingAtt = await AttendanceRecord.findOne({
      organizationId: orgId,
      employeeId: allUsers.dhruvil._id,
      date: dayDate,
    });

    if (!existingAtt) {
      const isLate = d === 7 || d === 15;
      const checkInHour = isLate ? '10:05' : '09:20';
      const checkInAt = new Date(`2026-09-${String(d).padStart(2, '0')}T${checkInHour}:00.000Z`);
      const checkOutAt = new Date(`2026-09-${String(d).padStart(2, '0')}T18:15:00.000Z`);
      const workedMin = 8.5 * 60;

      await AttendanceRecord.create({
        organizationId: orgId,
        employeeId: allUsers.dhruvil._id,
        date: dayDate,
        checkInAt,
        checkOutAt,
        breaks: [
          {
            breakInAt: new Date(`2026-09-${String(d).padStart(2, '0')}T13:00:00.000Z`),
            breakOutAt: new Date(`2026-09-${String(d).padStart(2, '0')}T13:45:00.000Z`),
          },
        ],
        status: 'present',
        isLate,
        totalWorkedMinutes: workedMin,
      });
    }
  }

  console.log('Successfully seeded rich realistic data for CRM & HRMS in PVF Pvt Ltd.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
