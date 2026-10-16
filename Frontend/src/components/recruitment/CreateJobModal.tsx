import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, Plus, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { useCreateJob } from '../../hooks/useRecruitment';
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  LOCATION_TYPES,
  LOCATION_TYPE_LABELS,
  EXPERIENCE_LEVELS,
  EXPERIENCE_LEVEL_LABELS,
  type EmploymentType,
  type LocationType,
  type ExperienceLevel,
} from '../../types/recruitment';
import { FloatingDropdown } from '../ui/FloatingDropdown';

interface CreateJobModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({ open, onClose }) => {
  const createJobMutation = useCreateJob();

  // Load departments from HRMS
  const { data: departments } = useQuery<{ _id: string; name: string }[]>({
    queryKey: ['hr', 'departments'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/hr/departments');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Load team users for hiring manager
  const { data: users } = useQuery<{ _id: string; fullName: string; email: string }[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get<{ users: any[] }>('/users');
      return res.data.users;
    },
    staleTime: 1000 * 60 * 5,
  });

  const [form, setForm] = useState({
    title: '',
    departmentId: '',
    employmentType: 'full_time' as EmploymentType,
    locationType: 'hybrid' as LocationType,
    location: '',
    experienceLevel: 'mid' as ExperienceLevel,
    minSalary: '',
    maxSalary: '',
    currency: 'USD',
    openPositions: 1,
    hiringManagerId: '',
    description: '',
    skillsInput: '',
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.departmentId) return;

    const skills = form.skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    createJobMutation.mutate(
      {
        title: form.title.trim(),
        departmentId: form.departmentId,
        employmentType: form.employmentType,
        locationType: form.locationType,
        location: form.location.trim(),
        experienceLevel: form.experienceLevel,
        salaryRange: {
          min: Number(form.minSalary) || 0,
          max: Number(form.maxSalary) || 0,
          currency: form.currency,
          isPublic: true,
        },
        openPositions: Number(form.openPositions) || 1,
        hiringManagerId: form.hiringManagerId || undefined,
        description: form.description.trim(),
        skills,
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
          className="relative w-full max-w-xl bg-white border border-[#ECE0D6] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#1A1A1A]">Create Job Opening</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Full-Stack Engineer"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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

              <div>
                <FloatingDropdown<EmploymentType>
                  label="Employment Type"
                  value={form.employmentType}
                  onChange={(val) => setForm({ ...form, employmentType: val })}
                  options={EMPLOYMENT_TYPES.map((t) => ({
                    value: t,
                    label: EMPLOYMENT_TYPE_LABELS[t],
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <FloatingDropdown<LocationType>
                  label="Workplace"
                  value={form.locationType}
                  onChange={(val) => setForm({ ...form, locationType: val })}
                  options={LOCATION_TYPES.map((l) => ({
                    value: l,
                    label: LOCATION_TYPE_LABELS[l],
                  }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Location (City)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Remote or San Francisco"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <FloatingDropdown<ExperienceLevel>
                  label="Experience Level"
                  value={form.experienceLevel}
                  onChange={(val) => setForm({ ...form, experienceLevel: val })}
                  options={EXPERIENCE_LEVELS.map((lvl) => ({
                    value: lvl,
                    label: EXPERIENCE_LEVEL_LABELS[lvl],
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Min Salary ($)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 90000"
                  value={form.minSalary}
                  onChange={(e) => setForm({ ...form, minSalary: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Max Salary ($)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 140000"
                  value={form.maxSalary}
                  onChange={(e) => setForm({ ...form, maxSalary: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Open Positions
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.openPositions}
                  onChange={(e) => setForm({ ...form, openPositions: Number(e.target.value) })}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <FloatingDropdown
                label="Hiring Manager"
                value={form.hiringManagerId}
                onChange={(val) => setForm({ ...form, hiringManagerId: val })}
                options={[
                  { value: '', label: 'Select Team Member' },
                  ...(users || []).map((u) => ({
                    value: u._id,
                    label: u.fullName,
                    sublabel: u.email,
                  })),
                ]}
                searchable={true}
                searchPlaceholder="Search team member..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                Required Skills (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. React, TypeScript, Node.js, MongoDB"
                value={form.skillsInput}
                onChange={(e) => setForm({ ...form, skillsInput: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                Job Description
              </label>
              <textarea
                rows={3}
                placeholder="Key expectations, role summary, and responsibilities..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                disabled={createJobMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all disabled:opacity-50"
              >
                {createJobMutation.isPending ? 'Publishing...' : 'Publish Opening'}
              </button>
            </div>
          </form>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
