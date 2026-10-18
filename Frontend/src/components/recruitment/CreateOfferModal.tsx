import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Award,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Calculator,
  FileText,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { useCreateOffer } from '../../hooks/useRecruitment';
import type { Candidate, JobOpening } from '../../types/recruitment';
import { FloatingDropdown } from '../ui/FloatingDropdown';

interface CreateOfferModalProps {
  open: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

export const CreateOfferModal: React.FC<CreateOfferModalProps> = ({
  open,
  onClose,
  candidate,
}) => {
  const createOfferMutation = useCreateOffer();
  const [activeTab, setActiveTab] = useState<'terms' | 'compensation' | 'governance'>('terms');

  // Load departments from HRMS
  const { data: departments } = useQuery<{ _id: string; name: string }[]>({
    queryKey: ['hr', 'departments'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/hr/departments');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const jobObj = typeof candidate?.jobOpeningId === 'object' ? (candidate?.jobOpeningId as JobOpening) : null;
  const jobDeptId =
    jobObj
      ? typeof jobObj.departmentId === 'object'
        ? (jobObj.departmentId as any)._id
        : jobObj.departmentId
      : '';

  const jobTitle = jobObj?.title || '';
  const bandMin = jobObj?.salaryRange?.min || 0;
  const bandMax = jobObj?.salaryRange?.max || 0;
  const bandCurrency = jobObj?.salaryRange?.currency || 'USD';

  const defaultJoining = new Date();
  defaultJoining.setDate(defaultJoining.getDate() + 30);

  const defaultValidity = new Date();
  defaultValidity.setDate(defaultValidity.getDate() + 7);

  const [form, setForm] = useState({
    designation: jobTitle || '',
    departmentId: jobDeptId || '',
    currency: bandCurrency || 'USD',
    joiningDate: defaultJoining.toISOString().split('T')[0],
    validUntil: defaultValidity.toISOString().split('T')[0],
    benefitsInput: 'Comprehensive Health & Dental, 401(k) / Provident Fund matching, Annual Learning Stipend ($1,500), 25 Days Annual Paid Leave',
    notes: 'Offer is contingent upon successful reference checks, background verification, and proof of right to work.',
    bandJustification: '',
  });

  const [compensation, setCompensation] = useState({
    baseSalary: candidate?.expectedSalary ? Number(candidate.expectedSalary) : 120000,
    variablePay: 15000,
    equityValue: 20000,
    signOnBonus: 5000,
    relocation: 0,
    allowances: 6000,
  });

  // Sync candidate defaults
  useEffect(() => {
    if (candidate) {
      const jTitle =
        typeof candidate.jobOpeningId === 'object' && candidate.jobOpeningId
          ? candidate.jobOpeningId.title
          : '';
      const jDept =
        typeof candidate.jobOpeningId === 'object' && candidate.jobOpeningId
          ? typeof candidate.jobOpeningId.departmentId === 'object'
            ? (candidate.jobOpeningId.departmentId as any)._id
            : candidate.jobOpeningId.departmentId
          : '';

      const exp = candidate.expectedSalary ? Number(candidate.expectedSalary) : 120000;
      setForm((prev) => ({
        ...prev,
        designation: prev.designation || jTitle,
        departmentId: prev.departmentId || jDept,
      }));
      setCompensation((prev) => ({
        ...prev,
        baseSalary: prev.baseSalary || exp,
      }));
    }
  }, [candidate]);

  // Total CTC Calculation
  const totalCtc = useMemo(() => {
    return (
      (Number(compensation.baseSalary) || 0) +
      (Number(compensation.variablePay) || 0) +
      (Number(compensation.equityValue) || 0) +
      (Number(compensation.signOnBonus) || 0) +
      (Number(compensation.relocation) || 0) +
      (Number(compensation.allowances) || 0)
    );
  }, [compensation]);

  // Band Deviation Calculation
  const bandDeviation = useMemo(() => {
    if (!bandMax || bandMax <= 0) return { isOutOfBand: false, deviationPct: 0 };
    if (totalCtc > bandMax) {
      const pct = Math.round(((totalCtc - bandMax) / bandMax) * 1000) / 10;
      return { isOutOfBand: true, deviationPct: pct };
    }
    return { isOutOfBand: false, deviationPct: 0 };
  }, [totalCtc, bandMax]);

  if (!open || !candidate) return null;

  const handleSubmit = (isDraft: boolean = false) => {
    if (!form.designation.trim() || !form.departmentId) {
      setActiveTab('terms');
      return;
    }

    const benefits = form.benefitsInput
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);

    createOfferMutation.mutate(
      {
        candidateId: candidate._id,
        jobOpeningId: jobObj?._id,
        designation: form.designation.trim(),
        departmentId: form.departmentId,
        offeredSalary: totalCtc,
        currency: form.currency,
        joiningDate: form.joiningDate,
        validUntil: form.validUntil,
        benefits,
        notes: form.notes.trim(),
        compensationBreakdown: {
          baseSalary: Number(compensation.baseSalary) || 0,
          variablePay: Number(compensation.variablePay) || 0,
          equityValue: Number(compensation.equityValue) || 0,
          signOnBonus: Number(compensation.signOnBonus) || 0,
          relocation: Number(compensation.relocation) || 0,
          allowances: Number(compensation.allowances) || 0,
          totalCtc,
          currency: form.currency,
        },
        bandJustification: form.bandJustification.trim(),
        isDraft,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const inputCls =
    'w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-xs text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Modal Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-2xl bg-white border border-[#ECE0D6] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center shadow-xs">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#1A1A1A]">Generate Enterprise Job Offer</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                      Phase 4
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B6B6B]">
                    Candidate: <strong className="text-[#1A1A1A]">{candidate.fullName}</strong> • Role:{' '}
                    <span className="text-orange-700 font-medium">{form.designation || 'Not specified'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-[#ECE0D6] px-6 bg-white gap-6">
              <button
                type="button"
                onClick={() => setActiveTab('terms')}
                className={`py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
                  activeTab === 'terms'
                    ? 'border-[#f97316] text-[#f97316]'
                    : 'border-transparent text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Role & Terms
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('compensation')}
                className={`py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
                  activeTab === 'compensation'
                    ? 'border-[#f97316] text-[#f97316]'
                    : 'border-transparent text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                Compensation Breakdown
                <span className="ml-1 px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                  {form.currency} {totalCtc.toLocaleString()}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('governance')}
                className={`py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
                  activeTab === 'governance'
                    ? 'border-[#f97316] text-[#f97316]'
                    : 'border-transparent text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Band Governance
                {bandDeviation.isOutOfBand && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-md bg-red-100 text-red-700 text-[10px] font-bold animate-pulse">
                    +{bandDeviation.deviationPct}%
                  </span>
                )}
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* TAB 1: Role & Terms */}
              {activeTab === 'terms' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                        Designation / Role Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.designation}
                        onChange={(e) => setForm({ ...form, designation: e.target.value })}
                        placeholder="e.g. Senior Backend Engineer"
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <FloatingDropdown
                        label="Department *"
                        value={form.departmentId}
                        onChange={(val) => setForm({ ...form, departmentId: val })}
                        options={(departments || []).map((dept) => ({
                          value: dept._id,
                          label: dept.name,
                        }))}
                        searchable={true}
                        searchPlaceholder="Search department..."
                        placeholder="Select Department"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                        Proposed Joining Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={form.joiningDate}
                        onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                        className={inputCls}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                        Offer Validity Deadline <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={form.validUntil}
                        onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                      Benefits & Perks Summary
                    </label>
                    <textarea
                      rows={2}
                      value={form.benefitsInput}
                      onChange={(e) => setForm({ ...form, benefitsInput: e.target.value })}
                      placeholder="Comma-separated benefits package"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                      Legal Contingencies & Conditions
                    </label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="e.g. background check, employment verification..."
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Itemized Compensation Breakdown */}
              {activeTab === 'compensation' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50 border border-orange-200">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-950">
                        Total Annual CTC
                      </p>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-xl font-black text-orange-600">
                          {form.currency} {totalCtc.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-orange-950/70 font-medium">/ year</span>
                      </div>
                    </div>
                    <div className="w-40">
                      <FloatingDropdown
                        label="Currency"
                        value={form.currency}
                        onChange={(val) => setForm({ ...form, currency: val })}
                        options={[
                          { value: 'USD', label: 'USD ($)' },
                          { value: 'EUR', label: 'EUR (€)' },
                          { value: 'GBP', label: 'GBP (£)' },
                          { value: 'INR', label: 'INR (₹)' },
                          { value: 'CAD', label: 'CAD ($)' },
                          { value: 'AUD', label: 'AUD ($)' },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                        Base Salary (Fixed Annual) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="number"
                          min={0}
                          value={compensation.baseSalary}
                          onChange={(e) =>
                            setCompensation({ ...compensation, baseSalary: Number(e.target.value) })
                          }
                          className={`${inputCls} pl-8`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                        Variable / Performance Bonus
                      </label>
                      <div className="relative">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="number"
                          min={0}
                          value={compensation.variablePay}
                          onChange={(e) =>
                            setCompensation({ ...compensation, variablePay: Number(e.target.value) })
                          }
                          className={`${inputCls} pl-8`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                        Stock / Equity Grant (Annualized)
                      </label>
                      <div className="relative">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="number"
                          min={0}
                          value={compensation.equityValue}
                          onChange={(e) =>
                            setCompensation({ ...compensation, equityValue: Number(e.target.value) })
                          }
                          className={`${inputCls} pl-8`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                        Sign-on Bonus (One-time)
                      </label>
                      <div className="relative">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="number"
                          min={0}
                          value={compensation.signOnBonus}
                          onChange={(e) =>
                            setCompensation({ ...compensation, signOnBonus: Number(e.target.value) })
                          }
                          className={`${inputCls} pl-8`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                        Relocation Assistance
                      </label>
                      <div className="relative">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="number"
                          min={0}
                          value={compensation.relocation}
                          onChange={(e) =>
                            setCompensation({ ...compensation, relocation: Number(e.target.value) })
                          }
                          className={`${inputCls} pl-8`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                        Allowances (HRA / Transport / Remote)
                      </label>
                      <div className="relative">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="number"
                          min={0}
                          value={compensation.allowances}
                          onChange={(e) =>
                            setCompensation({ ...compensation, allowances: Number(e.target.value) })
                          }
                          className={`${inputCls} pl-8`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Compensation Band Governance & Approval Escalation */}
              {activeTab === 'governance' && (
                <div className="space-y-4">
                  {/* Band Status Card */}
                  <div
                    className={`p-4 rounded-xl border ${
                      bandDeviation.isOutOfBand
                        ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                        : 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {bandDeviation.isOutOfBand ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <h4 className="text-xs font-bold">
                          {bandDeviation.isOutOfBand
                            ? `Band Deviation Detected (+${bandDeviation.deviationPct}%)`
                            : 'Compensation Within Approved Job Band'}
                        </h4>
                        <p className="text-[11px] mt-1 leading-relaxed opacity-90">
                          {bandDeviation.isOutOfBand
                            ? `Offered CTC (${form.currency} ${totalCtc.toLocaleString()}) exceeds the approved position ceiling (${form.currency} ${bandMax.toLocaleString()}). As per Nebula Governance rules, an automated approval escalation step is added for the Finance Head.`
                            : `Offered CTC (${form.currency} ${totalCtc.toLocaleString()}) is safely within the target range for this role (${form.currency} ${bandMin.toLocaleString()} - ${bandMax.toLocaleString()}).`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Justification Field if Out of Band */}
                  {bandDeviation.isOutOfBand && (
                    <div>
                      <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                        Executive Compensation Justification <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={form.bandJustification}
                        onChange={(e) => setForm({ ...form, bandJustification: e.target.value })}
                        placeholder="Provide justification for why this candidate warrants an above-band offer (e.g. competing offers, critical niche skillset, higher seniority)..."
                        className={inputCls}
                      />
                    </div>
                  )}

                  {/* Dynamic Approval Chain Preview */}
                  <div className="border border-[#ECE0D6] rounded-xl p-4 bg-[#FBF8F4]">
                    <h5 className="text-xs font-bold text-[#1A1A1A] mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-orange-600" />
                      Dynamic Multi-Step Approval Chain
                    </h5>
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center gap-2 text-xs text-[#1A1A1A] bg-white p-2.5 rounded-lg border border-[#ECE0D6]">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                          1
                        </span>
                        <span className="font-semibold">Recruiter Initiation</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 mx-auto" />
                        <span className="text-[11px] text-slate-500">Draft / Submission</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#1A1A1A] bg-white p-2.5 rounded-lg border border-[#ECE0D6]">
                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold text-[10px] flex items-center justify-center">
                          2
                        </span>
                        <span className="font-semibold">Hiring Manager Approval</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 mx-auto" />
                        <span className="text-[11px] text-slate-500">Technical & Team Fit</span>
                      </div>

                      {bandDeviation.isOutOfBand && (
                        <div className="flex items-center gap-2 text-xs text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-300">
                          <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 font-bold text-[10px] flex items-center justify-center">
                            3
                          </span>
                          <span className="font-bold text-amber-800">
                            Finance Head (Escalation Step)
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-amber-400 mx-auto" />
                          <span className="text-[10px] font-semibold text-amber-700">
                            Budget Over-Run Signoff (+{bandDeviation.deviationPct}%)
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-[#1A1A1A] bg-white p-2.5 rounded-lg border border-[#ECE0D6]">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                          {bandDeviation.isOutOfBand ? 4 : 3}
                        </span>
                        <span className="font-semibold">HR Director Final Sign-off</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 mx-auto" />
                        <span className="text-[11px] text-slate-500">Official Release to Candidate</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                <span>Total CTC:</span>
                <span className="font-bold text-[#1A1A1A]">
                  {form.currency} {totalCtc.toLocaleString()}
                </span>
                {bandDeviation.isOutOfBand ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                    Above Band (+{bandDeviation.deviationPct}%)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Within Band
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={createOfferMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#ECE0D6] text-[#1A1A1A] hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={createOfferMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {createOfferMutation.isPending ? 'Processing...' : 'Create & Initiate Approval'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
