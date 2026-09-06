export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'half_day'
  | 'on_leave'
  | 'holiday'
  | 'weekend'
  | 'pending';

export type CurrentAttendanceStatus =
  | 'not_checked_in'
  | 'checked_in'
  | 'on_break'
  | 'checked_out';

export interface BreakItem {
  breakInAt: string;
  breakOutAt: string | null;
}

export interface AttendanceRecord {
  _id: string;
  employeeId: string;
  organizationId: string;
  date: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  breaks: BreakItem[];
  status: AttendanceStatus;
  totalWorkedMinutes: number;
  isLate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceToday {
  currentStatus: CurrentAttendanceStatus;
  checkInAt: string | null;
  checkOutAt: string | null;
  totalWorkedMinutes: number;
  breaks: BreakItem[];
  isLate: boolean;
  status?: AttendanceStatus;
  shiftStartTime?: string;
  record?: AttendanceRecord | null;
}

export interface DailyBreakdownItem {
  date: string;
  dayOfMonth: number;
  status: AttendanceStatus;
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
  dailyBreakdown: DailyBreakdownItem[];
}

export interface LeaveBalance {
  id: string;
  leaveTypeId: string;
  leaveType: string;
  allocated: number;
  used: number;
  remaining: number;
  year: number;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  isOptional: boolean;
}

export interface LeaveRequestPayload {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface LeaveRequest {
  _id: string;
  employeeId: string;
  organizationId: string;
  leaveTypeId: string | { _id: string; name: string; annualQuota: number };
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reason: string;
  createdAt: string;
}
