const express = require('express');
const router = express.Router();

const employeeController = require('../controllers/employeeController');
const departmentController = require('../controllers/departmentController');
const hrAttendance = require('../controllers/hrAttendanceController');
const hrLeave = require('../controllers/hrLeaveController');
const hrSettings = require('../controllers/hrSettingsController');
const shiftController = require('../controllers/shiftController');
const regularizationController = require('../controllers/attendanceRegularizationController');
const compOffController = require('../controllers/compOffController');
const branchController = require('../controllers/branchLocationController');
const designationController = require('../controllers/designationController');
const employeeLifecycleController = require('../controllers/employeeLifecycleController');
const orgChartController = require('../controllers/orgChartController');
const payrollController = require('../controllers/payrollController');
const performanceController = require('../controllers/performanceController');
const lifecycleController = require('../controllers/lifecycleController');
const talentPlanningController = require('../controllers/talentPlanningController');
const {
  getHolidays,
  getUpcomingHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  getHrSummary,
} = require('../controllers/hrController');
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../middleware/moduleAccess');

// ── Publicly accessible via signed HMAC URL or authenticated session ──
router.get('/documents/files/:orgId/:filename', (req, res, next) => {
  if (req.query.sig && req.query.expires) {
    return hrSettings.serveDocumentFile(req, res, next);
  }
  return requireAuth(req, res, () => hrSettings.serveDocumentFile(req, res, next));
});

// Every subsequent HR route requires an authenticated session
router.use(requireAuth);

// ── Summary (view) — feeds the Dashboard KPI cards ──
router.get('/summary', requireModuleAccess('hrms', 'view'), getHrSummary);

// ── HR Settings & Policies ──
router.get('/settings', requireModuleAccess('hrms', 'view'), hrSettings.getHrSettings);
router.patch('/settings', requireModuleAccess('hrms', 'edit'), hrSettings.updateHrSettings);

// ── Generic Approval Workflows ──
router.get('/workflows/inbox', requireModuleAccess('hrms', 'view'), hrSettings.getWorkflowInbox);
router.post('/workflows/instances/:id/act', requireModuleAccess('hrms', 'approve'), hrSettings.actOnWorkflow);

// ── Audit Logs ──
router.get('/audit-logs', requireModuleAccess('hrms', 'view'), hrSettings.getAuditLogs);

// ── Employee Document Storage ──
router.post('/documents/upload', requireModuleAccess('hrms', 'create'), hrSettings.uploadDocument);

// ── HR Notifications ──
router.get('/notifications', requireModuleAccess('hrms', 'view'), hrSettings.getNotifications);
router.patch('/notifications/:id/read', requireModuleAccess('hrms', 'view'), hrSettings.markNotificationAsRead);

// ── Employees ──
router.get('/employees', requireModuleAccess('hrms', 'view'), employeeController.getEmployees);
router.post('/employees', requireModuleAccess('hrms', 'create'), employeeController.createEmployee);
// Employees can always read their own record — allow all hrms viewers, scope inside
router.get('/employees/:id', requireModuleAccess('hrms', 'view'), employeeController.getEmployeeById);
router.patch('/employees/:id', requireModuleAccess('hrms', 'edit'), employeeController.updateEmployee);
router.delete('/employees/:id', requireModuleAccess('hrms', 'delete'), employeeController.deleteEmployee);

// ── Employee documents ──
router.get('/employees/:id/documents', requireModuleAccess('hrms', 'view'), employeeController.getEmployeeDocuments);
router.post('/employees/:id/documents', requireModuleAccess('hrms', 'create'), employeeController.uploadEmployeeDocument);
router.delete('/documents/:id', requireModuleAccess('hrms', 'delete'), employeeController.deleteEmployeeDocument);

// ── Employee Lifecycle & Career History ──
router.post('/employees/:id/lifecycle', requireModuleAccess('hrms', 'edit'), employeeLifecycleController.promoteOrTransferEmployee);
router.get('/employees/:id/job-history', requireModuleAccess('hrms', 'view'), employeeLifecycleController.getEmployeeJobHistory);

// ── Departments ──
router.get('/departments', requireModuleAccess('hrms', 'view'), departmentController.getDepartments);
router.post('/departments', requireModuleAccess('hrms', 'create'), departmentController.createDepartment);
router.get('/departments/:id', requireModuleAccess('hrms', 'view'), departmentController.getDepartmentById);
router.patch('/departments/:id', requireModuleAccess('hrms', 'edit'), departmentController.updateDepartment);
router.delete('/departments/:id', requireModuleAccess('hrms', 'delete'), departmentController.deleteDepartment);

