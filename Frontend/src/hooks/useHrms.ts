import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { hrmsApi } from '../lib/hrmsApi';
import type {
  AttendanceSummary,
  AttendanceToday,
  DepartmentInput,
  DocType,
  EmployeeInput,
  HolidayInput,
  LeaveRequestInput,
  LeaveTypeInput,
  ShiftInput,
  RegularizationInput,
  CompOffInput,
  BranchLocationInput,
  DesignationInput,
  PromoteTransferInput,
  PayrollRunInput,
  SalaryStructureInput,
  GoalInput,
  ReviewCycleInput,
} from '../types/hrms';

// Shared query keys
export const hrmsKeys = {
  employees: ['hrms', 'employees'] as const,
  employee: (id: string) => ['hrms', 'employee', id] as const,
  departments: ['hrms', 'departments'] as const,
  department: (id: string) => ['hrms', 'department', id] as const,
  attendanceToday: ['hrms', 'attendance', 'today'] as const,
  attendanceSummary: (params: Record<string, unknown>) => ['hrms', 'attendance', 'summary', params] as const,
  attendanceRoster: (date?: string) => ['hrms', 'attendance', 'roster', date ?? 'today'] as const,
  leaveTypes: ['hrms', 'leaves', 'types'] as const,
  leaveBalances: (params: Record<string, unknown>) => ['hrms', 'leaves', 'balance', params] as const,
  leaveRequests: (params: Record<string, unknown>) => ['hrms', 'leaves', 'requests', params] as const,
  leaveLedger: (params: Record<string, unknown>) => ['hrms', 'leaves', 'ledger', params] as const,
  compOffRequests: (params: Record<string, unknown>) => ['hrms', 'leaves', 'compOff', params] as const,
  holidays: (year?: number) => ['hrms', 'holidays', year ?? 'all'] as const,
  upcomingHolidays: ['hrms', 'holidays', 'upcoming'] as const,
  summary: ['hrms', 'summary'] as const,
  shifts: ['hrms', 'shifts'] as const,
  activeShift: (empId: string) => ['hrms', 'shift', 'active', empId] as const,
  regularizations: (params: Record<string, unknown>) => ['hrms', 'regularizations', params] as const,
  branches: ['hrms', 'branches'] as const,
  designations: (params: Record<string, unknown>) => ['hrms', 'designations', params] as const,
  orgChart: (params: Record<string, unknown>) => ['hrms', 'orgChart', params] as const,
  jobHistory: (employeeId: string) => ['hrms', 'jobHistory', employeeId] as const,
  payrollRuns: ['hrms', 'payroll', 'runs'] as const,
  payrollRun: (id: string) => ['hrms', 'payroll', 'run', id] as const,
  myPayslips: ['hrms', 'payroll', 'myPayslips'] as const,
  payslip: (id: string) => ['hrms', 'payroll', 'payslip', id] as const,
  salaryStructure: (empId: string) => ['hrms', 'payroll', 'salaryStructure', empId] as const,
  goals: (params: Record<string, unknown>) => ['hrms', 'performance', 'goals', params] as const,
  goal: (id: string) => ['hrms', 'performance', 'goal', id] as const,
  reviewCycles: ['hrms', 'performance', 'reviewCycles'] as const,
  reviews: (params: Record<string, unknown>) => ['hrms', 'performance', 'reviews', params] as const,
  review: (id: string) => ['hrms', 'performance', 'review', id] as const,
  nineBoxGrid: (deptId?: string) => ['hrms', 'performance', 'nineBox', deptId ?? 'all'] as const,
  attritionRisks: (level?: string) => ['hrms', 'performance', 'attritionRisks', level ?? 'all'] as const,
  onboardingCases: (params: Record<string, unknown> = {}) => ['hrms', 'lifecycle', 'onboarding', params] as const,
  onboardingCase: (id: string) => ['hrms', 'lifecycle', 'onboardingCase', id] as const,
  offboardingCases: (params: Record<string, unknown> = {}) => ['hrms', 'lifecycle', 'offboarding', params] as const,
  tickets: (params: Record<string, unknown> = {}) => ['hrms', 'lifecycle', 'tickets', params] as const,
  letterTemplates: ['hrms', 'lifecycle', 'letterTemplates'] as const,
  policies: ['hrms', 'lifecycle', 'policies'] as const,
  announcements: ['hrms', 'lifecycle', 'announcements'] as const,
  skills: ['hrms', 'talent', 'skills'] as const,
  employeeSkills: (params: Record<string, unknown> = {}) => ['hrms', 'talent', 'employeeSkills', params] as const,
  trainings: (params: Record<string, unknown> = {}) => ['hrms', 'talent', 'trainings', params] as const,
  headcountPlans: (params: Record<string, unknown> = {}) => ['hrms', 'talent', 'headcountPlans', params] as const,
  headcountAnalytics: (year?: number) => ['hrms', 'talent', 'headcountAnalytics', year ?? 'current'] as const,
  requisitions: (params: Record<string, unknown> = {}) => ['hrms', 'talent', 'requisitions', params] as const,
};

const getErrMessage = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { error?: string } }; message?: string };
  return e?.response?.data?.error || e?.message || fallback;
};

// ─────────────────────────────────────────────────────────
// Employees
// ─────────────────────────────────────────────────────────
export const useEmployees = (
  params: { department?: string; status?: string; employmentType?: string; search?: string } = {}
) =>
  useQuery< Awaited<ReturnType<typeof hrmsApi.getEmployees>>, Error>({
    queryKey: [...hrmsKeys.employees, params],
    queryFn: () => hrmsApi.getEmployees(params),
  });

export const useEmployee = (id: string | null) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getEmployee>>, Error>({
    queryKey: hrmsKeys.employee(id || ''),
    queryFn: () => hrmsApi.getEmployee(id as string),
    enabled: !!id,
  });

