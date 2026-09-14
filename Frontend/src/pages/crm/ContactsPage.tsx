import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import {
  BookUser,
  Search,
  RefreshCw,
  Trash2,
  Loader2,
  Mail,
  Phone,
  Briefcase,
  X,
  Building2,
  Handshake,
} from 'lucide-react';
import { useContacts, useCreateContact, useDeleteContact } from '../../hooks/useCrm';
import { Drawer } from '../../components/crm/Drawer';
import { ActivityTimeline } from '../../components/crm/ActivityTimeline';
import { StagePill } from '../../components/crm/StagePill';
import { InfoTile } from '../../components/crm/InfoTile';
import { crmApi } from '../../lib/crmApi';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import type { Contact } from '../../types/crm';

interface OwnerOption {
  _id: string;
  fullName: string;
  email?: string;
  role?: string;
}

const initialForm = { fullName: '', email: '', phone: '', companyId: '', title: '', owner: '' };

export const ContactsPage: React.FC = () => {
  const { can } = useModuleAccess('crm');
  const canCreate = can('create');
  const canDelete = can('delete');

  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  const { data: contacts, isLoading } = useContacts({
    search: search || undefined,
    companyId: companyFilter || undefined,
  });

  const { data: companies } = useQuery({
    queryKey: ['crm', 'companies', 'options'],
    queryFn: () => crmApi.getCompanies(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: owners } = useQuery<OwnerOption[]>({
    queryKey: ['crm', 'owners'],
    queryFn: async () => {
      const res = await apiClient.get<{ users: OwnerOption[] }>('/users');
      return res.data.users;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: contactDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['crm', 'contact', selectedContactId],
    queryFn: () => crmApi.getContact(selectedContactId!),
    enabled: !!selectedContactId,
  });

  const createMutation = useCreateContact();
  const deleteMutation = useDeleteContact();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) return;
    createMutation.mutate(
      {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        companyId: form.companyId || null,
        title: form.title,
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
          <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Contacts</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {isLoading ? 'Loading contacts…' : `${contacts?.length ?? 0} contact${(contacts?.length ?? 0) === 1 ? '' : 's'}`}
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
              <BookUser className="w-4 h-4" />
              Add Contact
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
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className={`${inputCls} sm:w-56`}>
          <option value="">All companies</option>
          {(companies || []).map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
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
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Company</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Phone</th>
                <th className="px-5 py-3 font-semibold">Owner</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-5 rounded bg-[#FBEAE0] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : (contacts || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <BookUser className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#1A1A1A]">No contacts found</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">
                      {search || companyFilter ? 'Try adjusting your filters.' : 'Convert a lead or add a contact directly.'}
                    </p>
                  </td>
                </tr>
              ) : (
                (contacts || []).map((contact, idx) => (
                  <motion.tr
                    key={contact._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.3), duration: 0.25 }}
                    className="hover:bg-[#FBF8F4] cursor-pointer transition-colors"
                    onClick={() => setSelectedContactId(contact._id)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-[#1A1A1A]">{contact.fullName}</div>
                      {contact.title && <div className="text-xs text-[#6B6B6B]">{contact.title}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-[#1A1A1A]">{contact.companyId?.name || '—'}</td>
                    <td className="px-5 py-3.5 text-[#6B6B6B]">{contact.email || '—'}</td>
                    <td className="px-5 py-3.5 text-[#6B6B6B]">{contact.phone || '—'}</td>
                    <td className="px-5 py-3.5 text-[#6B6B6B]">{contact.owner?.fullName || 'Unassigned'}</td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(contact._id)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors disabled:opacity-50"
                          title="Delete contact"
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
              <h3 className="text-base font-semibold text-[#1A1A1A]">Add Contact</h3>
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
                  Full name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Priya Sharma"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Company</label>
                  <select
                    value={form.companyId}
                    onChange={(e) => setForm({ ...form, companyId: e.target.value })}
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
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Job title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. VP of Engineering"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputCls}
                    placeholder="priya@acme.com"
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
                  disabled={createMutation.isPending || !form.fullName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#C2540C] hover:bg-[#D06B28] text-white transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Contact
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Detail drawer */}
      <Drawer
        open={!!selectedContactId}
        onClose={() => setSelectedContactId(null)}
        title={contactDetail?.fullName || 'Contact'}
        subtitle={contactDetail ? [contactDetail.title, contactDetail.companyId?.name].filter(Boolean).join(' · ') : undefined}
      >
        {detailLoading || !contactDetail ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 rounded-xl bg-[#FBEAE0]" />
            <div className="h-32 rounded-xl bg-[#FBEAE0]" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <InfoTile icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={contactDetail.email || '—'} />
              <InfoTile icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={contactDetail.phone || '—'} />
              <InfoTile
                icon={<Building2 className="w-3.5 h-3.5" />}
                label="Company"
                value={contactDetail.companyId?.name || '—'}
              />
              <InfoTile icon={<Briefcase className="w-3.5 h-3.5" />} label="Title" value={contactDetail.title || '—'} />
            </div>

            {/* Linked deals */}
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">
                <Handshake className="w-3.5 h-3.5" />
                Linked Deals ({contactDetail.deals?.length ?? 0})
              </p>
              {(contactDetail.deals || []).length === 0 ? (
                <p className="text-xs text-[#9B9B9B] italic">No deals linked to this contact yet.</p>
              ) : (
                <div className="space-y-2">
                  {(contactDetail.deals || []).map((deal) => (
                    <div
                      key={deal._id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#ECE0D6] px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#1A1A1A] truncate">{deal.dealName}</p>
                        <p className="text-[10px] text-[#6B6B6B] font-mono">
                          ${deal.amount.toLocaleString()}
                        </p>
                      </div>
                      <StagePill stage={deal.stage} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <ActivityTimeline
              relatedToType="contact"
              relatedToId={contactDetail._id}
              activities={contactDetail.activities}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ContactsPage;
