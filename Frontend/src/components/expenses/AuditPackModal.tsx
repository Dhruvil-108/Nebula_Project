import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileCheck,
  Download,
  Calendar,
  Building2,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuditPack, useExportAuditPackCsv, useDepartmentBudgets } from '../../hooks/useExpenses';
import type { AuditPack } from '../../types/expenses';

interface AuditPackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditPackModal: React.FC<AuditPackModalProps> = ({ isOpen, onClose }) => {
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [departmentId, setDepartmentId] = useState('');
  const [auditResult, setAuditResult] = useState<AuditPack | null>(null);

  const { data: budgets = [] } = useDepartmentBudgets();
  const generateMutation = useAuditPack();
  const exportCsvMutation = useExportAuditPackCsv();

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        startDate,
        endDate,
        departmentId: departmentId || undefined,
      });
      setAuditResult(result);
    } catch (e) {
      // Handled by toast
    }
  };

  const handleDownloadCsv = async () => {
    await exportCsvMutation.mutateAsync({
      startDate,
      endDate,
      departmentId: departmentId || undefined,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative w-full max-w-2xl bg-white border border-[#ECE0D6] rounded-2xl shadow-xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 to-teal-50/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Compliance & Financial Audit Pack
                  </h2>
                  <p className="text-xs text-slate-500">
                    Compile audit evidence samples, exception rates, and segregation-of-duties logs
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Controls */}
            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Department (Optional)
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="">All Departments</option>
                    {budgets.map((b) => (
                      <option key={b._id} value={b.departmentId?._id}>
                        {b.departmentId?.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-2xs transition-colors disabled:opacity-50"
                >
                  {generateMutation.isPending ? 'Compiling Audit Sample...' : 'Run Audit Sample'}
                </button>
              </div>

              {/* Audit Results Preview */}
              {auditResult && (
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Sample Size
                      </span>
                      <span className="text-base font-bold text-slate-900">
                        {auditResult.totalClaims} claims
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Sample Value
                      </span>
                      <span className="text-base font-bold text-slate-900">
                        ${auditResult.totalSampleValue.toFixed(2)}
                      </span>
                    </div>

                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <span className="text-[10px] text-emerald-700 uppercase font-semibold block">
                        Exception Rate
                      </span>
                      <span className="text-base font-bold text-emerald-900">
                        {auditResult.exceptionRate}%
                      </span>
                    </div>
                  </div>

                  {/* Narrative Card */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
                    <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Audit Examination Narrative</span>
                    </div>
                    <p>{auditResult.narrative}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleDownloadCsv}
                disabled={exportCsvMutation.isPending || !auditResult}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit Pack CSV</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
