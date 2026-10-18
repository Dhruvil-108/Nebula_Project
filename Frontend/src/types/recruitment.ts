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
  firstName?: string;
  lastName?: string;
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
export type MeetingPlatform = 'google_meet' | 'zoom' | 'microsoft_teams' | 'phone' | 'in_person';
export const MEETING_PLATFORM_LABELS: Record<MeetingPlatform, string> = {
  google_meet: 'Google Meet',
  zoom: 'Zoom Meeting',
  microsoft_teams: 'Microsoft Teams',
  phone: 'Phone Call',
  in_person: 'In Person / On-site',
};

export interface InterviewRescheduleRecord {
  previousStart: string;
  previousEnd: string;
  newStart: string;
  newEnd: string;
  reason?: string;
  rescheduledBy?: RecruitmentUserSummary | string;
  rescheduledAt: string;
}

export type ConsensusDecision = 'advance_to_next_round' | 'offer_recommended' | 'schedule_followup' | 'reject' | 'pending';
export const CONSENSUS_DECISION_LABELS: Record<ConsensusDecision, string> = {
  advance_to_next_round: 'Advance to Next Round',
  offer_recommended: 'Recommend Job Offer',
  schedule_followup: 'Schedule Follow-up Round',
  reject: 'Decline / Reject',
  pending: 'Pending Calibration',
};

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
  meetingPlatform?: MeetingPlatform;
  meetingLink?: string;
  meetingPassword?: string;
  location?: string;
  icsUid?: string;
  status: InterviewStatus;
  rescheduleHistory?: InterviewRescheduleRecord[];
  consensusOutcome?: {
    decision: ConsensusDecision;
    notes?: string;
    decidedBy?: RecruitmentUserSummary | string;
    decidedAt?: string;
  };
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
export interface CompensationBreakdown {
  baseSalary: number;
  variableBonus?: number;
  variablePay?: number;
  equity?: {
    shares?: number;
    estimatedValue?: number;
    vestingSchedule?: string;
  };
  equityValue?: number;
  signOnBonus?: number;
  relocation?: number;
  relocationAllowance?: number;
  allowances?: number;
  otherAllowances?: { name: string; amount: number }[];
  totalCtc: number;
  currency?: string;
}

export interface BandGovernance {
  bandMin: number;
  bandMax: number;
  bandMid: number;
  isDeviation: boolean;
  isOutOfBand?: boolean;
  deviationPercent: number;
  deviationPercentage?: number;
  requiresFinanceEscalation?: boolean;
  justification?: string;
}

export interface OfferApprovalStep {
  stepNumber: number;
  role: string;
  approverId?: RecruitmentUserSummary | null;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  actionedAt?: string | null;
}

export interface OfferESignature {
  signToken?: string | null;
  tokenExpiresAt?: string | null;
  signedAt?: string | null;
  signedIp?: string | null;
  signedUserAgent?: string | null;
  signatureImageUrl?: string | null;
  signerName?: string | null;
  declineReason?: string | null;
  declineNotes?: string | null;
}

export interface JobOffer {
  _id: string;
  organizationId: string;
  offerCode: string;
  candidateId: Candidate | { _id: string; fullName: string; candidateCode: string; email: string; phone?: string; stage?: string; convertedEmployeeId?: any };
  jobOpeningId: JobOpening | { _id: string; title: string; jobCode: string; salaryRange?: { min: number; max: number; currency: string } };
  designation: string;
  departmentId: DepartmentSummary | { _id: string; name: string };
  offeredSalary: number;
  currency: string;
  compensationBreakdown?: CompensationBreakdown;
  bandGovernance?: BandGovernance;
  approvalChain?: OfferApprovalStep[];
  currentApprovalStep?: number;
  eSignature?: OfferESignature;
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
  updatedAt?: string;
}

