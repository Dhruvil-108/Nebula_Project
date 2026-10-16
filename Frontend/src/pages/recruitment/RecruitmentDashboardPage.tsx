import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Users,
  CalendarClock,
  Award,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  Building2,
  CheckCircle2,
  UserCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  useRecruitmentSummary,
  useJobs,
} from '../../hooks/useRecruitment';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { CandidateStagePill } from '../../components/recruitment/CandidateStagePill';
import { JobStatusPill } from '../../components/recruitment/JobStatusPill';
import { CreateJobModal } from '../../components/recruitment/CreateJobModal';
import { AddCandidateModal } from '../../components/recruitment/AddCandidateModal';
import {
  CANDIDATE_STAGES,
  STAGE_LABELS,
  type CandidateStage,
} from '../../types/recruitment';

export const RecruitmentDashboardPage: React.FC = () => {
  const { can } = useModuleAccess('recruitment');
  const canCreate = can('create');

  const { data: summary, isLoading } = useRecruitmentSummary();
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [showAddCandidate, setShowAddCandidate] = useState(false);

  const metrics = summary?.metrics || {
    activeJobs: 0,
    candidatesInPipeline: 0,
    interviewsThisWeek: 0,
    pendingOffers: 0,
    hiredThisMonth: 0,
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100/70 border border-orange-200/60 text-orange-700 text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-orange-500" />
              Talent Acquisition & ATS
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight">
            Recruitment Hub
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Manage job vacancies, track candidate pipelines, conduct interviews, and onboard new hires.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {canCreate && (
            <button
              type="button"
              onClick={() => setShowAddCandidate(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#374151] bg-white hover:bg-slate-50 border border-[#e5e7eb] shadow-2xs transition-all"
            >
              <Users className="w-4 h-4 text-[#64748b]" />
              Add Candidate
            </button>
          )}

          {canCreate && (
            <button
              type="button"
              onClick={() => setShowCreateJob(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Post Job Opening
            </button>
          )}
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Active Jobs */}
        <div className="p-4 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b]">Active Openings</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200/50">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#111827] font-mono">
            {isLoading ? '...' : metrics.activeJobs}
          </p>
          <Link
            to="/dashboard/recruitment/jobs"
            className="text-[11px] font-semibold text-[#f97316] hover:underline inline-flex items-center gap-1 pt-1"
          >
            View openings <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* In Pipeline */}
        <div className="p-4 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b]">In Pipeline</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/50">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#111827] font-mono">
            {isLoading ? '...' : metrics.candidatesInPipeline}
          </p>
          <Link
            to="/dashboard/recruitment/pipeline"
            className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1 pt-1"
          >
            ATS Kanban <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Interviews This Week */}
        <div className="p-4 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b]">Interviews (Week)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/50">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#111827] font-mono">
            {isLoading ? '...' : metrics.interviewsThisWeek}
          </p>
          <Link
            to="/dashboard/recruitment/interviews"
            className="text-[11px] font-semibold text-purple-600 hover:underline inline-flex items-center gap-1 pt-1"
          >
            Roster & schedule <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Offers Pending */}
        <div className="p-4 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b]">Offers Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/50">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#111827] font-mono">
            {isLoading ? '...' : metrics.pendingOffers}
          </p>
          <Link
            to="/dashboard/recruitment/offers"
            className="text-[11px] font-semibold text-amber-600 hover:underline inline-flex items-center gap-1 pt-1"
          >
            View offers <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Hired This Month */}
        <div className="p-4 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-2 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b]">Hired This Month</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/50">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 font-mono">
            {isLoading ? '...' : metrics.hiredThisMonth}
          </p>
          <span className="text-[10px] text-[#64748b] block pt-1">
            Directly onboarded to HRMS
          </span>
        </div>
      </div>

      {/* ── ATS Funnel Overview ── */}
      <div className="p-5 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Candidate Pipeline Stages</h3>
            <p className="text-xs text-[#64748b]">Real-time applicant distribution across ATS stages</p>
          </div>
          <Link
            to="/dashboard/recruitment/pipeline"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#f97316] hover:underline"
          >
            Open Interactive Kanban <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2 select-none">
          {CANDIDATE_STAGES.map((stg) => {
            const count = summary?.stageCounts?.[stg] || 0;
            return (
              <Link
                key={stg}
                to={`/dashboard/recruitment/candidates?stage=${stg}`}
                className="p-3 rounded-xl border border-[#ECE0D6] bg-[#FBF8F4] hover:bg-[#fff7ed] hover:border-[#fed7aa] transition-all text-center group"
              >
                <p className="text-lg font-bold text-[#111827] font-mono group-hover:text-[#ea580c]">
                  {count}
                </p>
                <div className="mt-1">
                  <CandidateStagePill stage={stg} size="sm" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Split Grid: Active Openings & Upcoming Interviews ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Openings (2 Columns) */}
        <div className="lg:col-span-2 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Active Job Openings</h3>
              <p className="text-xs text-[#64748b]">Positions currently accepting applications</p>
            </div>
            <Link
              to="/dashboard/recruitment/jobs"
              className="text-xs font-semibold text-[#f97316] hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="divide-y divide-[#F3EDE4] flex-1">
            {(!summary?.recentJobs || summary.recentJobs.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active job openings posted yet.
              </div>
            ) : (
              summary.recentJobs.map((job) => (
                <div
                  key={job._id}
                  className="p-4 hover:bg-[#FAF7F2] transition-colors flex items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#111827] truncate">{job.title}</h4>
                      <span className="font-mono text-[10px] text-[#9B9B9B] px-1.5 py-0.2 rounded bg-[#FAF7F2] border border-[#ECE0D6]">
                        {job.jobCode}
                      </span>
                      <JobStatusPill status={job.status} />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#64748b]">
                      <span>
                        {typeof job.departmentId === 'object' && job.departmentId
                          ? job.departmentId.name
                          : 'Department'}
                      </span>
                      <span>·</span>
                      <span>{job.employmentType.replace('_', ' ')}</span>
                      <span>·</span>
                      <span>{job.location || 'Remote'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#111827] font-mono">
                        {job.filledPositions} / {job.openPositions}
                      </span>
                      <p className="text-[10px] text-[#9B9B9B]">filled positions</p>
                    </div>

                    <Link
                      to={`/dashboard/recruitment/pipeline?jobId=${job._id}`}
                      className="p-2 rounded-xl text-slate-400 hover:text-[#f97316] hover:bg-orange-50 border border-slate-200 transition-colors"
                      title="Open job ATS pipeline"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Interviews (1 Column) */}
        <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Upcoming Interviews</h3>
              <p className="text-xs text-[#64748b]">Scheduled panel rounds</p>
            </div>
            <Link
              to="/dashboard/recruitment/interviews"
              className="text-xs font-semibold text-[#f97316] hover:underline"
            >
              Calendar
            </Link>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
            {(!summary?.upcomingInterviews || summary.upcomingInterviews.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No interviews scheduled in the near future.
              </div>
            ) : (
              summary.upcomingInterviews.map((iv) => {
                const candName =
                  typeof iv.candidateId === 'object' && iv.candidateId
                    ? iv.candidateId.fullName
                    : 'Candidate';

                return (
                  <div
                    key={iv._id}
                    className="p-3.5 rounded-xl border border-[#ECE0D6] bg-[#FAF7F2] space-y-2 hover:border-[#fed7aa] transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#111827]">{iv.title}</p>
                        <p className="text-[11px] text-[#f97316] font-medium">{candName}</p>
                      </div>
                      <span className="text-[9.5px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {iv.roundType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10.5px] text-[#64748b] pt-1 border-t border-[#ECE0D6]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(iv.scheduledStart).toLocaleDateString([], { month: 'short', day: 'numeric' })},{' '}
                        {new Date(iv.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {iv.meetingLink && (
                        <a
                          href={iv.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          Join
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateJobModal
        open={showCreateJob}
        onClose={() => setShowCreateJob(false)}
      />
      <AddCandidateModal
        open={showAddCandidate}
        onClose={() => setShowAddCandidate(false)}
      />
    </div>
  );
};
