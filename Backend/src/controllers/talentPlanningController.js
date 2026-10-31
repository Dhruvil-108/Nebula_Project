const mongoose = require('mongoose');
const Skill = require('../models/Skill');
const EmployeeSkill = require('../models/EmployeeSkill');
const Training = require('../models/Training');
const HeadcountPlan = require('../models/HeadcountPlan');
const ManpowerRequisition = require('../models/ManpowerRequisition');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
require('../models/Designation');
const LifecycleService = require('../services/lifecycleService');

const getOrganizationId = (req) => req.organizationId || req.user?.organizationId;
const isValidId = (value) => mongoose.Types.ObjectId.isValid(value);

// ── SKILLS & COMPETENCIES ──

exports.getSkills = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    let skills = await Skill.find({ organizationId, isActive: true }).sort({ name: 1 });

    // Seed standard skills if empty
    if (skills.length === 0) {
      await Skill.insertMany([
        { organizationId, name: 'React & TypeScript', category: 'technical', description: 'Modern UI frontend engineering' },
        { organizationId, name: 'Node.js & Express API Design', category: 'technical', description: 'RESTful backend services' },
        { organizationId, name: 'Cloud Architecture (AWS/GCP)', category: 'technical', description: 'Distributed infrastructure' },
        { organizationId, name: 'Agile Team Leadership', category: 'leadership', description: 'Sprint facilitation and stakeholder management' },
        { organizationId, name: 'Enterprise Sales Strategy', category: 'functional', description: 'B2B enterprise pipeline conversion' },
        { organizationId, name: 'Financial Modeling & Budgeting', category: 'functional', description: 'Cost analysis and forecast modeling' },
      ]);
      skills = await Skill.find({ organizationId, isActive: true }).sort({ name: 1 });
    }

    return res.json({ success: true, count: skills.length, data: skills });
  } catch (error) {
    console.error('getSkills error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createSkill = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { name, category, description } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Skill name is required' });

    const skill = await Skill.create({
      organizationId,
      name,
      category: category || 'technical',
      description: description || '',
    });

    return res.status(201).json({ success: true, data: skill });
  } catch (error) {
    console.error('createSkill error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getEmployeeSkills = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { employeeId } = req.query;

    const query = { organizationId };
    if (employeeId) {
      if (!isValidId(employeeId)) {
        return res.status(400).json({ success: false, message: 'employeeId must be a valid ID' });
      }
      query.employeeId = employeeId;
    }

    const empSkills = await EmployeeSkill.find(query)
      .populate({
        path: 'employeeId',
        select: 'fullName employeeCode designation grade departmentId avatar',
        populate: { path: 'departmentId', select: 'name' },
      })
      .populate('skillId', 'name category')
      .sort({ updatedAt: -1 });

    return res.json({ success: true, count: empSkills.length, data: empSkills });
  } catch (error) {
    console.error('getEmployeeSkills error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.upsertEmployeeSkill = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);
    const { employeeId, skillId, proficiencyLevel, yearsOfExperience, certifications } = req.body;

    if (!employeeId || !skillId) {
      return res.status(400).json({ success: false, message: 'employeeId and skillId are required' });
    }
    if (!isValidId(employeeId) || !isValidId(skillId)) {
      return res.status(400).json({ success: false, message: 'employeeId and skillId must be valid IDs' });
    }

    const [employee, skill] = await Promise.all([
      Employee.exists({ _id: employeeId, organizationId }),
      Skill.exists({ _id: skillId, organizationId, isActive: true }),
    ]);
    if (!employee || !skill) {
      return res.status(404).json({ success: false, message: 'Employee or skill was not found in this organization' });
    }

    const doc = await EmployeeSkill.findOneAndUpdate(
      { organizationId, employeeId, skillId },
      {
        organizationId,
        employeeId,
        skillId,
        proficiencyLevel: proficiencyLevel ? Number(proficiencyLevel) : 2,
        yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : 1,
        certifications: certifications || [],
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .populate('skillId', 'name category')
      .populate('employeeId', 'fullName employeeCode');

    return res.json({ success: true, data: doc });
  } catch (error) {
    console.error('upsertEmployeeSkill error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyEmployeeSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid employee skill ID' });
    }
    const doc = await EmployeeSkill.findOneAndUpdate(
      { _id: id, organizationId },
      { verifiedByManager: true, verifiedAt: new Date() },
      { new: true }
    )
      .populate('skillId', 'name category')
      .populate('employeeId', 'fullName employeeCode');

    if (!doc) return res.status(404).json({ success: false, message: 'Employee skill record not found' });
    return res.json({ success: true, data: doc });
  } catch (error) {
    console.error('verifyEmployeeSkill error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── TRAINING & LEARNING ──

exports.getTrainings = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    let trainings = await Training.find({ organizationId }).sort({ scheduledDate: -1 });

    // Seed standard trainings if empty
    if (trainings.length === 0) {
      await Training.insertMany([
        {
          organizationId,
          title: 'Secure Coding & OWASP Enterprise Guidelines',
          category: 'security',
          trainer: 'Security Architecture Guild',
          durationHours: 6,
          format: 'virtual_live',
          status: 'upcoming',
          scheduledDate: new Date(Date.now() + 14 * 86400000),
          maxCapacity: 40,
        },
        {
          organizationId,
          title: 'High-Velocity Product Management & OKRs',
          category: 'leadership',
          trainer: 'VP of Product',
          durationHours: 4,
          format: 'hybrid',
          status: 'upcoming',
          scheduledDate: new Date(Date.now() + 21 * 86400000),
          maxCapacity: 25,
        },
      ]);
      trainings = await Training.find({ organizationId }).sort({ scheduledDate: -1 });
    }

    return res.json({ success: true, count: trainings.length, data: trainings });
  } catch (error) {
    console.error('getTrainings error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTraining = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { title, description, category, trainer, durationHours, format, scheduledDate, maxCapacity } = req.body;

    if (!title) return res.status(400).json({ success: false, message: 'title is required' });

    const training = await Training.create({
      organizationId,
      title,
      description: description || '',
      category: category || 'technical',
      trainer: trainer || 'Internal Staff',
      durationHours: durationHours ? Number(durationHours) : 4,
      format: format || 'online_self_paced',
      scheduledDate: scheduledDate || null,
      maxCapacity: maxCapacity ? Number(maxCapacity) : 50,
      status: 'upcoming',
    });

    return res.status(201).json({ success: true, data: training });
  } catch (error) {
    console.error('createTraining error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.enrollInTraining = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;
    const organizationId = req.user.organizationId;

    if (!isValidId(id) || !employeeId || !isValidId(employeeId)) {
      return res.status(400).json({ success: false, message: 'A valid training ID and employeeId are required' });
    }
    const training = await Training.findOne({ _id: id, organizationId });
    if (!training) return res.status(404).json({ success: false, message: 'Training not found' });
    if (!(await Employee.exists({ _id: employeeId, organizationId }))) {
      return res.status(404).json({ success: false, message: 'Employee not found in this organization' });
    }

    const isEnrolled = (training.enrollments || []).some(
      (e) => e.employeeId?.toString() === employeeId.toString()
    );

    if (isEnrolled) {
      return res.status(400).json({ success: false, message: 'Employee is already enrolled in this training' });
    }

    training.enrollments.push({
      employeeId,
      status: 'enrolled',
      enrolledAt: new Date(),
    });

    await training.save();
    return res.json({ success: true, data: training });
  } catch (error) {
    console.error('enrollInTraining error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEnrollmentStatus = async (req, res) => {
  try {
    const { id, enrollmentId } = req.params;
    const { status, score, feedback } = req.body;
    const organizationId = req.user.organizationId;

    if (!isValidId(id) || !isValidId(enrollmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid training or enrollment ID' });
    }
    const training = await Training.findOne({ _id: id, organizationId });
    if (!training) return res.status(404).json({ success: false, message: 'Training not found' });

    const enrollment = training.enrollments.id(enrollmentId);
    if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });

    if (status) {
      if (!['enrolled', 'in_progress', 'completed', 'dropped'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid enrollment status' });
      }
      enrollment.status = status;
      if (status === 'completed') enrollment.completedAt = new Date();
    }
    if (score !== undefined) enrollment.score = Number(score);
    if (feedback !== undefined) enrollment.feedback = feedback;

    await training.save();
    return res.json({ success: true, data: training });
  } catch (error) {
    console.error('updateEnrollmentStatus error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── HEADCOUNT PLANNING ──

exports.getHeadcountPlans = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { period, fiscalYear } = req.query;

    const query = { organizationId };
    if (period || fiscalYear) query.period = period || `FY${fiscalYear}`;

    const plans = await HeadcountPlan.find(query)
      .populate('departmentId', 'name')
      .sort({ period: -1 });

    return res.json({ success: true, count: plans.length, data: plans });
  } catch (error) {
    console.error('getHeadcountPlans error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.upsertHeadcountPlan = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      departmentId,
      period,
      fiscalYear,
      targetHeadcount,
      allocatedBudget,
      budgetAllocated,
      notes,
    } = req.body;

    if (!departmentId) return res.status(400).json({ success: false, message: 'departmentId is required' });
    if (!isValidId(departmentId)) {
      return res.status(400).json({ success: false, message: 'departmentId must be a valid ID' });
    }
    if (!(await Department.exists({ _id: departmentId, organizationId }))) {
      return res.status(404).json({ success: false, message: 'Department not found in this organization' });
    }
    const planPeriod = period || (fiscalYear ? `FY${fiscalYear}` : 'FY2026');

    const plan = await HeadcountPlan.findOneAndUpdate(
      { organizationId, departmentId, period: planPeriod },
      {
        organizationId,
        departmentId,
        period: planPeriod,
        targetHeadcount: targetHeadcount !== undefined ? Number(targetHeadcount) : 10,
        budgetAllocated: allocatedBudget !== undefined ? Number(allocatedBudget) : (budgetAllocated !== undefined ? Number(budgetAllocated) : 0),
        notes: notes || '',
        status: 'active',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate('departmentId', 'name');

    return res.json({ success: true, data: plan });
  } catch (error) {
    console.error('upsertHeadcountPlan error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getHeadcountAnalytics = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const departments = await Department.find({ organizationId });

    const analytics = await Promise.all(
      departments.map(async (dept) => {
        const [plan, actualCount, openReqs] = await Promise.all([
          HeadcountPlan.findOne({ organizationId, departmentId: dept._id, status: 'active' }),
          Employee.countDocuments({ organizationId, departmentId: dept._id, status: 'active' }),
          ManpowerRequisition.countDocuments({ organizationId, departmentId: dept._id, status: { $in: ['approved', 'job_opened'] } }),
        ]);

        const target = plan?.targetHeadcount || actualCount;
        const gap = target - actualCount;

        return {
          departmentId: dept._id,
          departmentName: dept.name,
          targetHeadcount: target,
          actualHeadcount: actualCount,
          openRequisitions: openReqs,
          headcountGap: gap > 0 ? gap : 0,
          budgetAllocated: plan?.budgetAllocated || 0,
        };
      })
    );

    return res.json({
      success: true,
      data: {
        fiscalYear: Number(String(req.query.fiscalYear || '').replace('FY', '')) || new Date().getFullYear(),
        totalCurrentHeadcount: analytics.reduce((sum, row) => sum + row.actualHeadcount, 0),
        totalTargetHeadcount: analytics.reduce((sum, row) => sum + row.targetHeadcount, 0),
        totalAllocatedBudget: analytics.reduce((sum, row) => sum + row.budgetAllocated, 0),
        totalUtilizedBudget: 0,
        gapCount: analytics.reduce((sum, row) => sum + row.headcountGap, 0),
        breakdown: analytics.map((row) => ({
          department: row.departmentName,
          current: row.actualHeadcount,
          target: row.targetHeadcount,
          gap: row.headcountGap,
          allocatedBudget: row.budgetAllocated,
          utilizedBudget: 0,
        })),
        departments: analytics,
      },
    });
  } catch (error) {
    console.error('getHeadcountAnalytics error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── MANPOWER REQUISITIONS ──

exports.getRequisitions = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { status, departmentId } = req.query;

    const query = { organizationId };
    if (status) query.status = status;
    if (departmentId) {
      if (!isValidId(departmentId)) {
        return res.status(400).json({ success: false, message: 'departmentId must be a valid ID' });
      }
      query.departmentId = departmentId;
    }

    const reqs = await ManpowerRequisition.find(query)
      .populate('departmentId', 'name')
      .populate('designationId', 'title gradeLevel')
      .populate('approvedBy', 'fullName email')
      .populate('linkedJobOpeningId', 'title status positions')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: reqs.length, data: reqs });
  } catch (error) {
    console.error('getRequisitions error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createRequisition = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      departmentId,
      designationId,
      title,
      jobTitle,
      openingsCount,
      headcount,
      justification,
      targetJoiningDate,
      requiredByDate,
      salaryRange,
      budgetPerHire,
      notes,
    } = req.body;
    const requisitionTitle = title || jobTitle;
    const joiningDate = targetJoiningDate || requiredByDate;

    if (!departmentId || !requisitionTitle || !joiningDate) {
      return res.status(400).json({ success: false, message: 'departmentId, title, and targetJoiningDate are required' });
    }
    if (!isValidId(departmentId) || (designationId && !isValidId(designationId))) {
      return res.status(400).json({ success: false, message: 'departmentId and designationId must be valid IDs' });
    }
    if (!(await Department.exists({ _id: departmentId, organizationId }))) {
      return res.status(404).json({ success: false, message: 'Department not found in this organization' });
    }

    const count = await ManpowerRequisition.countDocuments({ organizationId });
    const requisitionCode = `REQ-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

    const reqDoc = await ManpowerRequisition.create({
      organizationId,
      requisitionCode,
      departmentId,
      designationId: designationId || null,
      title: requisitionTitle,
      openingsCount: openingsCount !== undefined ? Number(openingsCount) : (headcount !== undefined ? Number(headcount) : 1),
      justification: justification || 'growth',
      targetJoiningDate: joiningDate,
      salaryRange: salaryRange || (budgetPerHire !== undefined ? { min: Number(budgetPerHire), max: Number(budgetPerHire) } : { min: 0, max: 0 }),
      status: 'pending_approval',
      notes: notes || '',
    });

    const populated = await ManpowerRequisition.findById(reqDoc._id)
      .populate('departmentId', 'name')
      .populate('designationId', 'title gradeLevel');

    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('createRequisition error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveRequisition = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    if (!isValidId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid requisition ID' });
    }
    const reqDoc = await ManpowerRequisition.findOne({ _id: id, organizationId });
    if (!reqDoc) return res.status(404).json({ success: false, message: 'Requisition not found' });

    reqDoc.status = 'approved';
    reqDoc.approvedBy = req.user._id;
    reqDoc.approvedAt = new Date();
    await reqDoc.save();

    // Auto-spawn Job Opening in ATS Recruitment
    await LifecycleService.spawnJobOpeningFromRequisition(reqDoc, organizationId, req.user._id);

    const populated = await ManpowerRequisition.findById(reqDoc._id)
      .populate('departmentId', 'name')
      .populate('designationId', 'title gradeLevel')
      .populate('linkedJobOpeningId', 'title status');

    return res.json({ success: true, data: populated });
  } catch (error) {
    console.error('approveRequisition error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
