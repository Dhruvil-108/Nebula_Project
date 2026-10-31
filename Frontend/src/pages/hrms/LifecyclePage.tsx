import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  UserMinus,
  LifeBuoy,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Shield,
  Laptop,
  Coins,
  Send,
  MessageSquare,
  Download,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  FileText,
  Calendar,
  Sparkles,
  ChevronRight,
  Eye,
  Megaphone,
  Briefcase,
  Layers,
  Award,
} from 'lucide-react';
import {
  useOnboardingCases,
  useCreateOnboardingCase,
  useToggleOnboardingTask,
  useOffboardingCases,
  useCreateOffboardingCase,
  useUpdateOffboardingClearance,
  useSubmitExitInterview,
  useHrTickets,
  useCreateHrTicket,
  useUpdateTicketStatus,
  useAddTicketComment,
  useLetterTemplates,
  useGenerateLetterPdf,
  usePolicies,
  useAcknowledgePolicy,
  useAnnouncements,
  useCreateAnnouncement,
  useEmployees,
  useDepartments,
} from '../../hooks/useHrms';
import { useAuth } from '../../contexts/AuthContext';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import type {
  OnboardingCase,
  OffboardingCase,
  HrTicket,
  LetterTemplate,
  PolicyDocument,
  Announcement,
  HrTicketPriority,
  HrTicketCategory,
  OnboardingTaskRole,
} from '../../types/hrms';

type LifecycleTab = 'onboarding' | 'offboarding' | 'tickets' | 'letters_policies';

const ROLE_BADGE: Record<OnboardingTaskRole, { bg: string; text: string; border: string }> = {
  hr: { bg: 'bg-[#fff7ed]', text: 'text-[#ea580c]', border: 'border-[#fed7aa]' },
  it: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  finance: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  manager: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  employee: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
};

const PRIORITY_BADGE: Record<HrTicketPriority, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200' },
  medium: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  high: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  urgent: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

