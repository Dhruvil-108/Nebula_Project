import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Users,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Scale,
  RefreshCw,
} from 'lucide-react';
import { useEeoDemographics, useAdverseImpactAnalysis } from '../../hooks/useRecruitment';

export const EeoCompliancePage: React.FC = () => {
  const { data: demographics, isLoading: isLoadingDemo, refetch: refetchDemo } = useEeoDemographics();
  const { data: adverseImpact, isLoading: isLoadingImpact, refetch: refetchImpact } = useAdverseImpactAnalysis();

  const handleRefresh = () => {
    refetchDemo();
    refetchImpact();
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
              EEO Compliance & Adverse Impact Audits
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              EEOC Standards
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-0.5">
            Anonymized voluntary candidate demographic reporting and automated Four-Fifths (80%) Rule adverse impact diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors"
            title="Refresh compliance metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* ── Anti-Bias Legal Guarantee Banner ── */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 shadow-2xs flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-[#111827]">
            Strict Candidate Privacy & Anti-Bias Separation
          </h3>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
            In compliance with the U.S. Equal Employment Opportunity Commission (EEOC) and international
            anti-discrimination standards, demographic surveys are gathered voluntarily and stored with zero
            linkage to individual candidate resumes, stage progression cards, or interviewer scorecards.
            Hiring managers and interviewers cannot view individual demographic submissions.
          </p>
        </div>
      </div>

      {/* ── Four-Fifths (80%) Rule Adverse Impact Analysis ── */}
      <div className="bg-white border border-[#ECE0D6] rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#111827]">
                Uniform Guidelines on Employee Selection (4/5ths Rule Diagnostic)
              </h3>
              <p className="text-[11px] text-[#6B6B6B]">
                A selection rate for any group less than four-fifths (80%) of the rate for the highest group is regarded as evidence of adverse impact.
              </p>
            </div>
          </div>
          {adverseImpact && (
            <span className="text-xs font-bold text-orange-700 bg-orange-50 px-3 py-1 rounded-lg border border-orange-200">
              Benchmark: {adverseImpact.benchmarkGroup} ({adverseImpact.highestSelectionRatePercent}%)
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3.5 font-bold">Demographic Subgroup</th>
                <th className="px-5 py-3.5 font-bold">Applicants Volume</th>
                <th className="px-5 py-3.5 font-bold">Hired Selections</th>
                <th className="px-5 py-3.5 font-bold">Selection Rate</th>
                <th className="px-5 py-3.5 font-bold">Impact Ratio vs Benchmark</th>
                <th className="px-5 py-3.5 font-bold">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoadingImpact ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Calculating selection ratios...
                  </td>
                </tr>
              ) : !adverseImpact || adverseImpact.groups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Insufficient data to evaluate adverse impact ratios.
                  </td>
                </tr>
              ) : (
                adverseImpact.groups.map((grp) => (
                  <tr key={grp.group} className="hover:bg-[#FAF7F2] transition-colors">
                    <td className="px-5 py-4 font-bold text-[#111827] capitalize">
                      {grp.group}
                      {grp.isBenchmark && (
                        <span className="ml-2 px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          BENCHMARK
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono font-medium text-[#111827]">
                      {grp.totalApplicants}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-emerald-700">
                      {grp.hires}
                    </td>
                    <td className="px-5 py-4 font-mono font-semibold text-slate-800">
                      {grp.selectionRatePercent}%
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-orange-600">
                      {(grp.impactRatio * 100).toFixed(1)}%
                    </td>
                    <td className="px-5 py-4">
                      {grp.hasAdverseImpactNotice ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Adverse Disparity (&lt; 80%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Compliant (&ge; 80%)
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Demographic Distribution Breakdowns ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gender Breakdown */}
        <div className="bg-white border border-[#ECE0D6] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-3">
            <h3 className="text-sm font-bold text-[#111827]">Gender Identity Distribution</h3>
            <span className="text-xs text-[#6B6B6B] font-mono">
              Total: {demographics?.totalSubmissions || 0}
            </span>
          </div>
          <div className="space-y-3">
            {isLoadingDemo ? (
              <p className="py-8 text-center text-xs text-slate-400">Loading...</p>
            ) : (
              (demographics?.gender || []).map((item) => (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <span className="font-bold text-[#111827]">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${item.percentage}%` }}
                      className="h-full bg-orange-500 rounded-full"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ethnicity Breakdown */}
        <div className="bg-white border border-[#ECE0D6] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-3">
            <h3 className="text-sm font-bold text-[#111827]">Race & Ethnicity Distribution</h3>
            <span className="text-xs text-[#6B6B6B] font-mono">
              Total: {demographics?.totalSubmissions || 0}
            </span>
          </div>
          <div className="space-y-3">
            {isLoadingDemo ? (
              <p className="py-8 text-center text-xs text-slate-400">Loading...</p>
            ) : (
              (demographics?.ethnicity || []).map((item) => (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <span className="font-bold text-[#111827]">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${item.percentage}%` }}
                      className="h-full bg-amber-500 rounded-full"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Veteran Status */}
        <div className="bg-white border border-[#ECE0D6] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-3">
            <h3 className="text-sm font-bold text-[#111827]">Veteran Status</h3>
          </div>
          <div className="space-y-3">
            {isLoadingDemo ? (
              <p className="py-8 text-center text-xs text-slate-400">Loading...</p>
            ) : (
              (demographics?.veteranStatus || []).map((item) => (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <span className="font-bold text-[#111827]">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${item.percentage}%` }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Disability Status */}
        <div className="bg-white border border-[#ECE0D6] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-3">
            <h3 className="text-sm font-bold text-[#111827]">Disability Accommodations</h3>
          </div>
          <div className="space-y-3">
            {isLoadingDemo ? (
              <p className="py-8 text-center text-xs text-slate-400">Loading...</p>
            ) : (
              (demographics?.disabilityStatus || []).map((item) => (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.label}</span>
                    <span className="font-bold text-[#111827]">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${item.percentage}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
