import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Briefcase,
  Search,
  Plus,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Award,
  DollarSign,
  X,
  Filter,
} from 'lucide-react';
import {
  useReferrals,
  useCreateReferral,
  useUpdateReferralStatus,
  useJobOpenings,
} from '../../hooks/useRecruitment';
import type { Referral, ReferralStatus } from '../../types/recruitment';
import { toast } from 'react-toastify';

export const ReferralsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const { data: referrals, isLoading, refetch } = useReferrals(
    statusFilter ? { status: statusFilter } : {}
  );
  const { data: jobs } = useJobOpenings({ status: 'open' });
  const createReferralMutation = useCreateReferral();
  const updateStatusMutation = useUpdateReferralStatus();

  // Submission Form State
  const [formData, setFormData] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    jobOpeningId: '',
    relationship: 'former_colleague',
    notes: '',
    resumeUrl: '',
  });

  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.candidateName || !formData.candidateEmail || !formData.jobOpeningId) {
      toast.error('Please fill in candidate name, email, and target job opening.');
      return;
    }

    try {
      await createReferralMutation.mutateAsync({
        fullName: formData.candidateName.trim(),
        email: formData.candidateEmail.trim().toLowerCase(),
        phone: formData.candidatePhone.trim(),
        jobOpeningId: formData.jobOpeningId,
        relationship: formData.relationship,
        notes: formData.notes.trim(),
        resumeUrl: formData.resumeUrl.trim(),
      });
      toast.success('Referral submitted successfully! Thank you for helping us grow.');
      setIsSubmitModalOpen(false);
      setFormData({
        candidateName: '',
        candidateEmail: '',
        candidatePhone: '',
        jobOpeningId: '',
        relationship: 'former_colleague',
        notes: '',
        resumeUrl: '',
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit referral');
    }
  };

  const handleStatusChange = async (id: string, newStatus: ReferralStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
      toast.success(`Referral updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update referral status');
    }
  };

  const getStatusBadge = (status: ReferralStatus) => {
    switch (status) {
      case 'hired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Hired
          </span>
        );
      case 'interviewing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" /> Interviewing
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Clock className="w-3 h-3" /> In Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Not Selected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        );
    }
  };

  const filteredReferrals = (referrals || []).filter((r) => {
    const term = search.toLowerCase();
    const candName = r.candidateName?.toLowerCase() || '';
    const candEmail = r.candidateEmail?.toLowerCase() || '';
    return candName.includes(term) || candEmail.includes(term);
  });

  const totalReferrals = referrals?.length || 0;
  const hiredCount = referrals?.filter((r) => r.status === 'hired').length || 0;
  const interviewingCount = referrals?.filter((r) => r.status === 'interviewing').length || 0;
  const pendingCount = referrals?.filter((r) => r.status === 'pending').length || 0;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-[#FBF8F4] min-h-screen">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-[#f97316]">
              <UserPlus className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-black text-[#111827] tracking-tight">
              Employee Referrals
            </h1>
          </div>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Empower team members to refer top industry peers and track referral bonus milestones.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsSubmitModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Refer a Colleague
        </button>
      </div>

      {/* ── Metric Highlights ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#ECE0D6] shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">Total Referrals</p>
          <p className="text-2xl font-black text-[#111827] mt-1">{totalReferrals}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#ECE0D6] shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">Pending Review</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#ECE0D6] shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">In Pipeline</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{interviewingCount}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#ECE0D6] shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">Successfully Hired</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{hiredCount}</p>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate name or email..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-[#ECE0D6] focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 transition-all text-[#111827]"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {['', 'pending', 'interviewing', 'hired', 'rejected'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#111827] text-white shadow-2xs'
                  : 'bg-white border border-[#ECE0D6] text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st === '' ? 'All' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Referrals Table ── */}
      <div className="rounded-3xl bg-white border border-[#ECE0D6] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">
                <th className="py-4 px-6">Candidate</th>
                <th className="py-4 px-6">Target Role</th>
                <th className="py-4 px-6">Referred By</th>
                <th className="py-4 px-6">Relationship</th>
                <th className="py-4 px-6">Submitted</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE0D6]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading referrals...
                  </td>
                </tr>
              ) : filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No referrals found matching your query.
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((ref) => {
                  const jobObj = typeof ref.jobOpeningId === 'object' ? (ref.jobOpeningId as any) : null;
                  const referrerObj = typeof ref.referrerId === 'object' ? (ref.referrerId as any) : null;
                  return (
                    <tr key={ref._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{ref.candidateName}</div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {ref.candidateEmail}
                          </span>
                          {ref.candidatePhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {ref.candidatePhone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-800">
                          {jobObj?.title || 'Job Opening'}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span className="text-slate-700">
                          {referrerObj ? `${referrerObj.firstName} ${referrerObj.lastName}` : 'Internal Employee'}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <span className="capitalize text-slate-600 font-medium">
                          {ref.relationship ? ref.relationship.replace(/_/g, ' ') : 'Colleague'}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-slate-500">
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-6">{getStatusBadge(ref.status)}</td>

                      <td className="py-4 px-6 text-right">
                        <select
                          value={ref.status}
                          onChange={(e) => handleStatusChange(ref._id, e.target.value as ReferralStatus)}
                          className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:border-[#f97316] cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_review">In Review</option>
                          <option value="interviewing">Interviewing</option>
                          <option value="hired">Hired</option>
                          <option value="rejected">Not Selected</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Submit Referral Modal ── */}
      <AnimatePresence>
        {isSubmitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#ECE0D6] shadow-xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-[#ECE0D6] flex items-center justify-between bg-[#FBF8F4]">
                <div>
                  <h3 className="font-bold text-sm text-[#111827]">Refer a Colleague</h3>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    Connect high-performing peers directly to our hiring team.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmitReferral} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Candidate Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.candidateName}
                    onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Candidate Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.candidateEmail}
                      onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                      placeholder="alex.morgan@example.com"
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.candidatePhone}
                      onChange={(e) => setFormData({ ...formData, candidatePhone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Target Job Opening <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.jobOpeningId}
                      onChange={(e) => setFormData({ ...formData, jobOpeningId: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 transition-all text-slate-700"
                    >
                      <option value="">Select a role...</option>
                      {(jobs || []).map((j: any) => (
                        <option key={j._id} value={j._id}>
                          {j.title} ({j.location})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 transition-all text-slate-700"
                    >
                      <option value="former_colleague">Former Colleague</option>
                      <option value="friend">Friend / Peer</option>
                      <option value="family">Family Member</option>
                      <option value="university_peer">University Peer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Resume Link / Portfolio
                  </label>
                  <input
                    type="url"
                    value={formData.resumeUrl}
                    onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                    placeholder="https://drive.google.com/... or LinkedIn URL"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Why do you recommend them?
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Share specific projects, competencies, or achievements that make them exceptional..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 transition-all resize-none"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-[#ECE0D6]">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createReferralMutation.isPending}
                    className="px-5 py-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {createReferralMutation.isPending ? 'Submitting...' : 'Submit Referral'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
