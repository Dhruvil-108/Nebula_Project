import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  Send,
  XCircle,
  UserCheck,
  Calendar,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import {
  useOffers,
  useUpdateOfferStatus,
} from '../../hooks/useRecruitment';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { OnboardEmployeeModal } from '../../components/recruitment/OnboardEmployeeModal';
import { FloatingDropdown } from '../../components/ui/FloatingDropdown';
import {
  OFFER_STATUSES,
  OFFER_STATUS_LABELS,
  type JobOffer,
  type OfferStatus,
  type Candidate,
} from '../../types/recruitment';

export const OffersPage: React.FC = () => {
  const { can } = useModuleAccess('recruitment');
  const canApprove = can('approve');

  const [statusFilter, setStatusFilter] = useState('');
  const [onboardCandidate, setOnboardCandidate] = useState<Candidate | null>(null);

  const { data: offers, isLoading, refetch } = useOffers({
    status: statusFilter || undefined,
  });

  const updateStatusMutation = useUpdateOfferStatus();

  const handleStatusUpdate = (offerId: string, status: OfferStatus) => {
    updateStatusMutation.mutate({ id: offerId, status });
  };

  const inputCls =
    'rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-xs text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
            Job Offers & Onboarding
          </h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            Prepare compensation packages, manage offer lifecycle, and transition accepted candidates into HRMS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors"
            title="Refresh offers"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* ── Filter ── */}
      <div className="flex items-center gap-3">
        <div className="w-52">
          <FloatingDropdown
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: '', label: 'All Offer Statuses' },
              ...OFFER_STATUSES.map((s) => ({
                value: s,
                label: OFFER_STATUS_LABELS[s],
                dotColor: s === 'accepted' ? '#10b981' : s === 'pending_approval' ? '#f59e0b' : s === 'sent' ? '#3b82f6' : '#64748b',
              })),
            ]}
          />
        </div>
      </div>

      {/* ── Offers List ── */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3.5 font-bold">Offer & Candidate</th>
                <th className="px-5 py-3.5 font-bold">Designation & Dept</th>
                <th className="px-5 py-3.5 font-bold">Offered Salary</th>
                <th className="px-5 py-3.5 font-bold">Joining Date</th>
                <th className="px-5 py-3.5 font-bold">Status</th>
                <th className="px-5 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Loading job offers...
                  </td>
                </tr>
              ) : (!offers || offers.length === 0) ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    No job offers found matching criteria.
                  </td>
                </tr>
              ) : (
                offers.map((offer) => {
                  const cand = typeof offer.candidateId === 'object' ? offer.candidateId : null;
                  const candName = cand?.fullName || 'Candidate';
                  const candCode = cand?.candidateCode || '';
                  const deptName =
                    typeof offer.departmentId === 'object' && offer.departmentId
                      ? offer.departmentId.name
                      : 'General';

                  const isAccepted = offer.status === 'accepted';
                  const isPending = offer.status === 'pending_approval';
                  const isApproved = offer.status === 'approved';
                  const isSent = offer.status === 'sent';
                  const isAlreadyOnboarded = cand?.convertedEmployeeId;

                  return (
                    <tr key={offer._id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center flex-shrink-0">
                            <Award className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#111827]">{candName}</p>
                            <span className="font-mono text-[10px] text-[#9B9B9B]">
                              {offer.offerCode} · {candCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 space-y-0.5">
                        <span className="font-bold text-[#111827] block">{offer.designation}</span>
                        <span className="text-[11px] text-[#6B6B6B] block">{deptName}</span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-[#ea580c] font-mono">
                          {offer.currency} {offer.offeredSalary.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[#9B9B9B] block">per year</span>
                      </td>

                      <td className="px-5 py-4 font-medium text-[#111827]">
                        {new Date(offer.joiningDate).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            isAccepted
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isPending
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : isSent
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isAccepted ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                          />
                          {OFFER_STATUS_LABELS[offer.status] || offer.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Approval flow */}
                          {canApprove && isPending && (
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(offer._id, 'approved')}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                            >
                              Approve
                            </button>
                          )}

                          {canApprove && isApproved && (
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(offer._id, 'sent')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200"
                            >
                              <Send className="w-3 h-3" />
                              Mark Sent
                            </button>
                          )}

                          {canApprove && isSent && (
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(offer._id, 'accepted')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Candidate Accepted
                            </button>
                          )}

                          {/* HRMS Onboard Trigger */}
                          {isAlreadyOnboarded ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                              <UserCheck className="w-3.5 h-3.5" />
                              Onboarded
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setOnboardCandidate(cand as any)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-lg shadow-2xs"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Onboard to HRMS
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <OnboardEmployeeModal
        open={!!onboardCandidate}
        onClose={() => setOnboardCandidate(null)}
        candidate={onboardCandidate}
      />
    </div>
  );
};
