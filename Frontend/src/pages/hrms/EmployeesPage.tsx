import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import {
  Users,
  Search,
  RefreshCw,
  Trash2,
  Loader2,
  Network,
  Mail,
  Phone,
  Briefcase,
  CalendarDays,
  X,
  Building2,
  FileText,
  BadgeCheck,
  Clock,
  TrendingUp,
  MapPin,
  CreditCard,
  GraduationCap,
  History,
  ShieldCheck,
  Landmark,
  ArrowRight,
} from 'lucide-react';
import {
  useEmployees,
  useCreateEmployee,
  useDeleteEmployee,
  useDepartments,
  useEmployee,
  useBranches,
  useDesignations,
  useEmployeeJobHistory,
  usePromoteTransfer,
} from '../../hooks/useHrms';
import { Drawer } from '../../components/crm/Drawer';
import { ActivityTimeline } from '../../components/crm/ActivityTimeline';
import { InfoTile } from '../../components/hrms/InfoTile';
import { EmployeeStatusPill, AttendanceStatusPill } from '../../components/hrms/HrmsStatusPill';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import type { Employee, EmploymentType, EmployeeStatus, TransitionType, GradeLevel } from '../../types/hrms';
import { FloatingDropdown } from '../../components/ui/FloatingDropdown';
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYEE_STATUSES,
  EMPLOYEE_STATUS_LABELS,
  GRADE_LEVELS,
  TRANSITION_TYPES,
  TRANSITION_TYPE_LABELS,
} from '../../types/hrms';

const initialForm = {
  employeeCode: '',
  fullName: '',
  email: '',
  phone: '',
  departmentId: '',
  branchId: '',
  designation: '',
  designationId: '',
  grade: 'L2' as GradeLevel,
  joiningDate: '',
  managerId: '',
  employmentType: 'full_time' as EmploymentType,
  status: 'active' as EmployeeStatus,
  skills: '',
};

