import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  Check,
  X,
  RefreshCw,
  CalendarOff,
  Plus,
  Clock,
  FileText,
  AlertCircle,
  HelpCircle,
  Award,
  Settings2,
  CalendarCheck2,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Edit2,
  Send,
  Users,
} from 'lucide-react';
import {
  useLeaveTypes,
  useCreateLeaveType,
  useUpdateLeaveType,
  useLeaveBalances,
  useLeaveRequests,
  useCreateLeaveRequest,
  useReviewLeaveRequest,
  useLeaveLedger,
  useRunMonthlyAccrual,
  useCompOffRequests,
  useCreateCompOff,
  useReviewCompOff,
} from '../../hooks/useHrms';
import { LeaveStatusPill } from '../../components/hrms/HrmsStatusPill';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { useAuth } from '../../contexts/AuthContext';
import { hrmsApi } from '../../lib/hrmsApi';
import type {
  LeaveRequest,
  LeaveType,
  LeaveTypeInput,
  CompOffGrant,
  CompOffInput,
  LeaveTransactionType,
  SandwichPreviewResult,
} from '../../types/hrms';
import {
  LEAVE_REQUEST_STATUSES,
  LEAVE_STATUS_LABELS,
  LEAVE_TRANSACTION_LABELS,
} from '../../types/hrms';

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString() : '—';

const fmtHM = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
};

// ─────────────────────────────────────────────────────────
// Apply Leave Modal with Sandwich Policy Preview
// ─────────────────────────────────────────────────────────
interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveTypes: LeaveType[];
}

