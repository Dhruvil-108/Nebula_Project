import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import {
  useInterviews,
  useCancelInterview,
} from '../../hooks/useRecruitment';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ScorecardModal } from '../../components/recruitment/ScorecardModal';
import { ScheduleInterviewModal } from '../../components/recruitment/ScheduleInterviewModal';
import { FloatingDropdown } from '../../components/ui/FloatingDropdown';
import {
  INTERVIEW_STATUSES,
  INTERVIEW_TYPES,
  INTERVIEW_TYPE_LABELS,
  type Interview,
  type InterviewStatus,
} from '../../types/recruitment';

export const InterviewsPage: React.FC = () => {
  const { can } = useModuleAccess('recruitment');
  const canCreate = can('create');
  const canEdit = can('edit');

  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInterviewForScorecard, setSelectedInterviewForScorecard] = useState<Interview | null>(null);

  const { data: interviews, isLoading, refetch } = useInterviews({
    status: statusFilter || undefined,
  });

  const cancelInterviewMutation = useCancelInterview();

  const handleCancel = (iv: Interview) => {
    const reason = window.prompt(`Cancel interview "${iv.title}"?\nPlease provide a cancellation reason:`);
    if (reason !== null) {
      cancelInterviewMutation.mutate({ id: iv._id, reason });
    }
  };

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
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
            Interviews & Evaluations
          </h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            Coordinate interview schedules, assign panel members, and record structured evaluation scorecards.
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

      {/* ── Filters ── */}
      <div className="flex items-center gap-3">
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

      {/* ── Interviews List ── */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center rounded-2xl border border-[#ECE0D6] bg-white text-slate-400 text-xs">
            Loading interviews...
          </div>
        ) : (!interviews || interviews.length === 0) ? (
          <div className="p-12 text-center rounded-2xl border border-[#ECE0D6] bg-white text-slate-400 text-xs">
            No interviews found matching criteria.
          </div>
        ) : (
          interviews.map((iv) => {
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

            return (
              <div
                key={iv._id}
                className="p-5 rounded-2xl border border-[#ECE0D6] bg-white hover:border-[#fed7aa] shadow-2xs transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[#111827]">{iv.title}</h3>
                      <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {INTERVIEW_TYPE_LABELS[iv.roundType] || iv.roundType}
                      </span>
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                          isDone
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isCancelled
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {iv.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#64748b]">
                      Candidate: <strong className="text-[#111827]">{candName}</strong> · Role:{' '}
                      <span className="text-[#111827]">{jobName}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {iv.meetingLink && !isCancelled && (
                      <>
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
                          {iv.meetingLink.includes('meet.google.com') ? 'Join Google Meet' : 'Join Call'}
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>

                        <a
                          href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                            `${iv.title} — ${candName}`
                          )}&dates=${new Date(iv.scheduledStart)
                            .toISOString()
                            .replace(/-|:|\.\d\d\d/g, '')}/${new Date(iv.scheduledEnd)
                            .toISOString()
                            .replace(/-|:|\.\d\d\d/g, '')}&details=${encodeURIComponent(
                            `Candidate: ${candName}\nRole: ${jobName}\nMeeting: ${iv.meetingLink}`
                          )}&location=${encodeURIComponent(iv.meetingLink || 'Google Meet')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                          title="Add to Google Calendar"
                        >
                          <CalendarClock className="w-4 h-4 text-slate-600" />
                        </a>
                      </>
                    )}

                    {canEdit && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => setSelectedInterviewForScorecard(iv)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#f97316] hover:bg-[#ea580c] rounded-xl shadow-2xs transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" />
                        {iv.scorecard?.rating ? 'Edit Scorecard' : 'Submit Scorecard'}
                      </button>
                    )}

                    {canEdit && !isDone && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => handleCancel(iv)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
                        title="Cancel interview"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Date & Panel Grid */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748b] pt-2 border-t border-[#F3EDE4]">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-[#9B9B9B]" />
                    {new Date(iv.scheduledStart).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    · {new Date(iv.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {new Date(iv.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {iv.interviewers && iv.interviewers.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#9B9B9B]" />
                      Panel: {iv.interviewers.map((i) => i.fullName).join(', ')}
                    </span>
                  )}
                </div>

                {/* Scorecard Preview if submitted */}
                {iv.scorecard?.rating && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900">
                        Recommendation: <span className="uppercase">{iv.scorecard.decision}</span>
                      </span>
                      <span className="font-bold text-amber-700">
                        {iv.scorecard.rating} / 5 Stars ★
                      </span>
                    </div>
                    {iv.scorecard.notes && (
                      <p className="text-[11px] text-amber-800 italic">"{iv.scorecard.notes}"</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <ScorecardModal
        open={!!selectedInterviewForScorecard}
        onClose={() => setSelectedInterviewForScorecard(null)}
        interview={selectedInterviewForScorecard}
      />
    </div>
  );
};
