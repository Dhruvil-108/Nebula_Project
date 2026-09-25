import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  RefreshCw,
  Trash2,
  Loader2,
  Sparkles,
  X,
  Pencil,
  Star,
} from 'lucide-react';
import {
  useHolidays,
  useCreateHoliday,
  useUpdateHoliday,
  useDeleteHoliday,
} from '../../hooks/useHrms';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { useAuth } from '../../contexts/AuthContext';
import type { Holiday } from '../../types/hrms';

export const HolidaysPage: React.FC = () => {
  const { user } = useAuth();
  const { can } = useModuleAccess('hrms');
  const canCreate = can('create');
  const canEdit = can('edit');
  const canDelete = can('delete');
  const isManagement = canCreate && ['super_admin', 'admin', 'hr'].includes(user?.role || '');

  const [year, setYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [form, setForm] = useState({ name: '', date: '', isOptional: false });

  const { data: holidays, isLoading, isError, refetch } = useHolidays(year);
  const createMutation = useCreateHoliday();
  const updateMutation = useUpdateHoliday();
  const deleteMutation = useDeleteHoliday();

  const todayStr = new Date().toISOString().slice(0, 10);
  const in7Days = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }, []);

  const isUpcoming = (h: Holiday) => h.date >= todayStr && h.date <= in7Days;

  const openEdit = (h: Holiday) => {
    setEditing(h);
    setForm({ name: h.name, date: h.date.slice(0, 10), isOptional: h.isOptional });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.date) return;
    if (editing) {
      updateMutation.mutate(
        { id: editing._id, patch: { name: form.name, date: form.date, isOptional: form.isOptional } },
        {
          onSuccess: () => {
            setShowForm(false);
            setEditing(null);
            setForm({ name: '', date: '', isOptional: false });
          },
        }
      );
    } else {
      createMutation.mutate(
        { name: form.name, date: form.date, isOptional: form.isOptional },
        {
          onSuccess: () => {
            setShowForm(false);
            setForm({ name: '', date: '', isOptional: false });
          },
        }
      );
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', date: '', isOptional: false });
  };

  const inputCls =
    'w-full rounded-lg border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all';

  const years = [year - 1, year, year + 1];

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
          <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Holidays</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {isLoading ? 'Loading holidays...' : `${holidays?.length ?? 0} holidays in ${year}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors"
            title="Refresh holidays"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {isManagement && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm({ name: '', date: '', isOptional: false });
                setShowForm(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-colors"
            >
              <CalendarDays className="w-4 h-4" />
              Add Holiday
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Holiday list ── */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Holiday</th>
                <th className="px-5 py-3 font-semibold">Day</th>
                <th className="px-5 py-3 font-semibold">Type</th>
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
                    <p className="text-sm font-medium text-[#1A1A1A]">Holidays could not be loaded</p>
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
              ) : (holidays || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <CalendarDays className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#1A1A1A]">No holidays configured for {year}</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">
                      {isManagement ? 'Add holidays so they are excluded from expected working days.' : 'Holidays will appear here once configured.'}
                    </p>
                  </td>
                </tr>
              ) : (
                (holidays || []).map((h, idx) => (
                  <motion.tr
                    key={h._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.3), duration: 0.25 }}
                    className={`transition-colors ${
                      isUpcoming(h) ? 'bg-[#fff7ed]/60 hover:bg-[#fff7ed]' : 'hover:bg-[#FBF8F4]'
                    }`}
                  >
                    <td className="px-5 py-3.5 text-xs font-mono text-[#6B6B6B]">
                      {new Date(h.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#1A1A1A]">{h.name}</span>
                        {isUpcoming(h) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#f97316] text-white">
                            <Sparkles className="w-2.5 h-2.5" />
                            Upcoming
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[#6B6B6B]">
                      {new Date(h.date).toLocaleDateString(undefined, { weekday: 'long' })}
                    </td>
                    <td className="px-5 py-3.5">
                      {h.isOptional ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FBF0E7] text-[#6B6B6B] border border-[#ECE0D6]">
                          <Star className="w-2.5 h-2.5" />
                          Optional
                        </span>
                      ) : (
                        <span className="text-xs text-[#6B6B6B]">Public</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      {isManagement && (
                        <div className="inline-flex items-center gap-1">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => openEdit(h)}
                              className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#f97316] hover:bg-[#fff7ed] transition-colors"
                              title="Edit holiday"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => deleteMutation.mutate(h._id)}
                              disabled={deleteMutation.isPending}
                              className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors disabled:opacity-50"
                              title="Delete holiday"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add/Edit modal ── */}
      {isManagement && showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={closeModal} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md rounded-2xl bg-white border border-[#ECE0D6] shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECE0D6]">
              <h3 className="text-base font-semibold text-[#1A1A1A]">
                {editing ? 'Edit Holiday' : 'Add Holiday'}
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
                  placeholder="e.g. Diwali"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                  Date <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={inputCls}
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-[#1A1A1A] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isOptional}
                  onChange={(e) => setForm({ ...form, isOptional: e.target.checked })}
                  className="w-4 h-4 rounded border-[#ECE0D6] accent-[#f97316]"
                />
                Optional holiday (counts as a working day)
              </label>
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
                  disabled={createMutation.isPending || updateMutation.isPending || !form.name.trim() || !form.date}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white transition-colors disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  {editing ? 'Save Changes' : 'Create Holiday'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HolidaysPage;
