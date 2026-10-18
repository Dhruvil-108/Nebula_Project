import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CalendarClock,
  Video,
  Users,
  Building,
  Phone,
  Lock,
  Globe,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import { useScheduleInterview } from '../../hooks/useRecruitment';
import {
  INTERVIEW_TYPES,
  INTERVIEW_TYPE_LABELS,
  MEETING_PLATFORM_LABELS,
  type Candidate,
  type InterviewType,
  type MeetingPlatform,
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
  const { data: users } = useQuery<{ _id: string; fullName: string; email: string; role?: string }[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get<{ users: any[] }>('/users');
      return res.data.users || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  const [form, setForm] = useState<{
    title: string;
    roundType: InterviewType;
    panelUserIds: string[];
    date: string;
    startTime: string;
    endTime: string;
    timezone: string;
    meetingPlatform: MeetingPlatform;
    meetingLink: string;
    meetingPassword: string;
    location: string;
  }>({
    title: 'Round 1: Technical & Competency Evaluation',
    roundType: 'technical',
    panelUserIds: [],
    date: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '15:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    meetingPlatform: 'google_meet',
    meetingLink: '',
    meetingPassword: '',
    location: '',
  });

  if (!open || !candidate) return null;

  const togglePanelUser = (userId: string) => {
    if (!userId) return;
    setForm((prev) => {
      const exists = prev.panelUserIds.includes(userId);
      return {
        ...prev,
        panelUserIds: exists
          ? prev.panelUserIds.filter((id) => id !== userId)
          : [...prev.panelUserIds, userId],
      };
    });
  };

  const handleGenerateMeetingLink = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const r = (n: number) =>
      Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    
    if (form.meetingPlatform === 'zoom') {
      const meetingId = Math.floor(100000000 + Math.random() * 900000000);
      const passcode = Math.floor(100000 + Math.random() * 900000).toString();
      setForm((prev) => ({
        ...prev,
        meetingLink: `https://zoom.us/j/${meetingId}`,
        meetingPassword: passcode,
      }));
    } else {
      const meetCode = `${r(3)}-${r(4)}-${r(3)}`;
      setForm((prev) => ({
        ...prev,
        meetingLink: `https://meet.google.com/${meetCode}`,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date || !form.startTime || !form.endTime) return;

    const scheduledStart = new Date(`${form.date}T${form.startTime}:00`).toISOString();
    const scheduledEnd = new Date(`${form.date}T${form.endTime}:00`).toISOString();

    scheduleMutation.mutate(
      {
        candidateId: candidate._id,
        title: form.title.trim(),
        roundType: form.roundType,
        interviewers: form.panelUserIds,
        scheduledStart,
        scheduledEnd,
        timezone: form.timezone,
        meetingPlatform: form.meetingPlatform,
        meetingLink: form.meetingLink.trim(),
        meetingPassword: form.meetingPassword.trim(),
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
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
            className="relative w-full max-w-xl bg-white border border-[#ECE0D6] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center shadow-2xs">
                  <CalendarClock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A]">Schedule Multi-Panel Interview</h3>
                  <p className="text-[11px] text-[#6B6B6B]">
                    Candidate: <strong className="text-[#1A1A1A]">{candidate.fullName}</strong>
                    {candidate.currentCompany ? ` · ${candidate.currentCompany}` : ''}
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Interview Round Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. System Design & Algorithmic Problem Solving"
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
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                    Timezone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={form.timezone}
                      onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                      className={`${inputCls} pl-8`}
                    />
                  </div>
                </div>
              </div>

              {/* Panel Interviewers Multi-Selection */}
              <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#ECE0D6] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#f97316]" />
                    Interview Panel Evaluators
                    <span className="text-[10px] text-slate-500 font-normal">
                      ({form.panelUserIds.length} selected)
                    </span>
                  </label>
                </div>

                {/* Selected Evaluator Chips */}
                {form.panelUserIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.panelUserIds.map((userId) => {
                      const u = (users || []).find((usr) => usr._id === userId);
                      if (!u) return null;
                      return (
                        <span
                          key={userId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-orange-200 text-orange-950 shadow-2xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                          {u.fullName}
                          <button
                            type="button"
                            onClick={() => togglePanelUser(userId)}
                            className="text-slate-400 hover:text-red-600 transition-colors ml-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Interviewer Selector Dropdown */}
                <FloatingDropdown
                  label="Add Panel Member"
                  value=""
                  onChange={(val) => {
                    if (val) togglePanelUser(val);
                  }}
                  options={[
                    { value: '', label: 'Select team member to add to panel...' },
                    ...(users || [])
                      .filter((u) => !form.panelUserIds.includes(u._id))
                      .map((u) => ({
                        value: u._id,
                        label: `${u.fullName} (${u.email})`,
                      })),
                  ]}
                  searchable={true}
                  searchPlaceholder="Search panelist by name or email..."
                  placeholder="Select Interviewer to add..."
                />
              </div>

              {/* Date & Time Slot */}
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

              {/* Meeting Platform & Link */}
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FloatingDropdown
                      label="Meeting Platform"
                      value={form.meetingPlatform}
                      onChange={(val) =>
                        setForm({ ...form, meetingPlatform: val as MeetingPlatform })
                      }
                      options={[
                        { value: 'google_meet', label: 'Google Meet' },
                        { value: 'zoom', label: 'Zoom Meeting' },
                        { value: 'microsoft_teams', label: 'Microsoft Teams' },
                        { value: 'phone', label: 'Phone Call' },
                        { value: 'in_person', label: 'In Person / On-site' },
                      ]}
                    />
                  </div>

                  {form.meetingPlatform === 'in_person' ? (
                    <div>
                      <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                        Physical Room / Location
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Conference Room B, HQ Floor 3"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-[#f97316]" />
                          Video Link
                        </label>
                        {['google_meet', 'zoom'].includes(form.meetingPlatform) && (
                          <button
                            type="button"
                            onClick={handleGenerateMeetingLink}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors shadow-2xs"
                          >
                            <Sparkles className="w-3 h-3 text-orange-600" />
                            Auto-Generate Link
                          </button>
                        )}
                      </div>
                      <input
                        type="url"
                        placeholder={
                          form.meetingPlatform === 'zoom'
                            ? 'https://zoom.us/j/123456789'
                            : 'https://meet.google.com/abc-defg-hij'
                        }
                        value={form.meetingLink}
                        onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  )}
                </div>

                {/* Password / Passcode if Zoom or Teams */}
                {['zoom', 'microsoft_teams'].includes(form.meetingPlatform) && (
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      Meeting Passcode / PIN (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 582910"
                      value={form.meetingPassword}
                      onChange={(e) => setForm({ ...form, meetingPassword: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between border-t border-[#ECE0D6]">
                <p className="text-[11px] text-slate-500">
                  Generates downloadable <span className="font-semibold text-slate-700">.ics</span> iCalendar invite for candidate & panel.
                </p>
                <div className="flex items-center gap-2">
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
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {scheduleMutation.isPending ? 'Scheduling...' : 'Confirm & Schedule'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
