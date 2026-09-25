import React, { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { motion } from 'framer-motion';
import { GripVertical, Timer } from 'lucide-react';
import { clsx } from 'clsx';
import { useMoveDealStage } from '../../hooks/useCrm';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { StagePill } from './StagePill';
import { PIPELINE_STAGES, STAGE_LABELS, type Deal, type DealPipeline } from '../../types/crm';

// ── Deal card ──
interface DealCardProps {
  deal: Deal;
  dragging?: boolean;
}

const DealCard: React.FC<DealCardProps> = ({ deal, dragging = false }) => (
  <div
    className={clsx(
      'rounded-xl border bg-white p-3 space-y-2 transition-shadow',
      dragging ? 'shadow-2xl border-[#f97316] rotate-1' : 'border-[#ECE0D6] hover:border-[#fed7aa] shadow-sm'
    )}
  >
    <div className="flex items-start gap-1.5">
      <GripVertical className="w-3.5 h-3.5 text-[#C9C2B8] flex-shrink-0 mt-0.5" />
      <p className="text-xs font-semibold text-[#1A1A1A] leading-snug break-words">{deal.dealName}</p>
    </div>
    {deal.companyId && (
      <p className="text-[10px] text-[#6B6B6B] pl-5 truncate">{deal.companyId.name}</p>
    )}
    <div className="flex items-center justify-between pl-5">
      <span className="text-sm font-bold text-[#f97316] font-mono">
        ${deal.amount.toLocaleString()}
      </span>
      <span className="text-[10px] font-medium text-[#6B6B6B] bg-[#fff7ed] px-1.5 py-0.5 rounded">
        {deal.probability}%
      </span>
    </div>
    {deal.expectedCloseDate && (
      <p className="text-[10px] text-[#9B9B9B] pl-5 flex items-center gap-1">
        <Timer className="w-3 h-3" />
        {new Date(deal.expectedCloseDate).toLocaleDateString()}
      </p>
    )}
  </div>
);

// ── Draggable card wrapper ──
const DraggableDealCard: React.FC<{ deal: Deal }> = ({ deal }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal._id });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={clsx(isDragging && 'opacity-30')}>
      <DealCard deal={deal} />
    </div>
  );
};

// ── Column ──
interface KanbanColumnProps {
  stage: (typeof PIPELINE_STAGES)[number];
  deals: Deal[];
  canEdit: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ stage, deals, canEdit }) => {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage}` });
  const totalValue = deals.reduce((sum, d) => sum + (d.amount || 0), 0);

  return (
    <div className="flex flex-col flex-shrink-0 w-64 rounded-2xl border border-[#ECE0D6] bg-[#FBF8F4]">
      {/* Header: count + total value */}
      <div className="px-3.5 pt-3.5 pb-2.5 border-b border-[#ECE0D6]">
        <div className="flex items-center justify-between mb-1.5">
          <StagePill stage={stage} />
          <span className="text-[10px] font-mono text-[#6B6B6B] bg-white border border-[#ECE0D6] px-1.5 py-0.5 rounded">
            {deals.length}
          </span>
        </div>
        <p className="text-xs font-semibold text-[#1A1A1A] font-mono">${totalValue.toLocaleString()}</p>
      </div>

      {/* Droppable card stack */}
      <div
        ref={setNodeRef}
        className={clsx(
          'flex-1 space-y-2 p-2.5 min-h-[120px] rounded-b-2xl transition-colors',
          canEdit && isOver && 'bg-[#fff7ed] ring-2 ring-[#f97316]/30 ring-inset'
        )}
      >
        {deals.map((deal) =>
          canEdit ? (
            <DraggableDealCard key={deal._id} deal={deal} />
          ) : (
            <DealCard key={deal._id} deal={deal} />
          )
        )}
        {deals.length === 0 && (
          <p className="text-[10px] text-[#C9C2B8] text-center py-6 italic">
            {canEdit ? 'Drop deals here' : 'No deals in this stage'}
          </p>
        )}
      </div>
    </div>
  );
};

// ── Board ──
interface KanbanBoardProps {
  pipeline: DealPipeline | undefined;
  isLoading: boolean;
  onDealClick?: (deal: Deal) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ pipeline, isLoading, onDealClick }) => {
  const { can } = useModuleAccess('crm');
  const canEdit = can('edit');

  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const moveStage = useMoveDealStage();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const stages = useMemo(() => PIPELINE_STAGES, []);

  const handleDragStart = (event: DragStartEvent) => {
    if (!canEdit) return;
    const dealId = String(event.active.id);
    const all = pipeline ? Object.values(pipeline).flat() : [];
    setActiveDeal(all.find((d) => d._id === dealId) || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDeal(null);
    if (!canEdit) return;
    const { active, over } = event;
    if (!over || !pipeline) return;

    const dealId = String(active.id);
    const overId = String(over.id);
    if (!overId.startsWith('stage-')) return;

    const toStage = overId.replace('stage-', '') as (typeof PIPELINE_STAGES)[number];
    const deal = Object.values(pipeline).flat().find((d) => d._id === dealId);
    if (!deal || deal.stage === toStage) return;

    moveStage.mutate({ dealId, fromStage: deal.stage, toStage });
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden">
        {stages.map((stage) => (
          <div key={stage} className="w-64 flex-shrink-0 rounded-2xl border border-[#ECE0D6] p-3 space-y-2.5 animate-pulse">
            <div className="h-6 w-20 rounded-full bg-[#fff7ed]" />
            <div className="h-4 w-24 rounded bg-[#fff7ed]" />
            <div className="h-20 rounded-xl bg-[#fff7ed]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn key={stage} stage={stage} deals={pipeline?.[stage] || []} canEdit={canEdit} />
        ))}
      </div>

      <DragOverlay>
        {activeDeal && <DealCard deal={activeDeal} dragging />}
      </DragOverlay>
    </DndContext>
  );
};

// Re-export label map for consumers that render stage headers manually
export { STAGE_LABELS };
