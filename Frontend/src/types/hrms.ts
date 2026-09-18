// ─────────────────────────────────────────────────────────
// HRMS domain types — mirror the API shapes exactly
// ─────────────────────────────────────────────────────────

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern';
export const EMPLOYMENT_TYPES: EmploymentType[] = ['full_time', 'part_time', 'contract', 'intern'];

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  intern: 'Intern',
};

export type EmployeeStatus = 'active' | 'on_notice' | 'exited';
export const EMPLOYEE_STATUSES: EmployeeStatus[] = ['active', 'on_notice', 'exited'];

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: 'Active',
  on_notice: 'On Notice',
  exited: 'Exited',
};

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'half_day'
  | 'on_leave'
  | 'holiday'
  | 'weekend';

export type LiveAttendanceState = 'not_checked_in' | 'checked_in' | 'on_break' | 'checked_out';

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';
export const LEAVE_REQUEST_STATUSES: LeaveRequestStatus[] = ['pending', 'approved', 'rejected'];

export const LEAVE_STATUS_LABELS: Record<LeaveRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export type DocType = 'id_proof' | 'certificate' | 'offer_letter' | 'contract' | 'other';
export const DOC_TYPES: DocType[] = ['id_proof', 'certificate', 'offer_letter', 'contract', 'other'];

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  id_proof: 'ID Proof',
  certificate: 'Certificate',
  offer_letter: 'Offer Letter',
  contract: 'Contract',
  other: 'Other',
};

// ── Embedded user summary (populated refs) ──
export interface HrmsUserSummary {
  _id: string;
  fullName: string;
  email: string;
  role?: string;
}

// ── Employee ──
export interface Employee {
  _id: string;
  organizationId: string;
  userId: HrmsUserSummary | null;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  departmentId: Pick<Department, '_id' | 'name'> | null;
  designation: string;
  joiningDate: string | null;
  managerId: Pick<Employee, '_id' | 'fullName' | 'employeeCode'> | null;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  skills: string[];
  createdAt: string;
  updatedAt: string;
  /** Detail endpoint enrichments */
  documents?: EmployeeDocument[];
  activities?: Activity[];
  leaveBalances?: LeaveBalanceSummary[];
  recentAttendance?: AttendanceRecordSummary[];
}

export interface EmployeeInput {
  employeeCode: string;
  fullName: string;
  email?: string;
  phone?: string;
  departmentId?: string | null;
  designation?: string;
  joiningDate?: string | null;
  managerId?: string | null;
  employmentType?: EmploymentType;
  status?: EmployeeStatus;
  skills?: string[];
  userId?: string | null;
}

// ── Department ──
export interface Department {
  _id: string;
  organizationId: string;
  name: string;
  headId: Pick<Employee, '_id' | 'fullName' | 'employeeCode' | 'designation'> | null;
  description: string;
  createdAt: string;
  updatedAt: string;
  /** List/detail enrichments */
  headcount?: number;
  /** Detail endpoint enrichment */
  members?: DepartmentMember[];
}

export interface DepartmentMember {
  _id: string;
  employeeCode: string;
  fullName: string;
  designation: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  email: string;
}

export interface DepartmentInput {
  name: string;
  headId?: string | null;
  description?: string;
}

// ── Attendance ──
export interface AttendanceRecordSummary {
  _id: string;
  date: string;
  status: AttendanceStatus;
  checkInAt: string | null;
  checkOutAt: string | null;
  totalWorkedMinutes: number;
  isLate: boolean;
}

export interface AttendanceBreak {
  breakInAt: string;
  breakOutAt: string | null;
}

export interface AttendanceToday {
  currentStatus: LiveAttendanceState;
  checkInAt: string | null;
  checkOutAt: string | null;
  totalWorkedMinutes: number;
  breaks: AttendanceBreak[];
  isLate: boolean;
  status?: AttendanceStatus;
  record: Record<string, unknown> | null;
  shiftStartTime: string;
}

export interface AttendanceDayEntry {
  date: string;
  dayOfMonth: number;
  status: AttendanceStatus | 'pending';
  workedMinutes: number;
  workedHours: number;
  isLate: boolean;
  holidayName: string | null;
}

export interface AttendanceSummary {
  month: number;
  year: number;
  totalPresentDays: number;
  totalAbsentDays: number;
  totalLeaveDays: number;
  totalWorkedHours: number;
  expectedWorkingDays: number;
  dailyBreakdown: AttendanceDayEntry[];
}

export type RosterStatus = 'not_checked_in' | 'checked_in' | 'on_break' | 'checked_out' | 'on_leave';

export interface RosterEntry {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  status: RosterStatus;
  checkInAt: string | null;
  checkOutAt: string | null;
  workedMinutes: number;
  isLate: boolean;
}

export interface AttendanceRoster {
  date: string;
  roster: RosterEntry[];
}

// ── Leave ──
export interface LeaveType {
  _id: string;
  organizationId: string;
  name: string;
  annualQuota: number;
  carryForward: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalanceSummary {
  _id: string;
  leaveTypeId: string;
  leaveType: string;
  allocated: number;
  used: number;
  remaining: number;
  year: number;
}

export interface LeaveRequest {
  _id: string;
  organizationId: string;
  employeeId:
    | (Pick<Employee, '_id' | 'fullName' | 'employeeCode' | 'designation'> & { _id: string })
    | string;
  leaveTypeId: Pick<LeaveType, '_id' | 'name'> | string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: LeaveRequestStatus;
  reviewedBy: HrmsUserSummary | null;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequestInput {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

// ── Holiday ──
export interface Holiday {
  _id: string;
  organizationId: string;
  name: string;
  date: string;
  isOptional: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HolidayInput {
  name: string;
  date: string;
  isOptional?: boolean;
}

// ── Employee Document ──
export interface EmployeeDocument {
  _id: string;
  organizationId: string;
  employeeId: string;
  docType: DocType;
  fileName: string;
  fileUrl: string;
  uploadedBy: HrmsUserSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeDocumentInput {
  docType: DocType;
  fileName: string;
  fileUrl: string;
}

// ── Activity (shared with CRM, 'employee' relatedToType) ──
export interface Activity {
  _id: string;
  organizationId: string;
  type: 'note' | 'call' | 'email' | 'meeting' | 'task';
  relatedToType: 'lead' | 'contact' | 'company' | 'deal' | 'employee';
  relatedToId: string;
  content: string;
  dueDate: string | null;
  completedAt: string | null;
  createdBy: HrmsUserSummary | null;
  createdAt: string;
  updatedAt: string;
}

// ── Summary (KPI contract, mirrors CrmSummary approach) ──
export interface HrSummary {
  headcount: number;
  totalAccounts: number;
  presentToday: number;
  onBreakToday: number;
  checkedOutToday: number;
  notClockedInToday: number;
  pendingLeaveRequests: number;
  upcomingHolidays: number;
}
