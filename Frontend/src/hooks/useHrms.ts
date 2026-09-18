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
  holidays: (year?: number) => ['hrms', 'holidays', year ?? 'all'] as const,
  upcomingHolidays: ['hrms', 'holidays', 'upcoming'] as const,
  summary: ['hrms', 'summary'] as const,
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
