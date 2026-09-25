import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Search,
  RefreshCw,
  Trash2,
  Loader2,
  Users,
  X,
  Pencil,
} from 'lucide-react';
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useDepartment,
  useEmployees,
} from '../../hooks/useHrms';
import { Drawer } from '../../components/crm/Drawer';
import { InfoTile } from '../../components/hrms/InfoTile';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import type { Department } from '../../types/hrms';

const initialForm = { name: '', headId: '', description: '' };

export const DepartmentsPage: React.FC = () => {
  const { can } = useModuleAccess('hrms');
  const canCreate = can('create');
  const canEdit = can('edit');
  const canDelete = can('delete');

  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

  const { data: departments, isLoading, isError, refetch } = useDepartments({
    search: search || undefined,
  });
  const { data: employees } = useEmployees();
  const { data: departmentDetail, isLoading: detailLoading } = useDepartment(selectedDepartmentId);

  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setForm({
      name: dept.name,
      headId: dept.headId?._id || '',
      description: dept.description || '',
    });
    setShowCreate(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing) {
      updateMutation.mutate(
        { id: editing._id, patch: { name: form.name, headId: form.headId || null, description: form.description } },
        {
          onSuccess: () => {
            setShowCreate(false);
            setEditing(null);
            setForm(initialForm);
          },
        }
      );
    } else {
      createMutation.mutate(
        { name: form.name, headId: form.headId || null, description: form.description },
        {
          onSuccess: () => {
            setShowCreate(false);
            setForm(initialForm);
          },
        }
      );
    }
  };

  const closeModal = () => {
    setShowCreate(false);
    setEditing(null);
    setForm(initialForm);
  };

  const inputCls =
    'w-full rounded-lg border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all';

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
          <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Departments</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {isLoading
              ? 'Loading departments...'
              : `${departments?.length ?? 0} department${(departments?.length ?? 0) === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors"
            title="Refresh departments"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(initialForm);
                setShowCreate(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Add Department
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Filter ── */}
      <div className="relative max-w-sm">
        <Search className="w-3.5 h-3.5 text-[#9B9B9B] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search departments…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} pl-9`}
        />
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Head</th>
                <th className="px-5 py-3 font-semibold text-center">Headcount</th>
                <th className="px-5 py-3 font-semibold">Description</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-5 py-4">
                      <div className="h-5 rounded bg-[#fff7ed] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <p className="text-sm font-medium text-[#1A1A1A]">Departments could not be loaded</p>
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
              ) : (departments || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <Building2 className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#1A1A1A]">No departments found</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">
                      {search ? 'Try adjusting your search.' : 'Create your first department to organize teams.'}
                    </p>
                  </td>
                </tr>
              ) : (
                (departments || []).map((dept, idx) => (
                  <motion.tr
                    key={dept._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.3), duration: 0.25 }}
                    className="hover:bg-[#FBF8F4] cursor-pointer transition-colors"
                    onClick={() => setSelectedDepartmentId(dept._id)}
                  >
                    <td className="px-5 py-3.5 font-medium text-[#1A1A1A]">{dept.name}</td>
                    <td className="px-5 py-3.5 text-[#6B6B6B]">{dept.headId?.fullName || '—'}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5 rounded-md bg-[#fff7ed] text-[#ea580c] text-xs font-semibold">
                        {dept.headcount ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#6B6B6B] max-w-[280px] truncate">
                      {dept.description || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => openEdit(dept)}
                            className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#f97316] hover:bg-[#fff7ed] transition-colors"
                            title="Edit department"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => deleteMutation.mutate(dept._id)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors disabled:opacity-50"
                            title="Delete department"
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

      {/* ── Create/Edit modal ── */}
      {canCreate && showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={closeModal} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md rounded-2xl bg-white border border-[#ECE0D6] shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECE0D6]">
              <h3 className="text-base font-semibold text-[#1A1A1A]">
                {editing ? 'Edit Department' : 'Add Department'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-lg text-[#6B6B6B] hover:bg-[#fff7ed] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                  Name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. Engineering"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Department head</label>
                <select
                  value={form.headId}
                  onChange={(e) => setForm({ ...form, headId: e.target.value })}
                  className={inputCls}
                >
                  <option value="">No head</option>
                  {(employees || []).map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.fullName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`${inputCls} resize-none`}
                  placeholder="What does this department do?"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#ECE0D6] hover:bg-[#fff7ed] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending || !form.name.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white transition-colors disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {editing ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── Detail drawer with members ── */}
      <Drawer
        open={!!selectedDepartmentId}
        onClose={() => setSelectedDepartmentId(null)}
        title={departmentDetail?.name || 'Department'}
        subtitle={departmentDetail?.description || undefined}
      >
        {detailLoading || !departmentDetail ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 rounded-xl bg-[#fff7ed]" />
            <div className="h-32 rounded-xl bg-[#fff7ed]" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <InfoTile icon={<Users className="w-3.5 h-3.5" />} label="Headcount" value={String(departmentDetail.headcount ?? 0)} />
              <InfoTile icon={<Building2 className="w-3.5 h-3.5" />} label="Head" value={departmentDetail.headId?.fullName || '—'} />
            </div>

            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">
                <Users className="w-3.5 h-3.5" />
                Members ({departmentDetail.members?.length ?? 0})
              </p>
              {(departmentDetail.members || []).length === 0 ? (
                <p className="text-xs text-[#9B9B9B] italic">No employees assigned to this department yet.</p>
              ) : (
                <div className="space-y-2">
                  {(departmentDetail.members || []).map((m) => (
                    <div key={m._id} className="rounded-xl border border-[#ECE0D6] px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-[#1A1A1A]">{m.fullName}</p>
                        <span className="text-[10px] font-mono text-[#f97316]">{m.employeeCode}</span>
                      </div>
                      <p className="text-[10px] text-[#6B6B6B]">
                        {[m.designation, m.email].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default DepartmentsPage;
