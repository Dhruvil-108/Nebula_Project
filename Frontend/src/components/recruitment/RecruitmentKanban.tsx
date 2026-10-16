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
import {
  GripVertical,
  Star,
  Building2,
  FileText,
  Briefcase,
  Mail,
  UserCheck,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useMoveCandidateStage } from '../../hooks/useRecruitment';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { CandidateStagePill } from './CandidateStagePill';
import {
  CANDIDATE_STAGES,
  STAGE_LABELS,
  type Candidate,
  type CandidateStage,
  type RecruitmentPipelinePayload,
} from '../../types/recruitment';

// ── Candidate card ──
interface CandidateCardProps {
  candidate: Candidate;
  dragging?: boolean;
  onSelect?: (candidate: Candidate) => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  dragging = false,
  onSelect,
}) => {
  const jobTitle =
    typeof candidate.jobOpeningId === 'object' && candidate.jobOpeningId
      ? candidate.jobOpeningId.title
      : 'Open Position';

  return (
    <div
      onClick={() => onSelect?.(candidate)}
      className={clsx(
        'rounded-xl border bg-white p-3 space-y-2.5 transition-all text-left cursor-pointer group',
        dragging
          ? 'shadow-2xl border-[#f97316] ring-2 ring-[#f97316]/20 rotate-1'
          : 'border-[#ECE0D6] hover:border-[#fed7aa] hover:shadow-md shadow-2xs'
      )}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-start gap-1.5 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-[#C9C2B8] group-hover:text-[#f97316] flex-shrink-0 mt-0.5 transition-colors" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#1A1A1A] leading-snug truncate group-hover:text-[#ea580c] transition-colors">
              {candidate.fullName}
            </p>
            <p className="text-[10px] font-mono text-[#9B9B9B]">{candidate.candidateCode}</p>
          </div>
        </div>
        {candidate.rating > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 flex-shrink-0">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            {candidate.rating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="pl-5 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] text-[#4A4A4A] truncate">
          <Briefcase className="w-3 h-3 text-[#9B9B9B] flex-shrink-0" />
          <span className="truncate">{jobTitle}</span>
        </div>

        {candidate.currentCompany && (
          <div className="flex items-center gap-1.5 text-[10.5px] text-[#6B6B6B] truncate">
            <Building2 className="w-3 h-3 text-[#9B9B9B] flex-shrink-0" />
            <span className="truncate">
              {candidate.currentDesignation ? `${candidate.currentDesignation} at ` : ''}
              {candidate.currentCompany}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pl-5 pt-1 border-t border-[#F5EFE8] text-[10px] text-[#6B6B6B]">
        <div className="flex items-center gap-1.5 truncate">
          {candidate.totalExperienceYears > 0 && (
            <span className="bg-[#FAF7F2] border border-[#ECE0D6] px-1.5 py-0.5 rounded font-medium">
              {candidate.totalExperienceYears}y exp
            </span>
          )}
          {candidate.resumeUrl && (
            <span className="inline-flex items-center gap-0.5 text-[#2563eb] bg-blue-50 px-1 py-0.5 rounded border border-blue-200/60" title="Resume attached">
              <FileText className="w-2.5 h-2.5" />
              CV
            </span>
          )}
        </div>

        {candidate.convertedEmployeeId ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            <UserCheck className="w-2.5 h-2.5" />
            Hired
          </span>
        ) : (
          <span className="font-mono text-[10px] text-[#9B9B9B]">
            {new Date(candidate.updatedAt || candidate.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>
    </div>
  );
};

// ── Draggable card wrapper ──
const DraggableCandidateCard: React.FC<{
  candidate: Candidate;
  onSelect?: (candidate: Candidate) => void;
}> = ({ candidate, onSelect }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: candidate._id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={clsx(isDragging && 'opacity-25')}
    >
      <CandidateCard candidate={candidate} onSelect={onSelect} />
    </div>
  );
};

// ── Column ──
interface KanbanColumnProps {
  stage: CandidateStage;
  candidates: Candidate[];
  canEdit: boolean;
  onSelectCandidate?: (candidate: Candidate) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage,
  candidates,
  canEdit,
  onSelectCandidate,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${stage}` });

  return (
    <div className="flex flex-col flex-shrink-0 w-72 rounded-2xl border border-[#ECE0D6] bg-[#FBF8F4] overflow-hidden shadow-2xs">
      {/* Column Header */}
      <div className="px-3.5 pt-3.5 pb-2.5 border-b border-[#ECE0D6] bg-white/70 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <CandidateStagePill stage={stage} size="sm" />
          <span className="text-[11px] font-mono font-semibold text-[#6B6B6B] bg-[#FAF7F2] border border-[#ECE0D6] px-2 py-0.5 rounded-full">
            {candidates.length}
          </span>
        </div>
      </div>

      {/* Droppable card stack */}
      <div
        ref={setNodeRef}
        className={clsx(
          'flex-1 space-y-2 p-2.5 min-h-[300px] max-h-[calc(100vh-280px)] overflow-y-auto transition-colors',
          canEdit && isOver && 'bg-[#fff7ed] ring-2 ring-[#f97316]/30 ring-inset'
        )}
      >
        {candidates.map((cand) => (
          <DraggableCandidateCard
            key={cand._id}
            candidate={cand}
            onSelect={onSelectCandidate}
          />
        ))}

        {candidates.length === 0 && (
          <div className="flex flex-col items-center justify-center h-28 border border-dashed border-[#ECE0D6] rounded-xl text-center p-3">
            <p className="text-[11px] text-[#9B9B9B]">No applicants</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Kanban Board ──
interface RecruitmentKanbanProps {
  payload: RecruitmentPipelinePayload;
  onSelectCandidate?: (candidate: Candidate) => void;
}

export const RecruitmentKanban: React.FC<RecruitmentKanbanProps> = ({
  payload,
  onSelectCandidate,
}) => {
  const { can } = useModuleAccess('recruitment');
  const canEdit = can('edit');

  const moveStageMutation = useMoveCandidateStage();
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const candidateMap = useMemo(() => {
    const map = new Map<string, Candidate>();
    for (const list of Object.values(payload.pipeline)) {
      for (const cand of list) {
        map.set(cand._id, cand);
      }
    }
    return map;
  }, [payload.pipeline]);

  const activeCandidate = activeCandidateId ? candidateMap.get(activeCandidateId) : null;

  const handleDragStart = (e: DragStartEvent) => {
    if (!canEdit) return;
    setActiveCandidateId(String(e.active.id));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveCandidateId(null);
    if (!over || !canEdit) return;

    const candidateId = String(active.id);
    const overId = String(over.id);
    if (!overId.startsWith('stage-')) return;

    const targetStage = overId.replace('stage-', '') as CandidateStage;
    const current = candidateMap.get(candidateId);
    if (!current || current.stage === targetStage) return;

    moveStageMutation.mutate({
      id: candidateId,
      stage: targetStage,
      note: `Moved via ATS Kanban board to ${STAGE_LABELS[targetStage]}`,
    });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3.5 overflow-x-auto pb-4 pt-1 select-none">
        {CANDIDATE_STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            candidates={payload.pipeline[stage] || []}
            canEdit={canEdit}
            onSelectCandidate={onSelectCandidate}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeCandidate ? <CandidateCard candidate={activeCandidate} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
};
