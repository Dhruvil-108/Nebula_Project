/**
 * Compensation Governance Service
 * Calculates Total Cost to Company (CTC) and validates against salary bands.
 */

class CompensationService {
  /**
   * Calculates Total CTC from itemized breakdown components
   * Supports both flat and nested properties
   * @param {Object} breakdown
   * @returns {number}
   */
  calculateTotalCtc(breakdown = {}) {
    if (!breakdown || typeof breakdown !== 'object') return 0;

    const baseSalary = Number(breakdown.baseSalary) || 0;
    const variableBonus = Number(breakdown.variablePay ?? breakdown.variableBonus) || 0;
    const signOnBonus = Number(breakdown.signOnBonus) || 0;
    const relocationAllowance = Number(breakdown.relocation ?? breakdown.relocationAllowance) || 0;
    const equityValue = Number(breakdown.equityValue ?? breakdown.equity?.estimatedValue) || 0;

    let allowancesSum = 0;
    if (typeof breakdown.allowances === 'number') {
      allowancesSum = Number(breakdown.allowances) || 0;
    } else if (Array.isArray(breakdown.otherAllowances)) {
      allowancesSum = breakdown.otherAllowances.reduce(
        (acc, item) => acc + (Number(item?.amount) || 0),
        0
      );
    }

    return (
      baseSalary +
      variableBonus +
      signOnBonus +
      relocationAllowance +
      equityValue +
      allowancesSum
    );
  }

  /**
   * Checks compensation against job opening or benchmark salary band.
   * Tolerant to argument order: (jobOpening, totalCtc) or (totalCtc, jobOpening).
   * @param {Object|number} arg1
   * @param {Object|number} arg2
   * @returns {Object} bandGovernance result
   */
  checkBandGovernance(arg1, arg2) {
    let jobOpening = null;
    let totalCtc = 0;

    if (typeof arg1 === 'number') {
      totalCtc = arg1;
      jobOpening = arg2;
    } else {
      jobOpening = arg1;
      totalCtc = Number(arg2) || 0;
    }

    const salaryRange = jobOpening?.salaryRange || {};
    const bandMin = Number(salaryRange.min) || 0;
    const bandMax = Number(salaryRange.max) || 0;
    const bandMid = bandMin && bandMax ? Math.round((bandMin + bandMax) / 2) : bandMin || bandMax;

    let isDeviation = false;
    let deviationPercent = 0;

    if (bandMax > 0 && totalCtc > bandMax) {
      isDeviation = true;
      deviationPercent = Math.round(((totalCtc - bandMax) / bandMax) * 1000) / 10;
    }

    return {
      bandMin,
      bandMax,
      bandMid,
      isDeviation,
      isOutOfBand: isDeviation,
      deviationPercent,
      deviationPercentage: deviationPercent,
      requiresFinanceEscalation: isDeviation,
    };
  }

  /**
   * Generates dynamic approval chain for an offer.
   * If out-of-band deviation is flagged, an explicit finance_head approval step is mandated.
   * Supports both (isDeviation, approverIds) and ({ isOutOfBand, recruiterId, ... })
   * @param {boolean|Object} arg1
   * @param {Object} [arg2]
   * @returns {Array} approval steps
   */
  generateApprovalChain(arg1 = false, arg2 = {}) {
    let isDeviation = false;
    let approverIds = {};

    if (typeof arg1 === 'object' && arg1 !== null) {
      isDeviation = Boolean(arg1.isOutOfBand ?? arg1.isDeviation);
      approverIds = arg1;
    } else {
      isDeviation = Boolean(arg1);
      approverIds = arg2 || {};
    }

    const steps = [];
    let stepNum = 1;

    // Optional Step: Recruiter Initiation
    if (approverIds.recruiterId) {
      steps.push({
        stepNumber: stepNum++,
        role: 'recruiter',
        approverId: approverIds.recruiterId,
        status: 'approved',
        approvedAt: new Date(),
        comments: 'Offer draft initiated & submitted for review.',
      });
    }

    // Step: Hiring Manager Approval
    steps.push({
      stepNumber: stepNum++,
      role: 'hiring_manager',
      approverId: approverIds.hiringManagerId || null,
      status: 'pending',
      comments: '',
    });

    // Step: Finance Head Approval (mandatory if out-of-band deviation)
    if (isDeviation) {
      steps.push({
        stepNumber: stepNum++,
        role: 'finance_head',
        approverId: approverIds.financeHeadId || null,
        status: 'pending',
        comments: 'Automated Governance Escalation: Offer exceeds maximum compensation band.',
      });
    }

    // Final Step: HR Director Sign-off
    steps.push({
      stepNumber: stepNum++,
      role: 'hr_director',
      approverId: approverIds.hrDirectorId || null,
      status: 'pending',
      comments: '',
    });

    return steps;
  }
}

module.exports = new CompensationService();
