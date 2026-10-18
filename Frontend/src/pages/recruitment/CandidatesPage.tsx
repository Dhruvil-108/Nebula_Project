import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Star,
  FileText,
  Mail,
  CalendarClock,
  Award,
  UserCheck,
  ChevronRight,
  Briefcase,
} from 'lucide-react';
import {
  useCandidates,
  useJobs,
} from '../../hooks/useRecruitment';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { CandidateStagePill } from '../../components/recruitment/CandidateStagePill';
import { CandidateDrawer } from '../../components/recruitment/CandidateDrawer';
import { AddCandidateModal } from '../../components/recruitment/AddCandidateModal';
import { ScheduleInterviewModal } from '../../components/recruitment/ScheduleInterviewModal';
import { CreateOfferModal } from '../../components/recruitment/CreateOfferModal';
import { OnboardEmployeeModal } from '../../components/recruitment/OnboardEmployeeModal';
import { BulkActionBar } from '../../components/recruitment/BulkActionBar';
import { FloatingDropdown } from '../../components/ui/FloatingDropdown';
import {
  CANDIDATE_STAGES,
  STAGE_LABELS,
  CANDIDATE_SOURCES,
  SOURCE_LABELS,
  type Candidate,
  type CandidateStage,
} from '../../types/recruitment';

