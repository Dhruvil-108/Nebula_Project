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
  LeaveTypeInput,
  LeaveLedgerEntry,
  CompOffGrant,
  CompOffInput,
  SandwichPreviewResult,
  Shift,
  ShiftInput,
  AttendanceRegularization,
  RegularizationInput,
  BranchLocation,
  BranchLocationInput,
  Designation,
  DesignationInput,
  JobHistoryEntry,
  PromoteTransferInput,
  OrgChartResponse,
  SalaryStructure,
  SalaryStructureInput,
  PayrollRun,
  PayrollRunInput,
  Payslip,
  Goal,
  GoalInput,
  ReviewCycle,
  ReviewCycleInput,
  PerformanceReview,
  NineBoxGridResponse,
  AttritionRisk,
  HrmsCopilotResponse,
  OnboardingCase,
  OffboardingCase,
  HrTicket,
  LetterTemplate,
  PolicyDocument,
  Announcement,
  Skill,
  EmployeeSkill,
  Training,
  HeadcountPlan,
  HeadcountAnalytics,
  ManpowerRequisition,
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

  createLeaveType: async (input: LeaveTypeInput) => {
    const res = await apiClient.post<LeaveType>('/hr/leaves/types', input);
    return res.data;
  },

  updateLeaveType: async (id: string, patch: Partial<LeaveTypeInput>) => {
    const res = await apiClient.patch<LeaveType>(`/hr/leaves/types/${id}`, patch);
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

  previewSandwichRule: async (payload: { leaveTypeId: string; startDate: string; endDate: string; employeeId?: string }) => {
    const res = await apiClient.post<SandwichPreviewResult>('/hr/leaves/sandwich-preview', payload);
    return res.data;
  },

  getLeaveLedger: async (params: { employeeId?: string; year?: number; transactionType?: string } = {}) => {
    const res = await apiClient.get<LeaveLedgerEntry[]>('/hr/leaves/ledger', { params });
    return res.data;
  },

  runMonthlyAccrual: async (payload: { month?: number; year?: number } = {}) => {
    const res = await apiClient.post<{
      success: boolean;
      targetMonth: number;
      targetYear: number;
      employeesProcessed: number;
      totalCreditsIssued: number;
      recordsCreated: number;
    }>('/hr/leaves/accrual/run', payload);
    return res.data;
  },

  // ── Compensatory Off ──
  getCompOffRequests: async (params: { status?: string; employeeId?: string } = {}) => {
    const res = await apiClient.get<CompOffGrant[]>('/hr/leaves/comp-off', { params });
    return res.data;
  },

  createCompOffRequest: async (input: CompOffInput) => {
    const res = await apiClient.post<CompOffGrant>('/hr/leaves/comp-off', input);
    return res.data;
  },

  approveCompOff: async (id: string, comments?: string) => {
    const res = await apiClient.patch<{ message: string; compOff: CompOffGrant }>(
      `/hr/leaves/comp-off/${id}/approve`,
      { comments }
    );
    return res.data;
  },

  rejectCompOff: async (id: string, comments?: string) => {
    const res = await apiClient.patch<{ message: string; compOff: CompOffGrant }>(
      `/hr/leaves/comp-off/${id}/reject`,
      { comments }
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

  // ── Shifts ──
  getShifts: async () => {
    const res = await apiClient.get<Shift[]>('/hr/shifts');
    return res.data;
  },

  createShift: async (input: ShiftInput) => {
    const res = await apiClient.post<Shift>('/hr/shifts', input);
    return res.data;
  },

  updateShift: async (id: string, patch: Partial<ShiftInput>) => {
    const res = await apiClient.patch<Shift>(`/hr/shifts/${id}`, patch);
    return res.data;
  },

  deleteShift: async (id: string) => {
    const res = await apiClient.delete<{ message: string }>(`/hr/shifts/${id}`);
    return res.data;
  },

  assignShift: async (payload: { employeeIds: string[]; shiftId: string; effectiveFrom: string; effectiveTo?: string | null }) => {
    const res = await apiClient.post<{ message: string; count: number }>('/hr/shifts/assign', payload);
    return res.data;
  },

  getActiveShift: async (employeeId: string) => {
    const res = await apiClient.get<Shift>(`/hr/shifts/active/${employeeId}`);
    return res.data;
  },

  // ── Attendance Regularizations ──
  getRegularizations: async (params: { status?: string; employeeId?: string } = {}) => {
    const res = await apiClient.get<AttendanceRegularization[]>('/hr/attendance/regularizations', { params });
    return res.data;
  },

  createRegularization: async (input: RegularizationInput) => {
    const res = await apiClient.post<AttendanceRegularization>('/hr/attendance/regularizations', input);
    return res.data;
  },

  approveRegularization: async (id: string, comments?: string) => {
    const res = await apiClient.patch<{ message: string; regularization: AttendanceRegularization }>(
      `/hr/attendance/regularizations/${id}/approve`,
      { comments }
    );
    return res.data;
  },

  rejectRegularization: async (id: string, comments?: string) => {
    const res = await apiClient.patch<{ message: string; regularization: AttendanceRegularization }>(
      `/hr/attendance/regularizations/${id}/reject`,
      { comments }
    );
    return res.data;
  },

  // ── Employee Lifecycle & Career History ──
  promoteOrTransfer: async (id: string, payload: PromoteTransferInput) => {
    const res = await apiClient.post<{ message: string; employee: Employee; history: JobHistoryEntry }>(
      `/hr/employees/${id}/lifecycle`,
      payload
    );
    return res.data;
  },

  getEmployeeJobHistory: async (id: string) => {
    const res = await apiClient.get<JobHistoryEntry[]>(`/hr/employees/${id}/job-history`);
    return res.data;
  },

  // ── Branch / Office Locations ──
  getBranches: async () => {
    const res = await apiClient.get<BranchLocation[]>('/hr/branches');
    return res.data;
  },

  createBranch: async (input: BranchLocationInput) => {
    const res = await apiClient.post<BranchLocation>('/hr/branches', input);
    return res.data;
  },

  updateBranch: async (id: string, patch: Partial<BranchLocationInput>) => {
    const res = await apiClient.patch<BranchLocation>(`/hr/branches/${id}`, patch);
    return res.data;
  },

  deleteBranch: async (id: string) => {
    const res = await apiClient.delete<{ message: string }>(`/hr/branches/${id}`);
    return res.data;
  },

  // ── Designations & Job Grades ──
  getDesignations: async (params: { departmentId?: string; gradeLevel?: string } = {}) => {
    const res = await apiClient.get<Designation[]>('/hr/designations', { params });
    return res.data;
  },

  createDesignation: async (input: DesignationInput) => {
    const res = await apiClient.post<Designation>('/hr/designations', input);
    return res.data;
  },

  updateDesignation: async (id: string, patch: Partial<DesignationInput>) => {
    const res = await apiClient.patch<Designation>(`/hr/designations/${id}`, patch);
    return res.data;
  },

  deleteDesignation: async (id: string) => {
    const res = await apiClient.delete<{ message: string }>(`/hr/designations/${id}`);
    return res.data;
  },

  // ── Interactive Org Chart ──
  getOrgChart: async (params: { departmentId?: string; branchId?: string } = {}) => {
    const res = await apiClient.get<OrgChartResponse>('/hr/org-chart', { params });
    return res.data;
  },

  // ── Enterprise Payroll & Compensation ──
  getPayrollRuns: async () => {
    const res = await apiClient.get<PayrollRun[]>('/hr/payroll/runs');
    return res.data;
  },

  getPayrollRun: async (id: string) => {
    const res = await apiClient.get<PayrollRun & { payslips: Payslip[] }>(`/hr/payroll/runs/${id}`);
    return res.data;
  },

  createPayrollRun: async (input: PayrollRunInput) => {
    const res = await apiClient.post<{ message: string; payrollRun: PayrollRun; employeeCount: number }>(
      '/hr/payroll/runs',
      input
    );
    return res.data;
  },

  updatePayslipLineItem: async (id: string, patch: Record<string, unknown>) => {
    const res = await apiClient.patch<{ message: string; payslip: Payslip }>(
      `/hr/payroll/payslips/${id}`,
      patch
    );
    return res.data;
  },

  approvePayrollRun: async (id: string) => {
    const res = await apiClient.patch<{ message: string; payrollRun: PayrollRun }>(
      `/hr/payroll/runs/${id}/approve`
    );
    return res.data;
  },

  markPayrollPaid: async (id: string, payload: { paymentReference?: string; paymentDate?: string } = {}) => {
    const res = await apiClient.patch<{ message: string; payrollRun: PayrollRun }>(
      `/hr/payroll/runs/${id}/pay`,
      payload
    );
    return res.data;
  },

  getMyPayslips: async () => {
    const res = await apiClient.get<Payslip[]>('/hr/payroll/my-payslips');
    return res.data;
  },

  getPayslip: async (id: string) => {
    const res = await apiClient.get<Payslip>(`/hr/payroll/payslips/${id}`);
    return res.data;
  },

  getPayslipPdfUrl: (id: string) => `/api/v1/hr/payroll/payslips/${id}/pdf`,

  getSalaryStructure: async (employeeId: string) => {
    const res = await apiClient.get<SalaryStructure>(`/hr/payroll/salary-structures/${employeeId}`);
    return res.data;
  },

  upsertSalaryStructure: async (employeeId: string, input: SalaryStructureInput) => {
    const res = await apiClient.post<{ message: string; structure: SalaryStructure }>(
      `/hr/payroll/salary-structures/${employeeId}`,
      input
    );
    return res.data;
  },

  // ── Goals & OKRs ──
  getGoals: async (params: { employeeId?: string; departmentId?: string; status?: string; period?: string } = {}) => {
    const res = await apiClient.get<{ success: boolean; count: number; data: Goal[] }>('/hr/performance/goals', { params });
    return res.data.data;
  },

  getGoal: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: Goal }>(`/hr/performance/goals/${id}`);
    return res.data.data;
  },

  createGoal: async (input: GoalInput) => {
    const res = await apiClient.post<{ success: boolean; data: Goal }>('/hr/performance/goals', input);
    return res.data.data;
  },

  updateGoal: async (id: string, patch: Partial<GoalInput> & { status?: string }) => {
    const res = await apiClient.patch<{ success: boolean; data: Goal }>(`/hr/performance/goals/${id}`, patch);
    return res.data.data;
  },

  deleteGoal: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/hr/performance/goals/${id}`);
    return res.data;
  },

  addGoalCheckIn: async (id: string, payload: { note?: string; progress?: number; keyResults?: any[] }) => {
    const res = await apiClient.post<{ success: boolean; data: Goal }>(`/hr/performance/goals/${id}/check-in`, payload);
    return res.data.data;
  },

  // ── Review Cycles & 360 Appraisals ──
  getReviewCycles: async () => {
    const res = await apiClient.get<{ success: boolean; count: number; data: ReviewCycle[] }>('/hr/performance/cycles');
    return res.data.data;
  },

  createReviewCycle: async (input: ReviewCycleInput) => {
    const res = await apiClient.post<{ success: boolean; data: ReviewCycle }>('/hr/performance/cycles', input);
    return res.data.data;
  },

  getReviews: async (params: { reviewCycleId?: string; employeeId?: string; managerId?: string; status?: string } = {}) => {
    const res = await apiClient.get<{ success: boolean; count: number; data: PerformanceReview[] }>('/hr/performance/reviews', { params });
    return res.data.data;
  },

  getReview: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: PerformanceReview }>(`/hr/performance/reviews/${id}`);
    return res.data.data;
  },

  submitSelfReview: async (id: string, payload: { summary?: string; strengths?: string; growthAreas?: string; achievements?: string; rating?: number }) => {
    const res = await apiClient.patch<{ success: boolean; data: PerformanceReview }>(`/hr/performance/reviews/${id}/self`, payload);
    return res.data.data;
  },

  submitManagerReview: async (id: string, payload: { summary?: string; strengths?: string; growthAreas?: string; rating?: number; potentialRating?: number; recommendations?: string }) => {
    const res = await apiClient.patch<{ success: boolean; data: PerformanceReview }>(`/hr/performance/reviews/${id}/manager`, payload);
    return res.data.data;
  },

  calibrateReview: async (id: string, payload: { performanceScore?: number; potentialScore?: number; promotionRecommended?: boolean; salaryIncrementPercentage?: number; calibrationNotes?: string }) => {
    const res = await apiClient.patch<{ success: boolean; data: PerformanceReview }>(`/hr/performance/reviews/${id}/calibrate`, payload);
    return res.data.data;
  },

  // ── 9-Box Grid Aggregation ──
  getNineBoxGrid: async (departmentId?: string) => {
    const res = await apiClient.get<{ success: boolean; data: NineBoxGridResponse }>('/hr/performance/nine-box', {
      params: departmentId ? { departmentId } : {},
    });
    return res.data.data;
  },

  // ── Attrition Risk ──
  getAttritionRisks: async (riskLevel?: string) => {
    const res = await apiClient.get<{ success: boolean; count: number; data: AttritionRisk[] }>('/hr/performance/attrition-risks', {
      params: riskLevel ? { riskLevel } : {},
    });
    return res.data.data;
  },

  recomputeAttritionRisks: async () => {
    const res = await apiClient.post<{ success: boolean; count: number; message: string }>('/hr/performance/attrition-risks/recompute');
    return res.data;
  },

  // ── HR AI Copilot ──
  queryHrmsCopilot: async (prompt: string) => {
    const res = await apiClient.post<{ success: boolean; data: HrmsCopilotResponse }>('/hr/performance/copilot/query', { prompt });
    return res.data.data;
  },

  // ── Lifecycle: Onboarding ──
  getOnboardingCases: async (params: { status?: string } = {}) => {
    const res = await apiClient.get<{ success: boolean; count: number; data: OnboardingCase[] }>('/hr/lifecycle/onboarding', { params });
    return res.data.data;
  },

  getOnboardingCase: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; data: OnboardingCase }>(`/hr/lifecycle/onboarding/${id}`);
    return res.data.data;
  },

  createOnboardingCase: async (payload: { employeeId: string; joiningDate?: string; templateId?: string }) => {
    const res = await apiClient.post<{ success: boolean; data: OnboardingCase }>('/hr/lifecycle/onboarding', payload);
    return res.data.data;
  },

  toggleOnboardingTask: async (id: string, taskId: string, payload: { isCompleted: boolean; notes?: string }) => {
    const res = await apiClient.patch<{ success: boolean; data: OnboardingCase }>(`/hr/lifecycle/onboarding/${id}/tasks/${taskId}`, payload);
    return res.data.data;
  },

  // ── Lifecycle: Offboarding ──
  getOffboardingCases: async (params: { status?: string } = {}) => {
    const res = await apiClient.get<{ success: boolean; count: number; data: OffboardingCase[] }>('/hr/lifecycle/offboarding', { params });
    return res.data.data;
  },

  createOffboardingCase: async (payload: { employeeId: string; reason?: string; lastWorkingDate: string; noticePeriodDays?: number }) => {
    const res = await apiClient.post<{ success: boolean; data: OffboardingCase }>('/hr/lifecycle/offboarding', payload);
    return res.data.data;
  },

  updateOffboardingClearance: async (id: string, payload: { department: 'it' | 'finance' | 'adminAssets' | 'hr'; isCleared: boolean; remarks?: string; finalSettlementAmount?: number }) => {
    const res = await apiClient.patch<{ success: boolean; data: OffboardingCase }>(`/hr/lifecycle/offboarding/${id}/clearance`, payload);
    return res.data.data;
  },

  submitExitInterview: async (id: string, payload: { feedback?: string; ratingOverall?: number; primaryReasonForLeaving?: string; wouldRecommendCompany?: boolean }) => {
    const res = await apiClient.patch<{ success: boolean; data: OffboardingCase }>(`/hr/lifecycle/offboarding/${id}/exit-interview`, payload);
    return res.data.data;
  },

  // ── Lifecycle: Helpdesk / Tickets ──
  getTickets: async (params: { status?: string; category?: string; priority?: string; employeeId?: string } = {}) => {
    const res = await apiClient.get<{ success: boolean; count: number; data: HrTicket[] }>('/hr/lifecycle/tickets', { params });
    return res.data.data;
  },

  createTicket: async (payload: { category: string; priority?: string; subject: string; description: string; employeeId?: string }) => {
    const res = await apiClient.post<{ success: boolean; data: HrTicket }>('/hr/lifecycle/tickets', payload);
    return res.data.data;
  },

  updateTicketStatus: async (id: string, payload: { status?: string; assignedTo?: string; resolutionNotes?: string }) => {
    const res = await apiClient.patch<{ success: boolean; data: HrTicket }>(`/hr/lifecycle/tickets/${id}`, payload);
    return res.data.data;
  },

  addTicketComment: async (id: string, message: string) => {
    const res = await apiClient.post<{ success: boolean; data: HrTicket }>(`/hr/lifecycle/tickets/${id}/comments`, { message });
    return res.data.data;
  },

  // ── Lifecycle: Letters, Policies & Announcements ──
  getLetterTemplates: async (params: { type?: string } = {}) => {
    const res = await apiClient.get<{ success: boolean; count: number; data: LetterTemplate[] }>('/hr/lifecycle/letters/templates', { params });
    return res.data.data;
  },

  generateLetterPdf: async (payload: { templateId: string; employeeId: string; customVariables?: Record<string, string> }) => {
    const res = await apiClient.post('/hr/lifecycle/letters/generate', payload, { responseType: 'blob' });
    return res.data;
  },

  getPolicies: async () => {
    const res = await apiClient.get<{ success: boolean; count: number; data: PolicyDocument[] }>('/hr/lifecycle/policies');
    return res.data.data;
  },

  acknowledgePolicy: async (id: string) => {
    const res = await apiClient.post<{ success: boolean; data: PolicyDocument }>(`/hr/lifecycle/policies/${id}/acknowledge`);
    return res.data.data;
  },

  getAnnouncements: async () => {
    const res = await apiClient.get<{ success: boolean; count: number; data: Announcement[] }>('/hr/lifecycle/announcements');
    return res.data.data;
  },

  createAnnouncement: async (payload: { title: string; content: string; priority?: string; targetDepartments?: string[]; isPinned?: boolean }) => {
    const res = await apiClient.post<{ success: boolean; data: Announcement }>('/hr/lifecycle/announcements', payload);
    return res.data.data;
  },

  // ── Talent: Skills & Matrix ──
  getSkills: async () => {
    const res = await apiClient.get<{ success: boolean; count: number; data: Skill[] }>('/hr/talent/skills');
    return res.data.data;
  },

  createSkill: async (payload: { name: string; category?: string; description?: string }) => {
    const res = await apiClient.post<{ success: boolean; data: Skill }>('/hr/talent/skills', payload);
    return res.data.data;
  },

  getEmployeeSkills: async (params: { employeeId?: string } = {}) => {
    const res = await apiClient.get<{ success: boolean; count: number; data: EmployeeSkill[] }>('/hr/talent/employee-skills', { params });
    return res.data.data;
  },

  upsertEmployeeSkill: async (payload: { employeeId: string; skillId: string; proficiencyLevel?: number; yearsOfExperience?: number; certifications?: Array<{ name: string; issuer?: string; issueDate?: string }> }) => {
    const res = await apiClient.post<{ success: boolean; data: EmployeeSkill }>('/hr/talent/employee-skills', payload);
    return res.data.data;
  },

  verifyEmployeeSkill: async (id: string) => {
    const res = await apiClient.patch<{ success: boolean; data: EmployeeSkill }>(`/hr/talent/employee-skills/${id}/verify`);
    return res.data.data;
  },

  // ── Talent: Training & LMS ──
  getTrainings: async (params: { status?: string } = {}) => {
    const res = await apiClient.get<{ success: boolean; count: number; data: Training[] }>('/hr/talent/trainings', { params });
    return res.data.data;
  },

  createTraining: async (payload: { title: string; description?: string; trainer?: string; mode?: string; startDate: string; endDate: string; capacity?: number; skillsCovered?: string[] }) => {
    const res = await apiClient.post<{ success: boolean; data: Training }>('/hr/talent/trainings', {
      ...payload,
      format: payload.mode === 'virtual' ? 'virtual_live' : payload.mode === 'classroom' ? 'in_person' : 'online_self_paced',
      scheduledDate: payload.startDate,
      maxCapacity: payload.capacity,
    });
    return res.data.data;
  },

  enrollInTraining: async (id: string, employeeId?: string) => {
    const res = await apiClient.post<{ success: boolean; data: Training }>(`/hr/talent/trainings/${id}/enroll`, { employeeId });
    return res.data.data;
  },

  updateEnrollmentStatus: async (id: string, enrollmentId: string, payload: { status: 'enrolled' | 'completed' | 'dropped'; score?: number; feedback?: string }) => {
    const res = await apiClient.patch<{ success: boolean; data: Training }>(`/hr/talent/trainings/${id}/enrollments/${enrollmentId}`, payload);
    return res.data.data;
  },

  // ── Talent: Headcount Planning & Manpower Requisition ──
  getHeadcountPlans: async (params: { fiscalYear?: number } = {}) => {
    const res = await apiClient.get<{ success: boolean; count: number; data: HeadcountPlan[] }>('/hr/talent/headcount-plans', { params });
    return res.data.data;
  },

  upsertHeadcountPlan: async (payload: { departmentId: string; fiscalYear?: number; targetHeadcount: number; allocatedBudget?: number; quarterlyTargets?: { q1: number; q2: number; q3: number; q4: number } }) => {
    const res = await apiClient.post<{ success: boolean; data: HeadcountPlan }>('/hr/talent/headcount-plans', payload);
    return res.data.data;
  },

  getHeadcountAnalytics: async (fiscalYear?: number) => {
    const res = await apiClient.get<{ success: boolean; data: HeadcountAnalytics }>('/hr/talent/headcount-analytics', {
      params: fiscalYear ? { fiscalYear } : {},
    });
    return res.data.data;
  },

  getRequisitions: async (params: { status?: string; departmentId?: string } = {}) => {
    const res = await apiClient.get<{ success: boolean; count: number; data: ManpowerRequisition[] }>('/hr/talent/requisitions', { params });
    return res.data.data;
  },

  createRequisition: async (payload: { departmentId: string; jobTitle: string; headcount: number; priority?: string; justification?: string; budgetPerHire?: number; requiredByDate: string }) => {
    const res = await apiClient.post<{ success: boolean; data: ManpowerRequisition }>('/hr/talent/requisitions', {
      ...payload,
      title: payload.jobTitle,
      openingsCount: payload.headcount,
      targetJoiningDate: payload.requiredByDate,
      salaryRange: payload.budgetPerHire !== undefined
        ? { min: payload.budgetPerHire, max: payload.budgetPerHire }
        : undefined,
    });
    return res.data.data;
  },

  approveRequisition: async (id: string) => {
    const res = await apiClient.patch<{ success: boolean; data: ManpowerRequisition; jobOpening?: any }>(`/hr/talent/requisitions/${id}/approve`);
    return res.data;
  },
};
