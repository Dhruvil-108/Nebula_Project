import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle2, XCircle, AlertCircle, Building2, User, DollarSign, Clock } from 'lucide-react';
import { useApproveRequisitionStep, useRejectRequisitionStep, useConvertRequisitionToJob } from '../../hooks/useRecruitment';
import type { Requisition } from '../../types/recruitment';

interface RequisitionApprovalModalProps {
  requisition: Requisition | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RequisitionApprovalModal: React.FC<RequisitionApprovalModalProps> = ({
  requisition,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const approveMutation = useApproveRequisitionStep();
  const rejectMutation = useRejectRequisitionStep();
  const convertMutation = useConvertRequisitionToJob();

  const [comments, setComments] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !requisition) return null;

  const handleApprove = async () => {
    setError(null);
    try {
      await approveMutation.mutateAsync({
        id: requisition._id,
        comments: comments.trim() || 'Approved',
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Approval failed.');
    }
  };

  const handleReject = async () => {
    setError(null);
    if (!comments.trim()) {
      setError('Please provide a reason / comment for rejecting this requisition.');
      return;
    }
    try {
      await rejectMutation.mutateAsync({
        id: requisition._id,
        comments: comments.trim(),
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Rejection failed.');
    }
  };

  const handleConvertToJob = async () => {
    setError(null);
    try {
      await convertMutation.mutateAsync(requisition._id);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Conversion failed.');
    }
  };

  const deptName = typeof requisition.departmentId === 'object' ? requisition.departmentId.name : 'Department';
  const isApproved = requisition.status === 'approved';
  const isPending = requisition.status === 'pending_approval';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/35 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg rounded-2xl bg-white border border-[#ECE0D6] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white border border-[#ECE0D6] text-[#f97316] font-bold">
                  {requisition.reqCode}
                </span>
                <h3 className="text-base font-bold text-[#111827]">{requisition.title}</h3>
              </div>
              <p className="text-xs text-[#64748b] mt-0.5">{deptName} · {requisition.openPositions} Position(s)</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#64748b] hover:text-[#111827] hover:bg-[#FBEAE0] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Summary details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[#64748b] block mb-0.5">Budget Compensation</span>
                <span className="font-bold text-[#111827]">
                  {requisition.budget?.currency} {requisition.budget?.min?.toLocaleString()} - {requisition.budget?.max?.toLocaleString()}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <span className="text-[#64748b] block mb-0.5">Hiring Reason</span>
                <span className="font-bold text-[#111827] capitalize">
                  {requisition.reason.replace(/_/g, ' ')}
                </span>
              </div>
            </div>

            {/* Business Justification */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1">Business Justification</label>
              <p className="text-xs text-[#4b5563] p-3 rounded-xl bg-slate-50 border border-slate-200/60 italic">
                "{requisition.justification}"
              </p>
            </div>

            {/* Approval Chain Progress */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-2">Approval Chain Status</label>
              <div className="space-y-2">
                {requisition.approvalChain?.map((step) => (
                  <div
                    key={step.stepNumber}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      step.status === 'approved'
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
                        : step.status === 'rejected'
                        ? 'bg-red-50/60 border-red-200 text-red-800'
                        : 'bg-amber-50/60 border-amber-200 text-amber-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {step.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {step.status === 'rejected' && <XCircle className="w-4 h-4 text-red-600" />}
                      {step.status === 'pending' && <Clock className="w-4 h-4 text-amber-600 animate-pulse" />}
                      <div>
                        <span className="font-bold">Step {step.stepNumber}: {step.approverRole.toUpperCase()}</span>
                        {step.comments && (
                          <p className="text-[11px] text-[#64748b] mt-0.5">Note: "{step.comments}"</p>
                        )}
                      </div>
                    </div>
                    <span className="font-bold capitalize text-[11px]">{step.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments input if pending */}
            {isPending && (
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">Approver Review Comments</label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Optional approval note or required rejection reason..."
                  className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3.5 py-2 text-xs text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316]"
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-[#FBF8F4] border-t border-[#ECE0D6] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#374151] bg-white hover:bg-slate-50 border border-[#e5e7eb] transition-all"
            >
              Close
            </button>

            {isPending && (
              <>
                <button
                  type="button"
                  disabled={rejectMutation.isPending}
                  onClick={handleReject}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all disabled:opacity-50"
                >
                  Reject Requisition
                </button>
                <button
                  type="button"
                  disabled={approveMutation.isPending}
                  onClick={handleApprove}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-50"
                >
                  Approve Requisition
                </button>
              </>
            )}

            {isApproved && !requisition.jobOpeningId && (
              <button
                type="button"
                disabled={convertMutation.isPending}
                onClick={handleConvertToJob}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all disabled:opacity-50"
              >
                {convertMutation.isPending ? 'Converting...' : 'Convert to Job Opening'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
