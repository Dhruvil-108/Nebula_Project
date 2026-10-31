const Employee = require('../models/Employee');
const Goal = require('../models/Goal');
const ReviewCycle = require('../models/ReviewCycle');
const PerformanceReview = require('../models/PerformanceReview');
const AttritionRisk = require('../models/AttritionRisk');
const Department = require('../models/Department');
const AttendanceRecord = require('../models/AttendanceRecord');
const PerformanceService = require('./performanceService');

class HrmsCopilotService {
  /**
   * Process natural-language HR & People Operations query
   */
  static async queryCopilot(organizationId, user, prompt) {
    const query = (prompt || '').toLowerCase().trim();
    const isManagerOrAdmin = ['super_admin', 'admin', 'hr', 'manager'].includes(user?.role);

    let answer = '';
    let data = null;
    let intent = 'general';
    let suggestedFollowUps = [
      'Show high attrition risks',
      'Team goal progress status',
      '9-box talent calibration',
      'Top promotion candidates',
    ];

    // Intent 1: Attrition & Retention Risk
    if (
      query.includes('attrition') ||
      query.includes('retention') ||
      query.includes('risk') ||
      query.includes('leave') && query.includes('who')
    ) {
      intent = 'attrition_risk';
      let risks = await AttritionRisk.find({ organizationId })
        .populate({
          path: 'employeeId',
          select: 'fullName employeeCode email departmentId designation grade avatar',
          populate: { path: 'departmentId', select: 'name' },
        })
        .sort({ riskScore: -1 })
        .limit(10);

      // If no records yet, compute for active employees
      if (risks.length === 0) {
        await PerformanceService.computeAllAttritionRisks(organizationId);
        risks = await AttritionRisk.find({ organizationId })
          .populate({
            path: 'employeeId',
            select: 'fullName employeeCode email departmentId designation grade avatar',
            populate: { path: 'departmentId', select: 'name' },
          })
          .sort({ riskScore: -1 })
          .limit(10);
      }

      const highRisks = risks.filter((r) => r.riskLevel === 'high' || r.riskLevel === 'critical');

      if (highRisks.length > 0) {
        answer = `Found **${highRisks.length} employee(s)** with elevated attrition risk. Primary contributing drivers include role tenure stagnation and attendance anomalies.\n\n` +
          highRisks.map((r, idx) => {
            const emp = r.employeeId?.fullName || 'Employee';
            const dept = r.employeeId?.departmentId?.name || 'Department';
            const factor = r.contributingFactors?.[0]?.description || 'Tenure and attendance trend';
            return `${idx + 1}. **${emp}** (${dept}) — **${r.riskScore}% Risk** (${r.riskLevel.toUpperCase()})\n   • *Driver*: ${factor}`;
          }).join('\n\n');
        data = highRisks;
      } else {
        answer = 'Overall workforce retention stability is healthy. No employees currently exhibit high or critical attrition risk signals.';
        data = risks.slice(0, 5);
      }
      suggestedFollowUps = [
        'Recommend retention interventions',
        'Show 9-box talent calibration',
        'Check recent attendance anomalies',
      ];
    }

    // Intent 2: Goals & OKRs Velocity
    else if (
      query.includes('goal') ||
      query.includes('okr') ||
      query.includes('objective') ||
      query.includes('progress')
    ) {
      intent = 'goals_summary';
      const goals = await Goal.find({ organizationId, deletedAt: null })
        .populate({ path: 'employeeId', select: 'fullName employeeCode' })
        .populate({ path: 'departmentId', select: 'name' })
        .sort({ progress: 1 });

      const totalGoals = goals.length;
      const completedGoals = goals.filter((g) => g.status === 'completed').length;
      const atRiskGoals = goals.filter((g) => g.status === 'at_risk' || g.status === 'behind').length;
      const inProgressGoals = goals.filter((g) => g.status === 'in_progress').length;

      const avgProgress = totalGoals > 0
        ? Math.round(goals.reduce((acc, g) => acc + (g.progress || 0), 0) / totalGoals)
        : 0;

      answer = `**Workforce OKR Pulse Summary:**\n\n` +
        `• Total Active Goals: **${totalGoals}**\n` +
        `• Average Progress: **${avgProgress}%**\n` +
        `• Completed: **${completedGoals}** | In Progress: **${inProgressGoals}**\n` +
        `• Behind / At-Risk: **${atRiskGoals}**\n\n` +
        (atRiskGoals > 0
          ? `Top goals needing attention:\n` +
            goals
              .filter((g) => g.status === 'at_risk' || g.status === 'behind')
              .slice(0, 3)
              .map((g) => `- **${g.title}** (${g.employeeId?.fullName || 'Org'}, ${g.progress}% done) — *${g.status.toUpperCase()}*`)
              .join('\n')
          : 'All tracked objectives are proceeding on schedule.');

      data = { totalGoals, completedGoals, atRiskGoals, inProgressGoals, avgProgress, goals: goals.slice(0, 10) };
      suggestedFollowUps = [
        'List at-risk engineering goals',
        'Top performers this quarter',
        'Show 9-box talent calibration',
      ];
    }

    // Intent 3: 9-Box Talent Calibration & Performance
    else if (
      query.includes('9-box') ||
      query.includes('nine box') ||
      query.includes('matrix') ||
      query.includes('calibration') ||
      query.includes('star') ||
      query.includes('talent')
    ) {
      intent = 'nine_box_matrix';
      const gridResult = await PerformanceService.getNineBoxGrid(organizationId);

      const stars = gridResult.grid.find((b) => b.perfScore === 3 && b.potScore === 3);
      const highPerformers = gridResult.grid.find((b) => b.perfScore === 3 && b.potScore === 2);
      const underperformers = gridResult.grid.find((b) => b.perfScore === 1 && b.potScore === 1);

      answer = `**9-Box Talent Calibration Overview:**\n\n` +
        `Total Calibrated Employees: **${gridResult.totalEmployees}**\n\n` +
        `• **Future Leaders / Stars (High Perf / High Pot):** ${stars?.count || 0} employees\n` +
        `• **High Performers (High Perf / Med Pot):** ${highPerformers?.count || 0} employees\n` +
        `• **Needs Development (Low Perf / Low Pot):** ${underperformers?.count || 0} employees\n\n` +
        (stars?.employees?.length
          ? `Identified Top Talent for Fast-Track Leadership:\n` +
            stars.employees.slice(0, 3).map((e) => `- **${e.employee?.fullName}** (${e.employee?.grade || 'L3'}, ${e.employee?.departmentId?.name || 'Operations'})`).join('\n')
          : 'Complete the ongoing review cycle to populate additional calibration nodes.');

      data = gridResult;
      suggestedFollowUps = [
        'Who is recommended for promotion?',
        'Show high attrition risks',
        'Team goal progress status',
      ];
    }

    // Intent 4: Promotions & Compensation Recommendations
    else if (
      query.includes('promotion') ||
      query.includes('increment') ||
      query.includes('top performer') ||
      query.includes('raise')
    ) {
      intent = 'promotion_candidates';
      const reviews = await PerformanceReview.find({
        organizationId,
        'calibration.promotionRecommended': true,
      })
        .populate({
          path: 'employeeId',
          select: 'fullName employeeCode grade designation departmentId',
          populate: { path: 'departmentId', select: 'name' },
        })
        .sort({ 'calibration.salaryIncrementPercentage': -1 });

      if (reviews.length > 0) {
        answer = `Found **${reviews.length} candidate(s)** recommended for promotion and salary increment based on recent performance calibration:\n\n` +
          reviews.map((r, i) => {
            const emp = r.employeeId?.fullName || 'Employee';
            const grade = r.employeeId?.grade || 'L2';
            const pct = r.calibration?.salaryIncrementPercentage || 0;
            return `${i + 1}. **${emp}** (Current: ${grade}) — Proposed Increment: **${pct}%**\n   • *Notes*: ${r.calibration?.calibrationNotes || 'Demonstrated consistent high performance.'}`;
          }).join('\n\n');
        data = reviews;
      } else {
        answer = 'No promotion nominations have been finalized in the current calibration round.';
        data = [];
      }
      suggestedFollowUps = [
        'Show 9-box talent calibration',
        'Team goal progress status',
        'Show high attrition risks',
      ];
    }

    // Default: General HR Overview
    else {
      const empCount = await Employee.countDocuments({ organizationId, status: 'active' });
      const deptCount = await Department.countDocuments({ organizationId });
      const goalCount = await Goal.countDocuments({ organizationId, deletedAt: null });

      answer = `Hello! I am your **Nebula HR AI Copilot**.\n\n` +
        `Your organization currently manages **${empCount} active employees** across **${deptCount} departments** with **${goalCount} tracked goals**.\n\n` +
        `Ask me anything about:\n` +
        `• **Attrition Risk & Retention Signals**\n` +
        `• **Goals, OKRs & Team Velocity**\n` +
        `• **9-Box Talent Calibration & Future Leaders**\n` +
        `• **Promotions, Performance Appraisals & Attendance Patterns**`;

      data = { activeEmployees: empCount, departments: deptCount, goals: goalCount };
    }

    return {
      answer,
      data,
      intent,
      suggestedFollowUps,
      confidence: 0.94,
    };
  }
}

module.exports = HrmsCopilotService;
