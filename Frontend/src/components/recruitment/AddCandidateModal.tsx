import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus } from 'lucide-react';
import { useJobs, useCreateCandidate } from '../../hooks/useRecruitment';
import {
  CANDIDATE_SOURCES,
  SOURCE_LABELS,
  CANDIDATE_STAGES,
  STAGE_LABELS,
  type CandidateSource,
  type CandidateStage,
} from '../../types/recruitment';
import { FloatingDropdown } from '../ui/FloatingDropdown';

interface AddCandidateModalProps {
  open: boolean;
  onClose: () => void;
  defaultJobId?: string;
}

export const AddCandidateModal: React.FC<AddCandidateModalProps> = ({
  open,
  onClose,
  defaultJobId,
}) => {
  const { data: jobs } = useJobs({ status: 'published' });
  const createCandidateMutation = useCreateCandidate();

  const [form, setForm] = useState({
    jobOpeningId: defaultJobId || '',
    fullName: '',
    email: '',
    phone: '',
    currentCompany: '',
    currentDesignation: '',
    totalExperienceYears: '',
    portfolioUrl: '',
    linkedinUrl: '',
    resumeUrl: '',
    resumeFileName: '',
    skillsInput: '',
    expectedSalary: '',
    noticePeriodDays: '30',
    source: 'careers_page' as CandidateSource,
    stage: 'applied' as CandidateStage,
    notes: '',
  });

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.email.trim() || !form.jobOpeningId) return;

    const skills = form.skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    createCandidateMutation.mutate(
      {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        jobOpeningId: form.jobOpeningId,
        currentCompany: form.currentCompany.trim(),
        currentDesignation: form.currentDesignation.trim(),
        totalExperienceYears: Number(form.totalExperienceYears) || 0,
        portfolioUrl: form.portfolioUrl.trim(),
        linkedinUrl: form.linkedinUrl.trim(),
        resumeUrl: form.resumeUrl.trim(),
        resumeFileName: form.resumeFileName.trim(),
        skills,
        expectedSalary: Number(form.expectedSalary) || 0,
        noticePeriodDays: Number(form.noticePeriodDays) || 30,
        source: form.source,
        stage: form.stage,
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
          className="relative w-full max-w-xl bg-white border border-[#ECE0D6] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#1A1A1A]">Add Candidate</h3>
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
              <FloatingDropdown
                label="Applying For Job Opening *"
                value={form.jobOpeningId}
                onChange={(val) => setForm({ ...form, jobOpeningId: val })}
                options={(jobs || []).map((j) => ({
                  value: j._id,
                  label: `${j.title} (${j.jobCode})`,
                }))}
                searchable={true}
                searchPlaceholder="Search job opening..."
                placeholder="Select Job Opening"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Current Company
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stripe"
                  value={form.currentCompany}
                  onChange={(e) => setForm({ ...form, currentCompany: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Current Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Backend Dev"
                  value={form.currentDesignation}
                  onChange={(e) => setForm({ ...form, currentDesignation: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Total Exp (Years)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 4"
                  value={form.totalExperienceYears}
                  onChange={(e) => setForm({ ...form, totalExperienceYears: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Expected Salary ($)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 110000"
                  value={form.expectedSalary}
                  onChange={(e) => setForm({ ...form, expectedSalary: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Notice Period (Days)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 30"
                  value={form.noticePeriodDays}
                  onChange={(e) => setForm({ ...form, noticePeriodDays: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FloatingDropdown
                  label="Source"
                  value={form.source}
                  onChange={(val) => setForm({ ...form, source: val as CandidateSource })}
                  options={CANDIDATE_SOURCES.map((s) => ({
                    value: s,
                    label: SOURCE_LABELS[s],
                  }))}
                />
              </div>

              <div>
                <FloatingDropdown
                  label="Initial Pipeline Stage"
                  value={form.stage}
                  onChange={(val) => setForm({ ...form, stage: val as CandidateStage })}
                  options={CANDIDATE_STAGES.map((s) => ({
                    value: s,
                    label: STAGE_LABELS[s],
                  }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                Resume / Portfolio Link
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/... or LinkedIn"
                value={form.resumeUrl}
                onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                Skills & Tech Stack (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Go, Kubernetes, Docker, PostgreSQL"
                value={form.skillsInput}
                onChange={(e) => setForm({ ...form, skillsInput: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                Screener Notes
              </label>
              <textarea
                rows={2}
                placeholder="Initial impressions, phone screen takeaways..."
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
                disabled={createCandidateMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all disabled:opacity-50"
              >
                {createCandidateMutation.isPending ? 'Adding...' : 'Add Candidate'}
              </button>
            </div>
          </form>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
