const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { getNextSequence } = require('../services/counterService');

/**
 * Resolves or auto-provisions a canonical Employee record for a User.
 * Ensures every active user in an organization has an Employee dossier.
 *
 * @param {string|mongoose.Types.ObjectId} organizationId
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<Employee>} The canonical Employee document
 */
async function resolveEmployeeFromUser(organizationId, userId) {
  if (!organizationId || !userId) {
    throw new Error('organizationId and userId are required to resolve employee');
  }

  // 1. Look for existing Employee directly linked to this userId
  let employee = await Employee.findOne({
    organizationId,
    userId,
  });

  if (employee) {
    return employee;
  }

  // 2. Look up the User details
  const user = await User.findOne({ _id: userId, organizationId }).lean();
  if (!user) {
    throw new Error(`User ${userId} not found in organization ${organizationId}`);
  }

  // 3. Fallback: Check if an Employee already exists with the same email
  if (user.email) {
    employee = await Employee.findOne({
      organizationId,
      email: user.email.toLowerCase(),
    });

    if (employee) {
      // Link the userId to this employee
      if (!employee.userId) {
        employee.userId = user._id;
        await employee.save();
      }
      return employee;
    }
  }

  // 4. Auto-provision canonical Employee record for this User
  const nextSeq = await getNextSequence(organizationId, 'employee', 101);
  const employeeCode = `EMP-${String(nextSeq).padStart(3, '0')}`;

  const roleTitleMap = {
    super_admin: 'Executive Director',
    admin: 'Operations Lead',
    manager: 'Team Manager',
    hr: 'People Operations Manager',
    recruiter: 'Talent Acquisition Specialist',
    finance: 'Finance Specialist',
    sales: 'Account Executive',
    inventory_manager: 'Supply Chain Lead',
    employee: 'Team Associate',
    intern: 'Intern',
  };

  employee = await Employee.create({
    organizationId,
    userId: user._id,
    employeeCode,
    fullName: user.fullName || user.email.split('@')[0],
    email: user.email ? user.email.toLowerCase() : '',
    phone: user.phone || '',
    designation: roleTitleMap[user.role] || 'Team Associate',
    joiningDate: user.createdAt || new Date(),
    employmentType: user.role === 'intern' ? 'intern' : 'full_time',
    status: user.status === 'disabled' ? 'exited' : 'active',
  });

  return employee;
}

/**
 * Resolves the linked userId from an Employee ID.
 *
 * @param {string|mongoose.Types.ObjectId} organizationId
 * @param {string|mongoose.Types.ObjectId} employeeId
 * @returns {Promise<mongoose.Types.ObjectId|null>}
 */
async function resolveUserFromEmployee(organizationId, employeeId) {
  if (!organizationId || !employeeId) return null;
  const employee = await Employee.findOne({ _id: employeeId, organizationId }).select('userId').lean();
  return employee?.userId || null;
}

module.exports = {
  resolveEmployeeFromUser,
  resolveUserFromEmployee,
};