export const useCreateEmployee = () => {
  const qc = useQueryClient();
  return useMutation<Awaited<ReturnType<typeof hrmsApi.createEmployee>>, Error, EmployeeInput>({
    mutationFn: (input) => hrmsApi.createEmployee(input),
    onSuccess: (employee) => {
      toast.success(`Employee "${employee.fullName}" created.`);
      qc.invalidateQueries({ queryKey: hrmsKeys.employees });
      qc.invalidateQueries({ queryKey: hrmsKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create employee.')),
  });
};

export const useUpdateEmployee = () => {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof hrmsApi.updateEmployee>>,
    Error,
    { id: string; patch: Partial<EmployeeInput> }
  >({
    mutationFn: ({ id, patch }) => hrmsApi.updateEmployee(id, patch),
    onSuccess: (employee) => {
      qc.invalidateQueries({ queryKey: hrmsKeys.employees });
      qc.invalidateQueries({ queryKey: hrmsKeys.employee(employee._id) });
      qc.invalidateQueries({ queryKey: hrmsKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update employee.')),
  });
};

export const useDeleteEmployee = () => {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => hrmsApi.deleteEmployee(id),
    onSuccess: () => {
      toast.info('Employee deleted.');
      qc.invalidateQueries({ queryKey: hrmsKeys.employees });
      qc.invalidateQueries({ queryKey: hrmsKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to delete employee.')),
  });
};

// ─────────────────────────────────────────────────────────
// Departments
// ─────────────────────────────────────────────────────────
export const useDepartments = (params: { search?: string } = {}) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getDepartments>>, Error>({
    queryKey: [...hrmsKeys.departments, params],
    queryFn: () => hrmsApi.getDepartments(params),
  });

export const useDepartment = (id: string | null) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getDepartment>>, Error>({
    queryKey: hrmsKeys.department(id || ''),
    queryFn: () => hrmsApi.getDepartment(id as string),
    enabled: !!id,
  });

export const useCreateDepartment = () => {
  const qc = useQueryClient();
  return useMutation<Awaited<ReturnType<typeof hrmsApi.createDepartment>>, Error, DepartmentInput>({
    mutationFn: (input) => hrmsApi.createDepartment(input),
    onSuccess: (dept) => {
      toast.success(`Department "${dept.name}" created.`);
      qc.invalidateQueries({ queryKey: hrmsKeys.departments });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create department.')),
  });
};

export const useUpdateDepartment = () => {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof hrmsApi.updateDepartment>>,
    Error,
    { id: string; patch: Partial<DepartmentInput> }
  >({
    mutationFn: ({ id, patch }) => hrmsApi.updateDepartment(id, patch),
    onSuccess: (dept) => {
      qc.invalidateQueries({ queryKey: hrmsKeys.departments });
      qc.invalidateQueries({ queryKey: hrmsKeys.department(dept._id) });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update department.')),
  });
};

export const useDeleteDepartment = () => {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => hrmsApi.deleteDepartment(id),
    onSuccess: () => {
      toast.info('Department deleted.');
      qc.invalidateQueries({ queryKey: hrmsKeys.departments });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to delete department.')),
  });
};

// ─────────────────────────────────────────────────────────
// Attendance
// ─────────────────────────────────────────────────────────

/**
 * Live today state — refetches on window focus and polls every 60s so a
 * stale tab never shows a wrong check-in state.
 */
export const useAttendanceToday = () =>
  useQuery<AttendanceToday, Error>({
    queryKey: hrmsKeys.attendanceToday,
    queryFn: () => hrmsApi.getAttendanceToday(),
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60,
  });

/**
 * Check-in / check-out / break actions with optimistic state flip:
 * the "today" cache is patched immediately and reconciled by the
 * server response in onSuccess.
 */
export const useAttendanceAction = () => {
  const qc = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof hrmsApi.attendanceAction>>,
    Error,
    'check-in' | 'check-out' | 'break-in' | 'break-out',
    { previousToday?: AttendanceToday }
  >({
    mutationFn: (action) => hrmsApi.attendanceAction(action),

    onMutate: async (action) => {
      await qc.cancelQueries({ queryKey: hrmsKeys.attendanceToday });
      const previousToday = qc.getQueryData<AttendanceToday>(hrmsKeys.attendanceToday);

      if (previousToday) {
        const next: AttendanceToday = { ...previousToday };
        if (action === 'check-in') {
          next.currentStatus = 'checked_in';
          next.checkInAt = new Date().toISOString();
          next.totalWorkedMinutes = 0;
        } else if (action === 'check-out') {
          next.currentStatus = 'checked_out';
          next.checkOutAt = new Date().toISOString();
        } else if (action === 'break-in') {
          next.currentStatus = 'on_break';
        } else if (action === 'break-out') {
          next.currentStatus = 'checked_in';
        }
        qc.setQueryData<AttendanceToday>(hrmsKeys.attendanceToday, next);
      }

      return { previousToday };
    },

    onError: (_err, _action, context) => {
      if (context?.previousToday) {
        qc.setQueryData(hrmsKeys.attendanceToday, context.previousToday);
      }
      toast.error(getErrMessage(_err, 'Attendance action failed.'));
    },

    onSuccess: (data, action) => {
      toast.success(data.message);
      // Reconcile with the authoritative server state — including the
      // platform /attendance cache used by the Dashboard attendance card
      qc.invalidateQueries({ queryKey: hrmsKeys.attendanceToday });
      qc.invalidateQueries({ queryKey: hrmsKeys.attendanceRoster() });
      qc.invalidateQueries({ queryKey: ['hrms', 'attendance'] });
      qc.invalidateQueries({ queryKey: ['attendance'] });
      qc.invalidateQueries({ queryKey: hrmsKeys.summary });
      void action;
    },
  });
};

export const useAttendanceSummary = (
  params: { month?: number; year?: number; employeeId?: string } = {}
) =>
  useQuery<AttendanceSummary, Error>({
    queryKey: hrmsKeys.attendanceSummary(params),
    queryFn: () => hrmsApi.getAttendanceSummary(params),
  });

export const useAttendanceRoster = (date?: string) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getAttendanceRoster>>, Error>({
    queryKey: hrmsKeys.attendanceRoster(date),
    queryFn: () => hrmsApi.getAttendanceRoster(date),
  });

// ─────────────────────────────────────────────────────────
// Leave
// ─────────────────────────────────────────────────────────
export const useLeaveTypes = () =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getLeaveTypes>>, Error>({
    queryKey: hrmsKeys.leaveTypes,
    queryFn: () => hrmsApi.getLeaveTypes(),
    staleTime: 1000 * 60 * 5,
  });

export const useLeaveBalances = (params: { employeeId?: string; year?: number } = {}) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getLeaveBalances>>, Error>({
    queryKey: hrmsKeys.leaveBalances(params),
    queryFn: () => hrmsApi.getLeaveBalances(params),
  });

export const useLeaveRequests = (
  params: { status?: string; employeeId?: string; from?: string; to?: string } = {}
) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getLeaveRequests>>, Error>({
    queryKey: hrmsKeys.leaveRequests(params),
    queryFn: () => hrmsApi.getLeaveRequests(params),
  });

export const useCreateLeaveRequest = () => {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof hrmsApi.createLeaveRequest>>,
    Error,
    LeaveRequestInput
  >({
    mutationFn: (input) => hrmsApi.createLeaveRequest(input),
    onSuccess: () => {
      toast.success('Leave request submitted.');
      qc.invalidateQueries({ queryKey: ['hrms', 'leaves'] });
      qc.invalidateQueries({ queryKey: ['leaves'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      qc.invalidateQueries({ queryKey: hrmsKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to submit leave request.')),
  });
};

/** Approve/reject with optimistic row removal from the pending list */
export const useReviewLeaveRequest = () => {
  const qc = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof hrmsApi.approveLeaveRequest>>,
    Error,
    { id: string; decision: 'approve' | 'reject' }
  >({
    mutationFn: ({ id, decision }) =>
      decision === 'approve' ? hrmsApi.approveLeaveRequest(id) : hrmsApi.rejectLeaveRequest(id),

    onMutate: async ({ id, decision }) => {
      await qc.cancelQueries({ queryKey: ['hrms', 'leaves'] });
      toast[decision === 'approve' ? 'success' : 'info'](
        decision === 'approve' ? 'Leave request approved.' : 'Leave request rejected.'
      );
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hrms', 'leaves'] });
      qc.invalidateQueries({ queryKey: ['hrms', 'attendance'] });
      qc.invalidateQueries({ queryKey: ['leaves'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      qc.invalidateQueries({ queryKey: hrmsKeys.summary });
    },

    onError: (err) => toast.error(getErrMessage(err, 'Failed to review leave request.')),
  });
};

export const useCreateLeaveType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LeaveTypeInput) => hrmsApi.createLeaveType(input),
    onSuccess: (lt) => {
      toast.success(`Leave type "${lt.name}" created.`);
      qc.invalidateQueries({ queryKey: hrmsKeys.leaveTypes });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create leave type.')),
  });
};

export const useUpdateLeaveType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<LeaveTypeInput> }) =>
      hrmsApi.updateLeaveType(id, patch),
    onSuccess: (lt) => {
      toast.success(`Leave policy for "${lt.name}" updated.`);
      qc.invalidateQueries({ queryKey: hrmsKeys.leaveTypes });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update leave policy.')),
  });
};

export const useLeaveLedger = (params: { employeeId?: string; year?: number; transactionType?: string } = {}) =>
  useQuery({
    queryKey: hrmsKeys.leaveLedger(params),
    queryFn: () => hrmsApi.getLeaveLedger(params),
  });

export const useRunMonthlyAccrual = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { month?: number; year?: number } = {}) => hrmsApi.runMonthlyAccrual(payload),
    onSuccess: (res) => {
      toast.success(
        `Monthly accrual processed: ${res.totalCreditsIssued} day(s) credited across ${res.employeesProcessed} employee(s).`
      );
      qc.invalidateQueries({ queryKey: ['hrms', 'leaves'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to run monthly accrual.')),
  });
};

export const useCompOffRequests = (params: { status?: string; employeeId?: string } = {}) =>
  useQuery({
    queryKey: hrmsKeys.compOffRequests(params),
    queryFn: () => hrmsApi.getCompOffRequests(params),
  });

export const useCreateCompOff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CompOffInput) => hrmsApi.createCompOffRequest(input),
    onSuccess: () => {
      toast.success('Compensatory off request submitted.');
      qc.invalidateQueries({ queryKey: ['hrms', 'leaves', 'compOff'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to submit comp-off request.')),
  });
};

export const useReviewCompOff = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, comments }: { id: string; decision: 'approve' | 'reject'; comments?: string }) =>
      decision === 'approve' ? hrmsApi.approveCompOff(id, comments) : hrmsApi.rejectCompOff(id, comments),
    onSuccess: (_, vars) => {
      toast.success(
        vars.decision === 'approve'
          ? 'Comp-off approved & credited to leave balance.'
          : 'Comp-off request rejected.'
      );
      qc.invalidateQueries({ queryKey: ['hrms', 'leaves'] });
      qc.invalidateQueries({ queryKey: hrmsKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to review comp-off request.')),
  });
};

// ─────────────────────────────────────────────────────────
// Holidays
// ─────────────────────────────────────────────────────────
export const useHolidays = (year?: number) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getHolidays>>, Error>({
    queryKey: hrmsKeys.holidays(year),
    queryFn: () => hrmsApi.getHolidays(year),
  });

export const useUpcomingHolidays = (limit = 5) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getUpcomingHolidays>>, Error>({
    queryKey: [...hrmsKeys.upcomingHolidays, limit],
    queryFn: () => hrmsApi.getUpcomingHolidays(limit),
    staleTime: 1000 * 60 * 5,
  });

export const useCreateHoliday = () => {
  const qc = useQueryClient();
  return useMutation<Awaited<ReturnType<typeof hrmsApi.createHoliday>>, Error, HolidayInput>({
    mutationFn: (input) => hrmsApi.createHoliday(input),
    onSuccess: (holiday) => {
      toast.success(`Holiday "${holiday.name}" created.`);
      qc.invalidateQueries({ queryKey: ['hrms', 'holidays'] });
      qc.invalidateQueries({ queryKey: hrmsKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create holiday.')),
  });
};

export const useUpdateHoliday = () => {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof hrmsApi.updateHoliday>>,
    Error,
    { id: string; patch: Partial<HolidayInput> }
  >({
    mutationFn: ({ id, patch }) => hrmsApi.updateHoliday(id, patch),
    onSuccess: (holiday) => {
      toast.success(`Holiday "${holiday.name}" updated.`);
      qc.invalidateQueries({ queryKey: ['hrms', 'holidays'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update holiday.')),
  });
};

export const useDeleteHoliday = () => {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => hrmsApi.deleteHoliday(id),
    onSuccess: () => {
      toast.info('Holiday deleted.');
      qc.invalidateQueries({ queryKey: ['hrms', 'holidays'] });
      qc.invalidateQueries({ queryKey: hrmsKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to delete holiday.')),
  });
};

// ─────────────────────────────────────────────────────────
// Documents
// ─────────────────────────────────────────────────────────
export const useEmployeeDocuments = (employeeId: string | null) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getEmployeeDocuments>>, Error>({
    queryKey: ['hrms', 'employee', employeeId ?? '', 'documents'],
    queryFn: () => hrmsApi.getEmployeeDocuments(employeeId as string),
    enabled: !!employeeId,
  });

export const useUploadEmployeeDocument = () => {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof hrmsApi.uploadEmployeeDocument>>,
    Error,
    { employeeId: string; input: { docType: DocType; fileName: string; fileUrl: string } }
  >({
    mutationFn: ({ employeeId, input }) => hrmsApi.uploadEmployeeDocument(employeeId, input),
    onSuccess: (doc) => {
      toast.success(`Document "${doc.fileName}" uploaded.`);
      qc.invalidateQueries({ queryKey: ['hrms', 'employee', doc.employeeId, 'documents'] });
      qc.invalidateQueries({ queryKey: hrmsKeys.employee(doc.employeeId) });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to upload document.')),
  });
};

export const useDeleteEmployeeDocument = () => {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, { id: string; employeeId: string }>({
    mutationFn: ({ id }) => hrmsApi.deleteEmployeeDocument(id),
    onSuccess: (_data, vars) => {
      toast.info('Document deleted.');
      qc.invalidateQueries({ queryKey: ['hrms', 'employee', vars.employeeId, 'documents'] });
      qc.invalidateQueries({ queryKey: hrmsKeys.employee(vars.employeeId) });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to delete document.')),
  });
};

// ─────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────
export const useHrSummary = (options: { enabled?: boolean } = {}) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getSummary>>, Error>({
    queryKey: hrmsKeys.summary,
    queryFn: () => hrmsApi.getSummary(),
    staleTime: 1000 * 60,
    enabled: options.enabled ?? true,
  });

// ─────────────────────────────────────────────────────────
// Shifts
// ─────────────────────────────────────────────────────────
export const useShifts = () =>
  useQuery({
    queryKey: hrmsKeys.shifts,
    queryFn: () => hrmsApi.getShifts(),
    staleTime: 1000 * 60 * 5,
  });

export const useCreateShift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ShiftInput) => hrmsApi.createShift(input),
    onSuccess: (shift) => {
      toast.success(`Shift "${shift.name}" created.`);
      qc.invalidateQueries({ queryKey: hrmsKeys.shifts });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create shift.')),
  });
};

export const useUpdateShift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ShiftInput> }) =>
      hrmsApi.updateShift(id, patch),
    onSuccess: (shift) => {
      toast.success(`Shift "${shift.name}" updated.`);
      qc.invalidateQueries({ queryKey: hrmsKeys.shifts });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update shift.')),
  });
};

export const useDeleteShift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrmsApi.deleteShift(id),
    onSuccess: () => {
      toast.info('Shift deleted.');
      qc.invalidateQueries({ queryKey: hrmsKeys.shifts });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to delete shift.')),
  });
};

export const useAssignShift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { employeeIds: string[]; shiftId: string; effectiveFrom: string; effectiveTo?: string | null }) =>
      hrmsApi.assignShift(payload),
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ['hrms', 'attendance'] });
      qc.invalidateQueries({ queryKey: hrmsKeys.shifts });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to assign shift.')),
  });
};

export const useActiveShift = (employeeId: string) =>
  useQuery({
    queryKey: hrmsKeys.activeShift(employeeId),
    queryFn: () => hrmsApi.getActiveShift(employeeId),
    enabled: !!employeeId,
  });

// ─────────────────────────────────────────────────────────
// Attendance Regularizations
// ─────────────────────────────────────────────────────────
export const useRegularizations = (params: { status?: string; employeeId?: string } = {}) =>
  useQuery({
    queryKey: hrmsKeys.regularizations(params),
    queryFn: () => hrmsApi.getRegularizations(params),
  });

export const useCreateRegularization = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegularizationInput) => hrmsApi.createRegularization(input),
    onSuccess: () => {
      toast.success('Regularization request submitted.');
      qc.invalidateQueries({ queryKey: ['hrms', 'regularizations'] });
      qc.invalidateQueries({ queryKey: hrmsKeys.attendanceToday });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to submit regularization.')),
  });
};

