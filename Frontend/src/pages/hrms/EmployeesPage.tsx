import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import {
  Users,
  Search,
  RefreshCw,
  Trash2,
  Loader2,
  Mail,
  Phone,
  Briefcase,
  CalendarDays,
  X,
  Building2,
  FileText,
  BadgeCheck,
  Clock,
} from 'lucide-react';
import {
  useEmployees,
  useCreateEmployee,
  useDeleteEmployee,
  useDepartments,
  useEmployee,
} from '../../hooks/useHrms';
import { Drawer } from '../../components/crm/Drawer';
import { ActivityTimeline } from '../../components/crm/ActivityTimeline';
import { InfoTile } from '../../components/hrms/InfoTile';
import { EmployeeStatusPill, AttendanceStatusPill } from '../../components/hrms/HrmsStatusPill';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import type { Employee } from '../../types/hrms';
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYEE_STATUSES,
  EMPLOYEE_STATUS_LABELS,
  type EmploymentType,
  type EmployeeStatus,
} from '../../types/hrms';

interface OwnerOption {
  _id: string;
  fullName: string;
  email?: string;
}

const initialForm = {
  employeeCode: '',
  fullName: '',
  email: '',
  phone: '',
  departmentId: '',
  designation: '',
  joiningDate: '',
  managerId: '',
  employmentType: 'full_time' as EmploymentType,
  status: 'active' as EmployeeStatus,
};

