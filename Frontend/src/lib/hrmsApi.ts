import { apiClient } from '../lib/apiClient';
import type {
  AttendanceRoster,
  AttendanceSummary,
  AttendanceToday,
  Department,
  DepartmentInput,
  Employee,
  EmployeeDocument,
  EmployeeDocumentInput,
  EmployeeInput,
  Holiday,
  HolidayInput,
  HrSummary,
  LeaveBalanceSummary,
  LeaveRequest,
  LeaveRequestInput,
  LeaveType,
} from '../types/hrms';

// ─────────────────────────────────────────────────────────
// Employees
// ─────────────────────────────────────────────────────────
export const hrmsApi = {
  // ── Employees ──
  getEmployees: async (
    params: { department?: string; status?: string; employmentType?: string; search?: string } = {}
  ) => {
    const res = await apiClient.get<Employee[]>('/hr/employees', { params });
    return res.data;
  },

  getEmployee: async (id: string) => {
    const res = await apiClient.get<Employee>(`/hr/employees/${id}`);
    return res.data;
  },

  createEmployee: async (input: EmployeeInput) => {
    const res = await apiClient.post<Employee>('/hr/employees', input);
    return res.data;
  },

  updateEmployee: async (id: string, patch: Partial<EmployeeInput>) => {
    const res = await apiClient.patch<Employee>(`/hr/employees/${id}`, patch);
    return res.data;
  },

  deleteEmployee: async (id: string) => {
    const res = await apiClient.delete<{ message: string }>(`/hr/employees/${id}`);
    return res.data;
  },

  // ── Departments ──
  getDepartments: async (params: { search?: string } = {}) => {
    const res = await apiClient.get<Department[]>('/hr/departments', { params });
    return res.data;
  },

  getDepartment: async (id: string) => {
    const res = await apiClient.get<Department>(`/hr/departments/${id}`);
    return res.data;
  },

  createDepartment: async (input: DepartmentInput) => {
    const res = await apiClient.post<Department>('/hr/departments', input);
    return res.data;
  },

  updateDepartment: async (id: string, patch: Partial<DepartmentInput>) => {
    const res = await apiClient.patch<Department>(`/hr/departments/${id}`, patch);
    return res.data;
  },

  deleteDepartment: async (id: string) => {
    const res = await apiClient.delete<{ message: string }>(`/hr/departments/${id}`);
    return res.data;
  },

  // ── Attendance ──
  attendanceAction: async (
    action: 'check-in' | 'check-out' | 'break-in' | 'break-out'
  ) => {
    const res = await apiClient.post<{
      message: string;
      currentStatus: AttendanceToday['currentStatus'];
      totalWorkedMinutes: number;
    }>(`/hr/attendance/${action}`);
    return res.data;
  },

  getAttendanceToday: async () => {
    const res = await apiClient.get<AttendanceToday>('/hr/attendance/today');
    return res.data;
  },

  getAttendanceSummary: async (params: { month?: number; year?: number; employeeId?: string } = {}) => {
    const res = await apiClient.get<AttendanceSummary>('/hr/attendance/summary', { params });
    return res.data;
  },

  getAttendanceRoster: async (date?: string) => {
    const res = await apiClient.get<AttendanceRoster>('/hr/attendance/roster', {
      params: date ? { date } : undefined,
    });
    return res.data;
  },

  // ── Leave ──
  getLeaveTypes: async () => {
    const res = await apiClient.get<LeaveType[]>('/hr/leaves/types');
    return res.data;
  },

  getLeaveBalances: async (params: { employeeId?: string; year?: number } = {}) => {
    const res = await apiClient.get<LeaveBalanceSummary[]>('/hr/leaves/balance', { params });
    return res.data;
  },

  getLeaveRequests: async (
    params: { status?: string; employeeId?: string; from?: string; to?: string } = {}
  ) => {
    const res = await apiClient.get<LeaveRequest[]>('/hr/leaves/requests', { params });
    return res.data;
  },

  createLeaveRequest: async (input: LeaveRequestInput) => {
    const res = await apiClient.post<LeaveRequest>('/hr/leaves/requests', input);
    return res.data;
  },

  approveLeaveRequest: async (id: string) => {
    const res = await apiClient.patch<{ message: string; leaveRequest: LeaveRequest }>(
      `/hr/leaves/requests/${id}/approve`
    );
    return res.data;
  },

  rejectLeaveRequest: async (id: string) => {
    const res = await apiClient.patch<{ message: string; leaveRequest: LeaveRequest }>(
      `/hr/leaves/requests/${id}/reject`
    );
    return res.data;
  },

  // ── Holidays ──
  getHolidays: async (year?: number) => {
    const res = await apiClient.get<Holiday[]>('/hr/holidays', {
      params: year ? { year } : undefined,
    });
    return res.data;
  },

  getUpcomingHolidays: async (limit = 5) => {
    const res = await apiClient.get<Holiday[]>('/hr/holidays/upcoming', { params: { limit } });
    return res.data;
  },

  createHoliday: async (input: HolidayInput) => {
    const res = await apiClient.post<Holiday>('/hr/holidays', input);
    return res.data;
  },

  updateHoliday: async (id: string, patch: Partial<HolidayInput>) => {
    const res = await apiClient.patch<Holiday>(`/hr/holidays/${id}`, patch);
    return res.data;
  },

  deleteHoliday: async (id: string) => {
    const res = await apiClient.delete<{ message: string }>(`/hr/holidays/${id}`);
    return res.data;
  },

  // ── Documents ──
  getEmployeeDocuments: async (employeeId: string) => {
    const res = await apiClient.get<EmployeeDocument[]>(`/hr/employees/${employeeId}/documents`);
    return res.data;
  },

  uploadEmployeeDocument: async (employeeId: string, input: EmployeeDocumentInput) => {
    const res = await apiClient.post<EmployeeDocument>(`/hr/employees/${employeeId}/documents`, input);
    return res.data;
  },

  deleteEmployeeDocument: async (id: string) => {
    const res = await apiClient.delete<{ message: string }>(`/hr/documents/${id}`);
    return res.data;
  },

  // ── Summary ──
  getSummary: async () => {
    const res = await apiClient.get<HrSummary>('/hr/summary');
    return res.data;
  },
};