export const useReviewRegularization = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, comments }: { id: string; decision: 'approve' | 'reject'; comments?: string }) =>
      decision === 'approve'
        ? hrmsApi.approveRegularization(id, comments)
        : hrmsApi.rejectRegularization(id, comments),
    onSuccess: (res, vars) => {
      toast.success(vars.decision === 'approve' ? 'Punch regularized & attendance updated.' : 'Regularization request rejected.');
      qc.invalidateQueries({ queryKey: ['hrms', 'regularizations'] });
      qc.invalidateQueries({ queryKey: ['hrms', 'attendance'] });
      qc.invalidateQueries({ queryKey: hrmsKeys.attendanceToday });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to process regularization decision.')),
  });
};

// ─────────────────────────────────────────────────────────
// PHASE 3 — Branch Locations
// ─────────────────────────────────────────────────────────
export const useBranches = () =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getBranches>>, Error>({
    queryKey: hrmsKeys.branches,
    queryFn: () => hrmsApi.getBranches(),
  });

export const useCreateBranch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BranchLocationInput) => hrmsApi.createBranch(input),
    onSuccess: () => {
      toast.success('Branch location created.');
      qc.invalidateQueries({ queryKey: hrmsKeys.branches });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create branch location.')),
  });
};

export const useUpdateBranch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<BranchLocationInput> }) =>
      hrmsApi.updateBranch(id, patch),
    onSuccess: () => {
      toast.success('Branch location updated.');
      qc.invalidateQueries({ queryKey: hrmsKeys.branches });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update branch location.')),
  });
};

