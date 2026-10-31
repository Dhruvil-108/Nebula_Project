import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
} from 'lucide-react';
import { previewCsvImport } from '../../lib/inventoryApi';
import { useCommitCsvImport } from '../../hooks/useInventory';
import type { CsvImportPreviewResponse } from '../../types/inventory';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState('');
  const [preview, setPreview] = useState<CsvImportPreviewResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const commitMutation = useCommitCsvImport();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      setIsValidating(true);
      try {
        const previewResult = await previewCsvImport(text);
        setPreview(previewResult);
      } catch (err: any) {
        console.error('Validation failed:', err);
      } finally {
        setIsValidating(false);
      }
    };
    reader.readAsText(selected);
  };

  const handleCommit = async () => {
    if (!preview || !preview.previewRows || preview.previewRows.length === 0) return;
    try {
      await commitMutation.mutateAsync(preview.previewRows);
      onClose();
    } catch (err) {
      console.error('Commit failed:', err);
    }
  };

  const downloadSampleTemplate = () => {
    const sample = `sku,name,category,brand,baseUom,standardCost,minStockLevel,reorderPoint,trackingType,description
SKU-SMP-001,High-Speed Ethernet Cable 10m,Networking,Belkin,PCS,8.50,10,25,none,Cat6 RJ45 patch cable
SKU-SMP-002,Industrial SSD 1TB NVMe,Storage,Samsung,PCS,110.00,5,15,batch,Enterprise grade NVMe
SKU-SMP-003,Smart Managed Switch 24P,Networking,Cisco,PCS,850.00,2,5,serial,Layer 2 switch`;

    const blob = new Blob([sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-inventory-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl bg-white border border-slate-200/90 shadow-2xl flex flex-col z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100/70 border border-orange-200/60 text-orange-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Bulk Import Catalog Items
                </h3>
                <p className="text-xs text-slate-500">
                  Upload CSV spreadsheet with validation preview and error reporting
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Sample Template
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto px-6 py-5 space-y-6 flex-1">
            {/* File Dropzone */}
            <div className="border-2 border-dashed border-slate-200 hover:border-orange-400 rounded-2xl p-6 text-center transition-all bg-slate-50/50">
              <input
                type="file"
                accept=".csv"
                id="csv-file-input"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="csv-file-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-500 hover:text-orange-600 transition-colors">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    {file ? file.name : 'Click to select or drag and drop CSV file'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports columns: sku, name, category, brand, baseUom, standardCost, minStockLevel, reorderPoint, trackingType
                  </p>
                </div>
              </label>
            </div>

            {/* Validation Spinner */}
            {isValidating && (
              <div className="flex items-center justify-center gap-2 py-8 text-orange-600 text-xs font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                Validating CSV rows against database constraints...
              </div>
            )}

            {/* Validation Summary */}
            {preview && !isValidating && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <span className="text-slate-600">Total Rows: <strong>{preview.totalRows}</strong></span>
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Valid: <strong>{preview.validCount}</strong>
                    </span>
                    {preview.errorCount > 0 && (
                      <span className="text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Errors: <strong>{preview.errorCount}</strong>
                      </span>
                    )}
                  </div>

                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      preview.canCommit
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {preview.canCommit ? 'Ready to Commit' : 'Validation Errors Must Be Fixed'}
                  </span>
                </div>

                {/* Errors Table if any */}
                {preview.errors.length > 0 && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-2">
                    <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Found {preview.errors.length} rows with errors:
                    </h4>
                    <div className="max-h-40 overflow-y-auto space-y-1 text-xs text-rose-700">
                      {preview.errors.map((err, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-white/80 p-2 rounded-lg border border-rose-200/50">
                          <span className="font-mono font-bold text-[11px]">Row {err.row}:</span>
                          <span>{err.errors.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview Table */}
                {preview.previewRows.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-700">
                      Preview Verified Rows (Showing first {preview.previewRows.length})
                    </h4>
                    <div className="rounded-xl border border-slate-200 overflow-x-auto max-h-60">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                          <tr>
                            <th className="px-3 py-2">SKU</th>
                            <th className="px-3 py-2">Name</th>
                            <th className="px-3 py-2">Category</th>
                            <th className="px-3 py-2">UoM</th>
                            <th className="px-3 py-2">Cost</th>
                            <th className="px-3 py-2">Tracking</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {preview.previewRows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80">
                              <td className="px-3 py-2 font-mono text-slate-800">{row.sku || '(Auto)'}</td>
                              <td className="px-3 py-2 font-medium text-slate-900">{row.name}</td>
                              <td className="px-3 py-2 text-slate-600">{row.categoryName || '-'}</td>
                              <td className="px-3 py-2 font-mono text-slate-600">{row.baseUom}</td>
                              <td className="px-3 py-2 font-mono text-slate-800">${row.standardCost.toFixed(2)}</td>
                              <td className="px-3 py-2 capitalize text-slate-600">{row.trackingType}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCommit}
              disabled={!preview?.canCommit || commitMutation.isPending}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-2xs transition-all disabled:opacity-50"
            >
              {commitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Commit Import ({preview?.validCount || 0} Items)
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
