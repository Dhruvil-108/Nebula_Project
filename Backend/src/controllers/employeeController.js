const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const EmployeeDocument = require('../models/EmployeeDocument');
const Activity = require('../models/Activity');
const AttendanceRecord = require('../models/AttendanceRecord');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');
const { scopedFilter } = require('../middleware/tenant');
const { EMPLOYMENT_TYPES, EMPLOYEE_STATUSES } = require('../models/Employee');
const { DOC_TYPES } = require('../models/EmployeeDocument');
const {
  ensureLeaveBalancesForEmployee,
  getDayMidnightUtc,
  calculateWorkedMinutes,
} = require('../utils/attendanceUtils');

const MANAGER_FIELDS = 'fullName email role';
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isManagementRole = (role) =>
  ['super_admin', 'admin', 'manager', 'hr'].includes(role);

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/employees
// ─────────────────────────────────────────────────────────
const getEmployees = async (req, res) => {
  try {
    const { department, status, employmentType, search } = req.query;
    const extra = {};

    if (department) {
      if (!mongoose.Types.ObjectId.isValid(department)) {
        return res.status(400).json({ error: 'Invalid department filter.' });
      }
      extra.departmentId = department;
    }
    if (status && EMPLOYEE_STATUSES.includes(status)) extra.status = status;
    if (employmentType && EMPLOYMENT_TYPES.includes(employmentType)) {
      extra.employmentType = employmentType;
    }
    if (search && String(search).trim()) {
      const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
      extra.$or = [{ fullName: rx }, { employeeCode: rx }, { email: rx }, { designation: rx }];
    }

    const employees = await Employee.find(scopedFilter(req, extra))
      .populate('departmentId', 'name')
      .populate('managerId', 'fullName employeeCode')
      .populate('userId', MANAGER_FIELDS)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return res.json(employees);
  } catch (err) {
    console.error('[employeeController.getEmployees] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve employees.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/hr/employees
// ─────────────────────────────────────────────────────────
const createEmployee = async (req, res) => {
  try {
    const {
      employeeCode,
      fullName,
      email,
      phone,
      departmentId,
      designation,
      joiningDate,
      managerId,
      employmentType,
      status,
      skills,
      userId,
    } = req.body;

    if (!employeeCode || !String(employeeCode).trim()) {
      return res.status(400).json({ error: 'Employee code is required.' });
    }
    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (employmentType && !EMPLOYMENT_TYPES.includes(employmentType)) {
      return res.status(400).json({ error: 'Invalid employment type.' });
    }
    if (status && !EMPLOYEE_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid employee status.' });
    }
    for (const refId of [departmentId, managerId, userId].filter(Boolean)) {
      if (!mongoose.Types.ObjectId.isValid(refId)) {
        return res.status(400).json({ error: 'Invalid reference id supplied.' });
      }
    }

    const code = String(employeeCode).trim().toUpperCase();
    const existing = await Employee.findOne(scopedFilter(req, { employeeCode: code })).lean();
    if (existing) {
      return res.status(409).json({ error: `Employee code "${code}" already exists in this organization.` });
    }

    if (departmentId) {
      const dept = await Department.findOne(scopedFilter(req, { _id: departmentId })).lean();
      if (!dept) return res.status(404).json({ error: 'Department not found.' });
    }
    if (managerId) {
      const mgr = await Employee.findOne(scopedFilter(req, { _id: managerId })).lean();
      if (!mgr) return res.status(404).json({ error: 'Manager not found.' });
    }
    if (userId) {
      const linked = await User.findOne({ _id: userId, organizationId: req.organizationId }).lean();
      if (!linked) return res.status(404).json({ error: 'Linked account not found.' });
      const alreadyLinked = await Employee.findOne(scopedFilter(req, { userId })).lean();
      if (alreadyLinked) {
        return res.status(409).json({ error: 'That account is already linked to another employee record.' });
      }
    }

    const employee = await Employee.create({
      organizationId: req.organizationId,
      employeeCode: code,
      fullName: String(fullName).trim(),
      email: email ? String(email).trim().toLowerCase() : '',
      phone: phone ? String(phone).trim() : '',
      departmentId: departmentId || null,
      designation: designation ? String(designation).trim() : '',
      joiningDate: joiningDate ? new Date(joiningDate) : null,
      managerId: managerId || null,
      employmentType: employmentType || 'full_time',
      status: status || 'active',
      skills: Array.isArray(skills) ? skills.map((s) => String(s).trim()).filter(Boolean) : [],
      userId: userId || null,
    });

    // Seed leave balances so the new employee starts with quotas.
    // Attendance/leave records are keyed by the linked User id when one
    // exists (check-in flows use req.user._id), so seed under the same key.
    const balanceKey = employee.userId || employee._id;
    await ensureLeaveBalancesForEmployee(req.organizationId, balanceKey, new Date().getUTCFullYear());

    const populated = await Employee.findById(employee._id)
      .populate('departmentId', 'name')
      .populate('managerId', 'fullName employeeCode')
      .populate('userId', MANAGER_FIELDS)
      .lean();

    return res.status(201).json(populated);
  } catch (err) {
    console.error('[employeeController.createEmployee] Error:', err);
    return res.status(500).json({ error: 'Failed to create employee.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/employees/:id — detail + documents + attendance + balances
// ─────────────────────────────────────────────────────────
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid employee id.' });
    }

    // Employees can view their own record; managers/HR/admin see everyone
    if (!isManagementRole(req.user.role)) {
      const self = await Employee.findOne(scopedFilter(req, { userId: req.user._id })).lean();
      if (!self || self._id.toString() !== id) {
        return res.status(403).json({ error: 'Access denied. You can only view your own employee record.' });
      }
    }

    const employee = await Employee.findOne(scopedFilter(req, { _id: id }))
      .populate('departmentId', 'name')
      .populate('managerId', 'fullName employeeCode designation')
      .populate('userId', MANAGER_FIELDS)
      .lean();

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const year = new Date().getUTCFullYear();
    const [documents, activities, leaveBalances, recentAttendance] = await Promise.all([
      EmployeeDocument.find(scopedFilter(req, { employeeId: employee._id }))
        .populate('uploadedBy', MANAGER_FIELDS)
        .sort({ createdAt: -1 })
        .lean(),
      Activity.find({ organizationId: req.organizationId, relatedToType: 'employee', relatedToId: employee._id })
        .populate('createdBy', MANAGER_FIELDS)
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      ensureLeaveBalancesForEmployee(req.organizationId, employee._id, year).then(() =>
        LeaveBalance.find({ organizationId: req.organizationId, employeeId: employee._id, year })
          .populate('leaveTypeId', 'name annualQuota')
          .lean()
      ),
      AttendanceRecord.find({ organizationId: req.organizationId, employeeId: employee._id })
        .sort({ date: -1 })
        .limit(7)
        .lean(),
    ]);

    return res.json({
      ...employee,
      documents,
      activities,
      leaveBalances: leaveBalances.map((b) => ({
        _id: b._id,
        leaveType: b.leaveTypeId?.name || 'Leave',
        allocated: b.allocated || 0,
        used: b.used || 0,
        remaining: Math.max(0, (b.allocated || 0) - (b.used || 0)),
      })),
      recentAttendance: recentAttendance.map((r) => ({
        _id: r._id,
        date: r.date,
        status: r.status,
        checkInAt: r.checkInAt,
        checkOutAt: r.checkOutAt,
        totalWorkedMinutes: r.checkOutAt
          ? r.totalWorkedMinutes
          : calculateWorkedMinutes(r, new Date()),
        isLate: r.isLate,
      })),
    });
  } catch (err) {
    console.error('[employeeController.getEmployeeById] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve employee.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/hr/employees/:id
// ─────────────────────────────────────────────────────────
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid employee id.' });
    }

    const allowedFields = [
      'fullName', 'email', 'phone', 'departmentId', 'designation', 'joiningDate',
      'managerId', 'employmentType', 'status', 'skills', 'userId',
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'email' && req.body[field]) {
          updates[field] = String(req.body[field]).trim().toLowerCase();
        } else if (field === 'joiningDate') {
          updates[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else if (field === 'skills') {
          updates[field] = Array.isArray(req.body[field])
            ? req.body[field].map((s) => String(s).trim()).filter(Boolean)
            : [];
        } else if (typeof req.body[field] === 'string') {
          updates[field] = req.body[field].trim();
        } else {
          updates[field] = req.body[field];
        }
      }
    }

    if (updates.employmentType && !EMPLOYMENT_TYPES.includes(updates.employmentType)) {
      return res.status(400).json({ error: 'Invalid employment type.' });
    }
    if (updates.status && !EMPLOYEE_STATUSES.includes(updates.status)) {
      return res.status(400).json({ error: 'Invalid employee status.' });
    }

    // Validate referenced ids (mirrors createEmployee checks)
    if (updates.departmentId) {
      const dept = await Department.findOne(scopedFilter(req, { _id: updates.departmentId })).lean();
      if (!dept) return res.status(404).json({ error: 'Department not found.' });
    }
    if (updates.managerId) {
      if (updates.managerId === id) {
        return res.status(400).json({ error: 'An employee cannot be their own manager.' });
      }
      const mgr = await Employee.findOne(scopedFilter(req, { _id: updates.managerId })).lean();
      if (!mgr) return res.status(404).json({ error: 'Manager not found.' });
    }
    if (updates.userId) {
      if (!mongoose.Types.ObjectId.isValid(updates.userId)) {
        return res.status(400).json({ error: 'Invalid linked account id.' });
      }
      const linked = await User.findOne({ _id: updates.userId, organizationId: req.organizationId }).lean();
      if (!linked) return res.status(404).json({ error: 'Linked account not found.' });
      const alreadyLinked = await Employee.findOne(scopedFilter(req, { userId: updates.userId, _id: { $ne: id } })).lean();
      if (alreadyLinked) {
        return res.status(409).json({ error: 'That account is already linked to another employee record.' });
      }
    }

    const employee = await Employee.findOneAndUpdate(
      scopedFilter(req, { _id: id }),
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('departmentId', 'name')
      .populate('managerId', 'fullName employeeCode')
      .populate('userId', MANAGER_FIELDS)
      .lean();

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    return res.json(employee);
  } catch (err) {
    console.error('[employeeController.updateEmployee] Error:', err);
    return res.status(500).json({ error: 'Failed to update employee.' });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/hr/employees/:id
// ─────────────────────────────────────────────────────────
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid employee id.' });
    }

    const employee = await Employee.findOneAndDelete(scopedFilter(req, { _id: id }));
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Cascade-delete dependent records and clear dangling references.
    // Leave/attendance records may be keyed by the Employee id OR the linked
    // User id (legacy duality) — clean up both.
    const linkedUserId = employee.userId;
    const leaveSubjectIds = linkedUserId ? [employee._id, linkedUserId] : [employee._id];

    await Promise.all([
      EmployeeDocument.deleteMany(scopedFilter(req, { employeeId: id })),
      Activity.deleteMany(scopedFilter(req, { relatedToType: 'employee', relatedToId: id })),
      AttendanceRecord.deleteMany({
        organizationId: req.organizationId,
        employeeId: { $in: leaveSubjectIds },
      }),
      LeaveRequest.deleteMany({
        organizationId: req.organizationId,
        employeeId: { $in: leaveSubjectIds },
      }),
      LeaveBalance.deleteMany({
        organizationId: req.organizationId,
        employeeId: { $in: leaveSubjectIds },
      }),
      Employee.updateMany(scopedFilter(req, { managerId: id }), { $set: { managerId: null } }),
      Department.updateMany(scopedFilter(req, { headId: id }), { $set: { headId: null } }),
    ]);

    return res.json({ message: 'Employee deleted successfully.' });
  } catch (err) {
    console.error('[employeeController.deleteEmployee] Error:', err);
    return res.status(500).json({ error: 'Failed to delete employee.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/employees/:id/documents
// ─────────────────────────────────────────────────────────
const getEmployeeDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid employee id.' });
    }

    if (!isManagementRole(req.user.role)) {
      const self = await Employee.findOne(scopedFilter(req, { userId: req.user._id })).lean();
      if (!self || self._id.toString() !== id) {
        return res.status(403).json({ error: 'Access denied. You can only view your own documents.' });
      }
    }

    const docs = await EmployeeDocument.find(scopedFilter(req, { employeeId: id }))
      .populate('uploadedBy', MANAGER_FIELDS)
      .sort({ createdAt: -1 })
      .lean();

    return res.json(docs);
  } catch (err) {
    console.error('[employeeController.getEmployeeDocuments] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve documents.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/hr/employees/:id/documents
// ─────────────────────────────────────────────────────────
const uploadEmployeeDocument = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid employee id.' });
    }

    const { docType, fileName, fileUrl } = req.body;
    if (!fileName || !String(fileName).trim() || !fileUrl || !String(fileUrl).trim()) {
      return res.status(400).json({ error: 'File name and file URL are required.' });
    }
    if (docType && !DOC_TYPES.includes(docType)) {
      return res.status(400).json({ error: 'Invalid document type.' });
    }

    if (!isManagementRole(req.user.role)) {
      const self = await Employee.findOne(scopedFilter(req, { userId: req.user._id })).lean();
      if (!self || self._id.toString() !== id) {
        return res.status(403).json({ error: 'Access denied. You can only upload documents to your own employee record.' });
      }
    }

    const employee = await Employee.findOne(scopedFilter(req, { _id: id })).lean();
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const doc = await EmployeeDocument.create({
      organizationId: req.organizationId,
      employeeId: employee._id,
      docType: docType || 'other',
      fileName: String(fileName).trim(),
      fileUrl: String(fileUrl).trim(),
      uploadedBy: req.user._id,
    });

    const populated = await EmployeeDocument.findById(doc._id)
      .populate('uploadedBy', MANAGER_FIELDS)
      .lean();

    return res.status(201).json(populated);
  } catch (err) {
    console.error('[employeeController.uploadEmployeeDocument] Error:', err);
    return res.status(500).json({ error: 'Failed to upload document.' });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/hr/documents/:id
// ─────────────────────────────────────────────────────────
const deleteEmployeeDocument = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid document id.' });
    }

    const doc = await EmployeeDocument.findOne(scopedFilter(req, { _id: id }));
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    if (!isManagementRole(req.user.role)) {
      const self = await Employee.findOne(scopedFilter(req, { userId: req.user._id })).lean();
      if (!self || doc.employeeId.toString() !== self._id.toString()) {
        return res.status(403).json({ error: 'Access denied. You can only delete your own documents.' });
      }
    }

    await doc.deleteOne();
    return res.json({ message: 'Document deleted successfully.' });
  } catch (err) {
    console.error('[employeeController.deleteEmployeeDocument] Error:', err);
    return res.status(500).json({ error: 'Failed to delete document.' });
  }
};

module.exports = {
  getEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeeDocuments,
  uploadEmployeeDocument,
  deleteEmployeeDocument,
};
