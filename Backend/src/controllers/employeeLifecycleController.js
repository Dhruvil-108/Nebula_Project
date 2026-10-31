const Employee = require('../models/Employee');
const JobHistory = require('../models/JobHistory');
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const { logAuditEvent } = require('../services/auditService');

const canManage = (role) => ['super_admin', 'admin', 'hr', 'manager'].includes(role);

// ─────────────────────────────────────────────────────────
// POST /api/v1/hr/employees/:id/lifecycle
// Promote, transfer, change grade, or reassign manager
// ─────────────────────────────────────────────────────────
const promoteOrTransferEmployee = async (req, res) => {
  try {
    if (!canManage(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Only HR and managers can process employee lifecycle transitions.' });
    }

    const { id } = req.params;
    const {
      changeType,
      departmentId,
      designationId,
      designationTitle,
      grade,
      managerId,
      effectiveDate,
      reason,
    } = req.body;

    if (!changeType) {
      return res.status(400).json({ error: 'Change type is required.' });
    }

    const employee = await Employee.findOne({ _id: id, organizationId: req.organizationId });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Capture previous states
    const previousDepartmentId = employee.departmentId;
    const previousDesignation = employee.designation;
    const previousGrade = employee.grade || '';
    const previousManagerId = employee.managerId;

    // Apply updates
    if (departmentId !== undefined) {
      employee.departmentId = departmentId || null;
    }
    if (designationId) {
      employee.designationId = designationId;
      const desObj = await Designation.findById(designationId).lean();
      if (desObj) {
        employee.designation = desObj.title;
        if (!grade && desObj.gradeLevel) {
          employee.grade = desObj.gradeLevel;
        }
      }
    } else if (designationTitle !== undefined) {
      employee.designation = String(designationTitle).trim();
    }

    if (grade !== undefined) {
      employee.grade = String(grade).trim();
    }
    if (managerId !== undefined) {
      employee.managerId = managerId || null;
    }

    await employee.save();

    // Create immutable JobHistory entry
    const history = await JobHistory.create({
      organizationId: req.organizationId,
      employeeId: employee._id,
      changeType,
      previousDepartmentId,
      newDepartmentId: employee.departmentId,
      previousDesignation,
      newDesignation: employee.designation,
      previousGrade,
      newGrade: employee.grade,
      previousManagerId,
      newManagerId: employee.managerId,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      reason: reason ? String(reason).trim() : '',
      approvedBy: req.user._id,
    });

    await logAuditEvent({
      organizationId: req.organizationId,
      actorUserId: req.user._id,
      action: `employee.lifecycle.${changeType}`,
      entityType: 'JobHistory',
      entityId: history._id,
      before: {
        departmentId: previousDepartmentId,
        designation: previousDesignation,
        grade: previousGrade,
        managerId: previousManagerId,
      },
      after: {
        departmentId: employee.departmentId,
        designation: employee.designation,
        grade: employee.grade,
        managerId: employee.managerId,
        reason,
      },
      req,
    });

    const populatedHistory = await JobHistory.findById(history._id)
      .populate('previousDepartmentId', 'name')
      .populate('newDepartmentId', 'name')
      .populate('previousManagerId', 'fullName employeeCode')
      .populate('newManagerId', 'fullName employeeCode')
      .populate('approvedBy', 'fullName')
      .lean();

    return res.status(201).json({
      message: 'Employee lifecycle transition completed successfully.',
      employee: employee.toObject(),
      jobHistory: populatedHistory,
    });
  } catch (err) {
    console.error('[lifecycle.promoteOrTransferEmployee] Error:', err);
    return res.status(500).json({ error: 'Failed to process employee transition.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/employees/:id/job-history
// ─────────────────────────────────────────────────────────
const getEmployeeJobHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const history = await JobHistory.find({
      organizationId: req.organizationId,
      employeeId: id,
    })
      .populate('previousDepartmentId', 'name')
      .populate('newDepartmentId', 'name')
      .populate('previousManagerId', 'fullName employeeCode')
      .populate('newManagerId', 'fullName employeeCode')
      .populate('approvedBy', 'fullName')
      .sort({ effectiveDate: -1, createdAt: -1 })
      .lean();

    return res.json(history);
  } catch (err) {
    console.error('[lifecycle.getEmployeeJobHistory] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve job history.' });
  }
};

module.exports = {
  promoteOrTransferEmployee,
  getEmployeeJobHistory,
};
