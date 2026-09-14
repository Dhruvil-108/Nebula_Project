import React from 'react';
import { motion } from 'framer-motion';
import { Kanban } from 'lucide-react';
import { KanbanBoard } from '../../components/crm/KanbanBoard';
import { usePipeline } from '../../hooks/useCrm';

export const PipelinePage: React.FC = () => {
  const { data: pipeline, isLoading } = usePipeline();

  const totalValue = pipeline
    ? Object.values(pipeline)
        .flat()
        .filter((d) => d.stage !== 'won' && d.stage !== 'lost')
        .reduce((sum, d) => sum + (d.amount || 0), 0)
    : 0;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1800px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Pipeline</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Drag deal cards between stages — changes save automatically.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#ECE0D6]">
          <Kanban className="w-4 h-4 text-[#C2540C]" />
          <span className="text-xs text-[#6B6B6B]">Open pipeline value</span>
          <span className="text-sm font-bold text-[#C2540C] font-mono">${totalValue.toLocaleString()}</span>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
        <KanbanBoard pipeline={pipeline} isLoading={isLoading} />
      </motion.div>
    </div>
  );
};

export default PipelinePage;