export const LifecyclePage: React.FC = () => {
  const { user } = useAuth();
  const { can } = useModuleAccess('hrms');
  const canEdit = can('edit');
  const canApprove = can('approve');
  const isManagement = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';

  const [activeTab, setActiveTab] = useState<LifecycleTab>('onboarding');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals state
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showOffboardModal, setShowOffboardModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<OnboardingCase | null>(null);
  const [selectedExitCase, setSelectedExitCase] = useState<OffboardingCase | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<HrTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Letter Generator State
  const [selectedLetterTemplate, setSelectedLetterTemplate] = useState<string>('');
  const [selectedLetterEmpId, setSelectedLetterEmpId] = useState<string>('');
  const [customLetterVars, setCustomLetterVars] = useState<Record<string, string>>({});

  // Queries
  const { data: onboardingCases = [], isLoading: onboardingLoading, refetch: refetchOnboarding } = useOnboardingCases();
  const { data: offboardingCases = [], isLoading: offboardingLoading, refetch: refetchOffboarding } = useOffboardingCases();
  const { data: tickets = [], isLoading: ticketsLoading, refetch: refetchTickets } = useHrTickets();
  const { data: letterTemplates = [] } = useLetterTemplates();
  const { data: policies = [], refetch: refetchPolicies } = usePolicies();
  const { data: announcements = [], refetch: refetchAnnouncements } = useAnnouncements();
  const { data: employees = [] } = useEmployees();
  const { data: departments = [] } = useDepartments();

  // Mutations
  const createOnboardMutation = useCreateOnboardingCase();
  const toggleTaskMutation = useToggleOnboardingTask();
  const createOffboardMutation = useCreateOffboardingCase();
  const updateClearanceMutation = useUpdateOffboardingClearance();
  const submitExitMutation = useSubmitExitInterview();
  const createTicketMutation = useCreateHrTicket();
  const updateTicketMutation = useUpdateTicketStatus();
  const addCommentMutation = useAddTicketComment();
  const generatePdfMutation = useGenerateLetterPdf();
  const acknowledgePolicyMutation = useAcknowledgePolicy();
  const createAnnouncementMutation = useCreateAnnouncement();

  // Form states
  const [newOnboard, setNewOnboard] = useState({ employeeId: '', joiningDate: new Date().toISOString().split('T')[0] });
  const [newOffboard, setNewOffboard] = useState({ employeeId: '', reason: 'resignation', lastWorkingDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], noticePeriodDays: 30 });
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'payroll' as HrTicketCategory, priority: 'medium' as HrTicketPriority, description: '' });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', priority: 'normal', isPinned: false });
  const [exitInterviewForm, setExitInterviewForm] = useState({ feedback: '', ratingOverall: 4, primaryReasonForLeaving: 'Career Progression', wouldRecommendCompany: true });

  const activeLetterTemplate = letterTemplates.find((t) => t._id === selectedLetterTemplate);

  const handleTaskToggle = async (cId: string, tId: string, currentStatus: boolean) => {
    try {
      await toggleTaskMutation.mutateAsync({
        id: cId,
        taskId: tId,
        payload: { isCompleted: !currentStatus },
      });
      if (selectedCase && selectedCase._id === cId) {
        setSelectedCase((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            tasks: prev.tasks.map((t) => (t._id === tId ? { ...t, isCompleted: !currentStatus } : t)),
          };
        });
      }
    } catch {
      // handled
    }
  };

  const handleTicketCommentSubmit = async () => {
    if (!selectedTicket || !ticketReplyText.trim()) return;
    try {
      const updated = await addCommentMutation.mutateAsync({
        id: selectedTicket._id,
        message: ticketReplyText.trim(),
      });
      setSelectedTicket(updated);
      setTicketReplyText('');
    } catch {
      // handled
    }
  };

  const handleLetterDownload = async () => {
    if (!selectedLetterTemplate || !selectedLetterEmpId) return;
    await generatePdfMutation.mutateAsync({
      templateId: selectedLetterTemplate,
      employeeId: selectedLetterEmpId,
      customVariables: customLetterVars,
    });
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
              HRMS · Employee Lifecycle & Hub
            </span>
            <span className="text-xs font-mono text-[#6B6B6B]">Enterprise Workflows</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
            Lifecycle, Self-Service & Helpdesk
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Seamless multi-department onboarding, inventory asset exit clearance, employee helpdesk, and verified HR letter generation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              refetchOnboarding();
              refetchOffboarding();
              refetchTickets();
              refetchPolicies();
              refetchAnnouncements();
            }}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {activeTab === 'onboarding' && isManagement && (
            <button
              type="button"
              onClick={() => setShowOnboardModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Initiate Onboarding
            </button>
          )}

          {activeTab === 'offboarding' && isManagement && (
            <button
              type="button"
              onClick={() => setShowOffboardModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all"
            >
              <UserMinus className="w-4 h-4" />
              Initiate Exit Case
            </button>
          )}

          {activeTab === 'tickets' && (
            <button
              type="button"
              onClick={() => setShowTicketModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              New Support Ticket
            </button>
          )}

          {activeTab === 'letters_policies' && isManagement && (
            <button
              type="button"
              onClick={() => setShowAnnouncementModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-sm transition-all"
            >
              <Megaphone className="w-4 h-4" />
              Broadcast News
            </button>
          )}
        </div>
      </motion.div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#ECE0D6] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] mb-1 font-medium">
            <span>Active Onboarding</span>
            <UserPlus className="w-4 h-4 text-[#ea580c]" />
          </div>
          <div className="text-2xl font-black text-[#1A1A1A]">
            {onboardingCases.filter((c) => c.status !== 'completed').length}
          </div>
          <div className="text-[11px] text-[#6B6B6B] mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">{onboardingCases.filter((c) => c.status === 'completed').length} completed</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#ECE0D6] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] mb-1 font-medium">
            <span>Exit Clearances</span>
            <UserMinus className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-[#1A1A1A]">
            {offboardingCases.filter((c) => c.status !== 'completed').length}
          </div>
          <div className="text-[11px] text-[#6B6B6B] mt-1">Pending IT/Asset/Finance sign-off</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#ECE0D6] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] mb-1 font-medium">
            <span>Open Helpdesk Tickets</span>
            <LifeBuoy className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-[#1A1A1A]">
            {tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length}
          </div>
          <div className="text-[11px] text-[#6B6B6B] mt-1">
            <span className="text-amber-600 font-semibold">{tickets.filter((t) => t.priority === 'urgent' && t.status !== 'resolved').length} urgent</span> SLA attention
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#ECE0D6] shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between text-xs text-[#6B6B6B] mb-1 font-medium">
            <span>Policies & News</span>
            <FileCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-[#1A1A1A]">
            {policies.length + announcements.length}
          </div>
          <div className="text-[11px] text-[#6B6B6B] mt-1">{policies.length} corporate compliance policies</div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-[#ECE0D6] pb-2 overflow-x-auto">
        {[
          { key: 'onboarding', label: 'Onboarding Pipeline', icon: UserPlus },
          { key: 'offboarding', label: 'Offboarding & Clearances', icon: UserMinus },
          { key: 'tickets', label: 'Helpdesk & Service Desk', icon: LifeBuoy },
          { key: 'letters_policies', label: 'Letters, Policies & News', icon: FileCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as LifecycleTab)}
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

      {/* ── TAB 1: ONBOARDING PIPELINE ── */}
      {activeTab === 'onboarding' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List of Onboarding Cases */}
            <div className="lg:col-span-1 space-y-3">
              <div className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider px-1">
                Active Cases ({onboardingCases.length})
              </div>
              {onboardingLoading ? (
                <div className="p-8 text-center text-xs text-[#6B6B6B]">Loading onboarding cases...</div>
              ) : onboardingCases.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white border border-[#ECE0D6] text-xs text-[#6B6B6B]">
                  No onboarding cases initiated. Click "Initiate Onboarding" to begin.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                  {onboardingCases.map((oc) => {
                    const isSelected = selectedCase?._id === oc._id;
                    const completedTasks = oc.tasks.filter((t) => t.isCompleted).length;
                    const totalTasks = oc.tasks.length;
                    const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                    return (
                      <div
                        key={oc._id}
                        onClick={() => setSelectedCase(oc)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#fff7ed] border-[#ea580c] shadow-sm'
                            : 'bg-white border-[#ECE0D6] hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold text-[#1A1A1A]">
                              {oc.employeeId?.fullName || 'New Hire'}
                            </div>
                            <div className="text-xs text-[#6B6B6B]">
                              {oc.employeeId?.designation || 'Staff'} · {oc.employeeId?.departmentId?.name || 'General'}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              oc.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {oc.status}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-[11px] text-[#6B6B6B] mb-1 font-medium">
                            <span>Checklist Progress</span>
                            <span className="font-bold text-[#1A1A1A]">{pct}% ({completedTasks}/{totalTasks})</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden">
                            <div
                              className="h-full bg-[#f97316] rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-2 text-[10px] text-[#6B6B6B] flex items-center justify-between">
                          <span>Joined: {new Date(oc.joiningDate).toLocaleDateString()}</span>
                          <span className="font-mono">{oc.employeeId?.employeeCode}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Case Checklist & Task Workflow */}
            <div className="lg:col-span-2">
              {selectedCase ? (
                <div className="bg-white rounded-2xl border border-[#ECE0D6] p-5 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#ECE0D6]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-[#1A1A1A]">
                          {selectedCase.employeeId?.fullName}
                        </h2>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-stone-100 text-stone-700 border border-stone-200">
                          {selectedCase.employeeId?.employeeCode}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B6B6B] mt-0.5">
                        {selectedCase.employeeId?.designation} · {selectedCase.employeeId?.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#6B6B6B]">Joining Date:</span>
                      <span className="text-xs font-semibold text-[#1A1A1A] bg-[#FBF8F4] px-2.5 py-1 rounded-lg border border-[#ECE0D6]">
                        {new Date(selectedCase.joiningDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Task Breakdown by Role */}
                  <div className="space-y-4">
                    <div className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                      Departmental Checklists ({selectedCase.tasks.length} items)
                    </div>

                    <div className="space-y-2.5">
                      {selectedCase.tasks.map((task) => {
                        const roleStyle = ROLE_BADGE[task.role] || ROLE_BADGE.hr;
                        return (
                          <div
                            key={task._id}
                            className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                              task.isCompleted
                                ? 'bg-emerald-50/40 border-emerald-200'
                                : 'bg-[#FBF8F4] border-[#ECE0D6] hover:border-stone-300'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => handleTaskToggle(selectedCase._id, task._id, task.isCompleted)}
                                className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                  task.isCompleted
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'bg-white border-stone-300 hover:border-orange-500'
                                }`}
                              >
                                {task.isCompleted && <Check className="w-3.5 h-3.5" />}
                              </button>
                              <div>
                                <div className={`text-sm font-semibold ${task.isCompleted ? 'line-through text-[#6B6B6B]' : 'text-[#1A1A1A]'}`}>
                                  {task.title}
                                </div>
                                {task.description && (
                                  <div className="text-xs text-[#6B6B6B] mt-0.5">{task.description}</div>
                                )}
                                {task.completedAt && (
                                  <div className="text-[10px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Completed on {new Date(task.completedAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${roleStyle.bg} ${roleStyle.text} border ${roleStyle.border}`}>
                              {task.role}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[380px] flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-[#ECE0D6] p-8 text-center text-xs text-[#6B6B6B]">
                  <UserPlus className="w-8 h-8 text-stone-300 mb-2" />
                  Select an onboarding candidate from the left to manage checklists and complete setup.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: OFFBOARDING & CLEARANCES ── */}
      {activeTab === 'offboarding' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Exit Cases List */}
            <div className="lg:col-span-1 space-y-3">
              <div className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider px-1">
                Exit Cases ({offboardingCases.length})
              </div>
              {offboardingLoading ? (
                <div className="p-8 text-center text-xs text-[#6B6B6B]">Loading offboarding cases...</div>
              ) : offboardingCases.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white border border-[#ECE0D6] text-xs text-[#6B6B6B]">
                  No active exit cases found.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                  {offboardingCases.map((oc) => {
                    const isSelected = selectedExitCase?._id === oc._id;
                    const clearances = [oc.itClearance?.isCleared, oc.financeClearance?.isCleared, oc.adminAssets?.isCleared, oc.hrClearance?.isCleared];
                    const clearedCount = clearances.filter(Boolean).length;
                    return (
                      <div
                        key={oc._id}
                        onClick={() => setSelectedExitCase(oc)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-rose-50/50 border-rose-300 shadow-sm'
                            : 'bg-white border-[#ECE0D6] hover:border-rose-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold text-[#1A1A1A]">
                              {oc.employeeId?.fullName}
                            </div>
                            <div className="text-xs text-[#6B6B6B]">
                              {oc.employeeId?.designation} · {oc.reason}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              oc.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {oc.status}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span className="text-[#6B6B6B]">Clearances:</span>
                          <span className="font-bold text-[#1A1A1A]">{clearedCount}/4 Cleared</span>
                        </div>

                        <div className="mt-1 text-[10px] text-[#6B6B6B] flex items-center justify-between">
                          <span>LWD: {new Date(oc.lastWorkingDate).toLocaleDateString()}</span>
                          {oc.adminAssets?.pendingAssetsCount > 0 && (
                            <span className="text-rose-600 font-bold">
                              {oc.adminAssets.pendingAssetsCount} assets pending return
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Exit Clearance Workflow */}
            <div className="lg:col-span-2">
              {selectedExitCase ? (
                <div className="bg-white rounded-2xl border border-[#ECE0D6] p-5 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#ECE0D6]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-[#1A1A1A]">
                          {selectedExitCase.employeeId?.fullName}
                        </h2>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-stone-100 text-stone-700 border border-stone-200">
                          {selectedExitCase.employeeId?.employeeCode}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B6B6B] mt-0.5">
                        Exit Reason: <span className="font-semibold capitalize text-[#1A1A1A]">{selectedExitCase.reason}</span> · Notice Period: {selectedExitCase.noticePeriodDays} days
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-[#6B6B6B]">Last Working Date</div>
                      <div className="text-sm font-bold text-rose-600">
                        {new Date(selectedExitCase.lastWorkingDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* 4 Clearance Blocks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* IT Clearance */}
                    <div className="p-4 rounded-xl border border-[#ECE0D6] bg-[#FBF8F4] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Laptop className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-[#1A1A1A]">IT & System Access</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          selectedExitCase.itClearance?.isCleared
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-stone-200 text-stone-700'
                        }`}>
                          {selectedExitCase.itClearance?.isCleared ? 'Cleared' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B6B6B]">Revocation of SSO, corporate email, VPN and repos.</p>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => updateClearanceMutation.mutate({
                            id: selectedExitCase._id,
                            payload: { department: 'it', isCleared: !selectedExitCase.itClearance?.isCleared },
                          })}
                          className="mt-1 text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                        >
                          {selectedExitCase.itClearance?.isCleared ? 'Reopen IT Clearance' : 'Approve IT Clearance'}
                        </button>
                      )}
                    </div>

                    {/* Hardware / Admin Assets (Linked to Inventory) */}
                    <div className="p-4 rounded-xl border border-[#ECE0D6] bg-[#FBF8F4] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-bold text-[#1A1A1A]">Hardware Assets & Keys</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          selectedExitCase.adminAssets?.isCleared
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {selectedExitCase.adminAssets?.isCleared ? 'Cleared' : `${selectedExitCase.adminAssets?.pendingAssetsCount || 0} Assets Pending`}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B6B6B]">
                        Synchronized with Inventory module: laptops, access badges, peripherals.
                      </p>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => updateClearanceMutation.mutate({
                            id: selectedExitCase._id,
                            payload: { department: 'adminAssets', isCleared: !selectedExitCase.adminAssets?.isCleared },
                          })}
                          className="mt-1 text-xs font-semibold text-amber-700 hover:text-amber-800 underline"
                        >
                          {selectedExitCase.adminAssets?.isCleared ? 'Reopen Asset Return' : 'Force Asset Return Clearance'}
                        </button>
                      )}
                    </div>

                    {/* Finance & FNF */}
                    <div className="p-4 rounded-xl border border-[#ECE0D6] bg-[#FBF8F4] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-[#1A1A1A]">Finance & F&F Settlement</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          selectedExitCase.financeClearance?.isCleared
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-stone-200 text-stone-700'
                        }`}>
                          {selectedExitCase.financeClearance?.isCleared ? 'Settled' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B6B6B]">
                        Final dues, encashment, recovery deduction, gratuity.
                      </p>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => updateClearanceMutation.mutate({
                            id: selectedExitCase._id,
                            payload: { department: 'finance', isCleared: !selectedExitCase.financeClearance?.isCleared },
                          })}
                          className="mt-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
                        >
                          {selectedExitCase.financeClearance?.isCleared ? 'Reopen Finance' : 'Sign Off F&F Settlement'}
                        </button>
                      )}
                    </div>

                    {/* HR Sign-Off */}
                    <div className="p-4 rounded-xl border border-[#ECE0D6] bg-[#FBF8F4] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-bold text-[#1A1A1A]">HR Final Relieving</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          selectedExitCase.hrClearance?.isCleared
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-stone-200 text-stone-700'
                        }`}>
                          {selectedExitCase.hrClearance?.isCleared ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-[#6B6B6B]">
                        Exit interview evaluation & relieving letter issuance.
                      </p>
                      {canApprove && (
                        <button
                          type="button"
                          onClick={() => updateClearanceMutation.mutate({
                            id: selectedExitCase._id,
                            payload: { department: 'hr', isCleared: !selectedExitCase.hrClearance?.isCleared },
                          })}
                          className="mt-1 text-xs font-semibold text-purple-600 hover:text-purple-700 underline"
                        >
                          {selectedExitCase.hrClearance?.isCleared ? 'Revoke HR Clearance' : 'Approve Final HR Clearance'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Exit Interview Feedback Block */}
                  <div className="pt-4 border-t border-[#ECE0D6]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                        Exit Interview & Feedback
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedExitCase.exitInterview?.conducted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {selectedExitCase.exitInterview?.conducted ? 'Interview Conducted' : 'Not Conducted'}
                      </span>
                    </div>

                    {selectedExitCase.exitInterview?.conducted ? (
                      <div className="p-3.5 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] space-y-2 text-xs">
                        <div>
                          <span className="text-[#6B6B6B]">Primary Reason:</span>{' '}
                          <span className="font-semibold text-[#1A1A1A]">{selectedExitCase.exitInterview.primaryReasonForLeaving}</span>
                        </div>
                        <div>
                          <span className="text-[#6B6B6B]">Overall Rating:</span>{' '}
                          <span className="font-semibold text-[#1A1A1A]">{selectedExitCase.exitInterview.ratingOverall} / 5</span>
                        </div>
                        {selectedExitCase.exitInterview.feedback && (
                          <div>
                            <span className="text-[#6B6B6B]">Notes:</span>{' '}
                            <span className="italic text-[#1A1A1A]">{selectedExitCase.exitInterview.feedback}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#fff7ed] border border-[#fed7aa]">
                        <span className="text-xs text-[#ea580c] font-medium">Capture confidential exit feedback for retention analytics.</span>
                        <button
                          type="button"
                          onClick={() => {
                            submitExitMutation.mutate({
                              id: selectedExitCase._id,
                              payload: {
                                ratingOverall: 4,
                                primaryReasonForLeaving: 'Career Growth',
                                feedback: 'Positive tenure overall.',
                                wouldRecommendCompany: true,
                              },
                            });
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#f97316] text-white hover:bg-[#ea580c]"
                        >
                          Record Interview
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[380px] flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-[#ECE0D6] p-8 text-center text-xs text-[#6B6B6B]">
                  <UserMinus className="w-8 h-8 text-stone-300 mb-2" />
                  Select an offboarding case from the left to manage multi-department sign-offs.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: HELPDESK & SERVICE DESK ── */}
      {activeTab === 'tickets' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ticket Queue */}
            <div className="lg:col-span-1 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Tickets Queue ({tickets.length})
                </span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs border border-[#ECE0D6] rounded-lg px-2 py-1 bg-white text-[#1A1A1A]"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              {ticketsLoading ? (
                <div className="p-8 text-center text-xs text-[#6B6B6B]">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-white border border-[#ECE0D6] text-xs text-[#6B6B6B]">
                  No tickets found. Click "New Support Ticket" to raise one.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                  {tickets
                    .filter((t) => filterStatus === 'all' || t.status === filterStatus)
                    .map((t) => {
                      const isSelected = selectedTicket?._id === t._id;
                      const prio = PRIORITY_BADGE[t.priority] || PRIORITY_BADGE.medium;
                      return (
                        <div
                          key={t._id}
                          onClick={() => setSelectedTicket(t)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#fff7ed] border-[#ea580c] shadow-sm'
                              : 'bg-white border-[#ECE0D6] hover:border-orange-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-[10px] text-[#6B6B6B]">{t.ticketCode}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${prio.bg} ${prio.text} border ${prio.border}`}>
                              {t.priority}
                            </span>
                          </div>

                          <div className="text-sm font-bold text-[#1A1A1A] mt-1 line-clamp-1">
                            {t.subject}
                          </div>

                          <div className="text-xs text-[#6B6B6B] mt-0.5">
                            {t.employeeId?.fullName} · <span className="capitalize">{t.category}</span>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#6B6B6B]">
                            <span className="capitalize">{t.status.replace('_', ' ')}</span>
                            <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Ticket Thread & Action Pane */}
            <div className="lg:col-span-2">
              {selectedTicket ? (
                <div className="bg-white rounded-2xl border border-[#ECE0D6] p-5 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#ECE0D6]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#f97316]">
                          {selectedTicket.ticketCode}
                        </span>
                        <h2 className="text-base font-bold text-[#1A1A1A]">
                          {selectedTicket.subject}
                        </h2>
                      </div>
                      <p className="text-xs text-[#6B6B6B] mt-0.5">
                        Raised by {selectedTicket.employeeId?.fullName} ({selectedTicket.employeeId?.employeeCode}) · Category: {selectedTicket.category}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => {
                          updateTicketMutation.mutate({
                            id: selectedTicket._id,
                            payload: { status: e.target.value },
                          });
                          setSelectedTicket((prev) => prev ? { ...prev, status: e.target.value as any } : null);
                        }}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-[#ECE0D6] bg-[#FBF8F4] text-[#1A1A1A]"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="waiting_on_employee">Waiting On Employee</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  {/* Initial Description */}
                  <div className="p-3.5 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] text-xs text-[#1A1A1A] leading-relaxed">
                    <div className="text-[10px] font-bold text-[#6B6B6B] uppercase mb-1">Issue Description</div>
                    {selectedTicket.description}
                  </div>

                  {/* Conversation Comments */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                      Discussion History ({selectedTicket.comments?.length || 0})
                    </div>

                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                      {selectedTicket.comments?.map((c) => (
                        <div key={c._id} className="p-3 rounded-xl bg-white border border-[#ECE0D6] text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-[#6B6B6B]">
                            <span className="font-semibold text-[#1A1A1A]">{c.senderId?.fullName || 'HR Support'}</span>
                            <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="text-[#1A1A1A]">{c.message}</div>
                        </div>
                      ))}
                    </div>

                    {/* Reply Input */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={ticketReplyText}
                        onChange={(e) => setTicketReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleTicketCommentSubmit()}
                        placeholder="Write a response to the employee..."
                        className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-[#ECE0D6] bg-[#FBF8F4] focus:outline-none focus:ring-1 focus:ring-[#f97316]"
                      />
                      <button
                        type="button"
                        onClick={handleTicketCommentSubmit}
                        disabled={!ticketReplyText.trim()}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#f97316] text-white hover:bg-[#ea580c] disabled:opacity-50 transition-all flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full min-h-[380px] flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-[#ECE0D6] p-8 text-center text-xs text-[#6B6B6B]">
                  <LifeBuoy className="w-8 h-8 text-stone-300 mb-2" />
                  Select a ticket from the left to view conversation thread and update status.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: LETTERS, POLICIES & NEWS ── */}
      {activeTab === 'letters_policies' && (
        <div className="space-y-8">
          {/* Section A: HR Letters Generator */}
          <div className="bg-white rounded-2xl border border-[#ECE0D6] p-5 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#f97316]" />
              <div>
                <h2 className="text-base font-bold text-[#1A1A1A]">Official HR Letter Generator</h2>
                <p className="text-xs text-[#6B6B6B]">
                  Select template, bind employee dossier variables, and download signed, branded PDF instantly.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-[#1A1A1A] mb-1">Select Template</label>
                <select
                  value={selectedLetterTemplate}
                  onChange={(e) => setSelectedLetterTemplate(e.target.value)}
                  className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316]"
                >
                  <option value="">-- Choose Template --</option>
                  {letterTemplates.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title} ({t.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1A1A1A] mb-1">Target Employee</label>
                <select
                  value={selectedLetterEmpId}
                  onChange={(e) => setSelectedLetterEmpId(e.target.value)}
                  className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316]"
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.fullName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleLetterDownload}
                  disabled={!selectedLetterTemplate || !selectedLetterEmpId || generatePdfMutation.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] text-white hover:bg-[#ea580c] disabled:opacity-50 transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  {generatePdfMutation.isPending ? 'Generating PDF...' : 'Download Vector PDF'}
                </button>
              </div>
            </div>

            {activeLetterTemplate && (
              <div className="p-3.5 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] text-xs text-[#6B6B6B] space-y-1">
                <div className="font-bold text-[#1A1A1A]">{activeLetterTemplate.subject}</div>
                <div className="text-[11px] font-mono">
                  Interpolates: {activeLetterTemplate.variables?.join(', ') || 'Standard employee dossier variables'}
                </div>
              </div>
            )}
          </div>

          {/* Section B: Company Policies & Read Receipts */}
          <div className="bg-white rounded-2xl border border-[#ECE0D6] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <div>
                  <h2 className="text-base font-bold text-[#1A1A1A]">Company Policies & Compliance</h2>
                  <p className="text-xs text-[#6B6B6B]">Mandatory policy acknowledgement and compliance tracking.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {policies.map((p) => {
                const hasAck = p.acknowledgements?.some((a) => (a.employeeId as any) === user?._id || (a as any).employeeId?._id === user?._id);
                return (
                  <div key={p._id} className="p-4 rounded-xl border border-[#ECE0D6] bg-[#FBF8F4] space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {p.category}
                        </span>
                        <h3 className="text-sm font-bold text-[#1A1A1A] mt-1">{p.title}</h3>
                      </div>
                      <span className="text-[10px] font-mono text-[#6B6B6B]">v{p.version}</span>
                    </div>

                    <p className="text-xs text-[#6B6B6B] line-clamp-2">{p.summary || p.content}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#ECE0D6] text-xs">
                      <span className="text-[11px] text-[#6B6B6B]">
                        {p.acknowledgements?.length || 0} employees acknowledged
                      </span>
                      {hasAck ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => acknowledgePolicyMutation.mutate(p._id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                        >
                          Acknowledge Policy
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section C: Organization Announcements Feed */}
          <div className="bg-white rounded-2xl border border-[#ECE0D6] p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-600" />
              <div>
                <h2 className="text-base font-bold text-[#1A1A1A]">Broadcast News & Announcements</h2>
                <p className="text-xs text-[#6B6B6B]">Company-wide bulletins, townhall notes, and organizational updates.</p>
              </div>
            </div>

            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann._id}
                  className={`p-4 rounded-xl border transition-all ${
                    ann.priority === 'urgent'
                      ? 'bg-rose-50/40 border-rose-200'
                      : ann.isPinned
                      ? 'bg-[#fff7ed]/50 border-[#fed7aa]'
                      : 'bg-[#FBF8F4] border-[#ECE0D6]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      {ann.isPinned && (
                        <span className="text-[10px] font-bold bg-[#f97316] text-white px-1.5 py-0.5 rounded">
                          PINNED
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-[#1A1A1A]">{ann.title}</h3>
                    </div>
                    <span className="text-[10px] text-[#6B6B6B]">
                      {new Date(ann.publishDate).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-[#1A1A1A] leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── INITIATE ONBOARDING MODAL ── */}
      <AnimatePresence>
        {showOnboardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#ECE0D6] p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1A1A1A]">Initiate Onboarding Workflow</h3>
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Select Employee</label>
                  <select
                    value={newOnboard.employeeId}
                    onChange={(e) => setNewOnboard((prev) => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  >
                    <option value="">-- Choose New Employee --</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.fullName} ({emp.employeeCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={newOnboard.joiningDate}
                    onChange={(e) => setNewOnboard((prev) => ({ ...prev, joiningDate: e.target.value }))}
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  >
                  </input>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOnboardModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!newOnboard.employeeId) return;
                    await createOnboardMutation.mutateAsync(newOnboard);
                    setShowOnboardModal(false);
                  }}
                  disabled={!newOnboard.employeeId}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] text-white hover:bg-[#ea580c] disabled:opacity-50"
                >
                  Start Onboarding
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── INITIATE OFFBOARDING MODAL ── */}
      <AnimatePresence>
        {showOffboardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#ECE0D6] p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1A1A1A]">Initiate Exit Clearance</h3>
                <button
                  type="button"
                  onClick={() => setShowOffboardModal(false)}
                  className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Select Resigning Employee</label>
                  <select
                    value={newOffboard.employeeId}
                    onChange={(e) => setNewOffboard((prev) => ({ ...prev, employeeId: e.target.value }))}
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
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Exit Reason</label>
                  <select
                    value={newOffboard.reason}
                    onChange={(e) => setNewOffboard((prev) => ({ ...prev, reason: e.target.value }))}
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  >
                    <option value="resignation">Voluntary Resignation</option>
                    <option value="termination">Termination</option>
                    <option value="retirement">Retirement</option>
                    <option value="end_of_contract">End of Contract</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Last Working Date</label>
                  <input
                    type="date"
                    value={newOffboard.lastWorkingDate}
                    onChange={(e) => setNewOffboard((prev) => ({ ...prev, lastWorkingDate: e.target.value }))}
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOffboardModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!newOffboard.employeeId) return;
                    await createOffboardMutation.mutateAsync(newOffboard);
                    setShowOffboardModal(false);
                  }}
                  disabled={!newOffboard.employeeId}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  Create Exit Case
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── NEW TICKET MODAL ── */}
      <AnimatePresence>
        {showTicketModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#ECE0D6] p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1A1A1A]">Raise Support Ticket</h3>
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket((prev) => ({ ...prev, category: e.target.value as HrTicketCategory }))}
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  >
                    <option value="payroll">Payroll & Tax</option>
                    <option value="benefits">Benefits & Insurance</option>
                    <option value="leave_attendance">Leave & Attendance</option>
                    <option value="it_support">IT & Laptop Support</option>
                    <option value="workplace">Workplace & Facilities</option>
                    <option value="grievance">Grievance / HR Policy</option>
                    <option value="general">General Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket((prev) => ({ ...prev, priority: e.target.value as HrTicketPriority }))}
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Subject</label>
                  <input
                    type="text"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket((prev) => ({ ...prev, subject: e.target.value }))}
                    placeholder="Brief summary of your query"
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Detailed Description</label>
                  <textarea
                    rows={3}
                    value={newTicket.description}
                    onChange={(e) => setNewTicket((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide details so HR or IT can assist quickly"
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTicketModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!newTicket.subject || !newTicket.description) return;
                    await createTicketMutation.mutateAsync(newTicket);
                    setShowTicketModal(false);
                    setNewTicket({ subject: '', category: 'payroll', priority: 'medium', description: '' });
                  }}
                  disabled={!newTicket.subject || !newTicket.description}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] text-white hover:bg-[#ea580c] disabled:opacity-50"
                >
                  Submit Ticket
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── BROADCAST ANNOUNCEMENT MODAL ── */}
      <AnimatePresence>
        {showAnnouncementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-[#ECE0D6] p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1A1A1A]">Broadcast News / Announcement</h3>
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Headline</label>
                  <input
                    type="text"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Annual Company Offsite & Strategy Townhall"
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Priority</label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) => setNewAnnouncement((prev) => ({ ...prev, priority: e.target.value }))}
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Content</label>
                  <textarea
                    rows={4}
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Write announcement body..."
                    className="w-full text-xs border border-[#ECE0D6] rounded-xl px-3 py-2 bg-[#FBF8F4] text-[#1A1A1A]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pinAnnouncement"
                    checked={newAnnouncement.isPinned}
                    onChange={(e) => setNewAnnouncement((prev) => ({ ...prev, isPinned: e.target.checked }))}
                    className="rounded border-stone-300 text-[#f97316] focus:ring-[#f97316]"
                  />
                  <label htmlFor="pinAnnouncement" className="text-xs text-[#1A1A1A] font-medium">
                    Pin to top of news feed
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!newAnnouncement.title || !newAnnouncement.content) return;
                    await createAnnouncementMutation.mutateAsync(newAnnouncement);
                    setShowAnnouncementModal(false);
                    setNewAnnouncement({ title: '', content: '', priority: 'normal', isPinned: false });
                  }}
                  disabled={!newAnnouncement.title || !newAnnouncement.content}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] text-white hover:bg-[#ea580c] disabled:opacity-50"
                >
                  Publish Announcement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LifecyclePage;