export const useDeleteBranch = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrmsApi.deleteBranch(id),
    onSuccess: () => {
      toast.success('Branch location removed.');
      qc.invalidateQueries({ queryKey: hrmsKeys.branches });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to delete branch location.')),
  });
};

// ─────────────────────────────────────────────────────────
// PHASE 3 — Designations & Job Grades
// ─────────────────────────────────────────────────────────
export const useDesignations = (params: { departmentId?: string; gradeLevel?: string } = {}) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getDesignations>>, Error>({
    queryKey: hrmsKeys.designations(params),
    queryFn: () => hrmsApi.getDesignations(params),
  });

export const useCreateDesignation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DesignationInput) => hrmsApi.createDesignation(input),
    onSuccess: () => {
      toast.success('Designation created.');
      qc.invalidateQueries({ queryKey: ['hrms', 'designations'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create designation.')),
  });
};

export const useUpdateDesignation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<DesignationInput> }) =>
      hrmsApi.updateDesignation(id, patch),
    onSuccess: () => {
      toast.success('Designation updated.');
      qc.invalidateQueries({ queryKey: ['hrms', 'designations'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update designation.')),
  });
};

export const useDeleteDesignation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrmsApi.deleteDesignation(id),
    onSuccess: () => {
      toast.success('Designation deleted.');
      qc.invalidateQueries({ queryKey: ['hrms', 'designations'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to delete designation.')),
  });
};

// ─────────────────────────────────────────────────────────
// PHASE 3 — Interactive Org Chart
// ─────────────────────────────────────────────────────────
export const useOrgChart = (params: { departmentId?: string; branchId?: string } = {}) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getOrgChart>>, Error>({
    queryKey: hrmsKeys.orgChart(params),
    queryFn: () => hrmsApi.getOrgChart(params),
  });

// ─────────────────────────────────────────────────────────
// PHASE 3 — Employee Lifecycle & History
// ─────────────────────────────────────────────────────────
export const useEmployeeJobHistory = (employeeId: string | null) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getEmployeeJobHistory>>, Error>({
    queryKey: hrmsKeys.jobHistory(employeeId || ''),
    queryFn: () => hrmsApi.getEmployeeJobHistory(employeeId as string),
    enabled: !!employeeId,
  });

export const usePromoteTransfer = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: PromoteTransferInput }) =>
      hrmsApi.promoteOrTransfer(id, payload),
    onSuccess: (_, vars) => {
      toast.success('Employee career transition executed successfully.');
      qc.invalidateQueries({ queryKey: hrmsKeys.employee(vars.id) });
      qc.invalidateQueries({ queryKey: hrmsKeys.employees });
      qc.invalidateQueries({ queryKey: hrmsKeys.jobHistory(vars.id) });
      qc.invalidateQueries({ queryKey: ['hrms', 'orgChart'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to execute transition.')),
  });
};

// ─────────────────────────────────────────────────────────
// PHASE 4 — Enterprise Payroll & Compliance
// ─────────────────────────────────────────────────────────
export const usePayrollRuns = () =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getPayrollRuns>>, Error>({
    queryKey: hrmsKeys.payrollRuns,
    queryFn: () => hrmsApi.getPayrollRuns(),
  });

export const usePayrollRun = (id: string | null) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getPayrollRun>>, Error>({
    queryKey: hrmsKeys.payrollRun(id || ''),
    queryFn: () => hrmsApi.getPayrollRun(id as string),
    enabled: !!id,
  });

export const useCreatePayrollRun = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PayrollRunInput) => hrmsApi.createPayrollRun(input),
    onSuccess: (res) => {
      toast.success(res.message || 'Payroll run generated.');
      qc.invalidateQueries({ queryKey: hrmsKeys.payrollRuns });
      qc.invalidateQueries({ queryKey: hrmsKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to generate payroll run.')),
  });
};

