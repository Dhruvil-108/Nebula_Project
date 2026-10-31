import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Award,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Filter,
  ChevronRight,
  Send,
  Bot,
  UserCheck,
  ShieldAlert,
  ArrowUpRight,
  Flame,
  Check,
  X,
  FileText,
  Calendar,
  Layers,
  Star,
  Activity,
  Compass,
} from 'lucide-react';
import {
  useGoals,
  useCreateGoal,
  useAddGoalCheckIn,
  useDeleteGoal,
  useReviewCycles,
  useCreateReviewCycle,
  useReviews,
  useSubmitSelfReview,
  useSubmitManagerReview,
  useCalibrateReview,
  useNineBoxGrid,
  useAttritionRisks,
  useRecomputeAttritionRisks,
  useHrmsCopilot,
  useEmployees,
  useDepartments,
} from '../../hooks/useHrms';
import { useAuth } from '../../contexts/AuthContext';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import type {
  Goal,
  GoalCategory,
  GoalStatus,
  ReviewCycle,
  PerformanceReview,
  AttritionRisk,
  HrmsCopilotResponse,
} from '../../types/hrms';

type PerformanceTab = 'goals' | 'reviews' | 'nine_box' | 'attrition' | 'copilot';

const CATEGORY_COLORS: Record<GoalCategory, { bg: string; text: string; border: string }> = {
  engineering: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  sales: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  operations: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  leadership: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  personal_growth: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  general: { bg: 'bg-[#fff7ed]', text: 'text-[#ea580c]', border: 'border-[#fed7aa]' },
};

