import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  recruitmentApi,
  type CreateJobInput,
  type CreateCandidateInput,
  type ScheduleInterviewInput,
  type RescheduleInterviewInput,
  type ScorecardInput,
  type MultiScorecardInput,
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
  Scorecard,
  ScorecardTemplate,
  InterviewDebriefSummary,
  InterviewQuestionKit,
  ConsensusDecision,
  PublicOfferDetail,
  RecruitmentAnalyticsOverview,
  FunnelAnalyticsPayload,
  SourcingRoiMetric,
  VelocityMetric,
  EeoDemographicsSummary,
  AdverseImpactResult,
  RecruiterCopilotSynthesis,
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

export const useRescheduleInterview = () => {
  const qc = useQueryClient();
  return useMutation<Interview, Error, { id: string; input: RescheduleInterviewInput }>({
    mutationFn: ({ id, input }) => recruitmentApi.rescheduleInterview(id, input),
    onSuccess: (interview) => {
      toast.success(`Interview "${interview.title}" rescheduled.`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'interviews'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to reschedule interview.')),
  });
};

export const useInterviewScorecards = (interviewId: string | null) =>
  useQuery<{ success: boolean; scorecards: Scorecard[] }, Error>({
    queryKey: ['recruitment', 'interviews', interviewId, 'scorecards'],
    queryFn: () => recruitmentApi.getInterviewScorecards(interviewId!),
    enabled: !!interviewId,
  });

export const useSubmitPanelScorecard = () => {
  const qc = useQueryClient();
  return useMutation<
    { success: boolean; message: string; scorecard: Scorecard },
    Error,
    { interviewId: string; input: MultiScorecardInput }
  >({
    mutationFn: ({ interviewId, input }) => recruitmentApi.submitPanelScorecard(interviewId, input),
    onSuccess: (res, vars) => {
      toast.success(res.message || 'Scorecard submitted.');
      qc.invalidateQueries({ queryKey: ['recruitment', 'interviews', vars.interviewId, 'scorecards'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'interviews', vars.interviewId, 'debrief'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'interviews'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'candidates'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'pipeline'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to submit panel scorecard.')),
  });
};

export const useSealScorecard = () => {
  const qc = useQueryClient();
  return useMutation<
    { success: boolean; message: string; scorecard: Scorecard },
    Error,
    { scorecardId: string; interviewId?: string }
  >({
    mutationFn: ({ scorecardId }) => recruitmentApi.sealScorecard(scorecardId),
    onSuccess: (_res, vars) => {
      toast.success('🔒 Scorecard sealed permanently.');
      if (vars.interviewId) {
        qc.invalidateQueries({ queryKey: ['recruitment', 'interviews', vars.interviewId, 'scorecards'] });
        qc.invalidateQueries({ queryKey: ['recruitment', 'interviews', vars.interviewId, 'debrief'] });
      }
      qc.invalidateQueries({ queryKey: ['recruitment', 'interviews'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to seal scorecard.')),
  });
};

export const useInterviewDebrief = (interviewId: string | null) =>
  useQuery<InterviewDebriefSummary, Error>({
    queryKey: ['recruitment', 'interviews', interviewId, 'debrief'],
    queryFn: () => recruitmentApi.getInterviewDebrief(interviewId!),
    enabled: !!interviewId,
  });

export const useRecordConsensus = () => {
  const qc = useQueryClient();
  return useMutation<
    { success: boolean; message: string; consensusOutcome: any },
    Error,
    { interviewId: string; input: { decision: ConsensusDecision; notes?: string; advanceStage?: boolean; targetStage?: string } }
  >({
    mutationFn: ({ interviewId, input }) => recruitmentApi.recordConsensus(interviewId, input),
    onSuccess: (_res, vars) => {
      toast.success('🎯 Hiring consensus recorded.');
      qc.invalidateQueries({ queryKey: ['recruitment', 'interviews', vars.interviewId, 'debrief'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'interviews'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'candidates'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'pipeline'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to record consensus.')),
  });
};

export const useScorecardTemplates = () =>
  useQuery<{ success: boolean; templates: ScorecardTemplate[] }, Error>({
    queryKey: ['recruitment', 'settings', 'scorecard-templates'],
    queryFn: () => recruitmentApi.getScorecardTemplates(),
  });

export const useCreateScorecardTemplate = () => {
  const qc = useQueryClient();
  return useMutation<
    { success: boolean; template: ScorecardTemplate },
    Error,
    Partial<ScorecardTemplate>
  >({
    mutationFn: (input) => recruitmentApi.createScorecardTemplate(input),
    onSuccess: () => {
      toast.success('Scorecard template created.');
      qc.invalidateQueries({ queryKey: ['recruitment', 'settings', 'scorecard-templates'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create template.')),
  });
};

export const useGenerateInterviewQuestionKit = () => {
  return useMutation<
    { success: boolean; kit: InterviewQuestionKit; provider: string },
    Error,
    { interviewId?: string; payload?: any }
  >({
    mutationFn: ({ interviewId, payload }) =>
      recruitmentApi.generateInterviewQuestionKit(interviewId, payload),
    onError: (err) => toast.error(getErrMessage(err, 'Failed to generate question kit.')),
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

export const useSubmitOfferForApproval = () => {
  const qc = useQueryClient();
  return useMutation<JobOffer, Error, string>({
    mutationFn: (id) => recruitmentApi.submitOfferForApproval(id),
    onSuccess: (offer) => {
      toast.success(`Offer ${offer.offerCode} submitted for approval.`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'offers'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to submit offer for approval.')),
  });
};

export const useApproveOfferStep = () => {
  const qc = useQueryClient();
  return useMutation<JobOffer, Error, { id: string; comments?: string }>({
    mutationFn: ({ id, comments }) => recruitmentApi.approveOfferStep(id, comments),
    onSuccess: (offer) => {
      toast.success(`Approval step recorded for ${offer.offerCode}. Status: ${offer.status}`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'offers'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to approve offer step.')),
  });
};

export const useRejectOfferStep = () => {
  const qc = useQueryClient();
  return useMutation<JobOffer, Error, { id: string; reason?: string }>({
    mutationFn: ({ id, reason }) => recruitmentApi.rejectOfferStep(id, reason),
    onSuccess: (offer) => {
      toast.info(`Offer ${offer.offerCode} returned / rejected.`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'offers'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to reject offer step.')),
  });
};

export const useSendOfferToCandidate = () => {
  const qc = useQueryClient();
  return useMutation<JobOffer, Error, string>({
    mutationFn: (id) => recruitmentApi.sendOfferToCandidate(id),
    onSuccess: (offer) => {
      toast.success(`🚀 Offer ${offer.offerCode} sent to candidate with e-sign link!`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'offers'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'candidates'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'pipeline'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to send offer to candidate.')),
  });
};

export const useOfferLetterHtml = (offerId: string | null) =>
  useQuery<{ success: boolean; html: string }, Error>({
    queryKey: ['recruitment', 'offers', offerId, 'letter'],
    queryFn: () => recruitmentApi.getOfferLetterHtml(offerId!),
    enabled: Boolean(offerId),
  });

export const usePublicOffer = (token: string | null) =>
  useQuery<{
    success: boolean;
    offer: PublicOfferDetail;
    organization: { name: string; logo?: string };
    letterHtml: string;
  }, Error>({
    queryKey: ['recruitment', 'public', 'offers', token],
    queryFn: () => recruitmentApi.getPublicOffer(token!),
    enabled: Boolean(token),
  });

export const useSignPublicOffer = () => {
  const qc = useQueryClient();
  return useMutation<
    { success: boolean; message: string; offer: any },
    Error,
    { token: string; signerName: string; signatureImageUrl?: string }
  >({
    mutationFn: ({ token, signerName, signatureImageUrl }) =>
      recruitmentApi.signPublicOffer(token, signerName, signatureImageUrl),
    onSuccess: (data, vars) => {
      toast.success(data.message || 'Offer signed successfully!');
      qc.invalidateQueries({ queryKey: ['recruitment', 'public', 'offers', vars.token] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to sign offer.')),
  });
};

export const useDeclinePublicOffer = () => {
  const qc = useQueryClient();
  return useMutation<
    { success: boolean; message: string },
    Error,
    { token: string; reason?: string; notes?: string }
  >({
    mutationFn: ({ token, reason, notes }) =>
      recruitmentApi.declinePublicOffer(token, reason, notes),
    onSuccess: (data, vars) => {
      toast.info(data.message || 'Offer declined.');
      qc.invalidateQueries({ queryKey: ['recruitment', 'public', 'offers', vars.token] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to decline offer.')),
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

// ── Requisitions Hooks ──
export const useRequisitions = (params: { status?: string; departmentId?: string; search?: string } = {}) =>
  useQuery<any[], Error>({
    queryKey: ['recruitment', 'requisitions', params],
    queryFn: () => recruitmentApi.getRequisitions(params),
  });

export const useRequisition = (id: string | null) =>
  useQuery<any, Error>({
    queryKey: ['recruitment', 'requisitions', id],
    queryFn: () => recruitmentApi.getRequisitionById(id!),
    enabled: Boolean(id),
  });

export const useCreateRequisition = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: (input) => recruitmentApi.createRequisition(input),
    onSuccess: (req) => {
      toast.success(`Requisition ${req.reqCode} created.`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'requisitions'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create requisition.')),
  });
};

export const useSubmitRequisition = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: (id) => recruitmentApi.submitRequisition(id),
    onSuccess: (req) => {
      toast.success(`Requisition ${req.reqCode} submitted for approval.`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'requisitions'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to submit requisition.')),
  });
};

export const useApproveRequisitionStep = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string; comments?: string }>({
    mutationFn: ({ id, comments }) => recruitmentApi.approveRequisitionStep(id, comments),
    onSuccess: (req) => {
      toast.success(`Requisition step approved. Current status: ${req.status}`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'requisitions'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to approve requisition.')),
  });
};

export const useRejectRequisitionStep = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string; comments: string }>({
    mutationFn: ({ id, comments }) => recruitmentApi.rejectRequisitionStep(id, comments),
    onSuccess: (req) => {
      toast.info(`Requisition ${req.reqCode} rejected.`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'requisitions'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to reject requisition.')),
  });
};

export const useConvertRequisitionToJob = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: (id) => recruitmentApi.convertRequisitionToJob(id),
    onSuccess: (res) => {
      toast.success(`🎉 ${res.message} (${res.jobOpening?.jobCode})`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'requisitions'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.jobs });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to convert requisition to job.')),
  });
};

// ── Applications Hooks ──
export const useApplications = (params: { jobOpeningId?: string; candidateId?: string; stage?: string; status?: string; search?: string } = {}) =>
  useQuery<any[], Error>({
    queryKey: ['recruitment', 'applications', params],
    queryFn: () => recruitmentApi.getApplications(params),
  });

export const useApplication = (id: string | null) =>
  useQuery<any, Error>({
    queryKey: ['recruitment', 'applications', id],
    queryFn: () => recruitmentApi.getApplicationById(id!),
    enabled: Boolean(id),
  });

export const useMoveApplicationStage = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string; stage: string; note?: string }>({
    mutationFn: ({ id, stage, note }) => recruitmentApi.moveApplicationStage(id, stage, note),
    onSuccess: (app) => {
      toast.success(`Application advanced to "${app.stage.replace(/_/g, ' ')}".`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'applications'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'pipeline'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update application stage.')),
  });
};

export const useBulkMoveApplications = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { applicationIds: string[]; targetStage: string; note?: string }>({
    mutationFn: ({ applicationIds, targetStage, note }) =>
      recruitmentApi.bulkMoveApplications(applicationIds, targetStage, note),
    onSuccess: (res) => {
      toast.success(`Bulk moved ${res.movedCount} applications to ${res.targetStage}.`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'applications'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'pipeline'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to bulk move applications.')),
  });
};

export const useBulkRejectApplications = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { applicationIds: string[]; rejectionReasonId?: string; rejectionNotes?: string }>({
    mutationFn: ({ applicationIds, rejectionReasonId, rejectionNotes }) =>
      recruitmentApi.bulkRejectApplications(applicationIds, rejectionReasonId, rejectionNotes),
    onSuccess: (res) => {
      toast.info(`Bulk rejected ${res.rejectedCount} applications.`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'applications'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'pipeline'] });
      qc.invalidateQueries({ queryKey: recruitmentKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to bulk reject applications.')),
  });
};

export const useBulkTagApplications = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { applicationIds: string[]; tags: string[] }>({
    mutationFn: ({ applicationIds, tags }) =>
      recruitmentApi.bulkTagApplications(applicationIds, tags),
    onSuccess: (res) => {
      toast.success(`Tagged ${res.modifiedCount} applications.`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'applications'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to tag applications.')),
  });
};

// ── Pipeline Templates & Settings Hooks ──
export const usePipelineTemplates = () =>
  useQuery<any[], Error>({
    queryKey: ['recruitment', 'settings', 'pipelines'],
    queryFn: () => recruitmentApi.getPipelineTemplates(),
  });

export const useCreatePipelineTemplate = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: (input) => recruitmentApi.createPipelineTemplate(input),
    onSuccess: () => {
      toast.success('Pipeline template created.');
      qc.invalidateQueries({ queryKey: ['recruitment', 'settings', 'pipelines'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create pipeline template.')),
  });
};

export const useRejectionReasons = () =>
  useQuery<any[], Error>({
    queryKey: ['recruitment', 'settings', 'rejection-reasons'],
    queryFn: () => recruitmentApi.getRejectionReasons(),
  });

export const useRecruitmentSettings = () =>
  useQuery<any, Error>({
    queryKey: ['recruitment', 'settings'],
    queryFn: () => recruitmentApi.getRecruitmentSettings(),
  });

export const useUpdateRecruitmentSettings = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({
    mutationFn: (patch) => recruitmentApi.updateRecruitmentSettings(patch),
    onSuccess: () => {
      toast.success('Recruitment settings updated.');
      qc.invalidateQueries({ queryKey: ['recruitment', 'settings'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update settings.')),
  });
};

// ── Phase 2: Public Careers Portal Hooks ──
export const usePublicTenantInfo = (tenantSlug: string) =>
  useQuery<any, Error>({
    queryKey: ['recruitment', 'public', tenantSlug, 'info'],
    queryFn: () => recruitmentApi.getPublicTenantInfo(tenantSlug),
    enabled: Boolean(tenantSlug),
  });

export const usePublicJobs = (tenantSlug: string, params: { department?: string; locationType?: string; search?: string } = {}) =>
  useQuery<any[], Error>({
    queryKey: ['recruitment', 'public', tenantSlug, 'jobs', params],
    queryFn: () => recruitmentApi.getPublicJobs(tenantSlug, params),
    enabled: Boolean(tenantSlug),
  });

export const usePublicJob = (tenantSlug: string, id: string | null) =>
  useQuery<any, Error>({
    queryKey: ['recruitment', 'public', tenantSlug, 'jobs', id],
    queryFn: () => recruitmentApi.getPublicJobById(tenantSlug, id!),
    enabled: Boolean(tenantSlug && id),
  });

export const usePublicJobDetails = usePublicJob;
export const useJobOpenings = useJobs;

export const useApplyPublicJob = () =>
  useMutation<any, Error, { tenantSlug: string; id: string; input: any }>({
    mutationFn: ({ tenantSlug, id, input }) => recruitmentApi.applyPublicJob(tenantSlug, id, input),
    onSuccess: (res) => {
      toast.success(res.message || 'Application submitted successfully!');
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to submit application.')),
  });

// ── Phase 2: Talent Pools Hooks ──
export const useTalentPools = () =>
  useQuery<any[], Error>({
    queryKey: ['recruitment', 'talent-pools'],
    queryFn: () => recruitmentApi.getTalentPools(),
  });

export const useTalentPool = (id: string | null) =>
  useQuery<any, Error>({
    queryKey: ['recruitment', 'talent-pools', id],
    queryFn: () => recruitmentApi.getTalentPoolById(id!),
    enabled: Boolean(id),
  });

export const useCreateTalentPool = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { name: string; description?: string; color?: string; tags?: string[]; isPrivate?: boolean }>({
    mutationFn: (input) => recruitmentApi.createTalentPool(input),
    onSuccess: (pool) => {
      toast.success(`Talent pool "${pool.name}" created.`);
      qc.invalidateQueries({ queryKey: ['recruitment', 'talent-pools'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create talent pool.')),
  });
};

export const useAddCandidatesToPool = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string; candidateIds: string[] }>({
    mutationFn: ({ id, candidateIds }) => recruitmentApi.addCandidatesToPool(id, candidateIds),
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries({ queryKey: ['recruitment', 'talent-pools'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update talent pool.')),
  });
};

export const useRemoveCandidateFromPool = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { poolId: string; candidateId: string }>({
    mutationFn: ({ poolId, candidateId }) =>
      recruitmentApi.removeCandidatesFromPool(poolId, [candidateId]),
    onSuccess: () => {
      toast.info('Candidate removed from pool.');
      qc.invalidateQueries({ queryKey: ['recruitment', 'talent-pools'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to remove candidate.')),
  });
};

export const useDeleteTalentPool = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: (id) => recruitmentApi.deleteTalentPool(id),
    onSuccess: () => {
      toast.success('Talent pool deleted.');
      qc.invalidateQueries({ queryKey: ['recruitment', 'talent-pools'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to delete talent pool.')),
  });
};

// ── Phase 2: Referrals Hooks ──
export const useReferrals = (params?: { status?: string }) =>
  useQuery<any[], Error>({
    queryKey: ['recruitment', 'referrals', params],
    queryFn: () => recruitmentApi.getReferrals(params),
  });

export const useCreateReferral = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { jobOpeningId: string; fullName: string; email: string; phone?: string; relationship: string; notes?: string; resumeUrl?: string }>({
    mutationFn: (input) => recruitmentApi.createReferral(input),
    onSuccess: () => {
      toast.success('Referral submitted successfully!');
      qc.invalidateQueries({ queryKey: ['recruitment', 'referrals'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'candidates'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'applications'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to submit referral.')),
  });
};

export const useUpdateReferralStatus = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string; status: any }>({
    mutationFn: ({ id, status }) => recruitmentApi.updateReferralStatus(id, status),
    onSuccess: () => {
      toast.info('Referral status updated.');
      qc.invalidateQueries({ queryKey: ['recruitment', 'referrals'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update referral.')),
  });
};

// ── Phase 2: AI Suite Hooks ──
export const useGenerateMultiChannelPosts = () =>
  useMutation<any, Error, { jobId: string; tone?: string }>({
    mutationFn: ({ jobId, tone }) => recruitmentApi.generateMultiChannelPosts(jobId, tone),
    onError: (err) => toast.error(getErrMessage(err, 'Failed to generate multi-channel posts.')),
  });

export const useParseResume = () =>
  useMutation<any, Error, { resumeText: string; rawFileName?: string }>({
    mutationFn: ({ resumeText, rawFileName }) => recruitmentApi.parseResume(resumeText, rawFileName),
    onError: (err) => toast.error(getErrMessage(err, 'Failed to parse resume.')),
  });

export const useCalculateMatchScore = () => {
  const qc = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: (applicationId) => recruitmentApi.calculateMatchScore(applicationId),
    onSuccess: () => {
      toast.success('Candidate match score calculated!');
      qc.invalidateQueries({ queryKey: ['recruitment', 'applications'] });
      qc.invalidateQueries({ queryKey: ['recruitment', 'pipeline'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to calculate match score.')),
  });
};

export const useGenerateJobDescription = () =>
  useMutation<any, Error, { title: string; department?: string; experienceLevel?: string; employmentType?: string; keySkills?: string[]; locationType?: string }>({
    mutationFn: (params) => recruitmentApi.generateJobDescription(params),
    onError: (err) => toast.error(getErrMessage(err, 'Failed to generate job description.')),
  });

// ── Phase 5: Analytics & Intelligence Hooks ──
export const useRecruitmentAnalyticsOverview = () =>
  useQuery<RecruitmentAnalyticsOverview, Error>({
    queryKey: ['recruitment', 'analytics', 'overview'],
    queryFn: () => recruitmentApi.getAnalyticsOverview(),
    staleTime: 1000 * 60 * 2,
  });

export const useFunnelAnalytics = (jobOpeningId?: string) =>
  useQuery<FunnelAnalyticsPayload, Error>({
    queryKey: ['recruitment', 'analytics', 'funnel', jobOpeningId],
    queryFn: () => recruitmentApi.getFunnelAnalytics(jobOpeningId),
    staleTime: 1000 * 60 * 2,
  });

export const useSourcingRoi = () =>
  useQuery<SourcingRoiMetric[], Error>({
    queryKey: ['recruitment', 'analytics', 'sources'],
    queryFn: () => recruitmentApi.getSourcingRoi(),
    staleTime: 1000 * 60 * 2,
  });

export const useVelocityMetrics = () =>
  useQuery<VelocityMetric[], Error>({
    queryKey: ['recruitment', 'analytics', 'velocity'],
    queryFn: () => recruitmentApi.getVelocityMetrics(),
    staleTime: 1000 * 60 * 2,
  });

export const useEeoDemographics = () =>
  useQuery<EeoDemographicsSummary, Error>({
    queryKey: ['recruitment', 'compliance', 'eeo'],
    queryFn: () => recruitmentApi.getEeoDemographics(),
    staleTime: 1000 * 60 * 5,
  });

export const useAdverseImpactAnalysis = () =>
  useQuery<AdverseImpactResult, Error>({
    queryKey: ['recruitment', 'compliance', 'adverse-impact'],
    queryFn: () => recruitmentApi.getAdverseImpactAnalysis(),
    staleTime: 1000 * 60 * 5,
  });

export const useSemanticSearchCandidates = () => {
  return useMutation<
    { success: boolean; count: number; candidates: any[] },
    Error,
    { query: string; minRating?: number; silverMedalistsOnly?: boolean }
  >({
    mutationFn: ({ query, minRating, silverMedalistsOnly }) =>
      recruitmentApi.semanticSearchCandidates(query, { minRating, silverMedalistsOnly }),
    onError: (err) => toast.error(getErrMessage(err, 'Failed to perform semantic search.')),
  });
};

export const useSilverMedalists = (jobId: string | null) =>
  useQuery<{ success: boolean; medalists: any[] }, Error>({
    queryKey: ['recruitment', 'jobs', jobId, 'silver-medalists'],
    queryFn: () => recruitmentApi.getSilverMedalists(jobId!),
    enabled: Boolean(jobId),
  });

export const useRecruiterCopilot = () => {
  return useMutation<
    { success: boolean; provider: string; synthesis: RecruiterCopilotSynthesis },
    Error,
    {
      action?: 'summarize_dossier' | 'compare_candidates' | 'briefing_notes';
      candidateId?: string;
      candidateIds?: string[];
      jobOpeningId?: string;
      notes?: string;
    }
  >({
    mutationFn: (payload) => recruitmentApi.synthesizeCopilot(payload),
    onError: (err) => toast.error(getErrMessage(err, 'Recruiter Copilot synthesis failed.')),
  });
};

