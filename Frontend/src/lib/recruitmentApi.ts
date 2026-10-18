import { apiClient } from './apiClient';
import type {
  JobOpening,
  Candidate,
  Interview,
  JobOffer,
  RecruitmentSummary,
  RecruitmentPipelinePayload,
  CandidateStage,
  JobStatus,
  OfferStatus,
  Application,
  Requisition,
  PipelineTemplate,
  RejectionReason,
  RecruitmentSettings,
  TalentPool,
  Referral,
  ReferralStatus,
  PublicTenantInfo,
  PublicApplyInput,
  ParsedResumeProfile,
  MatchScoreResult,
  JdGeneratorResult,
  MultiChannelPostsResult,
  MeetingPlatform,
  ScorecardRecommendation,
  ConsensusDecision,
  Scorecard,
  ScorecardTemplate,
  InterviewDebriefSummary,
  InterviewQuestionKit,
  CompensationBreakdown,
  BandGovernance,
  PublicOfferDetail,
  RecruitmentAnalyticsOverview,
  FunnelAnalyticsPayload,
  SourcingRoiMetric,
  VelocityMetric,
  EeoDemographicsSummary,
  AdverseImpactResult,
  RecruiterCopilotSynthesis,
} from '../types/recruitment';

export interface CreateJobInput {
  title: string;
  departmentId: string;
  locationType?: string;
  location?: string;
  employmentType?: string;
  experienceLevel?: string;
  salaryRange?: { min: number; max: number; currency: string; isPublic: boolean };
  openPositions?: number;
  status?: JobStatus;
  hiringManagerId?: string;
  assignedRecruiters?: string[];
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  skills?: string[];
  targetCloseDate?: string | null;
}

export interface CreateCandidateInput {
  jobOpeningId: string;
  fullName: string;
  email: string;
  phone?: string;
  currentCompany?: string;
  currentDesignation?: string;
  totalExperienceYears?: number;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  skills?: string[];
  expectedSalary?: number;
  noticePeriodDays?: number;
  source?: string;
  referredBy?: string;
  stage?: CandidateStage;
  tags?: string[];
  notes?: string;
}

export interface ScheduleInterviewInput {
  candidateId: string;
  jobOpeningId?: string;
  title: string;
  roundType?: string;
  interviewers?: string[];
  scheduledStart: string;
  scheduledEnd: string;
  timezone?: string;
  meetingPlatform?: MeetingPlatform;
  meetingLink?: string;
  meetingPassword?: string;
  location?: string;
}

export interface RescheduleInterviewInput {
  scheduledStart: string;
  scheduledEnd: string;
  reason?: string;
  timezone?: string;
}

export interface ScorecardInput {
  rating: number;
  decision?: string;
  technicalSkillScore?: number;
  communicationScore?: number;
  cultureFitScore?: number;
  notes?: string;
}

export interface MultiScorecardInput {
  competencyRatings: {
    name: string;
    weight?: number;
    rating: number;
    evidence?: string;
  }[];
  overallRating: number;
  recommendation: ScorecardRecommendation;
  strengths?: string;
  areasOfConcern?: string;
  seal?: boolean;
}

export interface CreateOfferInput {
  candidateId: string;
  jobOpeningId?: string;
  designation: string;
  departmentId: string;
  offeredSalary: number;
  currency?: string;
  joiningDate: string;
  validUntil: string;
  benefits?: string[];
  notes?: string;
  offerLetterUrl?: string;
  compensationBreakdown?: Partial<CompensationBreakdown>;
  hiringManagerId?: string;
  hrDirectorId?: string;
  bandJustification?: string;
  isDraft?: boolean;
}

export interface OnboardEmployeeInput {
  employeeCode?: string;
  joiningDate?: string;
  departmentId?: string;
  designation?: string;
  managerId?: string;
  employmentType?: string;
  skills?: string[];
}

