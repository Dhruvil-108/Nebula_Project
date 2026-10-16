/**
 * Seed realistic Expense Management data for Nebula Hub.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Organization = require('./models/Organization');
const User = require('./models/User');
const Department = require('./models/Department');
const Employee = require('./models/Employee');
const ExpenseCategory = require('./models/ExpenseCategory');
const DepartmentBudget = require('./models/DepartmentBudget');
const ExpenseClaim = require('./models/ExpenseClaim');
const ExpenseActivity = require('./models/ExpenseActivity');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nebula';

async function seedExpenses() {
  console.log('Connecting to MongoDB at:', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.');

  let org = await Organization.findOne({ isActive: true });
  if (!org) {
    org = await Organization.findOne();
  }
  if (!org) {
    console.error('No organization found to seed expense data.');
    process.exit(1);
  }

  const orgId = org._id;
  console.log(`Target Organization: ${org.name} (${orgId})`);

  // Users
  const users = await User.find({ organizationId: orgId }).limit(10);
  const adminUser = users.find((u) => u.role === 'super_admin' || u.role === 'admin') || users[0];
  const financeUser = users.find((u) => u.role === 'finance') || adminUser;
  const managerUser = users.find((u) => u.role === 'manager') || adminUser;
  const employeeUser = users.find((u) => u.role === 'employee') || users[1] || adminUser;

  // Departments
  let departments = await Department.find({ organizationId: orgId });
  if (departments.length === 0) {
    console.log('Creating default departments...');
    const eng = await Department.create({ organizationId: orgId, name: 'Engineering', description: 'Software & Cloud' });
    const prod = await Department.create({ organizationId: orgId, name: 'Product & Design', description: 'UX & Product Management' });
    const sales = await Department.create({ organizationId: orgId, name: 'Sales & Marketing', description: 'Customer Acquisition' });
    const ops = await Department.create({ organizationId: orgId, name: 'Finance & Operations', description: 'Corporate Governance' });
    departments = [eng, prod, sales, ops];
  }

  const engDept = departments.find((d) => /eng/i.test(d.name)) || departments[0];
  const prodDept = departments.find((d) => /prod/i.test(d.name)) || departments[1] || departments[0];
  const salesDept = departments.find((d) => /sales/i.test(d.name)) || departments[2] || departments[0];
  const opsDept = departments.find((d) => /fin|ops/i.test(d.name)) || departments[3] || departments[0];

  // Clean old expense collections for clean seed
  console.log('Clearing old expense demo records...');
  await ExpenseCategory.deleteMany({ organizationId: orgId });
  await DepartmentBudget.deleteMany({ organizationId: orgId });
  await ExpenseClaim.deleteMany({ organizationId: orgId });
  await ExpenseActivity.deleteMany({ organizationId: orgId });

  // 1. Seed Categories
  console.log('Seeding Expense Categories...');
  const categoryDefs = [
    {
      name: 'Travel & Commute',
      code: 'CAT-TRAVEL',
      glCode: 'GL-60100',
      icon: 'Plane',
      color: '#f97316',
      maxClaimLimit: 1500,
      isReceiptMandatory: true,
      receiptThresholdAmount: 25,
      description: 'Flights, cabs, train fares, vehicle mileage, and hotel lodging.',
    },
    {
      name: 'Meals & Entertainment',
      code: 'CAT-MEALS',
      glCode: 'GL-60200',
      icon: 'Utensils',
      color: '#ef4444',
      maxClaimLimit: 250,
      isReceiptMandatory: true,
      receiptThresholdAmount: 15,
      description: 'Business lunches, team dinners, client hosting, and working sessions.',
    },
    {
      name: 'Software & Cloud Tools',
      code: 'CAT-SOFTWARE',
      glCode: 'GL-60300',
      icon: 'Laptop',
      color: '#8b5cf6',
      maxClaimLimit: 600,
      isReceiptMandatory: true,
      receiptThresholdAmount: 10,
      description: 'SaaS subscriptions, developer tooling, cloud infrastructure, and IDE licenses.',
    },
    {
      name: 'Office Supplies & Hardware',
      code: 'CAT-OFFICE',
      glCode: 'GL-60400',
      icon: 'Briefcase',
      color: '#10b981',
      maxClaimLimit: 400,
      isReceiptMandatory: true,
      receiptThresholdAmount: 20,
      description: 'Ergonomic accessories, stationery, cables, and home-office equipment.',
    },
    {
      name: 'Professional Training & Certifications',
      code: 'CAT-TRAINING',
      glCode: 'GL-60500',
      icon: 'GraduationCap',
      color: '#06b6d4',
      maxClaimLimit: 1200,
      isReceiptMandatory: true,
      receiptThresholdAmount: 50,
      description: 'Conference passes, online learning courses, and technical certification exams.',
    },
    {
      name: 'Health & Wellness',
      code: 'CAT-WELLNESS',
      glCode: 'GL-60600',
      icon: 'HeartPulse',
      color: '#ec4899',
      maxClaimLimit: 150,
      isReceiptMandatory: false,
      receiptThresholdAmount: 30,
      description: 'Gym memberships, ergonomics therapy, and workplace health benefits.',
    },
  ];

  const createdCategories = await ExpenseCategory.insertMany(
    categoryDefs.map((c) => ({ ...c, organizationId: orgId, isActive: true }))
  );
  console.log(`Created ${createdCategories.length} categories.`);

  const catMap = {};
  createdCategories.forEach((c) => {
    catMap[c.code] = c._id;
  });

  // 2. Seed Budgets
  console.log('Seeding Department Budgets...');
  const currentYear = new Date().getFullYear();
  const budgets = [
    {
      organizationId: orgId,
      departmentId: engDept._id,
      fiscalYear: currentYear,
      period: 'annual',
      allocatedAmount: 48000,
      alertThresholdPercent: 80,
      notes: 'Engineering cloud, tooling & continuous learning budget',
    },
    {
      organizationId: orgId,
      departmentId: prodDept._id,
      fiscalYear: currentYear,
      period: 'annual',
      allocatedAmount: 28000,
      alertThresholdPercent: 80,
      notes: 'Product research, user testing & design prototyping budget',
    },
    {
      organizationId: orgId,
      departmentId: salesDept._id,
      fiscalYear: currentYear,
      period: 'annual',
      allocatedAmount: 36000,
      alertThresholdPercent: 75,
      notes: 'Client entertainment, flights & event sponsorships',
    },
    {
      organizationId: orgId,
      departmentId: opsDept._id,
      fiscalYear: currentYear,
      period: 'annual',
      allocatedAmount: 18000,
      alertThresholdPercent: 85,
      notes: 'Corporate office upkeep and operational compliance',
    },
  ];

  await DepartmentBudget.insertMany(budgets);
  console.log(`Allocated budgets for ${budgets.length} departments.`);

  // 3. Seed Realistic Claims
  console.log('Seeding Expense Claims & Audit Histories...');

  const claimsData = [
    {
      claimNumber: `EXP-${currentYear}-0001`,
      employeeId: employeeUser._id,
      departmentId: engDept._id,
      title: 'Q3 AWS Cloud Hosting & Development Sandbox',
      status: 'reimbursed',
      notes: 'Cloud resources for staging environment load testing.',
      totalAmount: 489.5,
      totalTaxAmount: 42.1,
      currency: 'USD',
      submittedAt: new Date(Date.now() - 25 * 86400000),
      managerApproval: {
        approverId: managerUser._id,
        approvedAt: new Date(Date.now() - 22 * 86400000),
        comments: 'Verified staging environment metrics. Approved.',
      },
      financeApproval: {
        approverId: financeUser._id,
        approvedAt: new Date(Date.now() - 18 * 86400000),
        comments: 'GL code allocated to 60300. Fully approved.',
      },
      reimbursement: {
        reimbursedAt: new Date(Date.now() - 15 * 86400000),
        reimbursedById: financeUser._id,
        paymentMethod: 'bank_transfer',
        transactionReference: 'NEB-WIRE-99214',
      },
      items: [
        {
          categoryId: catMap['CAT-SOFTWARE'],
          expenseDate: new Date(Date.now() - 27 * 86400000),
          merchant: 'Amazon Web Services',
          description: 'EC2 and RDS compute instances for load testing',
          amount: 447.4,
          taxAmount: 42.1,
          currency: 'USD',
          receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e49fa402e37?auto=format&fit=crop&w=600&q=80',
          receiptFileName: 'aws-invoice-sep.pdf',
        },
      ],
    },
    {
      claimNumber: `EXP-${currentYear}-0002`,
      employeeId: employeeUser._id,
      departmentId: salesDept._id,
      title: 'Client Partner Onsite Dinner & Airport Transit',
      status: 'approved',
      notes: 'Hosted executives from Northwind Global for contract closing discussion.',
      totalAmount: 324.8,
      totalTaxAmount: 26.5,
      currency: 'USD',
      submittedAt: new Date(Date.now() - 10 * 86400000),
      managerApproval: {
        approverId: managerUser._id,
        approvedAt: new Date(Date.now() - 8 * 86400000),
        comments: 'Client deal successfully advanced. Approved.',
      },
      financeApproval: {
        approverId: financeUser._id,
        approvedAt: new Date(Date.now() - 4 * 86400000),
        comments: 'Approved for payout in next payroll batch.',
      },
      items: [
        {
          categoryId: catMap['CAT-MEALS'],
          expenseDate: new Date(Date.now() - 11 * 86400000),
          merchant: 'Bistro Moderno',
          description: 'Dinner with Northwind VP & Lead Architect',
          amount: 278.3,
          taxAmount: 22.8,
          currency: 'USD',
          receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e49fa402e37?auto=format&fit=crop&w=600&q=80',
          receiptFileName: 'dinner-receipt.jpg',
          isBillableToClient: true,
          clientName: 'Northwind Global',
        },
        {
          categoryId: catMap['CAT-TRAVEL'],
          expenseDate: new Date(Date.now() - 11 * 86400000),
          merchant: 'Uber Technologies',
          description: 'Airport transit to client hotel',
          amount: 46.5,
          taxAmount: 3.7,
          currency: 'USD',
          receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e49fa402e37?auto=format&fit=crop&w=600&q=80',
          receiptFileName: 'uber-ride.pdf',
        },
      ],
    },
    {
      claimNumber: `EXP-${currentYear}-0003`,
      employeeId: employeeUser._id,
      departmentId: prodDept._id,
      title: 'Figma Enterprise Organization Seats (Quarterly)',
      status: 'manager_approved',
      notes: 'Quarterly design seats for new UX researchers.',
      totalAmount: 285.0,
      totalTaxAmount: 0,
      currency: 'USD',
      submittedAt: new Date(Date.now() - 4 * 86400000),
      managerApproval: {
        approverId: managerUser._id,
        approvedAt: new Date(Date.now() - 1 * 86400000),
        comments: 'Required for sprint research. Forwarding to Finance.',
      },
      items: [
        {
          categoryId: catMap['CAT-SOFTWARE'],
          expenseDate: new Date(Date.now() - 5 * 86400000),
          merchant: 'Figma Inc.',
          description: '3 Enterprise designer licenses for Q4',
          amount: 285.0,
          taxAmount: 0,
          currency: 'USD',
          receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e49fa402e37?auto=format&fit=crop&w=600&q=80',
          receiptFileName: 'figma-invoice.pdf',
        },
      ],
    },
    {
      claimNumber: `EXP-${currentYear}-0004`,
      employeeId: employeeUser._id,
      departmentId: engDept._id,
      title: 'Home Office Ergonomic Dual-Monitor Arm & Hub',
      status: 'submitted',
      notes: 'Remote workstation upgrade per WFH equipment policy.',
      totalAmount: 168.0,
      totalTaxAmount: 13.5,
      currency: 'USD',
      submittedAt: new Date(Date.now() - 1 * 86400000),
      items: [
        {
          categoryId: catMap['CAT-OFFICE'],
          expenseDate: new Date(Date.now() - 2 * 86400000),
          merchant: 'Office Depot',
          description: 'Ergonomic gas-spring monitor arm and USB-C hub',
          amount: 168.0,
          taxAmount: 13.5,
          currency: 'USD',
          receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e49fa402e37?auto=format&fit=crop&w=600&q=80',
          receiptFileName: 'monitor-arm-receipt.jpg',
        },
      ],
    },
    {
      claimNumber: `EXP-${currentYear}-0005`,
      employeeId: employeeUser._id,
      departmentId: engDept._id,
      title: 'KubeCon North America 2026 Virtual Pass',
      status: 'draft',
      notes: 'Kubernetes and Cloud Native computing workshop pass.',
      totalAmount: 220.0,
      totalTaxAmount: 0,
      currency: 'USD',
      items: [
        {
          categoryId: catMap['CAT-TRAINING'],
          expenseDate: new Date(),
          merchant: 'Linux Foundation',
          description: 'Virtual All-Access attendee pass',
          amount: 220.0,
          taxAmount: 0,
          currency: 'USD',
          receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e49fa402e37?auto=format&fit=crop&w=600&q=80',
          receiptFileName: 'kubecon-registration.pdf',
        },
      ],
    },
    {
      claimNumber: `EXP-${currentYear}-0006`,
      employeeId: employeeUser._id,
      departmentId: opsDept._id,
      title: 'Personal Luxury Wireless Headphones',
      status: 'rejected',
      notes: 'Noise cancelling headset for personal commute.',
      totalAmount: 349.99,
      totalTaxAmount: 28.0,
      currency: 'USD',
      submittedAt: new Date(Date.now() - 14 * 86400000),
      rejection: {
        rejectedById: managerUser._id,
        rejectedAt: new Date(Date.now() - 12 * 86400000),
        reason: 'Personal luxury audio gear is not eligible under standard office hardware policy. Please use IT approved headset catalog.',
        stage: 'manager',
      },
      items: [
        {
          categoryId: catMap['CAT-OFFICE'],
          expenseDate: new Date(Date.now() - 15 * 86400000),
          merchant: 'Best Buy Electronics',
          description: 'Sony WH-1000XM5 Wireless Headphones',
          amount: 349.99,
          taxAmount: 28.0,
          currency: 'USD',
          receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e49fa402e37?auto=format&fit=crop&w=600&q=80',
          receiptFileName: 'bestbuy-receipt.jpg',
        },
      ],
    },
  ];

  for (const c of claimsData) {
    const claim = await ExpenseClaim.create({ ...c, organizationId: orgId });

    // Seed activity entries
    await ExpenseActivity.create({
      organizationId: orgId,
      claimId: claim._id,
      actorId: c.employeeId,
      action: 'created',
      comment: 'Claim created',
    });

    if (c.submittedAt) {
      await ExpenseActivity.create({
        organizationId: orgId,
        claimId: claim._id,
        actorId: c.employeeId,
        action: 'submitted',
        comment: 'Claim submitted for manager review',
        createdAt: c.submittedAt,
      });
    }

    if (c.managerApproval?.approvedAt) {
      await ExpenseActivity.create({
        organizationId: orgId,
        claimId: claim._id,
        actorId: c.managerApproval.approverId,
        action: 'manager_approved',
        comment: c.managerApproval.comments,
        createdAt: c.managerApproval.approvedAt,
      });
    }

    if (c.financeApproval?.approvedAt) {
      await ExpenseActivity.create({
        organizationId: orgId,
        claimId: claim._id,
        actorId: c.financeApproval.approverId,
        action: 'finance_approved',
        comment: c.financeApproval.comments,
        createdAt: c.financeApproval.approvedAt,
      });
    }

    if (c.reimbursement?.reimbursedAt) {
      await ExpenseActivity.create({
        organizationId: orgId,
        claimId: claim._id,
        actorId: c.reimbursement.reimbursedById,
        action: 'reimbursed',
        comment: `Reimbursed via ${c.reimbursement.paymentMethod} (Ref: ${c.reimbursement.transactionReference})`,
        createdAt: c.reimbursement.reimbursedAt,
      });
    }

    if (c.rejection?.rejectedAt) {
      await ExpenseActivity.create({
        organizationId: orgId,
        claimId: claim._id,
        actorId: c.rejection.rejectedById,
        action: 'rejected',
        comment: c.rejection.reason,
        createdAt: c.rejection.rejectedAt,
      });
    }
  }

  console.log(`Seeded ${claimsData.length} expense claims with complete audit timelines.`);
  console.log('Expense management seeding finished successfully!');
  await mongoose.disconnect();
}

seedExpenses().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