// ── Branch / Office Locations ──
router.get('/branches', requireModuleAccess('hrms', 'view'), branchController.getBranches);
router.post('/branches', requireModuleAccess('hrms', 'create'), branchController.createBranch);
router.patch('/branches/:id', requireModuleAccess('hrms', 'edit'), branchController.updateBranch);
router.delete('/branches/:id', requireModuleAccess('hrms', 'delete'), branchController.deleteBranch);

// ── Designations & Job Grades ──
router.get('/designations', requireModuleAccess('hrms', 'view'), designationController.getDesignations);
router.post('/designations', requireModuleAccess('hrms', 'create'), designationController.createDesignation);
router.patch('/designations/:id', requireModuleAccess('hrms', 'edit'), designationController.updateDesignation);
router.delete('/designations/:id', requireModuleAccess('hrms', 'delete'), designationController.deleteDesignation);

// ── Interactive Org Chart ──
router.get('/org-chart', requireModuleAccess('hrms', 'view'), orgChartController.getOrgChart);

// ── Attendance (personal actions available to every hrms viewer) ──
router.post('/attendance/check-in', requireModuleAccess('hrms', 'view'), hrAttendance.doCheckIn);
router.post('/attendance/check-out', requireModuleAccess('hrms', 'view'), hrAttendance.doCheckOut);
router.post('/attendance/break-in', requireModuleAccess('hrms', 'view'), hrAttendance.doBreakIn);
router.post('/attendance/break-out', requireModuleAccess('hrms', 'view'), hrAttendance.doBreakOut);
router.get('/attendance/today', requireModuleAccess('hrms', 'view'), hrAttendance.getToday);
router.get('/attendance/summary', requireModuleAccess('hrms', 'view'), hrAttendance.getSummary);
// Org-wide roster is further gated inside the controller (manager/HR/admin only)
router.get('/attendance/roster', requireModuleAccess('hrms', 'view'), hrAttendance.getRoster);

// ── Multi-Shift Management ──
router.get('/shifts', requireModuleAccess('hrms', 'view'), shiftController.getShifts);
router.post('/shifts', requireModuleAccess('hrms', 'create'), shiftController.createShift);
router.patch('/shifts/:id', requireModuleAccess('hrms', 'edit'), shiftController.updateShift);
router.delete('/shifts/:id', requireModuleAccess('hrms', 'delete'), shiftController.deleteShift);
router.post('/shifts/assign', requireModuleAccess('hrms', 'edit'), shiftController.assignShift);
router.get('/shifts/active/:employeeId', requireModuleAccess('hrms', 'view'), shiftController.getActiveShiftForEmployee);

// ── Attendance Regularizations ──
router.get('/attendance/regularizations', requireModuleAccess('hrms', 'view'), regularizationController.getRegularizations);
router.post('/attendance/regularizations', requireModuleAccess('hrms', 'view'), regularizationController.createRegularization);
router.patch('/attendance/regularizations/:id/approve', requireModuleAccess('hrms', 'approve'), regularizationController.approveRegularization);
router.patch('/attendance/regularizations/:id/reject', requireModuleAccess('hrms', 'approve'), regularizationController.rejectRegularization);

// ── Leave & Policy Engine ──
router.get('/leaves/types', requireModuleAccess('hrms', 'view'), hrLeave.getLeaveTypes);
router.post('/leaves/types', requireModuleAccess('hrms', 'create'), hrLeave.createLeaveType);
router.patch('/leaves/types/:id', requireModuleAccess('hrms', 'edit'), hrLeave.updateLeaveType);
router.get('/leaves/balance', requireModuleAccess('hrms', 'view'), hrLeave.getLeaveBalances);
router.get('/leaves/requests', requireModuleAccess('hrms', 'view'), hrLeave.getLeaveRequests);
router.post('/leaves/requests', requireModuleAccess('hrms', 'create'), hrLeave.createLeaveRequest);
router.patch('/leaves/requests/:id/approve', requireModuleAccess('hrms', 'approve'), hrLeave.approveLeaveRequest);
router.patch('/leaves/requests/:id/reject', requireModuleAccess('hrms', 'approve'), hrLeave.rejectLeaveRequest);
router.post('/leaves/sandwich-preview', requireModuleAccess('hrms', 'view'), hrLeave.previewSandwich);
router.get('/leaves/ledger', requireModuleAccess('hrms', 'view'), hrLeave.getLeaveLedger);
router.post('/leaves/accrual/run', requireModuleAccess('hrms', 'edit'), hrLeave.triggerMonthlyAccrual);

