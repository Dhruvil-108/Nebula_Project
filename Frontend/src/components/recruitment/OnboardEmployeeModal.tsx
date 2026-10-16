import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserCheck, Sparkles, Building2, Calendar, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { useOnboardCandidateToEmployee } from '../../hooks/useRecruitment';
import type { Candidate } from '../../types/recruitment';
import { FloatingDropdown } from '../ui/FloatingDropdown';

interface OnboardEmployeeModalProps {
  open: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

export const OnboardEmployeeModal: React.FC<OnboardEmployeeModalProps> = ({
  open,
  onClose,
  candidate,
}) => {
  const onboardMutation = useOnboardCandidateToEmployee();

  // Load departments from HRMS
  const { data: departments } = useQuery<{ _id: string; name: string }[]>({
    queryKey: ['hr', 'departments'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/hr/departments');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Load active managers from HRMS
  const { data: managers } = useQuery<{ _id: string; fullName: string; employeeCode: string }[]>({
    queryKey: ['hr', 'managers'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/hr/employees');
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

  const [form, setForm] = useState({
    employeeCode: '',
    designation: jobTitle || '',
    departmentId: jobDeptId || '',
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: 'full_time',
    managerId: '',
  });

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
      }));
    }
  }, [candidate]);

  if (!open || !candidate) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onboardMutation.mutate(
      {
        candidateId: candidate._id,
        input: {
          employeeCode: form.employeeCode.trim() || undefined,
          designation: form.designation.trim() || undefined,
          departmentId: form.departmentId || undefined,
          joiningDate: form.joiningDate || undefined,
          employmentType: form.employmentType,
          managerId: form.managerId || undefined,
          skills: candidate.skills,
        },
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
      {open && candidate && (
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
          <div className="px-6 py-4 border-b border-[#ECE0D6] bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">Convert to HRMS Employee</h3>
                <p className="text-[11px] text-[#6B6B6B]">
                  Onboarding: <strong className="text-[#1A1A1A]">{candidate.fullName}</strong>
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
            {/* Auto-fill Info Notice */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-amber-700" />
                Atomic Recruitment-to-HRMS Hand-off
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                This will automatically create the Employee profile in HRMS, transfer the candidate's resume and offer documents, mark the candidate as <strong>Hired</strong>, and update job metrics.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Employee Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Auto-assigned (e.g. EMP-0042)"
                  value={form.employeeCode}
                  onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <FloatingDropdown
                  label="Employment Type"
                  value={form.employmentType}
                  onChange={(val) => setForm({ ...form, employmentType: val })}
                  options={[
                    { value: 'full_time', label: 'Full-time' },
                    { value: 'part_time', label: 'Part-time' },
                    { value: 'contract', label: 'Contract' },
                    { value: 'intern', label: 'Intern' },
                  ]}
                />
              </div>
            </div>

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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Official Joining Date <span className="text-red-500">*</span>
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
                <FloatingDropdown
                  label="Reporting Manager"
                  value={form.managerId}
                  onChange={(val) => setForm({ ...form, managerId: val })}
                  options={[
                    { value: '', label: 'None (Direct Report to CEO)' },
                    ...(managers || []).map((m) => ({
                      value: m._id,
                      label: `${m.fullName} (${m.employeeCode})`,
                    })),
                  ]}
                  searchable={true}
                  searchPlaceholder="Search manager..."
                  placeholder="Select Manager"
                />
              </div>
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
                disabled={onboardMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
              >
                {onboardMutation.isPending ? 'Onboarding...' : 'Confirm & Onboard to HRMS'}
              </button>
            </div>
          </form>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