export const useUpdatePayslipLineItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      hrmsApi.updatePayslipLineItem(id, patch),
    onSuccess: (res, vars) => {
      toast.success('Payslip line item updated.');
      qc.invalidateQueries({ queryKey: hrmsKeys.payslip(vars.id) });
      qc.invalidateQueries({ queryKey: hrmsKeys.payrollRuns });
      qc.invalidateQueries({ queryKey: ['hrms', 'payroll', 'run'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update payslip line item.')),
  });
};

export const useApprovePayrollRun = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrmsApi.approvePayrollRun(id),
    onSuccess: (res, id) => {
      toast.success(res.message || 'Payroll run approved & published.');
      qc.invalidateQueries({ queryKey: hrmsKeys.payrollRuns });
      qc.invalidateQueries({ queryKey: hrmsKeys.payrollRun(id) });
      qc.invalidateQueries({ queryKey: hrmsKeys.myPayslips });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to approve payroll run.')),
  });
};

export const useMarkPayrollPaid = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: { paymentReference?: string; paymentDate?: string } }) =>
      hrmsApi.markPayrollPaid(id, payload),
    onSuccess: (res, vars) => {
      toast.success(res.message || 'Payroll disbursed & marked paid.');
      qc.invalidateQueries({ queryKey: hrmsKeys.payrollRuns });
      qc.invalidateQueries({ queryKey: hrmsKeys.payrollRun(vars.id) });
      qc.invalidateQueries({ queryKey: hrmsKeys.myPayslips });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to mark payroll as paid.')),
  });
};

export const useMyPayslips = () =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getMyPayslips>>, Error>({
    queryKey: hrmsKeys.myPayslips,
    queryFn: () => hrmsApi.getMyPayslips(),
  });

export const usePayslip = (id: string | null) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getPayslip>>, Error>({
    queryKey: hrmsKeys.payslip(id || ''),
    queryFn: () => hrmsApi.getPayslip(id as string),
    enabled: !!id,
  });

