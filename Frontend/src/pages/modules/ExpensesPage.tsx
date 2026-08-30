import React from 'react';
import { motion } from 'framer-motion';
import { Receipt, ArrowRight } from 'lucide-react';

const ExpensesPage: React.FC = () => (
  <div className="flex items-center justify-center min-h-[70vh] px-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-md"
    >
      <div className="relative mb-8 inline-block">
        <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full" />
        <div className="relative w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto">
          <Receipt className="w-9 h-9 text-cyan-400" />
        </div>
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
        Coming Soon
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Expense Management</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        Submit expense claims, upload receipts, track budgets by department, and approve reimbursements with a full audit trail.
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
        <ArrowRight className="w-4 h-4" />
        Claims · Approvals · Budgets · Reports
      </div>
    </motion.div>
  </div>
);

export default ExpensesPage;