const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({ isOpen, onClose, leaveTypes }) => {
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<SandwichPreviewResult | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const createMutation = useCreateLeaveRequest();

  useEffect(() => {
    if (leaveTypes && leaveTypes.length > 0 && !leaveTypeId) {
      setLeaveTypeId(leaveTypes[0]._id);
    }
  }, [leaveTypes, leaveTypeId]);

  // Debounced sandwich rule preview
  useEffect(() => {
    if (!leaveTypeId || !startDate || !endDate) {
      setPreview(null);
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      setPreview(null);
      return;
    }

    let isMounted = true;
    setIsPreviewLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await hrmsApi.previewSandwichRule({
          leaveTypeId,
          startDate,
          endDate,
          employeeId: 'me',
        });
        if (isMounted) {
          setPreview(res);
        }
      } catch (err) {
        console.warn('Sandwich preview error:', err);
      } finally {
        if (isMounted) setIsPreviewLoading(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [leaveTypeId, startDate, endDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveTypeId || !startDate || !endDate) return;

    createMutation.mutate(
      {
        leaveTypeId,
        startDate,
        endDate,
        reason: reason.trim(),
      },
      {
        onSuccess: () => {
          onClose();
          setStartDate('');
          setEndDate('');
          setReason('');
          setPreview(null);
        },
      }
    );
  };

  const selectedType = leaveTypes.find((t) => t._id === leaveTypeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-[#ECE0D6] bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#ECE0D6]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#fff7ed] text-[#f97316]">
              <CalendarOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1A1A]">Request Leave</h3>
              <p className="text-xs text-[#6B6B6B]">Submit time-off with live sandwich policy preview</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Leave Category</label>
            <select
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
              className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
              required
            >
              {leaveTypes.map((lt) => (
                <option key={lt._id} value={lt._id}>
                  {lt.name} {lt.code ? `(${lt.code})` : ''} — {lt.annualQuota} days/yr {lt.sandwichRuleEnabled ? '• Sandwich Rule Active' : ''}
                </option>
              ))}
            </select>
            {selectedType && (
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#6B6B6B]">
                {selectedType.priorNoticeDays ? (
                  <span>Notice: {selectedType.priorNoticeDays}d advance</span>
                ) : null}
                {selectedType.maxConsecutiveDays ? (
                  <span>Max: {selectedType.maxConsecutiveDays} consecutive days</span>
                ) : null}
                <span>{selectedType.isPaid ? 'Paid Leave' : 'Unpaid Leave'}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                required
              />
            </div>
          </div>

          {/* Sandwich Policy Live Banner */}
          {isPreviewLoading && (
            <div className="p-3 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] flex items-center gap-2 text-xs text-[#6B6B6B]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#f97316]" />
              Calculating working & sandwich days...
            </div>
          )}

          {preview && !isPreviewLoading && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                preview.isSandwichApplied
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-[#fff7ed] text-[#ea580c] border-[#fed7aa]'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {preview.isSandwichApplied ? 'Sandwich Rule In Effect' : 'Standard Leave Deduction'}
                </span>
                <span className="font-mono text-sm">{preview.totalDays} Day(s) Deducted</span>
              </div>
              <p className="text-[11px] opacity-90">{preview.explanation}</p>
              {preview.sandwichDates.length > 0 && (
                <p className="text-[10px] opacity-75 font-mono">
                  Weekly-offs / holidays included: {preview.sandwichDates.join(', ')}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Reason / Notes</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide reason for time off..."
              rows={3}
              className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECE0D6]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4] border border-[#ECE0D6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !startDate || !endDate}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white disabled:opacity-50 shadow-sm"
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Request Comp-Off Modal
// ─────────────────────────────────────────────────────────
interface RequestCompOffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RequestCompOffModal: React.FC<RequestCompOffModalProps> = ({ isOpen, onClose }) => {
  const [workDate, setWorkDate] = useState(new Date().toISOString().slice(0, 10));
  const [overtimeMinutes, setOvertimeMinutes] = useState(240); // default 4h
  const [grantedDays, setGrantedDays] = useState(1.0);
  const [reason, setReason] = useState('');

  const createMutation = useCreateCompOff();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDate || !reason.trim() || overtimeMinutes < 60) return;

    createMutation.mutate(
      {
        workDate,
        overtimeMinutes: Number(overtimeMinutes),
        grantedDays: Number(grantedDays),
        reason: reason.trim(),
      },
      {
        onSuccess: () => {
          onClose();
          setReason('');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-[#ECE0D6] bg-white p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#ECE0D6]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1A1A]">Claim Compensatory Off</h3>
              <p className="text-xs text-[#6B6B6B]">Convert overtime or weekend work into leave credit</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Overtime Work Date</label>
            <input
              type="date"
              value={workDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setWorkDate(e.target.value)}
              className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Overtime Worked (min)</label>
              <input
                type="number"
                min={60}
                step={30}
                value={overtimeMinutes}
                onChange={(e) => setOvertimeMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                required
              />
              <span className="text-[10px] text-[#6B6B6B] font-mono">{fmtHM(overtimeMinutes)}</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Claim Type</label>
              <select
                value={grantedDays}
                onChange={(e) => setGrantedDays(Number(e.target.value))}
                className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
              >
                <option value={0.5}>Half Day (0.5 Day)</option>
                <option value={1.0}>Full Day (1.0 Day)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Project / Justification</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe tasks completed during overtime / weekend..."
              rows={3}
              className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECE0D6]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4] border border-[#ECE0D6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !reason.trim() || overtimeMinutes < 60}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 shadow-sm"
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit Comp-Off Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// My Leave view
// ─────────────────────────────────────────────────────────
const MyLeave: React.FC = () => {
  const { data: leaveTypes } = useLeaveTypes();
  const { data: balances, isLoading: balancesLoading } = useLeaveBalances();
  const { data: myRequests, isLoading: requestsLoading } = useLeaveRequests({
    employeeId: 'me',
  });
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showCompOffModal, setShowCompOffModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* ── Balance cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {balancesLoading
          ? [...Array(4)].map((_, i) => <div key={i} className="h-36 rounded-2xl bg-[#fff7ed] animate-pulse" />)
          : (balances || []).map((b) => {
              const pct = b.allocated > 0 ? Math.min(100, Math.round((b.used / b.allocated) * 100)) : 0;
              return (
                <div key={b._id} className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">{b.leaveType}</p>
                    <span className="text-[10px] font-bold text-[#ea580c] bg-[#fff7ed] px-2 py-0.5 rounded border border-[#fed7aa]">
                      {b.remaining}d left
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[#1A1A1A]">
                    {b.remaining}
                    <span className="text-sm text-[#9B9B9B] font-medium"> / {b.allocated} total</span>
                  </p>
                  <div className="h-2 rounded-full bg-[#FBF0E7] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#f97316] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#9B9B9B]">
                    <span>{b.used}d used</span>
                    <span>{b.allocated}d accrued/granted</span>
                  </div>
                </div>
              );
            })}
      </div>

      {/* ── Action bar & Leave requests history ── */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[#ECE0D6]">
          <div className="flex items-center gap-2">
            <CalendarOff className="w-4 h-4 text-[#f97316]" />
            <h4 className="text-sm font-semibold text-[#1A1A1A]">My Leave Requests</h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCompOffModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              Claim Comp-Off
            </button>
            <button
              type="button"
              onClick={() => setShowApplyModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Request Leave
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3 font-semibold">Leave Type</th>
                <th className="px-5 py-3 font-semibold">Date Window</th>
                <th className="px-5 py-3 font-semibold">Total Days</th>
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
                    <p className="text-xs text-[#6B6B6B] mt-1">Submit a request to take time off.</p>
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
                    <td className="px-5 py-3.5 text-xs font-mono font-semibold text-[#1A1A1A]">
                      {req.totalDays} day(s)
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#1A1A1A] max-w-sm truncate" title={req.reason}>
                      {req.reason}
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

      <ApplyLeaveModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        leaveTypes={leaveTypes || []}
      />

      <RequestCompOffModal
        isOpen={showCompOffModal}
        onClose={() => setShowCompOffModal(false)}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Leave Ledger View (Financial Audit Ledger for Balance Transactions)
// ─────────────────────────────────────────────────────────
const LeaveLedgerView: React.FC = () => {
  const currentYear = new Date().getUTCFullYear();
  const [year, setYear] = useState(currentYear);
  const [transactionType, setTransactionType] = useState('all');

  const { data: ledger, isLoading, refetch } = useLeaveLedger({
    year,
    transactionType: transactionType === 'all' ? undefined : transactionType,
  });

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            className="rounded-xl border border-[#ECE0D6] bg-white px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
          >
            <option value="all">All Transactions</option>
            {Object.entries(LEAVE_TRANSACTION_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-xl border border-[#ECE0D6] bg-white px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 self-end rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors cursor-pointer"
          title="Refresh ledger"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Leave Type</th>
                <th className="px-5 py-3 font-semibold">Transaction</th>
                <th className="px-5 py-3 font-semibold">Change</th>
                <th className="px-5 py-3 font-semibold">Balance After</th>
                <th className="px-5 py-3 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-5 rounded bg-[#fff7ed] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : !ledger || ledger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <FileText className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                    <p className="text-sm font-semibold text-[#1A1A1A]">No ledger entries</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">No balance debits or credits found for this period.</p>
                  </td>
                </tr>
              ) : (
                ledger.map((entry) => {
                  const isCredit = entry.days > 0;
                  return (
                    <tr key={entry._id} className="hover:bg-[#FBF8F4] transition-colors text-xs">
                      <td className="px-5 py-3 text-[#6B6B6B] font-mono">
                        {fmtDate(entry.effectiveDate || entry.createdAt)}
                      </td>
                      <td className="px-5 py-3 font-semibold text-[#1A1A1A]">
                        {entry.leaveTypeId?.name}
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FBF8F4] text-[#6B6B6B] border border-[#ECE0D6]">
                          {LEAVE_TRANSACTION_LABELS[entry.transactionType] || entry.transactionType}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono font-bold">
                        <span className={isCredit ? 'text-emerald-600' : 'text-rose-600'}>
                          {isCredit ? `+${entry.days}` : entry.days}d
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-[#1A1A1A]">
                        {entry.balanceAfter}d
                      </td>
                      <td className="px-5 py-3 text-[#6B6B6B] max-w-xs truncate" title={entry.notes}>
                        {entry.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Comp-Off Grants View (User self-service history)
// ─────────────────────────────────────────────────────────
const CompOffGrantsView: React.FC = () => {
  const { data: grants, isLoading, refetch } = useCompOffRequests({ employeeId: 'me' });
  const [showCompOffModal, setShowCompOffModal] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-[#1A1A1A]">My Compensatory Off Claims</h4>
        <button
          type="button"
          onClick={() => setShowCompOffModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Claim Comp-Off
        </button>
      </div>

      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3 font-semibold">Overtime Work Date</th>
                <th className="px-5 py-3 font-semibold">Overtime Hours</th>
                <th className="px-5 py-3 font-semibold">Claimed Credit</th>
                <th className="px-5 py-3 font-semibold">Expires At</th>
                <th className="px-5 py-3 font-semibold">Reason</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-5 rounded bg-[#fff7ed] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : !grants || grants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <Award className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                    <p className="text-sm font-semibold text-[#1A1A1A]">No comp-off claims</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">
                      You haven&apos;t submitted any comp-off claims against overtime yet.
                    </p>
                  </td>
                </tr>
              ) : (
                grants.map((g) => (
                  <tr key={g._id} className="hover:bg-[#FBF8F4] transition-colors text-xs">
                    <td className="px-5 py-3.5 font-medium text-[#1A1A1A]">{fmtDate(g.workDate)}</td>
                    <td className="px-5 py-3.5 font-mono text-[#f97316] font-bold">
                      {fmtHM(g.overtimeMinutes)}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-[#1A1A1A]">
                      {g.grantedDays} Day(s)
                    </td>
                    <td className="px-5 py-3.5 text-[#6B6B6B] font-mono">{fmtDate(g.expiresAt)}</td>
                    <td className="px-5 py-3.5 text-[#1A1A1A] max-w-xs truncate" title={g.reason}>
                      {g.reason}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          g.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : g.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {g.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RequestCompOffModal
        isOpen={showCompOffModal}
        onClose={() => setShowCompOffModal(false)}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Approvals Tab (manager/HR/admin only)
// ─────────────────────────────────────────────────────────
const Approvals: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const { data: requests, isLoading, isError, refetch } = useLeaveRequests(
    statusFilter ? { status: statusFilter } : {}
  );
  const reviewMutation = useReviewLeaveRequest();

  const employeeName = (req: LeaveRequest) => {
    if (typeof req.employeeId === 'object' && req.employeeId !== null) {
      return (
        req.employeeId.fullName ||
        req.employeeId.employeeCode ||
        'Employee'
      );
    }
    return 'Employee';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
          {(['pending', 'approved', 'rejected', ''] as const).map((s) => (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                statusFilter === s
                  ? 'bg-[#f97316] text-white shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 self-end rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors cursor-pointer"
          title="Refresh requests"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3 font-semibold">Employee</th>
                <th className="px-5 py-3 font-semibold">Leave Type</th>
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
                      {statusFilter
                        ? `No ${LEAVE_STATUS_LABELS[statusFilter as 'pending']?.toLowerCase()} requests.`
                        : 'Requests will appear here as employees submit them.'}
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
                    <td className="px-5 py-3.5 text-xs font-mono font-bold text-[#1A1A1A]">
                      {req.totalDays}d
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#6B6B6B] max-w-[200px] truncate" title={req.reason}>
                      {req.reason || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <LeaveStatusPill status={req.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {req.status === 'pending' ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => reviewMutation.mutate({ id: req._id, decision: 'approve' })}
                            disabled={reviewMutation.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors disabled:opacity-50 shadow-xs"
                            title="Approve"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => reviewMutation.mutate({ id: req._id, decision: 'reject' })}
                            disabled={reviewMutation.isPending}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50"
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
// Comp-Off Approvals Queue (manager/HR/admin only)
// ─────────────────────────────────────────────────────────
const CompOffQueue: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const { data: grants, isLoading, refetch } = useCompOffRequests(
    statusFilter === 'all' ? {} : { status: statusFilter }
  );
  const reviewMutation = useReviewCompOff();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                statusFilter === s
                  ? 'bg-[#f97316] text-white shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 self-end rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors cursor-pointer"
          title="Refresh queue"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3 font-semibold">Employee</th>
                <th className="px-5 py-3 font-semibold">Work Date</th>
                <th className="px-5 py-3 font-semibold">Overtime</th>
                <th className="px-5 py-3 font-semibold">Credit</th>
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
              ) : !grants || grants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <Award className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                    <p className="text-sm font-semibold text-[#1A1A1A]">No comp-off claims</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">There are no comp-off requests matching this filter.</p>
                  </td>
                </tr>
              ) : (
                grants.map((g) => {
                  const empName =
                    g.employeeId?.fullName ||
                    `${g.employeeId?.firstName || ''} ${g.employeeId?.lastName || ''}`.trim() ||
                    'Employee';
                  return (
                    <tr key={g._id} className="hover:bg-[#FBF8F4] transition-colors text-xs">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-[#1A1A1A]">{empName}</div>
                        <div className="text-[10px] text-[#6B6B6B]">{g.employeeId?.employeeCode || '—'}</div>
                      </td>
                      <td className="px-5 py-3.5 text-[#6B6B6B] font-mono">{fmtDate(g.workDate)}</td>
                      <td className="px-5 py-3.5 font-mono text-[#ea580c] font-bold">
                        {fmtHM(g.overtimeMinutes)}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-[#1A1A1A]">
                        {g.grantedDays} Day(s)
                      </td>
                      <td className="px-5 py-3.5 text-[#1A1A1A] max-w-xs truncate" title={g.reason}>
                        {g.reason}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            g.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : g.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {g.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {g.status === 'pending' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => reviewMutation.mutate({ id: g._id, decision: 'approve' })}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xs cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => reviewMutation.mutate({ id: g._id, decision: 'reject' })}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#6B6B6B] italic">
                            {g.reviewedBy?.fullName ? `By ${g.reviewedBy.fullName}` : 'Reviewed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Policy & Accruals Hub (manager/HR/admin only)
// ─────────────────────────────────────────────────────────
const PolicyAndAccruals: React.FC = () => {
  const { data: leaveTypes, isLoading, refetch } = useLeaveTypes();
  const runAccrualMutation = useRunMonthlyAccrual();
  const [isAccrualRunning, setIsAccrualRunning] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getUTCMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getUTCFullYear());

  // Edit / Create Policy State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [annualQuota, setAnnualQuota] = useState(12);
  const [accrualFrequency, setAccrualFrequency] = useState<'monthly' | 'quarterly' | 'yearly' | 'none'>('monthly');
  const [monthlyAccrualRate, setMonthlyAccrualRate] = useState(1.0);
  const [carryForward, setCarryForward] = useState(false);
  const [maxCarryForward, setMaxCarryForward] = useState(0);
  const [sandwichRuleEnabled, setSandwichRuleEnabled] = useState(false);
  const [priorNoticeDays, setPriorNoticeDays] = useState(0);
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState(15);
  const [color, setColor] = useState('#f97316');

  const createTypeMutation = useCreateLeaveType();
  const updateTypeMutation = useUpdateLeaveType();

  const handleOpenEdit = (lt: LeaveType) => {
    setEditingType(lt);
    setName(lt.name);
    setCode(lt.code || '');
    setAnnualQuota(lt.annualQuota);
    setAccrualFrequency(lt.accrualFrequency || 'monthly');
    setMonthlyAccrualRate(lt.monthlyAccrualRate || 0);
    setCarryForward(Boolean(lt.carryForward));
    setMaxCarryForward(lt.maxCarryForward || 0);
    setSandwichRuleEnabled(Boolean(lt.sandwichRuleEnabled));
    setPriorNoticeDays(lt.priorNoticeDays || 0);
    setMaxConsecutiveDays(lt.maxConsecutiveDays || 15);
    setColor(lt.color || '#f97316');
    setIsEditOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingType(null);
    setName('');
    setCode('');
    setAnnualQuota(12);
    setAccrualFrequency('monthly');
    setMonthlyAccrualRate(1.0);
    setCarryForward(false);
    setMaxCarryForward(0);
    setSandwichRuleEnabled(false);
    setPriorNoticeDays(0);
    setMaxConsecutiveDays(15);
    setColor('#f97316');
    setIsEditOpen(true);
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: LeaveTypeInput = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      annualQuota: Number(annualQuota),
      accrualFrequency,
      monthlyAccrualRate: Number(monthlyAccrualRate),
      carryForward,
      maxCarryForward: Number(maxCarryForward),
      sandwichRuleEnabled,
      priorNoticeDays: Number(priorNoticeDays),
      maxConsecutiveDays: Number(maxConsecutiveDays),
      color,
    };

    if (editingType) {
      updateTypeMutation.mutate(
        { id: editingType._id, patch: payload },
        {
          onSuccess: () => {
            setIsEditOpen(false);
            refetch();
          },
        }
      );
    } else {
      createTypeMutation.mutate(payload, {
        onSuccess: () => {
          setIsEditOpen(false);
          refetch();
        },
      });
    }
  };

  const handleRunAccrual = () => {
    if (
      window.confirm(
        `Run monthly leave accrual for Month ${selectedMonth}/${selectedYear}? This will credit prorated days to all active employees and update audit ledgers.`
      )
    ) {
      runAccrualMutation.mutate({ month: selectedMonth, year: selectedYear });
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Accrual Trigger Engine Card ── */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#fff7ed] text-[#f97316]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-[#1A1A1A]">Prorated Monthly Accruals Engine</h4>
              <p className="text-xs text-[#6B6B6B]">
                Automatically credit prorated leave balances to active staff based on join dates and leave rules
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Month {i + 1} ({new Date(2026, i).toLocaleString([], { month: 'short' })})
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleRunAccrual}
              disabled={runAccrualMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
            >
              {runAccrualMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Execute Accruals
            </button>
          </div>
        </div>
      </div>

      {/* ── Leave Policy Catalog ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-[#1A1A1A]">Leave Policy Rules & Rulesets</h4>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa] hover:bg-[#ffedd5] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Leave Type
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-[#fff7ed] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(leaveTypes || []).map((lt) => (
              <div
                key={lt._id}
                className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-5 hover:border-[#f97316]/50 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: lt.color || '#f97316' }}
                    />
                    <div>
                      <h5 className="text-sm font-bold text-[#1A1A1A]">{lt.name}</h5>
                      <span className="text-[10px] font-semibold text-[#6B6B6B] font-mono uppercase">
                        {lt.code || 'LEAVE'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(lt)}
                    className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Annual Quota:</span>
                    <span className="font-bold text-[#1A1A1A]">{lt.annualQuota} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Accrual:</span>
                    <span className="font-bold capitalize text-[#1A1A1A]">
                      {lt.accrualFrequency} ({lt.monthlyAccrualRate || 0}d/mo)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Sandwich Rule:</span>
                    <span className={lt.sandwichRuleEnabled ? 'text-amber-600 font-bold' : 'text-[#6B6B6B]'}>
                      {lt.sandwichRuleEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Carry Forward:</span>
                    <span className="font-bold text-[#1A1A1A]">
                      {lt.carryForward ? `Up to ${lt.maxCarryForward || 'All'}d` : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Policy Modal ── */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsEditOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-[#ECE0D6] bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE0D6]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#fff7ed] text-[#f97316]">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1A1A]">
                    {editingType ? 'Edit Leave Policy' : 'Create Leave Type'}
                  </h3>
                  <p className="text-xs text-[#6B6B6B]">Configure rules, sandwich policies & accruals</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Earned Leave"
                    className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. EL"
                    className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Annual Quota</label>
                  <input
                    type="number"
                    min={0}
                    value={annualQuota}
                    onChange={(e) => setAnnualQuota(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Accrual Frequency</label>
                  <select
                    value={accrualFrequency}
                    onChange={(e) => setAccrualFrequency(e.target.value as any)}
                    className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="none">None (Static)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Monthly Rate (d/mo)</label>
                  <input
                    type="number"
                    step={0.25}
                    min={0}
                    value={monthlyAccrualRate}
                    onChange={(e) => setMonthlyAccrualRate(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Advance Notice (days)</label>
                  <input
                    type="number"
                    min={0}
                    value={priorNoticeDays}
                    onChange={(e) => setPriorNoticeDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Max Consecutive Days</label>
                  <input
                    type="number"
                    min={1}
                    value={maxConsecutiveDays}
                    onChange={(e) => setMaxConsecutiveDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#ECE0D6]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sandwichRuleEnabled}
                    onChange={(e) => setSandwichRuleEnabled(e.target.checked)}
                    className="rounded text-[#f97316] focus:ring-[#f97316]"
                  />
                  <span className="text-xs font-medium text-[#1A1A1A]">
                    Enable Sandwich Rule (weekly-offs & holidays between leaves count towards deduction)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={carryForward}
                    onChange={(e) => setCarryForward(e.target.checked)}
                    className="rounded text-[#f97316] focus:ring-[#f97316]"
                  />
                  <span className="text-xs font-medium text-[#1A1A1A]">
                    Allow Carry Forward to Next Year
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ECE0D6]">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4] border border-[#ECE0D6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTypeMutation.isPending || updateTypeMutation.isPending || !name.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white disabled:opacity-50 shadow-sm"
                >
                  {createTypeMutation.isPending || updateTypeMutation.isPending ? 'Saving...' : 'Save Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Leave page — Main Shell & Enhanced View Switcher
// ─────────────────────────────────────────────────────────
export const LeavePage: React.FC = () => {
  const { user } = useAuth();
  const { can } = useModuleAccess('hrms');
  const canApprove = can('approve');
  const isManagement =
    canApprove && ['super_admin', 'admin', 'manager', 'hr'].includes(user?.role || '');

  const [tab, setTab] = useState<'mine' | 'ledger' | 'compoff' | 'approvals' | 'compoff-queue' | 'policy'>('mine');

  // Pending leaves count
  const { data: pendingRequests } = useLeaveRequests({ status: 'pending' });
  const pendingCount = isManagement && pendingRequests ? pendingRequests.length : 0;

  // Pending comp-off count
  const { data: pendingCompOffs } = useCompOffRequests({ status: 'pending' });
  const pendingCompOffCount = isManagement && pendingCompOffs ? pendingCompOffs.length : 0;

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
          <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Leave & Policy Hub</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Balances, monthly accruals, sandwich rule policies, audit ledgers & compensatory off.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] flex-wrap">
          <button
            type="button"
            onClick={() => setTab('mine')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'mine' ? 'bg-[#f97316] text-white shadow-sm' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
            }`}
          >
            <CalendarOff className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            My Leave
          </button>
          <button
            type="button"
            onClick={() => setTab('ledger')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'ledger' ? 'bg-[#f97316] text-white shadow-sm' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            Leave Ledger
          </button>
          <button
            type="button"
            onClick={() => setTab('compoff')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              tab === 'compoff' ? 'bg-[#f97316] text-white shadow-sm' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
            }`}
          >
            <Award className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            Comp-Off
          </button>

          {isManagement && (
            <>
              <button
                type="button"
                onClick={() => setTab('approvals')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer relative ${
                  tab === 'approvals' ? 'bg-[#f97316] text-white shadow-sm' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                <Check className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                Approvals
                {pendingCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setTab('compoff-queue')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer relative ${
                  tab === 'compoff-queue' ? 'bg-[#f97316] text-white shadow-sm' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                <Award className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                Comp-Off Queue
                {pendingCompOffCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                    {pendingCompOffCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setTab('policy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  tab === 'policy' ? 'bg-[#f97316] text-white shadow-sm' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                Policy & Accruals
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'mine' && <MyLeave />}
          {tab === 'ledger' && <LeaveLedgerView />}
          {tab === 'compoff' && <CompOffGrantsView />}
          {tab === 'approvals' && <Approvals />}
          {tab === 'compoff-queue' && <CompOffQueue />}
          {tab === 'policy' && <PolicyAndAccruals />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default LeavePage;