export const recruitmentApi = {
  // ── Summary & KPIs ──
  getSummary: async () => {
    const res = await apiClient.get<RecruitmentSummary>('/recruitment/summary');
    return res.data;
  },

  // ── Job Openings ──
  getJobs: async (params: { status?: string; departmentId?: string; employmentType?: string; search?: string } = {}) => {
    const res = await apiClient.get<JobOpening[]>('/recruitment/jobs', { params });
    return res.data;
  },

  getJob: async (id: string) => {
    const res = await apiClient.get<JobOpening>(`/recruitment/jobs/${id}`);
    return res.data;
  },

  createJob: async (input: CreateJobInput) => {
    const res = await apiClient.post<JobOpening>('/recruitment/jobs', input);
    return res.data;
  },

  updateJob: async (id: string, patch: Partial<CreateJobInput>) => {
    const res = await apiClient.patch<JobOpening>(`/recruitment/jobs/${id}`, patch);
    return res.data;
  },

  updateJobStatus: async (id: string, status: JobStatus) => {
    const res = await apiClient.patch<JobOpening>(`/recruitment/jobs/${id}/status`, { status });
    return res.data;
  },

  deleteJob: async (id: string) => {
    const res = await apiClient.delete<{ message: string }>(`/recruitment/jobs/${id}`);
    return res.data;
  },

  generateLinkedInPost: async (id: string, options: { tone?: string; customNotes?: string } = {}) => {
    const res = await apiClient.post<{ success: boolean; post: string; provider: string }>(
      `/recruitment/jobs/${id}/linkedin-post`,
      options
    );
    return res.data;
  },

  // ── ATS Pipeline (Kanban) ──
  getPipeline: async (params: { jobOpeningId?: string; search?: string } = {}) => {
    const res = await apiClient.get<RecruitmentPipelinePayload>('/recruitment/pipeline', { params });
    return res.data;
  },

  moveCandidateStage: async (id: string, stage: CandidateStage, note?: string) => {
    const res = await apiClient.patch<Candidate>(`/recruitment/candidates/${id}/stage`, { stage, note });
    return res.data;
  },

  // ── Candidates ──
  getCandidates: async (params: { stage?: string; jobOpeningId?: string; source?: string; search?: string; rating?: number } = {}) => {
    const res = await apiClient.get<Candidate[]>('/recruitment/candidates', { params });
    return res.data;
  },

  getCandidate: async (id: string) => {
    const res = await apiClient.get<Candidate>(`/recruitment/candidates/${id}`);
    return res.data;
  },

  createCandidate: async (input: CreateCandidateInput) => {
    const res = await apiClient.post<Candidate>('/recruitment/candidates', input);
    return res.data;
  },

  updateCandidate: async (id: string, patch: Partial<CreateCandidateInput> & { rating?: number; rejectionReason?: string }) => {
    const res = await apiClient.patch<Candidate>(`/recruitment/candidates/${id}`, patch);
    return res.data;
  },

  deleteCandidate: async (id: string) => {
    const res = await apiClient.delete<{ message: string }>(`/recruitment/candidates/${id}`);
    return res.data;
  },

  // ── Interviews ──
  getInterviews: async (params: { status?: string; candidateId?: string; jobOpeningId?: string; interviewerId?: string; upcoming?: boolean } = {}) => {
    const res = await apiClient.get<Interview[]>('/recruitment/interviews', {
      params: { ...params, upcoming: params.upcoming ? 'true' : undefined },
    });
    return res.data;
  },

  scheduleInterview: async (input: ScheduleInterviewInput) => {
    const res = await apiClient.post<Interview>('/recruitment/interviews', input);
    return res.data;
  },

  updateInterview: async (id: string, patch: Partial<ScheduleInterviewInput> & { status?: string }) => {
    const res = await apiClient.patch<Interview>(`/recruitment/interviews/${id}`, patch);
    return res.data;
  },

  submitScorecard: async (id: string, scorecard: ScorecardInput) => {
    const res = await apiClient.post<Interview>(`/recruitment/interviews/${id}/scorecard`, scorecard);
    return res.data;
  },

  cancelInterview: async (id: string, reason?: string) => {
    const res = await apiClient.delete<Interview>(`/recruitment/interviews/${id}`, { data: { reason } });
    return res.data;
  },

  rescheduleInterview: async (id: string, input: RescheduleInterviewInput) => {
    const res = await apiClient.patch<Interview>(`/recruitment/interviews/${id}/reschedule`, input);
    return res.data;
  },

  downloadInterviewIcsUrl: (id: string) => {
    return `/api/v1/recruitment/interviews/${id}/ics`;
  },

  downloadInterviewIcs: async (id: string, fileName?: string) => {
    const res = await apiClient.get(`/recruitment/interviews/${id}/ics`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName || `interview-${id}.ics`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // ── Multi-Interviewer Scorecards & Calibration ──
  getInterviewScorecards: async (interviewId: string) => {
    const res = await apiClient.get<{ success: boolean; scorecards: Scorecard[] }>(
      `/recruitment/interviews/${interviewId}/scorecards`
    );
    return res.data;
  },

  submitPanelScorecard: async (interviewId: string, input: MultiScorecardInput) => {
    const res = await apiClient.post<{ success: boolean; message: string; scorecard: Scorecard }>(
      `/recruitment/interviews/${interviewId}/scorecards`,
      input
    );
    return res.data;
  },

  sealScorecard: async (scorecardId: string) => {
    const res = await apiClient.post<{ success: boolean; message: string; scorecard: Scorecard }>(
      `/recruitment/scorecards/${scorecardId}/seal`
    );
    return res.data;
  },

  getInterviewDebrief: async (interviewId: string) => {
    const res = await apiClient.get<InterviewDebriefSummary>(
      `/recruitment/interviews/${interviewId}/debrief`
    );
    return res.data;
  },

  recordConsensus: async (
    interviewId: string,
    input: { decision: ConsensusDecision; notes?: string; advanceStage?: boolean; targetStage?: string }
  ) => {
    const res = await apiClient.post<{ success: boolean; message: string; consensusOutcome: any }>(
      `/recruitment/interviews/${interviewId}/consensus`,
      input
    );
    return res.data;
  },

  getScorecardTemplates: async () => {
    const res = await apiClient.get<{ success: boolean; templates: ScorecardTemplate[] }>(
      '/recruitment/settings/scorecard-templates'
    );
    return res.data;
  },

  createScorecardTemplate: async (input: Partial<ScorecardTemplate>) => {
    const res = await apiClient.post<{ success: boolean; template: ScorecardTemplate }>(
      '/recruitment/settings/scorecard-templates',
      input
    );
    return res.data;
  },

  generateInterviewQuestionKit: async (interviewId?: string, payload?: any) => {
    const endpoint = interviewId
      ? `/recruitment/interviews/${interviewId}/question-kit`
      : '/recruitment/ai/question-kit';
    const res = await apiClient.post<{ success: boolean; kit: InterviewQuestionKit; provider: string }>(
      endpoint,
      payload || {}
    );
    return res.data;
  },

  // ── Offers ──
  getOffers: async (params: { status?: string; candidateId?: string; jobOpeningId?: string } = {}) => {
    const res = await apiClient.get<JobOffer[]>('/recruitment/offers', { params });
    return res.data;
  },

  createOffer: async (input: CreateOfferInput) => {
    const res = await apiClient.post<JobOffer>('/recruitment/offers', input);
    return res.data;
  },

  updateOfferStatus: async (id: string, status: OfferStatus, notes?: string) => {
    const res = await apiClient.patch<JobOffer>(`/recruitment/offers/${id}/status`, { status, notes });
    return res.data;
  },

  submitOfferForApproval: async (id: string) => {
    const res = await apiClient.post<JobOffer>(`/recruitment/offers/${id}/submit`);
    return res.data;
  },

  approveOfferStep: async (id: string, comments?: string) => {
    const res = await apiClient.post<JobOffer>(`/recruitment/offers/${id}/approve-step`, { comments });
    return res.data;
  },

  rejectOfferStep: async (id: string, reason?: string) => {
    const res = await apiClient.post<JobOffer>(`/recruitment/offers/${id}/reject-step`, { reason });
    return res.data;
  },

  sendOfferToCandidate: async (id: string) => {
    const res = await apiClient.post<JobOffer>(`/recruitment/offers/${id}/send`);
    return res.data;
  },

  getOfferLetterHtml: async (id: string) => {
    const res = await apiClient.get<{ success: boolean; html: string }>(`/recruitment/offers/${id}/letter`);
    return res.data;
  },

  getOfferLetterPdfUrl: (id: string) => `/api/v1/recruitment/offers/${id}/pdf`,
  getPublicOfferPdfUrl: (token: string) => `/api/v1/recruitment/public/offers/${token}/pdf`,

  getPublicOffer: async (token: string) => {
    const res = await apiClient.get<{
      success: boolean;
      offer: PublicOfferDetail;
      organization: { name: string; logo?: string };
      letterHtml: string;
    }>(`/recruitment/public/offers/${token}`);
    return res.data;
  },

  signPublicOffer: async (token: string, signerName: string, signatureImageUrl?: string) => {
    const res = await apiClient.post<{ success: boolean; message: string; offer: any }>(
      `/recruitment/public/offers/${token}/sign`,
      { signerName, signatureImageUrl }
    );
    return res.data;
  },

  declinePublicOffer: async (token: string, reason?: string, notes?: string) => {
    const res = await apiClient.post<{ success: boolean; message: string }>(
      `/recruitment/public/offers/${token}/decline`,
      { reason, notes }
    );
    return res.data;
  },

  // ── 1-Click HRMS Employee Onboarding Bridge ──
  onboardCandidateToEmployee: async (candidateId: string, input: OnboardEmployeeInput = {}) => {
    const res = await apiClient.post<{ message: string; employee: any; candidateId: string }>(
      `/recruitment/candidates/${candidateId}/onboard-employee`,
      input
    );
    return res.data;
  },

  // ── Requisitions ──
  getRequisitions: async (params: { status?: string; departmentId?: string; search?: string } = {}) => {
    const res = await apiClient.get<Requisition[]>('/recruitment/requisitions', { params });
    return res.data;
  },

  createRequisition: async (input: Partial<Requisition> & { submitNow?: boolean }) => {
    const res = await apiClient.post<Requisition>('/recruitment/requisitions', input);
    return res.data;
  },

  getRequisitionById: async (id: string) => {
    const res = await apiClient.get<Requisition>(`/recruitment/requisitions/${id}`);
    return res.data;
  },

  submitRequisition: async (id: string) => {
    const res = await apiClient.post<Requisition>(`/recruitment/requisitions/${id}/submit`);
    return res.data;
  },

  approveRequisitionStep: async (id: string, comments?: string) => {
    const res = await apiClient.post<Requisition>(`/recruitment/requisitions/${id}/approve`, { comments });
    return res.data;
  },

  rejectRequisitionStep: async (id: string, comments: string) => {
    const res = await apiClient.post<Requisition>(`/recruitment/requisitions/${id}/reject`, { comments });
    return res.data;
  },

  convertRequisitionToJob: async (id: string) => {
    const res = await apiClient.post<{ message: string; requisition: Requisition; jobOpening: JobOpening }>(
      `/recruitment/requisitions/${id}/convert-to-job`
    );
    return res.data;
  },

  // ── Applications ──
  getApplications: async (params: { jobOpeningId?: string; candidateId?: string; stage?: string; status?: string; search?: string } = {}) => {
    const res = await apiClient.get<Application[]>('/recruitment/applications', { params });
    return res.data;
  },

  getApplicationById: async (id: string) => {
    const res = await apiClient.get<Application>(`/recruitment/applications/${id}`);
    return res.data;
  },

  moveApplicationStage: async (id: string, stage: string, note?: string) => {
    const res = await apiClient.patch<Application>(`/recruitment/applications/${id}/stage`, { stage, note });
    return res.data;
  },

  bulkMoveApplications: async (applicationIds: string[], targetStage: string, note?: string) => {
    const res = await apiClient.post<{ success: boolean; movedCount: number; targetStage: string }>(
      '/recruitment/applications/bulk-move',
      { applicationIds, targetStage, note }
    );
    return res.data;
  },

  bulkRejectApplications: async (applicationIds: string[], rejectionReasonId?: string, rejectionNotes?: string) => {
    const res = await apiClient.post<{ success: boolean; rejectedCount: number }>(
      '/recruitment/applications/bulk-reject',
      { applicationIds, rejectionReasonId, rejectionNotes }
    );
    return res.data;
  },

  bulkTagApplications: async (applicationIds: string[], tags: string[]) => {
    const res = await apiClient.post<{ success: boolean; modifiedCount: number }>(
      '/recruitment/applications/bulk-tag',
      { applicationIds, tags }
    );
    return res.data;
  },

  // ── Settings, Pipeline Templates & Catalogs ──
  getPipelineTemplates: async () => {
    const res = await apiClient.get<PipelineTemplate[]>('/recruitment/settings/pipelines');
    return res.data;
  },

  createPipelineTemplate: async (input: Partial<PipelineTemplate>) => {
    const res = await apiClient.post<PipelineTemplate>('/recruitment/settings/pipelines', input);
    return res.data;
  },

  updatePipelineTemplate: async (id: string, input: Partial<PipelineTemplate>) => {
    const res = await apiClient.patch<PipelineTemplate>(`/recruitment/settings/pipelines/${id}`, input);
    return res.data;
  },

  getRejectionReasons: async () => {
    const res = await apiClient.get<RejectionReason[]>('/recruitment/settings/rejection-reasons');
    return res.data;
  },

  createRejectionReason: async (input: { label: string; category?: string; code?: string }) => {
    const res = await apiClient.post<RejectionReason>('/recruitment/settings/rejection-reasons', input);
    return res.data;
  },

  getRecruitmentSettings: async () => {
    const res = await apiClient.get<RecruitmentSettings>('/recruitment/settings');
    return res.data;
  },

  updateRecruitmentSettings: async (patch: Partial<RecruitmentSettings>) => {
    const res = await apiClient.patch<RecruitmentSettings>('/recruitment/settings', patch);
    return res.data;
  },

  // ── Phase 2: Public Careers Portal ──
  getPublicTenantInfo: async (tenantSlug: string) => {
    const res = await apiClient.get<PublicTenantInfo>(`/recruitment/public/${tenantSlug}/info`);
    return res.data;
  },

  getPublicJobs: async (tenantSlug: string, params: { department?: string; locationType?: string; search?: string } = {}) => {
    const res = await apiClient.get<JobOpening[]>(`/recruitment/public/${tenantSlug}/jobs`, { params });
    return res.data;
  },

  getPublicJobById: async (tenantSlug: string, id: string) => {
    const res = await apiClient.get<JobOpening>(`/recruitment/public/${tenantSlug}/jobs/${id}`);
    return res.data;
  },

  applyPublicJob: async (tenantSlug: string, id: string, input: PublicApplyInput) => {
    const res = await apiClient.post<{ success: boolean; message: string; applicationCode: string; candidateCode: string }>(
      `/recruitment/public/${tenantSlug}/jobs/${id}/apply`,
      input
    );
    return res.data;
  },

  // ── Phase 2: Talent Pools CRM ──
  getTalentPools: async () => {
    const res = await apiClient.get<TalentPool[]>('/recruitment/talent-pools');
    return res.data;
  },

  getTalentPoolById: async (id: string) => {
    const res = await apiClient.get<TalentPool>(`/recruitment/talent-pools/${id}`);
    return res.data;
  },

  createTalentPool: async (input: { name: string; description?: string; color?: string; tags?: string[]; isPrivate?: boolean }) => {
    const res = await apiClient.post<TalentPool>('/recruitment/talent-pools', input);
    return res.data;
  },

  addCandidatesToPool: async (id: string, candidateIds: string[]) => {
    const res = await apiClient.post<{ message: string; pool: TalentPool }>(`/recruitment/talent-pools/${id}/candidates`, { candidateIds });
    return res.data;
  },

  removeCandidatesFromPool: async (id: string, candidateIds: string[]) => {
    const res = await apiClient.delete<{ message: string; pool: TalentPool }>(`/recruitment/talent-pools/${id}/candidates`, { data: { candidateIds } });
    return res.data;
  },

  deleteTalentPool: async (id: string) => {
    const res = await apiClient.delete<{ message: string }>(`/recruitment/talent-pools/${id}`);
    return res.data;
  },

  // ── Phase 2: Employee Referrals ──
  getReferrals: async (params?: { status?: string }) => {
    const res = await apiClient.get<Referral[]>('/recruitment/referrals', { params });
    return res.data;
  },

  createReferral: async (input: { jobOpeningId: string; fullName: string; email: string; phone?: string; relationship: string; notes?: string; resumeUrl?: string }) => {
    const res = await apiClient.post<Referral>('/recruitment/referrals', input);
    return res.data;
  },

  updateReferralStatus: async (id: string, status: ReferralStatus) => {
    const res = await apiClient.patch<Referral>(`/recruitment/referrals/${id}/status`, { status });
    return res.data;
  },

  // ── Phase 2: AI Suite Tools ──
  generateMultiChannelPosts: async (
    jobId: string,
    toneOrOptions: string | { tone?: string; channels?: string[]; customNotes?: string } = 'dynamic'
  ) => {
    const payload = typeof toneOrOptions === 'string' ? { tone: toneOrOptions } : toneOrOptions;
    const res = await apiClient.post<{ success: boolean; channels: MultiChannelPostsResult; provider: string; model: string }>(
      `/recruitment/jobs/${jobId}/social-posts`,
      payload
    );
    return res.data;
  },

  parseResume: async (resumeText: string, rawFileName?: string) => {
    const res = await apiClient.post<{ success: boolean; parsedProfile: ParsedResumeProfile; provider: string }>(
      '/recruitment/ai/parse-resume',
      { resumeText, rawFileName }
    );
    return res.data;
  },

  calculateMatchScore: async (applicationId: string) => {
    const res = await apiClient.post<MatchScoreResult>(`/recruitment/applications/${applicationId}/match-score`);
    return res.data;
  },

  generateJobDescription: async (params: { title: string; department?: string; experienceLevel?: string; employmentType?: string; keySkills?: string[]; locationType?: string }) => {
    const res = await apiClient.post<{ success: boolean; jobDescription: JdGeneratorResult; provider: string }>(
      '/recruitment/ai/generate-jd',
      params
    );
    return res.data;
  },

  // ── Phase 5: Analytics & Intelligence ──
  getAnalyticsOverview: async () => {
    const res = await apiClient.get<RecruitmentAnalyticsOverview>('/recruitment/analytics/overview');
    return res.data;
  },

  getFunnelAnalytics: async (jobOpeningId?: string) => {
    const res = await apiClient.get<FunnelAnalyticsPayload>('/recruitment/analytics/funnel', {
      params: { jobOpeningId },
    });
    return res.data;
  },

  getSourcingRoi: async () => {
    const res = await apiClient.get<SourcingRoiMetric[]>('/recruitment/analytics/sources');
    return res.data;
  },

  getVelocityMetrics: async () => {
    const res = await apiClient.get<VelocityMetric[]>('/recruitment/analytics/velocity');
    return res.data;
  },

  getEeoDemographics: async () => {
    const res = await apiClient.get<EeoDemographicsSummary>('/recruitment/compliance/eeo');
    return res.data;
  },

  getAdverseImpactAnalysis: async () => {
    const res = await apiClient.get<AdverseImpactResult>('/recruitment/compliance/adverse-impact');
    return res.data;
  },

  submitPublicEeoSurvey: async (tenantSlug: string, jobId: string, data: any) => {
    const res = await apiClient.post<{ success: boolean; message: string; id: string }>(
      `/recruitment/public/${tenantSlug}/jobs/${jobId}/eeo`,
      data
    );
    return res.data;
  },

  semanticSearchCandidates: async (
    query: string,
    options: { minRating?: number; silverMedalistsOnly?: boolean } = {}
  ) => {
    const res = await apiClient.post<{ success: boolean; count: number; candidates: any[] }>(
      '/recruitment/search/semantic',
      { query, ...options }
    );
    return res.data;
  },

  getSilverMedalists: async (jobId: string) => {
    const res = await apiClient.get<{ success: boolean; medalists: any[] }>(
      `/recruitment/jobs/${jobId}/silver-medalists`
    );
    return res.data;
  },

  exportRecruitmentReport: async (reportType: 'pipeline' | 'offers' = 'pipeline') => {
    const res = await apiClient.post('/recruitment/reports/export', { reportType }, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nebula_${reportType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  synthesizeCopilot: async (payload: {
    action?: 'summarize_dossier' | 'compare_candidates' | 'briefing_notes';
    candidateId?: string;
    candidateIds?: string[];
    jobOpeningId?: string;
    notes?: string;
  }) => {
    const res = await apiClient.post<{
      success: boolean;
      provider: string;
      synthesis: RecruiterCopilotSynthesis;
    }>('/recruitment/ai/copilot', payload);
    return res.data;
  },
};
