const Goal = require('../models/Goal');
const ReviewCycle = require('../models/ReviewCycle');
const PerformanceReview = require('../models/PerformanceReview');
const AttritionRisk = require('../models/AttritionRisk');
const Employee = require('../models/Employee');
const JobHistory = require('../models/JobHistory');
const AttendanceRecord = require('../models/AttendanceRecord');
const LeaveRequest = require('../models/LeaveRequest');

/**
 * 9-Box Matrix Label Mapping
 * Matrix coordinates: Performance (1-3, X axis), Potential (1-3, Y axis)
 */
const NINE_BOX_MAP = {
  '1-1': 'Risk / Underperformer',
  '1-2': 'Dilemma / Inconsistent',
  '1-3': 'Enigma / High Potential',
  '2-1': 'Effective Professional',
  '2-2': 'Core Contributor',
  '2-3': 'Growth Player',
  '3-1': 'Trusted Master',
  '3-2': 'High Performer',
  '3-3': 'Future Leader / Star',
};

class PerformanceService {
  /**
   * Resolve 9-Box label from performance and potential scores (1-3)
   */
  static get9BoxLabel(perfScore, potScore) {
    const p = Math.max(1, Math.min(3, Math.round(perfScore || 2)));
    const pot = Math.max(1, Math.min(3, Math.round(potScore || 2)));
    return NINE_BOX_MAP[`${p}-${pot}`] || 'Core Contributor';
  }

