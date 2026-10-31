import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sliders,
  Clock,
  GitBranch,
  ShieldAlert,
  Bell,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Check,
  X,
  MapPin,
  Calendar,
  Lock,
  ChevronRight,
} from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';

type TabKey = 'general' | 'workflows' | 'audit' | 'notifications' | 'ai';

interface HrSettingsData {
  _id?: string;
  workWeekDays: number[];
  defaultShiftStartTime: string;
  defaultShiftEndTime: string;
  gracePeriodMinutes: number;
  halfDayHours: number;
  fullDayHours: number;
  allowWebClockIn: boolean;
  enableGeofencing: boolean;
  geofenceRadiusMeters: number;
  allowSelfRegularization: boolean;
  leaveYearStartMonth: number;
  sandwichLeaveRule: boolean;
  notifyManagerOnLeaveRequest: boolean;
  notifyEmployeeOnApproval: boolean;
  notifyOnLateArrival: boolean;
  aiCopilotEnabled: boolean;
  aiAutomatedScreening: boolean;
  timezone?: string;
  shiftStartTime?: string;
}

interface AuditLogEntry {
  _id: string;
  actorUserId?: {
    _id: string;
    fullName: string;
    email: string;
    role: string;
  };
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, { before: any; after: any }>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function HrSettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogEntry | null>(null);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // 1. Load HR Settings
  const {
    data: settings,
    isLoading: loadingSettings,
    refetch: refetchSettings,
  } = useQuery<HrSettingsData>({
    queryKey: ['hrSettings'],
    queryFn: async () => {
      const res = await apiClient.get('/hr/settings');
      return res.data;
    },
  });

  // Local state initialized when settings load
  const [formData, setFormData] = useState<Partial<HrSettingsData>>({});

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // 2. Load Audit Logs
  const {
    data: auditData,
    isLoading: loadingAudit,
    refetch: refetchAudit,
  } = useQuery<{ logs: AuditLogEntry[]; total: number; pages: number }>({
    queryKey: ['hrAuditLogs', auditActionFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (auditActionFilter) params.append('action', auditActionFilter);
      params.append('limit', '50');
      const res = await apiClient.get(`/hr/audit-logs?${params.toString()}`);
      return res.data;
    },
    enabled: activeTab === 'audit',
  });

  // 3. Load Workflow Inbox
  const { data: workflowInbox, refetch: refetchWorkflows } = useQuery({
    queryKey: ['hrWorkflowInbox'],
    queryFn: async () => {
      const res = await apiClient.get('/hr/workflows/inbox?status=pending');
      return res.data;
    },
    enabled: activeTab === 'workflows',
  });

  // 4. Update HR Settings Mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<HrSettingsData>) => {
      const res = await apiClient.patch('/hr/settings', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrSettings'] });
      setSaveSuccess(true);
      setErrorMessage(null);
      setTimeout(() => setSaveSuccess(false), 3500);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.error || 'Failed to update HR settings.');
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const toggleDay = (dayIndex: number) => {
    const current = formData.workWeekDays || [1, 2, 3, 4, 5];
    const updated = current.includes(dayIndex)
      ? current.filter((d) => d !== dayIndex)
      : [...current, dayIndex].sort();
    setFormData({ ...formData, workWeekDays: updated });
  };

  const filteredLogs = (auditData?.logs || []).filter((log) => {
    if (!auditSearch) return true;
    const term = auditSearch.toLowerCase();
    const actor = log.actorUserId?.fullName?.toLowerCase() || '';
    const action = log.action.toLowerCase();
    const entity = log.entityType.toLowerCase();
    return actor.includes(term) || action.includes(term) || entity.includes(term);
  });

