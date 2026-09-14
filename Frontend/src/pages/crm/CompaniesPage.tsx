import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Search,
  RefreshCw,
  Trash2,
  Loader2,
  Globe,
  Phone,
  MapPin,
  X,
  Users,
  Handshake,
} from 'lucide-react';
import { useCompanies, useCreateCompany, useDeleteCompany, useCompany } from '../../hooks/useCrm';
import { Drawer } from '../../components/crm/Drawer';
import { InfoTile } from '../../components/crm/InfoTile';
import { StagePill } from '../../components/crm/StagePill';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import type { Company } from '../../types/crm';

const initialForm = { name: '', industry: '', website: '', phone: '', address: '' };

export const CompaniesPage: React.FC = () => {
  const { can } = useModuleAccess('crm');
  const canCreate = can('create');
  const canDelete = can('delete');

  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  const { data: companies, isLoading } = useCompanies({ search: search || undefined });
  const createMutation = useCreateCompany();
  const deleteMutation = useDeleteCompany();

  // Detail fetched directly so the drawer shows linked contacts/deals
  const { data: company, isLoading: detailLoading } = useCompany(selectedCompanyId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    createMutation.mutate(
      {
        name: form.name,
        industry: form.industry,
        website: form.website,
        phone: form.phone,
        address: form.address,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setForm(initialForm);
        },
      }
    );
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
          <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Companies</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {isLoading ? 'Loading companies…' : `${companies?.length ?? 0} account${(companies?.length ?? 0) === 1 ? '' : 's'}`}
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
              <Building2 className="w-4 h-4" />
              Add Company
            </button>
          )}
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-3.5 h-3.5 text-[#9B9B9B] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search name, industry, website…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} pl-9`}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Industry</th>
                <th className="px-5 py-3 font-semibold">Website</th>
                <th className="px-5 py-3 font-semibold text-center">Contacts</th>
                <th className="px-5 py-3 font-semibold text-center">Deals</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-5 rounded bg-[#FBEAE0] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : (companies || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <Building2 className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#1A1A1A]">No companies found</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">
                      {search ? 'Try adjusting your search.' : 'Companies appear here when leads are converted or added directly.'}
                    </p>
                  </td>
                </tr>
              ) : (
                (companies || []).map((c, idx) => (
                  <motion.tr
                    key={c._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.3), duration: 0.25 }}
                    className="hover:bg-[#FBF8F4] cursor-pointer transition-colors"
                    onClick={() => setSelectedCompanyId(c._id)}
                  >
                    <td className="px-5 py-3.5 font-medium text-[#1A1A1A]">{c.name}</td>
                    <td className="px-5 py-3.5 text-[#6B6B6B]">{c.industry || '—'}</td>
                    <td className="px-5 py-3.5 text-[#6B6B6B]">
                      {c.website ? (
                        <a
                          href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#C2540C] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {c.website}
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-md bg-[#FBEAE0] text-[#7A2F05] text-xs font-semibold">
                        {c.contactCount ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-md bg-[#FBEAE0] text-[#7A2F05] text-xs font-semibold">
                        {c.dealCount ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(c._id)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors disabled:opacity-50"
                          title="Delete company"
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
              <h3 className="text-base font-semibold text-[#1A1A1A]">Add Company</h3>
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
                  Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Industry</label>
                  <input
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. Manufacturing"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Website</label>
                  <input
                    value={form.website}
                    onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className={inputCls}
                    placeholder="acme.com"
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
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Address</label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className={inputCls}
                    placeholder="City, Country"
                  />
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
                  disabled={createMutation.isPending || !form.name.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#C2540C] hover:bg-[#D06B28] text-white transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Company
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Detail drawer */}
      <Drawer
        open={!!selectedCompanyId}
        onClose={() => setSelectedCompanyId(null)}
        title={company?.name || 'Company'}
        subtitle={company ? [company.industry, company.website].filter(Boolean).join(' · ') : undefined}
      >
        {detailLoading || !company ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 rounded-xl bg-[#FBEAE0]" />
            <div className="h-32 rounded-xl bg-[#FBEAE0]" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <InfoTile icon={<Globe className="w-3.5 h-3.5" />} label="Website" value={company.website || '—'} />
              <InfoTile icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={company.phone || '—'} />
              <InfoTile icon={<MapPin className="w-3.5 h-3.5" />} label="Address" value={company.address || '—'} />
              <InfoTile icon={<Building2 className="w-3.5 h-3.5" />} label="Industry" value={company.industry || '—'} />
            </div>

            {/* Linked contacts */}
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5" />
                Contacts ({company.contacts?.length ?? 0})
              </p>
              {(company.contacts || []).length === 0 ? (
                <p className="text-xs text-[#9B9B9B] italic">No contacts linked yet.</p>
              ) : (
                <div className="space-y-2">
                  {(company.contacts || []).map((ct) => (
                    <div key={ct._id} className="rounded-xl border border-[#ECE0D6] px-3 py-2.5">
                      <p className="text-xs font-medium text-[#1A1A1A]">{ct.fullName}</p>
                      <p className="text-[10px] text-[#6B6B6B]">
                        {[ct.title, ct.email].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linked deals */}
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">
                <Handshake className="w-3.5 h-3.5" />
                Deals ({company.deals?.length ?? 0})
              </p>
              {(company.deals || []).length === 0 ? (
                <p className="text-xs text-[#9B9B9B] italic">No deals linked yet.</p>
              ) : (
                <div className="space-y-2">
                  {(company.deals || []).map((deal) => (
                    <div
                      key={deal._id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#ECE0D6] px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#1A1A1A] truncate">{deal.dealName}</p>
                        <p className="text-[10px] text-[#6B6B6B] font-mono">${deal.amount.toLocaleString()}</p>
                      </div>
                      <StagePill stage={deal.stage} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CompaniesPage;
