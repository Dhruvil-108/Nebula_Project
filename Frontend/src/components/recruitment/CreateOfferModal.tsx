import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { useCreateOffer } from '../../hooks/useRecruitment';
import type { Candidate } from '../../types/recruitment';
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

  // Load departments from HRMS
  const { data: departments } = useQuery<{ _id: string; name: string }[]>({
    queryKey: ['hr', 'departments'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/hr/departments');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const jobDeptId =
    typeof candidate?.jobOpeningId === 'object' && candidate.jobOpeningId
      ? typeof candidate.jobOpeningId.departmentId === 'object'
        ? candidate.jobOpeningId.departmentId._id
        : candidate.jobOpeningId.departmentId
      : '';

  const jobTitle =
    typeof candidate?.jobOpeningId === 'object' && candidate.jobOpeningId
      ? candidate.jobOpeningId.title
      : '';

  const defaultJoining = new Date();
  defaultJoining.setDate(defaultJoining.getDate() + 30);

  const defaultValidity = new Date();
  defaultValidity.setDate(defaultValidity.getDate() + 7);

  const [form, setForm] = useState({
    designation: jobTitle || '',
    departmentId: jobDeptId || '',
    offeredSalary: candidate?.expectedSalary ? String(candidate.expectedSalary) : '120000',
    currency: 'USD',
    joiningDate: defaultJoining.toISOString().split('T')[0],
    validUntil: defaultValidity.toISOString().split('T')[0],
    benefitsInput: 'Health Insurance, 401(k) Matching, Annual Learning Stipend, 25 Days Paid Leave',
    notes: 'Contingent upon background check and verification of credentials.',
  });

  // Sync defaults if candidate loads late
  React.useEffect(() => {
    if (candidate) {
      const jTitle =
        typeof candidate.jobOpeningId === 'object' && candidate.jobOpeningId
          ? candidate.jobOpeningId.title
          : '';
      const jDept =
        typeof candidate.jobOpeningId === 'object' && candidate.jobOpeningId
          ? typeof candidate.jobOpeningId.departmentId === 'object'
            ? candidate.jobOpeningId.departmentId._id
            : candidate.jobOpeningId.departmentId
          : '';

      setForm((prev) => ({
        ...prev,
        designation: prev.designation || jTitle,
        departmentId: prev.departmentId || jDept,
        offeredSalary: prev.offeredSalary || (candidate.expectedSalary ? String(candidate.expectedSalary) : '120000'),
      }));
    }
  }, [candidate]);

  if (!open || !candidate) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.designation.trim() || !form.departmentId || !form.offeredSalary) return;

    const benefits = form.benefitsInput
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean);

    createOfferMutation.mutate(
      {
        candidateId: candidate._id,
        designation: form.designation.trim(),
        departmentId: form.departmentId,
        offeredSalary: Number(form.offeredSalary),
        currency: form.currency,
        joiningDate: form.joiningDate,
        validUntil: form.validUntil,
        benefits,
        notes: form.notes.trim(),
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
          className="relative w-full max-w-lg bg-white border border-[#ECE0D6] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">Generate Job Offer</h3>
                <p className="text-[11px] text-[#6B6B6B]">
                  Candidate: <strong className="text-[#1A1A1A]">{candidate.fullName}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Designation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
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

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Offered Salary (Annual) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={form.offeredSalary}
                  onChange={(e) => setForm({ ...form, offeredSalary: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
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
                  ]}
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
                  Offer Valid Until <span className="text-red-500">*</span>
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
                Benefits Summary (comma separated)
              </label>
              <input
                type="text"
                value={form.benefitsInput}
                onChange={(e) => setForm({ ...form, benefitsInput: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                Terms & Conditions
              </label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className={inputCls}
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#ECE0D6]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createOfferMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
              >
                {createOfferMutation.isPending ? 'Generating...' : 'Issue Offer'}
              </button>
            </div>
          </form>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