  return (
    <div className="min-h-screen bg-[#FBF8F4] text-[#1A1A1A] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECE0D6] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#fff7ed] border border-[#fed7aa] flex items-center justify-center text-[#f97316] shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1A1A1A]">
                HR Settings & Governance
              </h1>
              <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5">
                Configure corporate shifts, attendance policies, multi-level approvals, and audit trails
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Settings saved successfully
            </span>
          )}
          {errorMessage && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              {errorMessage}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending || loadingSettings}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Saving Policies...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#ECE0D6] shadow-2xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'general'
              ? 'bg-[#fff7ed] text-[#f97316] font-semibold border border-[#fed7aa] shadow-2xs'
              : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4]'
          }`}
        >
          <Clock className="w-4 h-4" />
          General & Shifts
        </button>

        <button
          onClick={() => setActiveTab('workflows')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'workflows'
              ? 'bg-[#fff7ed] text-[#f97316] font-semibold border border-[#fed7aa] shadow-2xs'
              : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4]'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Approval Workflows
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-[#fff7ed] text-[#f97316] font-semibold border border-[#fed7aa] shadow-2xs'
              : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4]'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Audit Log Viewer
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'notifications'
              ? 'bg-[#fff7ed] text-[#f97316] font-semibold border border-[#fed7aa] shadow-2xs'
              : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4]'
          }`}
        >
          <Bell className="w-4 h-4" />
          Notifications & Alerts
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-[#fff7ed] text-[#f97316] font-semibold border border-[#fed7aa] shadow-2xs'
              : 'text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          AI & Copilot Policy
        </button>
      </div>

      {/* ── TAB 1: General & Shifts ── */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shift Schedule Card */}
          <div className="bg-white rounded-2xl border border-[#ECE0D6] p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#f97316]" />
                <h3 className="text-sm font-semibold text-[#1A1A1A]">Work Hours & Shift Timings</h3>
              </div>
              <span className="text-[11px] font-mono text-[#6B6B6B] bg-[#FBF8F4] px-2 py-0.5 rounded border border-[#ECE0D6]">
                Timezone: {formData.timezone || 'Asia/Kolkata'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Default Shift Start
                </label>
                <input
                  type="time"
                  value={formData.defaultShiftStartTime || '09:30'}
                  onChange={(e) => setFormData({ ...formData, defaultShiftStartTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#ECE0D6] bg-white text-[#1A1A1A] focus:outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#fed7aa]/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Default Shift End
                </label>
                <input
                  type="time"
                  value={formData.defaultShiftEndTime || '18:30'}
                  onChange={(e) => setFormData({ ...formData, defaultShiftEndTime: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#ECE0D6] bg-white text-[#1A1A1A] focus:outline-none focus:border-[#f97316] focus:ring-2 focus:ring-[#fed7aa]/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Grace Period (min)
                </label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={formData.gracePeriodMinutes ?? 15}
                  onChange={(e) => setFormData({ ...formData, gracePeriodMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#ECE0D6] bg-white text-[#1A1A1A] focus:outline-none focus:border-[#f97316]"
                />
                <span className="text-[10px] text-[#6B6B6B] mt-1 block">Late badge after this buffer</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Half-day Threshold
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="12"
                  value={formData.halfDayHours ?? 4.5}
                  onChange={(e) => setFormData({ ...formData, halfDayHours: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#ECE0D6] bg-white text-[#1A1A1A] focus:outline-none focus:border-[#f97316]"
                />
                <span className="text-[10px] text-[#6B6B6B] mt-1 block">Min hours for half-day</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                  Full-day Threshold
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="4"
                  max="16"
                  value={formData.fullDayHours ?? 8.0}
                  onChange={(e) => setFormData({ ...formData, fullDayHours: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#ECE0D6] bg-white text-[#1A1A1A] focus:outline-none focus:border-[#f97316]"
                />
                <span className="text-[10px] text-[#6B6B6B] mt-1 block">Min hours for full credit</span>
              </div>
            </div>

            {/* Work Week Days */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-2">
                Standard Working Days
              </label>
              <div className="flex flex-wrap gap-2">
                {DAY_NAMES.map((name, idx) => {
                  const isChecked = (formData.workWeekDays || [1, 2, 3, 4, 5]).includes(idx);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#fff7ed] text-[#f97316] border-[#fed7aa] font-semibold'
                          : 'bg-[#FBF8F4] text-[#6B6B6B] border-[#ECE0D6] hover:bg-white'
                      }`}
                    >
                      {name.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Attendance & Geo Policies Card */}
          <div className="bg-white rounded-2xl border border-[#ECE0D6] p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#f97316]" />
                <h3 className="text-sm font-semibold text-[#1A1A1A]">Attendance & Access Control</h3>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
                <div>
                  <p className="text-xs font-semibold text-[#1A1A1A]">Web & Mobile Clock-in</p>
                  <p className="text-[11px] text-[#6B6B6B]">Allow team members to punch from desktop or browser app</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.allowWebClockIn ?? true}
                  onChange={(e) => setFormData({ ...formData, allowWebClockIn: e.target.checked })}
                  className="w-4 h-4 accent-[#f97316] rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
                <div>
                  <p className="text-xs font-semibold text-[#1A1A1A]">Geofence Radius Enforcement</p>
                  <p className="text-[11px] text-[#6B6B6B]">Restrict clock-ins within authorized corporate premises radius</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enableGeofencing ?? false}
                  onChange={(e) => setFormData({ ...formData, enableGeofencing: e.target.checked })}
                  className="w-4 h-4 accent-[#f97316] rounded"
                />
              </div>

              {formData.enableGeofencing && (
                <div className="pl-4 border-l-2 border-[#fed7aa]">
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                    Allowed Geofence Radius (meters)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="5000"
                    value={formData.geofenceRadiusMeters ?? 200}
                    onChange={(e) => setFormData({ ...formData, geofenceRadiusMeters: Number(e.target.value) })}
                    className="w-48 px-3 py-2 text-xs rounded-xl border border-[#ECE0D6] bg-white text-[#1A1A1A]"
                  />
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
                <div>
                  <p className="text-xs font-semibold text-[#1A1A1A]">Sandwich Leave Rule</p>
                  <p className="text-[11px] text-[#6B6B6B]">Treat weekends/holidays falling between leaves as leave days</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.sandwichLeaveRule ?? false}
                  onChange={(e) => setFormData({ ...formData, sandwichLeaveRule: e.target.checked })}
                  className="w-4 h-4 accent-[#f97316] rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
                <div>
                  <p className="text-xs font-semibold text-[#1A1A1A]">Self-Service Regularization</p>
                  <p className="text-[11px] text-[#6B6B6B]">Permit employees to request missed punch corrections</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.allowSelfRegularization ?? true}
                  onChange={(e) => setFormData({ ...formData, allowSelfRegularization: e.target.checked })}
                  className="w-4 h-4 accent-[#f97316] rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Approval Workflows ── */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#ECE0D6] p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#1A1A1A]">Configured Approval Chains</h3>
                <p className="text-xs text-[#6B6B6B]">Multi-tier routing engine for Leave, Expenses, and Regularizations</p>
              </div>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                Engine Active
              </span>
            </div>

            {/* Visual Workflow Pipeline Demonstration */}
            <div className="p-4 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1A1A]">Standard Leave Approval Pipeline (48h SLA)</span>
                <span className="text-[11px] font-mono text-[#6B6B6B]">Default System Workflow</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 py-2">
                <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#ECE0D6] shadow-2xs w-full sm:w-auto">
                  <div className="w-6 h-6 rounded-full bg-[#fff7ed] text-[#f97316] font-bold text-xs flex items-center justify-center border border-[#fed7aa]">
                    1
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1A1A1A]">Requester Submit</p>
                    <p className="text-[10px] text-[#6B6B6B]">Employee / Contractor</p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-[#6B6B6B] hidden sm:block" />

                <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#ECE0D6] shadow-2xs w-full sm:w-auto">
                  <div className="w-6 h-6 rounded-full bg-[#fff7ed] text-[#f97316] font-bold text-xs flex items-center justify-center border border-[#fed7aa]">
                    2
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1A1A1A]">Reporting Manager</p>
                    <p className="text-[10px] text-[#6B6B6B]">Primary approver</p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-[#6B6B6B] hidden sm:block" />

                <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#ECE0D6] shadow-2xs w-full sm:w-auto">
                  <div className="w-6 h-6 rounded-full bg-[#fff7ed] text-[#f97316] font-bold text-xs flex items-center justify-center border border-[#fed7aa]">
                    3
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1A1A1A]">HR Operations</p>
                    <p className="text-[10px] text-[#6B6B6B]">Leave ledger audit</p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-[#6B6B6B] hidden sm:block" />

                <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 shadow-2xs w-full sm:w-auto">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-800">Final Execution</p>
                    <p className="text-[10px] text-emerald-600">Balance & Roster Sync</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Workflow Inbox */}
            <div className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-[#1A1A1A]">Current Queue / Pending Inbox</h4>
                <button
                  onClick={() => refetchWorkflows()}
                  className="flex items-center gap-1 text-[11px] text-[#f97316] hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh Queue
                </button>
              </div>

              {workflowInbox && workflowInbox.length > 0 ? (
                <div className="border border-[#ECE0D6] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FBF8F4] text-[#6B6B6B] border-b border-[#ECE0D6]">
                      <tr>
                        <th className="p-3 font-semibold">Request</th>
                        <th className="p-3 font-semibold">Requester</th>
                        <th className="p-3 font-semibold">SLA Deadline</th>
                        <th className="p-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECE0D6]">
                      {workflowInbox.map((wf: any) => (
                        <tr key={wf._id} className="hover:bg-[#FBF8F4]">
                          <td className="p-3 font-medium text-[#1A1A1A] capitalize">{wf.requestType} Request</td>
                          <td className="p-3 text-[#6B6B6B]">
                            {wf.requesterEmployeeId?.firstName} {wf.requesterEmployeeId?.lastName}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-[#6B6B6B]">
                            {new Date(wf.slaDeadline).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Step {wf.currentStepIndex + 1} Pending
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-medium text-[#1A1A1A]">No pending workflow approvals</p>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">All workflow stages are up to date</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Audit Log Viewer ── */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-[#ECE0D6] p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECE0D6] pb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Enterprise Audit Trail</h3>
              <p className="text-xs text-[#6B6B6B]">Tamper-evident system activity and policy modification ledger</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#6B6B6B] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter logs by actor, action..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#ECE0D6] bg-white text-[#1A1A1A] w-64 focus:outline-none focus:border-[#f97316]"
                />
              </div>

              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-[#ECE0D6] bg-white text-[#1A1A1A] focus:outline-none"
              >
                <option value="">All Actions</option>
                <option value="leave.request">Leave Requests</option>
                <option value="leave.approved">Leave Approvals</option>
                <option value="leave.rejected">Leave Rejections</option>
                <option value="settings.update">Settings Updates</option>
                <option value="document.upload">Document Uploads</option>
              </select>

              <button
                onClick={() => refetchAudit()}
                className="p-2 rounded-xl border border-[#ECE0D6] hover:bg-[#FBF8F4] text-[#6B6B6B] hover:text-[#1A1A1A] cursor-pointer"
                title="Refresh audit log"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          {loadingAudit ? (
            <div className="p-12 text-center text-xs text-[#6B6B6B]">Loading audit logs...</div>
          ) : filteredLogs.length > 0 ? (
            <div className="border border-[#ECE0D6] rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FBF8F4] text-[#6B6B6B] border-b border-[#ECE0D6]">
                  <tr>
                    <th className="p-3 font-semibold">Timestamp</th>
                    <th className="p-3 font-semibold">Actor</th>
                    <th className="p-3 font-semibold">Action</th>
                    <th className="p-3 font-semibold">Entity</th>
                    <th className="p-3 font-semibold">IP / Origin</th>
                    <th className="p-3 font-semibold text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE0D6]">
                  {filteredLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-[#FBF8F4] transition-colors">
                      <td className="p-3 font-mono text-[11px] text-[#6B6B6B]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-[#1A1A1A]">
                          {log.actorUserId?.fullName || 'System Event'}
                        </span>
                        {log.actorUserId?.email && (
                          <span className="block text-[10px] text-[#6B6B6B]">{log.actorUserId.email}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#fff7ed] text-[#f97316] border border-[#fed7aa]">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-[#1A1A1A]">
                        <span className="font-medium">{log.entityType}</span>
                        <span className="block font-mono text-[10px] text-[#6B6B6B]">
                          {log.entityId ? String(log.entityId).slice(0, 8) + '...' : '—'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-[#6B6B6B]">
                        {log.ipAddress || 'internal'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedAuditLog(log)}
                          className="px-2.5 py-1 rounded-lg border border-[#ECE0D6] hover:bg-white text-xs font-medium text-[#1A1A1A] hover:border-[#f97316] transition-all cursor-pointer"
                        >
                          Diff View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#6B6B6B]">
              No audit logs matched your search or filters.
            </div>
          )}

          {/* Audit Diff Inspector Modal */}
          {selectedAuditLog && (
            <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl border border-[#ECE0D6] max-w-xl w-full p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1A1A]">Audit Event Inspection</h4>
                    <p className="text-xs font-mono text-[#6B6B6B]">Action: {selectedAuditLog.action}</p>
                  </div>
                  <button
                    onClick={() => setSelectedAuditLog(null)}
                    className="p-1.5 rounded-lg hover:bg-[#FBF8F4] text-[#6B6B6B] hover:text-[#1A1A1A] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-[#1A1A1A]">Recorded Field Changes (Diff)</p>
                    <pre className="p-3 mt-1 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] font-mono text-[11px] text-[#1A1A1A] max-h-60 overflow-y-auto">
                      {JSON.stringify(selectedAuditLog.changes || {}, null, 2)}
                    </pre>
                  </div>

                  {selectedAuditLog.metadata && (
                    <div>
                      <p className="text-xs font-semibold text-[#1A1A1A]">Metadata & Headers</p>
                      <pre className="p-3 mt-1 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] font-mono text-[11px] text-[#6B6B6B] max-h-36 overflow-y-auto">
                        {JSON.stringify(selectedAuditLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedAuditLog(null)}
                    className="px-4 py-2 rounded-xl bg-[#FBF8F4] hover:bg-[#ECE0D6] text-xs font-semibold text-[#1A1A1A] cursor-pointer"
                  >
                    Close Inspector
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: Notifications & Alerts ── */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-[#ECE0D6] p-6 shadow-2xs space-y-5">
          <div className="border-b border-[#ECE0D6] pb-3">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Automated Notification Triggers</h3>
            <p className="text-xs text-[#6B6B6B]">Control email and in-app alerts dispatched across corporate milestones</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
              <div>
                <p className="text-xs font-semibold text-[#1A1A1A]">Manager Leave Alerts</p>
                <p className="text-[11px] text-[#6B6B6B]">Instantly ping reporting managers whenever a direct report applies for leave</p>
              </div>
              <input
                type="checkbox"
                checked={formData.notifyManagerOnLeaveRequest ?? true}
                onChange={(e) => setFormData({ ...formData, notifyManagerOnLeaveRequest: e.target.checked })}
                className="w-4 h-4 accent-[#f97316] rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
              <div>
                <p className="text-xs font-semibold text-[#1A1A1A]">Employee Decision Alerts</p>
                <p className="text-[11px] text-[#6B6B6B]">Send real-time approval or rejection notices directly to employees</p>
              </div>
              <input
                type="checkbox"
                checked={formData.notifyEmployeeOnApproval ?? true}
                onChange={(e) => setFormData({ ...formData, notifyEmployeeOnApproval: e.target.checked })}
                className="w-4 h-4 accent-[#f97316] rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
              <div>
                <p className="text-xs font-semibold text-[#1A1A1A]">Late Arrival Warnings</p>
                <p className="text-[11px] text-[#6B6B6B]">Notify supervisors if an employee clocks in after the grace period</p>
              </div>
              <input
                type="checkbox"
                checked={formData.notifyOnLateArrival ?? false}
                onChange={(e) => setFormData({ ...formData, notifyOnLateArrival: e.target.checked })}
                className="w-4 h-4 accent-[#f97316] rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: AI & Copilot Policy ── */}
      {activeTab === 'ai' && (
        <div className="bg-white rounded-2xl border border-[#ECE0D6] p-6 shadow-2xs space-y-5">
          <div className="border-b border-[#ECE0D6] pb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-[#1A1A1A]">Nebula AI Copilot Engine</h3>
              </div>
              <p className="text-xs text-[#6B6B6B]">Configure generative intelligence models for HR anomaly detection and planning</p>
            </div>
            <span className="text-xs font-mono text-[#f97316] bg-[#fff7ed] border border-[#fed7aa] px-2.5 py-1 rounded-lg">
              v2.0 Model
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
              <div>
                <p className="text-xs font-semibold text-[#1A1A1A]">HR Command Center AI Insights</p>
                <p className="text-[11px] text-[#6B6B6B]">Enable daily shift attendance predictions and staffing anomaly suggestions</p>
              </div>
              <input
                type="checkbox"
                checked={formData.aiCopilotEnabled ?? true}
                onChange={(e) => setFormData({ ...formData, aiCopilotEnabled: e.target.checked })}
                className="w-4 h-4 accent-[#f97316] rounded"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
              <div>
                <p className="text-xs font-semibold text-[#1A1A1A]">Smart Resume & Document Screening</p>
                <p className="text-[11px] text-[#6B6B6B]">Automatically index employee certificates and contracts for expiry and validity</p>
              </div>
              <input
                type="checkbox"
                checked={formData.aiAutomatedScreening ?? false}
                onChange={(e) => setFormData({ ...formData, aiAutomatedScreening: e.target.checked })}
                className="w-4 h-4 accent-[#f97316] rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
