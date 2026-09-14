import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import {
  UserPlus,
  Search,
  RefreshCw,
  Trash2,
  ArrowRightLeft,
  Loader2,
  Mail,
  Phone,
  Building2 as BuildingIcon,
  DollarSign,
  X,
} from 'lucide-react';
import { useLeads, useCreateLead, useDeleteLead, useConvertLead } from '../../hooks/useCrm';
import { StagePill } from '../../components/crm/StagePill';
import { Drawer } from '../../components/crm/Drawer';
import { ActivityTimeline } from '../../components/crm/ActivityTimeline';
import { InfoTile } from '../../components/crm/InfoTile';
import { crmApi } from '../../lib/crmApi';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import {
  PIPELINE_STAGES,
  STAGE_LABELS,
  LEAD_SOURCES,
  SOURCE_LABELS,
  type Lead,
  type PipelineStage,
  type LeadSource,
  type CrmUserSummary,
} from '../../types/crm';

interface OwnerOption {
  _id: string;
  fullName: string;
  email?: string;
  role?: string;
}

const initialForm = {
  leadName: '',
  company: '',
  email: '',
  phone: '',
  source: 'other' as LeadSource,
  industry: '',
  status: 'new' as PipelineStage,
  owner: '',
  notes: '',
};

export const LeadsPage: React.FC = () => {
  const { can } = useModuleAccess('crm');
  const canCreate = can('create');
  const canEdit = can('edit');
  const canDelete = can('delete');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  // Owner dropdown options — org user list
  const { data: owners } = useQuery<OwnerOption[]>({
    queryKey: ['crm', 'owners'],
    queryFn: async () => {
      const res = await apiClient.get<{ users: OwnerOption[] }>('/users');
      return res.data.users;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: leads, isLoading, isError, refetch } = useLeads({
    search: search || undefined,
    status: statusFilter || undefined,
    owner: ownerFilter || undefined,
  });

  const { data: leadDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['crm', 'lead', selectedLeadId],
    queryFn: () => crmApi.getLead(selectedLeadId!),
    enabled: !!selectedLeadId,
  });

  const createMutation = useCreateLead();
  const deleteMutation = useDeleteLead();
  const convertMutation = useConvertLead();

  const ownerName = (owner: Lead['owner']) => owner?.fullName || 'Unassigned';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leadName.trim()) return;
    createMutation.mutate(
      {
        leadName: form.leadName,
        company: form.company,
        email: form.email,
        phone: form.phone,
        source: form.source,
        industry: form.industry,
        status: form.status,
        owner: form.owner || undefined,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setForm(initialForm);
        },
      }
    );
  };

  const handleConvert = (lead: Lead) => {
    const amountStr = window.prompt(
      `Convert "${lead.leadName}" to Contact + Deal.\nEnter the opening deal amount (USD):`,
      '0'
    );
    if (amountStr === null) return;
    const amount = Number(amountStr) || 0;
    convertMutation.mutate({ id: lead._id, dealAmount: amount });
    setSelectedLeadId(null);
  };

  const inputCls =
    'w-full rounded-lg border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#C2540C]/25 focus:border-[#C2540C] transition-all';

  return (
    <div className="crm-submodule-page p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Leads</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {isLoading
              ? 'Loading leads...'
              : isError
                ? 'Unable to load leads'
                : `${leads?.length ?? 0} lead${(leads?.length ?? 0) === 1 ? '' : 's'} in your workspace`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBEAE0] border border-[#ECE0D6] transition-colors"
            title="Refresh leads"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#C2540C] hover:bg-[#D06B28] text-white shadow-md shadow-[#C2540C]/20 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Lead
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Filter bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#9B9B9B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, company, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputCls} sm:w-44`}>
          <option value="">All statuses</option>
          {PIPELINE_STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
        <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className={`${inputCls} sm:w-48`}>
          <option value="">All owners</option>
          {(owners || []).map((o) => (
            <option key={o._id} value={o._id}>
              {o.fullName}
            </option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Company</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Source</th>
                <th className="px-5 py-3 font-semibold">Owner</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-5 rounded bg-[#FBEAE0] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <p className="text-sm font-medium text-[#1A1A1A]">Leads could not be loaded</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">Check your connection and try again.</p>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#C2540C] border border-[#ECE0D6] hover:bg-[#FBEAE0]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry
                    </button>
                  </td>
                </tr>
              ) : (leads || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <UserPlus className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#1A1A1A]">No leads found</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">
                      {search || statusFilter || ownerFilter
                        ? 'Try adjusting your filters.'
                        : 'Add your first lead to start building your pipeline.'}
                    </p>
                  </td>
                </tr>
              ) : (
                (leads || []).map((lead, idx) => (
                  <motion.tr
                    key={lead._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.3), duration: 0.25 }}
                    className="hover:bg-[#FBF8F4] cursor-pointer transition-colors"
                    onClick={() => setSelectedLeadId(lead._id)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-[#1A1A1A]">{lead.leadName}</div>
                      {lead.email && <div className="text-xs text-[#6B6B6B]">{lead.email}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-[#1A1A1A]">{lead.company || '—'}</td>
                    <td className="px-5 py-3.5">
                      <StagePill stage={lead.status} />
                    </td>
                    <td className="px-5 py-3.5 text-[#6B6B6B]">{SOURCE_LABELS[lead.source]}</td>
                    <td className="px-5 py-3.5 text-[#6B6B6B]">{ownerName(lead.owner)}</td>
                    <td className="px-5 py-3.5 text-xs text-[#6B6B6B] font-mono">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        {canEdit && lead.status !== 'won' && lead.status !== 'lost' && (
                          <button
                            type="button"
                            onClick={() => handleConvert(lead)}
                            disabled={convertMutation.isPending}
                            className="p-1.5 rounded-lg text-[#C2540C] hover:bg-[#FBEAE0] transition-colors disabled:opacity-50"
                            title="Convert to Deal"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => deleteMutation.mutate(lead._id)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors disabled:opacity-50"
                            title="Delete lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create modal ── */}
      {canCreate && showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setShowCreate(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-lg rounded-2xl bg-white border border-[#ECE0D6] shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECE0D6]">
              <h3 className="text-base font-semibold text-[#1A1A1A]">Add Lead</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="p-1.5 rounded-lg text-[#6B6B6B] hover:bg-[#FBEAE0] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                  Lead name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  required
                  value={form.leadName}
                  onChange={(e) => setForm({ ...form, leadName: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Sarah Chen"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Company</label>
                  <input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Industry</label>
                  <input
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. SaaS"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputCls}
                    placeholder="sarah@acme.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={inputCls}
                    placeholder="+1 555 000 1234"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Source</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value as LeadSource })}
                    className={inputCls}
                  >
                    {LEAD_SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {SOURCE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Owner</label>
                  <select
                    value={form.owner}
                    onChange={(e) => setForm({ ...form, owner: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Me (default)</option>
                    {(owners || []).map((o) => (
                      <option key={o._id} value={o._id}>
                        {o.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={`${inputCls} resize-none`}
                  placeholder="Context, pain points, next steps…"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#ECE0D6] hover:bg-[#FBEAE0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !form.leadName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#C2540C] hover:bg-[#D06B28] text-white transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Lead
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── Detail drawer ── */}
      <Drawer
        open={!!selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        title={leadDetail?.leadName || 'Lead'}
        subtitle={leadDetail ? [leadDetail.company, leadDetail.email].filter(Boolean).join(' · ') : undefined}
      >
        {detailLoading || !leadDetail ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 rounded-xl bg-[#FBEAE0]" />
            <div className="h-32 rounded-xl bg-[#FBEAE0]" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <InfoTile icon={<BuildingIcon className="w-3.5 h-3.5" />} label="Company" value={leadDetail.company || '—'} />
              <InfoTile icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={leadDetail.email || '—'} />
              <InfoTile icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={leadDetail.phone || '—'} />
              <InfoTile icon={<UserPlus className="w-3.5 h-3.5" />} label="Owner" value={ownerName(leadDetail.owner)} />
            </div>

            <div className="flex items-center gap-2">
              <StagePill stage={leadDetail.status} />
              <span className="text-xs text-[#6B6B6B]">Source: {SOURCE_LABELS[leadDetail.source]}</span>
            </div>

            {leadDetail.notes && (
              <div className="rounded-xl bg-[#FBEAE0] border border-[#F0D3BC] p-3">
                <p className="text-xs font-semibold text-[#7A2F05] mb-1">Notes</p>
                <p className="text-xs text-[#1A1A1A] whitespace-pre-wrap">{leadDetail.notes}</p>
              </div>
            )}

            {/* Convert CTA */}
            {canEdit && leadDetail.status !== 'won' && leadDetail.status !== 'lost' && (
              <button
                type="button"
                onClick={() => handleConvert(leadDetail)}
                disabled={convertMutation.isPending}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#C2540C] hover:bg-[#D06B28] text-white transition-colors disabled:opacity-50"
              >
                {convertMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <DollarSign className="w-4 h-4" />
                )}
                Convert to Deal
              </button>
            )}

            {/* Timeline */}
            <ActivityTimeline
              relatedToType="lead"
              relatedToId={leadDetail._id}
              activities={leadDetail.activities}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default LeadsPage;
