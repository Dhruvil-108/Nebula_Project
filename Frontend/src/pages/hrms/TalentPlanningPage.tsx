import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Users,
  Compass,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  FileText,
  Calendar,
  Layers,
  Award,
  DollarSign,
  Briefcase,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import {
  useSkills,
  useCreateSkill,
  useEmployeeSkills,
  useUpsertEmployeeSkill,
  useVerifyEmployeeSkill,
  useTrainings,
  useCreateTraining,
  useEnrollInTraining,
  useUpdateEnrollmentStatus,
  useHeadcountPlans,
  useUpsertHeadcountPlan,
  useHeadcountAnalytics,
  useManpowerRequisitions,
  useCreateRequisition,
  useApproveRequisition,
  useEmployees,
  useDepartments,
} from '../../hooks/useHrms';
import { useAuth } from '../../contexts/AuthContext';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import type {
  Skill,
  SkillCategory,
  EmployeeSkill,
  Training,
  TrainingStatus,
  HeadcountPlan,
  ManpowerRequisition,
  RequisitionPriority,
} from '../../types/hrms';

type TalentTab = 'skills' | 'trainings' | 'headcount';

const CATEGORY_COLORS: Record<SkillCategory, { bg: string; text: string; border: string }> = {
  technical: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  functional: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  leadership: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  soft_skill: { bg: 'bg-[#fff7ed]', text: 'text-[#ea580c]', border: 'border-[#fed7aa]' },
};

