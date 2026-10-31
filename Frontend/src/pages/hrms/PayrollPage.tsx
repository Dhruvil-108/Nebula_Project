import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  Users,
  Building2,
  Landmark,
  ShieldCheck,
  TrendingUp,
  X,
  CreditCard,
  Check,
  Send,
  Eye,
  Edit3,
  Loader2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  usePayrollRuns,
  usePayrollRun,
  useCreatePayrollRun,
  useApprovePayrollRun,
  useMarkPayrollPaid,
  useUpdatePayslipLineItem,
  useMyPayslips,
  useEmployees,
  useSalaryStructure,
  useUpsertSalaryStructure,
} from '../../hooks/useHrms';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { useAuth } from '../../contexts/AuthContext';
import { hrmsApi } from '../../lib/hrmsApi';
import { FloatingDropdown } from '../../components/ui/FloatingDropdown';
import type { PayrollRun, Payslip, PayrollRunStatus } from '../../types/hrms';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const PayrollPage: React.FC = () => {
  const { can } = useModuleAccess('hrms');
  const { user } = useAuth();
  const isManagement = can('edit') || can('approve') || ['super_admin', 'admin', 'hr'].includes(user?.role || '');

  const [activeTab, setActiveTab] = useState<'runs' | 'payslips' | 'structures' | 'my_slips'>(
    isManagement ? 'runs' : 'my_slips'
  );

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState<PayrollRun | null>(null);
  const [viewingPayslip, setViewingPayslip] = useState<Payslip | null>(null);
  const [adjustingSlip, setAdjustingSlip] = useState<Payslip | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    notes: '',
  });

  const [payForm, setPayForm] = useState({
    paymentReference: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });

  const [adjustmentForm, setAdjustmentForm] = useState({
    performanceBonus: 0,
    reimbursements: 0,
    otherEarnings: 0,
    otherDeductions: 0,
    remarks: '',
  });

  // Salary Structure tab state
  const [selectedStructureEmpId, setSelectedStructureEmpId] = useState<string>('');
  const [structureCtcInput, setStructureCtcInput] = useState<string>('90000');

  // Search & Filter
  const [slipSearch, setSlipSearch] = useState('');

  // Queries
  const { data: runs, isLoading: runsLoading, refetch: refetchRuns } = usePayrollRuns();
  const { data: runDetails, isLoading: runDetailsLoading, refetch: refetchRunDetails } = usePayrollRun(selectedRunId);
  const { data: myPayslips, isLoading: mySlipsLoading } = useMyPayslips();
  const { data: employees } = useEmployees();
  const { data: employeeStructure, isLoading: structureLoading } = useSalaryStructure(selectedStructureEmpId || null);

  // Mutations
  const createRunMutation = useCreatePayrollRun();
  const approveRunMutation = useApprovePayrollRun();
  const markPaidMutation = useMarkPayrollPaid();
  const updateSlipMutation = useUpdatePayslipLineItem();
  const upsertStructureMutation = useUpsertSalaryStructure();

  // Auto-select latest run if none selected
  React.useEffect(() => {
    if (runs && runs.length > 0 && !selectedRunId) {
      setSelectedRunId(runs[0]._id);
    }
  }, [runs, selectedRunId]);

  // Sync adjustment form when slip selected
  React.useEffect(() => {
    if (adjustingSlip) {
      setAdjustmentForm({
        performanceBonus: adjustingSlip.earnings?.performanceBonus || 0,
        reimbursements: adjustingSlip.earnings?.reimbursements || 0,
        otherEarnings: adjustingSlip.earnings?.otherEarnings || 0,
        otherDeductions: adjustingSlip.deductions?.otherDeductions || 0,
        remarks: adjustingSlip.remarks || '',
      });
    }
  }, [adjustingSlip]);

  const handleCreateRun = (e: React.FormEvent) => {
    e.preventDefault();
    createRunMutation.mutate(createForm, {
      onSuccess: (data) => {
        setShowCreateModal(false);
        if (data.payrollRun?._id) {
          setSelectedRunId(data.payrollRun._id);
          setActiveTab('payslips');
        }
      },
    });
  };

  const handleDisburseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPayModal) return;
    markPaidMutation.mutate(
      {
        id: showPayModal._id,
        payload: {
          paymentReference: payForm.paymentReference || `ACH-TX-${Date.now()}`,
          paymentDate: payForm.paymentDate,
        },
      },
      {
        onSuccess: () => {
          setShowPayModal(null);
        },
      }
    );
  };

  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingSlip) return;
    updateSlipMutation.mutate(
      {
        id: adjustingSlip._id,
        patch: adjustmentForm,
      },
      {
        onSuccess: () => {
          setAdjustingSlip(null);
        },
      }
    );
  };

  const handleSaveStructure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStructureEmpId) return;
    const ctc = Number(structureCtcInput);
    if (!ctc) return;

    const monthly = Math.round(ctc / 12);
    const basic = Math.round(monthly * 0.5);
    const hra = Math.round(monthly * 0.2);
    const conveyance = 1600;
    const medical = 1250;
    const special = Math.max(0, monthly - (basic + hra + conveyance + medical));
    const pf = Math.round(basic * 0.12);
    const pt = 200;
    const tds = Math.round(monthly * 0.1);

    upsertStructureMutation.mutate({
      employeeId: selectedStructureEmpId,
      input: {
        annualCtc: ctc,
        templateName: 'Custom CTC Structure',
        currency: 'USD',
        earnings: {
          basic,
          hra,
          conveyance,
          medicalAllowance: medical,
          specialAllowance: special,
        },
        deductions: {
          providentFund: pf,
          professionalTax: pt,
          incomeTaxTds: tds,
        },
      },
    });
  };

  // Filtered payslips
  const filteredSlips = (runDetails?.payslips || []).filter((s) => {
    if (!slipSearch.trim()) return true;
    const term = slipSearch.toLowerCase();
    return (
      s.employeeId?.fullName?.toLowerCase().includes(term) ||
      s.employeeId?.employeeCode?.toLowerCase().includes(term) ||
      s.slipCode?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status: PayrollRunStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
            Disbursed / Paid
          </span>
        );
      case 'approved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
            Approved & Published
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa]">
            Draft Calculation
          </span>
        );
    }
  };

  const inputCls =
    'w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all';

  return (
    <div className="hrms-payroll-page p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto select-none">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Enterprise Payroll Engine</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa]">
              Attendance & LOP Synced
            </span>
          </div>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Automated monthly salary calculation, statutory deductions (PF, PT, TDS), and branded payslip generation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              refetchRuns();
              if (selectedRunId) refetchRunDetails();
            }}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors cursor-pointer"
            title="Refresh Payroll"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {isManagement && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Run Monthly Payroll
            </button>
          )}
        </div>
      </motion.div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-[#ECE0D6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B6B] mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Gross Payroll Batch</span>
            <DollarSign className="w-4 h-4 text-[#f97316]" />
          </div>
          <div className="text-2xl font-extrabold text-[#1A1A1A] font-mono">
            {runDetails?.totalGrossPay !== undefined
              ? `$${runDetails.totalGrossPay.toLocaleString()}`
              : runs?.[0]?.totalGrossPay
                ? `$${runs[0].totalGrossPay.toLocaleString()}`
                : '$0'}
          </div>
          <p className="text-[10px] text-[#6B6B6B] mt-0.5">
            {runDetails?.totalEmployees || runs?.[0]?.totalEmployees || 0} employees included
          </p>
        </div>

        <div className="rounded-2xl border border-[#ECE0D6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B6B] mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Statutory Deductions</span>
            <ShieldCheck className="w-4 h-4 text-[#f97316]" />
          </div>
          <div className="text-2xl font-extrabold text-[#1A1A1A] font-mono">
            {runDetails?.totalDeductions !== undefined
              ? `$${runDetails.totalDeductions.toLocaleString()}`
              : runs?.[0]?.totalDeductions
                ? `$${runs[0].totalDeductions.toLocaleString()}`
                : '$0'}
          </div>
          <p className="text-[10px] text-[#6B6B6B] mt-0.5">PF, PT & Income Tax Withholdings</p>
        </div>

        <div className="rounded-2xl border border-[#ECE0D6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B6B] mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Net Take-Home Pay</span>
            <Landmark className="w-4 h-4 text-[#16a34a]" />
          </div>
          <div className="text-2xl font-extrabold text-[#16a34a] font-mono">
            {runDetails?.totalNetPay !== undefined
              ? `$${runDetails.totalNetPay.toLocaleString()}`
              : runs?.[0]?.totalNetPay
                ? `$${runs[0].totalNetPay.toLocaleString()}`
                : '$0'}
          </div>
          <p className="text-[10px] text-[#6B6B6B] mt-0.5">Total direct deposit transfer value</p>
        </div>

        <div className="rounded-2xl border border-[#ECE0D6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B6B] mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Loss of Pay (LOP) Days</span>
            <Clock className="w-4 h-4 text-[#dc2626]" />
          </div>
          <div className="text-2xl font-extrabold text-[#dc2626] font-mono">
            {runDetails?.totalLopDays !== undefined
              ? `${runDetails.totalLopDays} days`
              : runs?.[0]?.totalLopDays
                ? `${runs[0].totalLopDays} days`
                : '0 days'}
          </div>
          <p className="text-[10px] text-[#6B6B6B] mt-0.5">Automated attendance deductions</p>
        </div>
      </div>

      {/* ── Module Tabs Bar ── */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] overflow-x-auto">
        {isManagement && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('runs')}
              className={`py-2 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'runs' ? 'bg-[#f97316] text-white shadow-xs' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              Payroll Runs ({runs?.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payslips')}
              className={`py-2 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'payslips' ? 'bg-[#f97316] text-white shadow-xs' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              Active Batch Payslips ({filteredSlips.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('structures')}
              className={`py-2 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'structures' ? 'bg-[#f97316] text-white shadow-xs' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              Salary Structures & CTC
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setActiveTab('my_slips')}
          className={`py-2 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'my_slips' ? 'bg-[#f97316] text-white shadow-xs' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
          }`}
        >
          My Payslips ({myPayslips?.length ?? 0})
        </button>
      </div>

      {/* ── TAB 1: PAYROLL RUNS (BATCH OVERVIEW) ── */}
      {activeTab === 'runs' && (
        <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                  <th className="px-5 py-3 font-semibold">Run Code</th>
                  <th className="px-5 py-3 font-semibold">Pay Period</th>
                  <th className="px-5 py-3 font-semibold">Headcount</th>
                  <th className="px-5 py-3 font-semibold">Gross Batch</th>
                  <th className="px-5 py-3 font-semibold">Deductions</th>
                  <th className="px-5 py-3 font-semibold">Net Payout</th>
                  <th className="px-5 py-3 font-semibold">LOP Days</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EDE4]">
                {runsLoading ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={9} className="px-5 py-4">
                        <div className="h-5 rounded bg-[#fff7ed] animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : !runs || runs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-14 text-center">
                      <DollarSign className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                      <p className="text-sm font-medium text-[#1A1A1A]">No payroll runs executed yet</p>
                      <p className="text-xs text-[#6B6B6B] mt-1">
                        Click "Run Monthly Payroll" above to generate your first automated pay period.
                      </p>
                    </td>
                  </tr>
                ) : (
                  runs.map((run) => (
                    <tr
                      key={run._id}
                      onClick={() => {
                        setSelectedRunId(run._id);
                        setActiveTab('payslips');
                      }}
                      className="hover:bg-[#FBF8F4] cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3.5 text-xs font-mono font-bold text-[#f97316]">{run.runCode}</td>
                      <td className="px-5 py-3.5 font-medium text-[#1A1A1A]">
                        {MONTH_NAMES[run.month - 1]} {run.year}
                      </td>
                      <td className="px-5 py-3.5 text-[#6B6B6B]">{run.totalEmployees} employees</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-[#1A1A1A]">${run.totalGrossPay.toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-[#dc2626]">${run.totalDeductions.toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#16a34a]">${run.totalNetPay.toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-[#dc2626]">{run.totalLopDays || 0}d</td>
                      <td className="px-5 py-3.5">{getStatusBadge(run.status)}</td>
                      <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          {run.status === 'draft' && (
                            <button
                              type="button"
                              onClick={() => approveRunMutation.mutate(run._id)}
                              disabled={approveRunMutation.isPending}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors cursor-pointer"
                              title="Approve & Publish to Employee Portal"
                            >
                              Approve
                            </button>
                          )}
                          {run.status === 'approved' && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowPayModal(run);
                                setPayForm({
                                  paymentReference: `ACH-${run.runCode}-${Date.now().toString().slice(-4)}`,
                                  paymentDate: new Date().toISOString().split('T')[0],
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#16a34a] text-white hover:bg-[#15803d] transition-colors cursor-pointer"
                              title="Record Disbursement"
                            >
                              Disburse
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRunId(run._id);
                              setActiveTab('payslips');
                            }}
                            className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors cursor-pointer"
                            title="View payslips"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: ACTIVE BATCH PAYSLIPS ── */}
      {activeTab === 'payslips' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-[#ECE0D6] shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#6B6B6B]">Selected Batch:</span>
              <FloatingDropdown
                value={selectedRunId || ''}
                onChange={(val) => setSelectedRunId(val)}
                options={(runs || []).map((r) => ({
                  value: r._id,
                  label: `${r.runCode} · ${MONTH_NAMES[r.month - 1]} ${r.year} (${r.status.toUpperCase()})`,
                }))}
                fullWidth={false}
                className="w-64"
              />
              {runDetails && getStatusBadge(runDetails.status)}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#9B9B9B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter employee or code..."
                value={slipSearch}
                onChange={(e) => setSlipSearch(e.target.value)}
                className={`${inputCls} pl-9 py-1.5 text-xs`}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                    <th className="px-5 py-3 font-semibold">Slip Code</th>
                    <th className="px-5 py-3 font-semibold">Employee</th>
                    <th className="px-5 py-3 font-semibold">Payable / LOP</th>
                    <th className="px-5 py-3 font-semibold">Gross Pay</th>
                    <th className="px-5 py-3 font-semibold">Deductions</th>
                    <th className="px-5 py-3 font-semibold">Net Pay</th>
                    <th className="px-5 py-3 font-semibold">Disbursement</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EDE4]">
                  {runDetailsLoading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={8} className="px-5 py-4">
                          <div className="h-5 rounded bg-[#fff7ed] animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : filteredSlips.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-[#6B6B6B] text-xs">
                        No payslips found matching this criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSlips.map((slip) => (
                      <tr key={slip._id} className="hover:bg-[#FBF8F4] transition-colors">
                        <td className="px-5 py-3.5 text-xs font-mono font-semibold text-[#f97316]">{slip.slipCode}</td>
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-[#1A1A1A]">{slip.employeeId?.fullName || 'Employee'}</p>
                          <p className="text-[11px] text-[#6B6B6B]">
                            {slip.employeeId?.employeeCode} · {slip.designationSnapshot || 'Staff'}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs">
                          <span className="text-[#1A1A1A] font-semibold">{slip.attendanceSummary?.payableDays}d</span>
                          {(slip.attendanceSummary?.lopDays ?? 0) > 0 && (
                            <span className="text-[#dc2626] font-medium ml-1">({slip.attendanceSummary?.lopDays}d LOP)</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-[#1A1A1A]">${slip.earnings.grossEarnings?.toLocaleString()}</td>
                        <td className="px-5 py-3.5 font-mono text-xs text-[#dc2626]">${slip.deductions.totalDeductions?.toLocaleString()}</td>
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#16a34a]">${slip.netPay.toLocaleString()}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              slip.paymentStatus === 'paid'
                                ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]'
                                : 'bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa]'
                            }`}
                          >
                            {slip.paymentStatus}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingPayslip(slip)}
                              className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors cursor-pointer"
                              title="View Payslip Modal"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {runDetails?.status !== 'paid' && (
                              <button
                                type="button"
                                onClick={() => setAdjustingSlip(slip)}
                                className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#f97316] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors cursor-pointer"
                                title="Adjust line items (bonus / deduction)"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <a
                              href={hrmsApi.getPayslipPdfUrl(slip._id)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-[#f97316] hover:bg-[#fff7ed] border border-[#fed7aa] transition-colors cursor-pointer"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: SALARY STRUCTURES & CTC CONFIG ── */}
      {activeTab === 'structures' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 rounded-2xl border border-[#ECE0D6] bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#f97316]" /> Select Employee
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              Configure employee cost-to-company (CTC) and automated salary component percentages.
            </p>

            <FloatingDropdown
              label="Select Employee Profile"
              value={selectedStructureEmpId}
              onChange={(val) => {
                setSelectedStructureEmpId(val);
                const emp = employees?.find((e) => e._id === val);
                if (emp?.grade) {
                  const defaultCtc = emp.grade === 'L1' ? '45000' : emp.grade === 'L3' ? '95000' : emp.grade === 'L4' ? '130000' : '65000';
                  setStructureCtcInput(defaultCtc);
                }
              }}
              options={(employees || []).map((e) => ({
                value: e._id,
                label: `${e.fullName} (${e.employeeCode} · ${e.grade || 'L2'})`,
              }))}
              searchable={true}
            />

            {selectedStructureEmpId && (
              <form onSubmit={handleSaveStructure} className="space-y-4 pt-3 border-t border-[#ECE0D6]">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                    Annual Gross CTC ($ USD)
                  </label>
                  <input
                    type="number"
                    required
                    value={structureCtcInput}
                    onChange={(e) => setStructureCtcInput(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. 90000"
                  />
                  <span className="text-[10px] text-[#6B6B6B] block mt-1">
                    Monthly CTC: ${Math.round(Number(structureCtcInput || 0) / 12).toLocaleString()}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={upsertStructureMutation.isPending}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {upsertStructureMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save & Recompute Structure
                </button>
              </form>
            )}
          </div>

          <div className="lg:col-span-8 rounded-2xl border border-[#ECE0D6] bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#f97316]" /> Component Breakdown Schedule
            </h3>

            {!selectedStructureEmpId ? (
              <div className="py-16 text-center text-[#6B6B6B] text-xs">
                Select an employee from the left panel to inspect their active CTC breakdown.
              </div>
            ) : structureLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#f97316] mx-auto" />
              </div>
            ) : !employeeStructure ? (
              <div className="py-16 text-center text-[#6B6B6B] text-xs">
                No active salary structure found for this employee. Submit the form on the left to initialize.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
                  <div>
                    <span className="text-[11px] text-[#6B6B6B] block">Annual CTC</span>
                    <p className="text-base font-mono font-bold text-[#1A1A1A]">
                      ${employeeStructure.annualCtc?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#6B6B6B] block">Monthly CTC</span>
                    <p className="text-base font-mono font-bold text-[#f97316]">
                      ${employeeStructure.monthlyCtc?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#6B6B6B] block">Pay Band Template</span>
                    <p className="text-xs font-semibold text-[#1A1A1A] mt-1">{employeeStructure.templateName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-[#ECE0D6] bg-white space-y-2">
                    <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider text-[#ea580c]">
                      Earnings Schedule
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#F3EDE4]">
                        <span className="text-[#6B6B6B]">Basic Salary (50%)</span>
                        <span className="font-mono font-semibold">${employeeStructure.earnings?.basic?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#F3EDE4]">
                        <span className="text-[#6B6B6B]">House Rent Allowance (HRA 20%)</span>
                        <span className="font-mono font-semibold">${employeeStructure.earnings?.hra?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#F3EDE4]">
                        <span className="text-[#6B6B6B]">Special Allowance</span>
                        <span className="font-mono font-semibold">${employeeStructure.earnings?.specialAllowance?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#F3EDE4]">
                        <span className="text-[#6B6B6B]">Conveyance Allowance</span>
                        <span className="font-mono font-semibold">${employeeStructure.earnings?.conveyance?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-[#6B6B6B]">Medical Allowance</span>
                        <span className="font-mono font-semibold">${employeeStructure.earnings?.medicalAllowance?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-[#ECE0D6] bg-white space-y-2">
                    <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider text-[#6B6B6B]">
                      Statutory Deductions
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#F3EDE4]">
                        <span className="text-[#6B6B6B]">Provident Fund (PF 12%)</span>
                        <span className="font-mono font-semibold text-[#dc2626]">${employeeStructure.deductions?.providentFund?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#F3EDE4]">
                        <span className="text-[#6B6B6B]">Professional Tax (PT)</span>
                        <span className="font-mono font-semibold text-[#dc2626]">${employeeStructure.deductions?.professionalTax?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#F3EDE4]">
                        <span className="text-[#6B6B6B]">Income Tax / TDS (Estimated)</span>
                        <span className="font-mono font-semibold text-[#dc2626]">${employeeStructure.deductions?.incomeTaxTds?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: MY PAYSLIPS (EMPLOYEE SELF-SERVICE) ── */}
      {activeTab === 'my_slips' && (
        <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1A1A1A]">My Confidential Pay Slips</h3>
              <p className="text-xs text-[#6B6B6B]">View published salary advice and download official signed PDFs</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                  <th className="px-5 py-3 font-semibold">Slip Reference</th>
                  <th className="px-5 py-3 font-semibold">Period</th>
                  <th className="px-5 py-3 font-semibold">Days Paid</th>
                  <th className="px-5 py-3 font-semibold">Gross Earnings</th>
                  <th className="px-5 py-3 font-semibold">Total Deductions</th>
                  <th className="px-5 py-3 font-semibold">Net Pay</th>
                  <th className="px-5 py-3 font-semibold">Payment Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EDE4]">
                {mySlipsLoading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="px-5 py-4">
                        <div className="h-5 rounded bg-[#fff7ed] animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : !myPayslips || myPayslips.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-[#6B6B6B] text-xs">
                      No published payslips are available for your account yet.
                    </td>
                  </tr>
                ) : (
                  myPayslips.map((slip) => (
                    <tr key={slip._id} className="hover:bg-[#FBF8F4] transition-colors">
                      <td className="px-5 py-3.5 text-xs font-mono font-bold text-[#f97316]">{slip.slipCode}</td>
                      <td className="px-5 py-3.5 font-medium text-[#1A1A1A]">
                        {MONTH_NAMES[slip.month - 1]} {slip.year}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-[#1A1A1A]">
                        {slip.attendanceSummary?.payableDays} days
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-[#1A1A1A]">${slip.earnings?.grossEarnings?.toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-[#dc2626]">${slip.deductions?.totalDeductions?.toLocaleString()}</td>
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-[#16a34a]">${slip.netPay.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
                          {slip.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingPayslip(slip)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1A1A1A] hover:bg-[#FBF8F4] border border-[#ECE0D6] transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#f97316]" /> View
                          </button>
                          <a
                            href={hrmsApi.getPayslipPdfUrl(slip._id)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#f97316] hover:bg-[#ea580c] transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CREATE RUN MODAL ── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-md rounded-2xl bg-white border border-[#ECE0D6] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4]">
                <div>
                  <h3 className="text-base font-bold text-[#1A1A1A]">Execute Monthly Payroll Run</h3>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">Automated calculation with attendance and LOP sync</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg text-[#6B6B6B] hover:bg-[#fff7ed] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateRun} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Month</label>
                    <FloatingDropdown
                      value={String(createForm.month)}
                      onChange={(val) => setCreateForm({ ...createForm, month: Number(val) })}
                      options={MONTH_NAMES.map((name, i) => ({
                        value: String(i + 1),
                        label: name,
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Year</label>
                    <input
                      type="number"
                      required
                      value={createForm.year}
                      onChange={(e) => setCreateForm({ ...createForm, year: Number(e.target.value) })}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Audit Run Notes (optional)</label>
                  <textarea
                    rows={2}
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                    className={inputCls}
                    placeholder="Regular monthly payroll batch..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#ECE0D6]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#ECE0D6] hover:bg-[#fff7ed] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createRunMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {createRunMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Calculate & Generate Draft
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DISBURSE / RECORD PAYMENT MODAL ── */}
      <AnimatePresence>
        {showPayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setShowPayModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-md rounded-2xl bg-white border border-[#ECE0D6] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4]">
                <div>
                  <h3 className="text-base font-bold text-[#1A1A1A]">Disburse Payroll Batch</h3>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">{showPayModal.runCode} · Net: ${showPayModal.totalNetPay.toLocaleString()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPayModal(null)}
                  className="p-1.5 rounded-lg text-[#6B6B6B] hover:bg-[#fff7ed] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleDisburseSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                    Bank / ACH Transfer Reference ID <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    required
                    value={payForm.paymentReference}
                    onChange={(e) => setPayForm({ ...payForm, paymentReference: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. ACH-BATCH-202610-0928"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Settlement / Payment Date</label>
                  <input
                    type="date"
                    required
                    value={payForm.paymentDate}
                    onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#ECE0D6]">
                  <button
                    type="button"
                    onClick={() => setShowPayModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#ECE0D6] hover:bg-[#fff7ed] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={markPaidMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-[#16a34a] hover:bg-[#15803d] text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {markPaidMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Confirm Disbursement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ADJUST LINE ITEM MODAL ── */}
      <AnimatePresence>
        {adjustingSlip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setAdjustingSlip(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-md rounded-2xl bg-white border border-[#ECE0D6] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4]">
                <div>
                  <h3 className="text-base font-bold text-[#1A1A1A]">Adjust Draft Payslip</h3>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    {adjustingSlip.employeeId?.fullName} ({adjustingSlip.slipCode})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAdjustingSlip(null)}
                  className="p-1.5 rounded-lg text-[#6B6B6B] hover:bg-[#fff7ed] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAdjustmentSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Performance Bonus ($)</label>
                    <input
                      type="number"
                      value={adjustmentForm.performanceBonus}
                      onChange={(e) =>
                        setAdjustmentForm({ ...adjustmentForm, performanceBonus: Number(e.target.value) })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Reimbursements ($)</label>
                    <input
                      type="number"
                      value={adjustmentForm.reimbursements}
                      onChange={(e) =>
                        setAdjustmentForm({ ...adjustmentForm, reimbursements: Number(e.target.value) })
                      }
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Other Earnings ($)</label>
                    <input
                      type="number"
                      value={adjustmentForm.otherEarnings}
                      onChange={(e) =>
                        setAdjustmentForm({ ...adjustmentForm, otherEarnings: Number(e.target.value) })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Custom Deductions ($)</label>
                    <input
                      type="number"
                      value={adjustmentForm.otherDeductions}
                      onChange={(e) =>
                        setAdjustmentForm({ ...adjustmentForm, otherDeductions: Number(e.target.value) })
                      }
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Adjustment Remarks</label>
                  <input
                    value={adjustmentForm.remarks}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, remarks: e.target.value })}
                    className={inputCls}
                    placeholder="Q3 Performance reward / travel settlement..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#ECE0D6]">
                  <button
                    type="button"
                    onClick={() => setAdjustingSlip(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#ECE0D6] hover:bg-[#fff7ed] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateSlipMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {updateSlipMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Update Payslip
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── HIGH-FIDELITY PAYSLIP MODAL / VIEW ── */}
      <AnimatePresence>
        {viewingPayslip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setViewingPayslip(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-2xl rounded-2xl bg-white border border-[#ECE0D6] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex-shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#f97316]" />
                  <h3 className="text-base font-bold text-[#1A1A1A]">Salary Advice Statement</h3>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={hrmsApi.getPayslipPdfUrl(viewingPayslip._id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </a>
                  <button
                    type="button"
                    onClick={() => setViewingPayslip(null)}
                    className="p-1.5 rounded-lg text-[#6B6B6B] hover:bg-[#fff7ed] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto">
                {/* Header Information Strip */}
                <div className="flex items-start justify-between pb-4 border-b border-[#ECE0D6]">
                  <div>
                    <h2 className="text-lg font-extrabold text-[#f97316] tracking-tight">NEBULA HUB</h2>
                    <p className="text-xs text-[#6B6B6B] font-medium">Enterprise Human Resource Operations</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[#1A1A1A] block">
                      {MONTH_NAMES[viewingPayslip.month - 1]} {viewingPayslip.year}
                    </span>
                    <span className="text-[10px] font-mono text-[#9B9B9B]">{viewingPayslip.slipCode}</span>
                  </div>
                </div>

                {/* Employee Dossier Strip */}
                <div className="grid grid-cols-2 gap-3 text-xs p-3.5 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
                  <div>
                    <span className="text-[#6B6B6B] block text-[10px]">Employee Name:</span>
                    <span className="font-bold text-[#1A1A1A]">{viewingPayslip.employeeId?.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block text-[10px]">Employee Code:</span>
                    <span className="font-mono font-bold text-[#f97316]">{viewingPayslip.employeeId?.employeeCode}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block text-[10px]">Designation:</span>
                    <span className="font-medium text-[#1A1A1A]">{viewingPayslip.designationSnapshot || 'Staff'}</span>
                  </div>
                  <div>
                    <span className="text-[#6B6B6B] block text-[10px]">Bank Account:</span>
                    <span className="font-mono text-[#1A1A1A]">
                      {viewingPayslip.bankDetailsSnapshot?.accountNumberMasked || 'Direct Deposit'}
                    </span>
                  </div>
                </div>

                {/* Attendance Summary Strip */}
                <div className="grid grid-cols-4 gap-2 text-center p-3 rounded-xl bg-white border border-[#ECE0D6]">
                  <div>
                    <span className="text-[10px] text-[#6B6B6B] block">Total Days</span>
                    <span className="text-xs font-mono font-bold text-[#1A1A1A]">
                      {viewingPayslip.attendanceSummary?.totalDaysInMonth}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B6B6B] block">Payable Days</span>
                    <span className="text-xs font-mono font-bold text-[#16a34a]">
                      {viewingPayslip.attendanceSummary?.payableDays}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B6B6B] block">Paid Leaves</span>
                    <span className="text-xs font-mono font-bold text-[#1A1A1A]">
                      {viewingPayslip.attendanceSummary?.paidLeaveDays || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B6B6B] block">LOP Days</span>
                    <span className="text-xs font-mono font-bold text-[#dc2626]">
                      {viewingPayslip.attendanceSummary?.lopDays || 0}
                    </span>
                  </div>
                </div>

                {/* Two-column Earnings vs Deductions */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Earnings */}
                  <div className="border border-[#ECE0D6] rounded-xl overflow-hidden">
                    <div className="bg-[#f97316] px-3 py-2 text-white font-bold text-xs flex justify-between">
                      <span>Earnings</span>
                      <span>Amount</span>
                    </div>
                    <div className="p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#F3EDE4]">
                        <span className="text-[#6B6B6B]">Basic Salary</span>
                        <span className="font-mono font-semibold">${viewingPayslip.earnings?.basic?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#F3EDE4]">
                        <span className="text-[#6B6B6B]">HRA</span>
                        <span className="font-mono font-semibold">${viewingPayslip.earnings?.hra?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#F3EDE4]">
                        <span className="text-[#6B6B6B]">Special Allowance</span>
                        <span className="font-mono font-semibold">${viewingPayslip.earnings?.specialAllowance?.toLocaleString()}</span>
                      </div>
                      {(viewingPayslip.earnings?.performanceBonus ?? 0) > 0 && (
                        <div className="flex justify-between py-1 border-b border-[#F3EDE4]">
                          <span className="text-[#6B6B6B]">Performance Bonus</span>
                          <span className="font-mono font-semibold text-[#16a34a]">${viewingPayslip.earnings?.performanceBonus?.toLocaleString()}</span>
                        </div>
                      )}
                      {(viewingPayslip.earnings?.reimbursements ?? 0) > 0 && (
                        <div className="flex justify-between py-1 border-b border-[#F3EDE4]">
                          <span className="text-[#6B6B6B]">Reimbursements</span>
                          <span className="font-mono font-semibold text-[#16a34a]">${viewingPayslip.earnings?.reimbursements?.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 font-bold text-[#1A1A1A]">
                        <span>Gross Earnings</span>
                        <span className="font-mono">${viewingPayslip.earnings?.grossEarnings?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="border border-[#ECE0D6] rounded-xl overflow-hidden">
                    <div className="bg-[#6B6B6B] px-3 py-2 text-white font-bold text-xs flex justify-between">
                      <span>Deductions</span>
                      <span>Amount</span>
                    </div>
                    <div className="p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#F3EDE4]">
                        <span className="text-[#6B6B6B]">Provident Fund (PF)</span>
                        <span className="font-mono font-semibold text-[#dc2626]">${viewingPayslip.deductions?.providentFund?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#F3EDE4]">
                        <span className="text-[#6B6B6B]">Professional Tax (PT)</span>
                        <span className="font-mono font-semibold text-[#dc2626]">${viewingPayslip.deductions?.professionalTax?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#F3EDE4]">
                        <span className="text-[#6B6B6B]">Income Tax / TDS</span>
                        <span className="font-mono font-semibold text-[#dc2626]">${viewingPayslip.deductions?.incomeTaxTds?.toLocaleString()}</span>
                      </div>
                      {(viewingPayslip.deductions?.otherDeductions ?? 0) > 0 && (
                        <div className="flex justify-between py-1 border-b border-[#F3EDE4]">
                          <span className="text-[#6B6B6B]">Other Deductions</span>
                          <span className="font-mono font-semibold text-[#dc2626]">${viewingPayslip.deductions?.otherDeductions?.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 font-bold text-[#dc2626]">
                        <span>Total Deductions</span>
                        <span className="font-mono">${viewingPayslip.deductions?.totalDeductions?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Pay Callout */}
                <div className="p-4 rounded-xl bg-[#fff7ed] border border-[#fed7aa] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider block">
                      Net Take-Home Pay
                    </span>
                    <span className="text-2xl font-extrabold text-[#f97316] font-mono">
                      ${viewingPayslip.netPay?.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-[#16a34a] bg-[#f0fdf4] px-2.5 py-1 rounded-full border border-[#bbf7d0]">
                      Status: {viewingPayslip.paymentStatus.toUpperCase()}
                    </span>
                    {viewingPayslip.paymentReference && (
                      <p className="text-[10px] text-[#6B6B6B] font-mono mt-1">Ref: {viewingPayslip.paymentReference}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PayrollPage;