export interface PublicOfferDetail {
  _id: string;
  offerCode: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  designation: string;
  departmentName: string;
  offeredSalary: number;
  currency: string;
  compensationBreakdown?: CompensationBreakdown;
  joiningDate: string;
  validUntil: string;
  status: OfferStatus;
  benefits?: string[];
  eSignature?: OfferESignature;
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

// ── Application (Person + Job Relationship) ──
export interface Application {
  _id: string;
  organizationId: string;
  applicationCode: string;
  candidateId: Candidate | {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
    currentCompany?: string;
    currentDesignation?: string;
    totalExperienceYears?: number;
    resumeUrl?: string;
    skills?: string[];
    candidateCode?: string;
  };
  jobOpeningId: JobOpening | {
    _id: string;
    title: string;
    jobCode: string;
    departmentId?: any;
    status?: string;
  };
  stage: string;
  stageHistory?: {
    fromStage: string;
    toStage: string;
    changedBy?: RecruitmentUserSummary;
    changedAt: string;
    note?: string;
  }[];
  rating: number;
  matchScore?: number | null;
  matchExplanation?: Record<string, any> | null;
  source: string;
  referredBy?: { _id: string; fullName: string; employeeCode: string } | null;
  rejectionReasonId?: RejectionReason | { _id: string; code: string; label: string; category?: string } | null;
  rejectionNotes?: string;
  tags: string[];
  status: 'active' | 'hired' | 'rejected' | 'withdrawn';
  convertedEmployeeId?: { _id: string; employeeCode: string; fullName: string } | null;
  hiredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  interviews?: Interview[];
  offer?: JobOffer | null;
  activities?: RecruitmentActivity[];
}

// ── Requisition & Headcount ──
export type RequisitionStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'converted_to_job';
export type RequisitionReason = 'new_headcount' | 'replacement' | 'expansion';

export interface ApprovalStep {
  stepNumber: number;
  approverRole: string;
  approverId?: RecruitmentUserSummary | null;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  actionedAt?: string | null;
}

export interface Requisition {
  _id: string;
  organizationId: string;
  reqCode: string;
  title: string;
  departmentId: DepartmentSummary | { _id: string; name: string };
  employmentType: string;
  experienceLevel: string;
  locationType: string;
  location?: string;
  openPositions: number;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  reason: RequisitionReason;
  replacementForEmployeeId?: { _id: string; fullName: string; employeeCode: string } | null;
  justification: string;
  targetStartDate?: string | null;
  approvalChain: ApprovalStep[];
  status: RequisitionStatus;
  jobOpeningId?: { _id: string; title: string; jobCode: string; status?: string } | null;
  requestedBy: RecruitmentUserSummary;
  createdAt: string;
  updatedAt: string;
}

// ── Pipeline Templates & Stages ──
export interface PipelineStageConfig {
  key: string;
  name: string;
  type: 'active' | 'offer' | 'hired' | 'rejected';
  slaDays: number;
  order: number;
  color: string;
}

export interface PipelineTemplate {
  _id: string;
  organizationId: string;
  name: string;
  description?: string;
  departmentId?: { _id: string; name: string } | null;
  isDefault: boolean;
  stages: PipelineStageConfig[];
  createdAt: string;
  updatedAt: string;
}

// ── Rejection Reason Catalog ──
export interface RejectionReason {
  _id: string;
  organizationId: string;
  code: string;
  label: string;
  category: string;
  isActive: boolean;
}

// ── Tenant Recruitment Settings ──
export interface RecruitmentSettings {
  _id: string;
  organizationId: string;
  aiEnabled: boolean;
  aiMonthlyTokenLimit: number;
  aiTokensUsedThisMonth: number;
  retentionDays: number;
  featureFlags: Record<string, boolean>;
  defaultTimezone: string;
  createdAt: string;
  updatedAt: string;
}

// ── Phase 2: Talent Pools CRM ──
export interface TalentPool {
  _id: string;
  organizationId: string;
  name: string;
  description?: string;
  candidateIds: any[];
  candidates?: any[];
  candidateCount?: number;
  tags?: string[];
  color?: string;
  isPrivate?: boolean;
  createdBy?: RecruitmentUserSummary | null;
  createdAt: string;
  updatedAt: string;
}

// ── Phase 2: Employee Referrals ──
export type ReferralStatus = 'submitted' | 'pending' | 'in_review' | 'interviewing' | 'hired' | 'rejected';

export interface Referral {
  _id: string;
  organizationId: string;
  jobOpeningId: { _id: string; title: string; jobCode: string; locationType: string };
  candidateId?: { _id: string; fullName: string; candidateCode: string; email: string; phone?: string; stage: string };
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  applicationId?: { _id: string; applicationCode: string; stage: string; status: string } | null;
  referredBy?: RecruitmentUserSummary;
  referrerId?: any;
  relationship: string;
  notes?: string;
  status: ReferralStatus;
  createdAt: string;
  updatedAt: string;
}

// ── Phase 2: Public Careers Portal ──
export interface PublicTenantInfo {
  name: string;
  logoUrl?: string | null;
  website?: string | null;
  brandColor?: string;
  industry?: string | null;
  companySize?: string | null;
}

export interface PublicApplyInput {
  fullName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  coverLetter?: string;
  currentCompany?: string;
  currentDesignation?: string;
  totalExperienceYears?: number;
  skills?: string[];
  consentGiven: boolean;
}

// ── Phase 2: AI Screening & Marketing Types ──
export interface ParsedResumeProfile {
  fullName: string;
  email: string;
  phone: string;
  currentCompany: string;
  currentDesignation: string;
  totalExperienceYears: number;
  skills: string[];
  education: { degree: string; institution: string; year?: string }[];
  workHistory: { role: string; company: string; duration?: string; highlights?: string[] }[];
  summary: string;
  confidenceScore: number;
}

export interface MatchScoreResult {
  matchScore: number;
  matchExplanation?: {
    matchedSkills: string[];
    missingSkills: string[];
    experienceFit: 'under_qualified' | 'good_fit' | 'perfect_fit' | 'over_qualified';
    recommendation: string;
  };
  evidenceCitations?: string[];
  overallScore?: number;
  skillsMatch?: number;
  experienceMatch?: number;
  strengths?: string[];
  gaps?: string[];
  recommendation?: string;
}

export interface JdGeneratorResult {
  title: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  inclusivityReport: {
    score: number;
    flags: { phrase: string; issue: string; suggestion: string }[];
    summary: string;
  };
}

export interface MultiChannelPostsResult {
  linkedin: string;
  naukri: string;
  indeed: string;
  whatsapp: string;
  twitter?: string;
  x?: string;
}

// ── Phase 3: Scorecards, Calibration & Interview Ops ──
export type ScorecardRecommendation = 'strong_hire' | 'hire' | 'neutral' | 'no_hire' | 'strong_no_hire';
export const SCORECARD_RECOMMENDATION_LABELS: Record<ScorecardRecommendation, string> = {
  strong_hire: 'Strong Hire',
  hire: 'Hire',
  neutral: 'Neutral / Lean',
  no_hire: 'No Hire',
  strong_no_hire: 'Strong No Hire',
};

export interface CompetencyRating {
  name: string;
  weight?: number;
  rating: number; // 1 to 5
  evidence?: string;
}

export interface Scorecard {
  _id: string;
  organizationId: string;
  interviewId: string;
  candidateId: string;
  jobOpeningId: string;
  applicationId?: string;
  interviewerId: RecruitmentUserSummary;
  competencyRatings: CompetencyRating[];
  overallRating: number;
  recommendation: ScorecardRecommendation;
  strengths?: string;
  areasOfConcern?: string;
  isSealed: boolean;
  sealedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScorecardTemplate {
  _id: string;
  organizationId: string;
  name: string;
  department?: string;
  roleType?: string;
  competencies: {
    name: string;
    description?: string;
    weight: number;
    rubric?: {
      1?: string;
      2?: string;
      3?: string;
      4?: string;
      5?: string;
    };
  }[];
  isDefault: boolean;
  createdBy?: RecruitmentUserSummary;
  createdAt: string;
}

export interface InterviewDebriefSummary {
  success: boolean;
  interview: Interview;
  totalScorecards: number;
  averageOverallRating: number;
  ratingSpread: number;
  varianceAlert: boolean;
  recommendationTallies: Record<ScorecardRecommendation, number>;
  scorecards: Scorecard[];
  consensusOutcome: {
    decision: ConsensusDecision;
    notes?: string;
    decidedBy?: RecruitmentUserSummary | string;
    decidedAt?: string;
  };
}

export interface InterviewQuestionItem {
  competency: string;
  question: string;
  probeFollowUp: string;
  whatToLookFor: string;
  redFlags: string;
}

export interface InterviewQuestionKit {
  roundType: string;
  questions: InterviewQuestionItem[];
  interviewerTips: string[];
}

// ── Phase 5: Analytics, EEO & Copilot Types ──
export interface RecruitmentAnalyticsOverview {
  activeCandidates: number;
  openJobOpenings: number;
  totalHires: number;
  totalInterviewsCompleted: number;
  offerAcceptanceRate: number;
  avgTimeToHireDays: number;
}

export interface FunnelStageMetric {
  stage: string;
  label: string;
  count: number;
  passThroughRate: number;
  dropOffRate: number;
}

export interface FunnelAnalyticsPayload {
  totalCandidates: number;
  funnel: FunnelStageMetric[];
}

export interface SourcingRoiMetric {
  source: string;
  label: string;
  applicants: number;
  hires: number;
  conversionRate: number;
  avgRating: number;
}

export interface VelocityMetric {
  department: string;
  totalOpenings: number;
  filledPositions: number;
  openPositions: number;
}

export interface EeoDemographicItem {
  key: string;
  label: string;
  count: number;
  percentage: number;
}

export interface EeoDemographicsSummary {
  totalSubmissions: number;
  gender: EeoDemographicItem[];
  ethnicity: EeoDemographicItem[];
  veteranStatus: EeoDemographicItem[];
  disabilityStatus: EeoDemographicItem[];
}

export interface AdverseImpactGroup {
  group: string;
  totalApplicants: number;
  hires: number;
  selectionRatePercent: number;
  impactRatio: number;
  isBenchmark: boolean;
  hasAdverseImpactNotice: boolean;
}

export interface AdverseImpactResult {
  rule: string;
  benchmarkGroup: string;
  highestSelectionRatePercent: number;
  groups: AdverseImpactGroup[];
}

export interface RecruiterCopilotSynthesis {
  title: string;
  executiveSummary: string;
  keyStrengths: string[];
  areasOfConcern: string[];
  overallRecommendation: string;
  suggestedNextSteps: string[];
}


