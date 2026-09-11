import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  UserPlus,
  Users,
  ShieldCheck,
  KeyRound,
  Mail,
  User as UserIcon,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/apiClient';
import { ROLE_LABELS, ROLE_COLORS, type Role, type User } from '../types/user';

interface CreatedUserItem {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status: string;
  createdAt: string;
}

// Generate a secure random password
function generateSecurePassword(): string {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
  let pwd = '';
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

export const AccountCreatorPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Determine allowed roles to provision based on current user's role
  const isSuperAdminOrAdmin = user?.role === 'super_admin' || user?.role === 'admin';
  const isHR = user?.role === 'hr';

  const allowedRoles: Role[] = isSuperAdminOrAdmin
    ? [
        'admin',
        'manager',
        'hr',
        'recruiter',
        'sales',
        'finance',
        'inventory_manager',
        'employee',
        'intern',
      ]
    : isHR
    ? ['employee', 'intern', 'recruiter']
    : [];

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>(allowedRoles[0] || 'employee');
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Query: Fetch all accounts in the organization
  const {
    data: accountsData,
    isLoading: isAccountsLoading,
    refetch: refetchAccounts,
  } = useQuery<{ users: CreatedUserItem[] }>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get<{ users: CreatedUserItem[] }>('/users');
      return res.data;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Mutation: Create user account
  const createMutation = useMutation({
    mutationFn: async (payload: {
      fullName: string;
      email: string;
      password: string;
      role: Role;
    }) => {
      const res = await apiClient.post('/users', payload);
      return res.data;
    },
    onSuccess: (data: any) => {
      const roleName = ROLE_LABELS[selectedRole] || selectedRole;
      toast.success(`Account for "${fullName}" (${roleName}) created successfully.`);
      
      // Invalidate both users list and permissions matrix so new roles appear immediately
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['permissions', 'matrix'] });

      // Reset form fields
      setFullName('');
      setEmail('');
      setPassword('');
      setSelectedRole(allowedRoles[0] || 'employee');
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to create account. Please check your inputs.';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Please enter the account full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    createMutation.mutate({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: selectedRole,
    });
  };

  const handleGeneratePassword = () => {
    const generated = generateSecurePassword();
    setPassword(generated);
    setShowPassword(true);
    toast.info('Generated a secure temporary password.');
  };

  // Filter accounts by search query
  const filteredAccounts = (accountsData?.users || []).filter((acc) => {
    const q = searchTerm.toLowerCase();
    return (
      acc.fullName.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q) ||
      (ROLE_LABELS[acc.role] || acc.role).toLowerCase().includes(q)
    );
  });

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto space-y-8">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800/80 pb-6"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
              <UserPlus className="w-3.5 h-3.5" />
              Account Provisioning Hub
            </span>

            {isSuperAdminOrAdmin ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
                <ShieldCheck className="w-3 h-3" />
                Super Admin Mode (All Roles)
              </span>
            ) : isHR ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                <Users className="w-3 h-3" />
                HR Mode (Employee, Intern & Recruiter)
              </span>
            ) : null}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Account Creator
          </h1>

          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {isSuperAdminOrAdmin
              ? 'Provision new user accounts for any department role. Roles created here immediately become configurable in your Permissions matrix.'
              : 'Provision team accounts for roles under Human Resources (Employees, Interns, Recruiters).'}
          </p>
        </div>

        {/* Permissions Quick Link for Super Admin */}
        {user?.role === 'super_admin' && (
          <Link
            to="/dashboard/permissions"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-all shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-[#f0512f]" />
            Manage Permissions Matrix
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </Link>
        )}
      </motion.div>

      {/* ── Main Content Grid: Form (Left) & Accounts Roster (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Column: Provisioning Form (5 cols on lg) ── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-5 bg-gradient-to-b from-slate-900/90 to-slate-950/80 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl backdrop-blur-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/80">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Create New Account</h2>
              <p className="text-xs text-slate-400">Enter user details and assign an organizational role.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="alex.morgan@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Select Role <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {allowedRoles.length} {allowedRoles.length === 1 ? 'role option' : 'role options'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allowedRoles.map((roleKey) => {
                  const isSelected = selectedRole === roleKey;
                  const label = ROLE_LABELS[roleKey] || roleKey;
                  const colorClass = ROLE_COLORS[roleKey] || 'text-slate-300 bg-slate-800 border-slate-700';

                  return (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => setSelectedRole(roleKey)}
                      className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_12px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500'
                          : 'border-slate-800/80 bg-slate-950/40 hover:bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border mb-1 ${colorClass}`}>
                        {label}
                      </span>
                      <span className="text-[11px] text-slate-400 capitalize truncate w-full">
                        {roleKey.replace('_', ' ')}
                      </span>
                    </button>
                  );
                })}
              </div>

              {isHR && (
                <p className="text-[11px] text-slate-500 mt-2 italic">
                  * As HR, you are authorized to provision Employee, Intern, and Recruiter accounts.
                </p>
              )}
            </div>

            {/* Password Field & Generator */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Initial Password <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  Auto-generate
                </button>
              </div>

              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                The user can use this password to sign in to their dashboard.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {createMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Provisioning Account...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Create {ROLE_LABELS[selectedRole]} Account
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* ── Right Column: Existing Accounts Roster (7 cols on lg) ── */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-7 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xl"
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-semibold text-white">Organization Accounts Roster</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Active user accounts registered in your workspace.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                Total: {accountsData?.users?.length ?? 0}
              </span>
            </div>
          </div>

          {/* Search filter */}
          <div className="my-4">
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Accounts List */}
          {isAccountsLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading organization accounts...</p>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="py-14 text-center border border-dashed border-slate-800 rounded-xl my-4">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-300">No accounts found</p>
              <p className="text-[11px] text-slate-500 mt-1">
                {searchTerm
                  ? `No accounts matched "${searchTerm}". Try a different filter.`
                  : 'No team members added yet. Use the form to create your first account!'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60 max-h-[520px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent pr-1">
              {filteredAccounts.map((acc) => {
                const label = ROLE_LABELS[acc.role] || acc.role;
                const colorClass = ROLE_COLORS[acc.role] || 'text-slate-300 bg-slate-800 border-slate-700';
                const initials = acc.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <div
                    key={acc.id}
                    className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-900/40 px-3 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-xs font-semibold text-slate-300 flex-shrink-0">
                        {initials || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{acc.fullName}</p>
                        <p className="text-[11px] text-slate-400 truncate">{acc.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${colorClass}`}>
                        {label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono hidden sm:inline-block">
                        {new Date(acc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Info callout */}
          <div className="mt-5 p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/15 flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Whenever an account with a new role is provisioned, that role is automatically enabled in the{' '}
              <span className="text-indigo-300 font-medium">Manage Permissions matrix</span> for Super Admin customization.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AccountCreatorPage;
