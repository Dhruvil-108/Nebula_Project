import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Check,
  X,
  RefreshCw,
  Loader2,
  CalendarOff,
  Plus,
} from 'lucide-react';
import {
  useLeaveTypes,
  useLeaveBalances,
  useLeaveRequests,
  useCreateLeaveRequest,
  useReviewLeaveRequest,
} from '../../hooks/useHrms';
import { LeaveStatusPill } from '../../components/hrms/HrmsStatusPill';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { useAuth } from '../../contexts/AuthContext';
import type { LeaveRequest } from '../../types/hrms';
import { LEAVE_REQUEST_STATUSES, LEAVE_STATUS_LABELS } from '../../types/hrms';

const fmtDate = (d: string) => new Date(d).toLocaleDateString();

// ─────────────────────────────────────────────────────────
// My Leave view
// ─────────────────────────────────────────────────────────
const MyLeave: React.FC = () => {
  const { data: leaveTypes } = useLeaveTypes();
  const { data: balances, isLoading: balancesLoading } = useLeaveBalances();
  // employeeId=me scopes this list to the signed-in account ONLY.
  // Without it, the backend returns the whole org's requests for
  // manager/HR/admin viewers (that wider list belongs to the Approvals tab).
  const { data: myRequests, isLoading: requestsLoading } = useLeaveRequests({
    employeeId: 'me',
  });
  const createMutation = useCreateLeaveRequest();

  const [showRequest, setShowRequest] = useState(false);
  const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leaveTypeId || !form.startDate || !form.endDate) return;
    createMutation.mutate(
      {
        leaveTypeId: form.leaveTypeId,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      },
      {
        onSuccess: () => {
          setShowRequest(false);
          setForm({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
        },
      }
    );
  };

  const inputCls =
    'w-full rounded-lg border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all';

  return (
    <div className="space-y-6">
      {/* ── Balance cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balancesLoading
          ? [...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-[#fff7ed] animate-pulse" />)
          : (balances || []).map((b) => {
              const pct = b.allocated > 0 ? Math.min(100, Math.round((b.used / b.allocated) * 100)) : 0;
              return (
                <div key={b._id} className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-5">
                  <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">{b.leaveType}</p>
                  <p className="text-2xl font-bold text-[#1A1A1A] mb-1">
                    {b.remaining}
                    <span className="text-sm text-[#9B9B9B] font-medium"> / {b.allocated} days</span>
                  </p>
                  <div className="h-2 rounded-full bg-[#FBF0E7] overflow-hidden mb-1.5">
                    <div
                      className="h-full rounded-full bg-[#f97316] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#9B9B9B] font-mono">{b.used} used this year</p>
                </div>
              );
            })}
      </div>

      {/* ── Request history ── */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECE0D6]">
          <div className="flex items-center gap-2">
            <CalendarOff className="w-4 h-4 text-[#f97316]" />
            <h4 className="text-sm font-semibold text-[#1A1A1A]">My Leave Requests</h4>
          </div>
          <button
            type="button"
            onClick={() => setShowRequest(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Request Leave
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Dates</th>
                <th className="px-5 py-3 font-semibold">Days</th>
                <th className="px-5 py-3 font-semibold">Reason</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {requestsLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-5 py-4">
                      <div className="h-5 rounded bg-[#fff7ed] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : (myRequests || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <CalendarOff className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#1A1A1A]">No leave requests yet</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">Submit a request and it will appear here.</p>
                  </td>
                </tr>
              ) : (
                (myRequests || []).map((req, idx) => (
                  <motion.tr
                    key={req._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.3), duration: 0.25 }}
                    className="hover:bg-[#FBF8F4] transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-[#1A1A1A]">
                      {(req.leaveTypeId as { name?: string })?.name || 'Leave'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#6B6B6B] font-mono">
                      {fmtDate(req.startDate)} → {fmtDate(req.endDate)}
                    </td>
                    <td className="px-5 py-3.5 text-[#6B6B6B]">{req.totalDays}</td>
                    <td className="px-5 py-3.5 text-xs text-[#6B6B6B] max-w-[240px] truncate">
                      {req.reason || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <LeaveStatusPill status={req.status} />
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Request modal ── */}
      {showRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setShowRequest(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md rounded-2xl bg-white border border-[#ECE0D6] shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECE0D6]">
              <h3 className="text-base font-semibold text-[#1A1A1A]">Request Leave</h3>
              <button
                type="button"
                onClick={() => setShowRequest(false)}
                className="p-1.5 rounded-lg text-[#6B6B6B] hover:bg-[#fff7ed] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                  Leave type <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  required
                  value={form.leaveTypeId}
                  onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Select a leave type…</option>
                  {(leaveTypes || []).map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.annualQuota > 0 ? `${t.annualQuota} days/yr` : 'unpaid'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                    Start date <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                    End date <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={form.startDate || undefined}
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Reason</label>
                <textarea
                  rows={2}
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className={`${inputCls} resize-none`}
                  placeholder="Context for your approver…"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequest(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#ECE0D6] hover:bg-[#fff7ed] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !form.leaveTypeId || !form.startDate || !form.endDate}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Submit Request
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Approvals view (manager/HR/admin only)
// ─────────────────────────────────────────────────────────
const Approvals: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const { data: requests, isLoading, isError, refetch } = useLeaveRequests({
    status: statusFilter || undefined,
  });
  const reviewMutation = useReviewLeaveRequest();

  const pendingCount = useMemo(
    () => (requests || []).filter((r) => r.status === 'pending').length,
    [requests]
  );

  const employeeName = (req: LeaveRequest) =>
    (req.employeeId as { fullName?: string })?.fullName || 'Unknown';

  const inputCls =
    'w-full rounded-lg border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all';

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {statusFilter === 'pending' && pendingCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#B45309]/10 text-[#B45309] border border-[#B45309]/25">
              {pendingCount} awaiting review
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${inputCls} sm:w-44`}
          >
            <option value="">All statuses</option>
            {LEAVE_REQUEST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAVE_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Requests table */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3 font-semibold">Employee</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Dates</th>
                <th className="px-5 py-3 font-semibold">Days</th>
                <th className="px-5 py-3 font-semibold">Reason</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-5 rounded bg-[#fff7ed] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <p className="text-sm font-medium text-[#1A1A1A]">Leave requests could not be loaded</p>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#f97316] border border-[#ECE0D6] hover:bg-[#fff7ed]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry
                    </button>
                  </td>
                </tr>
              ) : (requests || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <CalendarDays className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#1A1A1A]">No leave requests</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">
                      {statusFilter ? `No ${LEAVE_STATUS_LABELS[statusFilter as 'pending'].toLowerCase()} requests.` : 'Requests will appear here as employees submit them.'}
                    </p>
                  </td>
                </tr>
              ) : (
                (requests || []).map((req, idx) => (
                  <motion.tr
                    key={req._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.3), duration: 0.25 }}
                    className="hover:bg-[#FBF8F4] transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-[#1A1A1A]">{employeeName(req)}</td>
                    <td className="px-5 py-3.5 text-[#6B6B6B]">
                      {(req.leaveTypeId as { name?: string })?.name || 'Leave'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#6B6B6B] font-mono">
                      {fmtDate(req.startDate)} → {fmtDate(req.endDate)}
                    </td>
                    <td className="px-5 py-3.5 text-[#6B6B6B]">{req.totalDays}</td>
                    <td className="px-5 py-3.5 text-xs text-[#6B6B6B] max-w-[200px] truncate">
                      {req.reason || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <LeaveStatusPill status={req.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      {req.status === 'pending' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => reviewMutation.mutate({ id: req._id, decision: 'approve' })}
                            disabled={reviewMutation.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#12813A] transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => reviewMutation.mutate({ id: req._id, decision: 'reject' })}
                            disabled={reviewMutation.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#6B6B6B] hover:text-white bg-transparent border border-[#ECE0D6] hover:bg-[#DC2626] hover:border-[#DC2626] transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#9B9B9B] font-mono">
                          {req.reviewedBy?.fullName ? `by ${req.reviewedBy.fullName}` : '—'}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Leave page — tabs
// ─────────────────────────────────────────────────────────
export const LeavePage: React.FC = () => {
  const { user } = useAuth();
  const { can } = useModuleAccess('hrms');
  const canApprove = can('approve');
  const isManagement =
    canApprove && ['super_admin', 'admin', 'manager', 'hr'].includes(user?.role || '');

  const [tab, setTab] = useState<'mine' | 'approvals'>('mine');

  return (
    <div className="hrms-submodule-page p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Leave</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Balances, requests{isManagement ? ', and approvals' : ''} for {new Date().getFullYear()}.
          </p>
        </div>
        {isManagement && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
            <button
              type="button"
              onClick={() => setTab('mine')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                tab === 'mine' ? 'bg-[#f97316] text-white shadow-sm' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              <CalendarOff className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              My Leave
            </button>
            <button
              type="button"
              onClick={() => setTab('approvals')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                tab === 'approvals' ? 'bg-[#f97316] text-white shadow-sm' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              <Check className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Approvals
            </button>
          </div>
        )}
      </motion.div>

      {tab === 'mine' ? <MyLeave /> : <Approvals />}
    </div>
  );
};

export default LeavePage;
