import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { crmApi } from '../lib/crmApi';
import type {
  ActivityInput,
  CompanyInput,
  ContactInput,
  Deal,
  DealInput,
  DealPipeline,
  Lead,
  LeadInput,
  PipelineStage,
} from '../types/crm';

// Shared query keys
export const crmKeys = {
  leads: ['crm', 'leads'] as const,
  lead: (id: string) => ['crm', 'lead', id] as const,
  contacts: ['crm', 'contacts'] as const,
  contact: (id: string) => ['crm', 'contact', id] as const,
  companies: ['crm', 'companies'] as const,
  company: (id: string) => ['crm', 'company', id] as const,
  pipeline: ['crm', 'pipeline'] as const,
  deals: ['crm', 'deals'] as const,
  deal: (id: string) => ['crm', 'deal', id] as const,
  summary: ['crm', 'summary'] as const,
};

const getErrMessage = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { error?: string } }; message?: string };
  return e?.response?.data?.error || e?.message || fallback;
};

// ─────────────────────────────────────────────────────────
// Leads
// ─────────────────────────────────────────────────────────
export const useLeads = (params: { status?: string; owner?: string; source?: string; search?: string } = {}) =>
  useQuery<Lead[], Error>({
    queryKey: [...crmKeys.leads, params],
    queryFn: () => crmApi.getLeads(params),
  });

export const useLead = (id: string | null) =>
  useQuery<Lead, Error>({
    queryKey: crmKeys.lead(id || ''),
    queryFn: () => crmApi.getLead(id as string),
    enabled: !!id,
  });