export const EmployeesPage: React.FC = () => {
  const { can } = useModuleAccess('hrms');
  const canCreate = can('create');
  const canEdit = can('edit');
  const canDelete = can('delete');

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  const { data: employees, isLoading, isError, refetch } = useEmployees({
    search: search || undefined,
    department: departmentFilter || undefined,
    status: statusFilter || undefined,
    employmentType: typeFilter || undefined,
  });

  const { data: departments } = useDepartments();

  // Manager options = existing employees
  const { data: managerOptions } = useQuery<Employee[]>({
    queryKey: ['hrms', 'employees', 'options'],
    queryFn: () => apiClient.get<Employee[]>('/hr/employees').then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: employeeDetail, isLoading: detailLoading } = useEmployee(selectedEmployeeId);

  const createMutation = useCreateEmployee();
  const deleteMutation = useDeleteEmployee();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employeeCode.trim() || !form.fullName.trim()) return;
    createMutation.mutate(
      {
        employeeCode: form.employeeCode,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        departmentId: form.departmentId || null,
        designation: form.designation,
        joiningDate: form.joiningDate || null,
        managerId: form.managerId || null,
        employmentType: form.employmentType,
        status: form.status,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setForm(initialForm);
        },
      }
    );
  };

  const inputCls =
    'w-full rounded-lg border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#C2540C]/25 focus:border-[#C2540C] transition-all';

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
          <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Employees</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {isLoading
              ? 'Loading employees...'
              : isError
                ? 'Unable to load employees'
                : `${employees?.length ?? 0} employee${(employees?.length ?? 0) === 1 ? '' : 's'} in your workspace`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBEAE0] border border-[#ECE0D6] transition-colors"
            title="Refresh employees"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#C2540C] hover:bg-[#D06B28] text-white shadow-md shadow-[#C2540C]/20 transition-colors"
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
            placeholder="Search name, code, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className={`${inputCls} sm:w-44`}>
          <option value="">All departments</option>
          {(departments || []).map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputCls} sm:w-36`}>
          <option value="">All statuses</option>
          {EMPLOYEE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {EMPLOYEE_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${inputCls} sm:w-36`}>
          <option value="">All types</option>
          {EMPLOYMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {EMPLOYMENT_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3 font-semibold">Code</th>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Department</th>
                <th className="px-5 py-3 font-semibold">Designation</th>
                <th className="px-5 py-3 font-semibold">Manager</th>
                <th className="px-5 py-3 font-semibold">Joining date</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-5 py-4">
                      <div className="h-5 rounded bg-[#FBEAE0] animate-pulse" />
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
                      className="mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#C2540C] border border-[#ECE0D6] hover:bg-[#FBEAE0]"
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
                      {search || departmentFilter || statusFilter || typeFilter
                        ? 'Try adjusting your filters.'
                        : 'Add your first employee to build your people directory.'}
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
                    <td className="px-5 py-3.5 text-xs font-mono font-semibold text-[#C2540C]">{emp.employeeCode}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-[#1A1A1A]">{emp.fullName}</div>
                      {emp.email && <div className="text-xs text-[#6B6B6B]">{emp.email}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-[#6B6B6B]">{emp.departmentId?.name || '—'}</td>
                    <td className="px-5 py-3.5 text-[#6B6B6B]">{emp.designation || '—'}</td>
                    <td className="px-5 py-3.5 text-[#6B6B6B]">{emp.managerId?.fullName || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-[#6B6B6B] font-mono">{fmtDate(emp.joiningDate)}</td>
                    <td className="px-5 py-3.5">
                      <EmployeeStatusPill status={emp.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(emp._id)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors disabled:opacity-50"
                          title="Delete employee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create modal ── */}
      {canCreate && showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setShowCreate(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-lg rounded-2xl bg-white border border-[#ECE0D6] shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECE0D6]">
              <h3 className="text-base font-semibold text-[#1A1A1A]">Add Employee</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="p-1.5 rounded-lg text-[#6B6B6B] hover:bg-[#FBEAE0] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                    Employee code <span className="text-[#DC2626]">*</span>
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
                    Full name <span className="text-[#DC2626]">*</span>
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
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Department</label>
                  <select
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">No department</option>
                    {(departments || []).map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Designation</label>
                  <input
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputCls}
                    placeholder="sarah@acme.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={inputCls}
                    placeholder="+1 555 000 1234"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Joining date</label>
                  <input
                    type="date"
                    value={form.joiningDate}
                    onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Manager</label>
                  <select
                    value={form.managerId}
                    onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">No manager</option>
                    {(managerOptions || []).map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Employment type</label>
                  <select
                    value={form.employmentType}
                    onChange={(e) => setForm({ ...form, employmentType: e.target.value as EmploymentType })}
                    className={inputCls}
                  >
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {EMPLOYMENT_TYPE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as EmployeeStatus })}
                    className={inputCls}
                  >
                    {EMPLOYEE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {EMPLOYEE_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#ECE0D6] hover:bg-[#FBEAE0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !form.employeeCode.trim() || !form.fullName.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#C2540C] hover:bg-[#D06B28] text-white transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Employee
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── Detail drawer ── */}
      <Drawer
        open={!!selectedEmployeeId}
        onClose={() => setSelectedEmployeeId(null)}
        title={employeeDetail?.fullName || 'Employee'}
        subtitle={
          employeeDetail
            ? [employeeDetail.employeeCode, employeeDetail.designation, employeeDetail.departmentId?.name]
                .filter(Boolean)
                .join(' · ')
            : undefined
        }
        width="lg"
      >
        {detailLoading || !employeeDetail ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 rounded-xl bg-[#FBEAE0]" />
            <div className="h-32 rounded-xl bg-[#FBEAE0]" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <InfoTile icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={employeeDetail.email || '—'} />
              <InfoTile icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={employeeDetail.phone || '—'} />
              <InfoTile
                icon={<Building2 className="w-3.5 h-3.5" />}
                label="Department"
                value={employeeDetail.departmentId?.name || '—'}
              />
              <InfoTile
                icon={<Briefcase className="w-3.5 h-3.5" />}
                label="Manager"
                value={employeeDetail.managerId?.fullName || '—'}
              />
              <InfoTile
                icon={<CalendarDays className="w-3.5 h-3.5" />}
                label="Joining date"
                value={fmtDate(employeeDetail.joiningDate)}
              />
              <InfoTile
                icon={<BadgeCheck className="w-3.5 h-3.5" />}
                label="Employment type"
                value={EMPLOYMENT_TYPE_LABELS[employeeDetail.employmentType]}
              />
            </div>

            <div className="flex items-center gap-2">
              <EmployeeStatusPill status={employeeDetail.status} />
            </div>

            {/* Attendance snapshot */}
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">
                <Clock className="w-3.5 h-3.5" />
                Recent Attendance
              </p>
              {(employeeDetail.recentAttendance || []).length === 0 ? (
                <p className="text-xs text-[#9B9B9B] italic">No attendance records yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {(employeeDetail.recentAttendance || []).map((rec) => (
                    <div
                      key={rec._id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#ECE0D6] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#1A1A1A]">
                          {new Date(rec.date).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-[#6B6B6B] font-mono">
                          {rec.checkInAt
                            ? `${new Date(rec.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${Math.floor(rec.totalWorkedMinutes / 60)}h ${rec.totalWorkedMinutes % 60}m`
                            : '—'}
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
                <CalendarDays className="w-3.5 h-3.5" />
                Leave Balances ({new Date().getFullYear()})
              </p>
              {(employeeDetail.leaveBalances || []).length === 0 ? (
                <p className="text-xs text-[#9B9B9B] italic">No leave balances configured.</p>
              ) : (
                <div className="space-y-1.5">
                  {(employeeDetail.leaveBalances || []).map((b) => (
                    <div
                      key={b._id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#ECE0D6] px-3 py-2"
                    >
                      <p className="text-xs font-medium text-[#1A1A1A]">{b.leaveType}</p>
                      <p className="text-[10px] text-[#6B6B6B] font-mono">
                        {b.remaining} / {b.allocated} remaining · {b.used} used
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Documents */}
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5" />
                Documents ({employeeDetail.documents?.length ?? 0})
              </p>
              {(employeeDetail.documents || []).length === 0 ? (
                <p className="text-xs text-[#9B9B9B] italic">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {(employeeDetail.documents || []).map((doc) => (
                    <a
                      key={doc._id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#ECE0D6] px-3 py-2 hover:border-[#DE7A3D] transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#1A1A1A] truncate">{doc.fileName}</p>
                        <p className="text-[10px] text-[#6B6B6B]">{doc.docType}</p>
                      </div>
                      <FileText className="w-3.5 h-3.5 text-[#C2540C] flex-shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Timeline (HR notes) */}
            <ActivityTimeline
              relatedToType="employee"
              relatedToId={employeeDetail._id}
              activities={employeeDetail.activities}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default EmployeesPage;
