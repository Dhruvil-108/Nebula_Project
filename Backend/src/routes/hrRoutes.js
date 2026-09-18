const express = require('express');
const router = express.Router();

const employeeController = require('../controllers/employeeController');
const departmentController = require('../controllers/departmentController');
const hrAttendance = require('../controllers/hrAttendanceController');
const hrLeave = require('../controllers/hrLeaveController');
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

// Every HR route requires an authenticated session
router.use(requireAuth);

// ── Summary (view) — feeds the Dashboard KPI cards ──
router.get('/summary', requireModuleAccess('hrms', 'view'), getHrSummary);

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

// ── Departments ──
router.get('/departments', requireModuleAccess('hrms', 'view'), departmentController.getDepartments);
router.post('/departments', requireModuleAccess('hrms', 'create'), departmentController.createDepartment);
router.get('/departments/:id', requireModuleAccess('hrms', 'view'), departmentController.getDepartmentById);
router.patch('/departments/:id', requireModuleAccess('hrms', 'edit'), departmentController.updateDepartment);
router.delete('/departments/:id', requireModuleAccess('hrms', 'delete'), departmentController.deleteDepartment);

// ── Attendance (personal actions available to every hrms viewer) ──
router.post('/attendance/check-in', requireModuleAccess('hrms', 'view'), hrAttendance.doCheckIn);
router.post('/attendance/check-out', requireModuleAccess('hrms', 'view'), hrAttendance.doCheckOut);
router.post('/attendance/break-in', requireModuleAccess('hrms', 'view'), hrAttendance.doBreakIn);
router.post('/attendance/break-out', requireModuleAccess('hrms', 'view'), hrAttendance.doBreakOut);
router.get('/attendance/today', requireModuleAccess('hrms', 'view'), hrAttendance.getToday);
router.get('/attendance/summary', requireModuleAccess('hrms', 'view'), hrAttendance.getSummary);
// Org-wide roster is further gated inside the controller (manager/HR/admin only)
router.get('/attendance/roster', requireModuleAccess('hrms', 'view'), hrAttendance.getRoster);

// ── Leave ──
router.get('/leaves/types', requireModuleAccess('hrms', 'view'), hrLeave.getLeaveTypes);
router.post('/leaves/types', requireModuleAccess('hrms', 'create'), hrLeave.createLeaveType);
router.get('/leaves/balance', requireModuleAccess('hrms', 'view'), hrLeave.getLeaveBalances);
router.get('/leaves/requests', requireModuleAccess('hrms', 'view'), hrLeave.getLeaveRequests);
router.post('/leaves/requests', requireModuleAccess('hrms', 'create'), hrLeave.createLeaveRequest);
router.patch('/leaves/requests/:id/approve', requireModuleAccess('hrms', 'approve'), hrLeave.approveLeaveRequest);
router.patch('/leaves/requests/:id/reject', requireModuleAccess('hrms', 'approve'), hrLeave.rejectLeaveRequest);

// ── Holidays (writes gated inside the controller to admin/HR) ──
router.get('/holidays', requireModuleAccess('hrms', 'view'), getHolidays);
router.get('/holidays/upcoming', requireModuleAccess('hrms', 'view'), getUpcomingHolidays);
router.post('/holidays', requireModuleAccess('hrms', 'create'), createHoliday);
router.patch('/holidays/:id', requireModuleAccess('hrms', 'edit'), updateHoliday);
router.delete('/holidays/:id', requireModuleAccess('hrms', 'delete'), deleteHoliday);

module.exports = router;
