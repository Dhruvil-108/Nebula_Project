const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const JobOffer = require('../models/JobOffer');
const JobOpening = require('../models/JobOpening');
const Employee = require('../models/Employee');
const RecruitmentActivity = require('../models/RecruitmentActivity');

class OnboardingBridgeService {
  /**
   * Generates a unique employee code for the organization
   */
  async generateEmployeeCode(organizationId) {
    const orgOid = new mongoose.Types.ObjectId(organizationId);
    const count = await Employee.countDocuments({ organizationId: orgOid });
    const year = new Date().getFullYear();
    const sequentialNum = String(count + 1).padStart(4, '0');
    return `EMP-${year}-${sequentialNum}`;
  }

  /**
   * Automatically provisions a new HRMS Employee from a hired candidate & accepted offer
   * @param {string|ObjectId} candidateId
   * @param {string|ObjectId} [jobOfferId]
   * @param {Object} [performedByUser] - User performing the action (system if automated)
   */
  async provisionEmployeeFromCandidate(candidateId, jobOfferId = null, performedByUser = null) {
    const candOid = new mongoose.Types.ObjectId(candidateId);
    const candidate = await Candidate.findById(candOid);

    if (!candidate) {
      throw new Error('Candidate not found.');
    }

    if (candidate.convertedEmployeeId) {
      const existingEmployee = await Employee.findById(candidate.convertedEmployeeId);
      return {
        alreadyConverted: true,
        employee: existingEmployee,
        candidate,
      };
    }

    // Retrieve active offer if present
    let offer = null;
    if (jobOfferId) {
      offer = await JobOffer.findById(jobOfferId);
    } else {
      offer = await JobOffer.findOne({
        candidateId: candOid,
        status: { $in: ['accepted', 'signed', 'approved'] },
      }).sort({ createdAt: -1 });
    }

    // Retrieve job opening
    const jobOpening = candidate.jobOpeningId
      ? await JobOpening.findById(candidate.jobOpeningId)
      : offer?.jobOpeningId
      ? await JobOpening.findById(offer.jobOpeningId)
      : null;

    const employeeCode = await this.generateEmployeeCode(candidate.organizationId);

    const departmentId = offer?.departmentId || jobOpening?.departmentId || null;
    const designation = offer?.designation || jobOpening?.title || candidate.currentDesignation || 'New Hire';
    const joiningDate = offer?.joiningDate || new Date();

    // Create HRMS Employee record
    const employee = await Employee.create({
      organizationId: candidate.organizationId,
      employeeCode,
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone || '',
      departmentId,
      designation,
      joiningDate,
      employmentType: jobOpening?.employmentType || 'full_time',
      status: 'active',
      skills: candidate.skills || [],
    });

    // Update candidate state
    candidate.stage = 'hired';
    candidate.status = 'hired';
    candidate.hiredAt = new Date();
    candidate.convertedEmployeeId = employee._id;
    if (!candidate.stageHistory) candidate.stageHistory = [];
    candidate.stageHistory.push({
      fromStage: candidate.stage,
      toStage: 'hired',
      changedBy: performedByUser?._id || null,
      changedAt: new Date(),
      notes: `Automatically transitioned to HRMS Employee (${employeeCode})`,
    });
    await candidate.save();

    // Update Job Opening headcount
    if (jobOpening) {
      jobOpening.filledPositions = (jobOpening.filledPositions || 0) + 1;
      if (jobOpening.filledPositions >= (jobOpening.openPositions || 1)) {
        jobOpening.status = 'closed';
        jobOpening.closedAt = new Date();
      }
      await jobOpening.save();
    }

    // Update Offer status if not already accepted/signed
    if (offer && offer.status !== 'accepted' && offer.status !== 'signed') {
      offer.status = 'accepted';
      await offer.save();
    }

    // Emit RecruitmentActivity audit record
    await RecruitmentActivity.create({
      organizationId: candidate.organizationId,
      candidateId: candidate._id,
      jobOpeningId: jobOpening?._id || null,
      type: 'converted_to_employee',
      title: `Candidate Provisioned as Employee (${employeeCode})`,
      description: `${candidate.fullName} has officially joined as ${designation} in HRMS.`,
      performedBy: {
        _id: performedByUser?._id || new mongoose.Types.ObjectId(),
        name: performedByUser?.name || 'Automated HRMS Bridge',
        email: performedByUser?.email || 'system@nebula.local',
        role: performedByUser?.role || 'system',
      },
      metadata: {
        employeeId: employee._id,
        employeeCode,
        joiningDate,
        jobOpeningId: jobOpening?._id,
        totalCtc: offer?.compensationBreakdown?.totalCtc || offer?.offeredSalary || 0,
      },
    });

    return {
      success: true,
      employee,
      candidate,
      jobOpening,
    };
  }
}

module.exports = new OnboardingBridgeService();
