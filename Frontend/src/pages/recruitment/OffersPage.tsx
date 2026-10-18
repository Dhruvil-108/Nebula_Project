import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Eye,
  Copy,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Printer,
  X,
  Clock,
  Download,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { recruitmentApi } from '../../lib/recruitmentApi';
import {
  useOffers,
  useSubmitOfferForApproval,
  useApproveOfferStep,
  useRejectOfferStep,
  useSendOfferToCandidate,
  useOfferLetterHtml,
  useCandidates,
} from '../../hooks/useRecruitment';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { OnboardEmployeeModal } from '../../components/recruitment/OnboardEmployeeModal';
import { CreateOfferModal } from '../../components/recruitment/CreateOfferModal';
import { FloatingDropdown } from '../../components/ui/FloatingDropdown';
import {
  OFFER_STATUSES,
  OFFER_STATUS_LABELS,
  type JobOffer,
  type Candidate,
} from '../../types/recruitment';

export const OffersPage: React.FC = () => {
  const { can } = useModuleAccess('recruitment');
  const canApprove = can('approve');

  const [statusFilter, setStatusFilter] = useState('');
  const [onboardCandidate, setOnboardCandidate] = useState<Candidate | null>(null);

  // Modals state
  const [previewOfferId, setPreviewOfferId] = useState<string | null>(null);
  const [createOfferCandidate, setCreateOfferCandidate] = useState<Candidate | null>(null);
  const [showCandidatePicker, setShowCandidatePicker] = useState(false);
  const [approvalModalOffer, setApprovalModalOffer] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [approvalComment, setApprovalComment] = useState('');

  // Queries & Mutations
  const { data: offers, isLoading, refetch } = useOffers({
    status: statusFilter || undefined,
  });

  const { data: candidates } = useCandidates();
  const { data: letterData, isLoading: isLoadingLetter } = useOfferLetterHtml(previewOfferId);

  const submitApprovalMutation = useSubmitOfferForApproval();
  const approveStepMutation = useApproveOfferStep();
  const rejectStepMutation = useRejectOfferStep();
  const sendOfferMutation = useSendOfferToCandidate();

  const handleCopySignLink = (token: string) => {
    const url = `${window.location.origin}/offers/sign/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('📋 Candidate e-sign link copied to clipboard!');
  };

  const handleApprovalConfirm = () => {
    if (!approvalModalOffer) return;
    if (approvalModalOffer.action === 'approve') {
      approveStepMutation.mutate(
        { id: approvalModalOffer.id, comments: approvalComment.trim() },
        {
          onSuccess: () => {
            setApprovalModalOffer(null);
            setApprovalComment('');
          },
        }
      );
    } else {
      rejectStepMutation.mutate(
        { id: approvalModalOffer.id, reason: approvalComment.trim() },
        {
          onSuccess: () => {
            setApprovalModalOffer(null);
            setApprovalComment('');
          },
        }
      );
    }
  };

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
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
              Offers & Compensation Governance
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
              Phase 4 E-Sign
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-0.5">
            Itemized CTC breakdown, compensation band governance, multi-level approvals, and zero-login digital signatures.
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

          <button
            type="button"
            onClick={() => setShowCandidatePicker(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-xl shadow-md shadow-orange-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Job Offer
          </button>
        </div>
      </motion.div>

      {/* ── Filter Bar ── */}
      <div className="flex items-center gap-3">
        <div className="w-56">
          <FloatingDropdown
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: '', label: 'All Offer Statuses' },
              ...OFFER_STATUSES.map((s) => ({
                value: s,
                label: OFFER_STATUS_LABELS[s],
                dotColor:
                  s === 'accepted'
                    ? '#10b981'
                    : s === 'pending_approval'
                    ? '#f59e0b'
                    : s === 'sent'
                    ? '#3b82f6'
                    : '#64748b',
              })),
            ]}
          />
        </div>
      </div>

      {/* ── Offers List Table ── */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3.5 font-bold">Offer & Candidate</th>
                <th className="px-5 py-3.5 font-bold">Designation & Dept</th>
                <th className="px-5 py-3.5 font-bold">Total CTC & Band</th>
                <th className="px-5 py-3.5 font-bold">Approval Chain</th>
                <th className="px-5 py-3.5 font-bold">E-Signature Status</th>
                <th className="px-5 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Loading job offers & compensation governance...
                  </td>
                </tr>
              ) : !offers || offers.length === 0 ? (
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
                  const isDraft = offer.status === 'draft';
                  const isApproved = offer.status === 'approved';
                  const isSent = offer.status === 'sent';
                  const isAlreadyOnboarded = cand?.convertedEmployeeId;

                  const ctc = offer.compensationBreakdown?.totalCtc || offer.offeredSalary || 0;
                  const isOutOfBand = offer.bandGovernance?.isOutOfBand;
                  const signToken = offer.eSignature?.signToken;
                  const signedAt = offer.eSignature?.signedAt;

                  return (
                    <tr key={offer._id} className="hover:bg-[#FAF7F2] transition-colors">
                      {/* Offer & Candidate */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center flex-shrink-0">
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

                      {/* Designation & Dept */}
                      <td className="px-5 py-4 space-y-0.5">
                        <span className="font-bold text-[#111827] block">{offer.designation}</span>
                        <span className="text-[11px] text-[#6B6B6B] block">{deptName}</span>
                      </td>

                      {/* CTC & Band Governance */}
                      <td className="px-5 py-4 space-y-1">
                        <span className="text-sm font-bold text-[#ea580c] font-mono block">
                          {offer.currency} {ctc.toLocaleString()}
                        </span>
                        {isOutOfBand ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Above Band (+{offer.bandGovernance?.deviationPercentage}%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Within Band
                          </span>
                        )}
                      </td>

                      {/* Multi-Step Approval Chain */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {offer.approvalChain && offer.approvalChain.length > 0 ? (
                            offer.approvalChain.map((step, idx) => {
                              const isStepApproved = step.status === 'approved';
                              const isStepRejected = step.status === 'rejected';
                              const isStepPending = step.status === 'pending';

                              return (
                                <span
                                  key={idx}
                                  title={`${step.role.replace(/_/g, ' ')}: ${step.status}`}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize flex items-center gap-1 border ${
                                    isStepApproved
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : isStepRejected
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : isStepPending
                                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                                      : 'bg-slate-50 text-slate-500 border-slate-200'
                                  }`}
                                >
                                  {isStepApproved ? '✓' : isStepPending ? '⏳' : isStepRejected ? '✕' : '•'}{' '}
                                  {step.role.replace(/_/g, ' ')}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Standard</span>
                          )}
                        </div>
                      </td>

                      {/* E-Signature Status */}
                      <td className="px-5 py-4">
                        {signedAt ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Digitally Signed
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              {new Date(signedAt).toLocaleDateString()} by{' '}
                              {offer.eSignature?.signerName || 'Candidate'}
                            </span>
                          </div>
                        ) : signToken ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock className="w-3 h-3 text-blue-500" />
                              Awaiting Candidate E-Sign
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopySignLink(signToken)}
                              className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
                            >
                              <Copy className="w-2.5 h-2.5" />
                              Copy Sign Link
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                              isApproved
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : isPending
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            {OFFER_STATUS_LABELS[offer.status] || offer.status}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Letter Preview Button */}
                          <button
                            type="button"
                            onClick={() => setPreviewOfferId(offer._id)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-[#ECE0D6] transition-colors"
                            title="Preview Branded Offer Letter"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Submit for Approval (Draft) */}
                          {isDraft && (
                            <button
                              type="button"
                              onClick={() => submitApprovalMutation.mutate(offer._id)}
                              disabled={submitApprovalMutation.isPending}
                              className="px-2.5 py-1 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
                            >
                              Submit Approval
                            </button>
                          )}

                          {/* Approve / Reject Step (Pending Approval) */}
                          {canApprove && isPending && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setApprovalModalOffer({ id: offer._id, action: 'approve' })}
                                className="px-2 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setApprovalModalOffer({ id: offer._id, action: 'reject' })}
                                className="px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          )}

                          {/* Send to Candidate with E-Sign Link (Approved) */}
                          {isApproved && (
                            <button
                              type="button"
                              onClick={() => sendOfferMutation.mutate(offer._id)}
                              disabled={sendOfferMutation.isPending}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
                            >
                              <Send className="w-3 h-3" />
                              Send E-Sign
                            </button>
                          )}

                          {/* 1-Click Onboard to HRMS */}
                          {isAlreadyOnboarded ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                              <UserCheck className="w-3.5 h-3.5" />
                              Onboarded
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setOnboardCandidate(cand as any)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-lg shadow-2xs transition-all"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Onboard
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

      {/* ── Letter Preview Modal ── */}
      <AnimatePresence>
        {previewOfferId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setPreviewOfferId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-white border border-[#ECE0D6] rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-600" />
                  <h3 className="text-sm font-bold text-[#1A1A1A]">Official Offer Letter Preview</h3>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={previewOfferId ? recruitmentApi.getOfferLetterPdfUrl(previewOfferId) : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`Offer_Letter_${previewOfferId}.pdf`}
                    className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 flex items-center gap-1 shadow-2xs"
                  >
                    <Download className="w-3 h-3" />
                    Download PDF
                  </a>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg border border-[#ECE0D6] bg-white text-xs font-semibold text-[#1A1A1A] hover:bg-slate-50 flex items-center gap-1"
                  >
                    <Printer className="w-3 h-3" />
                    Print
                  </button>
                  <button
                    onClick={() => setPreviewOfferId(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-8 overflow-y-auto flex-1 bg-white">
                {isLoadingLetter ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    Loading letter preview...
                  </div>
                ) : letterData?.html ? (
                  <div
                    className="prose prose-slate max-w-none text-xs"
                    dangerouslySetInnerHTML={{ __html: letterData.html }}
                  />
                ) : (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    Could not render offer letter.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Approval / Rejection Comment Modal ── */}
      <AnimatePresence>
        {approvalModalOffer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setApprovalModalOffer(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white border border-[#ECE0D6] rounded-2xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    approvalModalOffer.action === 'approve'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  {approvalModalOffer.action === 'approve' ? (
                    <ThumbsUp className="w-4 h-4" />
                  ) : (
                    <ThumbsDown className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1A1A1A]">
                    {approvalModalOffer.action === 'approve'
                      ? 'Approve Offer Step'
                      : 'Reject / Return Offer'}
                  </h4>
                  <p className="text-[11px] text-[#6B6B6B]">Add optional notes for the audit trail</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Comments / Justification
                </label>
                <textarea
                  rows={3}
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Enter comments..."
                  className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECE0D6]">
                <button
                  type="button"
                  onClick={() => setApprovalModalOffer(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApprovalConfirm}
                  disabled={approveStepMutation.isPending || rejectStepMutation.isPending}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors ${
                    approvalModalOffer.action === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm {approvalModalOffer.action === 'approve' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Candidate Picker Modal (to initiate CreateOfferModal) ── */}
      <AnimatePresence>
        {showCandidatePicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setShowCandidatePicker(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white border border-[#ECE0D6] rounded-2xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-600" />
                  <h4 className="text-sm font-bold text-[#1A1A1A]">Select Candidate to Offer</h4>
                </div>
                <button
                  onClick={() => setShowCandidatePicker(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-[#ECE0D6]">
                {candidates && candidates.length > 0 ? (
                  candidates.map((cand) => (
                    <div
                      key={cand._id}
                      onClick={() => {
                        setCreateOfferCandidate(cand);
                        setShowCandidatePicker(false);
                      }}
                      className="p-3 hover:bg-[#FAF7F2] cursor-pointer rounded-xl transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-[#1A1A1A]">{cand.fullName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {cand.candidateCode} • Stage: {cand.stage?.replace(/_/g, ' ') || 'applied'}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-orange-600">Select →</span>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-xs text-slate-400">No candidates available.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Enterprise Create Offer Modal ── */}
      <CreateOfferModal
        open={Boolean(createOfferCandidate)}
        onClose={() => setCreateOfferCandidate(null)}
        candidate={createOfferCandidate}
      />

      {/* ── 1-Click HRMS Onboarding Modal ── */}
      <OnboardEmployeeModal
        open={!!onboardCandidate}
        onClose={() => setOnboardCandidate(null)}
        candidate={onboardCandidate}
      />
    </div>
  );
};
