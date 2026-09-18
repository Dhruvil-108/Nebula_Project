import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Shield,
  Building2,
  Clock,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Coffee,
  LogOut as CheckOut,
  Sparkles,
  Timer,
  TrendingUp,
  Briefcase,
  Globe,
  Info,
  ChevronRight,
  Pencil,
  X,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/apiClient';
import { ROLE_LABELS, ROLE_COLORS, type Role } from '../types/user';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ProfileAvatar } from '../components/profile/ProfileAvatar';
import { getMyProfile, updateProfile, deleteProfile } from '../lib/profileApi';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface LeaveBalance {
  type: string;
  remaining: number;
  used: number;
  total: number;
}

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  createdAt: string;
}

interface ProfileData {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: Role;
    status: string;
    joinedAt: string;
    lastLoginAt: string | null;
  };
  organization: {
    id: string;
    name: string;
    timezone: string;
    shiftStartTime: string;
    industry: string | null;
    companySize: string | null;
  };
  attendance: {
    todayStatus: 'checked_in' | 'checked_out' | 'on_break' | 'not_checked_in';
    todayCheckIn: string | null;
    todayCheckOut: string | null;
    todayWorkedMinutes: number;
    todayIsLate: boolean;
    daysPresent: number;
    workedHoursThisMonth: number;
    lateArrivalsThisMonth: number;
    allTimeDaysPresent: number;
  };
  leaves: {
    totalRemainingLeaves: number;
    totalUsedLeaves: number;
    pendingCount: number;
    balances: LeaveBalance[];
    recentRequests: LeaveRequest[];
  };
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

