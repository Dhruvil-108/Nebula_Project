import { apiClient } from '../lib/apiClient';
import type {
  Activity,
  ActivityInput,
  Company,
  CompanyInput,
  Contact,
  ContactInput,
  Deal,
  DealPipeline,
  DealInput,
  Lead,
  LeadInput,
  PipelineStage,
  CrmSummary,
} from '../types/crm';

// ─────────────────────────────────────────────────────────
// Leads
// ─────────────────────────────────────────────────────────
export const crmApi = {
  getLeads: async (params: { status?: string; owner?: string; source?: string; search?: string } = {}) => {
    const res = await apiClient.get<Lead[]>('/crm/leads', { params });
    return res.data;
  },

  getLead: async (id: string) => {
    const res = await apiClient.get<Lead>(`/crm/leads/${id}`);
    return res.data;
  },

  createLead: async (input: LeadInput) => {
    const res = await apiClient.post<Lead>('/crm/leads', input);
    return res.data;
  },

  updateLead: async (id: string, patch: Partial<LeadInput>) => {
    const res = await apiClient.patch<Lead>(`/crm/leads/${id}`, patch);
    return res.data;
  },

  deleteLead: async (id: string) => {
    const res = await apiClient.delete<{ message: string }>(`/crm/leads/${id}`);
    return res.data;
  },

  convertLead: async (id: string, dealAmount?: number) => {
    const res = await apiClient.post<{ message: string; contact: Contact; deal: Deal; lead: Lead }>(
      `/crm/leads/${id}/convert`,
      { dealAmount }
    );
    return res.data;
  },

  // ── Contacts ──
  getContacts: async (params: { search?: string; companyId?: string } = {}) => {
    const res = await apiClient.get<Contact[]>('/crm/contacts', { params });
    return res.data;
  },

  getContact: async (id: string) => {
    const res = await apiClient.get<Contact>(`/crm/contacts/${id}`);
    return res.data;
  },

  createContact: async (input: ContactInput) => {
    const res = await apiClient.post<Contact>('/crm/contacts', input);
    return res.data;
  },

  updateContact: async (id: string, patch: Partial<ContactInput>) => {
    const res = await apiClient.patch<Contact>(`/crm/contacts/${id}`, patch);
    return res.data;
  },

  deleteContact: async (id: string) => {
    const res = await apiClient.delete<{ message: string }>(`/crm/contacts/${id}`);
    return res.data;
  },

  // ── Companies ──
  getCompanies: async (params: { search?: string } = {}) => {
    const res = await apiClient.get<Company[]>('/crm/companies', { params });
    return res.data;
  },

  getCompany: async (id: string) => {
    const res = await apiClient.get<Company>(`/crm/companies/${id}`);
    return res.data;
  },

  createCompany: async (input: CompanyInput) => {
    const res = await apiClient.post<Company>('/crm/companies', input);
    return res.data;
  },

  updateCompany: async (id: string, patch: Partial<CompanyInput>) => {
    const res = await apiClient.patch<Company>(`/crm/companies/${id}`, patch);
    return res.data;
  },

  deleteCompany: async (id: string) => {
    const res = await apiClient.delete<{ message: string }>(`/crm/companies/${id}`);
    return res.data;
  },

  // ── Deals ──
  getDeals: async (params: { stage?: string; salesperson?: string; search?: string } = {}) => {
    const res = await apiClient.get<Deal[]>('/crm/deals', { params });
    return res.data;
  },

  getPipeline: async () => {
    const res = await apiClient.get<DealPipeline>('/crm/deals/pipeline');
    return res.data;
  },

  getDeal: async (id: string) => {
    const res = await apiClient.get<Deal>(`/crm/deals/${id}`);
    return res.data;
  },

  createDeal: async (input: DealInput) => {
    const res = await apiClient.post<Deal>('/crm/deals', input);
    return res.data;
  },

  updateDeal: async (id: string, patch: Partial<DealInput>) => {
    const res = await apiClient.patch<Deal>(`/crm/deals/${id}`, patch);
    return res.data;
  },

  deleteDeal: async (id: string) => {
    const res = await apiClient.delete<{ message: string }>(`/crm/deals/${id}`);
    return res.data;
  },

  // ── Activities ──
  getActivities: async (relatedToType: string, relatedToId: string) => {
    const res = await apiClient.get<Activity[]>('/crm/activities', {
      params: { relatedToType, relatedToId },
    });
    return res.data;
  },

  createActivity: async (input: ActivityInput) => {
    const res = await apiClient.post<Activity>('/crm/activities', input);
    return res.data;
  },

  updateActivity: async (id: string, patch: { completedAt?: string | null; content?: string; dueDate?: string | null }) => {
    const res = await apiClient.patch<Activity>(`/crm/activities/${id}`, patch);
    return res.data;
  },

  // ── Summary ──
  getSummary: async () => {
    const res = await apiClient.get<CrmSummary>('/crm/summary');
    return res.data;
  },
};

// Stage ordering helper used by the Kanban board and table sorting
export const stageOrder = (stage: PipelineStage): number => {
  const order: PipelineStage[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
  return order.indexOf(stage);
};
