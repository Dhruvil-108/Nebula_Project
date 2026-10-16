import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  Kanban,
  Search,
  RefreshCw,
  Plus,
  Briefcase,
  Users,
} from 'lucide-react';
import {
  useRecruitmentPipeline,
  useJobs,
} from '../../hooks/useRecruitment';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { RecruitmentKanban } from '../../components/recruitment/RecruitmentKanban';
import { CandidateDrawer } from '../../components/recruitment/CandidateDrawer';
import { AddCandidateModal } from '../../components/recruitment/AddCandidateModal';
import { ScheduleInterviewModal } from '../../components/recruitment/ScheduleInterviewModal';
import { CreateOfferModal } from '../../components/recruitment/CreateOfferModal';
import { OnboardEmployeeModal } from '../../components/recruitment/OnboardEmployeeModal';
import { FloatingDropdown } from '../../components/ui/FloatingDropdown';
import type { Candidate } from '../../types/recruitment';

export const PipelinePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';

  const { can } = useModuleAccess('recruitment');
  const canCreate = can('create');

  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId);
  const [search, setSearch] = useState<string>('');

  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candidateIdForDrawer, setCandidateIdForDrawer] = useState<string | null>(null);

  // Modals state
  const [showAddCandidate, setShowAddCandidate] = useState(false);
  const [interviewCandidate, setInterviewCandidate] = useState<Candidate | null>(null);
  const [offerCandidate, setOfferCandidate] = useState<Candidate | null>(null);
  const [onboardCandidate, setOnboardCandidate] = useState<Candidate | null>(null);

  const { data: jobs } = useJobs({ status: 'published' });
  const { data: pipelineData, isLoading, refetch } = useRecruitmentPipeline({
    jobOpeningId: selectedJobId || undefined,
    search: search || undefined,
  });

  const handleSelectCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setCandidateIdForDrawer(candidate._id);
  };

  const inputCls =
    'rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-xs text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1700px] mx-auto flex flex-col min-h-[calc(100vh-80px)]">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#ea580c] bg-[#fff7ed] px-2 py-0.5 rounded-full border border-[#fed7aa]">
              ATS Pipeline Board
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
            Applicant Tracking Pipeline
          </h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            Drag and drop applicants through evaluation stages from applied to hired.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors"
            title="Refresh pipeline"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={() => setShowAddCandidate(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Candidate
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Filters Bar ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
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

        <div className="w-full sm:w-72">
          <FloatingDropdown
            value={selectedJobId}
            onChange={(val) => {
              setSelectedJobId(val);
              setSearchParams(val ? { jobId: val } : {});
            }}
            options={[
              { value: '', label: `All Job Openings (${pipelineData?.totalCandidates || 0})` },
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
      </div>

      {/* ── Kanban Board Canvas ── */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 border border-[#ECE0D6] rounded-2xl bg-white text-slate-400 text-sm">
            Loading ATS pipeline...
          </div>
        ) : pipelineData ? (
          <RecruitmentKanban
            payload={pipelineData}
            onSelectCandidate={handleSelectCandidate}
          />
        ) : null}
      </div>

      {/* ── Slide-over Candidate Drawer ── */}
      <CandidateDrawer
        candidateId={candidateIdForDrawer}
        onClose={() => setCandidateIdForDrawer(null)}
        onScheduleInterview={(cand) => {
          setInterviewCandidate(cand);
        }}
        onCreateOffer={(cand) => {
          setOfferCandidate(cand);
        }}
        onOnboardEmployee={(cand) => {
          setOnboardCandidate(cand);
        }}
      />

      {/* Modals */}
      <AddCandidateModal
        open={showAddCandidate}
        onClose={() => setShowAddCandidate(false)}
        defaultJobId={selectedJobId}
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
    </div>
  );
};
