const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const JobOpening = require('../models/JobOpening');
const JobOffer = require('../models/JobOffer');
const Employee = require('../models/Employee');
const EmployeeDocument = require('../models/EmployeeDocument');
const RecruitmentActivity = require('../models/RecruitmentActivity');
const { scopedFilter } = require('../middleware/tenant');

const counterService = require('../services/counterService');

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/candidates/:id/onboard-employee
// Converts a candidate into an HRMS Employee record atomically
// ─────────────────────────────────────────────────────────
const onboardCandidateToEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      employeeCode,
      joiningDate,
      departmentId,
      designation,
      managerId,
      employmentType,
      skills,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid candidate id.' });
    }

    const candidate = await Candidate.findOne(scopedFilter(req, { _id: id }))
      .populate('jobOpeningId')
      .populate('referredBy');

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    if (candidate.convertedEmployeeId) {
      return res.status(400).json({
        error: 'Candidate has already been converted to an Employee.',
        employeeId: candidate.convertedEmployeeId,
      });
    }

    // Lookup corresponding offer (if any)
    const offer = await JobOffer.findOne(scopedFilter(req, { candidateId: id })).lean();

    // Determine final attributes
    const finalDepartmentId =
      departmentId || offer?.departmentId || candidate.jobOpeningId?.departmentId;
    const finalDesignation =
      designation || offer?.designation || candidate.jobOpeningId?.title || 'Team Member';
    const finalJoiningDate =
      joiningDate || offer?.joiningDate || new Date();
    const finalEmploymentType =
      employmentType || candidate.jobOpeningId?.employmentType || 'full_time';
    const finalEmployeeCode =
      employeeCode && employeeCode.trim()
        ? employeeCode.trim().toUpperCase()
        : await counterService.generateEmployeeCode(req.organizationId);

    // Verify employeeCode uniqueness in organization
    const existingEmp = await Employee.findOne({
      organizationId: req.organizationId,
      employeeCode: finalEmployeeCode,
    }).lean();

    if (existingEmp) {
      return res.status(400).json({
        error: `Employee code "${finalEmployeeCode}" already exists. Please choose another code.`,
      });
    }

    // 1. Create Employee Record
    const newEmployee = await Employee.create({
      organizationId: req.organizationId,
      employeeCode: finalEmployeeCode,
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone,
      departmentId: finalDepartmentId,
      designation: finalDesignation,
      joiningDate: new Date(finalJoiningDate),
      managerId: managerId && mongoose.Types.ObjectId.isValid(managerId) ? managerId : null,
      employmentType: finalEmploymentType,
      status: 'active',
      skills: Array.isArray(skills) && skills.length > 0 ? skills : candidate.skills || [],
    });

    // 2. Transfer Documents if present
    if (candidate.resumeUrl) {
      await EmployeeDocument.create({
        organizationId: req.organizationId,
        employeeId: newEmployee._id,
        docType: 'other',
        fileName: candidate.resumeFileName || `${candidate.fullName} Resume.pdf`,
        fileUrl: candidate.resumeUrl,
        uploadedBy: req.user._id,
      });
    }

    if (offer?.offerLetterUrl) {
      await EmployeeDocument.create({
        organizationId: req.organizationId,
        employeeId: newEmployee._id,
        docType: 'offer_letter',
        fileName: `Signed Offer - ${candidate.fullName}.pdf`,
        fileUrl: offer.offerLetterUrl,
        uploadedBy: req.user._id,
      });
    }

    // 3. Update Candidate stage to 'hired'
    candidate.stage = 'hired';
    candidate.convertedEmployeeId = newEmployee._id;
    candidate.hiredAt = new Date();
    candidate.stageHistory.push({
      fromStage: candidate.stage,
      toStage: 'hired',
      changedBy: req.user._id,
      changedAt: new Date(),
      note: `Onboarded as Employee ${newEmployee.employeeCode} (${newEmployee.designation})`,
    });
    await candidate.save();

    // 4. Update Job Opening metrics
    if (candidate.jobOpeningId) {
      await JobOpening.findOneAndUpdate(
        scopedFilter(req, { _id: candidate.jobOpeningId._id }),
        { $inc: { filledPositions: 1 } }
      );
    }

    // 5. Update Offer Status to 'accepted' if not already
    if (offer && offer.status !== 'accepted') {
      await JobOffer.findOneAndUpdate(
        scopedFilter(req, { _id: offer._id }),
        { $set: { status: 'accepted', respondedAt: new Date() } }
      );
    }

    // 6. Log Activity
    await RecruitmentActivity.create({
      organizationId: req.organizationId,
      candidateId: candidate._id,
      jobOpeningId: candidate.jobOpeningId?._id,
      type: 'converted_to_employee',
      title: 'Candidate Onboarded to HRMS',
      description: `${candidate.fullName} onboarded as Employee ${newEmployee.employeeCode} in ${newEmployee.designation}.`,
      performedBy: req.user._id,
      metadata: { employeeId: newEmployee._id, employeeCode: newEmployee.employeeCode },
    });

    const populatedEmployee = await Employee.findById(newEmployee._id)
      .populate('departmentId', 'name')
      .populate('managerId', 'fullName employeeCode')
      .lean();

    return res.status(201).json({
      message: 'Candidate successfully onboarded as HRMS Employee.',
      employee: populatedEmployee,
      candidateId: candidate._id,
    });
  } catch (err) {
    console.error('[hiringHrmsBridgeController.onboardCandidateToEmployee] Error:', err);
    return res.status(500).json({ error: 'Failed to onboard candidate to employee.' });
  }
};

module.exports = {
  onboardCandidateToEmployee,
};