// ── Compensatory Off Management ──
router.get('/leaves/comp-off', requireModuleAccess('hrms', 'view'), compOffController.getCompOffRequests);
router.post('/leaves/comp-off', requireModuleAccess('hrms', 'view'), compOffController.createCompOffRequest);
router.patch('/leaves/comp-off/:id/approve', requireModuleAccess('hrms', 'approve'), compOffController.approveCompOff);
router.patch('/leaves/comp-off/:id/reject', requireModuleAccess('hrms', 'approve'), compOffController.rejectCompOff);

// ── Enterprise Payroll & Compensation ──
router.get('/payroll/runs', requireModuleAccess('hrms', 'view'), payrollController.getPayrollRuns);
router.post('/payroll/runs', requireModuleAccess('hrms', 'create'), payrollController.createPayrollRun);
router.get('/payroll/runs/:id', requireModuleAccess('hrms', 'view'), payrollController.getPayrollRunById);
router.patch('/payroll/runs/:id/approve', requireModuleAccess('hrms', 'approve'), payrollController.approvePayrollRun);
router.patch('/payroll/runs/:id/pay', requireModuleAccess('hrms', 'approve'), payrollController.markPayrollRunPaid);

router.get('/payroll/my-payslips', requireModuleAccess('hrms', 'view'), payrollController.getMyPayslips);
router.get('/payroll/payslips/:id', requireModuleAccess('hrms', 'view'), payrollController.getPayslipById);
router.patch('/payroll/payslips/:id', requireModuleAccess('hrms', 'edit'), payrollController.updatePayslipLineItem);
router.get('/payroll/payslips/:id/pdf', requireModuleAccess('hrms', 'view'), payrollController.downloadPayslipPdf);

router.get('/payroll/salary-structures/:employeeId', requireModuleAccess('hrms', 'view'), payrollController.getSalaryStructure);
router.post('/payroll/salary-structures/:employeeId', requireModuleAccess('hrms', 'edit'), payrollController.upsertSalaryStructure);

// ── Enterprise Performance & OKRs ──
router.get('/performance/goals', requireModuleAccess('hrms', 'view'), performanceController.getGoals);
router.post('/performance/goals', requireModuleAccess('hrms', 'create'), performanceController.createGoal);
router.get('/performance/goals/:id', requireModuleAccess('hrms', 'view'), performanceController.getGoalById);
router.patch('/performance/goals/:id', requireModuleAccess('hrms', 'edit'), performanceController.updateGoal);
router.delete('/performance/goals/:id', requireModuleAccess('hrms', 'delete'), performanceController.deleteGoal);
router.post('/performance/goals/:id/check-in', requireModuleAccess('hrms', 'view'), performanceController.addGoalCheckIn);

// ── Performance Review Cycles & Appraisals ──
router.get('/performance/cycles', requireModuleAccess('hrms', 'view'), performanceController.getReviewCycles);
router.post('/performance/cycles', requireModuleAccess('hrms', 'create'), performanceController.createReviewCycle);
router.get('/performance/reviews', requireModuleAccess('hrms', 'view'), performanceController.getReviews);
router.get('/performance/reviews/:id', requireModuleAccess('hrms', 'view'), performanceController.getReviewById);
router.patch('/performance/reviews/:id/self', requireModuleAccess('hrms', 'view'), performanceController.submitSelfReview);
router.patch('/performance/reviews/:id/manager', requireModuleAccess('hrms', 'edit'), performanceController.submitManagerReview);
router.patch('/performance/reviews/:id/calibrate', requireModuleAccess('hrms', 'approve'), performanceController.calibrateReview);

// ── 9-Box Talent Calibration & Attrition Risk ──
router.get('/performance/nine-box', requireModuleAccess('hrms', 'view'), performanceController.getNineBoxGrid);
router.get('/performance/attrition-risks', requireModuleAccess('hrms', 'view'), performanceController.getAttritionRisks);
router.post('/performance/attrition-risks/recompute', requireModuleAccess('hrms', 'edit'), performanceController.recomputeAttritionRisks);

// ── HR AI Copilot ──
router.post('/performance/copilot/query', requireModuleAccess('hrms', 'view'), performanceController.queryCopilot);

// ── Lifecycle & Self-Service (Onboarding, Offboarding, Helpdesk, Letters, Policies) ──
router.get('/lifecycle/onboarding', requireModuleAccess('hrms', 'view'), lifecycleController.getOnboardingCases);
router.post('/lifecycle/onboarding', requireModuleAccess('hrms', 'create'), lifecycleController.createOnboardingCase);
router.get('/lifecycle/onboarding/:id', requireModuleAccess('hrms', 'view'), lifecycleController.getOnboardingCaseById);
router.patch('/lifecycle/onboarding/:id/tasks/:taskId', requireModuleAccess('hrms', 'view'), lifecycleController.toggleOnboardingTask);