const STATUS_PILLS: Record<GoalStatus, { bg: string; text: string; label: string }> = {
  not_started: { bg: 'bg-[#FBF8F4] text-[#6B6B6B] border-[#ECE0D6]', text: 'text-[#6B6B6B]', label: 'Not Started' },
  in_progress: { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700', label: 'In Progress' },
  at_risk: { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700', label: 'At Risk' },
  behind: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700', label: 'Behind' },
  completed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', label: 'Completed' },
  cancelled: { bg: 'bg-gray-100 text-gray-500 border-gray-200', text: 'text-gray-500', label: 'Cancelled' },
};

const RISK_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  high: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  critical: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export const PerformancePage: React.FC = () => {
  const { user } = useAuth();
  const { can } = useModuleAccess('hrms');
  const isManagement = can('edit') || can('approve') || ['super_admin', 'admin', 'hr', 'manager'].includes(user?.role || '');

  const [activeTab, setActiveTab] = useState<PerformanceTab>('goals');
  const [goalStatusFilter, setGoalStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Modals State ──
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [checkInNote, setCheckInNote] = useState('');
  const [checkInProgress, setCheckInProgress] = useState<number>(50);

  const [showCycleModal, setShowCycleModal] = useState(false);
  const [showSelfReviewModal, setShowSelfReviewModal] = useState(false);
  const [showManagerReviewModal, setShowManagerReviewModal] = useState(false);
  const [showCalibrateModal, setShowCalibrateModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);

  // Calibration Form State
  const [calibratePerfScore, setCalibratePerfScore] = useState<number>(2);
  const [calibratePotScore, setCalibratePotScore] = useState<number>(2);
  const [calibratePromoRec, setCalibratePromoRec] = useState<boolean>(false);
  const [calibrateIncPct, setCalibrateIncPct] = useState<number>(8);
  const [calibrateNotes, setCalibrateNotes] = useState('');

  // Self Review Form State
  const [selfSummary, setSelfSummary] = useState('');
  const [selfStrengths, setSelfStrengths] = useState('');
  const [selfGrowth, setSelfGrowth] = useState('');
  const [selfRating, setSelfRating] = useState<number>(4);

  // Manager Review Form State
  const [mgrSummary, setMgrSummary] = useState('');
  const [mgrStrengths, setMgrStrengths] = useState('');
  const [mgrGrowth, setMgrGrowth] = useState('');
  const [mgrRating, setMgrRating] = useState<number>(4);
  const [mgrPotRating, setMgrPotRating] = useState<number>(2);

  // AI Copilot State
  const [copilotPrompt, setCopilotPrompt] = useState('');
  const [copilotHistory, setCopilotHistory] = useState<Array<{ prompt: string; response: HrmsCopilotResponse }>>([]);

  // ── Data Queries ──
  const { data: goals, isLoading: goalsLoading, refetch: refetchGoals } = useGoals();
  const { data: cycles, isLoading: cyclesLoading } = useReviewCycles();
  const { data: reviews, isLoading: reviewsLoading, refetch: refetchReviews } = useReviews();
  const { data: nineBoxData, isLoading: nineBoxLoading, refetch: refetchNineBox } = useNineBoxGrid();
  const { data: attritionRisks, isLoading: risksLoading, refetch: refetchRisks } = useAttritionRisks();
  const { data: employees } = useEmployees();
  const { data: departments } = useDepartments();

  // Mutations
  const createGoalMutation = useCreateGoal();
  const checkInMutation = useAddGoalCheckIn();
  const deleteGoalMutation = useDeleteGoal();
  const createCycleMutation = useCreateReviewCycle();
  const submitSelfMutation = useSubmitSelfReview();
  const submitMgrMutation = useSubmitManagerReview();
  const calibrateMutation = useCalibrateReview();
  const recomputeRisksMutation = useRecomputeAttritionRisks();
  const copilotMutation = useHrmsCopilot();

  // New Goal Form State
  const [newGoal, setNewGoal] = useState({
    employeeId: '',
    departmentId: '',
    title: '',
    description: '',
    category: 'engineering' as GoalCategory,
    level: 'individual' as 'individual' | 'department' | 'company',
    period: '2026 Annual',
    dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    weight: 10,
    kr1Title: 'Complete MVP implementation',
    kr1Target: 100,
    kr1Unit: '%',
    kr2Title: 'Pass automated test coverage',
    kr2Target: 90,
    kr2Unit: '%',
  });

  // New Cycle Form State
  const [newCycle, setNewCycle] = useState({
    name: 'FY2026 Q3 360-Degree Review Cycle',
    reviewPeriod: 'quarterly' as 'quarterly' | 'annual' | 'semi_annual',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    type: '360_degree' as '360_degree' | 'manager_only' | 'self_and_manager',
  });

  // Filtered Goals
  const filteredGoals = (goals || []).filter((g) => {
    if (goalStatusFilter !== 'all' && g.status !== goalStatusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const titleMatch = g.title.toLowerCase().includes(q);
      const empMatch = g.employeeId?.fullName?.toLowerCase().includes(q);
      return titleMatch || empMatch;
    }
    return true;
  });

  // High Attrition Count
  const criticalRiskCount = (attritionRisks || []).filter((r) => r.riskLevel === 'high' || r.riskLevel === 'critical').length;
  const avgGoalProgress = goals?.length
    ? Math.round(goals.reduce((acc, g) => acc + (g.progress || 0), 0) / goals.length)
    : 0;

  // Handle Copilot Query
  const handleCopilotSubmit = async (promptToUse?: string) => {
    const text = promptToUse || copilotPrompt;
    if (!text.trim()) return;
    try {
      const res = await copilotMutation.mutateAsync(text);
      setCopilotHistory((prev) => [...prev, { prompt: text, response: res }]);
      setCopilotPrompt('');
    } catch {
      // Handled by onError in hook
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── Top Header Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fff7ed] border border-[#fed7aa] text-[#ea580c] text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-[#f97316]" />
              HRMS · Performance & AI Copilot
            </span>
            <span className="text-xs font-mono text-[#6B6B6B]">FY2026 Enterprise Talent Hub</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
            Performance, OKRs & Workforce Intelligence
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Track measurable key results, run 360° review cycles, calibrate with 9-box grids, and predict retention risk.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              refetchGoals();
              refetchReviews();
              refetchNineBox();
              refetchRisks();
            }}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors"
            title="Refresh all metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {isManagement && (
            <>
              <button
                type="button"
                onClick={() => setShowGoalModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                New Goal
              </button>

              <button
                type="button"
                onClick={() => setShowCycleModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#1A1A1A] bg-white hover:bg-[#FBF8F4] border border-[#ECE0D6] shadow-2xs transition-all"
              >
                <Calendar className="w-4 h-4 text-[#f97316]" />
                Launch Review Cycle
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('copilot')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#fff7ed] hover:bg-[#ffedd5] text-[#ea580c] border border-[#fed7aa] transition-all"
          >
            <Bot className="w-4 h-4 text-[#f97316]" />
            Ask AI Copilot
          </button>
        </div>
      </motion.div>

      {/* ── KPI Highlight Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-4 hover:border-[#fed7aa] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">Active Goals</span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#f97316]">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1A1A1A] font-mono">
            {goalsLoading ? '—' : goals?.length ?? 0}
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-[#ea580c] font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>{avgGoalProgress}% avg. completion</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-4 hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">Review Cycles</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1A1A1A] font-mono">
            {cyclesLoading ? '—' : cycles?.length ?? 0}
          </div>
          <p className="text-[10px] text-[#6B6B6B] mt-0.5">
            {reviews?.filter((r) => r.status === 'completed').length ?? 0} of {reviews?.length ?? 0} appraisals finalized
          </p>
        </div>

        <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-4 hover:border-purple-200 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">Calibrated Talent</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Star className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1A1A1A] font-mono">
            {nineBoxLoading ? '—' : nineBoxData?.totalEmployees ?? 0}
          </div>
          <p className="text-[10px] text-purple-600 font-medium mt-0.5">9-Box calibrated profile nodes</p>
        </div>

        <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-4 hover:border-rose-200 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">Attrition Signals</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 font-mono">
            {risksLoading ? '—' : criticalRiskCount}
          </div>
          <p className="text-[10px] text-rose-600 mt-0.5 font-medium">
            {criticalRiskCount > 0 ? 'Critical/High risks requiring check-in' : 'Retention pulse healthy'}
          </p>
        </div>
      </div>

      {/* ── Main Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-[#ECE0D6] pb-2 overflow-x-auto">
        {[
          { id: 'goals', label: `Goals & OKRs (${goals?.length ?? 0})`, icon: Target },
          { id: 'reviews', label: `360° Appraisals (${reviews?.length ?? 0})`, icon: Award },
          { id: 'nine_box', label: '9-Box Talent Calibration', icon: Layers },
          { id: 'attrition', label: `Retention Radar (${criticalRiskCount} Alerts)`, icon: ShieldAlert },
          { id: 'copilot', label: 'HR AI Copilot', icon: Bot },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as PerformanceTab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#f97316] text-white shadow-sm shadow-[#f97316]/20'
                  : 'bg-white text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4] border border-[#ECE0D6]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB 1: GOALS & OKRS                                    */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#ECE0D6]">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#9B9B9B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search goals by title or employee..."
                className="w-full text-xs text-[#1A1A1A] placeholder-[#9B9B9B] outline-none bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#6B6B6B]" />
              <span className="text-xs text-[#6B6B6B]">Status:</span>
              <select
                value={goalStatusFilter}
                onChange={(e) => setGoalStatusFilter(e.target.value)}
                className="text-xs font-medium text-[#1A1A1A] bg-[#FBF8F4] border border-[#ECE0D6] rounded-lg px-2.5 py-1.5 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="at_risk">At Risk</option>
                <option value="behind">Behind</option>
                <option value="not_started">Not Started</option>
              </select>
            </div>
          </div>

          {/* Goals Grid */}
          {goalsLoading ? (
            <div className="text-center py-12 text-sm text-[#6B6B6B]">Loading performance goals...</div>
          ) : filteredGoals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#ECE0D6] bg-white p-12 text-center space-y-3">
              <Target className="w-10 h-10 text-[#f97316] mx-auto opacity-40" />
              <h3 className="text-base font-bold text-[#1A1A1A]">No Goals Found</h3>
              <p className="text-xs text-[#6B6B6B] max-w-md mx-auto">
                No active OKRs match your search filter. Create a new measurable objective for an employee or department.
              </p>
              {isManagement && (
                <button
                  type="button"
                  onClick={() => setShowGoalModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create Goal
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGoals.map((goal) => {
                const cat = CATEGORY_COLORS[goal.category] || CATEGORY_COLORS.general;
                const statusPill = STATUS_PILLS[goal.status] || STATUS_PILLS.in_progress;
                return (
                  <motion.div
                    key={goal._id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-[#ECE0D6] bg-white p-5 shadow-sm hover:border-[#fed7aa] transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Category & Status Row */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cat.bg} ${cat.text} ${cat.border}`}>
                          {goal.category.toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusPill.bg}`}>
                          {statusPill.label}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-[#1A1A1A] line-clamp-2 mb-1.5">{goal.title}</h3>
                      {goal.description && (
                        <p className="text-xs text-[#6B6B6B] line-clamp-2 mb-3">{goal.description}</p>
                      )}

                      {/* Owner Info */}
                      <div className="flex items-center gap-2 mb-4 text-xs text-[#6B6B6B]">
                        <div className="w-6 h-6 rounded-full bg-[#fff7ed] border border-[#fed7aa] flex items-center justify-center font-bold text-[10px] text-[#f97316]">
                          {goal.employeeId?.fullName?.charAt(0) || 'U'}
                        </div>
                        <span className="font-medium text-[#1A1A1A]">{goal.employeeId?.fullName}</span>
                        <span>•</span>
                        <span>{goal.period}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 mb-4">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-[#6B6B6B]">Progress</span>
                          <span className="font-bold text-[#f97316]">{goal.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#FBF8F4] border border-[#ECE0D6] rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              goal.progress >= 100
                                ? 'bg-emerald-500'
                                : goal.status === 'at_risk' || goal.status === 'behind'
                                ? 'bg-rose-500'
                                : 'bg-[#f97316]'
                            }`}
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Key Results Checklist */}
                      {goal.keyResults && goal.keyResults.length > 0 && (
                        <div className="space-y-1.5 mb-4 border-t border-[#F3EDE4] pt-3">
                          <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">Key Results</span>
                          {goal.keyResults.slice(0, 2).map((kr, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                              <span className="text-[#6B6B6B] truncate max-w-[180px]">{kr.title}</span>
                              <span className="font-mono font-semibold text-[#1A1A1A]">
                                {kr.currentValue}/{kr.targetValue} {kr.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between border-t border-[#F3EDE4] pt-3 mt-2 text-xs">
                      <span className="text-[#6B6B6B] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Due {new Date(goal.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedGoal(goal);
                            setCheckInProgress(goal.progress);
                            setShowCheckInModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#fff7ed] hover:bg-[#ffedd5] text-[#ea580c] border border-[#fed7aa] transition-colors"
                        >
                          Check In
                        </button>
                        {isManagement && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Archive this goal?')) {
                                deleteGoalMutation.mutate(goal._id);
                              }
                            }}
                            className="text-xs text-[#9B9B9B] hover:text-rose-600 transition-colors"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB 2: REVIEW CYCLES & 360 APPRAISALS                   */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Active Review Cycles Row */}
          <div>
            <h2 className="text-sm font-bold text-[#1A1A1A] mb-3">Active Review Cycles</h2>
            {cyclesLoading ? (
              <div className="text-xs text-[#6B6B6B]">Loading review cycles...</div>
            ) : (cycles || []).length === 0 ? (
              <div className="p-5 rounded-2xl bg-white border border-[#ECE0D6] text-xs text-[#6B6B6B]">
                No active review cycles configured. Click &quot;Launch Review Cycle&quot; to begin.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(cycles || []).map((cycle) => (
                  <div key={cycle._id} className="rounded-2xl border border-[#ECE0D6] bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa]">
                        {cycle.reviewPeriod.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {cycle.status.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#1A1A1A] mb-1">{cycle.name}</h3>
                    <p className="text-xs text-[#6B6B6B] mb-3">
                      Due: {new Date(cycle.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <div className="flex items-center justify-between text-xs font-mono text-[#6B6B6B] bg-[#FBF8F4] p-3 rounded-xl border border-[#ECE0D6]">
                      <span>Eligible: <strong>{cycle.submissionStats.totalEligible}</strong></span>
                      <span>Completed: <strong className="text-emerald-700">{cycle.submissionStats.completed}</strong></span>
                      <span>Pending: <strong className="text-amber-700">{cycle.submissionStats.pending}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Individual Appraisals Table */}
          <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#ECE0D6] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">Workforce 360° Appraisals</h3>
                <p className="text-xs text-[#6B6B6B]">Self-evaluations, manager reviews, and calibration status</p>
              </div>
            </div>

            {reviewsLoading ? (
              <div className="p-8 text-center text-xs text-[#6B6B6B]">Loading appraisals...</div>
            ) : (reviews || []).length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B6B6B]">
                No individual performance reviews found in current cycles.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FBF8F4] text-[#6B6B6B] font-semibold border-b border-[#ECE0D6]">
                    <tr>
                      <th className="px-5 py-3">Employee</th>
                      <th className="px-5 py-3">Department</th>
                      <th className="px-5 py-3">Self Rating</th>
                      <th className="px-5 py-3">Manager Rating</th>
                      <th className="px-5 py-3">9-Box Calibration</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECE0D6]">
                    {(reviews || []).map((rev) => (
                      <tr key={rev._id} className="hover:bg-[#FBF8F4]/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-[#1A1A1A]">{rev.employeeId?.fullName}</p>
                          <p className="text-[11px] text-[#6B6B6B]">{rev.employeeId?.employeeCode} · {rev.employeeId?.grade || 'L2'}</p>
                        </td>
                        <td className="px-5 py-3.5 text-[#6B6B6B]">
                          {rev.employeeId?.departmentId?.name || 'General'}
                        </td>
                        <td className="px-5 py-3.5 font-mono">
                          {rev.selfReview?.rating ? `${rev.selfReview.rating} / 5` : '—'}
                        </td>
                        <td className="px-5 py-3.5 font-mono">
                          {rev.managerReview?.rating ? `${rev.managerReview.rating} / 5` : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa]">
                            <Star className="w-3 h-3 text-[#f97316]" />
                            {rev.calibration?.nineBoxGrid?.boxLabel || 'Pending'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="capitalize text-[11px] font-medium text-[#6B6B6B]">
                            {rev.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          {rev.status === 'pending_self' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReview(rev);
                                setSelfSummary(rev.selfReview?.summary || '');
                                setSelfStrengths(rev.selfReview?.strengths || '');
                                setSelfGrowth(rev.selfReview?.growthAreas || '');
                                setSelfRating(rev.selfReview?.rating || 4);
                                setShowSelfReviewModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa]"
                            >
                              Self Review
                            </button>
                          )}

                          {isManagement && rev.status === 'pending_manager' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReview(rev);
                                setMgrSummary(rev.managerReview?.summary || '');
                                setMgrStrengths(rev.managerReview?.strengths || '');
                                setMgrGrowth(rev.managerReview?.growthAreas || '');
                                setMgrRating(rev.managerReview?.rating || 4);
                                setMgrPotRating(rev.managerReview?.potentialRating || 2);
                                setShowManagerReviewModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                            >
                              Manager Review
                            </button>
                          )}

                          {isManagement && (rev.status === 'in_calibration' || rev.status === 'completed') && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReview(rev);
                                setCalibratePerfScore(rev.calibration?.nineBoxGrid?.performanceScore || 2);
                                setCalibratePotScore(rev.calibration?.nineBoxGrid?.potentialScore || 2);
                                setCalibratePromoRec(rev.calibration?.promotionRecommended || false);
                                setCalibrateIncPct(rev.calibration?.salaryIncrementPercentage || 8);
                                setCalibrateNotes(rev.calibration?.calibrationNotes || '');
                                setShowCalibrateModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#f97316] text-white hover:bg-[#ea580c]"
                            >
                              Calibrate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB 3: 9-BOX TALENT CALIBRATION MATRIX                  */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'nine_box' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#ECE0D6] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#1A1A1A]">Enterprise 9-Box Talent Calibration Matrix</h2>
              <p className="text-xs text-[#6B6B6B] mt-0.5">
                Evaluates workforce talent across Performance (X-Axis: Low to High) and Potential (Y-Axis: Low to High)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6B6B6B] font-mono">
                Total Calibrated: <strong>{nineBoxData?.totalEmployees || 0}</strong>
              </span>
            </div>
          </div>

          {/* 3x3 Matrix Container */}
          <div className="bg-white p-5 rounded-2xl border border-[#ECE0D6] shadow-sm">
            {/* Axis Label Top */}
            <div className="text-center font-bold text-xs uppercase tracking-wider text-[#6B6B6B] mb-2">
              ▲ Potential (Leadership & Growth Capacity)
            </div>

            <div className="grid grid-cols-3 gap-3 min-h-[460px]">
              {/* Row 3: High Potential (Y = 3) */}
              {[
                { perf: 1, pot: 3, label: 'Enigma / High Potential', bg: 'bg-amber-50/70 border-amber-200' },
                { perf: 2, pot: 3, label: 'Growth Player', bg: 'bg-teal-50/70 border-teal-200' },
                { perf: 3, pot: 3, label: 'Future Leader / Star', bg: 'bg-[#fff7ed] border-[#fed7aa] ring-1 ring-[#f97316]/30' },
              ].map((cell) => {
                const node = nineBoxData?.grid?.find((g) => g.perfScore === cell.perf && g.potScore === cell.pot);
                return (
                  <div
                    key={`${cell.perf}-${cell.pot}`}
                    className={`rounded-xl border p-4 flex flex-col justify-between ${cell.bg}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-xs font-bold text-[#1A1A1A]">{cell.label}</span>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-white rounded-full border border-[#ECE0D6]">
                          {node?.count || 0}
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-28 overflow-y-auto">
                        {node?.employees?.map((e) => (
                          <div
                            key={e.reviewId}
                            className="bg-white/80 p-2 rounded-lg text-[11px] border border-[#ECE0D6]/60 flex items-center justify-between"
                          >
                            <span className="font-semibold text-[#1A1A1A] truncate max-w-[120px]">
                              {e.employee?.fullName}
                            </span>
                            <span className="text-[10px] text-[#6B6B6B] font-mono">{e.employee?.grade || 'L3'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#6B6B6B] mt-2 font-mono">
                      P: {cell.perf} | Pot: {cell.pot}
                    </div>
                  </div>
                );
              })}

              {/* Row 2: Medium Potential (Y = 2) */}
              {[
                { perf: 1, pot: 2, label: 'Dilemma / Inconsistent', bg: 'bg-orange-50/50 border-orange-200' },
                { perf: 2, pot: 2, label: 'Core Contributor', bg: 'bg-[#FBF8F4] border-[#ECE0D6]' },
                { perf: 3, pot: 2, label: 'High Performer', bg: 'bg-emerald-50/60 border-emerald-200' },
              ].map((cell) => {
                const node = nineBoxData?.grid?.find((g) => g.perfScore === cell.perf && g.potScore === cell.pot);
                return (
                  <div
                    key={`${cell.perf}-${cell.pot}`}
                    className={`rounded-xl border p-4 flex flex-col justify-between ${cell.bg}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-xs font-bold text-[#1A1A1A]">{cell.label}</span>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-white rounded-full border border-[#ECE0D6]">
                          {node?.count || 0}
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-28 overflow-y-auto">
                        {node?.employees?.map((e) => (
                          <div
                            key={e.reviewId}
                            className="bg-white/80 p-2 rounded-lg text-[11px] border border-[#ECE0D6]/60 flex items-center justify-between"
                          >
                            <span className="font-semibold text-[#1A1A1A] truncate max-w-[120px]">
                              {e.employee?.fullName}
                            </span>
                            <span className="text-[10px] text-[#6B6B6B] font-mono">{e.employee?.grade || 'L3'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#6B6B6B] mt-2 font-mono">
                      P: {cell.perf} | Pot: {cell.pot}
                    </div>
                  </div>
                );
              })}

              {/* Row 1: Low Potential (Y = 1) */}
              {[
                { perf: 1, pot: 1, label: 'Risk / Underperformer', bg: 'bg-rose-50/60 border-rose-200' },
                { perf: 2, pot: 1, label: 'Effective Professional', bg: 'bg-[#FBF8F4] border-[#ECE0D6]' },
                { perf: 3, pot: 1, label: 'Trusted Master', bg: 'bg-blue-50/60 border-blue-200' },
              ].map((cell) => {
                const node = nineBoxData?.grid?.find((g) => g.perfScore === cell.perf && g.potScore === cell.pot);
                return (
                  <div
                    key={`${cell.perf}-${cell.pot}`}
                    className={`rounded-xl border p-4 flex flex-col justify-between ${cell.bg}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-xs font-bold text-[#1A1A1A]">{cell.label}</span>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-white rounded-full border border-[#ECE0D6]">
                          {node?.count || 0}
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-28 overflow-y-auto">
                        {node?.employees?.map((e) => (
                          <div
                            key={e.reviewId}
                            className="bg-white/80 p-2 rounded-lg text-[11px] border border-[#ECE0D6]/60 flex items-center justify-between"
                          >
                            <span className="font-semibold text-[#1A1A1A] truncate max-w-[120px]">
                              {e.employee?.fullName}
                            </span>
                            <span className="text-[10px] text-[#6B6B6B] font-mono">{e.employee?.grade || 'L3'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#6B6B6B] mt-2 font-mono">
                      P: {cell.perf} | Pot: {cell.pot}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Axis Label Bottom */}
            <div className="text-center font-bold text-xs uppercase tracking-wider text-[#6B6B6B] mt-4">
              Performance (Execution & Results Delivery) ►
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB 4: RETENTION RADAR & ATTRITION RISK ANALYTICS       */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'attrition' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#ECE0D6] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h2 className="text-base font-bold text-[#1A1A1A]">Workforce Retention & Attrition Risk Radar</h2>
              </div>
              <p className="text-xs text-[#6B6B6B]">
                Synthesizes attendance anomalies, leave frequency spikes, role tenure stagnation, and 9-box calibration ratings.
              </p>
            </div>
            <button
              type="button"
              disabled={recomputeRisksMutation.isPending}
              onClick={() => recomputeRisksMutation.mutate()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#fff7ed] hover:bg-[#ffedd5] text-[#ea580c] border border-[#fed7aa] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recomputeRisksMutation.isPending ? 'animate-spin' : ''}`} />
              Recompute Risk Engine
            </button>
          </div>

          {/* Attrition Risk Cards */}
          {risksLoading ? (
            <div className="text-center py-12 text-xs text-[#6B6B6B]">Evaluating workforce retention metrics...</div>
          ) : (attritionRisks || []).length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#ECE0D6] text-xs text-[#6B6B6B]">
              No attrition risk records generated yet. Click &quot;Recompute Risk Engine&quot; to initiate calculation.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(attritionRisks || []).map((risk) => {
                const badge = RISK_BADGES[risk.riskLevel] || RISK_BADGES.low;
                return (
                  <div
                    key={risk._id}
                    className="rounded-2xl border border-[#ECE0D6] bg-white p-5 shadow-sm hover:border-[#fed7aa] transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                          <h3 className="text-sm font-bold text-[#1A1A1A]">{risk.employeeId?.fullName}</h3>
                          <p className="text-[11px] text-[#6B6B6B]">
                            {risk.employeeId?.employeeCode} · {risk.employeeId?.designation || 'Staff'} ({risk.employeeId?.grade || 'L2'})
                          </p>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {risk.riskScore}% {risk.riskLevel.toUpperCase()}
                        </div>
                      </div>

                      {/* Diagnostic Badges */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-[#FBF8F4] p-2.5 rounded-xl border border-[#ECE0D6] mb-3 font-mono">
                        <div>
                          <span className="text-[10px] text-[#6B6B6B] block">Attendance Stability</span>
                          <span className="font-bold text-[#1A1A1A]">{risk.attendanceStabilityScore}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#6B6B6B] block">Role Stagnation</span>
                          <span className="font-bold text-[#1A1A1A]">{risk.lastPromotedOrIncrementedMonths} mos</span>
                        </div>
                      </div>

                      {/* Contributing Factors */}
                      {risk.contributingFactors && risk.contributingFactors.length > 0 && (
                        <div className="space-y-1.5 mb-3">
                          <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">Top Risk Driver</span>
                          <div className="text-xs p-2 rounded-lg bg-rose-50/70 border border-rose-200 text-rose-800">
                            <strong>{risk.contributingFactors[0].factor}:</strong> {risk.contributingFactors[0].description}
                          </div>
                        </div>
                      )}

                      {/* Suggested Interventions */}
                      {risk.suggestedInterventions && risk.suggestedInterventions.length > 0 && (
                        <div className="space-y-1 mb-2">
                          <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">Recommended Action</span>
                          <p className="text-xs text-[#6B6B6B] italic">
                            &quot;{risk.suggestedInterventions[0]}&quot;
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[#F3EDE4] pt-3 mt-2 text-[10px] text-[#9B9B9B] flex justify-between">
                      <span>Evaluated: {new Date(risk.computedAt).toLocaleDateString()}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('copilot');
                          handleCopilotSubmit(`Recommend retention action plan for ${risk.employeeId?.fullName}`);
                        }}
                        className="text-[#f97316] font-semibold hover:underline"
                      >
                        Ask Copilot →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB 5: HR AI COPILOT (NATURAL LANGUAGE ASSISTANT)      */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === 'copilot' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-2xl border border-[#ECE0D6] shadow-sm text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#fff7ed] border border-[#fed7aa] flex items-center justify-center text-[#f97316] mx-auto">
              <Bot className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-extrabold text-[#1A1A1A]">Nebula HR AI Copilot</h2>
            <p className="text-xs text-[#6B6B6B] max-w-lg mx-auto">
              Query workforce retention trends, goal velocity, 9-box calibration, promotion candidates, or draft performance feedback.
            </p>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              'Show high attrition risks',
              'Team goal progress status',
              '9-box talent calibration',
              'Top promotion candidates',
              'Who is ready for promotion?',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleCopilotSubmit(chip)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-[#fff7ed] text-[#1A1A1A] hover:text-[#ea580c] border border-[#ECE0D6] whitespace-nowrap transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Query Bar */}
          <div className="bg-white p-3 rounded-2xl border border-[#ECE0D6] shadow-sm flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#f97316] flex-shrink-0 ml-1" />
            <input
              type="text"
              value={copilotPrompt}
              onChange={(e) => setCopilotPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCopilotSubmit();
              }}
              placeholder="Ask Copilot (e.g., 'Summarize team goal velocity' or 'List critical attrition risks')..."
              className="w-full text-xs text-[#1A1A1A] placeholder-[#9B9B9B] outline-none"
            />
            <button
              type="button"
              disabled={copilotMutation.isPending || !copilotPrompt.trim()}
              onClick={() => handleCopilotSubmit()}
              className="p-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white disabled:opacity-40 transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Copilot Response Feed */}
          <div className="space-y-4">
            {copilotMutation.isPending && (
              <div className="p-5 rounded-2xl bg-white border border-[#ECE0D6] text-xs text-[#6B6B6B] flex items-center gap-2 animate-pulse">
                <Sparkles className="w-4 h-4 text-[#f97316]" />
                Nebula AI is analyzing workforce metrics and generating intelligence...
              </div>
            )}

            {copilotHistory.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                {/* User Prompt Bubble */}
                <div className="flex justify-end">
                  <div className="bg-[#fff7ed] border border-[#fed7aa] text-[#ea580c] text-xs font-semibold px-4 py-2 rounded-2xl max-w-md">
                    {item.prompt}
                  </div>
                </div>

                {/* Copilot Response Card */}
                <div className="bg-white border border-[#ECE0D6] p-5 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A]">
                    <Sparkles className="w-4 h-4 text-[#f97316]" />
                    <span>Copilot Insight</span>
                  </div>
                  <div className="text-xs text-[#1A1A1A] whitespace-pre-line leading-relaxed">
                    {item.response.answer}
                  </div>

                  {item.response.suggestedFollowUps && item.response.suggestedFollowUps.length > 0 && (
                    <div className="border-t border-[#F3EDE4] pt-3 flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">Suggested:</span>
                      {item.response.suggestedFollowUps.map((f, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleCopilotSubmit(f)}
                          className="text-[11px] text-[#f97316] hover:underline"
                        >
                          • {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODAL 1: CREATE GOAL                                   */}
      {/* ══════════════════════════════════════════════════════ */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-[#ECE0D6] max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-3">
              <h3 className="text-base font-bold text-[#1A1A1A]">Create Performance Goal (OKR)</h3>
              <button
                type="button"
                onClick={() => setShowGoalModal(false)}
                className="text-[#9B9B9B] hover:text-[#1A1A1A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#1A1A1A] mb-1">Assignee Employee</label>
                <select
                  value={newGoal.employeeId}
                  onChange={(e) => setNewGoal({ ...newGoal, employeeId: e.target.value })}
                  className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl px-3 py-2 text-[#1A1A1A]"
                >
                  <option value="">Select Employee...</option>
                  {(employees || []).map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.fullName} ({e.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A1A] mb-1">Goal Title</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g. Optimize API Response Time below 120ms"
                  className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl px-3 py-2 text-[#1A1A1A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1A1A1A] mb-1">Category</label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as GoalCategory })}
                    className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl px-3 py-2 text-[#1A1A1A]"
                  >
                    <option value="engineering">Engineering</option>
                    <option value="sales">Sales</option>
                    <option value="operations">Operations</option>
                    <option value="leadership">Leadership</option>
                    <option value="personal_growth">Personal Growth</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1A1A1A] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newGoal.dueDate}
                    onChange={(e) => setNewGoal({ ...newGoal, dueDate: e.target.value })}
                    className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl px-3 py-2 text-[#1A1A1A]"
                  />
                </div>
              </div>

              {/* Key Result 1 */}
              <div className="p-3 bg-[#FBF8F4] rounded-xl border border-[#ECE0D6] space-y-2">
                <span className="font-bold text-[#1A1A1A] block">Key Result 1</span>
                <input
                  type="text"
                  value={newGoal.kr1Title}
                  onChange={(e) => setNewGoal({ ...newGoal, kr1Title: e.target.value })}
                  placeholder="Measurable result title"
                  className="w-full bg-white border border-[#ECE0D6] rounded-lg px-2.5 py-1.5 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={newGoal.kr1Target}
                    onChange={(e) => setNewGoal({ ...newGoal, kr1Target: Number(e.target.value) })}
                    placeholder="Target Value"
                    className="w-full bg-white border border-[#ECE0D6] rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={newGoal.kr1Unit}
                    onChange={(e) => setNewGoal({ ...newGoal, kr1Unit: e.target.value })}
                    placeholder="Unit (e.g. %, ms, deals)"
                    className="w-full bg-white border border-[#ECE0D6] rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE0D6]">
              <button
                type="button"
                onClick={() => setShowGoalModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:bg-[#FBF8F4]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={createGoalMutation.isPending || !newGoal.employeeId || !newGoal.title}
                onClick={async () => {
                  await createGoalMutation.mutateAsync({
                    employeeId: newGoal.employeeId,
                    departmentId: newGoal.departmentId || undefined,
                    title: newGoal.title,
                    description: newGoal.description,
                    category: newGoal.category,
                    level: newGoal.level,
                    period: newGoal.period,
                    dueDate: newGoal.dueDate,
                    weight: newGoal.weight,
                    keyResults: [
                      {
                        title: newGoal.kr1Title,
                        targetValue: newGoal.kr1Target,
                        currentValue: 0,
                        unit: newGoal.kr1Unit,
                        weight: 1,
                      },
                    ],
                  });
                  setShowGoalModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-sm disabled:opacity-40"
              >
                {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODAL 2: GOAL CHECK-IN                                 */}
      {/* ══════════════════════════════════════════════════════ */}
      {showCheckInModal && selectedGoal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-[#ECE0D6] max-w-md w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-3">
              <h3 className="text-base font-bold text-[#1A1A1A]">Goal Progress Check-In</h3>
              <button type="button" onClick={() => setShowCheckInModal(false)} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="font-semibold text-[#1A1A1A]">{selectedGoal.title}</p>
              <div>
                <div className="flex justify-between font-mono mb-1">
                  <span className="text-[#6B6B6B]">New Progress:</span>
                  <span className="font-bold text-[#f97316]">{checkInProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={checkInProgress}
                  onChange={(e) => setCheckInProgress(Number(e.target.value))}
                  className="w-full accent-[#f97316]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A1A] mb-1">Check-In Notes</label>
                <textarea
                  rows={3}
                  value={checkInNote}
                  onChange={(e) => setCheckInNote(e.target.value)}
                  placeholder="Summary of milestones reached this week..."
                  className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl p-2.5 text-[#1A1A1A]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE0D6]">
              <button
                type="button"
                onClick={() => setShowCheckInModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={checkInMutation.isPending}
                onClick={async () => {
                  await checkInMutation.mutateAsync({
                    id: selectedGoal._id,
                    payload: { note: checkInNote || 'Progress updated', progress: checkInProgress },
                  });
                  setShowCheckInModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] text-white hover:bg-[#ea580c]"
              >
                {checkInMutation.isPending ? 'Saving...' : 'Save Check-In'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODAL 3: LAUNCH REVIEW CYCLE                           */}
      {/* ══════════════════════════════════════════════════════ */}
      {showCycleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-[#ECE0D6] max-w-md w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-3">
              <h3 className="text-base font-bold text-[#1A1A1A]">Launch Performance Review Cycle</h3>
              <button type="button" onClick={() => setShowCycleModal(false)} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#1A1A1A] mb-1">Cycle Title</label>
                <input
                  type="text"
                  value={newCycle.name}
                  onChange={(e) => setNewCycle({ ...newCycle, name: e.target.value })}
                  className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl px-3 py-2 text-[#1A1A1A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1A1A1A] mb-1">Period</label>
                  <select
                    value={newCycle.reviewPeriod}
                    onChange={(e) => setNewCycle({ ...newCycle, reviewPeriod: e.target.value as any })}
                    className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl px-3 py-2 text-[#1A1A1A]"
                  >
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                    <option value="semi_annual">Semi-Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1A1A1A] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newCycle.dueDate}
                    onChange={(e) => setNewCycle({ ...newCycle, dueDate: e.target.value })}
                    className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl px-3 py-2 text-[#1A1A1A]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE0D6]">
              <button
                type="button"
                onClick={() => setShowCycleModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={createCycleMutation.isPending || !newCycle.name}
                onClick={async () => {
                  await createCycleMutation.mutateAsync({
                    name: newCycle.name,
                    reviewPeriod: newCycle.reviewPeriod,
                    startDate: newCycle.startDate,
                    endDate: newCycle.endDate,
                    dueDate: newCycle.dueDate,
                    type: newCycle.type,
                  });
                  setShowCycleModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] text-white hover:bg-[#ea580c]"
              >
                {createCycleMutation.isPending ? 'Launching...' : 'Launch Cycle'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODAL 4: CALIBRATE TALENT (9-BOX)                      */}
      {/* ══════════════════════════════════════════════════════ */}
      {showCalibrateModal && selectedReview && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-[#ECE0D6] max-w-lg w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1A1A1A]">Talent Calibration & Compensation</h3>
                <p className="text-xs text-[#6B6B6B]">
                  {selectedReview.employeeId?.fullName} ({selectedReview.employeeId?.grade || 'L2'})
                </p>
              </div>
              <button type="button" onClick={() => setShowCalibrateModal(false)} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1A1A1A] mb-1">Performance (1-3)</label>
                  <select
                    value={calibratePerfScore}
                    onChange={(e) => setCalibratePerfScore(Number(e.target.value))}
                    className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl px-3 py-2 text-[#1A1A1A]"
                  >
                    <option value={1}>1 — Low / Developing</option>
                    <option value={2}>2 — Solid / Consistent</option>
                    <option value={3}>3 — High / Exceeding</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1A1A1A] mb-1">Potential (1-3)</label>
                  <select
                    value={calibratePotScore}
                    onChange={(e) => setCalibratePotScore(Number(e.target.value))}
                    className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl px-3 py-2 text-[#1A1A1A]"
                  >
                    <option value={1}>1 — Solid in Current Role</option>
                    <option value={2}>2 — Lateral Growth Potential</option>
                    <option value={3}>3 — Fast-Track Leadership</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-[#FBF8F4] rounded-xl border border-[#ECE0D6]">
                <input
                  type="checkbox"
                  id="promoRec"
                  checked={calibratePromoRec}
                  onChange={(e) => setCalibratePromoRec(e.target.checked)}
                  className="rounded text-[#f97316] accent-[#f97316]"
                />
                <label htmlFor="promoRec" className="font-semibold text-[#1A1A1A] cursor-pointer">
                  Recommend for Promotion to Next Grade Level
                </label>
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A1A] mb-1">Proposed Salary Increment (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={calibrateIncPct}
                  onChange={(e) => setCalibrateIncPct(Number(e.target.value))}
                  className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl px-3 py-2 text-[#1A1A1A] font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A1A] mb-1">Calibration Notes</label>
                <textarea
                  rows={3}
                  value={calibrateNotes}
                  onChange={(e) => setCalibrateNotes(e.target.value)}
                  placeholder="Justification for promotion, increment, or PIP..."
                  className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl p-2.5 text-[#1A1A1A]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE0D6]">
              <button
                type="button"
                onClick={() => setShowCalibrateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={calibrateMutation.isPending}
                onClick={async () => {
                  await calibrateMutation.mutateAsync({
                    id: selectedReview._id,
                    payload: {
                      performanceScore: calibratePerfScore,
                      potentialScore: calibratePotScore,
                      promotionRecommended: calibratePromoRec,
                      salaryIncrementPercentage: calibrateIncPct,
                      calibrationNotes: calibrateNotes,
                    },
                  });
                  setShowCalibrateModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] text-white hover:bg-[#ea580c]"
              >
                {calibrateMutation.isPending ? 'Finalizing...' : 'Finalize Calibration'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODAL 5: SUBMIT SELF REVIEW                            */}
      {/* ══════════════════════════════════════════════════════ */}
      {showSelfReviewModal && selectedReview && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-[#ECE0D6] max-w-lg w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-3">
              <h3 className="text-base font-bold text-[#1A1A1A]">Self-Appraisal Form</h3>
              <button type="button" onClick={() => setShowSelfReviewModal(false)} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#1A1A1A] mb-1">Self Rating (1 to 5 Stars)</label>
                <select
                  value={selfRating}
                  onChange={(e) => setSelfRating(Number(e.target.value))}
                  className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl px-3 py-2 text-[#1A1A1A]"
                >
                  <option value={5}>5 — Exceptional / Exceeded All Expectations</option>
                  <option value={4}>4 — Strong Performer</option>
                  <option value={3}>3 — Meets Expectations</option>
                  <option value={2}>2 — Partially Meets Expectations</option>
                  <option value={1}>1 — Unsatisfactory</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A1A] mb-1">Key Achievements & Highlights</label>
                <textarea
                  rows={2}
                  value={selfSummary}
                  onChange={(e) => setSelfSummary(e.target.value)}
                  placeholder="Summarize your key project deliverables..."
                  className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl p-2.5 text-[#1A1A1A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A1A] mb-1">Core Strengths</label>
                <input
                  type="text"
                  value={selfStrengths}
                  onChange={(e) => setSelfStrengths(e.target.value)}
                  placeholder="e.g. System design, cross-team mentoring"
                  className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl px-3 py-2 text-[#1A1A1A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A1A] mb-1">Areas for Growth</label>
                <input
                  type="text"
                  value={selfGrowth}
                  onChange={(e) => setSelfGrowth(e.target.value)}
                  placeholder="e.g. Public speaking, distributed tracing"
                  className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl px-3 py-2 text-[#1A1A1A]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE0D6]">
              <button
                type="button"
                onClick={() => setShowSelfReviewModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitSelfMutation.isPending}
                onClick={async () => {
                  await submitSelfMutation.mutateAsync({
                    id: selectedReview._id,
                    payload: {
                      summary: selfSummary,
                      strengths: selfStrengths,
                      growthAreas: selfGrowth,
                      rating: selfRating,
                    },
                  });
                  setShowSelfReviewModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] text-white hover:bg-[#ea580c]"
              >
                {submitSelfMutation.isPending ? 'Submitting...' : 'Submit Self-Review'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* MODAL 6: SUBMIT MANAGER REVIEW                         */}
      {/* ══════════════════════════════════════════════════════ */}
      {showManagerReviewModal && selectedReview && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-[#ECE0D6] max-w-lg w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#1A1A1A]">Manager Evaluation</h3>
                <p className="text-xs text-[#6B6B6B]">Reviewing {selectedReview.employeeId?.fullName}</p>
              </div>
              <button type="button" onClick={() => setShowManagerReviewModal(false)} className="text-[#9B9B9B] hover:text-[#1A1A1A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1A1A1A] mb-1">Performance (1 to 5)</label>
                  <select
                    value={mgrRating}
                    onChange={(e) => setMgrRating(Number(e.target.value))}
                    className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl px-3 py-2 text-[#1A1A1A]"
                  >
                    <option value={5}>5 — Exceeds Expectations</option>
                    <option value={4}>4 — High Performer</option>
                    <option value={3}>3 — Meets Expectations</option>
                    <option value={2}>2 — Needs Improvement</option>
                    <option value={1}>1 — Unsatisfactory</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1A1A1A] mb-1">Potential (1 to 3)</label>
                  <select
                    value={mgrPotRating}
                    onChange={(e) => setMgrPotRating(Number(e.target.value))}
                    className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl px-3 py-2 text-[#1A1A1A]"
                  >
                    <option value={3}>3 — High Potential</option>
                    <option value={2}>2 — Medium Potential</option>
                    <option value={1}>1 — Low Potential</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A1A] mb-1">Performance Feedback Summary</label>
                <textarea
                  rows={2}
                  value={mgrSummary}
                  onChange={(e) => setMgrSummary(e.target.value)}
                  placeholder="Manager's assessment of deliverables and culture..."
                  className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl p-2.5 text-[#1A1A1A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A1A] mb-1">Key Strengths Demonstrated</label>
                <input
                  type="text"
                  value={mgrStrengths}
                  onChange={(e) => setMgrStrengths(e.target.value)}
                  placeholder="e.g. Reliable execution, team collaboration"
                  className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl px-3 py-2 text-[#1A1A1A]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A1A] mb-1">Development & Growth Recommendations</label>
                <input
                  type="text"
                  value={mgrGrowth}
                  onChange={(e) => setMgrGrowth(e.target.value)}
                  placeholder="Actionable steps for next quarter"
                  className="w-full bg-[#FBF8F4] border border-[#ECE0D6] rounded-xl px-3 py-2 text-[#1A1A1A]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE0D6]">
              <button
                type="button"
                onClick={() => setShowManagerReviewModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitMgrMutation.isPending}
                onClick={async () => {
                  await submitMgrMutation.mutateAsync({
                    id: selectedReview._id,
                    payload: {
                      summary: mgrSummary,
                      strengths: mgrStrengths,
                      growthAreas: mgrGrowth,
                      rating: mgrRating,
                      potentialRating: mgrPotRating,
                    },
                  });
                  setShowManagerReviewModal(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] text-white hover:bg-[#ea580c]"
              >
                {submitMgrMutation.isPending ? 'Submitting...' : 'Submit Evaluation'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
