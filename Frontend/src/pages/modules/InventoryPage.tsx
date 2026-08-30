import React from 'react';
import { motion } from 'framer-motion';
import { Package, ArrowRight } from 'lucide-react';

const InventoryPage: React.FC = () => (
  <div className="flex items-center justify-center min-h-[70vh] px-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-md"
    >
      <div className="relative mb-8 inline-block">
        <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full" />
        <div className="relative w-20 h-20 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto">
          <Package className="w-9 h-9 text-orange-400" />
        </div>
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-4">
        Coming Soon
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Inventory Management</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        Track stock levels across warehouses, set reorder thresholds, manage purchase orders, and get instant low-stock alerts.
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
        <ArrowRight className="w-4 h-4" />
        Products · Stock · Purchase Orders · Alerts
      </div>
    </motion.div>
  </div>
);

export default InventoryPage;