const REQ_PRIORITY_BADGES: Record<RequisitionPriority, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200' },
  medium: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  high: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  critical: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export const TalentPlanningPage: React.FC = () => {
  const { user } = useAuth();
  const { can } = useModuleAccess('hrms');
  const canEdit = can('edit');
  const canApprove = can('approve');
  const isManagement = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';

  const [activeTab, setActiveTab] = useState<TalentTab>('skills');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [skillSearch, setSkillSearch] = useState('');

  // Modals
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [showEmpSkillModal, setShowEmpSkillModal] = useState(false);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [showRequisitionModal, setShowRequisitionModal] = useState(false);
  const [showHeadcountModal, setShowHeadcountModal] = useState(false);

  // Queries
  const { data: skills = [], isLoading: skillsLoading, refetch: refetchSkills } = useSkills();
  const { data: employeeSkills = [], isLoading: empSkillsLoading, refetch: refetchEmpSkills } = useEmployeeSkills();
  const { data: trainings = [], isLoading: trainingsLoading, refetch: refetchTrainings } = useTrainings();
  const { data: headcountPlans = [], refetch: refetchPlans } = useHeadcountPlans();
  const { data: headcountAnalytics, refetch: refetchAnalytics } = useHeadcountAnalytics(2026);
  const { data: requisitions = [], isLoading: reqsLoading, refetch: refetchReqs } = useManpowerRequisitions();
  const { data: employees = [] } = useEmployees();
  const { data: departments = [] } = useDepartments();

  // Mutations
  const createSkillMutation = useCreateSkill();
  const upsertEmpSkillMutation = useUpsertEmployeeSkill();
  const verifySkillMutation = useVerifyEmployeeSkill();
  const createTrainingMutation = useCreateTraining();
  const enrollMutation = useEnrollInTraining();
  const updateEnrollmentMutation = useUpdateEnrollmentStatus();
  const upsertHeadcountMutation = useUpsertHeadcountPlan();
  const createReqMutation = useCreateRequisition();
  const approveReqMutation = useApproveRequisition();

  // Modal Form States
  const [newSkill, setNewSkill] = useState({ name: '', category: 'technical' as SkillCategory, description: '' });
  const [newEmpSkill, setNewEmpSkill] = useState({ employeeId: '', skillId: '', proficiencyLevel: 3, yearsOfExperience: 2 });
  const [newTraining, setNewTraining] = useState({
    title: '',
    description: '',
    trainer: '',
    mode: 'virtual',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    capacity: 25,
  });
  const [newRequisition, setNewRequisition] = useState({
    departmentId: '',
    jobTitle: '',
    headcount: 1,
    priority: 'medium' as RequisitionPriority,
    justification: '',
    budgetPerHire: 120000,
    requiredByDate: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
  });
  const [newPlan, setNewPlan] = useState({
    departmentId: '',
    fiscalYear: 2026,
    targetHeadcount: 10,
    allocatedBudget: 500000,
    quarterlyTargets: { q1: 2, q2: 3, q3: 3, q4: 2 },
  });

  const totalHeadcountCurrent = headcountAnalytics?.totalCurrentHeadcount || 0;
  const totalHeadcountTarget = headcountAnalytics?.totalTargetHeadcount || 0;
  const totalAllocatedBudget = headcountAnalytics?.totalAllocatedBudget || 0;
  const totalUtilizedBudget = headcountAnalytics?.totalUtilizedBudget || 0;

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
              HRMS · Talent Architecture & Planning
            </span>
            <span className="text-xs font-mono text-[#6B6B6B]">FY2026 Workforce Strategy</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
            Learning, Competencies & Manpower Planning
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Enterprise skill matrices, corporate training programs, headcount gap analysis, and ATS-linked manpower requisitions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              refetchSkills();
              refetchEmpSkills();
              refetchTrainings();
              refetchPlans();
              refetchAnalytics();
              refetchReqs();
            }}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {activeTab === 'skills' && (
            <>
              {isManagement && (
                <button
                  type="button"
                  onClick={() => setShowSkillModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#ECE0D6] text-[#1A1A1A] hover:bg-stone-50 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4 text-[#ea580c]" />
                  Add Catalog Skill
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowEmpSkillModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-sm transition-all"
              >
                <Award className="w-4 h-4" />
                Rate Competency
              </button>
            </>
          )}

          {activeTab === 'trainings' && isManagement && (
            <button
              type="button"
              onClick={() => setShowTrainingModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-sm transition-all"
            >
              <GraduationCap className="w-4 h-4" />
              Schedule Program
            </button>
          )}

          {activeTab === 'headcount' && (
            <>
              {isManagement && (
                <button
                  type="button"
                  onClick={() => setShowHeadcountModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-[#ECE0D6] text-[#1A1A1A] hover:bg-stone-50 shadow-sm transition-all"
                >
                  <BarChart3 className="w-4 h-4 text-[#ea580c]" />
                  Set Department Targets
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowRequisitionModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-sm transition-all"
              >
                <Briefcase className="w-4 h-4" />
                Raise Requisition
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* ── Metric Highlights ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#ECE0D6] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] mb-1 font-medium">
            <span>Skill Catalog</span>
            <Compass className="w-4 h-4 text-[#ea580c]" />
          </div>
          <div className="text-2xl font-black text-[#1A1A1A]">{skills.length}</div>
          <div className="text-[11px] text-[#6B6B6B] mt-1">{employeeSkills.length} verified ratings recorded</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#ECE0D6] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] mb-1 font-medium">
            <span>Corporate Trainings</span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-[#1A1A1A]">{trainings.length}</div>
          <div className="text-[11px] text-[#6B6B6B] mt-1">
            {trainings.filter((t) => t.status === 'in_progress' || t.status === 'scheduled').length} programs upcoming/live
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#ECE0D6] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] mb-1 font-medium">
            <span>Headcount Gap</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-[#1A1A1A]">
            {Math.max(0, totalHeadcountTarget - totalHeadcountCurrent)}
          </div>
          <div className="text-[11px] text-[#6B6B6B] mt-1">
            {totalHeadcountCurrent} active / {totalHeadcountTarget} target
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#ECE0D6] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] mb-1 font-medium">
            <span>Open Requisitions</span>
            <Briefcase className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-[#1A1A1A]">
            {requisitions.filter((r) => r.status === 'pending_approval' || r.status === 'approved').length}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-semibold">
            {requisitions.filter((r) => r.status === 'approved').length} live in ATS recruitment
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-[#ECE0D6] pb-2 overflow-x-auto">
        {[
          { key: 'skills', label: 'Skills & Competency Matrix', icon: Compass },
          { key: 'trainings', label: 'Corporate Learning & LMS', icon: GraduationCap },
          { key: 'headcount', label: 'Headcount Budget & Requisitions', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TalentTab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa] shadow-sm'
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-stone-50 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#f97316]' : 'text-[#6B6B6B]'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: SKILLS & COMPETENCY MATRIX ── */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          {/* Skill Repository Chips */}
          <div className="bg-white rounded-2xl border border-[#ECE0D6] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                Enterprise Skill Repository ({skills.length})
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {skills.map((s) => {
                const badge = CATEGORY_COLORS[s.category] || CATEGORY_COLORS.technical;
                return (
                  <div
                    key={s._id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] opacity-75 capitalize font-mono">({s.category})</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Employee Skill Ratings Table */}
          <div className="bg-white rounded-2xl border border-[#ECE0D6] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#ECE0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base font-bold text-[#1A1A1A]">Workforce Proficiency Mapping</h2>
              <div className="text-xs text-[#6B6B6B]">
                {employeeSkills.length} mapped employee competencies
              </div>
            </div>

            {empSkillsLoading ? (
              <div className="p-8 text-center text-xs text-[#6B6B6B]">Loading skills matrix...</div>
            ) : employeeSkills.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B6B6B]">
                No employee skills recorded yet. Click "Rate Competency" to map proficiencies.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Skill</th>
                      <th className="py-3 px-4">Proficiency (1-5)</th>
                      <th className="py-3 px-4">Experience</th>
                      <th className="py-3 px-4">Certifications</th>
                      <th className="py-3 px-4">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECE0D6] text-xs">
                    {employeeSkills.map((es) => (
                      <tr key={es._id} className="hover:bg-[#fff7ed]/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#1A1A1A]">{es.employeeId?.fullName}</div>
                          <div className="text-[11px] text-[#6B6B6B]">
                            {es.employeeId?.designation} · {es.employeeId?.employeeCode}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-[#1A1A1A]">{es.skillId?.name}</span>
                          <span className="block text-[10px] text-[#6B6B6B] capitalize font-mono">
                            {es.skillId?.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3.5 h-3.5 ${
                                  star <= es.proficiencyLevel
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-stone-300'
                                }`}
                              />
                            ))}
                            <span className="ml-1.5 font-bold text-[#1A1A1A]">Level {es.proficiencyLevel}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[#1A1A1A] font-medium">
                          {es.yearsOfExperience} {es.yearsOfExperience === 1 ? 'year' : 'years'}
                        </td>
                        <td className="py-3 px-4">
                          {es.certifications?.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {es.certifications.map((c, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-700 border border-stone-200"
                                >
                                  {c.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#6B6B6B] italic text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {es.verified ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <ShieldCheck className="w-3.5 h-3.5" /> Verified
                            </span>
                          ) : canEdit ? (
                            <button
                              type="button"
                              onClick={() => verifySkillMutation.mutate(es._id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-[#1A1A1A] border border-stone-300 transition-colors"
                            >
                              Verify
                            </button>
                          ) : (
                            <span className="text-xs text-[#6B6B6B]">Unverified</span>
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

      {/* ── TAB 2: CORPORATE LEARNING & LMS ── */}
      {activeTab === 'trainings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trainingsLoading ? (
              <div className="col-span-full p-8 text-center text-xs text-[#6B6B6B]">Loading trainings...</div>
            ) : trainings.length === 0 ? (
              <div className="col-span-full p-8 text-center rounded-2xl bg-white border border-[#ECE0D6] text-xs text-[#6B6B6B]">
                No training programs scheduled. Click "Schedule Program" to create one.
              </div>
            ) : (
              trainings.map((t) => {
                const enrolled = t.enrollments?.length || 0;
                const isFull = enrolled >= t.capacity;
                const isEnrolledByUser = t.enrollments?.some(
                  (e) => (e.employeeId as any) === user?._id || (e as any).employeeId?._id === user?._id
                );

                return (
                  <div
                    key={t._id}
                    className="p-5 rounded-2xl bg-white border border-[#ECE0D6] shadow-sm hover:border-orange-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                          {t.mode}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#1A1A1A] line-clamp-1">{t.title}</h3>
                      <p className="text-xs text-[#6B6B6B] line-clamp-2">{t.description}</p>

                      <div className="space-y-1 text-xs text-[#6B6B6B] pt-1">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#f97316]" />
                          <span>Trainer: <strong className="text-[#1A1A1A]">{t.trainer || 'Lead Architect'}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#f97316]" />
                          <span>{new Date(t.startDate).toLocaleDateString()} – {new Date(t.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Skills covered chips */}
                      {t.skillsCovered?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {t.skillsCovered.map((sk: any, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa]"
                            >
                              {sk.name || sk}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#ECE0D6] flex items-center justify-between">
                      <div className="text-xs text-[#6B6B6B]">
                        Capacity: <strong className="text-[#1A1A1A]">{enrolled}/{t.capacity}</strong>
                      </div>

                      {isEnrolledByUser ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" /> Enrolled
                        </span>
                      ) : isFull ? (
                        <span className="text-xs text-rose-600 font-semibold">Class Full</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => enrollMutation.mutate({ id: t._id })}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#f97316] text-white hover:bg-[#ea580c] shadow-sm transition-all"
                        >
                          Enroll Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: HEADCOUNT PLANNING & MANPOWER REQUISITIONS ── */}
      {activeTab === 'headcount' && (
        <div className="space-y-8">
          {/* Section A: Headcount Target vs Current Gap Cards */}
          <div className="bg-white rounded-2xl border border-[#ECE0D6] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#1A1A1A]">FY2026 Departmental Headcount Targets</h2>
                <p className="text-xs text-[#6B6B6B]">Planned expansion, budget allocations, and hiring capacity.</p>
              </div>
              <span className="text-xs font-mono font-bold text-[#ea580c] bg-[#fff7ed] px-2.5 py-1 rounded-lg border border-[#fed7aa]">
                Budget: ${(totalAllocatedBudget / 1000).toFixed(0)}k Allocated
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {headcountPlans.map((plan) => {
                const gap = Math.max(0, plan.targetHeadcount - plan.currentHeadcount);
                return (
                  <div key={plan._id} className="p-4 rounded-xl border border-[#ECE0D6] bg-[#FBF8F4] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#1A1A1A]">{plan.departmentId?.name}</span>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        FY{plan.fiscalYear}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[#6B6B6B]">Current Team:</span>
                        <div className="text-lg font-black text-[#1A1A1A]">{plan.currentHeadcount}</div>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B]">Target Headcount:</span>
                        <div className="text-lg font-black text-[#ea580c]">{plan.targetHeadcount}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#ECE0D6] flex items-center justify-between text-xs">
                      <span className="text-[#6B6B6B]">Open Headcount Gap:</span>
                      <span className="font-bold text-rose-600">+{gap} Hires Needed</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section B: Manpower Requisitions Table (Directly Linked to ATS Recruitment) */}
          <div className="bg-white rounded-2xl border border-[#ECE0D6] shadow-sm overflow-hidden space-y-2">
            <div className="p-4 border-b border-[#ECE0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#1A1A1A]">Manpower Requisitions Queue</h2>
                <p className="text-xs text-[#6B6B6B]">
                  Approving a requisition automatically creates and publishes a Job Opening in ATS Recruitment.
                </p>
              </div>
              <div className="text-xs text-[#6B6B6B]">
                {requisitions.length} requisitions submitted
              </div>
            </div>

            {reqsLoading ? (
              <div className="p-8 text-center text-xs text-[#6B6B6B]">Loading requisitions...</div>
            ) : requisitions.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B6B6B]">
                No manpower requisitions raised. Click "Raise Requisition" to open a hiring pipeline.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider">
                      <th className="py-3 px-4">Code / Title</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Headcount</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Budget / Hire</th>
                      <th className="py-3 px-4">Status & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECE0D6] text-xs">
                    {requisitions.map((req) => {
                      const prio = REQ_PRIORITY_BADGES[req.priority] || REQ_PRIORITY_BADGES.medium;
                      return (
                        <tr key={req._id} className="hover:bg-[#fff7ed]/20 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-mono text-[10px] text-[#f97316] font-bold">{req.requisitionCode}</div>
                            <div className="font-bold text-[#1A1A1A]">{req.jobTitle}</div>
                          </td>
                          <td className="py-3 px-4 text-[#1A1A1A] font-medium">
                            {req.departmentId?.name}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#1A1A1A]">
                            {req.headcount} {req.headcount === 1 ? 'position' : 'positions'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${prio.bg} ${prio.text} border ${prio.border}`}>
                              {req.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-[#1A1A1A]">
                            ${(req.budgetPerHire || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            {req.status === 'approved' ? (
                              <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Approved (ATS Synced)</span>
                              </div>
                            ) : canApprove ? (
                              <button
                                type="button"
                                onClick={() => approveReqMutation.mutate(req._id)}
                                disabled={approveReqMutation.isPending}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Approve & Spawn Job Opening
                              </button>
                            ) : (
                              <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Pending Approval
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: ADD CATALOG SKILL ── */}
      <AnimatePresence>
        {showSkillModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#ECE0D6] p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1A1A1A]">Add Catalog Skill</h3>
                <button
                  type="button"
                  onClick={() => setShowSkillModal(false)}
                  className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Skill Name</label>
                  <input
                    type="text"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Distributed Database Engineering"
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Category</label>
                  <select
                    value={newSkill.category}
                    onChange={(e) => setNewSkill((prev) => ({ ...prev, category: e.target.value as SkillCategory }))}
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  >
                    <option value="technical">Technical</option>
                    <option value="functional">Functional</option>
                    <option value="leadership">Leadership</option>
                    <option value="soft_skill">Soft Skill</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newSkill.description}
                    onChange={(e) => setNewSkill((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Skill description and expectations..."
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSkillModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!newSkill.name) return;
                    await createSkillMutation.mutateAsync(newSkill);
                    setShowSkillModal(false);
                    setNewSkill({ name: '', category: 'technical', description: '' });
                  }}
                  disabled={!newSkill.name}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] text-white hover:bg-[#ea580c] disabled:opacity-50"
                >
                  Save Skill
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: RATE EMPLOYEE COMPETENCY ── */}
      <AnimatePresence>
        {showEmpSkillModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#ECE0D6] p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1A1A1A]">Rate Employee Competency</h3>
                <button
                  type="button"
                  onClick={() => setShowEmpSkillModal(false)}
                  className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Employee</label>
                  <select
                    value={newEmpSkill.employeeId}
                    onChange={(e) => setNewEmpSkill((prev) => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.fullName} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Skill</label>
                  <select
                    value={newEmpSkill.skillId}
                    onChange={(e) => setNewEmpSkill((prev) => ({ ...prev, skillId: e.target.value }))}
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  >
                    <option value="">-- Choose Skill --</option>
                    {skills.map((sk) => (
                      <option key={sk._id} value={sk._id}>
                        {sk.name} ({sk.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                    Proficiency Level: {newEmpSkill.proficiencyLevel} / 5
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setNewEmpSkill((prev) => ({ ...prev, proficiencyLevel: lvl }))}
                        className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                          lvl <= newEmpSkill.proficiencyLevel
                            ? 'bg-amber-50 border-amber-300 text-amber-600'
                            : 'bg-stone-50 border-stone-200 text-stone-400'
                        }`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Years of Experience</label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    value={newEmpSkill.yearsOfExperience}
                    onChange={(e) => setNewEmpSkill((prev) => ({ ...prev, yearsOfExperience: Number(e.target.value) }))}
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmpSkillModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!newEmpSkill.employeeId || !newEmpSkill.skillId) return;
                    await upsertEmpSkillMutation.mutateAsync(newEmpSkill);
                    setShowEmpSkillModal(false);
                  }}
                  disabled={!newEmpSkill.employeeId || !newEmpSkill.skillId}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] text-white hover:bg-[#ea580c] disabled:opacity-50"
                >
                  Save Competency
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: SCHEDULE TRAINING ── */}
      <AnimatePresence>
        {showTrainingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#ECE0D6] p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1A1A1A]">Schedule Corporate Training</h3>
                <button
                  type="button"
                  onClick={() => setShowTrainingModal(false)}
                  className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Course Title</label>
                  <input
                    type="text"
                    value={newTraining.title}
                    onChange={(e) => setNewTraining((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. System Design at Scale"
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Trainer / Instructor</label>
                  <input
                    type="text"
                    value={newTraining.trainer}
                    onChange={(e) => setNewTraining((prev) => ({ ...prev, trainer: e.target.value }))}
                    placeholder="e.g. Principal Architect / External Expert"
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Mode</label>
                    <select
                      value={newTraining.mode}
                      onChange={(e) => setNewTraining((prev) => ({ ...prev, mode: e.target.value }))}
                      className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                    >
                      <option value="virtual">Virtual</option>
                      <option value="classroom">Classroom</option>
                      <option value="self_paced">Self Paced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Capacity</label>
                    <input
                      type="number"
                      value={newTraining.capacity}
                      onChange={(e) => setNewTraining((prev) => ({ ...prev, capacity: Number(e.target.value) }))}
                      className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Start Date</label>
                    <input
                      type="date"
                      value={newTraining.startDate}
                      onChange={(e) => setNewTraining((prev) => ({ ...prev, startDate: e.target.value }))}
                      className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">End Date</label>
                    <input
                      type="date"
                      value={newTraining.endDate}
                      onChange={(e) => setNewTraining((prev) => ({ ...prev, endDate: e.target.value }))}
                      className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTrainingModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!newTraining.title) return;
                    await createTrainingMutation.mutateAsync(newTraining);
                    setShowTrainingModal(false);
                  }}
                  disabled={!newTraining.title}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] text-white hover:bg-[#ea580c] disabled:opacity-50"
                >
                  Schedule Program
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: RAISE MANPOWER REQUISITION ── */}
      <AnimatePresence>
        {showRequisitionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#ECE0D6] p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1A1A1A]">Raise Manpower Requisition</h3>
                <button
                  type="button"
                  onClick={() => setShowRequisitionModal(false)}
                  className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Target Department</label>
                  <select
                    value={newRequisition.departmentId}
                    onChange={(e) => setNewRequisition((prev) => ({ ...prev, departmentId: e.target.value }))}
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  >
                    <option value="">-- Choose Department --</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Job Title</label>
                  <input
                    type="text"
                    value={newRequisition.jobTitle}
                    onChange={(e) => setNewRequisition((prev) => ({ ...prev, jobTitle: e.target.value }))}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Openings Count</label>
                    <input
                      type="number"
                      min={1}
                      value={newRequisition.headcount}
                      onChange={(e) => setNewRequisition((prev) => ({ ...prev, headcount: Number(e.target.value) }))}
                      className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Priority</label>
                    <select
                      value={newRequisition.priority}
                      onChange={(e) => setNewRequisition((prev) => ({ ...prev, priority: e.target.value as RequisitionPriority }))}
                      className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Annual Budget / Hire ($)</label>
                    <input
                      type="number"
                      value={newRequisition.budgetPerHire}
                      onChange={(e) => setNewRequisition((prev) => ({ ...prev, budgetPerHire: Number(e.target.value) }))}
                      className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Required By Date</label>
                    <input
                      type="date"
                      value={newRequisition.requiredByDate}
                      onChange={(e) => setNewRequisition((prev) => ({ ...prev, requiredByDate: e.target.value }))}
                      className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Business Justification</label>
                  <textarea
                    rows={2}
                    value={newRequisition.justification}
                    onChange={(e) => setNewRequisition((prev) => ({ ...prev, justification: e.target.value }))}
                    placeholder="Rationale for additional workforce capacity..."
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequisitionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!newRequisition.departmentId || !newRequisition.jobTitle) return;
                    await createReqMutation.mutateAsync(newRequisition);
                    setShowRequisitionModal(false);
                  }}
                  disabled={!newRequisition.departmentId || !newRequisition.jobTitle}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] text-white hover:bg-[#ea580c] disabled:opacity-50"
                >
                  Submit Requisition
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: SET DEPARTMENT HEADCOUNT TARGET ── */}
      <AnimatePresence>
        {showHeadcountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#ECE0D6] p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1A1A1A]">Set Department Headcount Target</h3>
                <button
                  type="button"
                  onClick={() => setShowHeadcountModal(false)}
                  className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Department</label>
                  <select
                    value={newPlan.departmentId}
                    onChange={(e) => setNewPlan((prev) => ({ ...prev, departmentId: e.target.value }))}
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  >
                    <option value="">-- Choose Department --</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Target Headcount</label>
                    <input
                      type="number"
                      min={1}
                      value={newPlan.targetHeadcount}
                      onChange={(e) => setNewPlan((prev) => ({ ...prev, targetHeadcount: Number(e.target.value) }))}
                      className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Allocated Budget ($)</label>
                    <input
                      type="number"
                      value={newPlan.allocatedBudget}
                      onChange={(e) => setNewPlan((prev) => ({ ...prev, allocatedBudget: Number(e.target.value) }))}
                      className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowHeadcountModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!newPlan.departmentId) return;
                    await upsertHeadcountMutation.mutateAsync(newPlan);
                    setShowHeadcountModal(false);
                  }}
                  disabled={!newPlan.departmentId}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] text-white hover:bg-[#ea580c] disabled:opacity-50"
                >
                  Save Targets
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TalentPlanningPage;
