import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sliders,
  GitBranch,
  XCircle,
  Cpu,
  Hash,
  Shield,
  Save,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  useRecruitmentSettings,
  useUpdateRecruitmentSettings,
  usePipelineTemplates,
  useRejectionReasons,
} from '../../hooks/useRecruitment';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { recruitmentApi } from '../../lib/recruitmentApi';
import { useQueryClient } from '@tanstack/react-query';
import type { PipelineStageConfig } from '../../types/recruitment';

type SettingsTab = 'pipeline' | 'reasons' | 'ai_governance' | 'numbering';

export const RecruitmentSettingsPage: React.FC = () => {
  const { can } = useModuleAccess('recruitment');
  const canManage = can('edit') || can('create');
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<SettingsTab>('pipeline');

  // Queries
  const { data: settings, isLoading: settingsLoading } = useRecruitmentSettings();
  const { data: templates, isLoading: templatesLoading } = usePipelineTemplates();
  const { data: reasons, isLoading: reasonsLoading } = useRejectionReasons();
  const updateSettings = useUpdateRecruitmentSettings();

  // Local state for Settings form
  const [formSettings, setFormSettings] = useState<{
    aiEnabled: boolean;
    aiMonthlyTokenLimit: number;
    retentionDays: number;
    requireRequisitionApproval: boolean;
    allowDirectJobCreation: boolean;
  }>({
    aiEnabled: true,
    aiMonthlyTokenLimit: 500000,
    retentionDays: 365,
    requireRequisitionApproval: true,
    allowDirectJobCreation: false,
  });

  // Sync settings when loaded
  React.useEffect(() => {
    if (settings) {
      setFormSettings({
        aiEnabled: settings.aiEnabled ?? true,
        aiMonthlyTokenLimit: settings.aiMonthlyTokenLimit ?? 500000,
        retentionDays: settings.retentionDays ?? 365,
        requireRequisitionApproval: settings.requireRequisitionApproval ?? true,
        allowDirectJobCreation: settings.allowDirectJobCreation ?? false,
      });
    }
  }, [settings]);

  // New Rejection Reason State
  const [newReason, setNewReason] = useState({
    code: '',
    label: '',
    category: 'competency',
  });
  const [isSubmittingReason, setIsSubmittingReason] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync(formSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to update settings');
    }
  };

  const handleAddReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReason.code || !newReason.label) return;
    setIsSubmittingReason(true);
    try {
      await recruitmentApi.createRejectionReason(newReason);
      queryClient.invalidateQueries({ queryKey: ['recruitment', 'rejection-reasons'] });
      setNewReason({ code: '', label: '', category: 'competency' });
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to create rejection reason');
    } finally {
      setIsSubmittingReason(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-[#ECE0D6] bg-white px-3.5 py-2.5 text-xs text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-100/60 text-orange-700 text-[11px] font-bold mb-1">
            <Sliders className="w-3.5 h-3.5" />
            Recruitment Configuration
          </div>
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
            Recruitment ERP Settings
          </h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            Configure pipeline stages, SLA thresholds, rejection taxonomies, and AI governance.
          </p>
        </div>
      </motion.div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-[#ECE0D6] pb-1">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'pipeline'
              ? 'bg-[#f97316] text-white shadow-2xs'
              : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4]'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Pipeline Stages & SLAs
        </button>

        <button
          onClick={() => setActiveTab('reasons')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'reasons'
              ? 'bg-[#f97316] text-white shadow-2xs'
              : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4]'
          }`}
        >
          <XCircle className="w-4 h-4" />
          Rejection Reasons
        </button>

        <button
          onClick={() => setActiveTab('ai_governance')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'ai_governance'
              ? 'bg-[#f97316] text-white shadow-2xs'
              : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4]'
          }`}
        >
          <Cpu className="w-4 h-4" />
          AI & ERP Governance
        </button>

        <button
          onClick={() => setActiveTab('numbering')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'numbering'
              ? 'bg-[#f97316] text-white shadow-2xs'
              : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4]'
          }`}
        >
          <Hash className="w-4 h-4" />
          Entity Sequences
        </button>
      </div>

      {/* ── Tab 1: Pipeline Stages & SLAs ── */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#111827]">Configured Pipeline Templates</h2>
              <p className="text-xs text-[#64748b]">
                Templates define the recruitment workflow stages, ordering, and SLA breach thresholds.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {templatesLoading ? (
              <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-[#ECE0D6]">
                Loading pipeline templates...
              </div>
            ) : (!templates || templates.length === 0) ? (
              <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-[#ECE0D6]">
                No pipeline templates configured yet. System uses Standard Default Pipeline.
              </div>
            ) : (
              templates.map((tpl) => (
                <div
                  key={tpl._id}
                  className="bg-white rounded-2xl border border-[#ECE0D6] p-6 shadow-2xs space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-[#111827]">{tpl.name}</h3>
                          {tpl.isDefault && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Tenant Default
                            </span>
                          )}
                        </div>
                        {tpl.description && (
                          <p className="text-xs text-[#64748b]">{tpl.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stage Sequence with SLA Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 pt-2">
                    {tpl.stages.map((stg: PipelineStageConfig) => (
                      <div
                        key={stg.key}
                        className="p-3 rounded-xl border border-[#ECE0D6] bg-[#FBF8F4] flex flex-col justify-between space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            #{stg.order}
                          </span>
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: stg.color || '#f97316' }}
                          />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-[#111827]">{stg.name}</p>
                          <span className="text-[10px] text-slate-500 capitalize">{stg.type}</span>
                        </div>
                        <div className="pt-2 border-t border-[#ECE0D6] flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{stg.slaDays} Days SLA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Tab 2: Rejection Reasons Catalog ── */}
      {activeTab === 'reasons' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Rejection List */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#111827]">Standard Rejection Reason Taxonomy</h2>
              <p className="text-xs text-[#64748b]">
                Standardized reasons required for candidate rejection to prevent disparate impact and enable ERP audit trails.
              </p>
            </div>

            <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                    <th className="px-5 py-3 font-bold">Reason Code</th>
                    <th className="px-5 py-3 font-bold">Display Label</th>
                    <th className="px-5 py-3 font-bold">Category</th>
                    <th className="px-5 py-3 font-bold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EDE4]">
                  {reasonsLoading ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                        Loading rejection reasons...
                      </td>
                    </tr>
                  ) : (!reasons || reasons.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                        No rejection reasons configured.
                      </td>
                    </tr>
                  ) : (
                    reasons.map((r) => (
                      <tr key={r._id} className="hover:bg-[#FAF7F2]">
                        <td className="px-5 py-3 font-mono font-bold text-slate-700">{r.code}</td>
                        <td className="px-5 py-3 font-medium text-slate-900">{r.label}</td>
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                            {r.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.isActive
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {r.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Col: Add Reason Form */}
          <div className="bg-white rounded-2xl border border-[#ECE0D6] p-6 shadow-2xs space-y-4 h-fit">
            <h3 className="font-bold text-sm text-[#111827] flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#f97316]" />
              Add Rejection Reason
            </h3>
            <form onSubmit={handleAddReason} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Reason Code (e.g. SKILL_GAP)
                </label>
                <input
                  type="text"
                  required
                  placeholder="CODE_IDENTIFIER"
                  value={newReason.code}
                  onChange={(e) =>
                    setNewReason({ ...newReason, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Display Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Insufficient Technical Experience"
                  value={newReason.label}
                  onChange={(e) => setNewReason({ ...newReason, label: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={newReason.category}
                  onChange={(e) => setNewReason({ ...newReason, category: e.target.value })}
                  className={inputCls}
                >
                  <option value="competency">Competency & Skills</option>
                  <option value="compensation">Compensation Mismatch</option>
                  <option value="behavioral">Behavioral & Culture Fit</option>
                  <option value="process">Hiring Process / Dropped</option>
                  <option value="candidate_choice">Candidate Declined Offer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmittingReason}
                className="w-full mt-2 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-xs transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {isSubmittingReason ? 'Adding...' : 'Add to Catalog'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Tab 3: AI & ERP Governance ── */}
      {activeTab === 'ai_governance' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-3xl">
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Recruitment settings saved successfully!
            </div>
          )}

          {/* AI Settings Section */}
          <div className="bg-white rounded-2xl border border-[#ECE0D6] p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#f97316]" />
              <div>
                <h3 className="font-bold text-sm text-[#111827]">AI Assistance & Token Limits</h3>
                <p className="text-xs text-[#64748b]">
                  Controls resume parsing, candidate scoring, and job description generation.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
              <div>
                <p className="text-xs font-bold text-slate-800">Enable AI Features</p>
                <p className="text-[11px] text-[#64748b]">
                  Turn on automatic JD generator, AI resume screen, and smart candidate matching.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormSettings({ ...formSettings, aiEnabled: !formSettings.aiEnabled })}
                className="text-2xl text-[#f97316]"
              >
                {formSettings.aiEnabled ? (
                  <ToggleRight className="w-8 h-8 text-[#f97316]" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Monthly AI Token Quota
              </label>
              <input
                type="number"
                min="50000"
                step="50000"
                value={formSettings.aiMonthlyTokenLimit}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    aiMonthlyTokenLimit: parseInt(e.target.value) || 500000,
                  })
                }
                className={inputCls}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used this month: {(settings?.aiTokensUsedThisMonth || 0).toLocaleString()} tokens
              </p>
            </div>
          </div>

          {/* ERP Governance Section */}
          <div className="bg-white rounded-2xl border border-[#ECE0D6] p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-sm text-[#111827]">ERP Headcount & Data Governance</h3>
                <p className="text-xs text-[#64748b]">
                  Enterprise requisition controls and compliance retention.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
              <div>
                <p className="text-xs font-bold text-slate-800">Enforce Requisition Gate</p>
                <p className="text-[11px] text-[#64748b]">
                  Mandate that Job Openings must originate from an Approved Requisition.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormSettings({
                    ...formSettings,
                    requireRequisitionApproval: !formSettings.requireRequisitionApproval,
                  })
                }
              >
                {formSettings.requireRequisitionApproval ? (
                  <ToggleRight className="w-8 h-8 text-[#f97316]" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Candidate Data Retention (Days)
              </label>
              <input
                type="number"
                min="30"
                value={formSettings.retentionDays}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    retentionDays: parseInt(e.target.value) || 365,
                  })
                }
                className={inputCls}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                GDPR/DPDP compliance: unhired candidate resumes and applications are archived after this timeframe.
              </p>
            </div>
          </div>

          {canManage && (
            <button
              type="submit"
              disabled={updateSettings.isPending}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all"
            >
              <Save className="w-4 h-4" />
              {updateSettings.isPending ? 'Saving Settings...' : 'Save Configuration'}
            </button>
          )}
        </form>
      )}

      {/* ── Tab 4: Entity Sequences ── */}
      {activeTab === 'numbering' && (
        <div className="bg-white rounded-2xl border border-[#ECE0D6] p-6 shadow-2xs space-y-4 max-w-2xl">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-[#f97316]" />
            <div>
              <h3 className="font-bold text-sm text-[#111827]">Atomic ERP Entity Sequences</h3>
              <p className="text-xs text-[#64748b]">
                Nebula Hub uses year-scoped multi-tenant atomic counters (guaranteed no gaps or duplicates).
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Manpower Requisitions</p>
                <span className="text-[11px] text-slate-500">Prefix: REQ</span>
              </div>
              <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                REQ-2026-0001
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Job Openings</p>
                <span className="text-[11px] text-slate-500">Prefix: JOB</span>
              </div>
              <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                JOB-2026-0001
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Candidate Profiles</p>
                <span className="text-[11px] text-slate-500">Prefix: CAN</span>
              </div>
              <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                CAN-2026-0001
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Job Applications</p>
                <span className="text-[11px] text-slate-500">Prefix: APP</span>
              </div>
              <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                APP-2026-0001
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Job Offers</p>
                <span className="text-[11px] text-slate-500">Prefix: OFF</span>
              </div>
              <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200">
                OFF-2026-0001
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
