import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  recruitmentApi,
  type CreateJobInput,
  type CreateCandidateInput,
  type ScheduleInterviewInput,
  type ScorecardInput,
  type CreateOfferInput,
  type OnboardEmployeeInput,
} from '../lib/recruitmentApi';
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

export const recruitmentKeys = {
  all: ['recruitment'] as const,
  summary: ['recruitment', 'summary'] as const,
  jobs: ['recruitment', 'jobs'] as const,
  job: (id: string) => ['recruitment', 'job', id] as const,
  pipeline: (filters?: { jobOpeningId?: string; search?: string }) =>
    ['recruitment', 'pipeline', filters] as const,
  candidates: (filters?: any) => ['recruitment', 'candidates', filters] as const,
  candidate: (id: string) => ['recruitment', 'candidate', id] as const,
  interviews: (filters?: any) => ['recruitment', 'interviews', filters] as const,
  offers: (filters?: any) => ['recruitment', 'offers', filters] as const,
};

const getErrMessage = (err: any, fallback: string) =>
  err?.response?.data?.error || err?.message || fallback;

// ── Summary Hook ──
export const useRecruitmentSummary = () =>
  useQuery<RecruitmentSummary, Error>({
    queryKey: recruitmentKeys.summary,
    queryFn: () => recruitmentApi.getSummary(),
    staleTime: 1000 * 60 * 2, // 2 mins
  });

// ── Jobs Hooks ──
export const useJobs = (params: { status?: string; departmentId?: string; employmentType?: string; search?: string } = {}) =>
  useQuery<JobOpening[], Error>({
    queryKey: [...recruitmentKeys.jobs, params],
    queryFn: () => recruitmentApi.getJobs(params),
  });

export const useJob = (id: string | null) =>
  useQuery<JobOpening, Error>({
    queryKey: recruitmentKeys.job(id || ''),
    queryFn: () => recruitmentApi.getJob(id as string),
    enabled: !!id,
  });

