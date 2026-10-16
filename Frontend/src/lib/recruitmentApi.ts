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
  meetingLink?: string;
  location?: string;
}

export interface ScorecardInput {
  rating: number;
  decision?: string;
  technicalSkillScore?: number;
  communicationScore?: number;
  cultureFitScore?: number;
  notes?: string;
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

  // ── 1-Click HRMS Employee Onboarding Bridge ──
  onboardCandidateToEmployee: async (candidateId: string, input: OnboardEmployeeInput = {}) => {
    const res = await apiClient.post<{ message: string; employee: any; candidateId: string }>(
      `/recruitment/candidates/${candidateId}/onboard-employee`,
      input
    );
    return res.data;
  },
};