export const useCreateLead = () => {
  const qc = useQueryClient();
  return useMutation<Lead, Error, LeadInput>({
    mutationFn: (input) => crmApi.createLead(input),
    onSuccess: (lead) => {
      toast.success(`Lead "${lead.leadName}" created.`);
      qc.invalidateQueries({ queryKey: crmKeys.leads });
      qc.invalidateQueries({ queryKey: crmKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create lead.')),
  });
};

export const useUpdateLead = () => {
  const qc = useQueryClient();
  return useMutation<Lead, Error, { id: string; patch: Partial<LeadInput> }>({
    mutationFn: ({ id, patch }) => crmApi.updateLead(id, patch),
    onSuccess: (lead) => {
      qc.invalidateQueries({ queryKey: crmKeys.leads });
      qc.invalidateQueries({ queryKey: crmKeys.lead(lead._id) });
      qc.invalidateQueries({ queryKey: crmKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update lead.')),
  });
};

export const useDeleteLead = () => {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => crmApi.deleteLead(id),
    onSuccess: () => {
      toast.info('Lead deleted.');
      qc.invalidateQueries({ queryKey: crmKeys.leads });
      qc.invalidateQueries({ queryKey: crmKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to delete lead.')),
  });
};

export const useConvertLead = () => {
  const qc = useQueryClient();
  return useMutation<
    { message: string; contact: { _id: string }; deal: { _id: string } },
    Error,
    { id: string; dealAmount?: number }
  >({
    mutationFn: ({ id, dealAmount }) => crmApi.convertLead(id, dealAmount),
    onSuccess: () => {
      toast.success('Lead converted to Contact + Deal.');
      qc.invalidateQueries({ queryKey: crmKeys.leads });
      qc.invalidateQueries({ queryKey: crmKeys.contacts });
      qc.invalidateQueries({ queryKey: crmKeys.companies });
      qc.invalidateQueries({ queryKey: crmKeys.pipeline });
      qc.invalidateQueries({ queryKey: crmKeys.deals });
      qc.invalidateQueries({ queryKey: crmKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Lead conversion failed.')),
  });
};

// ─────────────────────────────────────────────────────────
// Contacts
// ─────────────────────────────────────────────────────────
export const useContacts = (params: { search?: string; companyId?: string } = {}) =>
  useQuery<Awaited<ReturnType<typeof crmApi.getContacts>>, Error>({
    queryKey: [...crmKeys.contacts, params],
    queryFn: () => crmApi.getContacts(params),
  });

export const useContact = (id: string | null) =>
  useQuery<Awaited<ReturnType<typeof crmApi.getContact>>, Error>({
    queryKey: crmKeys.contact(id || ''),
    queryFn: () => crmApi.getContact(id as string),
    enabled: !!id,
  });

export const useCreateContact = () => {
  const qc = useQueryClient();
  return useMutation<Awaited<ReturnType<typeof crmApi.createContact>>, Error, ContactInput>({
    mutationFn: (input) => crmApi.createContact(input),
    onSuccess: (contact) => {
      toast.success(`Contact "${contact.fullName}" created.`);
      qc.invalidateQueries({ queryKey: crmKeys.contacts });
      qc.invalidateQueries({ queryKey: crmKeys.companies });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create contact.')),
  });
};

export const useUpdateContact = () => {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof crmApi.updateContact>>,
    Error,
    { id: string; patch: Partial<ContactInput> }
  >({
    mutationFn: ({ id, patch }) => crmApi.updateContact(id, patch),
    onSuccess: (contact) => {
      qc.invalidateQueries({ queryKey: crmKeys.contacts });
      qc.invalidateQueries({ queryKey: crmKeys.contact(contact._id) });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update contact.')),
  });
};

export const useDeleteContact = () => {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => crmApi.deleteContact(id),
    onSuccess: () => {
      toast.info('Contact deleted.');
      qc.invalidateQueries({ queryKey: crmKeys.contacts });
      qc.invalidateQueries({ queryKey: crmKeys.companies });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to delete contact.')),
  });
};

// ─────────────────────────────────────────────────────────
// Companies
// ─────────────────────────────────────────────────────────
export const useCompanies = (params: { search?: string } = {}) =>
  useQuery<Awaited<ReturnType<typeof crmApi.getCompanies>>, Error>({
    queryKey: [...crmKeys.companies, params],
    queryFn: () => crmApi.getCompanies(params),
  });

export const useCompany = (id: string | null) =>
  useQuery<Awaited<ReturnType<typeof crmApi.getCompany>>, Error>({
    queryKey: crmKeys.company(id || ''),
    queryFn: () => crmApi.getCompany(id as string),
    enabled: !!id,
  });

export const useCreateCompany = () => {
  const qc = useQueryClient();
  return useMutation<Awaited<ReturnType<typeof crmApi.createCompany>>, Error, CompanyInput>({
    mutationFn: (input) => crmApi.createCompany(input),
    onSuccess: (company) => {
      toast.success(`Company "${company.name}" created.`);
      qc.invalidateQueries({ queryKey: crmKeys.companies });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create company.')),
  });
};

export const useUpdateCompany = () => {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof crmApi.updateCompany>>,
    Error,
    { id: string; patch: Partial<CompanyInput> }
  >({
    mutationFn: ({ id, patch }) => crmApi.updateCompany(id, patch),
    onSuccess: (company) => {
      qc.invalidateQueries({ queryKey: crmKeys.companies });
      qc.invalidateQueries({ queryKey: crmKeys.company(company._id) });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update company.')),
  });
};

export const useDeleteCompany = () => {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => crmApi.deleteCompany(id),
    onSuccess: () => {
      toast.info('Company deleted.');
      qc.invalidateQueries({ queryKey: crmKeys.companies });
      qc.invalidateQueries({ queryKey: crmKeys.contacts });
      qc.invalidateQueries({ queryKey: crmKeys.deals });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to delete company.')),
  });
};

// ─────────────────────────────────────────────────────────
// Deals + Pipeline
// ─────────────────────────────────────────────────────────
export const usePipeline = () =>
  useQuery<DealPipeline, Error>({
    queryKey: crmKeys.pipeline,
    queryFn: () => crmApi.getPipeline(),
  });

export const useDeals = (params: { stage?: string; salesperson?: string; search?: string } = {}) =>
  useQuery<Awaited<ReturnType<typeof crmApi.getDeals>>, Error>({
    queryKey: [...crmKeys.deals, params],
    queryFn: () => crmApi.getDeals(params),
  });

export const useDeal = (id: string | null) =>
  useQuery<Awaited<ReturnType<typeof crmApi.getDeal>>, Error>({
    queryKey: crmKeys.deal(id || ''),
    queryFn: () => crmApi.getDeal(id as string),
    enabled: !!id,
  });

export const useCreateDeal = () => {
  const qc = useQueryClient();
  return useMutation<Awaited<ReturnType<typeof crmApi.createDeal>>, Error, DealInput>({
    mutationFn: (input) => crmApi.createDeal(input),
    onSuccess: (deal) => {
      toast.success(`Deal "${deal.dealName}" created.`);
      qc.invalidateQueries({ queryKey: crmKeys.pipeline });
      qc.invalidateQueries({ queryKey: crmKeys.deals });
      qc.invalidateQueries({ queryKey: crmKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to create deal.')),
  });
};

/**
 * Stage-move mutation with optimistic pipeline update.
 * Used by the Kanban board drag-and-drop.
 */
export const useMoveDealStage = () => {
  const qc = useQueryClient();

  return useMutation<
    Deal,
    Error,
    { dealId: string; fromStage: PipelineStage; toStage: PipelineStage },
    { previousPipeline?: DealPipeline }
  >({
    mutationFn: ({ dealId, toStage }) => crmApi.updateDeal(dealId, { stage: toStage }),

    // Optimistically relocate the card between columns
    onMutate: async ({ dealId, fromStage, toStage }) => {
      await qc.cancelQueries({ queryKey: crmKeys.pipeline });

      const previousPipeline = qc.getQueryData<DealPipeline>(crmKeys.pipeline);

      if (previousPipeline) {
        const next: DealPipeline = { ...previousPipeline };
        const deal = (next[fromStage] || []).find((d) => d._id === dealId);
        if (deal) {
          next[fromStage] = next[fromStage].filter((d) => d._id !== dealId);
          next[toStage] = [...(next[toStage] || []), { ...deal, stage: toStage }];
          qc.setQueryData<DealPipeline>(crmKeys.pipeline, next);
        }
      }

      return { previousPipeline };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousPipeline) {
        qc.setQueryData(crmKeys.pipeline, context.previousPipeline);
      }
      toast.error(getErrMessage(_err, 'Failed to move deal.'));
    },

    onSuccess: (deal) => {
      qc.invalidateQueries({ queryKey: crmKeys.pipeline });
      qc.invalidateQueries({ queryKey: crmKeys.deals });
      qc.invalidateQueries({ queryKey: crmKeys.summary });
      if (deal.stage === 'won' || deal.stage === 'lost') {
        toast.success(`Deal marked ${deal.stage}.`);
      }
    },
  });
};

export const useUpdateDeal = () => {
  const qc = useQueryClient();
  return useMutation<Awaited<ReturnType<typeof crmApi.updateDeal>>, Error, { id: string; patch: Partial<DealInput> }>({
    mutationFn: ({ id, patch }) => crmApi.updateDeal(id, patch),
    onSuccess: (deal) => {
      qc.invalidateQueries({ queryKey: crmKeys.pipeline });
      qc.invalidateQueries({ queryKey: crmKeys.deals });
      qc.invalidateQueries({ queryKey: crmKeys.deal(deal._id) });
      qc.invalidateQueries({ queryKey: crmKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update deal.')),
  });
};

export const useDeleteDeal = () => {
  const qc = useQueryClient();
  return useMutation<{ message: string }, Error, string>({
    mutationFn: (id) => crmApi.deleteDeal(id),
    onSuccess: () => {
      toast.info('Deal deleted.');
      qc.invalidateQueries({ queryKey: crmKeys.pipeline });
      qc.invalidateQueries({ queryKey: crmKeys.deals });
      qc.invalidateQueries({ queryKey: crmKeys.summary });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to delete deal.')),
  });
};

// ─────────────────────────────────────────────────────────
// Activities
// ─────────────────────────────────────────────────────────
export const useLogActivity = () => {
  const qc = useQueryClient();
  return useMutation<Awaited<ReturnType<typeof crmApi.createActivity>>, Error, ActivityInput>({
    mutationFn: (input) => crmApi.createActivity(input),
    onSuccess: (activity) => {
      toast.success(`${activity.type.charAt(0).toUpperCase()}${activity.type.slice(1)} logged.`);
      // Invalidate every detail view — timelines are embedded in detail payloads
      qc.invalidateQueries({ queryKey: ['crm'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to log activity.')),
  });
};

export const useUpdateActivity = () => {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof crmApi.updateActivity>>,
    Error,
    { id: string; patch: { completedAt?: string | null; content?: string; dueDate?: string | null } }
  >({
    mutationFn: ({ id, patch }) => crmApi.updateActivity(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update activity.')),
  });
};

// ─────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────
export const useCrmSummary = () =>
  useQuery<Awaited<ReturnType<typeof crmApi.getSummary>>, Error>({
    queryKey: crmKeys.summary,
    queryFn: () => crmApi.getSummary(),
    staleTime: 1000 * 60,
  });