export const useCreateJob = () => {
  const qc = useQueryClient();
  return useMutation<JobOpening, Error, CreateJobInput>({
    mutationFn: (input) => recruitmentApi.createJob(input),
    onSuccess: (job) => {
      toast.success(`Job "${job.title}" (${job.jobCode}) created.`);
      qc.invalidateQueries({ queryKey: recruitmentKeys.jobs });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create job opening.')),
  });
};

export const useUpdateJob = () => {
  const qc = useQueryClient();
  return useMutation<JobOpening, Error, { id: string; patch: Partial<CreateJobInput> }>({
    mutationFn: ({ id, patch }) => recruitmentApi.updateJob(id, patch),
    onSuccess: (job) => {
      toast.success(`Job "${job.title}" updated.`);
      qc.invalidateQueries({ queryKey: recruitmentKeys.jobs });
      qc.invalidateQueries({ queryKey: recruitmentKeys.job(job._id) });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update job opening.')),
  });
};

export const useUpdateJobStatus = () => {
  const qc = useQueryClient();
  return useMutation<JobOpening, Error, { id: string; status: JobStatus }>({
    mutationFn: ({ id, status }) => recruitmentApi.updateJobStatus(id, status),
    onSuccess: (job) => {
      toast.info(`Job status updated to ${job.status}.`);
      qc.invalidateQueries({ queryKey: recruitmentKeys.jobs });
      qc.invalidateQueries({ queryKey: recruitmentKeys.job(job._id) });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update job status.')),
  });
};

export const useDeleteJob = () => {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => recruitmentApi.deleteJob(id),
    onSuccess: () => {
      toast.info('Job opening deleted.');
      qc.invalidateQueries({ queryKey: recruitmentKeys.jobs });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to delete job opening.')),
  });
};

// ── ATS Pipeline Hooks (with Optimistic Drag-and-Drop) ──
export const useRecruitmentPipeline = (filters?: { jobOpeningId?: string; search?: string }) =>
  useQuery<RecruitmentPipelinePayload, Error>({
    queryKey: recruitmentKeys.pipeline(filters),
    queryFn: () => recruitmentApi.getPipeline(filters),
  });

export const useMoveCandidateStage = () => {
  const qc = useQueryClient();
  return useMutation<
    Candidate,
    Error,
    { id: string; stage: CandidateStage; note?: string },
    { previousPayloads: [any, RecruitmentPipelinePayload | undefined][] }
  >({
    mutationFn: ({ id, stage, note }) => recruitmentApi.moveCandidateStage(id, stage, note),
    onMutate: async ({ id, stage }) => {
      await qc.cancelQueries({ queryKey: recruitmentKeys.all });

      // Find all cached pipeline queries
      const queryCache = qc.getQueryCache();
      const pipelineQueries = queryCache.findAll({ queryKey: ['recruitment', 'pipeline'] });
      const previousPayloads: [any, RecruitmentPipelinePayload | undefined][] = [];

      for (const query of pipelineQueries) {
        const queryKey = query.queryKey;
        const previous = qc.getQueryData<RecruitmentPipelinePayload>(queryKey);
        if (previous) {
          previousPayloads.push([queryKey, previous]);

          // Optimistically move card in pipeline
          let foundCandidate: Candidate | null = null;
          const nextPipeline = { ...previous.pipeline };

          for (const s of Object.keys(nextPipeline) as CandidateStage[]) {
            const idx = nextPipeline[s]?.findIndex((c) => c._id === id);
            if (idx !== undefined && idx !== -1) {
              foundCandidate = { ...nextPipeline[s][idx], stage };
              nextPipeline[s] = nextPipeline[s].filter((c) => c._id !== id);
              break;
            }
          }

          if (foundCandidate) {
            nextPipeline[stage] = [foundCandidate, ...(nextPipeline[stage] || [])];
            qc.setQueryData<RecruitmentPipelinePayload>(queryKey, {
              ...previous,
              pipeline: nextPipeline,
            });
          }
        }
      }

      return { previousPayloads };
    },
    onError: (err, _vars, context) => {
      if (context?.previousPayloads) {
        for (const [key, data] of context.previousPayloads) {
          qc.setQueryData(key, data);
        }
      }
      toast.error(getErrMessage(err, 'Failed to move candidate.'));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['recruitment', 'pipeline'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'candidates'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
  });
};

// ── Candidates Hooks ──
export const useCandidates = (params: { stage?: string; jobOpeningId?: string; source?: string; search?: string; rating?: number } = {}) =>
  useQuery<Candidate[], Error>({
    queryKey: recruitmentKeys.candidates(params),
    queryFn: () => recruitmentApi.getCandidates(params),
  });

export const useCandidate = (id: string | null) =>
  useQuery<Candidate, Error>({
    queryKey: recruitmentKeys.candidate(id || ''),
    queryFn: () => recruitmentApi.getCandidate(id as string),
    enabled: !!id,
  });

export const useCreateCandidate = () => {
  const qc = useQueryClient();
  return useMutation<Candidate, Error, CreateCandidateInput>({
    mutationFn: (input) => recruitmentApi.createCandidate(input),
    onSuccess: (candidate) => {
      toast.success(`Candidate "${candidate.fullName}" added.`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'candidates'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'pipeline'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
      qc.invalidateQueries({ queryKey: recruitmentKeys.jobs });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to add candidate.')),
  });
};

export const useUpdateCandidate = () => {
  const qc = useQueryClient();
  return useMutation<Candidate, Error, { id: string; patch: Partial<CreateCandidateInput> & { rating?: number; rejectionReason?: string } }>({
    mutationFn: ({ id, patch }) => recruitmentApi.updateCandidate(id, patch),
    onSuccess: (candidate) => {
      toast.success(`Candidate "${candidate.fullName}" updated.`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'candidates'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.candidate(candidate._id) });
      qc.invalidateQueries({ queryKey: ['recruitment', 'pipeline'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update candidate.')),
  });
};

export const useDeleteCandidate = () => {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => recruitmentApi.deleteCandidate(id),
    onSuccess: () => {
      toast.info('Candidate deleted.');
      qc.invalidateQueries({ queryKey: ['recruitment', 'candidates'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'pipeline'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to delete candidate.')),
  });
};

// ── Interviews Hooks ──
export const useInterviews = (params: { status?: string; candidateId?: string; jobOpeningId?: string; interviewerId?: string; upcoming?: boolean } = {}) =>
  useQuery<Interview[], Error>({
    queryKey: recruitmentKeys.interviews(params),
    queryFn: () => recruitmentApi.getInterviews(params),
  });

export const useScheduleInterview = () => {
  const qc = useQueryClient();
  return useMutation<Interview, Error, ScheduleInterviewInput>({
    mutationFn: (input) => recruitmentApi.scheduleInterview(input),
    onSuccess: (interview) => {
      toast.success(`Interview "${interview.title}" scheduled.`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'interviews'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.candidate(typeof interview.candidateId === 'object' ? interview.candidateId._id : interview.candidateId) });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to schedule interview.')),
  });
};

export const useSubmitScorecard = () => {
  const qc = useQueryClient();
  return useMutation<Interview, Error, { id: string; scorecard: ScorecardInput }>({
    mutationFn: ({ id, scorecard }) => recruitmentApi.submitScorecard(id, scorecard),
    onSuccess: (interview) => {
      toast.success(`Scorecard submitted for "${interview.title}".`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'interviews'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.candidate(typeof interview.candidateId === 'object' ? interview.candidateId._id : interview.candidateId) });
      qc.invalidateQueries({ queryKey: ['recruitment', 'candidates'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'pipeline'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to submit scorecard.')),
  });
};

export const useCancelInterview = () => {
  const qc = useQueryClient();
  return useMutation<Interview, Error, { id: string; reason?: string }>({
    mutationFn: ({ id, reason }) => recruitmentApi.cancelInterview(id, reason),
    onSuccess: () => {
      toast.info('Interview cancelled.');
      qc.invalidateQueries({ queryKey: ['recruitment', 'interviews'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to cancel interview.')),
  });
};

// ── Offers Hooks ──
export const useOffers = (params: { status?: string; candidateId?: string; jobOpeningId?: string } = {}) =>
  useQuery<JobOffer[], Error>({
    queryKey: recruitmentKeys.offers(params),
    queryFn: () => recruitmentApi.getOffers(params),
  });

export const useCreateOffer = () => {
  const qc = useQueryClient();
  return useMutation<JobOffer, Error, CreateOfferInput>({
    mutationFn: (input) => recruitmentApi.createOffer(input),
    onSuccess: (offer) => {
      toast.success(`Offer ${offer.offerCode} created.`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'offers'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'candidates'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'pipeline'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create job offer.')),
  });
};

export const useUpdateOfferStatus = () => {
  const qc = useQueryClient();
  return useMutation<JobOffer, Error, { id: string; status: OfferStatus; notes?: string }>({
    mutationFn: ({ id, status, notes }) => recruitmentApi.updateOfferStatus(id, status, notes),
    onSuccess: (offer) => {
      toast.info(`Offer ${offer.offerCode} status updated to ${offer.status}.`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'offers'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'candidates'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'pipeline'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update offer status.')),
  });
};

// ── 1-Click HRMS Employee Onboarding Bridge Hook ──
export const useOnboardCandidateToEmployee = () => {
  const qc = useQueryClient();
  return useMutation<
    { message: string; employee: any; candidateId: string },
    Error,
    { candidateId: string; input?: OnboardEmployeeInput }
  >({
    mutationFn: ({ candidateId, input }) =>
      recruitmentApi.onboardCandidateToEmployee(candidateId, input),
    onSuccess: (data) => {
      toast.success(`🎉 ${data.message} (${data.employee?.employeeCode})`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'candidates'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'pipeline'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'offers'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
      qc.invalidateQueries({ queryKey: ['hr', 'employees'] }); // HRMS employee list updated immediately!
      qc.invalidateQueries({ queryKey: ['hr', 'summary'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to onboard candidate.')),
  });
};
