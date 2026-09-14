// ─────────────────────────────────────────────────────────
// CRM domain types — mirror the API shapes exactly
// ─────────────────────────────────────────────────────────

export type PipelineStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export const PIPELINE_STAGES: PipelineStage[] = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

export type LeadSource = 'website' | 'referral' | 'cold_call' | 'social' | 'event' | 'other';

export const LEAD_SOURCES: LeadSource[] = ['website', 'referral', 'cold_call', 'social', 'event', 'other'];

export const SOURCE_LABELS: Record<LeadSource, string> = {
  website: 'Website',
  referral: 'Referral',
  cold_call: 'Cold Call',
  social: 'Social',
  event: 'Event',
  other: 'Other',
};

export type ActivityType = 'note' | 'call' | 'email' | 'meeting' | 'task';

// ── Embedded user summary (populated owner/salesperson/createdBy) ──
export interface CrmUserSummary {
  _id: string;
  fullName: string;
  email: string;
  role?: string;
}

// ── Lead ──
export interface Lead {
  _id: string;
  organizationId: string;
  leadName: string;
  company: string;
  email: string;
  phone: string;
  source: LeadSource;
  industry: string;
  status: PipelineStage;
  owner: CrmUserSummary | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  /** Present only on detail endpoint */
  activities?: Activity[];
}

export interface LeadInput {
  leadName: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: LeadSource;
  industry?: string;
  status?: PipelineStage;
  owner?: string;
  notes?: string;
}

// ── Company ──
export interface Company {
  _id: string;
  organizationId: string;
  name: string;
  industry: string;
  website: string;
  phone: string;
  address: string;
  createdAt: string;
  updatedAt: string;
  /** List endpoint enrichments */
  contactCount?: number;
  dealCount?: number;
  /** Detail endpoint enrichments */
  contacts?: ContactSummary[];
  deals?: Deal[];
}

export interface CompanyInput {
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  address?: string;
}

// ── Contact ──
export interface ContactSummary {
  _id: string;
  organizationId: string;
  fullName: string;
  email: string;
  phone: string;
  companyId: Pick<Company, '_id' | 'name'> | null;
  title: string;
  owner: CrmUserSummary | null;
  createdAt: string;
  updatedAt: string;
  /** Detail endpoint enrichment */
  deals?: Deal[];
  activities?: Activity[];
}

/** Alias so page code can talk about full Contact rows uniformly */
export type Contact = ContactSummary & {
  title: string;
};

export interface ContactInput {
  fullName: string;
  email?: string;
  phone?: string;
  companyId?: string | null;
  title?: string;
  owner?: string;
}

// ── Deal ──
export interface Deal {
  _id: string;
  organizationId: string;
  dealName: string;
  companyId: Pick<Company, '_id' | 'name'> | null;
  contactId: Pick<Contact, '_id' | 'fullName'> | null;
  amount: number;
  probability: number;
  expectedCloseDate: string | null;
  stage: PipelineStage;
  salesperson: CrmUserSummary | null;
  createdAt: string;
  updatedAt: string;
  /** Detail endpoint enrichment */
  activities?: Activity[];
}

export type DealPipeline = Record<PipelineStage, Deal[]>;

export interface DealInput {
  dealName: string;
  companyId?: string | null;
  contactId?: string | null;
  amount: number;
  probability?: number;
  expectedCloseDate?: string | null;
  stage?: PipelineStage;
  salesperson?: string;
}

// ── Activity ──
export interface Activity {
  _id: string;
  organizationId: string;
  type: ActivityType;
  relatedToType: 'lead' | 'contact' | 'company' | 'deal';
  relatedToId: string;
  content: string;
  dueDate: string | null;
  completedAt: string | null;
  createdBy: CrmUserSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityInput {
  type: ActivityType;
  relatedToType: Activity['relatedToType'];
  relatedToId: string;
  content: string;
  dueDate?: string | null;
}

// ── Summary (KPI contract) ──
export interface CrmSummary {
  activeLeads: number;
  pipelineDeals: number;
  pipelineValue: number;
  wonThisMonth: number;
  wonThisMonthValue: number;
  conversionRate: number | null;
}

// ── Shared option shapes for selects ──
export interface SelectOption {
  value: string;
  label: string;
}