export const useSalaryStructure = (employeeId: string | null) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getSalaryStructure>>, Error>({
    queryKey: hrmsKeys.salaryStructure(employeeId || ''),
    queryFn: () => hrmsApi.getSalaryStructure(employeeId as string),
    enabled: !!employeeId,
  });

export const useUpsertSalaryStructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, input }: { employeeId: string; input: SalaryStructureInput }) =>
      hrmsApi.upsertSalaryStructure(employeeId, input),
    onSuccess: (res, vars) => {
      toast.success('Salary structure saved successfully.');
      qc.invalidateQueries({ queryKey: hrmsKeys.salaryStructure(vars.employeeId) });
      qc.invalidateQueries({ queryKey: hrmsKeys.employee(vars.employeeId) });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to save salary structure.')),
  });
};

// ─────────────────────────────────────────────────────────
// PHASE 5 — Performance Management & OKRs
// ─────────────────────────────────────────────────────────
export const useGoals = (params: { employeeId?: string; departmentId?: string; status?: string; period?: string } = {}) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getGoals>>, Error>({
    queryKey: hrmsKeys.goals(params),
    queryFn: () => hrmsApi.getGoals(params),
  });

export const useGoal = (id: string | null) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getGoal>>, Error>({
    queryKey: hrmsKeys.goal(id || ''),
    queryFn: () => hrmsApi.getGoal(id as string),
    enabled: !!id,
  });

export const useCreateGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GoalInput) => hrmsApi.createGoal(input),
    onSuccess: () => {
      toast.success('Goal created successfully.');
      qc.invalidateQueries({ queryKey: ['hrms', 'performance', 'goals'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create goal.')),
  });
};

export const useUpdateGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<GoalInput> & { status?: string } }) =>
      hrmsApi.updateGoal(id, patch),
    onSuccess: (res, vars) => {
      toast.success('Goal updated.');
      qc.invalidateQueries({ queryKey: ['hrms', 'performance', 'goals'] });
      qc.invalidateQueries({ queryKey: hrmsKeys.goal(vars.id) });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update goal.')),
  });
};

export const useDeleteGoal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrmsApi.deleteGoal(id),
    onSuccess: () => {
      toast.success('Goal archived.');
      qc.invalidateQueries({ queryKey: ['hrms', 'performance', 'goals'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to archive goal.')),
  });
};

export const useAddGoalCheckIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { note?: string; progress?: number; keyResults?: any[] } }) =>
      hrmsApi.addGoalCheckIn(id, payload),
    onSuccess: (res, vars) => {
      toast.success('Progress check-in logged.');
      qc.invalidateQueries({ queryKey: ['hrms', 'performance', 'goals'] });
      qc.invalidateQueries({ queryKey: hrmsKeys.goal(vars.id) });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to log check-in.')),
  });
};

// ── Review Cycles & Appraisals ──

export const useReviewCycles = () =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getReviewCycles>>, Error>({
    queryKey: hrmsKeys.reviewCycles,
    queryFn: () => hrmsApi.getReviewCycles(),
  });

export const useCreateReviewCycle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewCycleInput) => hrmsApi.createReviewCycle(input),
    onSuccess: () => {
      toast.success('Performance review cycle launched.');
      qc.invalidateQueries({ queryKey: hrmsKeys.reviewCycles });
      qc.invalidateQueries({ queryKey: ['hrms', 'performance', 'reviews'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to launch review cycle.')),
  });
};

export const useReviews = (params: { reviewCycleId?: string; employeeId?: string; managerId?: string; status?: string } = {}) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getReviews>>, Error>({
    queryKey: hrmsKeys.reviews(params),
    queryFn: () => hrmsApi.getReviews(params),
  });

export const useReview = (id: string | null) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getReview>>, Error>({
    queryKey: hrmsKeys.review(id || ''),
    queryFn: () => hrmsApi.getReview(id as string),
    enabled: !!id,
  });

export const useSubmitSelfReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { summary?: string; strengths?: string; growthAreas?: string; achievements?: string; rating?: number } }) =>
      hrmsApi.submitSelfReview(id, payload),
    onSuccess: (res, vars) => {
      toast.success('Self-appraisal submitted.');
      qc.invalidateQueries({ queryKey: ['hrms', 'performance', 'reviews'] });
      qc.invalidateQueries({ queryKey: hrmsKeys.review(vars.id) });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to submit self-review.')),
  });
};

