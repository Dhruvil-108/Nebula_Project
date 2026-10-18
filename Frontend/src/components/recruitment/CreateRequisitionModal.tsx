import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileSpreadsheet, Plus, AlertCircle, Building2, DollarSign } from 'lucide-react';
import { useCreateRequisition } from '../../hooks/useRecruitment';
import { useDepartments } from '../../hooks/useHrms';
import { EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABELS, EXPERIENCE_LEVELS, EXPERIENCE_LEVEL_LABELS } from '../../types/recruitment';

interface CreateRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateRequisitionModal: React.FC<CreateRequisitionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const createMutation = useCreateRequisition();
  const { data: departments } = useDepartments();

  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [employmentType, setEmploymentType] = useState('full_time');
  const [experienceLevel, setExperienceLevel] = useState('mid');
  const [locationType, setLocationType] = useState('hybrid');
  const [location, setLocation] = useState('');
  const [openPositions, setOpenPositions] = useState(1);
  const [budgetMin, setBudgetMin] = useState(0);
  const [budgetMax, setBudgetMax] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [reason, setReason] = useState<'new_headcount' | 'replacement' | 'expansion'>('new_headcount');
  const [justification, setJustification] = useState('');
  const [submitNow, setSubmitNow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Role title is required.');
      return;
    }
    if (!departmentId) {
      setError('Please select a department.');
      return;
    }
    if (!justification.trim()) {
      setError('Business justification is required for headcount approval.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        departmentId,
        employmentType,
        experienceLevel,
        locationType,
        location: location.trim(),
        openPositions: Number(openPositions) || 1,
        budget: {
          min: Number(budgetMin) || 0,
          max: Number(budgetMax) || 0,
          currency,
        },
        reason,
        justification: justification.trim(),
        submitNow,
      });

      onClose();
      onSuccess?.();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to create requisition.');
    }
  };

  const inputCls =
    'w-full rounded-xl border border-[#ECE0D6] bg-white px-3.5 py-2 text-xs text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all';
  const labelCls = 'block text-xs font-semibold text-[#374151] mb-1.5';

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
          className="relative w-full max-w-xl rounded-2xl bg-white border border-[#ECE0D6] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111827]">Request Manpower Requisition</h3>
                <p className="text-xs text-[#64748b]">Submit head count proposal for organizational approval.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#64748b] hover:text-[#111827] hover:bg-[#FBEAE0] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Title & Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>
                    Position / Role Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select department...</option>
                    {departments?.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reason & Open Positions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Hiring Reason</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value as any)}
                    className={inputCls}
                  >
                    <option value="new_headcount">New Headcount</option>
                    <option value="replacement">Backfill / Replacement</option>
                    <option value="expansion">Team Expansion</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Positions Needed</label>
                  <input
                    type="number"
                    min={1}
                    value={openPositions}
                    onChange={(e) => setOpenPositions(Number(e.target.value))}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Employment Type</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className={inputCls}
                  >
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {EMPLOYMENT_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Experience Level & Location */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Seniority Level</label>
                  <select
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className={inputCls}
                  >
                    {EXPERIENCE_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {EXPERIENCE_LEVEL_LABELS[lvl]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Workplace Arrangement</label>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value)}
                    className={inputCls}
                  >
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="on_site">On-site</option>
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Location / City</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco or Worldwide"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Budget Band */}
              <div className="p-3.5 rounded-xl border border-[#ECE0D6] bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#111827]">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Target Budget Compensation Band
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#64748b] mb-1">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className={inputCls}
                    >
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#64748b] mb-1">Min Annual</label>
                    <input
                      type="number"
                      value={budgetMin || ''}
                      onChange={(e) => setBudgetMin(Number(e.target.value))}
                      placeholder="e.g. 100000"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#64748b] mb-1">Max Annual</label>
                    <input
                      type="number"
                      value={budgetMax || ''}
                      onChange={(e) => setBudgetMax(Number(e.target.value))}
                      placeholder="e.g. 140000"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              {/* Justification */}
              <div>
                <label className={labelCls}>
                  Business Justification <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Explain why this headcount is required, key objectives, and business impact..."
                  className={inputCls}
                />
              </div>

              {/* Submit Immediately Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="submitNow"
                  checked={submitNow}
                  onChange={(e) => setSubmitNow(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300"
                />
                <label htmlFor="submitNow" className="text-xs text-[#374151] font-medium cursor-pointer">
                  Submit immediately into approval workflow upon creation
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-[#FBF8F4] border-t border-[#ECE0D6] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#374151] bg-white hover:bg-slate-50 border border-[#e5e7eb] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {createMutation.isPending ? 'Submitting...' : submitNow ? 'Submit Requisition' : 'Save as Draft'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
