import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Receipt,
  ArrowRight,
  FileText,
  DollarSign,
  Calendar,
  Building,
} from 'lucide-react';
import { useAiScanReceipt } from '../../hooks/useExpenses';
import type { ExpenseCategory } from '../../types/expenses';

interface AiReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ExpenseCategory[];
  onApplyExtractedItem: (item: {
    merchant: string;
    expenseDate: string;
    amount: number;
    taxAmount: number;
    description: string;
    categoryId: string;
    receiptUrl?: string;
    receiptFileName?: string;
  }) => void;
}

const SAMPLE_RECEIPTS = [
  {
    name: 'Uber Airport Ride ($34.50)',
    merchant: 'Uber Technologies',
    amount: 34.5,
    tax: 2.8,
    catHint: 'Travel',
    url: 'https://images.unsplash.com/photo-1554415707-9e49fa402e37?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Client Executive Dinner ($145.00)',
    merchant: 'The Capital Grille',
    amount: 145.0,
    tax: 12.5,
    catHint: 'Meals',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'AWS Cloud Hosting Invoice ($210.00)',
    merchant: 'Amazon Web Services',
    amount: 210.0,
    tax: 18.2,
    catHint: 'Software',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
  },
];

export const AiReceiptScanModal: React.FC<AiReceiptScanModalProps> = ({
  isOpen,
  onClose,
  categories,
  onApplyExtractedItem,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [base64Data, setBase64Data] = useState<string>('');
  const [extractedData, setExtractedData] = useState<any>(null);

  const scanMutation = useAiScanReceipt();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Data(reader.result as string);
      };
      reader.readAsDataURL(file);
      setExtractedData(null);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_RECEIPTS[0]) => {
    setPreviewUrl(sample.url);
    setSelectedFile(null);
    setBase64Data('');
    setExtractedData({
      merchant: sample.merchant,
      expenseDate: new Date().toISOString().split('T')[0],
      amount: sample.amount,
      taxAmount: sample.tax,
      currency: 'USD',
      description: `Receipt from ${sample.merchant}`,
      suggestedCategoryName: sample.catHint,
      confidence: 0.96,
      isAiExtracted: true,
    });
  };

  const handleScan = async () => {
    try {
      const res = await scanMutation.mutateAsync({
        receiptBase64: base64Data,
        receiptUrl: previewUrl,
        fileName: selectedFile?.name || 'receipt.jpg',
      });
      setExtractedData(res.extractedData);
    } catch {
      // Error handled by hook toast
    }
  };

  const handleApply = () => {
    if (!extractedData) return;

    // Resolve matching category
    let matchedCatId = '';
    if (extractedData.suggestedCategoryId) {
      matchedCatId = extractedData.suggestedCategoryId;
    } else if (extractedData.suggestedCategoryName) {
      const found = categories.find((c) =>
        new RegExp(extractedData.suggestedCategoryName, 'i').test(c.name)
      );
      if (found) matchedCatId = found._id;
    }
    if (!matchedCatId && categories.length > 0) {
      matchedCatId = categories[0]._id;
    }

    onApplyExtractedItem({
      merchant: extractedData.merchant || 'General Merchant',
      expenseDate: extractedData.expenseDate || new Date().toISOString().split('T')[0],
      amount: extractedData.amount || 0,
      taxAmount: extractedData.taxAmount || 0,
      description: extractedData.description || `Expense at ${extractedData.merchant}`,
      categoryId: matchedCatId,
      receiptUrl: previewUrl,
      receiptFileName: selectedFile?.name || 'receipt.jpg',
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Modal Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#ECE0D6] overflow-hidden flex flex-col max-h-[90vh] z-10"
          >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-orange-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">AI Receipt Scanner (OCR)</h3>
              <p className="text-xs text-slate-500">
                Auto-extract merchant, transaction date, taxes, and amounts
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* File Upload Zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Upload Receipt Image or Invoice
            </label>
            <label className="border-2 border-dashed border-slate-200 hover:border-orange-400 bg-slate-50/50 hover:bg-orange-50/20 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors text-center group">
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-orange-500 mb-2 transition-colors" />
              <p className="text-sm font-medium text-slate-700">
                Click to browse or drag and drop receipt
              </p>
              <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, or PDF up to 5MB</p>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Quick Demo Samples */}
          <div>
            <span className="text-xs font-medium text-slate-500 block mb-2">
              Or pick a sample receipt for testing:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {SAMPLE_RECEIPTS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className="px-2.5 py-2 text-left rounded-lg border border-slate-200 hover:border-orange-300 hover:bg-orange-50/40 text-xs text-slate-700 font-medium transition-colors"
                >
                  <Receipt className="w-3.5 h-3.5 text-orange-500 mb-1" />
                  <span className="line-clamp-1">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Preview & Action */}
          {previewUrl && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Receipt Preview</span>
                {!extractedData && (
                  <button
                    type="button"
                    onClick={handleScan}
                    disabled={scanMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium shadow-sm transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {scanMutation.isPending ? 'Analyzing Receipt...' : 'Analyze with AI'}
                  </button>
                )}
              </div>

              <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-100 max-h-48 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Receipt Preview"
                  className="max-h-48 w-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Extracted Card */}
          {extractedData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-900">
                    Receipt Details Extracted
                  </span>
                </div>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {Math.round((extractedData.confidence || 0.95) * 100)}% Confidence
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                  <span className="text-slate-400 block text-[11px]">Merchant</span>
                  <span className="font-semibold text-slate-800">{extractedData.merchant}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                  <span className="text-slate-400 block text-[11px]">Total Amount</span>
                  <span className="font-bold text-orange-600 text-sm">
                    ${Number(extractedData.amount).toFixed(2)}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                  <span className="text-slate-400 block text-[11px]">Date</span>
                  <span className="font-medium text-slate-800">{extractedData.expenseDate}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                  <span className="text-slate-400 block text-[11px]">Tax Amount</span>
                  <span className="font-medium text-slate-800">
                    ${Number(extractedData.taxAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!extractedData}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-40 rounded-lg shadow-sm transition-all"
          >
            <span>Apply to Claim Items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
);
};