export const useSubmitManagerReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { summary?: string; strengths?: string; growthAreas?: string; rating?: number; potentialRating?: number; recommendations?: string } }) =>
      hrmsApi.submitManagerReview(id, payload),
    onSuccess: (res, vars) => {
      toast.success('Manager review submitted.');
      qc.invalidateQueries({ queryKey: ['hrms', 'performance', 'reviews'] });
      qc.invalidateQueries({ queryKey: hrmsKeys.review(vars.id) });
      qc.invalidateQueries({ queryKey: ['hrms', 'performance', 'nineBox'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to submit manager review.')),
  });
};

export const useCalibrateReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { performanceScore?: number; potentialScore?: number; promotionRecommended?: boolean; salaryIncrementPercentage?: number; calibrationNotes?: string } }) =>
      hrmsApi.calibrateReview(id, payload),
    onSuccess: (res, vars) => {
      toast.success('Calibration finalized.');
      qc.invalidateQueries({ queryKey: ['hrms', 'performance', 'reviews'] });
      qc.invalidateQueries({ queryKey: hrmsKeys.review(vars.id) });
      qc.invalidateQueries({ queryKey: ['hrms', 'performance', 'nineBox'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to finalize calibration.')),
  });
};

// ── 9-Box Grid ──

export const useNineBoxGrid = (departmentId?: string) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getNineBoxGrid>>, Error>({
    queryKey: hrmsKeys.nineBoxGrid(departmentId),
    queryFn: () => hrmsApi.getNineBoxGrid(departmentId),
  });

// ── Attrition Risk ──

export const useAttritionRisks = (riskLevel?: string) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getAttritionRisks>>, Error>({
    queryKey: hrmsKeys.attritionRisks(riskLevel),
    queryFn: () => hrmsApi.getAttritionRisks(riskLevel),
  });

export const useRecomputeAttritionRisks = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => hrmsApi.recomputeAttritionRisks(),
    onSuccess: () => {
      toast.success('Workforce attrition risk model recomputed.');
      qc.invalidateQueries({ queryKey: ['hrms', 'performance', 'attritionRisks'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to recompute attrition risks.')),
  });
};

// ── HR AI Copilot ──

export const useHrmsCopilot = () =>
  useMutation({
    mutationFn: (prompt: string) => hrmsApi.queryHrmsCopilot(prompt),
    onError: (err) => toast.error(getErrMessage(err, 'Copilot query failed.')),
  });

// ─────────────────────────────────────────────────────────
// Lifecycle: Onboarding
// ─────────────────────────────────────────────────────────

export const useOnboardingCases = (params: { status?: string } = {}) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getOnboardingCases>>, Error>({
    queryKey: hrmsKeys.onboardingCases(params),
    queryFn: () => hrmsApi.getOnboardingCases(params),
  });

export const useOnboardingCase = (id: string | null) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getOnboardingCase>>, Error>({
    queryKey: hrmsKeys.onboardingCase(id || ''),
    queryFn: () => hrmsApi.getOnboardingCase(id as string),
    enabled: !!id,
  });

export const useCreateOnboardingCase = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { employeeId: string; joiningDate?: string; templateId?: string }) =>
      hrmsApi.createOnboardingCase(payload),
    onSuccess: () => {
      toast.success('Onboarding case initiated.');
      qc.invalidateQueries({ queryKey: ['hrms', 'lifecycle', 'onboarding'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to initiate onboarding.')),
  });
};

export const useToggleOnboardingTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, taskId, payload }: { id: string; taskId: string; payload: { isCompleted: boolean; notes?: string } }) =>
      hrmsApi.toggleOnboardingTask(id, taskId, payload),
    onSuccess: (_data, vars) => {
      toast.success('Task progress updated.');
      qc.invalidateQueries({ queryKey: ['hrms', 'lifecycle', 'onboarding'] });
      qc.invalidateQueries({ queryKey: hrmsKeys.onboardingCase(vars.id) });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update task.')),
  });
};

// ─────────────────────────────────────────────────────────
// Lifecycle: Offboarding
// ─────────────────────────────────────────────────────────

export const useOffboardingCases = (params: { status?: string } = {}) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getOffboardingCases>>, Error>({
    queryKey: hrmsKeys.offboardingCases(params),
    queryFn: () => hrmsApi.getOffboardingCases(params),
  });

export const useCreateOffboardingCase = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { employeeId: string; reason?: string; lastWorkingDate: string; noticePeriodDays?: number }) =>
      hrmsApi.createOffboardingCase(payload),
    onSuccess: () => {
      toast.success('Offboarding case created.');
      qc.invalidateQueries({ queryKey: ['hrms', 'lifecycle', 'offboarding'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create offboarding case.')),
  });
};

export const useUpdateOffboardingClearance = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { department: 'it' | 'finance' | 'adminAssets' | 'hr'; isCleared: boolean; remarks?: string; finalSettlementAmount?: number } }) =>
      hrmsApi.updateOffboardingClearance(id, payload),
    onSuccess: () => {
      toast.success('Department clearance status updated.');
      qc.invalidateQueries({ queryKey: ['hrms', 'lifecycle', 'offboarding'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update clearance.')),
  });
};

export const useSubmitExitInterview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { feedback?: string; ratingOverall?: number; primaryReasonForLeaving?: string; wouldRecommendCompany?: boolean } }) =>
      hrmsApi.submitExitInterview(id, payload),
    onSuccess: () => {
      toast.success('Exit interview feedback submitted.');
      qc.invalidateQueries({ queryKey: ['hrms', 'lifecycle', 'offboarding'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to submit exit interview.')),
  });
};

// ─────────────────────────────────────────────────────────
// Lifecycle: Helpdesk / Tickets
// ─────────────────────────────────────────────────────────

export const useHrTickets = (params: { status?: string; category?: string; priority?: string; employeeId?: string } = {}) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getTickets>>, Error>({
    queryKey: hrmsKeys.tickets(params),
    queryFn: () => hrmsApi.getTickets(params),
  });

export const useCreateHrTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { category: string; priority?: string; subject: string; description: string; employeeId?: string }) =>
      hrmsApi.createTicket(payload),
    onSuccess: () => {
      toast.success('Support ticket created.');
      qc.invalidateQueries({ queryKey: ['hrms', 'lifecycle', 'tickets'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create ticket.')),
  });
};

export const useUpdateTicketStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { status?: string; assignedTo?: string; resolutionNotes?: string } }) =>
      hrmsApi.updateTicketStatus(id, payload),
    onSuccess: () => {
      toast.success('Ticket updated.');
      qc.invalidateQueries({ queryKey: ['hrms', 'lifecycle', 'tickets'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update ticket.')),
  });
};

export const useAddTicketComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      hrmsApi.addTicketComment(id, message),
    onSuccess: () => {
      toast.success('Reply posted.');
      qc.invalidateQueries({ queryKey: ['hrms', 'lifecycle', 'tickets'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to post reply.')),
  });
};

// ─────────────────────────────────────────────────────────
// Lifecycle: Letters, Policies & Announcements
// ─────────────────────────────────────────────────────────

export const useLetterTemplates = (params: { type?: string } = {}) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getLetterTemplates>>, Error>({
    queryKey: [...hrmsKeys.letterTemplates, params],
    queryFn: () => hrmsApi.getLetterTemplates(params),
  });

export const useGenerateLetterPdf = () =>
  useMutation({
    mutationFn: (payload: { templateId: string; employeeId: string; customVariables?: Record<string, string> }) =>
      hrmsApi.generateLetterPdf(payload),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Official_Letter_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Official letter PDF generated.');
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to generate letter.')),
  });

export const usePolicies = () =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getPolicies>>, Error>({
    queryKey: hrmsKeys.policies,
    queryFn: () => hrmsApi.getPolicies(),
  });

export const useAcknowledgePolicy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrmsApi.acknowledgePolicy(id),
    onSuccess: () => {
      toast.success('Policy acknowledged.');
      qc.invalidateQueries({ queryKey: hrmsKeys.policies });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to acknowledge policy.')),
  });
};

