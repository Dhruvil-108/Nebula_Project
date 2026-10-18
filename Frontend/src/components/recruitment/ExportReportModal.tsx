import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { recruitmentApi } from '../../lib/recruitmentApi';

interface ExportReportModalProps {
  open: boolean;
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({ open, onClose }) => {
  const [reportType, setReportType] = useState<'pipeline' | 'offers'>('pipeline');
  const [isExporting, setIsExporting] = useState(false);

  if (!open) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await recruitmentApi.exportRecruitmentReport(reportType);
      toast.success(`📊 ${reportType === 'pipeline' ? 'Candidate Pipeline' : 'Offers'} report exported successfully!`);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to export report.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-white border border-[#ECE0D6] rounded-2xl shadow-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">Export Recruitment Report</h3>
                <p className="text-[11px] text-[#6B6B6B]">Generate standard CSV data export</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[#1A1A1A]">Select Dataset</label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setReportType('pipeline')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  reportType === 'pipeline'
                    ? 'border-orange-500 bg-orange-50/50 text-orange-950 font-bold'
                    : 'border-[#ECE0D6] bg-white text-[#4A4A4A] hover:bg-slate-50'
                }`}
              >
                <p className="text-xs">Candidate Pipeline</p>
                <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                  Stages, ratings, sources, job openings
                </p>
              </div>

              <div
                onClick={() => setReportType('offers')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  reportType === 'offers'
                    ? 'border-orange-500 bg-orange-50/50 text-orange-950 font-bold'
                    : 'border-[#ECE0D6] bg-white text-[#4A4A4A] hover:bg-slate-50'
                }`}
              >
                <p className="text-xs">Offers & E-Sign</p>
                <p className="text-[10px] text-slate-500 font-normal mt-0.5">
                  CTC breakdown, approval status, e-signatures
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ECE0D6]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting ? 'Exporting...' : 'Download CSV'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
