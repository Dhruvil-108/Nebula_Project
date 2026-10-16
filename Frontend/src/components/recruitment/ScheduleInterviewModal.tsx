import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarClock, Video, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { useScheduleInterview } from '../../hooks/useRecruitment';
import {
  INTERVIEW_TYPES,
  INTERVIEW_TYPE_LABELS,
  type Candidate,
  type InterviewType,
} from '../../types/recruitment';
import { FloatingDropdown } from '../ui/FloatingDropdown';

interface ScheduleInterviewModalProps {
  open: boolean;
  onClose: () => void;
  candidate: Candidate | null;
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  open,
  onClose,
  candidate,
}) => {
  const scheduleMutation = useScheduleInterview();

  // Load team users for interviewer panel
  const { data: users } = useQuery<{ _id: string; fullName: string; email: string }[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get<{ users: any[] }>('/users');
      return res.data.users;
    },
    staleTime: 1000 * 60 * 5,
  });

  const [form, setForm] = useState({
    title: 'Round 1: Technical & Problem Solving',
    roundType: 'technical' as InterviewType,
    interviewerId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '15:00',
    meetingLink: '',
    location: '',
  });

  if (!open || !candidate) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.startTime || !form.endTime) return;

    const scheduledStart = new Date(`${form.date}T${form.startTime}:00`).toISOString();
    const scheduledEnd = new Date(`${form.date}T${form.endTime}:00`).toISOString();

    const interviewers = form.interviewerId ? [form.interviewerId] : [];

    scheduleMutation.mutate(
      {
        candidateId: candidate._id,
        title: form.title.trim(),
        roundType: form.roundType,
        interviewers,
        scheduledStart,
        scheduledEnd,
        meetingLink: form.meetingLink.trim(),
        location: form.location.trim(),
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
          <div className="px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center">
                <CalendarClock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">Schedule Interview</h3>
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
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                Interview Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FloatingDropdown
                  label="Round Type"
                  value={form.roundType}
                  onChange={(val) => setForm({ ...form, roundType: val as InterviewType })}
                  options={INTERVIEW_TYPES.map((t) => ({
                    value: t,
                    label: INTERVIEW_TYPE_LABELS[t],
                  }))}
                />
              </div>

              <div>
                <FloatingDropdown
                  label="Lead Interviewer"
                  value={form.interviewerId}
                  onChange={(val) => setForm({ ...form, interviewerId: val })}
                  options={[
                    { value: '', label: 'Unassigned / Panel' },
                    ...(users || []).map((u) => ({
                      value: u._id,
                      label: u.fullName,
                    })),
                  ]}
                  searchable={true}
                  searchPlaceholder="Search interviewer..."
                  placeholder="Assign Interviewer"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-[#f97316]" />
                  Video Meeting Link
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const chars = 'abcdefghijklmnopqrstuvwxyz';
                    const r = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
                    const meetCode = `${r(3)}-${r(4)}-${r(3)}`;
                    const link = `https://meet.google.com/${meetCode}`;
                    setForm((prev) => ({ ...prev, meetingLink: link }));
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
                >
                  <Video className="w-3 h-3 text-emerald-600" />
                  Generate Google Meet
                </button>
              </div>
              <div className="relative">
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={form.meetingLink}
                  onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                  className={inputCls}
                />
                {form.meetingLink && form.meetingLink.includes('meet.google.com') && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Google Meet
                  </span>
                )}
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
                disabled={scheduleMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all disabled:opacity-50"
              >
                {scheduleMutation.isPending ? 'Scheduling...' : 'Schedule Interview'}
              </button>
            </div>
          </form>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