export const useAnnouncements = () =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getAnnouncements>>, Error>({
    queryKey: hrmsKeys.announcements,
    queryFn: () => hrmsApi.getAnnouncements(),
  });

export const useCreateAnnouncement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; content: string; priority?: string; targetDepartments?: string[]; isPinned?: boolean }) =>
      hrmsApi.createAnnouncement(payload),
    onSuccess: () => {
      toast.success('Company announcement broadcasted.');
      qc.invalidateQueries({ queryKey: hrmsKeys.announcements });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to post announcement.')),
  });
};

// ─────────────────────────────────────────────────────────
// Talent: Skills & Competencies
// ─────────────────────────────────────────────────────────

export const useSkills = () =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getSkills>>, Error>({
    queryKey: hrmsKeys.skills,
    queryFn: () => hrmsApi.getSkills(),
  });

export const useCreateSkill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; category?: string; description?: string }) =>
      hrmsApi.createSkill(payload),
    onSuccess: () => {
      toast.success('Skill added to catalog.');
      qc.invalidateQueries({ queryKey: hrmsKeys.skills });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create skill.')),
  });
};

export const useEmployeeSkills = (params: { employeeId?: string } = {}) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getEmployeeSkills>>, Error>({
    queryKey: hrmsKeys.employeeSkills(params),
    queryFn: () => hrmsApi.getEmployeeSkills(params),
  });

export const useUpsertEmployeeSkill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { employeeId: string; skillId: string; proficiencyLevel?: number; yearsOfExperience?: number; certifications?: Array<{ name: string; issuer?: string; issueDate?: string }> }) =>
      hrmsApi.upsertEmployeeSkill(payload),
    onSuccess: () => {
      toast.success('Employee competency saved.');
      qc.invalidateQueries({ queryKey: ['hrms', 'talent', 'employeeSkills'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update employee skill.')),
  });
};

export const useVerifyEmployeeSkill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrmsApi.verifyEmployeeSkill(id),
    onSuccess: () => {
      toast.success('Skill verified by HR/Manager.');
      qc.invalidateQueries({ queryKey: ['hrms', 'talent', 'employeeSkills'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to verify skill.')),
  });
};

// ─────────────────────────────────────────────────────────
// Talent: Training & LMS
// ─────────────────────────────────────────────────────────

export const useTrainings = (params: { status?: string } = {}) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getTrainings>>, Error>({
    queryKey: hrmsKeys.trainings(params),
    queryFn: () => hrmsApi.getTrainings(params),
  });

export const useCreateTraining = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; description?: string; trainer?: string; mode?: string; startDate: string; endDate: string; capacity?: number; skillsCovered?: string[] }) =>
      hrmsApi.createTraining(payload),
    onSuccess: () => {
      toast.success('Training program scheduled.');
      qc.invalidateQueries({ queryKey: ['hrms', 'talent', 'trainings'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to schedule training.')),
  });
};

export const useEnrollInTraining = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, employeeId }: { id: string; employeeId?: string }) =>
      hrmsApi.enrollInTraining(id, employeeId),
    onSuccess: () => {
      toast.success('Enrollment confirmed.');
      qc.invalidateQueries({ queryKey: ['hrms', 'talent', 'trainings'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to enroll.')),
  });
};

export const useUpdateEnrollmentStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enrollmentId, payload }: { id: string; enrollmentId: string; payload: { status: 'enrolled' | 'completed' | 'dropped'; score?: number; feedback?: string } }) =>
      hrmsApi.updateEnrollmentStatus(id, enrollmentId, payload),
    onSuccess: () => {
      toast.success('Training completion status updated.');
      qc.invalidateQueries({ queryKey: ['hrms', 'talent', 'trainings'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update enrollment.')),
  });
};

// ─────────────────────────────────────────────────────────
// Talent: Headcount Planning & Manpower Requisition
// ─────────────────────────────────────────────────────────

export const useHeadcountPlans = (params: { fiscalYear?: number } = {}) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getHeadcountPlans>>, Error>({
    queryKey: hrmsKeys.headcountPlans(params),
    queryFn: () => hrmsApi.getHeadcountPlans(params),
  });

export const useUpsertHeadcountPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { departmentId: string; fiscalYear?: number; targetHeadcount: number; allocatedBudget?: number; quarterlyTargets?: { q1: number; q2: number; q3: number; q4: number } }) =>
      hrmsApi.upsertHeadcountPlan(payload),
    onSuccess: () => {
      toast.success('Headcount targets updated.');
      qc.invalidateQueries({ queryKey: ['hrms', 'talent', 'headcountPlans'] });
      qc.invalidateQueries({ queryKey: ['hrms', 'talent', 'headcountAnalytics'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to save headcount plan.')),
  });
};

export const useHeadcountAnalytics = (fiscalYear?: number) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getHeadcountAnalytics>>, Error>({
    queryKey: hrmsKeys.headcountAnalytics(fiscalYear),
    queryFn: () => hrmsApi.getHeadcountAnalytics(fiscalYear),
  });

export const useManpowerRequisitions = (params: { status?: string; departmentId?: string } = {}) =>
  useQuery<Awaited<ReturnType<typeof hrmsApi.getRequisitions>>, Error>({
    queryKey: hrmsKeys.requisitions(params),
    queryFn: () => hrmsApi.getRequisitions(params),
  });

export const useCreateRequisition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { departmentId: string; jobTitle: string; headcount: number; priority?: string; justification?: string; budgetPerHire?: number; requiredByDate: string }) =>
      hrmsApi.createRequisition(payload),
    onSuccess: () => {
      toast.success('Manpower requisition submitted.');
      qc.invalidateQueries({ queryKey: ['hrms', 'talent', 'requisitions'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to submit requisition.')),
  });
};

export const useApproveRequisition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrmsApi.approveRequisition(id),
    onSuccess: (data) => {
      toast.success('Requisition approved! Job opening created in ATS.');
      qc.invalidateQueries({ queryKey: ['hrms', 'talent', 'requisitions'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'jobOpenings'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to approve requisition.')),
  });
};




