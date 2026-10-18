import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  Award,
  Filter,
  Download,
  Search,
  Sparkles,
  ArrowRight,
  Briefcase,
  AlertCircle,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  useRecruitmentAnalyticsOverview,
  useFunnelAnalytics,
  useSourcingRoi,
  useVelocityMetrics,
  useSemanticSearchCandidates,
} from '../../hooks/useRecruitment';
import { ExportReportModal } from '../../components/recruitment/ExportReportModal';
import { RecruiterCopilotDrawer } from '../../components/recruitment/RecruiterCopilotDrawer';

export const RecruitmentAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'funnel' | 'sources' | 'velocity' | 'search'>('funnel');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);

  // Semantic search state
  const [searchQuery, setSearchQuery] = useState('');
  const [silverMedalistsOnly, setSilverMedalistsOnly] = useState(false);

  const { data: overview, isLoading: isLoadingOverview } = useRecruitmentAnalyticsOverview();
  const { data: funnelData, isLoading: isLoadingFunnel } = useFunnelAnalytics();
  const { data: sources, isLoading: isLoadingSources } = useSourcingRoi();
  const { data: velocity, isLoading: isLoadingVelocity } = useVelocityMetrics();

  const semanticSearchMutation = useSemanticSearchCandidates();

  const handleSemanticSearch = (e: React.FormEvent) => {
    e.preventDefault();
    semanticSearchMutation.mutate({
      query: searchQuery.trim(),
      silverMedalistsOnly,
      minRating: silverMedalistsOnly ? 3 : undefined,
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto font-sans">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
              Recruitment Analytics & Talent Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
              Phase 5
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-0.5">
            Real-time hiring velocity, funnel drop-off diagnostics, sourcing channel ROI, and semantic silver-medalist rediscovery.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#1A1A1A] bg-white border border-[#ECE0D6] hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-orange-600" />
            Export Data
          </button>

          <button
            type="button"
            onClick={() => setShowCopilot(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            Recruiter Copilot
          </button>
        </div>
      </motion.div>

      {/* ── Top Executive KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Time-to-Hire */}
        <div className="bg-white border border-[#ECE0D6] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">
              Average Time-to-Hire
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#111827]">
              {isLoadingOverview ? '...' : `${overview?.avgTimeToHireDays || 24} Days`}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">Target: &lt; 30d</span>
          </div>
          <p className="text-[11px] text-[#6B6B6B] mt-1">Application intake to offer acceptance</p>
        </div>

        {/* Offer Acceptance Rate */}
        <div className="bg-white border border-[#ECE0D6] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">
              Offer Acceptance Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">
              {isLoadingOverview ? '...' : `${overview?.offerAcceptanceRate || 85.7}%`}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">High benchmark</span>
          </div>
          <p className="text-[11px] text-[#6B6B6B] mt-1">Accepted vs Total offers extended</p>
        </div>

        {/* Total Hires */}
        <div className="bg-white border border-[#ECE0D6] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">
              Total Hires Completed
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#111827]">
              {isLoadingOverview ? '...' : overview?.totalHires || 0}
            </span>
            <span className="text-xs text-blue-600 font-semibold">Converted to HRMS</span>
          </div>
          <p className="text-[11px] text-[#6B6B6B] mt-1">Onboarded into active employee records</p>
        </div>

        {/* Active Candidates Pipeline */}
        <div className="bg-white border border-[#ECE0D6] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">
              Active Sourcing Volume
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#111827]">
              {isLoadingOverview ? '...' : overview?.activeCandidates || 0}
            </span>
            <span className="text-xs text-slate-500 font-semibold">In active stages</span>
          </div>
          <p className="text-[11px] text-[#6B6B6B] mt-1">Across {overview?.openJobOpenings || 0} open job postings</p>
        </div>
      </div>

      {/* ── Interactive Navigation Tabs ── */}
      <div className="flex items-center border-b border-[#ECE0D6] bg-white px-4 rounded-xl gap-6 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('funnel')}
          className={`py-3.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'funnel'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-[#6B6B6B] hover:text-[#1A1A1A]'
          }`}
        >
          Pipeline Funnel & Drop-off
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sources')}
          className={`py-3.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'sources'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-[#6B6B6B] hover:text-[#1A1A1A]'
          }`}
        >
          Sourcing Channels & ROI
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('velocity')}
          className={`py-3.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'velocity'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-[#6B6B6B] hover:text-[#1A1A1A]'
          }`}
        >
          Department Velocity
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'search'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-[#6B6B6B] hover:text-[#1A1A1A]'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Semantic Talent Rediscovery
        </button>
      </div>

      {/* ── TAB 1: Pipeline Funnel & Drop-off ── */}
      {activeTab === 'funnel' && (
        <div className="bg-white border border-[#ECE0D6] rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Candidate Pipeline Drop-off Analysis</h3>
              <p className="text-xs text-[#6B6B6B]">
                Track sequential progression and pinpoint attrition stages across candidate journeys.
              </p>
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
              Total Ingested: {funnelData?.totalCandidates || 0}
            </span>
          </div>

          <div className="space-y-4">
            {isLoadingFunnel ? (
              <p className="py-12 text-center text-xs text-slate-400">Loading funnel metrics...</p>
            ) : !funnelData || funnelData.funnel.length === 0 ? (
              <p className="py-12 text-center text-xs text-slate-400">No candidate funnel data available.</p>
            ) : (
              funnelData.funnel.map((stage, idx) => (
                <div key={stage.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-[#111827]">{stage.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="font-mono font-bold text-[#111827]">{stage.count} Candidates</span>
                      <span className="text-emerald-600 font-semibold">
                        {stage.passThroughRate}% pass-through
                      </span>
                      {stage.dropOffRate > 0 && (
                        <span className="text-rose-600 font-semibold">
                          (-{stage.dropOffRate}% drop-off)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${stage.passThroughRate}%` }}
                      className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: Sourcing Channels & ROI ── */}
      {activeTab === 'sources' && (
        <div className="bg-white border border-[#ECE0D6] rounded-2xl shadow-xs overflow-hidden">
          <div className="p-6 border-b border-[#ECE0D6]">
            <h3 className="text-sm font-bold text-[#111827]">Sourcing Channel ROI & Conversion Efficiency</h3>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Compare volume of applicants vs quality hires produced across recruitment marketing channels.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                  <th className="px-6 py-3.5 font-bold">Channel / Sourcing Source</th>
                  <th className="px-6 py-3.5 font-bold">Applicants Volume</th>
                  <th className="px-6 py-3.5 font-bold">Hires Generated</th>
                  <th className="px-6 py-3.5 font-bold">Hire Conversion Rate</th>
                  <th className="px-6 py-3.5 font-bold">Avg Candidate Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EDE4]">
                {isLoadingSources ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      Loading sourcing channel ROI...
                    </td>
                  </tr>
                ) : !sources || sources.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No sourcing data recorded.
                    </td>
                  </tr>
                ) : (
                  sources.map((item) => (
                    <tr key={item.source} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="px-6 py-4 font-bold text-[#111827] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        {item.label}
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-[#111827]">
                        {item.applicants}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-emerald-700">
                        {item.hires}
                      </td>
                      <td className="px-6 py-4 font-semibold text-orange-600">
                        {item.conversionRate}%
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        ★ {item.avgRating || '—'} / 5.0
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: Department Velocity ── */}
      {activeTab === 'velocity' && (
        <div className="bg-white border border-[#ECE0D6] rounded-2xl shadow-xs overflow-hidden">
          <div className="p-6 border-b border-[#ECE0D6]">
            <h3 className="text-sm font-bold text-[#111827]">Departmental Headcount Hiring Velocity</h3>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Positions filled vs open requisitions across departments.
            </p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingVelocity ? (
              <p className="col-span-full py-12 text-center text-xs text-slate-400">Loading velocity metrics...</p>
            ) : !velocity || velocity.length === 0 ? (
              <p className="col-span-full py-12 text-center text-xs text-slate-400">No departmental velocity data.</p>
            ) : (
              velocity.map((v) => {
                const fillRatio =
                  v.totalOpenings > 0
                    ? Math.round((v.filledPositions / (v.filledPositions + v.openPositions || 1)) * 100)
                    : 0;

                return (
                  <div key={v.department} className="border border-[#ECE0D6] rounded-2xl p-4 bg-[#FBF8F4] space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#111827]">{v.department}</h4>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {v.totalOpenings} Active Requisitions
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-600">Filled Positions:</span>
                      <span className="font-bold text-emerald-700 font-mono">{v.filledPositions}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Pending Headcount:</span>
                      <span className="font-bold text-orange-600 font-mono">{v.openPositions}</span>
                    </div>

                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${fillRatio}%` }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: Semantic Talent Rediscovery ── */}
      {activeTab === 'search' && (
        <div className="bg-white border border-[#ECE0D6] rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Semantic Talent Rediscovery Engine</h3>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Query past applicants, runner-up silver medalists, and talent pools using natural language skills and keywords.
            </p>
          </div>

          <form onSubmit={handleSemanticSearch} className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Senior engineers with React, Node.js, and AWS experience who reached final rounds..."
                className="w-full rounded-xl border border-[#ECE0D6] bg-white pl-10 pr-32 py-2.5 text-xs text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316]"
              />
              <button
                type="submit"
                disabled={semanticSearchMutation.isPending}
                className="absolute right-1.5 top-1.5 px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors disabled:opacity-50"
              >
                {semanticSearchMutation.isPending ? 'Searching...' : 'Search Talent'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="silverMedalists"
                checked={silverMedalistsOnly}
                onChange={(e) => setSilverMedalistsOnly(e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500 w-3.5 h-3.5 cursor-pointer"
              />
              <label htmlFor="silverMedalists" className="text-xs text-[#4A4A4A] cursor-pointer">
                Filter for <strong>Silver Medalists</strong> only (Candidates who reached late interview stages with rating &ge; 3★)
              </label>
            </div>
          </form>

          {/* Search Results */}
          <div className="space-y-3">
            {semanticSearchMutation.data?.candidates && (
              <p className="text-xs font-bold text-[#111827]">
                Found {semanticSearchMutation.data.count} Matching Candidates:
              </p>
            )}

            {semanticSearchMutation.data?.candidates?.map((c) => (
              <div
                key={c._id}
                className="border border-[#ECE0D6] rounded-xl p-4 bg-[#FBF8F4] hover:bg-[#FAF7F2] transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#111827]">{c.fullName}</h4>
                    <span className="font-mono text-[10px] text-slate-500">
                      ({c.candidateCode})
                    </span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
                      {c.relevanceScore}% Match
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                    Target Role: {c.jobOpeningId?.title || 'General'} • Stage: {c.stage} • Rating: ★ {c.rating || 0}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {(c.skills || []).map((sk: string) => (
                      <span
                        key={sk}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white border border-[#ECE0D6] text-slate-700"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowCopilot(true);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-[#ECE0D6] bg-white text-xs font-semibold text-orange-600 hover:bg-orange-50 transition-colors"
                >
                  Analyze with Copilot →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      <ExportReportModal open={showExportModal} onClose={() => setShowExportModal(false)} />

      {/* Recruiter Copilot Drawer */}
      <RecruiterCopilotDrawer open={showCopilot} onClose={() => setShowCopilot(false)} />
    </div>
  );
};
