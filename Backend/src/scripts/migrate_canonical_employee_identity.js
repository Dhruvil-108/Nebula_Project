const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Organization = require('../models/Organization');
const User = require('../models/User');
const Employee = require('../models/Employee');
const AttendanceRecord = require('../models/AttendanceRecord');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');
const { resolveEmployeeFromUser } = require('../utils/employeeUtils');

async function runMigration() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nebula';
  console.log('[Migration] Connecting to MongoDB:', mongoUri);
  await mongoose.connect(mongoUri);

  try {
    const orgs = await Organization.find({}).lean();
    console.log(`[Migration] Found ${orgs.length} organizations to process.`);

    let totalUsersProvisioned = 0;
    let attendanceMigrated = 0;
    let leaveRequestsMigrated = 0;
    let leaveBalancesMigrated = 0;

    for (const org of orgs) {
      console.log(`[Migration] Processing org: ${org.name} (${org._id})`);

      // 1. Ensure all users in org have an Employee dossier
      const users = await User.find({ organizationId: org._id }).lean();
      for (const u of users) {
        const emp = await resolveEmployeeFromUser(org._id, u._id);
        if (emp) totalUsersProvisioned++;
      }

      // Build User -> Employee map for this org
      const employees = await Employee.find({ organizationId: org._id }).lean();
      const userToEmpMap = new Map();
      const empIdSet = new Set();

      for (const emp of employees) {
        empIdSet.add(emp._id.toString());
        if (emp.userId) {
          userToEmpMap.set(emp.userId.toString(), emp._id);
        }
      }

      // 2. Migrate AttendanceRecord
      const attendanceRecords = await AttendanceRecord.find({ organizationId: org._id });
      for (const rec of attendanceRecords) {
        const empIdStr = rec.employeeId?.toString();
        // If employeeId is NOT an Employee ID, check if it's a User ID
        if (!empIdSet.has(empIdStr) && userToEmpMap.has(empIdStr)) {
          const canonicalEmpId = userToEmpMap.get(empIdStr);
          rec.userId = rec.employeeId;
          rec.employeeId = canonicalEmpId;
          await rec.save();
          attendanceMigrated++;
        } else if (empIdSet.has(empIdStr) && !rec.userId) {
          // If already Employee ID, ensure userId is populated
          const matchingEmp = employees.find((e) => e._id.toString() === empIdStr);
          if (matchingEmp?.userId) {
            rec.userId = matchingEmp.userId;
            await rec.save();
          }
        }
      }

      // 3. Migrate LeaveRequest
      const leaveRequests = await LeaveRequest.find({ organizationId: org._id });
      for (const req of leaveRequests) {
        const empIdStr = req.employeeId?.toString();
        if (!empIdSet.has(empIdStr) && userToEmpMap.has(empIdStr)) {
          const canonicalEmpId = userToEmpMap.get(empIdStr);
          req.userId = req.employeeId;
          req.employeeId = canonicalEmpId;
          await req.save();
          leaveRequestsMigrated++;
        } else if (empIdSet.has(empIdStr) && !req.userId) {
          const matchingEmp = employees.find((e) => e._id.toString() === empIdStr);
          if (matchingEmp?.userId) {
            req.userId = matchingEmp.userId;
            await req.save();
          }
        }
      }

      // 4. Migrate LeaveBalance
      const leaveBalances = await LeaveBalance.find({ organizationId: org._id });
      for (const bal of leaveBalances) {
        const empIdStr = bal.employeeId?.toString();
        if (!empIdSet.has(empIdStr) && userToEmpMap.has(empIdStr)) {
          const canonicalEmpId = userToEmpMap.get(empIdStr);
          bal.userId = bal.employeeId;
          bal.employeeId = canonicalEmpId;
          await bal.save();
          leaveBalancesMigrated++;
        } else if (empIdSet.has(empIdStr) && !bal.userId) {
          const matchingEmp = employees.find((e) => e._id.toString() === empIdStr);
          if (matchingEmp?.userId) {
            bal.userId = matchingEmp.userId;
            await bal.save();
          }
        }
      }
    }

    console.log('[Migration] Migration completed successfully!');
    console.log(`[Migration] Stats:
  - Users verified/provisioned: ${totalUsersProvisioned}
  - Attendance records updated: ${attendanceMigrated}
  - Leave requests updated: ${leaveRequestsMigrated}
  - Leave balances updated: ${leaveBalancesMigrated}`);
  } catch (err) {
    console.error('[Migration] Failed:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('[Migration] Disconnected from MongoDB.');
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
