import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, Download, Printer } from 'lucide-react';

interface ItemQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  code: string;
  subtitle?: string;
  qrDataUrl?: string;
}

export const ItemQrModal: React.FC<ItemQrModalProps> = ({
  isOpen,
  onClose,
  title,
  code,
  subtitle,
  qrDataUrl,
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `qrcode-${code}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (!qrDataUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Label - ${code}</title>
          <style>
            body { font-family: monospace; text-align: center; padding: 20px; }
            .card { border: 2px dashed #000; padding: 20px; display: inline-block; border-radius: 8px; }
            h2 { margin: 0 0 8px 0; font-size: 18px; }
            p { margin: 4px 0; font-size: 13px; color: #555; }
            img { width: 220px; height: 220px; margin: 12px 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>${code}</h2>
            <p>${title}</p>
            <img src="${qrDataUrl}" />
            <p>${subtitle || 'Nebula HUB Inventory Master'}</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-sm rounded-2xl bg-white border border-slate-200/90 shadow-xl overflow-hidden z-10 p-6 text-center"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 rounded-xl bg-orange-100/70 border border-orange-200/60 text-orange-600 flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-slate-900 tracking-tight">{code}</h3>
          <p className="text-sm font-medium text-slate-600 mt-0.5 truncate">{title}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}

          <div className="my-5 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code for ${code}`}
                className="w-48 h-48 rounded-lg shadow-2xs"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs font-mono">
                Generating QR...
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!qrDataUrl}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 shadow-2xs transition-all disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Download PNG
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!qrDataUrl}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-2xs transition-all disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Label
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
