import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarClock,
  Search,
  Plus,
  RefreshCw,
  Video,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  Users,
  MapPin,
  ExternalLink,
  Download,
  Calendar,
  Sparkles,
  Scale,
  Award,
  AlertTriangle,
  Lock,
  History,
  FileCheck2,
} from 'lucide-react';
import {
  useInterviews,
  useCancelInterview,
  useRescheduleInterview,
} from '../../hooks/useRecruitment';
import { recruitmentApi } from '../../lib/recruitmentApi';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ScorecardModal } from '../../components/recruitment/ScorecardModal';
import { InterviewDebriefModal } from '../../components/recruitment/InterviewDebriefModal';
import { InterviewQuestionKitModal } from '../../components/recruitment/InterviewQuestionKitModal';
import { FloatingDropdown } from '../../components/ui/FloatingDropdown';
import {
  INTERVIEW_STATUSES,
  INTERVIEW_TYPE_LABELS,
  MEETING_PLATFORM_LABELS,
  CONSENSUS_DECISION_LABELS,
  type Interview,
  type InterviewStatus,
} from '../../types/recruitment';

export const InterviewsPage: React.FC = () => {
  const { can } = useModuleAccess('recruitment');
  const canCreate = can('create');
  const canEdit = can('edit');

  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewTab, setViewTab] = useState<'all' | 'upcoming' | 'past'>('all');

  // Modals state
  const [selectedInterviewForScorecard, setSelectedInterviewForScorecard] = useState<Interview | null>(null);
  const [selectedInterviewForDebrief, setSelectedInterviewForDebrief] = useState<Interview | null>(null);
  const [selectedInterviewForQuestionKit, setSelectedInterviewForQuestionKit] = useState<Interview | null>(null);
  const [rescheduleModalInterview, setRescheduleModalInterview] = useState<Interview | null>(null);

  // Reschedule Form state
  const [rescheduleForm, setRescheduleForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '15:00',
    reason: '',
  });

  const { data: interviews, isLoading, refetch } = useInterviews({
    status: statusFilter || undefined,
  });

  const cancelInterviewMutation = useCancelInterview();
  const rescheduleMutation = useRescheduleInterview();

  const handleCancel = (iv: Interview) => {
    const reason = window.prompt(`Cancel interview "${iv.title}"?\nPlease provide a cancellation reason:`);
    if (reason !== null) {
      cancelInterviewMutation.mutate({ id: iv._id, reason });
    }
  };

  const handleOpenReschedule = (iv: Interview) => {
    const start = new Date(iv.scheduledStart);
    const end = new Date(iv.scheduledEnd);
    setRescheduleForm({
      date: start.toISOString().split('T')[0],
      startTime: start.toTimeString().substring(0, 5),
      endTime: end.toTimeString().substring(0, 5),
      reason: '',
    });
    setRescheduleModalInterview(iv);
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalInterview) return;

    const scheduledStart = new Date(`${rescheduleForm.date}T${rescheduleForm.startTime}:00`).toISOString();
    const scheduledEnd = new Date(`${rescheduleForm.date}T${rescheduleForm.endTime}:00`).toISOString();

    rescheduleMutation.mutate(
      {
        id: rescheduleModalInterview._id,
        input: {
          scheduledStart,
          scheduledEnd,
          reason: rescheduleForm.reason.trim() || 'Schedule conflict / Candidate request',
        },
      },
      {
        onSuccess: () => {
          setRescheduleModalInterview(null);
        },
      }
    );
  };

  const handleDownloadIcs = (iv: Interview) => {
    recruitmentApi.downloadInterviewIcs(iv._id, `interview-${iv._id}.ics`);
  };

  const filteredInterviews = (interviews || []).filter((iv) => {
    const candName =
      typeof iv.candidateId === 'object' && iv.candidateId ? iv.candidateId.fullName.toLowerCase() : '';
    const jobTitle =
      typeof iv.jobOpeningId === 'object' && iv.jobOpeningId ? iv.jobOpeningId.title.toLowerCase() : '';
    const title = iv.title.toLowerCase();
    const q = searchTerm.toLowerCase();

    const matchesSearch = !q || candName.includes(q) || jobTitle.includes(q) || title.includes(q);

    if (!matchesSearch) return false;

    if (viewTab === 'upcoming') {
      return new Date(iv.scheduledStart) >= new Date(Date.now() - 30 * 60 * 1000) && iv.status !== 'cancelled';
    }
    if (viewTab === 'past') {
      return new Date(iv.scheduledEnd) < new Date() || iv.status === 'completed';
    }

    return true;
  });

  const inputCls =
    'rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-xs text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight flex items-center gap-2.5">
            <CalendarClock className="w-6 h-6 text-[#f97316]" />
            Interview Ops & Calibration
          </h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            Multi-panel interview scheduling, RFC 5545 calendar sync, competency rubrics, and consensus debriefs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors"
            title="Refresh interviews"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* ── Filters & View Tabs ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex p-1 bg-[#FAF7F2] border border-[#ECE0D6] rounded-xl">
            {(['all', 'upcoming', 'past'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setViewTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  viewTab === tab
                    ? 'bg-white text-[#f97316] shadow-2xs'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                {tab} Rounds
              </button>
            ))}
          </div>

          <div className="w-48">
            <FloatingDropdown
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: '', label: 'All Statuses' },
                ...INTERVIEW_STATUSES.map((s) => ({
                  value: s,
                  label: s.toUpperCase(),
                  dotColor: s === 'completed' ? '#10b981' : s === 'cancelled' ? '#ef4444' : '#f59e0b',
                })),
              ]}
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by candidate or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputCls} w-full pl-9`}
          />
        </div>
      </div>

      {/* ── Interviews List ── */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center rounded-2xl border border-[#ECE0D6] bg-white text-slate-400 text-xs">
            Loading interviews...
          </div>
        ) : filteredInterviews.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-[#ECE0D6] bg-white text-slate-400 text-xs">
            No interviews found matching criteria.
          </div>
        ) : (
          filteredInterviews.map((iv) => {
            const candName =
              typeof iv.candidateId === 'object' && iv.candidateId
                ? iv.candidateId.fullName
                : 'Candidate';

            const jobName =
              typeof iv.jobOpeningId === 'object' && iv.jobOpeningId
                ? iv.jobOpeningId.title
                : 'Position';

            const isDone = iv.status === 'completed';
            const isCancelled = iv.status === 'cancelled';
            const isRescheduled = iv.status === 'rescheduled';

            return (
              <div
                key={iv._id}
                className="p-5 rounded-2xl border border-[#ECE0D6] bg-white hover:border-[#fed7aa] shadow-2xs transition-all space-y-3.5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[#111827]">{iv.title}</h3>

                      {/* Round Type */}
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        {INTERVIEW_TYPE_LABELS[iv.roundType] || iv.roundType}
                      </span>

                      {/* Platform */}
                      {iv.meetingPlatform && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {MEETING_PLATFORM_LABELS[iv.meetingPlatform] || iv.meetingPlatform}
                        </span>
                      )}

                      {/* Status */}
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                          isDone
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isCancelled
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isRescheduled
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {iv.status}
                      </span>

                      {/* Consensus Outcome badge */}
                      {iv.consensusOutcome?.decision && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200 flex items-center gap-1">
                          <Scale className="w-2.5 h-2.5 text-orange-600" />
                          Consensus: {CONSENSUS_DECISION_LABELS[iv.consensusOutcome.decision]}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#64748b]">
                      Candidate: <strong className="text-[#111827]">{candName}</strong> · Open Role:{' '}
                      <span className="text-[#111827] font-semibold">{jobName}</span>
                    </p>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                    {/* Video Link */}
                    {iv.meetingLink && !isCancelled && (
                      <a
                        href={iv.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors shadow-2xs ${
                          iv.meetingLink.includes('meet.google.com')
                            ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                            : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200'
                        }`}
                      >
                        <Video className="w-3.5 h-3.5" />
                        Join Room
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    )}

                    {/* .ics Calendar Download */}
                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => handleDownloadIcs(iv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors shadow-2xs"
                        title="Download RFC 5545 .ics Calendar Invite"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        .ics
                      </button>
                    )}

                    {/* AI Question Kit */}
                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => setSelectedInterviewForQuestionKit(iv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors shadow-2xs"
                        title="AI Interview Question Kit"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                        AI Kit
                      </button>
                    )}

                    {/* Debrief & Calibration */}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setSelectedInterviewForDebrief(iv)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors"
                        title="Interviewer Debrief & Calibration"
                      >
                        <Scale className="w-3.5 h-3.5 text-[#f97316]" />
                        Debrief
                      </button>
                    )}

                    {/* Submit / Edit Scorecard */}
                    {canEdit && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => setSelectedInterviewForScorecard(iv)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#f97316] hover:bg-[#ea580c] rounded-xl shadow-2xs transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" />
                        Scorecard
                      </button>
                    )}

                    {/* Reschedule */}
                    {canEdit && !isDone && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => handleOpenReschedule(iv)}
                        className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
                        title="Reschedule Interview"
                      >
                        <CalendarClock className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Cancel */}
                    {canEdit && !isDone && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => handleCancel(iv)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
                        title="Cancel interview"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Date & Panel Details */}
                <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[#64748b] pt-2 border-t border-[#F3EDE4]">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-[#9B9B9B]" />
                      {new Date(iv.scheduledStart).toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      · {new Date(iv.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(iv.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                      ({iv.timezone || 'Asia/Kolkata'})
                    </span>

                    {/* Multi-Panel Member Avatars */}
                    {iv.interviewers && iv.interviewers.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#9B9B9B]" />
                        <span className="font-semibold text-slate-600">Panel:</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {iv.interviewers.map((inv) => (
                            <span
                              key={inv._id}
                              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#FAF7F2] border border-[#ECE0D6] text-slate-800"
                            >
                              {inv.fullName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reschedule history badge */}
                  {iv.rescheduleHistory && iv.rescheduleHistory.length > 0 && (
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 flex items-center gap-1">
                      <History className="w-3 h-3" />
                      Rescheduled {iv.rescheduleHistory.length}x
                    </span>
                  )}
                </div>

                {/* Scorecard quick preview if present */}
                {iv.scorecard?.rating && (
                  <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-amber-900">
                        Lead Evaluator Recommendation:{' '}
                        <span className="uppercase text-amber-950 font-black">
                          {iv.scorecard.decision}
                        </span>
                      </span>
                      {iv.scorecard.notes && (
                        <p className="text-[11px] text-amber-800 italic mt-0.5 truncate max-w-xl">
                          "{iv.scorecard.notes}"
                        </p>
                      )}
                    </div>
                    <span className="font-black text-amber-700 text-sm">
                      ★ {iv.scorecard.rating} / 5
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Modals ── */}
      <ScorecardModal
        open={!!selectedInterviewForScorecard}
        onClose={() => setSelectedInterviewForScorecard(null)}
        interview={selectedInterviewForScorecard}
      />

      <InterviewDebriefModal
        open={!!selectedInterviewForDebrief}
        onClose={() => setSelectedInterviewForDebrief(null)}
        interview={selectedInterviewForDebrief}
      />

      <InterviewQuestionKitModal
        open={!!selectedInterviewForQuestionKit}
        onClose={() => setSelectedInterviewForQuestionKit(null)}
        interview={selectedInterviewForQuestionKit}
      />

      {/* ── Reschedule Interview Modal ── */}
      <AnimatePresence>
        {rescheduleModalInterview && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setRescheduleModalInterview(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white border border-[#ECE0D6] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center">
                    <CalendarClock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1A1A1A]">Reschedule Interview</h3>
                    <p className="text-[11px] text-[#6B6B6B] truncate max-w-xs">
                      {rescheduleModalInterview.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRescheduleModalInterview(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmReschedule} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                    New Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={rescheduleForm.date}
                    onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                      New Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={rescheduleForm.startTime}
                      onChange={(e) =>
                        setRescheduleForm({ ...rescheduleForm, startTime: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                      New End Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={rescheduleForm.endTime}
                      onChange={(e) =>
                        setRescheduleForm({ ...rescheduleForm, endTime: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                    Reason for Rescheduling
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Panel member urgent production conflict..."
                    value={rescheduleForm.reason}
                    onChange={(e) =>
                      setRescheduleForm({ ...rescheduleForm, reason: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#ECE0D6]">
                  <button
                    type="button"
                    onClick={() => setRescheduleModalInterview(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={rescheduleMutation.isPending}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all disabled:opacity-50"
                  >
                    {rescheduleMutation.isPending ? 'Updating...' : 'Confirm Reschedule'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