export const CandidatesPage: React.FC = () => {
  const { can } = useModuleAccess('recruitment');
  const canCreate = can('create');

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  // Sub-modals
  const [interviewCandidate, setInterviewCandidate] = useState<Candidate | null>(null);
  const [offerCandidate, setOfferCandidate] = useState<Candidate | null>(null);
  const [onboardCandidate, setOnboardCandidate] = useState<Candidate | null>(null);

  const { data: jobs } = useJobs({ status: 'published' });
  const { data: candidates, isLoading, refetch } = useCandidates({
    search: search || undefined,
    stage: stageFilter || undefined,
    jobOpeningId: jobFilter || undefined,
    source: sourceFilter || undefined,
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
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
            Candidate Directory
          </h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            Complete database of applicants, assessment ratings, resumes, and interview feedback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors"
            title="Refresh candidate directory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Candidate
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-[#9B9B9B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate name, email, skills…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} w-full pl-9`}
          />
        </div>

        <div className="w-full sm:w-48">
          <FloatingDropdown
            value={stageFilter}
            onChange={(val) => setStageFilter(val)}
            options={[
              { value: '', label: 'All Stages' },
              ...CANDIDATE_STAGES.map((s) => ({
                value: s,
                label: STAGE_LABELS[s],
              })),
            ]}
          />
        </div>

        <div className="w-full sm:w-60">
          <FloatingDropdown
            value={jobFilter}
            onChange={(val) => setJobFilter(val)}
            options={[
              { value: '', label: 'All Job Openings' },
              ...(jobs || []).map((j) => ({
                value: j._id,
                label: j.title,
                sublabel: j.jobCode,
              })),
            ]}
            searchable={true}
            searchPlaceholder="Search job opening..."
            leftIcon={<Briefcase className="w-3.5 h-3.5 text-slate-400" />}
          />
        </div>

        <div className="w-full sm:w-44">
          <FloatingDropdown
            value={sourceFilter}
            onChange={(val) => setSourceFilter(val)}
            options={[
              { value: '', label: 'All Sources' },
              ...CANDIDATE_SOURCES.map((s) => ({
                value: s,
                label: SOURCE_LABELS[s],
              })),
            ]}
          />
        </div>
      </div>

      {/* ── Candidates Table ── */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-4 py-3.5 font-bold w-10">
                  <input
                    type="checkbox"
                    checked={
                      Boolean(candidates &&
                      candidates.length > 0 &&
                      selectedCandidateIds.length === candidates.length)
                    }
                    onChange={(e) => {
                      if (e.target.checked && candidates) {
                        setSelectedCandidateIds(candidates.map((c) => c._id));
                      } else {
                        setSelectedCandidateIds([]);
                      }
                    }}
                    className="rounded border-[#ECE0D6] text-[#f97316] focus:ring-[#f97316]"
                  />
                </th>
                <th className="px-5 py-3.5 font-bold">Candidate</th>
                <th className="px-5 py-3.5 font-bold">Applied Job</th>
                <th className="px-5 py-3.5 font-bold">Stage</th>
                <th className="px-5 py-3.5 font-bold">Current Role & Exp</th>
                <th className="px-5 py-3.5 font-bold">Rating</th>
                <th className="px-5 py-3.5 font-bold">Source</th>
                <th className="px-5 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    Loading candidates...
                  </td>
                </tr>
              ) : (!candidates || candidates.length === 0) ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    No candidates found matching the selected filters.
                  </td>
                </tr>
              ) : (
                candidates.map((cand) => {
                  const jobName =
                    typeof cand.jobOpeningId === 'object' && cand.jobOpeningId
                      ? cand.jobOpeningId.title
                      : 'Position';

                  return (
                    <tr
                      key={cand._id}
                      onClick={() => setSelectedCandidateId(cand._id)}
                      className={`hover:bg-[#FAF7F2] transition-colors cursor-pointer group ${
                        selectedCandidateIds.includes(cand._id) ? 'bg-orange-50/40' : ''
                      }`}
                    >
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedCandidateIds.includes(cand._id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (selectedCandidateIds.includes(cand._id)) {
                              setSelectedCandidateIds(selectedCandidateIds.filter((id) => id !== cand._id));
                            } else {
                              setSelectedCandidateIds([...selectedCandidateIds, cand._id]);
                            }
                          }}
                          className="rounded border-[#ECE0D6] text-[#f97316] focus:ring-[#f97316]"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-orange-100/70 border border-orange-200 text-orange-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {cand.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#111827] group-hover:text-[#f97316] transition-colors">
                              {cand.fullName}
                            </p>
                            <span className="font-mono text-[10px] text-[#9B9B9B]">
                              {cand.candidateCode} · {cand.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-[#111827] block truncate max-w-xs">
                          {jobName}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <CandidateStagePill stage={cand.stage} size="sm" />
                      </td>

                      <td className="px-5 py-4 space-y-0.5">
                        <span className="text-[#111827] font-medium block">
                          {cand.currentDesignation ? `${cand.currentDesignation} at ` : ''}
                          {cand.currentCompany || 'Not specified'}
                        </span>
                        <span className="text-[10.5px] text-[#6B6B6B] block">
                          {cand.totalExperienceYears}y exp
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {cand.rating > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {cand.rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#9B9B9B]">Unrated</span>
                        )}
                      </td>

                      <td className="px-5 py-4 capitalize text-[#64748b]">
                        {SOURCE_LABELS[cand.source] || cand.source}
                      </td>

                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {cand.resumeUrl && (
                            <a
                              href={cand.resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors"
                              title="View CV"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {cand.convertedEmployeeId ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                              <UserCheck className="w-3 h-3" />
                              Hired
                            </span>
                          ) : cand.stage === 'offer_sent' ? (
                            <button
                              type="button"
                              onClick={() => setOnboardCandidate(cand)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg shadow-2xs hover:from-orange-600 hover:to-amber-700"
                            >
                              Onboard
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedCandidateId(cand._id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#f97316] hover:bg-orange-50 border border-slate-200 transition-colors"
                              title="View details"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidate Details Drawer */}
      <CandidateDrawer
        candidateId={selectedCandidateId}
        onClose={() => setSelectedCandidateId(null)}
        onScheduleInterview={(cand) => setInterviewCandidate(cand)}
        onCreateOffer={(cand) => setOfferCandidate(cand)}
        onOnboardEmployee={(cand) => setOnboardCandidate(cand)}
      />

      {/* Modals */}
      <AddCandidateModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />

      <ScheduleInterviewModal
        open={!!interviewCandidate}
        onClose={() => setInterviewCandidate(null)}
        candidate={interviewCandidate}
      />

      <CreateOfferModal
        open={!!offerCandidate}
        onClose={() => setOfferCandidate(null)}
        candidate={offerCandidate}
      />

      <OnboardEmployeeModal
        open={!!onboardCandidate}
        onClose={() => setOnboardCandidate(null)}
        candidate={onboardCandidate}
      />

      {/* Floating Bulk Operations Bar */}
      <BulkActionBar
        selectedIds={selectedCandidateIds}
        onClear={() => setSelectedCandidateIds([])}
        onRefresh={() => refetch()}
      />
    </div>
  );
};
