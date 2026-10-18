import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileCheck,
  Search,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Briefcase,
  ChevronRight,
  DollarSign,
  Send,
  Building2,
  Sparkles,
} from 'lucide-react';
import {
  useRequisitions,
  useSubmitRequisition,
  useConvertRequisitionToJob,
} from '../../hooks/useRecruitment';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { CreateRequisitionModal } from '../../components/recruitment/CreateRequisitionModal';
import { RequisitionApprovalModal } from '../../components/recruitment/RequisitionApprovalModal';
import type { Requisition, RequisitionStatus, ApprovalStep } from '../../types/recruitment';
import { useNavigate } from 'react-router-dom';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending Approval', value: 'pending_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'Drafts', value: 'draft' },
  { label: 'Converted to Job', value: 'converted_to_job' },
  { label: 'Rejected', value: 'rejected' },
];

export const RequisitionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { can } = useModuleAccess('recruitment');
  const canCreate = can('create');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [approvalModalReq, setApprovalModalReq] = useState<Requisition | null>(null);

  const { data: requisitions, isLoading, refetch } = useRequisitions({
    status: statusFilter || undefined,
    search: search || undefined,
  });

  const submitRequisition = useSubmitRequisition();
  const convertToJob = useConvertRequisitionToJob();

  // Stats calculation
  const totalReqs = requisitions?.length || 0;
  const pendingCount = requisitions?.filter((r) => r.status === 'pending_approval').length || 0;
  const approvedCount = requisitions?.filter((r) => r.status === 'approved').length || 0;
  const convertedCount = requisitions?.filter((r) => r.status === 'converted_to_job').length || 0;

  const handleConvert = async (req: Requisition, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Convert Requisition "${req.title}" into a published Job Opening?`)) {
      try {
        await convertToJob.mutateAsync(req._id);
        navigate('/dashboard/recruitment/jobs');
      } catch (err: any) {
        alert(err?.response?.data?.message || err?.message || 'Failed to convert requisition to job');
      }
    }
  };

  const handleSubmit = async (req: Requisition, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Submit Requisition "${req.title}" for approval?`)) {
      try {
        await submitRequisition.mutateAsync(req._id);
      } catch (err: any) {
        alert(err?.response?.data?.message || err?.message || 'Failed to submit requisition');
      }
    }
  };

  const getStatusBadge = (status: RequisitionStatus) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
      case 'pending_approval':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-500 animate-pulse" /> Pending Approval
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Approved
          </span>
        );
      case 'converted_to_job':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            <Briefcase className="w-3 h-3 text-orange-500" /> Converted to Job
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-500" /> Rejected
          </span>
        );
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-100/60 text-orange-700 text-[11px] font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Recruitment ERP Backbone
          </div>
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
            Manpower Requisitions
          </h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            Structured headcount approval workflows, budget authorizations, and requisition-to-job governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors"
            title="Refresh Requisitions"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Requisition
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#ECE0D6] shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">Total Requisitions</p>
          <p className="text-2xl font-extrabold text-[#111827] mt-1">{totalReqs}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#ECE0D6] shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending Approvals
          </p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#ECE0D6] shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved Headcounts
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{approvedCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-[#ECE0D6] shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" /> Converted to Jobs
          </p>
          <p className="text-2xl font-extrabold text-orange-600 mt-1">{convertedCount}</p>
        </div>
      </div>

      {/* ── Status Tab Bar & Search ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl overflow-x-auto w-full md:w-auto">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-[#f97316] text-white shadow-2xs'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-[#9B9B9B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search requisition title, code, dept..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#ECE0D6] bg-white pl-9 pr-3 py-2 text-xs text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all"
          />
        </div>
      </div>

      {/* ── Requisitions Table ── */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3.5 font-bold">Requisition</th>
                <th className="px-5 py-3.5 font-bold">Department</th>
                <th className="px-5 py-3.5 font-bold">Positions & Budget</th>
                <th className="px-5 py-3.5 font-bold">Reason</th>
                <th className="px-5 py-3.5 font-bold">Approval Chain</th>
                <th className="px-5 py-3.5 font-bold">Status</th>
                <th className="px-5 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    Loading requisitions...
                  </td>
                </tr>
              ) : (!requisitions || requisitions.length === 0) ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No manpower requisitions found. Click "New Requisition" to create one.
                  </td>
                </tr>
              ) : (
                requisitions.map((req) => {
                  const deptName =
                    typeof req.departmentId === 'object' && req.departmentId
                      ? req.departmentId.name
                      : 'General';

                  const approvedSteps = req.approvalChain.filter((s: ApprovalStep) => s.status === 'approved').length;
                  const totalSteps = req.approvalChain.length;

                  return (
                    <tr
                      key={req._id}
                      className="hover:bg-[#FAF7F2] transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-orange-100/70 border border-orange-200 text-orange-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            <FileCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#111827] group-hover:text-[#f97316] transition-colors">
                              {req.title}
                            </p>
                            <span className="font-mono text-[10px] text-[#9B9B9B]">
                              {req.reqCode} · {req.employmentType}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {deptName}
                        </div>
                        <span className="text-[10px] text-[#9B9B9B] capitalize">{req.experienceLevel}</span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">
                          {req.openPositions} {req.openPositions === 1 ? 'opening' : 'openings'}
                        </div>
                        <div className="text-[11px] text-[#6B6B6B] flex items-center gap-0.5">
                          <DollarSign className="w-3 h-3 text-emerald-600" />
                          {req.budget.currency} {req.budget.min.toLocaleString()} - {req.budget.max.toLocaleString()}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 capitalize">
                          {req.reason.replace('_', ' ')}
                        </span>
                        {req.targetStartDate && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            Target: {new Date(req.targetStartDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                          <span>{approvedSteps}/{totalSteps} Approved</span>
                        </div>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1 border border-slate-200">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${(approvedSteps / (totalSteps || 1)) * 100}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {getStatusBadge(req.status)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {req.status === 'draft' && (
                            <button
                              type="button"
                              onClick={(e) => handleSubmit(req, e)}
                              disabled={submitRequisition.isPending}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
                            >
                              <Send className="w-3 h-3" />
                              Submit
                            </button>
                          )}

                          {req.status === 'pending_approval' && (
                            <button
                              type="button"
                              onClick={() => setApprovalModalReq(req)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Review
                            </button>
                          )}

                          {req.status === 'approved' && !req.jobOpeningId && (
                            <button
                              type="button"
                              onClick={(e) => handleConvert(req, e)}
                              disabled={convertToJob.isPending}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-xs transition-colors"
                            >
                              <Briefcase className="w-3 h-3" />
                              Convert to Job
                            </button>
                          )}

                          {req.status === 'converted_to_job' && req.jobOpeningId && (
                            <button
                              type="button"
                              onClick={() => navigate('/dashboard/recruitment/jobs')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            >
                              View Job
                              <ChevronRight className="w-3 h-3" />
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

      {/* ── Create Requisition Modal ── */}
      {showCreateModal && (
        <CreateRequisitionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* ── Requisition Approval Modal ── */}
      {approvalModalReq && (
        <RequisitionApprovalModal
          isOpen={Boolean(approvalModalReq)}
          onClose={() => setApprovalModalReq(null)}
          requisition={approvalModalReq}
        />
      )}
    </div>
  );
};