const formatTime = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDuration = (minutes: number): string => {
  if (minutes === 0) return '0h 0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

const STATUS_CONFIG = {
  checked_in: {
    label: 'Checked In',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-300',
    dot: 'bg-emerald-400',
    Icon: CheckCircle2,
  },
  on_break: {
    label: 'On Break',
    color: 'text-amber-800',
    bg: 'bg-amber-50 border-amber-300',
    dot: 'bg-amber-400',
    Icon: Coffee,
  },
  checked_out: {
    label: 'Checked Out',
    color: 'text-slate-700',
    bg: 'bg-slate-100 border-slate-300',
    dot: 'bg-slate-500',
    Icon: CheckOut,
  },
  not_checked_in: {
    label: 'Not Checked In',
    color: 'text-slate-700',
    bg: 'bg-slate-100 border-slate-300',
    dot: 'bg-slate-500',
    Icon: AlertCircle,
  },
};

const LEAVE_STATUS_COLORS: Record<string, string> = {
  pending: 'text-amber-800 bg-amber-50 border-amber-300',
  approved: 'text-emerald-700 bg-emerald-50 border-emerald-300',
  rejected: 'text-rose-700 bg-rose-50 border-rose-300',
};

// ─────────────────────────────────────────────────────────
// Role-specific hero description
// ─────────────────────────────────────────────────────────

const ROLE_HERO: Record<Role, { headline: string; sub: string; accentColor: string }> = {
  super_admin: {
    headline: 'Super Administrator',
    sub: 'Full system access — managing the entire workspace, accounts, and permissions.',
    accentColor: '#c2540c',
  },
  admin: {
    headline: 'Administrator',
    sub: 'Oversees daily operations, account provisioning, and organizational governance.',
    accentColor: '#c2540c',
  },
  manager: {
    headline: 'Team Manager',
    sub: 'Leads the team, tracks performance, and coordinates daily workflow execution.',
    accentColor: '#c2540c',
  },
  hr: {
    headline: 'Human Resources',
    sub: 'Manages employee lifecycle, leaves, onboarding, and team welfare programs.',
    accentColor: '#c2540c',
  },
  recruiter: {
    headline: 'Talent Recruiter',
    sub: 'Sources, screens, and onboards talent to build high-performing teams.',
    accentColor: '#c2540c',
  },
  sales: {
    headline: 'Sales Executive',
    sub: 'Drives revenue growth by managing customer relationships and deal pipelines.',
    accentColor: '#c2540c',
  },
  finance: {
    headline: 'Finance Specialist',
    sub: 'Manages budgets, expense approvals, payroll, and financial reporting.',
    accentColor: '#c2540c',
  },
  inventory_manager: {
    headline: 'Inventory Manager',
    sub: 'Tracks stock levels, manages supply chains, and ensures operational continuity.',
    accentColor: '#c2540c',
  },
  employee: {
    headline: 'Team Member',
    sub: "Contributing to the organization's success through skilled daily work.",
    accentColor: '#c2540c',
  },
  intern: {
    headline: 'Intern',
    sub: 'Gaining valuable real-world experience and growing within the organization.',
    accentColor: '#c2540c',
  },
};

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  colorClass?: string;
  index?: number;
}> = ({ icon, label, value, sub, colorClass = 'text-indigo-400', index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.07, duration: 0.35 }}
    className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-3 hover:border-slate-700/60 transition-colors"
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-current/10 ${colorClass} bg-opacity-10`}
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      <span className={colorClass}>{icon}</span>
    </div>
    <div>
      <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1.5">{sub}</p>}
    </div>
  </motion.div>
);

const SectionHeader: React.FC<{ title: string; sub?: string }> = ({ title, sub }) => (
  <div className="mb-4">
    <h3 className="text-base font-semibold text-white">{title}</h3>
    {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
  </div>
);

// ─────────────────────────────────────────────────────────
// ProfileSkeleton
// ─────────────────────────────────────────────────────────

const ProfileSkeleton: React.FC = () => (
  <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
    <div className="h-48 bg-slate-900 rounded-3xl" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-slate-900 rounded-2xl" />
      ))}
    </div>
    <div className="h-64 bg-slate-900 rounded-2xl" />
  </div>
);

// ─────────────────────────────────────────────────────────
// Main ProfilePage
// ─────────────────────────────────────────────────────────

export const ProfilePage: React.FC = () => {
  const { data: profile, isLoading, isError } = useQuery<ProfileData>({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      const res = await apiClient.get<ProfileData>('/users/me/profile');
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
  });

  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(() => ({
    fullName: profile?.user?.fullName || '',
    email: profile?.user?.email || '',
  }));

  // Sync form with latest profile when opening modal
  React.useEffect(() => {
    if (editOpen && profile) {
      setEditForm({ fullName: profile.user.fullName, email: profile.user.email });
    }
  }, [editOpen, profile]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      setEditOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfile,
    onSuccess: () => {
      // Could trigger logout or redirect
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ user: editForm });
  };

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 gap-4">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <p className="text-sm font-medium">Could not load profile. Please try again.</p>
        <Link to="/dashboard" className="text-xs text-indigo-400 hover:text-indigo-300 underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const role = profile.user.role;
  const hero = ROLE_HERO[role] || ROLE_HERO.employee;
  const statusCfg = STATUS_CONFIG[profile.attendance.todayStatus] || STATUS_CONFIG.not_checked_in;
  const StatusIcon = statusCfg.Icon;

  const isManagement = ['super_admin', 'admin', 'manager', 'hr'].includes(role);
  const showLeaves = !['super_admin'].includes(role);
  const daysWorked = profile.attendance.daysPresent;
  const monthlyHours = profile.attendance.workedHoursThisMonth;

  return (
    <div className="profile-page p-6 md:p-8 max-w-5xl mx-auto space-y-8">

      {/* ── Hero Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="post-login-profile-hero relative overflow-hidden rounded-3xl border border-slate-800/80"
        style={{
          background: `radial-gradient(ellipse at top left, ${hero.accentColor}18 0%, transparent 60%), #0b0f17`,
        }}
      >
        {/* Decorative glow blob */}
        <div
          className="absolute -top-16 -left-16 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: hero.accentColor }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6 p-7 md:p-8">
          {/* Avatar — hover to upload/remove your photo */}
          <ProfileAvatar
            fullName={profile.user.fullName}
            sizeClass="w-20 h-20 md:w-24 md:h-24"
            textClass="text-2xl md:text-3xl"
            accentColor={hero.accentColor}
            editable
          />

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ROLE_COLORS[role]}`}
              >
                <Sparkles className="w-3 h-3" />
                {ROLE_LABELS[role]}
              </span>
              <span className={`profile-status-pill inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusCfg.bg} ${statusCfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} animate-pulse`} />
                {statusCfg.label}
              </span>
              {profile.attendance.todayIsLate && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border text-amber-400 bg-amber-500/10 border-amber-500/20">
                  <Timer className="w-3 h-3" />
                  Late Arrival
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight truncate">
              {profile.user.fullName}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5 mb-3">{hero.sub}</p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-600" />
                {profile.user.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-600" />
                {profile.organization.name}
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-600" />
                {profile.organization.timezone}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                Joined {formatDate(profile.user.joinedAt)}
              </span>
            </div>
          </div>

          {/* Today's time block */}
          <div className="profile-time-card flex-shrink-0 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 min-w-[160px] text-center">
            <div className={`flex items-center justify-center gap-1.5 mb-3 ${statusCfg.color}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="text-xs font-semibold">{statusCfg.label}</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Check-in</span>
                <span className="text-slate-300 font-mono font-medium">{formatTime(profile.attendance.todayCheckIn)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Check-out</span>
                <span className="text-slate-300 font-mono font-medium">{formatTime(profile.attendance.todayCheckOut)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1.5 border-t border-slate-800/60">
                <span className="text-slate-500">Today</span>
                <span className="text-white font-mono font-bold">{formatDuration(profile.attendance.todayWorkedMinutes)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          index={0}
          icon={<CalendarCheck className="w-5 h-5" />}
          label="Days Present"
          value={daysWorked}
          sub="This month"
          colorClass="text-emerald-400"
        />
        <StatCard
          index={1}
          icon={<Clock className="w-5 h-5" />}
          label="Hours Worked"
          value={`${monthlyHours}h`}
          sub="This month"
          colorClass="text-sky-400"
        />
        {showLeaves ? (
          <>
            <StatCard
              index={2}
              icon={<Calendar className="w-5 h-5" />}
              label="Leave Balance"
              value={profile.leaves.totalRemainingLeaves}
              sub={`${profile.leaves.totalUsedLeaves} used this year`}
              colorClass="text-indigo-400"
            />
            <StatCard
              index={3}
              icon={<CalendarClock className="w-5 h-5" />}
              label="Pending Leaves"
              value={profile.leaves.pendingCount}
              sub={profile.leaves.pendingCount > 0 ? 'Awaiting approval' : 'All up to date'}
              colorClass="text-amber-400"
            />
          </>
        ) : (
          <>
            <StatCard
              index={2}
              icon={<TrendingUp className="w-5 h-5" />}
              label="All-time Days"
              value={profile.attendance.allTimeDaysPresent}
              sub="Total attendance logged"
              colorClass="text-violet-400"
            />
            <StatCard
              index={3}
              icon={<Timer className="w-5 h-5" />}
              label="Late Arrivals"
              value={profile.attendance.lateArrivalsThisMonth}
              sub="This month"
              colorClass="text-rose-400"
            />
          </>
        )}
      </div>

      {/* ── Two-column section: Account Info + Leave Balances / Role Info ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Account Information */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <SectionHeader title="Account Information" sub="Your profile & workspace details" />
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Button>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Full Name', value: profile.user.fullName, Icon: User },
              { label: 'Email Address', value: profile.user.email, Icon: Mail },
              { label: 'Role', value: ROLE_LABELS[role], Icon: Shield },
              { label: 'Account Status', value: profile.user.status.charAt(0).toUpperCase() + profile.user.status.slice(1), Icon: CheckCircle2 },
              { label: 'Organization', value: profile.organization.name, Icon: Building2 },
              { label: 'Shift Start', value: profile.organization.shiftStartTime, Icon: Clock },
              { label: 'Joined', value: formatDate(profile.user.joinedAt), Icon: Calendar },
              ...(profile.user.lastLoginAt
                ? [{ label: 'Last Login', value: formatDate(profile.user.lastLoginAt), Icon: Info }]
                : []),
            ].map(({ label, value, Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                  <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
                  <span className="text-sm text-slate-200 font-medium text-right truncate">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Leave Balances OR Role-specific info */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col"
        >
          {showLeaves ? (
            <>
              <SectionHeader title="Leave Balances" sub={`${new Date().getFullYear()} entitlements`} />
              {profile.leaves.balances.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
                  <Calendar className="w-8 h-8 opacity-40" />
                  <p className="text-sm">No leave balances configured yet.</p>
                </div>
              ) : (
                <div className="space-y-3 flex-1">
                  {profile.leaves.balances.map((bal, i) => {
                    const pct = bal.total > 0 ? Math.round((bal.remaining / bal.total) * 100) : 0;
                    return (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium">{bal.type}</span>
                          <span className="text-slate-400 font-mono">{bal.remaining} / {bal.total} days</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{
                              background: pct > 60 ? '#10b981' : pct > 30 ? '#f59e0b' : '#f43f5e',
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-600">
                          <span>{bal.used} used</span>
                          <span>{pct}% remaining</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <SectionHeader title="Role Overview" sub="Your access level and responsibilities" />
              <div className="flex-1 flex flex-col justify-center gap-5">
                <div
                  className="rounded-xl p-5 border"
                  style={{
                    background: `${hero.accentColor}0a`,
                    borderColor: `${hero.accentColor}30`,
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${hero.accentColor}25` }}
                    >
                      <Briefcase className="w-5 h-5" style={{ color: hero.accentColor }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{hero.headline}</p>
                      <p className={`text-[10px] font-semibold ${ROLE_COLORS[role]}`}>{ROLE_LABELS[role]}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{hero.sub}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/40 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-white">{profile.attendance.allTimeDaysPresent}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Total Days Present</p>
                  </div>
                  <div className="bg-slate-800/40 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-white">{profile.attendance.lateArrivalsThisMonth}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Late Arrivals (Month)</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* ── Recent Leave Requests (for non-super_admin) ── */}
      {showLeaves && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6"
        >
          <SectionHeader title="Recent Leave Requests" sub="Your last 5 submitted requests" />
          {profile.leaves.recentRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-500 gap-2">
              <CalendarClock className="w-9 h-9 opacity-30" />
              <p className="text-sm">No leave requests found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {profile.leaves.recentRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-800/30 border border-slate-800/60 hover:border-slate-700/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{req.type}</p>
                      <p className="text-xs text-slate-500">
                        {formatDate(req.startDate)} → {formatDate(req.endDate)} · {req.days} {req.days === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-xs text-slate-500 hidden sm:block truncate max-w-[160px]">{req.reason}</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${LEAVE_STATUS_COLORS[req.status]}`}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Management quick links (super_admin, admin, hr) ── */}
      {isManagement && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6"
        >
          <SectionHeader title="Quick Actions" sub="Shortcuts based on your role" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              ...(role === 'super_admin' || role === 'admin' || role === 'hr'
                ? [{ label: 'Create Account', sub: 'Provision a new team member', to: '/dashboard/accounts', color: '#6366f1' }]
                : []),
              ...(role === 'super_admin'
                ? [{ label: 'Permissions Matrix', sub: 'Configure role-based access', to: '/dashboard/permissions', color: '#f0512f' }]
                : []),
              { label: 'Dashboard', sub: 'Return to operations overview', to: '/dashboard', color: '#10b981' },
              { label: 'HRMS', sub: 'Attendance & leave management', to: '/dashboard/hrms', color: '#f59e0b' },
            ].map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-800/60 hover:border-slate-700/60 bg-slate-800/20 hover:bg-slate-800/50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${action.color}20` }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: action.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{action.label}</p>
                    <p className="text-xs text-slate-500">{action.sub}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Edit Profile Modal */}
      {editOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setEditOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Edit Profile</h2>
              <button
                onClick={() => setEditOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full"
                  placeholder="Email"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
            <div className="mt-6 border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-600 mb-2">Danger Zone</p>
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Profile'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default ProfilePage;
