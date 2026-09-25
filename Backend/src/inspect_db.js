const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const Organization = require('./models/Organization');
const User = require('./models/User');
const Lead = require('./models/Lead');
const Deal = require('./models/Deal');
const Contact = require('./models/Contact');
const Company = require('./models/Company');
const Department = require('./models/Department');
const Employee = require('./models/Employee');
const EmployeeDocument = require('./models/EmployeeDocument');
const Holiday = require('./models/Holiday');
const LeaveRequest = require('./models/LeaveRequest');
const LeaveBalance = require('./models/LeaveBalance');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nebula');
  console.log('Connected to MongoDB');

  const orgs = await Organization.find({}).lean();
  console.log(`Found ${orgs.length} organizations:`, orgs.map(o => ({ id: o._id, name: o.name, domain: o.domain })));

  for (const org of orgs) {
    const userCount = await User.countDocuments({ organizationId: org._id });
    const leadCount = await Lead.countDocuments({ organizationId: org._id });
    const dealCount = await Deal.countDocuments({ organizationId: org._id });
    const contactCount = await Contact.countDocuments({ organizationId: org._id });
    const companyCount = await Company.countDocuments({ organizationId: org._id });
    const deptCount = await Department.countDocuments({ organizationId: org._id });
    const empCount = await Employee.countDocuments({ organizationId: org._id });
    const docCount = await EmployeeDocument.countDocuments({ organizationId: org._id });
    const holidayCount = await Holiday.countDocuments({ organizationId: org._id });
    const leaveReqCount = await LeaveRequest.countDocuments({ organizationId: org._id });
    const leaveBalCount = await LeaveBalance.countDocuments({ organizationId: org._id });

    console.log(`\n--- Org: ${org.name} (${org._id}) ---`);
    console.log(`Users: ${userCount}`);
    console.log(`CRM -> Leads: ${leadCount}, Deals: ${dealCount}, Contacts: ${contactCount}, Companies: ${companyCount}`);
    console.log(`HRMS -> Depts: ${deptCount}, Employees: ${empCount}, Documents: ${docCount}, Holidays: ${holidayCount}, LeaveRequests: ${leaveReqCount}, LeaveBalances: ${leaveBalCount}`);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
