// ─────────────────────────────────────────────────────────
// Recruitment ATS domain types — mirrors API models exactly
// ─────────────────────────────────────────────────────────

export type JobStatus = 'draft' | 'published' | 'on_hold' | 'closed';
export const JOB_STATUSES: JobStatus[] = ['draft', 'published', 'on_hold', 'closed'];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  on_hold: 'On Hold',
  closed: 'Closed',
};

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern';
export const EMPLOYMENT_TYPES: EmploymentType[] = ['full_time', 'part_time', 'contract', 'intern'];

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  intern: 'Internship',
};

export type LocationType = 'remote' | 'hybrid' | 'on_site';
export const LOCATION_TYPES: LocationType[] = ['remote', 'hybrid', 'on_site'];

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  on_site: 'On-site',
};

export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
export const EXPERIENCE_LEVELS: ExperienceLevel[] = ['entry', 'mid', 'senior', 'lead', 'executive'];

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior Level',
  lead: 'Lead / Principal',
  executive: 'Executive',
};

export type CandidateStage =
  | 'applied'
  | 'screening'
  | 'interview_round_1'
  | 'interview_round_2'
  | 'technical_assessment'
  | 'hr_round'
  | 'offer_sent'
  | 'hired'
  | 'rejected'
  | 'withdrawn';

export const CANDIDATE_STAGES: CandidateStage[] = [
  'applied',
  'screening',
  'interview_round_1',
  'interview_round_2',
  'technical_assessment',
  'hr_round',
  'offer_sent',
  'hired',
  'rejected',
  'withdrawn',
];

export const STAGE_LABELS: Record<CandidateStage, string> = {
  applied: 'Applied',
  screening: 'Screening',
  interview_round_1: 'Interview R1',
  interview_round_2: 'Interview R2',
  technical_assessment: 'Assessment',
  hr_round: 'HR Round',
  offer_sent: 'Offer Sent',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export type CandidateSource =
  | 'careers_page'
  | 'linkedin'
  | 'referral'
  | 'recruiter_outreach'
  | 'job_portal'
  | 'agency'
  | 'other';

export const CANDIDATE_SOURCES: CandidateSource[] = [
  'careers_page',
  'linkedin',
  'referral',
  'recruiter_outreach',
  'job_portal',
  'agency',
  'other',
];

export const SOURCE_LABELS: Record<CandidateSource, string> = {
  careers_page: 'Careers Page',
  linkedin: 'LinkedIn',
  referral: 'Employee Referral',
  recruiter_outreach: 'Recruiter Outreach',
  job_portal: 'Job Portal',
  agency: 'Agency',
  other: 'Other',
};

export type InterviewType = 'screening' | 'technical' | 'behavioral' | 'managerial' | 'culture_fit' | 'final';
export const INTERVIEW_TYPES: InterviewType[] = ['screening', 'technical', 'behavioral', 'managerial', 'culture_fit', 'final'];

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  screening: 'Screening',
  technical: 'Technical',
  behavioral: 'Behavioral',
  managerial: 'Managerial',
  culture_fit: 'Culture Fit',
  final: 'Final Round',
};

export type InterviewStatus = 'scheduled' | 'completed' | 'rescheduled' | 'cancelled' | 'no_show';
export const INTERVIEW_STATUSES: InterviewStatus[] = ['scheduled', 'completed', 'rescheduled', 'cancelled', 'no_show'];

export type OfferStatus = 'draft' | 'pending_approval' | 'approved' | 'sent' | 'accepted' | 'declined' | 'revoked';
export const OFFER_STATUSES: OfferStatus[] = ['draft', 'pending_approval', 'approved', 'sent', 'accepted', 'declined', 'revoked'];

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  sent: 'Offer Sent',
  accepted: 'Accepted',
  declined: 'Declined',
  revoked: 'Revoked',
};

export interface RecruitmentUserSummary {
  _id: string;
  fullName: string;
  email: string;
  role?: string;
}

export interface DepartmentSummary {
  _id: string;
  name: string;
}

