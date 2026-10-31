const DepartmentBudget = require('../models/DepartmentBudget');
const ExpenseClaim = require('../models/ExpenseClaim');
const AiRun = require('../models/AiRun');
const { roundMoney } = require('../utils/money');

/**
 * Budget Forecast Service (X10)
 * Calculates run-rate velocity and end-of-period spend forecasts.
 */
class BudgetForecastService {
  /**
   * Forecast spend for all active department budgets
   */
  static async forecastDepartmentBudgets(organizationId, fiscalYear = new Date().getFullYear(), userId = null) {
    const startTime = Date.now();
    const budgets = await DepartmentBudget.find({ organizationId, fiscalYear }).populate(
      'departmentId',
      'name'
    );

    const now = new Date();
    // Determine days elapsed in the year vs total days in the year
    const startOfYear = new Date(fiscalYear, 0, 1);
    const endOfYear = new Date(fiscalYear, 11, 31);
    const totalDays = Math.ceil((endOfYear - startOfYear) / (1000 * 60 * 60 * 24)) || 365;
    const daysElapsed = Math.max(1, Math.ceil((now - startOfYear) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);

    const forecasts = [];

    for (const b of budgets) {
      const allocated = b.allocatedAmount || 0;
      const currentSpent = b.spentAmount || 0;
      const pending = b.pendingAmount || 0;

      // Burn rate per day based on days elapsed
      const dailyBurnRate = roundMoney(currentSpent / daysElapsed);
      const projectedRemainingSpend = roundMoney(dailyBurnRate * daysRemaining);
      const projectedTotalSpend = roundMoney(currentSpent + projectedRemainingSpend);

      let forecastStatus = 'on_track';
      let projectedUtilizationPercent = allocated > 0 ? roundMoney((projectedTotalSpend / allocated) * 100) : 0;
      let projectedOverrun = 0;

      if (projectedTotalSpend > allocated && allocated > 0) {
        forecastStatus = 'breach_imminent';
        projectedOverrun = roundMoney(projectedTotalSpend - allocated);
      } else if (projectedUtilizationPercent >= 85) {
        forecastStatus = 'caution';
      }

      let warningMessage = `${b.departmentId?.name || 'Department'} is trending on track to utilize ${projectedUtilizationPercent}% of budget by year-end.`;
      if (forecastStatus === 'breach_imminent') {
        warningMessage = `CRITICAL: ${b.departmentId?.name || 'Department'} is burning $${dailyBurnRate.toFixed(
          2
        )}/day and projected to breach annual budget by $${projectedOverrun.toFixed(
          2
        )} (${projectedUtilizationPercent}% utilization).`;
      } else if (forecastStatus === 'caution') {
        warningMessage = `CAUTION: ${b.departmentId?.name || 'Department'} is approaching high utilization (Projected: ${projectedUtilizationPercent}%).`;
      }

      forecasts.push({
        budgetId: b._id,
        departmentName: b.departmentId?.name || 'Unassigned',
        fiscalYear,
        allocatedAmount: allocated,
        currentSpentAmount: currentSpent,
        pendingCommitments: pending,
        dailyBurnRate,
        daysElapsed,
        daysRemaining,
        projectedTotalSpend,
        projectedUtilizationPercent,
        projectedOverrun,
        forecastStatus,
        warningMessage,
      });
    }

    const latencyMs = Date.now() - startTime;
    if (userId) {
      try {
        await AiRun.create({
          organizationId,
          userId,
          task: 'budget_forecast',
          latencyMs,
          resultSummary: `Forecasted ${forecasts.length} department budgets`,
        });
      } catch (e) {
        // Non-blocking
      }
    }

    return forecasts;
  }
}

module.exports = BudgetForecastService;