export const EmployeesPage: React.FC = () => {
  const { can } = useModuleAccess('hrms');
  const canCreate = can('create');
  const canEdit = can('edit');
  const canDelete = can('delete');

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // 6 Dossier Tabs
  const [drawerTab, setDrawerTab] = useState<
    'overview' | 'personal_statutory' | 'bank' | 'timeline' | 'education_work' | 'attendance_docs'
  >('overview');

  const [form, setForm] = useState(initialForm);

  // Transition / Promotion modal state
  const [transitionEmployee, setTransitionEmployee] = useState<Employee | null>(null);
  const [transitionForm, setTransitionForm] = useState({
    transitionType: 'promotion' as TransitionType,
    effectiveDate: new Date().toISOString().split('T')[0],
    newDepartmentId: '',
    newDesignation: '',
    newGrade: 'L3' as GradeLevel,
    newManagerId: '',
    newSalary: '',
    reason: '',
  });

  const { data: employees, isLoading, isError, refetch } = useEmployees({
    search: search || undefined,
    department: departmentFilter || undefined,
    status: statusFilter || undefined,
    employmentType: typeFilter || undefined,
  });

  const { data: departments } = useDepartments();
  const { data: branches } = useBranches();
  const { data: designations } = useDesignations();

  // Manager options = existing employees
  const { data: managerOptions } = useQuery<Employee[]>({
    queryKey: ['hrms', 'employees', 'options'],
    queryFn: () => apiClient.get<Employee[]>('/hr/employees').then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: employeeDetail, isLoading: detailLoading } = useEmployee(selectedEmployeeId);
  const { data: jobHistory, isLoading: historyLoading } = useEmployeeJobHistory(selectedEmployeeId);

  const createMutation = useCreateEmployee();
  const deleteMutation = useDeleteEmployee();
  const promoteTransferMutation = usePromoteTransfer();

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeCode.trim() || !form.fullName.trim()) return;

    createMutation.mutate(
      {
        employeeCode: form.employeeCode,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        departmentId: form.departmentId || null,
        branchId: form.branchId || null,
        designation: form.designation,
        designationId: form.designationId || null,
        grade: form.grade,
        joiningDate: form.joiningDate || null,
        managerId: form.managerId || null,
        employmentType: form.employmentType,
        status: form.status,
        skills: form.skills ? form.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setForm(initialForm);
        },
      }
    );
  };

  const handleOpenTransition = (emp: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    setTransitionEmployee(emp);
    setTransitionForm({
      transitionType: 'promotion',
      effectiveDate: new Date().toISOString().split('T')[0],
      newDepartmentId: emp.departmentId?._id || '',
      newDesignation: emp.designation || '',
      newGrade: (emp.grade as GradeLevel) || 'L3',
      newManagerId: emp.managerId?._id || '',
      newSalary: '',
      reason: '',
    });
  };

  const handleTransitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transitionEmployee) return;

    promoteTransferMutation.mutate(
      {
        id: transitionEmployee._id,
        payload: {
          transitionType: transitionForm.transitionType,
          effectiveDate: transitionForm.effectiveDate,
          newDepartmentId: transitionForm.newDepartmentId || null,
          newDesignation: transitionForm.newDesignation || undefined,
          newGrade: transitionForm.newGrade,
          newManagerId: transitionForm.newManagerId || null,
          newSalary: transitionForm.newSalary ? Number(transitionForm.newSalary) : undefined,
          reason: transitionForm.reason,
        },
      },
      {
        onSuccess: () => {
          setTransitionEmployee(null);
        },
      }
    );
  };

  const inputCls =
    'w-full rounded-lg border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all';

  const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="hrms-submodule-page p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Employees Directory</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa]">
              360° Dossier Active
            </span>
          </div>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {isLoading
              ? 'Loading employee profiles...'
              : isError
                ? 'Unable to load employee roster'
                : `${employees?.length ?? 0} active profile${(employees?.length ?? 0) === 1 ? '' : 's'} across all branches & departments`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors cursor-pointer"
            title="Refresh directory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/dashboard/hrms/org-chart"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#FBF8F4] text-[#1A1A1A] border border-[#ECE0D6] shadow-2xs transition-colors cursor-pointer"
          >
            <Network className="w-4 h-4 text-[#f97316]" />
            Org Chart
          </Link>
          {canCreate && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4" />
              Add Employee
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Filter bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#9B9B9B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, code, email, role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <FloatingDropdown
          value={departmentFilter}
          onChange={(val) => setDepartmentFilter(val)}
          options={[
            { value: '', label: 'All departments' },
            ...(departments || []).map((d) => ({
              value: d._id,
              label: d.name,
            })),
          ]}
          fullWidth={false}
          className="sm:w-44"
        />
        <FloatingDropdown
          value={branchFilter}
          onChange={(val) => setBranchFilter(val)}
          options={[
            { value: '', label: 'All branches' },
            ...(branches || []).map((b) => ({
              value: b._id,
              label: `${b.name} (${b.code})`,
            })),
          ]}
          fullWidth={false}
          className="sm:w-44"
        />
        <FloatingDropdown
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
          options={[
            { value: '', label: 'All statuses' },
            ...EMPLOYEE_STATUSES.map((s) => ({
              value: s,
              label: EMPLOYEE_STATUS_LABELS[s],
            })),
          ]}
          fullWidth={false}
          className="sm:w-36"
        />
        <FloatingDropdown
          value={typeFilter}
          onChange={(val) => setTypeFilter(val)}
          options={[
            { value: '', label: 'All types' },
            ...EMPLOYMENT_TYPES.map((t) => ({
              value: t,
              label: EMPLOYMENT_TYPE_LABELS[t],
            })),
          ]}
          fullWidth={false}
          className="sm:w-36"
        />
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3 font-semibold">Code</th>
                <th className="px-5 py-3 font-semibold">Employee</th>
                <th className="px-5 py-3 font-semibold">Dept & Branch</th>
                <th className="px-5 py-3 font-semibold">Designation & Grade</th>
                <th className="px-5 py-3 font-semibold">Reporting To</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-5 py-4">
                      <div className="h-5 rounded bg-[#fff7ed] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center">
                    <p className="text-sm font-medium text-[#1A1A1A]">Employees could not be loaded</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">Check your connection and try again.</p>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#f97316] border border-[#ECE0D6] hover:bg-[#fff7ed]"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry
                    </button>
                  </td>
                </tr>
              ) : (employees || []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center">
                    <Users className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#1A1A1A]">No employees found</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">
                      {search || departmentFilter || branchFilter || statusFilter || typeFilter
                        ? 'Try adjusting your filters.'
                        : 'Add your first employee to build your enterprise directory.'}
                    </p>
                  </td>
                </tr>
              ) : (
                (employees || []).map((emp, idx) => (
                  <motion.tr
                    key={emp._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.3), duration: 0.25 }}
                    className="hover:bg-[#FBF8F4] cursor-pointer transition-colors"
                    onClick={() => setSelectedEmployeeId(emp._id)}
                  >
                    <td className="px-5 py-3.5 text-xs font-mono font-semibold text-[#f97316]">{emp.employeeCode}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-[#1A1A1A]">{emp.fullName}</div>
                      {emp.email && <div className="text-xs text-[#6B6B6B]">{emp.email}</div>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-medium text-[#1A1A1A]">{emp.departmentId?.name || 'General'}</div>
                      <div className="text-[11px] text-[#6B6B6B] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#f97316]" />
                        {emp.branchId?.name || 'Headquarters'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-medium text-[#1A1A1A]">{emp.designation || 'Staff'}</div>
                      <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa]">
                        {emp.grade || 'L2'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#6B6B6B]">{emp.managerId?.fullName || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-[#6B6B6B] font-mono">{fmtDate(emp.joiningDate)}</td>
                    <td className="px-5 py-3.5">
                      <EmployeeStatusPill status={emp.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenTransition(emp, e)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#ea580c] bg-[#fff7ed] hover:bg-[#ffedd5] border border-[#fed7aa] transition-colors cursor-pointer"
                            title="Promote or Transfer Employee"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Transition</span>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => deleteMutation.mutate(emp._id)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Delete employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create Employee Modal ── */}
      <AnimatePresence>
        {canCreate && showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setShowCreate(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-2xl rounded-2xl bg-white border border-[#ECE0D6] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECE0D6]">
                <div>
                  <h3 className="text-base font-semibold text-[#1A1A1A]">Add New Employee</h3>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">Create primary dossier identity for your organization</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="p-1.5 rounded-lg text-[#6B6B6B] hover:bg-[#fff7ed] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                      Employee Code <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      required
                      value={form.employeeCode}
                      onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                      className={inputCls}
                      placeholder="e.g. EMP-001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                      Full Name <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      required
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className={inputCls}
                      placeholder="e.g. Sarah Chen"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Work Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={inputCls}
                      placeholder="sarah@nebula.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Contact Phone</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className={inputCls}
                      placeholder="+1 555 019 2831"
                    />
                  </div>

                  <div>
                    <FloatingDropdown
                      label="Department"
                      value={form.departmentId}
                      onChange={(val) => setForm({ ...form, departmentId: val })}
                      options={[
                        { value: '', label: 'Select Department...' },
                        ...(departments || []).map((d) => ({
                          value: d._id,
                          label: d.name,
                        })),
                      ]}
                      searchable={true}
                    />
                  </div>

                  <div>
                    <FloatingDropdown
                      label="Branch / Office Site"
                      value={form.branchId}
                      onChange={(val) => setForm({ ...form, branchId: val })}
                      options={[
                        { value: '', label: 'Select Branch...' },
                        ...(branches || []).map((b) => ({
                          value: b._id,
                          label: `${b.name} (${b.city || b.code})`,
                        })),
                      ]}
                      searchable={true}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Designation Title</label>
                    <input
                      value={form.designation}
                      onChange={(e) => setForm({ ...form, designation: e.target.value })}
                      className={inputCls}
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </div>

                  <div>
                    <FloatingDropdown
                      label="Job Grade Level"
                      value={form.grade}
                      onChange={(val) => setForm({ ...form, grade: val as GradeLevel })}
                      options={GRADE_LEVELS.map((g) => ({
                        value: g,
                        label: `${g} Level`,
                      }))}
                    />
                  </div>

                  <div>
                    <FloatingDropdown
                      label="Reporting Manager"
                      value={form.managerId}
                      onChange={(val) => setForm({ ...form, managerId: val })}
                      options={[
                        { value: '', label: 'No Manager (Root Node)' },
                        ...(managerOptions || []).map((m) => ({
                          value: m._id,
                          label: `${m.fullName} (${m.employeeCode})`,
                        })),
                      ]}
                      searchable={true}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Date of Joining</label>
                    <input
                      type="date"
                      value={form.joiningDate}
                      onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <FloatingDropdown
                      label="Employment Type"
                      value={form.employmentType}
                      onChange={(val) => setForm({ ...form, employmentType: val as EmploymentType })}
                      options={EMPLOYMENT_TYPES.map((t) => ({
                        value: t,
                        label: EMPLOYMENT_TYPE_LABELS[t],
                      }))}
                    />
                  </div>

                  <div>
                    <FloatingDropdown
                      label="Account Status"
                      value={form.status}
                      onChange={(val) => setForm({ ...form, status: val as EmployeeStatus })}
                      options={EMPLOYEE_STATUSES.map((s) => ({
                        value: s,
                        label: EMPLOYEE_STATUS_LABELS[s],
                      }))}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                      Skills & Tech Stack (comma separated)
                    </label>
                    <input
                      value={form.skills}
                      onChange={(e) => setForm({ ...form, skills: e.target.value })}
                      className={inputCls}
                      placeholder="React, Node.js, MongoDB, Architecture, TypeScript"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#ECE0D6]">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#ECE0D6] hover:bg-[#fff7ed] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || !form.employeeCode.trim() || !form.fullName.trim()}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Create Employee Dossier
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Promote / Transfer Modal ── */}
      <AnimatePresence>
        {transitionEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setTransitionEmployee(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-lg rounded-2xl bg-white border border-[#ECE0D6] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4]">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#f97316]" />
                    <h3 className="text-base font-bold text-[#1A1A1A]">Career Transition & Lifecycle</h3>
                  </div>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    {transitionEmployee.fullName} ({transitionEmployee.employeeCode})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTransitionEmployee(null)}
                  className="p-1.5 rounded-lg text-[#6B6B6B] hover:bg-[#fff7ed] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleTransitionSubmit} className="p-6 space-y-4">
                <div className="p-3 rounded-xl bg-[#fff7ed] border border-[#fed7aa] text-xs text-[#ea580c] space-y-1">
                  <p className="font-semibold">Current Position:</p>
                  <p>
                    {transitionEmployee.designation || 'Staff'} ({transitionEmployee.grade || 'L2'}) ·{' '}
                    {transitionEmployee.departmentId?.name || 'General'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FloatingDropdown
                      label="Transition Type"
                      value={transitionForm.transitionType}
                      onChange={(val) => setTransitionForm({ ...transitionForm, transitionType: val as TransitionType })}
                      options={TRANSITION_TYPES.map((t) => ({
                        value: t,
                        label: TRANSITION_TYPE_LABELS[t],
                      }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Effective Date</label>
                    <input
                      type="date"
                      required
                      value={transitionForm.effectiveDate}
                      onChange={(e) => setTransitionForm({ ...transitionForm, effectiveDate: e.target.value })}
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">New Designation Title</label>
                    <input
                      value={transitionForm.newDesignation}
                      onChange={(e) => setTransitionForm({ ...transitionForm, newDesignation: e.target.value })}
                      className={inputCls}
                      placeholder="e.g. Lead Architect"
                    />
                  </div>

                  <div>
                    <FloatingDropdown
                      label="New Grade Level"
                      value={transitionForm.newGrade}
                      onChange={(val) => setTransitionForm({ ...transitionForm, newGrade: val as GradeLevel })}
                      options={GRADE_LEVELS.map((g) => ({
                        value: g,
                        label: `${g} Level`,
                      }))}
                    />
                  </div>

                  <div>
                    <FloatingDropdown
                      label="New Department"
                      value={transitionForm.newDepartmentId}
                      onChange={(val) => setTransitionForm({ ...transitionForm, newDepartmentId: val })}
                      options={[
                        { value: '', label: 'Keep current department' },
                        ...(departments || []).map((d) => ({
                          value: d._id,
                          label: d.name,
                        })),
                      ]}
                    />
                  </div>

                  <div>
                    <FloatingDropdown
                      label="New Reporting Manager"
                      value={transitionForm.newManagerId}
                      onChange={(val) => setTransitionForm({ ...transitionForm, newManagerId: val })}
                      options={[
                        { value: '', label: 'Keep current manager' },
                        ...(managerOptions || [])
                          .filter((m) => m._id !== transitionEmployee._id)
                          .map((m) => ({
                            value: m._id,
                            label: `${m.fullName} (${m.employeeCode})`,
                          })),
                      ]}
                      searchable={true}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                      New Annual CTC / Compensation (optional)
                    </label>
                    <input
                      type="number"
                      value={transitionForm.newSalary}
                      onChange={(e) => setTransitionForm({ ...transitionForm, newSalary: e.target.value })}
                      className={inputCls}
                      placeholder="e.g. 1200000"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                      Business Reason / Board Approval Note
                    </label>
                    <textarea
                      rows={2}
                      value={transitionForm.reason}
                      onChange={(e) => setTransitionForm({ ...transitionForm, reason: e.target.value })}
                      className={inputCls}
                      placeholder="Promoted following annual performance review and outstanding project delivery..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#ECE0D6]">
                  <button
                    type="button"
                    onClick={() => setTransitionEmployee(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#ECE0D6] hover:bg-[#fff7ed] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={promoteTransferMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {promoteTransferMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Execute Career Transition
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 360° Comprehensive Dossier Drawer ── */}
      <Drawer
        open={!!selectedEmployeeId}
        onClose={() => setSelectedEmployeeId(null)}
        title={employeeDetail?.fullName || 'Employee Dossier'}
        subtitle={
          employeeDetail
            ? [
                employeeDetail.employeeCode,
                employeeDetail.designation || 'Staff',
                employeeDetail.grade ? `Grade ${employeeDetail.grade}` : null,
                employeeDetail.departmentId?.name,
              ]
                .filter(Boolean)
                .join(' · ')
            : undefined
        }
        width="lg"
      >
        {detailLoading || !employeeDetail ? (
          <div className="space-y-4 animate-pulse p-4">
            <div className="h-20 rounded-2xl bg-[#fff7ed]" />
            <div className="h-32 rounded-2xl bg-[#fff7ed]" />
            <div className="h-32 rounded-2xl bg-[#fff7ed]" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* 360 Tab Navigation */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] overflow-x-auto">
              <button
                type="button"
                onClick={() => setDrawerTab('overview')}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  drawerTab === 'overview'
                    ? 'bg-[#f97316] text-white shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('personal_statutory')}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  drawerTab === 'personal_statutory'
                    ? 'bg-[#f97316] text-white shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                Personal & Statutory
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('bank')}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  drawerTab === 'bank'
                    ? 'bg-[#f97316] text-white shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                Bank & Payroll
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('timeline')}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  drawerTab === 'timeline'
                    ? 'bg-[#f97316] text-white shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                Career Timeline ({jobHistory?.length ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('education_work')}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  drawerTab === 'education_work'
                    ? 'bg-[#f97316] text-white shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                Education & Work
              </button>
              <button
                type="button"
                onClick={() => setDrawerTab('attendance_docs')}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  drawerTab === 'attendance_docs'
                    ? 'bg-[#f97316] text-white shadow-xs'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                Attendance & Docs
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {drawerTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <InfoTile icon={<Mail className="w-3.5 h-3.5" />} label="Work Email" value={employeeDetail.email || '—'} />
                  <InfoTile icon={<Phone className="w-3.5 h-3.5" />} label="Contact Phone" value={employeeDetail.phone || '—'} />
                  <InfoTile
                    icon={<Building2 className="w-3.5 h-3.5" />}
                    label="Department"
                    value={employeeDetail.departmentId?.name || '—'}
                  />
                  <InfoTile
                    icon={<MapPin className="w-3.5 h-3.5" />}
                    label="Assigned Branch"
                    value={
                      employeeDetail.branchId
                        ? `${employeeDetail.branchId.name} (${employeeDetail.branchId.code})`
                        : 'Headquarters'
                    }
                  />
                  <InfoTile
                    icon={<Briefcase className="w-3.5 h-3.5" />}
                    label="Reporting Manager"
                    value={employeeDetail.managerId?.fullName || 'Root (No Manager)'}
                  />
                  <InfoTile
                    icon={<CalendarDays className="w-3.5 h-3.5" />}
                    label="Date of Joining"
                    value={fmtDate(employeeDetail.joiningDate)}
                  />
                  <InfoTile
                    icon={<BadgeCheck className="w-3.5 h-3.5" />}
                    label="Employment Type"
                    value={EMPLOYMENT_TYPE_LABELS[employeeDetail.employmentType]}
                  />
                  <InfoTile
                    icon={<TrendingUp className="w-3.5 h-3.5" />}
                    label="Current Grade"
                    value={employeeDetail.grade || 'L2'}
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-[#ECE0D6] bg-[#FBF8F4]">
                  <div>
                    <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider block mb-1">
                      Account Status & Identity Key
                    </span>
                    <EmployeeStatusPill status={employeeDetail.status} />
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#9B9B9B] font-mono block">
                      Code: {employeeDetail.employeeCode}
                    </span>
                    {employeeDetail.userId && (
                      <span className="text-[10px] text-[#16a34a] font-medium flex items-center gap-1 justify-end mt-0.5">
                        <ShieldCheck className="w-3 h-3" /> Linked System User
                      </span>
                    )}
                  </div>
                </div>

                {employeeDetail.skills && employeeDetail.skills.length > 0 && (
                  <div className="p-3.5 rounded-xl border border-[#ECE0D6] bg-white">
                    <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">Skills & Competencies</p>
                    <div className="flex flex-wrap gap-1.5">
                      {employeeDetail.skills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-[#fff7ed] border border-[#fed7aa] text-[#ea580c] text-xs font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PERSONAL & STATUTORY */}
            {drawerTab === 'personal_statutory' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-[#ECE0D6] bg-white space-y-3">
                  <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#f97316]" /> Personal Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoTile label="Date of Birth" value={fmtDate(employeeDetail.personalInfo?.dob)} />
                    <InfoTile label="Gender" value={employeeDetail.personalInfo?.gender ? employeeDetail.personalInfo.gender.toUpperCase() : '—'} />
                    <InfoTile label="Marital Status" value={employeeDetail.personalInfo?.maritalStatus ? employeeDetail.personalInfo.maritalStatus.toUpperCase() : '—'} />
                    <InfoTile label="Blood Group" value={employeeDetail.personalInfo?.bloodGroup || '—'} />
                  </div>
                  <div className="pt-2 border-t border-[#F3EDE4] space-y-2">
                    <div>
                      <span className="text-[11px] text-[#6B6B6B] font-medium block">Current Address:</span>
                      <p className="text-xs text-[#1A1A1A] mt-0.5">{employeeDetail.personalInfo?.currentAddress || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#6B6B6B] font-medium block">Permanent Address:</span>
                      <p className="text-xs text-[#1A1A1A] mt-0.5">{employeeDetail.personalInfo?.permanentAddress || '—'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#ECE0D6] bg-white space-y-3">
                  <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#f97316]" /> Statutory Identification
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <InfoTile label="PAN / Tax ID" value={employeeDetail.statutoryIds?.pan || '—'} />
                    <InfoTile label="Aadhaar / National ID" value={employeeDetail.statutoryIds?.aadhaar || '—'} />
                    <InfoTile label="Universal Account No (UAN)" value={employeeDetail.statutoryIds?.uan || '—'} />
                    <InfoTile label="Passport Number" value={employeeDetail.statutoryIds?.passportNumber || '—'} />
                    <InfoTile label="Passport Expiry" value={fmtDate(employeeDetail.statutoryIds?.passportExpiry)} />
                    <InfoTile label="Driving License" value={employeeDetail.statutoryIds?.drivingLicense || '—'} />
                  </div>
                </div>

                {employeeDetail.emergencyContacts && employeeDetail.emergencyContacts.length > 0 && (
                  <div className="p-4 rounded-xl border border-[#ECE0D6] bg-white space-y-3">
                    <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#f97316]" /> Emergency Contacts
                    </h4>
                    <div className="space-y-2">
                      {employeeDetail.emergencyContacts.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-[#FBF8F4] border border-[#ECE0D6]">
                          <div>
                            <p className="text-xs font-semibold text-[#1A1A1A]">{c.name}</p>
                            <p className="text-[11px] text-[#6B6B6B]">{c.relationship}</p>
                          </div>
                          <span className="text-xs font-mono font-medium text-[#ea580c]">{c.phone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: BANK & PAYROLL */}
            {drawerTab === 'bank' && (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl border border-[#ECE0D6] bg-white space-y-4 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-[#F3EDE4]">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa]">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#1A1A1A]">Direct Deposit Bank Account</h4>
                        <p className="text-xs text-[#6B6B6B]">Used for statutory payroll disbursement</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
                      Verified for ACH
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <InfoTile label="Bank Name" value={employeeDetail.bankDetails?.bankName || '—'} />
                    <InfoTile label="Branch Name" value={employeeDetail.bankDetails?.branchName || '—'} />
                    <InfoTile label="Account Holder" value={employeeDetail.bankDetails?.accountHolderName || employeeDetail.fullName} />
                    <InfoTile label="IFSC / Routing Code" value={employeeDetail.bankDetails?.ifscCode || '—'} />
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
                    <span className="text-[11px] text-[#6B6B6B] block">Account Number</span>
                    <p className="text-sm font-mono font-bold text-[#1A1A1A] tracking-wider mt-0.5">
                      {employeeDetail.bankDetails?.accountNumber
                        ? `•••• •••• ${employeeDetail.bankDetails.accountNumber.slice(-4)}`
                        : 'No bank account added yet'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CAREER TIMELINE / JOB HISTORY */}
            {drawerTab === 'timeline' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">
                    <History className="w-3.5 h-3.5 text-[#f97316]" />
                    Career Progression & Audit Trail
                  </p>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={(e) => handleOpenTransition(employeeDetail, e)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-[#f97316] hover:bg-[#ea580c] shadow-xs transition-colors cursor-pointer"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      Add Transition
                    </button>
                  )}
                </div>

                {historyLoading ? (
                  <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-[#f97316] mx-auto" /></div>
                ) : !jobHistory || jobHistory.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-[#FBF8F4] border border-[#ECE0D6]">
                    <History className="w-8 h-8 text-[#E8DCCE] mx-auto mb-2" />
                    <p className="text-sm font-medium text-[#1A1A1A]">No Career Transitions Logged</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">
                      Promotions, lateral transfers, and compensation changes will appear here in chronological order.
                    </p>
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#ECE0D6]">
                    {jobHistory.map((item) => (
                      <div key={item._id} className="relative">
                        <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-[#f97316] border-2 border-white shadow-xs" />
                        <div className="p-4 rounded-xl border border-[#ECE0D6] bg-white space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa]">
                              {TRANSITION_TYPE_LABELS[item.transitionType] || item.transitionType}
                            </span>
                            <span className="text-xs text-[#6B6B6B] font-mono">{fmtDate(item.effectiveDate)}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs font-semibold text-[#1A1A1A]">
                            <span>{item.previousDesignation || 'Previous'}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#f97316]" />
                            <span className="text-[#ea580c]">{item.newDesignation || 'New'}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#6B6B6B] pt-2 border-t border-[#F3EDE4]">
                            <div>
                              <span className="block font-medium">Department:</span>
                              <span>{item.newDepartmentId?.name || item.previousDepartmentId?.name || '—'}</span>
                            </div>
                            <div>
                              <span className="block font-medium">Grade Revision:</span>
                              <span>{item.previousGrade || '—'} → {item.newGrade || '—'}</span>
                            </div>
                          </div>

                          {item.reason && (
                            <p className="text-xs italic text-[#6B6B6B] bg-[#FBF8F4] p-2 rounded-lg border border-[#ECE0D6]">
                              "{item.reason}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: EDUCATION & WORK EXPERIENCE */}
            {drawerTab === 'education_work' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-[#ECE0D6] bg-white space-y-3">
                  <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#f97316]" /> Educational Background
                  </h4>
                  {!employeeDetail.education || employeeDetail.education.length === 0 ? (
                    <p className="text-xs text-[#9B9B9B] italic">No educational records attached.</p>
                  ) : (
                    <div className="space-y-2">
                      {employeeDetail.education.map((edu, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-[#FBF8F4] border border-[#ECE0D6]">
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-[#1A1A1A]">{edu.degree} · {edu.fieldOfStudy}</p>
                            {edu.gradeOrGpa && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#ECE0D6]">
                                GPA: {edu.gradeOrGpa}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#6B6B6B] mt-0.5">{edu.institution}</p>
                          <p className="text-[10px] text-[#9B9B9B] font-mono mt-1">
                            {fmtDate(edu.startDate)} — {fmtDate(edu.endDate)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-[#ECE0D6] bg-white space-y-3">
                  <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#f97316]" /> Prior Work Experience
                  </h4>
                  {!employeeDetail.workHistory || employeeDetail.workHistory.length === 0 ? (
                    <p className="text-xs text-[#9B9B9B] italic">No prior employment history recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      {employeeDetail.workHistory.map((work, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-[#FBF8F4] border border-[#ECE0D6]">
                          <p className="text-xs font-bold text-[#1A1A1A]">{work.jobTitle}</p>
                          <p className="text-[11px] text-[#6B6B6B] mt-0.5">{work.company}</p>
                          <p className="text-[10px] text-[#9B9B9B] font-mono mt-1">
                            {fmtDate(work.startDate)} — {work.isCurrent ? 'Present' : fmtDate(work.endDate)}
                          </p>
                          {work.responsibilities && (
                            <p className="text-xs text-[#6B6B6B] mt-1.5 pt-1.5 border-t border-[#ECE0D6]">
                              {work.responsibilities}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: ATTENDANCE & DOCUMENTS */}
            {drawerTab === 'attendance_docs' && (
              <div className="space-y-5">
                {/* Recent attendance logs */}
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">
                    <Clock className="w-3.5 h-3.5 text-[#f97316]" />
                    Recent Attendance Logs
                  </p>
                  {(employeeDetail.recentAttendance || []).length === 0 ? (
                    <p className="text-xs text-[#9B9B9B] italic py-2">No attendance logs found.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {(employeeDetail.recentAttendance || []).map((rec) => (
                        <div
                          key={rec._id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-[#ECE0D6] bg-white px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#1A1A1A]">
                              {new Date(rec.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                            <p className="text-[10px] text-[#6B6B6B] font-mono">
                              {rec.checkInAt
                                ? `${new Date(rec.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${Math.floor(rec.totalWorkedMinutes / 60)}h ${rec.totalWorkedMinutes % 60}m`
                                : 'No punch recorded'}
                            </p>
                          </div>
                          <AttendanceStatusPill status={rec.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Leave balances */}
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">
                    <CalendarDays className="w-3.5 h-3.5 text-[#f97316]" />
                    Leave Balances ({new Date().getFullYear()})
                  </p>
                  {(employeeDetail.leaveBalances || []).length === 0 ? (
                    <p className="text-xs text-[#9B9B9B] italic py-2">No active leave balances.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {(employeeDetail.leaveBalances || []).map((b) => (
                        <div
                          key={b._id}
                          className="rounded-xl border border-[#ECE0D6] bg-white p-3 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-[#1A1A1A]">{b.leaveType}</p>
                            <p className="text-[11px] font-mono font-bold text-[#f97316]">
                              {b.remaining} / {b.allocated} left
                            </p>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#FBF0E7] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#f97316] transition-all"
                              style={{ width: `${b.allocated > 0 ? Math.min(100, Math.round((b.used / b.allocated) * 100)) : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Documents */}
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">
                    <FileText className="w-3.5 h-3.5 text-[#f97316]" />
                    Dossier Documents ({employeeDetail.documents?.length ?? 0})
                  </p>
                  {(employeeDetail.documents || []).length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
                      <FileText className="w-8 h-8 text-[#E8DCCE] mx-auto mb-2" />
                      <p className="text-xs text-[#6B6B6B]">No documents uploaded for this employee.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(employeeDetail.documents || []).map((doc) => (
                        <a
                          key={doc._id}
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-2 rounded-xl border border-[#ECE0D6] bg-white p-3 hover:border-[#f97316] transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#1A1A1A] truncate">{doc.fileName}</p>
                            <span className="inline-block mt-0.5 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa]">
                              {doc.docType}
                            </span>
                          </div>
                          <FileText className="w-4 h-4 text-[#f97316] flex-shrink-0" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default EmployeesPage;
