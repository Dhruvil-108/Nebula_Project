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

// ── 360 Dossier sub-schemas ──
export interface PersonalInfo {
  dob?: string | null;
  gender?: 'male' | 'female' | 'non_binary' | 'other' | 'prefer_not_to_say';
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  currentAddress?: string;
  permanentAddress?: string;
}

export interface StatutoryIds {
  pan?: string;
  aadhaar?: string;
  uan?: string;
  passportNumber?: string;
  passportExpiry?: string | null;
  drivingLicense?: string;
}

export interface BankDetails {
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  branchName?: string;
  accountHolderName?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface EducationRecord {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: string | null;
  endDate?: string | null;
  gradeOrGpa?: string;
}

export interface WorkExperienceRecord {
  company: string;
  jobTitle: string;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
  responsibilities?: string;
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
  branchId?: Pick<BranchLocation, '_id' | 'name' | 'code' | 'city' | 'isHeadquarters'> | null;
  designationId?: Pick<Designation, '_id' | 'title' | 'code' | 'gradeLevel'> | null;
  designation: string;
  grade?: string;
  personalInfo?: PersonalInfo;
  statutoryIds?: StatutoryIds;
  bankDetails?: BankDetails;
  emergencyContacts?: EmergencyContact[];
  education?: EducationRecord[];
  workHistory?: WorkExperienceRecord[];
  customFields?: Record<string, any>;
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
  branchId?: string | null;
  designationId?: string | null;
  designation?: string;
  grade?: string;
  personalInfo?: PersonalInfo;
  statutoryIds?: StatutoryIds;
  bankDetails?: BankDetails;
  emergencyContacts?: EmergencyContact[];
  education?: EducationRecord[];
  workHistory?: WorkExperienceRecord[];
  customFields?: Record<string, any>;
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
  overtimeMinutes?: number;
  breaks: AttendanceBreak[];
  isLate: boolean;
  isRegularized?: boolean;
  status?: AttendanceStatus;
  record: Record<string, unknown> | null;
  shiftStartTime: string;
  shift?: {
    _id?: string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    graceMinutes?: number;
    color?: string;
  };
  employee?: {
    _id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  };
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
  employeeId?: string;
  employeeCode?: string;
  userId: string;
  fullName: string;
  email: string;
  role: string;
  department?: string | null;
  shift?: {
    _id?: string;
    name: string;
    code: string;
    color?: string;
  } | null;
  status: RosterStatus;
  checkInAt: string | null;
  checkOutAt: string | null;
  workedMinutes: number;
  overtimeMinutes?: number;
  isLate: boolean;
  isRegularized?: boolean;
}

export interface AttendanceRoster {
  date: string;
  roster: RosterEntry[];
}

// ── Multi-Shift Management ──
export interface Shift {
  _id: string;
  organizationId: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  halfDayMinutes: number;
  fullDayMinutes: number;
  workWeekDays: number[];
  isNightShift: boolean;
  breakDurationMinutes: number;
  color: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShiftInput {
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  graceMinutes?: number;
  halfDayMinutes?: number;
  fullDayMinutes?: number;
  workWeekDays?: number[];
  isNightShift?: boolean;
  breakDurationMinutes?: number;
  color?: string;
  isDefault?: boolean;
}

// ── Attendance Regularizations ──
export type RegularizationType = 'missed_check_in' | 'missed_check_out' | 'incorrect_hours' | 'outdoor_duty' | 'work_from_home';

export const REGULARIZATION_TYPE_LABELS: Record<RegularizationType, string> = {
  missed_check_in: 'Missed Clock In',
  missed_check_out: 'Missed Clock Out',
  incorrect_hours: 'Incorrect Hours',
  outdoor_duty: 'Outdoor Client Duty',
  work_from_home: 'Work From Home (WFH)',
};

export interface AttendanceRegularization {
  _id: string;
  organizationId: string;
  employeeId: {
    _id: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    employeeCode: string;
    designation?: string;
  };
  userId?: string | null;
  attendanceRecordId?: string | null;
  date: string;
  type: RegularizationType;
  requestedCheckInAt?: string | null;
  requestedCheckOutAt?: string | null;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvalInstanceId?: string | null;
  reviewedBy?: { _id: string; fullName: string } | null;
  reviewedAt?: string | null;
  reviewerComments?: string;
  createdAt: string;
}

export interface RegularizationInput {
  date: string;
  type: RegularizationType;
  requestedCheckInAt?: string | null;
  requestedCheckOutAt?: string | null;
  reason: string;
}

// ── Leave ──
export interface LeaveType {
  _id: string;
  organizationId: string;
  name: string;
  code?: string;
  annualQuota: number;
  accrualFrequency?: 'monthly' | 'quarterly' | 'yearly' | 'none';
  monthlyAccrualRate?: number;
  carryForward: boolean;
  maxCarryForward?: number;
  maxEncashable?: number;
  isPaid?: boolean;
  sandwichRuleEnabled?: boolean;
  priorNoticeDays?: number;
  maxConsecutiveDays?: number;
  docRequiredAfterDays?: number;
  color?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveTypeInput {
  name: string;
  code?: string;
  annualQuota?: number;
  accrualFrequency?: 'monthly' | 'quarterly' | 'yearly' | 'none';
  monthlyAccrualRate?: number;
  carryForward?: boolean;
  maxCarryForward?: number;
  maxEncashable?: number;
  isPaid?: boolean;
  sandwichRuleEnabled?: boolean;
  priorNoticeDays?: number;
  maxConsecutiveDays?: number;
  docRequiredAfterDays?: number;
  color?: string;
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
  leaveTypeId: Pick<LeaveType, '_id' | 'name' | 'color' | 'code'> | string;
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

// ── Leave Ledger & Accrual ──
export type LeaveTransactionType =
  | 'credit_annual'
  | 'credit_accrual'
  | 'debit_leave'
  | 'credit_compoff'
  | 'debit_lapse'
  | 'debit_encashment'
  | 'manual_adjustment';

export const LEAVE_TRANSACTION_LABELS: Record<LeaveTransactionType, string> = {
  credit_annual: 'Annual Grant',
  credit_accrual: 'Monthly Accrual',
  debit_leave: 'Leave Taken',
  credit_compoff: 'Comp-Off Credit',
  debit_lapse: 'Year-End Lapse',
  debit_encashment: 'Encashment Debit',
  manual_adjustment: 'Manual Adjustment',
};

export interface LeaveLedgerEntry {
  _id: string;
  organizationId: string;
  employeeId: {
    _id: string;
    fullName?: string;
    employeeCode?: string;
  };
  leaveTypeId: {
    _id: string;
    name: string;
    code?: string;
    color?: string;
  };
  year: number;
  transactionType: LeaveTransactionType;
  days: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceId?: string | null;
  referenceType?: string;
  notes?: string;
  performedBy?: { _id: string; fullName: string } | null;
  effectiveDate: string;
  createdAt: string;
}

// ── Sandwich Policy Preview ──
export interface SandwichPreviewResult {
  baseDays: number;
  sandwichDays: number;
  totalDays: number;
  isSandwichApplied: boolean;
  sandwichDates: string[];
  explanation: string;
}

// ── Compensatory Off (Comp-Off) ──
export interface CompOffGrant {
  _id: string;
  organizationId: string;
  employeeId: {
    _id: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    employeeCode?: string;
    designation?: string;
  };
  workDate: string;
  overtimeMinutes: number;
  grantedDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'availed' | 'expired';
  expiresAt: string;
  reviewedBy?: { _id: string; fullName: string } | null;
  reviewedAt?: string | null;
  reviewerComments?: string;
  createdAt: string;
}

export interface CompOffInput {
  workDate: string;
  overtimeMinutes: number;
  grantedDays?: number;
  reason: string;
  attendanceRecordId?: string;
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

// ─────────────────────────────────────────────────────────
// PHASE 3 — Branch / Office Locations
// ─────────────────────────────────────────────────────────
export interface BranchAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface BranchLocation {
  _id: string;
  organizationId: string;
  name: string;
  code: string;
  isHeadquarters: boolean;
  timezone: string;
  city?: string;
  state?: string;
  address?: BranchAddress;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  headcount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BranchLocationInput {
  name: string;
  code: string;
  isHeadquarters?: boolean;
  timezone?: string;
  city?: string;
  state?: string;
  address?: BranchAddress;
  contactPhone?: string;
  contactEmail?: string;
  isActive?: boolean;
}

// ─────────────────────────────────────────────────────────
// PHASE 3 — Designations & Job Grades
// ─────────────────────────────────────────────────────────
export type GradeLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7';
export const GRADE_LEVELS: GradeLevel[] = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7'];

export interface Designation {
  _id: string;
  organizationId: string;
  title: string;
  code: string;
  gradeLevel: GradeLevel;
  description?: string;
  departmentId?: Pick<Department, '_id' | 'name'> | null;
  minSalary?: number;
  maxSalary?: number;
  isActive: boolean;
  headcount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DesignationInput {
  title: string;
  code: string;
  gradeLevel?: GradeLevel;
  description?: string;
  departmentId?: string | null;
  minSalary?: number;
  maxSalary?: number;
  isActive?: boolean;
}

// ─────────────────────────────────────────────────────────
// PHASE 3 — Career Timeline & Job History
// ─────────────────────────────────────────────────────────
export type TransitionType =
  | 'promotion'
  | 'transfer'
  | 'designation_change'
  | 'grade_change'
  | 'compensation_revision';

export const TRANSITION_TYPES: TransitionType[] = [
  'promotion',
  'transfer',
  'designation_change',
  'grade_change',
  'compensation_revision',
];

export const TRANSITION_TYPE_LABELS: Record<TransitionType, string> = {
  promotion: 'Promotion',
  transfer: 'Lateral Transfer',
  designation_change: 'Designation Change',
  grade_change: 'Grade Revision',
  compensation_revision: 'Compensation Revision',
};

export interface JobHistoryEntry {
  _id: string;
  organizationId: string;
  employeeId: string;
  transitionType: TransitionType;
  effectiveDate: string;
  previousDepartmentId?: Pick<Department, '_id' | 'name'> | null;
  newDepartmentId?: Pick<Department, '_id' | 'name'> | null;
  previousDesignation?: string;
  newDesignation?: string;
  previousGrade?: string;
  newGrade?: string;
  previousSalary?: number;
  newSalary?: number;
  previousManagerId?: Pick<Employee, '_id' | 'fullName' | 'employeeCode'> | null;
  newManagerId?: Pick<Employee, '_id' | 'fullName' | 'employeeCode'> | null;
  reason?: string;
  approvedBy?: Pick<Employee, '_id' | 'fullName'> | null;
  createdAt: string;
}

export interface PromoteTransferInput {
  transitionType: TransitionType;
  effectiveDate: string;
  newDepartmentId?: string | null;
  newDesignation?: string;
  newDesignationId?: string | null;
  newGrade?: string;
  newManagerId?: string | null;
  newSalary?: number;
  reason?: string;
}

// ─────────────────────────────────────────────────────────
// PHASE 3 — Interactive Org Chart
// ─────────────────────────────────────────────────────────
export interface OrgChartNode {
  _id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  designation: string;
  grade: string;
  department?: { _id: string; name: string } | null;
  branch?: { _id: string; name: string; city?: string } | null;
  managerId?: string | null;
  skills: string[];
  directReportCount: number;
  totalReportCount: number;
  children: OrgChartNode[];
}

export interface OrgChartResponse {
  rootNodes: OrgChartNode[];
  totalEmployees: number;
  totalDepartments: number;
  totalBranches: number;
  maxDepth: number;
}

// ─────────────────────────────────────────────────────────
// PHASE 4 — Enterprise Payroll & Compliance
// ─────────────────────────────────────────────────────────
export interface SalaryEarnings {
  basic: number;
  hra: number;
  specialAllowance: number;
  conveyance?: number;
  medicalAllowance?: number;
  performanceBonus?: number;
  reimbursements?: number;
  otherEarnings?: number;
  grossEarnings?: number;
}

export interface SalaryDeductions {
  providentFund: number;
  professionalTax: number;
  incomeTaxTds: number;
  esi?: number;
  lopDeduction?: number;
  otherDeductions?: number;
  totalDeductions?: number;
}

export interface SalaryStructure {
  _id: string;
  organizationId: string;
  employeeId: string;
  templateName: string;
  currency: string;
  annualCtc: number;
  monthlyCtc: number;
  earnings: SalaryEarnings;
  deductions: SalaryDeductions;
  effectiveFrom: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryStructureInput {
  annualCtc: number;
  currency?: string;
  templateName?: string;
  earnings?: Partial<SalaryEarnings>;
  deductions?: Partial<SalaryDeductions>;
}

export type PayrollRunStatus = 'draft' | 'processing' | 'reviewed' | 'approved' | 'paid' | 'cancelled';

export const PAYROLL_STATUS_LABELS: Record<PayrollRunStatus, string> = {
  draft: 'Draft Calculation',
  processing: 'Processing',
  reviewed: 'Reviewed',
  approved: 'Approved & Published',
  paid: 'Disbursed / Paid',
  cancelled: 'Cancelled',
};

export interface PayrollRun {
  _id: string;
  organizationId: string;
  month: number;
  year: number;
  runCode: string;
  status: PayrollRunStatus;
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  totalLopDays: number;
  processedBy?: HrmsUserSummary | null;
  approvedBy?: HrmsUserSummary | null;
  approvedAt?: string | null;
  paymentDate?: string | null;
  paymentReference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  payslips?: Payslip[];
}

export interface PayrollRunInput {
  month: number;
  year: number;
  notes?: string;
}

export interface PayslipAttendanceSummary {
  totalDaysInMonth: number;
  workingDays: number;
  presentDays: number;
  paidLeaveDays: number;
  weeklyOffDays: number;
  holidayDays: number;
  lopDays: number;
  payableDays: number;
}

export interface Payslip {
  _id: string;
  organizationId: string;
  payrollRunId: string;
  employeeId: {
    _id: string;
    fullName: string;
    employeeCode: string;
    designation?: string;
    grade?: string;
    email?: string;
    phone?: string;
    departmentId?: Pick<Department, '_id' | 'name'> | null;
  };
  month: number;
  year: number;
  slipCode: string;
  status: 'draft' | 'published' | 'paid' | 'void';
  currency: string;
  attendanceSummary: PayslipAttendanceSummary;
  earnings: SalaryEarnings;
  deductions: SalaryDeductions;
  netPay: number;
  bankDetailsSnapshot?: {
    bankName?: string;
    branchName?: string;
    accountNumberMasked?: string;
    ifscCode?: string;
  };
  panSnapshot?: string;
  uanSnapshot?: string;
  designationSnapshot?: string;
  departmentSnapshot?: string;
  paymentStatus: 'unpaid' | 'processing' | 'paid';
  paymentDate?: string | null;
  paymentReference?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Performance Management & OKRs ──

export type GoalCategory = 'engineering' | 'sales' | 'operations' | 'leadership' | 'personal_growth' | 'general';
export type GoalLevel = 'individual' | 'department' | 'company';
export type GoalStatus = 'not_started' | 'in_progress' | 'at_risk' | 'behind' | 'completed' | 'cancelled';

export interface KeyResult {
  _id?: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  weight?: number;
  confidenceScore?: number;
}

export interface GoalCheckIn {
  _id?: string;
  date: string;
  note: string;
  progressSnapshot: number;
  updatedBy: {
    _id: string;
    fullName: string;
    email?: string;
  };
}

export interface Goal {
  _id: string;
  organizationId: string;
  employeeId: {
    _id: string;
    fullName: string;
    employeeCode: string;
    email?: string;
    avatar?: string;
    designation?: string;
    grade?: string;
  };
  departmentId?: {
    _id: string;
    name: string;
  } | null;
  title: string;
  description?: string;
  category: GoalCategory;
  level: GoalLevel;
  period: string;
  startDate: string;
  dueDate: string;
  status: GoalStatus;
  progress: number;
  weight: number;
  keyResults: KeyResult[];
  checkIns: GoalCheckIn[];
  alignedWithGoalId?: string | null;
  isPrivate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoalInput {
  employeeId: string;
  departmentId?: string;
  title: string;
  description?: string;
  category?: GoalCategory;
  level?: GoalLevel;
  period: string;
  startDate?: string;
  dueDate: string;
  weight?: number;
  keyResults?: KeyResult[];
}

// ── Review Cycles & 360 Appraisals ──

export type ReviewPeriod = 'annual' | 'semi_annual' | 'quarterly' | 'adhoc';
export type ReviewCycleStatus = 'draft' | 'active' | 'in_review' | 'calibrating' | 'completed' | 'archived';
export type ReviewCycleType = '360_degree' | 'manager_only' | 'self_and_manager';

export interface ReviewCycle {
  _id: string;
  organizationId: string;
  name: string;
  description?: string;
  reviewPeriod: ReviewPeriod;
  startDate: string;
  endDate: string;
  dueDate: string;
  status: ReviewCycleStatus;
  type: ReviewCycleType;
  eligibleDepartments?: Array<string | { _id: string; name: string }>;
  submissionStats: {
    totalEligible: number;
    completed: number;
    pending: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ReviewCycleInput {
  name: string;
  description?: string;
  reviewPeriod: ReviewPeriod;
  startDate: string;
  endDate: string;
  dueDate: string;
  type?: ReviewCycleType;
  eligibleDepartments?: string[];
}

export type PerformanceReviewStatus = 'pending_self' | 'pending_manager' | 'in_calibration' | 'completed';

export interface NineBoxCoordinate {
  performanceScore: number; // 1-3
  potentialScore: number;   // 1-3
  boxLabel: string;
}

export interface PerformanceReview {
  _id: string;
  organizationId: string;
  reviewCycleId: {
    _id: string;
    name: string;
    reviewPeriod: string;
    dueDate: string;
    status: string;
  };
  employeeId: {
    _id: string;
    fullName: string;
    employeeCode: string;
    email?: string;
    avatar?: string;
    designation?: string;
    grade?: string;
    departmentId?: { _id: string; name: string };
  };
  managerId: {
    _id: string;
    fullName: string;
    employeeCode: string;
    email?: string;
    avatar?: string;
  };
  selfReview?: {
    summary?: string;
    strengths?: string;
    growthAreas?: string;
    achievements?: string;
    rating?: number;
    submittedAt?: string | null;
  };
  managerReview?: {
    summary?: string;
    strengths?: string;
    growthAreas?: string;
    rating?: number;
    potentialRating?: number;
    recommendations?: string;
    submittedAt?: string | null;
  };
  calibration?: {
    nineBoxGrid: NineBoxCoordinate;
    promotionRecommended: boolean;
    salaryIncrementPercentage: number;
    calibrationNotes?: string;
    calibratedAt?: string | null;
  };
  status: PerformanceReviewStatus;
  sharedWithEmployee?: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── 9-Box Grid Aggregation ──

export interface NineBoxCell {
  perfScore: number;
  potScore: number;
  label: string;
  count: number;
  employees: Array<{
    reviewId: string;
    employee: {
      _id: string;
      fullName: string;
      employeeCode: string;
      grade?: string;
      designation?: string;
      avatar?: string;
      departmentId?: { _id: string; name: string };
    };
    promotionRecommended: boolean;
    salaryIncrementPercentage: number;
  }>;
}

export interface NineBoxGridResponse {
  totalEmployees: number;
  grid: NineBoxCell[];
}

// ── Attrition Risk ──

export type AttritionRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AttritionContributingFactor {
  _id?: string;
  factor: string;
  weight: number;
  description: string;
  metricValue?: string;
}

export interface AttritionRisk {
  _id: string;
  organizationId: string;
  employeeId: {
    _id: string;
    fullName: string;
    employeeCode: string;
    email?: string;
    avatar?: string;
    designation?: string;
    grade?: string;
    departmentId?: { _id: string; name: string };
  };
  riskScore: number;
  riskLevel: AttritionRiskLevel;
  contributingFactors: AttritionContributingFactor[];
  suggestedInterventions: string[];
  lastPromotedOrIncrementedMonths: number;
  attendanceStabilityScore: number;
  leaveFrequencyTrend: 'stable' | 'increasing' | 'sporadic';
  computedAt: string;
}

// ── HR AI Copilot ──

export interface HrmsCopilotResponse {
  answer: string;
  data: any;
  intent: string;
  suggestedFollowUps: string[];
  confidence: number;
}

// ── Lifecycle: Onboarding & Offboarding ──

export type OnboardingTaskRole = 'hr' | 'it' | 'finance' | 'manager' | 'employee';
export type OnboardingStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface OnboardingTask {
  _id: string;
  title: string;
  description?: string;
  role: OnboardingTaskRole;
  isCompleted: boolean;
  completedAt?: string | null;
  completedBy?: { _id: string; fullName: string; email?: string } | null;
  dueDate?: string | null;
  notes?: string;
}

export interface OnboardingCase {
  _id: string;
  organizationId: string;
  employeeId: {
    _id: string;
    fullName: string;
    employeeCode: string;
    email?: string;
    designation?: string;
    grade?: string;
    departmentId?: { _id: string; name: string };
    avatar?: string;
    hireDate?: string;
  };
  joiningDate: string;
  status: OnboardingStatus;
  tasks: OnboardingTask[];
  progressPercentage: number;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type OffboardingStatus = 'initiated' | 'notice_period' | 'clearance_in_progress' | 'completed' | 'withdrawn';
export type ExitReason = 'resignation' | 'termination' | 'retirement' | 'end_of_contract' | 'other';

export interface OffboardingCase {
  _id: string;
  organizationId: string;
  employeeId: {
    _id: string;
    fullName: string;
    employeeCode: string;
    email?: string;
    designation?: string;
    grade?: string;
    departmentId?: { _id: string; name: string };
    avatar?: string;
    hireDate?: string;
  };
  status: OffboardingStatus;
  reason: ExitReason;
  resignationDate: string;
  lastWorkingDate: string;
  noticePeriodDays: number;
  itClearance: { isCleared: boolean; clearedAt?: string; remarks?: string };
  financeClearance: { isCleared: boolean; clearedAt?: string; finalSettlementAmount?: number; remarks?: string };
  adminAssets: { isCleared: boolean; pendingAssetsCount: number; clearedAt?: string; remarks?: string };
  hrClearance: { isCleared: boolean; clearedAt?: string; remarks?: string };
  exitInterview: {
    conducted: boolean;
    conductedAt?: string;
    feedback?: string;
    ratingOverall?: number;
    primaryReasonForLeaving?: string;
    wouldRecommendCompany?: boolean;
  };
  settlementStatus: 'pending' | 'calculated' | 'paid';
  completedAt?: string | null;
  createdAt: string;
}

// ── Lifecycle: Helpdesk / Ticketing ──

export type HrTicketCategory = 'payroll' | 'benefits' | 'workplace' | 'it_support' | 'leave_attendance' | 'grievance' | 'general';
export type HrTicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type HrTicketStatus = 'open' | 'in_progress' | 'waiting_on_employee' | 'resolved' | 'closed';

export interface HrTicketComment {
  _id: string;
  senderId: { _id: string; fullName: string; email?: string };
  message: string;
  createdAt: string;
}

export interface HrTicket {
  _id: string;
  ticketCode: string;
  employeeId: {
    _id: string;
    fullName: string;
    employeeCode: string;
    email?: string;
    designation?: string;
    departmentId?: { _id: string; name: string };
  };
  category: HrTicketCategory;
  priority: HrTicketPriority;
  status: HrTicketStatus;
  subject: string;
  description: string;
  assignedTo?: { _id: string; fullName: string; email?: string } | null;
  comments: HrTicketComment[];
  resolutionNotes?: string;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Lifecycle: Letters, Policies & Announcements ──

export type LetterTemplateType = 'offer' | 'appointment' | 'increment' | 'relieving' | 'experience' | 'custom';

export interface LetterTemplate {
  _id: string;
  title: string;
  type: LetterTemplateType;
  subject: string;
  bodyTemplate: string;
  variables: string[];
  isActive: boolean;
}

export type PolicyCategory = 'code_of_conduct' | 'leave_attendance' | 'security' | 'compensation' | 'workplace_safety' | 'general';

export interface PolicyDocument {
  _id: string;
  title: string;
  category: PolicyCategory;
  version: string;
  effectiveDate: string;
  summary: string;
  content: string;
  requiresAcknowledgement: boolean;
  acknowledgements: Array<{ employeeId: string; acknowledgedAt: string }>;
  acknowledgedCount?: number;
  totalEligibleCount?: number;
  hasAcknowledged?: boolean;
  createdAt: string;
}

export type AnnouncementPriority = 'normal' | 'important' | 'urgent';

export interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  publishDate: string;
  expiresAt?: string;
  targetDepartments: Array<{ _id: string; name: string }>;
  isPinned: boolean;
  authorId?: { _id: string; fullName: string };
  createdAt: string;
}

// ── Talent: Skills & Competency Matrix ──

export type SkillCategory = 'technical' | 'functional' | 'leadership' | 'soft_skill';

export interface Skill {
  _id: string;
  name: string;
  category: SkillCategory;
  description?: string;
  isActive: boolean;
}

export interface EmployeeSkill {
  _id: string;
  employeeId: {
    _id: string;
    fullName: string;
    employeeCode: string;
    designation?: string;
    departmentId?: { _id: string; name: string };
    avatar?: string;
  };
  skillId: Skill;
  proficiencyLevel: number;
  yearsOfExperience: number;
  certifications: Array<{ name: string; issuer?: string; issueDate?: string }>;
  verified: boolean;
  verifiedBy?: { _id: string; fullName: string };
  updatedAt: string;
}

// ── Talent: Training & LMS ──

export type TrainingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface TrainingEnrollment {
  _id: string;
  employeeId: {
    _id: string;
    fullName: string;
    employeeCode: string;
    designation?: string;
    departmentId?: { _id: string; name: string };
  };
  status: 'enrolled' | 'completed' | 'dropped';
  enrolledAt: string;
  completedAt?: string;
  score?: number;
  feedback?: string;
}

export interface Training {
  _id: string;
  title: string;
  description: string;
  trainer: string;
  mode: 'classroom' | 'virtual' | 'self_paced';
  status: TrainingStatus;
  startDate: string;
  endDate: string;
  capacity: number;
  skillsCovered: Skill[];
  enrollments: TrainingEnrollment[];
  enrolledCount?: number;
}

// ── Talent: Headcount Planning & Manpower Requisition ──

export interface HeadcountPlan {
  _id: string;
  departmentId: { _id: string; name: string };
  fiscalYear: number;
  currentHeadcount: number;
  targetHeadcount: number;
  allocatedBudget: number;
  utilizedBudget: number;
  quarterlyTargets: { q1: number; q2: number; q3: number; q4: number };
  status: 'draft' | 'approved' | 'active';
}

export interface HeadcountAnalytics {
  fiscalYear: number;
  totalCurrentHeadcount: number;
  totalTargetHeadcount: number;
  totalAllocatedBudget: number;
  totalUtilizedBudget: number;
  gapCount: number;
  breakdown: Array<{
    department: string;
    current: number;
    target: number;
    gap: number;
    allocatedBudget: number;
    utilizedBudget: number;
  }>;
}

export type RequisitionPriority = 'low' | 'medium' | 'high' | 'critical';
export type RequisitionStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'fulfilled';

export interface ManpowerRequisition {
  _id: string;
  requisitionCode: string;
  departmentId: { _id: string; name: string };
  jobTitle: string;
  headcount: number;
  priority: RequisitionPriority;
  status: RequisitionStatus;
  justification: string;
  budgetPerHire: number;
  requiredByDate: string;
  linkedJobOpeningId?: { _id: string; title: string; status: string } | null;
  approvedBy?: { _id: string; fullName: string };
  createdAt: string;
}