  /**
   * Recalculate goal progress from its key results
   */
  static calculateGoalProgress(keyResults = []) {
    if (!keyResults || keyResults.length === 0) return 0;
    let totalWeightedProgress = 0;
    let totalWeight = 0;

    for (const kr of keyResults) {
      const weight = kr.weight || 1;
      const target = kr.targetValue || 1;
      const current = Math.min(kr.currentValue || 0, target);
      const krPct = target > 0 ? (current / target) * 100 : 0;
      totalWeightedProgress += krPct * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.min(100, Math.round(totalWeightedProgress / totalWeight)) : 0;
  }

  /**
   * Get 9-Box Distribution for an organization or department
   */
  static async getNineBoxGrid(organizationId, departmentId = null) {
    const query = { organizationId, status: { $in: ['in_calibration', 'completed'] } };

    const reviews = await PerformanceReview.find(query)
      .populate({
        path: 'employeeId',
        select: 'fullName employeeCode email avatar departmentId designation grade status',
        populate: { path: 'departmentId', select: 'name' },
      })
      .sort({ updatedAt: -1 });

    const filteredReviews = departmentId
      ? reviews.filter((r) => r.employeeId?.departmentId?._id?.toString() === departmentId.toString())
      : reviews;

    // Initialize 9 grid buckets
    const grid = {};
    for (let p = 1; p <= 3; p++) {
      for (let pot = 1; pot <= 3; pot++) {
        const key = `${p}-${pot}`;
        grid[key] = {
          perfScore: p,
          potScore: pot,
          label: NINE_BOX_MAP[key],
          count: 0,
          employees: [],
        };
      }
    }

    // Populate grid
    filteredReviews.forEach((rev) => {
      if (!rev.employeeId) return;
      const p = rev.calibration?.nineBoxGrid?.performanceScore || 2;
      const pot = rev.calibration?.nineBoxGrid?.potentialScore || 2;
      const key = `${p}-${pot}`;

      if (grid[key]) {
        grid[key].count += 1;
        grid[key].employees.push({
          reviewId: rev._id,
          employee: rev.employeeId,
          promotionRecommended: rev.calibration?.promotionRecommended || false,
          salaryIncrementPercentage: rev.calibration?.salaryIncrementPercentage || 0,
        });
      }
    });

    return {
      totalEmployees: filteredReviews.length,
      grid: Object.values(grid),
    };
  }

  /**
   * Compute Attrition Risk for an employee
   */
  static async computeEmployeeAttritionRisk(organizationId, employeeId) {
    const employee = await Employee.findOne({ _id: employeeId, organizationId });
    if (!employee) return null;

    let score = 15; // baseline low risk
    const factors = [];
    const interventions = [];

    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // 1. Attendance & Absenteeism analysis (past 90 days)
    const attendances = await AttendanceRecord.find({
      organizationId,
      employeeId,
      date: { $gte: ninetyDaysAgo },
    });

    const totalDays = attendances.length;
    const lateDays = attendances.filter((a) => a.isLate).length;
    const absentDays = attendances.filter((a) => a.status === 'absent').length;

    let attendanceStability = 100;
    if (totalDays > 0) {
      const lateRate = (lateDays / totalDays) * 100;
      if (lateRate > 25) {
        score += 18;
        attendanceStability -= 25;
        factors.push({
          factor: 'Frequent Late Clock-Ins',
          weight: 18,
          description: `${Math.round(lateRate)}% of shifts logged late in the last 90 days.`,
          metricValue: `${lateDays} late entries`,
        });
      }
      if (absentDays >= 3) {
        score += 20;
        attendanceStability -= 20;
        factors.push({
          factor: 'Unexcused Absenteeism',
          weight: 20,
          description: `${absentDays} unexcused absent shifts recorded in the last 90 days.`,
          metricValue: `${absentDays} absences`,
        });
      }
    }

    // 2. Leave Pattern Analysis
    const recentLeaves = await LeaveRequest.find({
      organizationId,
      employeeId,
      createdAt: { $gte: ninetyDaysAgo },
    });

    let leaveTrend = 'stable';
    if (recentLeaves.length >= 4) {
      score += 15;
      leaveTrend = 'increasing';
      factors.push({
        factor: 'Spike in Leave Requests',
        weight: 15,
        description: `${recentLeaves.length} leave requests filed in last 90 days (interviewing pattern indicator).`,
        metricValue: `${recentLeaves.length} leaves`,
      });
      interventions.push('Initiate an informal touchpoint to understand workload pressures.');
    }

    // 3. Compensation & Promotion Stagnation (JobHistory)
    const lastTransition = await JobHistory.findOne({
      organizationId,
      employeeId,
    }).sort({ effectiveDate: -1 });

    const baselineDate = lastTransition?.effectiveDate || employee.hireDate || employee.createdAt;
    const monthsStagnant = Math.max(0, Math.round((now.getTime() - new Date(baselineDate).getTime()) / (1000 * 60 * 60 * 24 * 30.4)));

    if (monthsStagnant > 24) {
      score += 25;
      factors.push({
        factor: 'Extended Career Stagnation',
        weight: 25,
        description: `No grade revision or promotion in ${monthsStagnant} months.`,
        metricValue: `${monthsStagnant} months`,
      });
      interventions.push('Evaluate eligibility for promotion to next grade level.');
      interventions.push('Review salary parity against internal designation pay bands.');
    } else if (monthsStagnant > 14) {
      score += 12;
      factors.push({
        factor: 'Role Tenure Maturing',
        weight: 12,
        description: `${monthsStagnant} months in current role without transition.`,
        metricValue: `${monthsStagnant} months`,
      });
    }

    // 4. Performance Review Momentum
    const latestReview = await PerformanceReview.findOne({
      organizationId,
      employeeId,
    }).sort({ createdAt: -1 });

    if (latestReview?.calibration?.nineBoxGrid?.boxLabel?.includes('Risk') ||
        latestReview?.calibration?.nineBoxGrid?.boxLabel?.includes('Dilemma')) {
      score += 20;
      factors.push({
        factor: 'Low Performance/Potential Calibration',
        weight: 20,
        description: `Calibrated as ${latestReview.calibration.nineBoxGrid.boxLabel} in latest review.`,
        metricValue: 'At Risk',
      });
      interventions.push('Implement a supportive 30-day Performance Improvement Plan (PIP).');
    }

    // Normalize final score (0–100)
    score = Math.max(5, Math.min(98, score));

    let riskLevel = 'low';
    if (score >= 75) riskLevel = 'critical';
    else if (score >= 50) riskLevel = 'high';
    else if (score >= 30) riskLevel = 'medium';

    if (interventions.length === 0) {
      interventions.push('Standard quarterly check-in and goal review.');
    }

    // Upsert into AttritionRisk collection
    const attritionRecord = await AttritionRisk.findOneAndUpdate(
      { organizationId, employeeId },
      {
        organizationId,
        employeeId,
        riskScore: score,
        riskLevel,
        contributingFactors: factors,
        suggestedInterventions: interventions,
        lastPromotedOrIncrementedMonths: monthsStagnant,
        attendanceStabilityScore: Math.max(0, attendanceStability),
        leaveFrequencyTrend: leaveTrend,
        computedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return attritionRecord;
  }

  /**
   * Batch refresh attrition risks for all active employees
   */
  static async computeAllAttritionRisks(organizationId) {
    const employees = await Employee.find({ organizationId, status: 'active' }).select('_id');
    const results = [];
    for (const emp of employees) {
      const res = await this.computeEmployeeAttritionRisk(organizationId, emp._id);
      if (res) results.push(res);
    }
    return results;
  }
}

module.exports = PerformanceService;