// ── Job Opening ──
export interface JobOpening {
  _id: string;
  organizationId: string;
  jobCode: string;
  title: string;
  departmentId: DepartmentSummary | string;
  locationType: LocationType;
  location: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
    isPublic: boolean;
  };
  openPositions: number;
  filledPositions: number;
  status: JobStatus;
  hiringManagerId?: RecruitmentUserSummary | null;
  assignedRecruiters?: RecruitmentUserSummary[];
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  skills: string[];
  targetCloseDate?: string | null;
  publishedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  applicantCount?: number;
  stageBreakdown?: Record<string, number>;
}

// ── Candidate ──
export interface Candidate {
  _id: string;
  organizationId: string;
  candidateCode: string;
  jobOpeningId: JobOpening | { _id: string; title: string; jobCode: string; departmentId?: any; status?: string };
  fullName: string;
  email: string;
  phone?: string;
  currentCompany?: string;
  currentDesignation?: string;
  totalExperienceYears: number;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  skills: string[];
  expectedSalary: number;
  noticePeriodDays: number;
  source: CandidateSource;
  referredBy?: { _id: string; fullName: string; employeeCode: string; email?: string } | null;
  stage: CandidateStage;
  rating: number;
  tags: string[];
  notes?: string;
  rejectionReason?: string;
  stageHistory?: {
    fromStage: string;
    toStage: string;
    changedBy?: RecruitmentUserSummary;
    changedAt: string;
    note?: string;
  }[];
  convertedEmployeeId?: { _id: string; employeeCode: string; fullName: string; designation?: string; joiningDate?: string } | null;
  hiredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  interviews?: Interview[];
  offer?: JobOffer | null;
  activities?: RecruitmentActivity[];
}

// ── Interview ──
export interface Interview {
  _id: string;
  organizationId: string;
  candidateId: Candidate | { _id: string; fullName: string; candidateCode: string; email: string; phone?: string; stage?: string };
  jobOpeningId: JobOpening | { _id: string; title: string; jobCode: string; departmentId?: any };
  title: string;
  roundType: InterviewType;
  interviewers: RecruitmentUserSummary[];
  scheduledStart: string;
  scheduledEnd: string;
  timezone: string;
  meetingLink?: string;
  location?: string;
  status: InterviewStatus;
  scorecard?: {
    rating?: number | null;
    decision?: string | null;
    technicalSkillScore?: number | null;
    communicationScore?: number | null;
    cultureFitScore?: number | null;
    notes?: string;
    submittedBy?: RecruitmentUserSummary | null;
    submittedAt?: string | null;
  };
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Job Offer ──
export interface JobOffer {
  _id: string;
  organizationId: string;
  offerCode: string;
  candidateId: Candidate | { _id: string; fullName: string; candidateCode: string; email: string; phone?: string; stage?: string; convertedEmployeeId?: any };
  jobOpeningId: JobOpening | { _id: string; title: string; jobCode: string };
  designation: string;
  departmentId: DepartmentSummary | { _id: string; name: string };
  offeredSalary: number;
  currency: string;
  joiningDate: string;
  validUntil: string;
  status: OfferStatus;
  benefits?: string[];
  notes?: string;
  offerLetterUrl?: string;
  approvedBy?: RecruitmentUserSummary | null;
  sentAt?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Recruitment Activity ──
export interface RecruitmentActivity {
  _id: string;
  organizationId: string;
  candidateId?: { _id: string; fullName: string; candidateCode: string } | null;
  jobOpeningId?: { _id: string; title: string; jobCode: string } | null;
  type: string;
  title: string;
  description?: string;
  performedBy: RecruitmentUserSummary;
  metadata?: Record<string, any>;
  createdAt: string;
}

// ── Pipeline Response ──
export interface RecruitmentPipelinePayload {
  pipeline: Record<CandidateStage, Candidate[]>;
  counts: Record<CandidateStage, number>;
  totalCandidates: number;
}

// ── Summary KPI Response ──
export interface RecruitmentSummary {
  metrics: {
    activeJobs: number;
    candidatesInPipeline: number;
    interviewsThisWeek: number;
    pendingOffers: number;
    hiredThisMonth: number;
  };
  stageCounts: Record<CandidateStage, number>;
  upcomingInterviews: Interview[];
  recentActivities: RecruitmentActivity[];
  recentJobs: JobOpening[];
}
