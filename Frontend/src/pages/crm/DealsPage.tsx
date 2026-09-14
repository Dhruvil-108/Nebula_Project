import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import {
  Handshake,
  Search,
  RefreshCw,
  Trash2,
  Loader2,
  ArrowUpDown,
  CalendarDays,
  X,
  Building2,
  Percent,
} from 'lucide-react';
import {
  useDeals,
  useCreateDeal,
  useDeleteDeal,
  useCompanies,
} from '../../hooks/useCrm';
import { crmApi, stageOrder } from '../../lib/crmApi';
import { Drawer } from '../../components/crm/Drawer';
import { ActivityTimeline } from '../../components/crm/ActivityTimeline';
import { StagePill } from '../../components/crm/StagePill';
import { InfoTile } from '../../components/crm/InfoTile';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import {
  PIPELINE_STAGES,
  STAGE_LABELS,
  type Deal,
  type PipelineStage,
} from '../../types/crm';

type SortKey = 'amount' | 'expectedCloseDate';

export const DealsPage: React.FC = () => {
  const { can } = useModuleAccess('crm');
  const canCreate = can('create');
  const canDelete = can('delete');

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('amount');
  const [sortAsc, setSortAsc] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [form, setForm] = useState({
    dealName: '',
    companyId: '',
    contactId: '',
    amount: '',
    probability: '50',
    expectedCloseDate: '',
    stage: 'new' as PipelineStage,
  });

  const { data: deals, isLoading } = useDeals({ search: search || undefined });
  const { data: companies } = useCompanies();

  // Contacts select depends on the chosen company
  const { data: allContacts } = useQuery({
    queryKey: ['crm', 'contacts', 'options'],
    queryFn: () => crmApi.getContacts(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: dealDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['crm', 'deal', selectedDealId],
    queryFn: () => crmApi.getDeal(selectedDealId!),
    enabled: !!selectedDealId,
  });

  const createMutation = useCreateDeal();
  const deleteMutation = useDeleteDeal();

  const sortedDeals = useMemo(() => {
    const list = [...(deals || [])];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'amount') {
        cmp = (a.amount || 0) - (b.amount || 0);
      } else {
        const av = a.expectedCloseDate ? new Date(a.expectedCloseDate).getTime() : 0;
        const bv = b.expectedCloseDate ? new Date(b.expectedCloseDate).getTime() : 0;
        cmp = av - bv;
      }
      // Secondary sort by pipeline order for stable ties
      if (cmp === 0) cmp = stageOrder(a.stage) - stageOrder(b.stage);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [deals, sortKey, sortAsc]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.dealName.trim() || !form.amount) return;
    createMutation.mutate(
      {
        dealName: form.dealName,
        companyId: form.companyId || null,
        contactId: form.contactId || null,
        amount: Number(form.amount),
        probability: Number(form.probability) || 0,
        expectedCloseDate: form.expectedCloseDate || null,
        stage: form.stage,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setForm({ dealName: '', companyId: '', contactId: '', amount: '', probability: '50', expectedCloseDate: '', stage: 'new' });
        },
      }
    );
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((a) => !a);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const inputCls =
    'w-full rounded-lg border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#C2540C]/25 focus:border-[#C2540C] transition-all';

  return (
    <div className="crm-submodule-page p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Deals</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {isLoading
              ? 'Loading deals…'
              : `${deals?.length ?? 0} deal${(deals?.length ?? 0) === 1 ? '' : 's'} · $${(deals || []).reduce((s, d) => s + (d.amount || 0), 0).toLocaleString()} total value`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBEAE0] border border-[#ECE0D6] transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#C2540C] hover:bg-[#D06B28] text-white shadow-md shadow-[#C2540C]/20 transition-colors"
            >
              <Handshake className="w-4 h-4" />
              Add Deal
            </button>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#9B9B9B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search deal name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className={`${inputCls} sm:w-44`}>
          <option value="">All stages</option>
          {PIPELINE_STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3 font-semibold">Deal</th>
                <th className="px-5 py-3 font-semibold">Company</th>
                <th
                  className="px-5 py-3 font-semibold cursor-pointer select-none hover:text-[#C2540C]"
                  onClick={() => toggleSort('amount')}
                >
                  <span className="inline-flex items-center gap-1">
                    Amount
                    <ArrowUpDown className={sortKey === 'amount' ? 'w-3 h-3 text-[#C2540C]' : 'w-3 h-3 opacity-40'} />
                  </span>
                </th>
                <th className="px-5 py-3 font-semibold">Stage</th>
                <th className="px-5 py-3 font-semibold">Probability</th>
                <th
                  className="px-5 py-3 font-semibold cursor-pointer select-none hover:text-[#C2540C]"
                  onClick={() => toggleSort('expectedCloseDate')}
                >
                  <span className="inline-flex items-center gap-1">
                    Close date
                    <ArrowUpDown
                      className={sortKey === 'expectedCloseDate' ? 'w-3 h-3 text-[#C2540C]' : 'w-3 h-3 opacity-40'}
                    />
                  </span>
                </th>
                <th className="px-5 py-3 font-semibold">Salesperson</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-5 py-4">
                      <div className="h-5 rounded bg-[#FBEAE0] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : sortedDeals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center">
                    <Handshake className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#1A1A1A]">No deals found</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">
                      {search || stageFilter ? 'Try adjusting your filters.' : 'Convert a lead or add a deal directly.'}
                    </p>
                  </td>
                </tr>
              ) : (
                sortedDeals
                  .filter((d) => !stageFilter || d.stage === stageFilter)
                  .map((deal, idx) => (
                    <motion.tr
                      key={deal._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.3), duration: 0.25 }}
                      className="hover:bg-[#FBF8F4] cursor-pointer transition-colors"
                      onClick={() => setSelectedDealId(deal._id)}
                    >
                      <td className="px-5 py-3.5 font-medium text-[#1A1A1A]">{deal.dealName}</td>
                      <td className="px-5 py-3.5 text-[#6B6B6B]">{deal.companyId?.name || '—'}</td>
                      <td className="px-5 py-3.5 font-semibold text-[#C2540C] font-mono">
                        ${deal.amount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <StagePill stage={deal.stage} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 text-xs text-[#6B6B6B]">
                          <Percent className="w-3 h-3" />
                          {deal.probability}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#6B6B6B] font-mono">
                        {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-[#6B6B6B]">{deal.salesperson?.fullName || 'Unassigned'}</td>
                      <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => deleteMutation.mutate(deal._id)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors disabled:opacity-50"
                            title="Delete deal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {canCreate && showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setShowCreate(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-lg rounded-2xl bg-white border border-[#ECE0D6] shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECE0D6]">
              <h3 className="text-base font-semibold text-[#1A1A1A]">Add Deal</h3>
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
                  Deal name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  required
                  value={form.dealName}
                  onChange={(e) => setForm({ ...form, dealName: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Acme Corp — Annual Platform License"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Company</label>
                  <select
                    value={form.companyId}
                    onChange={(e) => setForm({ ...form, companyId: e.target.value, contactId: '' })}
                    className={inputCls}
                  >
                    <option value="">No company</option>
                    {(companies || []).map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Contact</label>
                  <select
                    value={form.contactId}
                    onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">No contact</option>
                    {(allContacts || [])
                      .filter((ct) => !form.companyId || ct.companyId?._id === form.companyId)
                      .map((ct) => (
                        <option key={ct._id} value={ct._id}>
                          {ct.fullName}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                    Amount (USD) <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className={inputCls}
                    placeholder="25000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Probability (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.probability}
                    onChange={(e) => setForm({ ...form, probability: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Expected close date</label>
                  <input
                    type="date"
                    value={form.expectedCloseDate}
                    onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Stage</label>
                  <select
                    value={form.stage}
                    onChange={(e) => setForm({ ...form, stage: e.target.value as PipelineStage })}
                    className={inputCls}
                  >
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s} value={s}>
                        {STAGE_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
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
                  disabled={createMutation.isPending || !form.dealName.trim() || !form.amount}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#C2540C] hover:bg-[#D06B28] text-white transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Deal
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Detail drawer */}
      <Drawer
        open={!!selectedDealId}
        onClose={() => setSelectedDealId(null)}
        title={dealDetail?.dealName || 'Deal'}
        subtitle={dealDetail ? [dealDetail.companyId?.name, `$${dealDetail.amount.toLocaleString()}`].filter(Boolean).join(' · ') : undefined}
      >
        {detailLoading || !dealDetail ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 rounded-xl bg-[#FBEAE0]" />
            <div className="h-32 rounded-xl bg-[#FBEAE0]" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <InfoTile
                icon={<Building2 className="w-3.5 h-3.5" />}
                label="Company"
                value={dealDetail.companyId?.name || '—'}
              />
              <InfoTile
                icon={<Handshake className="w-3.5 h-3.5" />}
                label="Contact"
                value={dealDetail.contactId?.fullName || '—'}
              />
              <InfoTile
                icon={<CalendarDays className="w-3.5 h-3.5" />}
                label="Expected close"
                value={
                  dealDetail.expectedCloseDate
                    ? new Date(dealDetail.expectedCloseDate).toLocaleDateString()
                    : '—'
                }
              />
              <InfoTile
                icon={<Percent className="w-3.5 h-3.5" />}
                label="Probability"
                value={`${dealDetail.probability}%`}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl bg-[#FBEAE0] border border-[#F0D3BC] p-4">
              <div>
                <p className="text-[10px] font-semibold text-[#7A2F05] uppercase tracking-wider">Amount</p>
                <p className="text-xl font-bold text-[#C2540C] font-mono">
                  ${dealDetail.amount.toLocaleString()}
                </p>
              </div>
              <StagePill stage={dealDetail.stage} />
            </div>

            {dealDetail.salesperson && (
              <p className="text-xs text-[#6B6B6B]">
                Salesperson: <span className="font-medium text-[#1A1A1A]">{dealDetail.salesperson.fullName}</span>
              </p>
            )}

            <ActivityTimeline
              relatedToType="deal"
              relatedToId={dealDetail._id}
              activities={dealDetail.activities}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default DealsPage;