router.get('/lifecycle/offboarding', requireModuleAccess('hrms', 'view'), lifecycleController.getOffboardingCases);
router.post('/lifecycle/offboarding', requireModuleAccess('hrms', 'create'), lifecycleController.createOffboardingCase);
router.patch('/lifecycle/offboarding/:id/clearance', requireModuleAccess('hrms', 'edit'), lifecycleController.updateOffboardingClearance);
router.patch('/lifecycle/offboarding/:id/exit-interview', requireModuleAccess('hrms', 'edit'), lifecycleController.submitExitInterview);

router.get('/lifecycle/tickets', requireModuleAccess('hrms', 'view'), lifecycleController.getTickets);
router.post('/lifecycle/tickets', requireModuleAccess('hrms', 'view'), lifecycleController.createTicket);
router.patch('/lifecycle/tickets/:id', requireModuleAccess('hrms', 'edit'), lifecycleController.updateTicketStatus);
router.post('/lifecycle/tickets/:id/comments', requireModuleAccess('hrms', 'view'), lifecycleController.addTicketComment);

router.get('/lifecycle/letters/templates', requireModuleAccess('hrms', 'view'), lifecycleController.getLetterTemplates);
router.post('/lifecycle/letters/generate', requireModuleAccess('hrms', 'view'), lifecycleController.generateLetterPdf);

router.get('/lifecycle/policies', requireModuleAccess('hrms', 'view'), lifecycleController.getPolicies);
router.post('/lifecycle/policies/:id/acknowledge', requireModuleAccess('hrms', 'view'), lifecycleController.acknowledgePolicy);

router.get('/lifecycle/announcements', requireModuleAccess('hrms', 'view'), lifecycleController.getAnnouncements);
router.post('/lifecycle/announcements', requireModuleAccess('hrms', 'create'), lifecycleController.createAnnouncement);

// ── Learning, Skills & Workforce Planning ──
router.get('/talent/skills', requireModuleAccess('hrms', 'view'), talentPlanningController.getSkills);
router.post('/talent/skills', requireModuleAccess('hrms', 'create'), talentPlanningController.createSkill);
router.get('/talent/employee-skills', requireModuleAccess('hrms', 'view'), talentPlanningController.getEmployeeSkills);
router.post('/talent/employee-skills', requireModuleAccess('hrms', 'view'), talentPlanningController.upsertEmployeeSkill);
router.patch('/talent/employee-skills/:id/verify', requireModuleAccess('hrms', 'edit'), talentPlanningController.verifyEmployeeSkill);

router.get('/talent/trainings', requireModuleAccess('hrms', 'view'), talentPlanningController.getTrainings);
router.post('/talent/trainings', requireModuleAccess('hrms', 'create'), talentPlanningController.createTraining);
router.post('/talent/trainings/:id/enroll', requireModuleAccess('hrms', 'view'), talentPlanningController.enrollInTraining);
router.patch('/talent/trainings/:id/enrollments/:enrollmentId', requireModuleAccess('hrms', 'edit'), talentPlanningController.updateEnrollmentStatus);

router.get('/talent/headcount-plans', requireModuleAccess('hrms', 'view'), talentPlanningController.getHeadcountPlans);
router.post('/talent/headcount-plans', requireModuleAccess('hrms', 'edit'), talentPlanningController.upsertHeadcountPlan);
router.get('/talent/headcount-analytics', requireModuleAccess('hrms', 'view'), talentPlanningController.getHeadcountAnalytics);

router.get('/talent/requisitions', requireModuleAccess('hrms', 'view'), talentPlanningController.getRequisitions);
router.post('/talent/requisitions', requireModuleAccess('hrms', 'create'), talentPlanningController.createRequisition);
router.patch('/talent/requisitions/:id/approve', requireModuleAccess('hrms', 'approve'), talentPlanningController.approveRequisition);

// ── Holidays (writes gated inside the controller to admin/HR) ──
router.get('/holidays', requireModuleAccess('hrms', 'view'), getHolidays);
router.get('/holidays/upcoming', requireModuleAccess('hrms', 'view'), getUpcomingHolidays);
router.post('/holidays', requireModuleAccess('hrms', 'create'), createHoliday);
router.patch('/holidays/:id', requireModuleAccess('hrms', 'edit'), updateHoliday);
router.delete('/holidays/:id', requireModuleAccess('hrms', 'delete'), deleteHoliday);

module.exports = router;
