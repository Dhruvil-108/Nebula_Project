import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  StickyNote,
  Phone,
  Mail,
  CalendarClock,
  CheckSquare,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useLogActivity, useUpdateActivity } from '../../hooks/useCrm';
import type { Activity, ActivityType } from '../../types/crm';

const TYPE_CONFIG: Record<ActivityType, { icon: React.ReactNode; label: string; styles: string }> = {
  note: { icon: <StickyNote className="w-3.5 h-3.5" />, label: 'Note', styles: 'text-[#6B6B6B] bg-[#FBEAE0] border-[#ECE0D6]' },
  call: { icon: <Phone className="w-3.5 h-3.5" />, label: 'Call', styles: 'text-[#C2540C] bg-[#FBEAE0] border-[#F0D3BC]' },
  email: { icon: <Mail className="w-3.5 h-3.5" />, label: 'Email', styles: 'text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/25' },
  meeting: { icon: <CalendarClock className="w-3.5 h-3.5" />, label: 'Meeting', styles: 'text-[#B45309] bg-[#B45309]/10 border-[#B45309]/25' },
  task: { icon: <CheckSquare className="w-3.5 h-3.5" />, label: 'Task', styles: 'text-[#16A34A] bg-[#16A34A]/10 border-[#16A34A]/25' },
};

const ACTIVITY_TYPES: ActivityType[] = ['note', 'call', 'email', 'meeting', 'task'];

interface ActivityTimelineProps {
  relatedToType: 'lead' | 'contact' | 'company' | 'deal';
  relatedToId: string;
  activities: Activity[] | undefined;
  isLoading?: boolean;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  relatedToType,
  relatedToId,
  activities,
  isLoading = false,
}) => {
  const logMutation = useLogActivity();
  const updateMutation = useUpdateActivity();

  const [type, setType] = useState<ActivityType>('note');
  const [content, setContent] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    logMutation.mutate(
      {
        type,
        relatedToType,
        relatedToId,
        content: content.trim(),
        dueDate: type === 'task' && dueDate ? new Date(dueDate).toISOString() : null,
      },
      {
        onSuccess: () => {
          setContent('');
          setDueDate('');
        },
      }
    );
  };

  const toggleTask = (activity: Activity) => {
    updateMutation.mutate({
      id: activity._id,
      patch: { completedAt: activity.completedAt ? null : new Date().toISOString() },
    });
  };

  return (
    <div className="space-y-4">
      {/* ── Log form ── */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={clsx(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                type === t
                  ? TYPE_CONFIG[t].styles
                  : 'text-[#6B6B6B] bg-white border-[#ECE0D6] hover:border-[#DE7A3D]'
              )}
            >
              {TYPE_CONFIG[t].icon}
              {TYPE_CONFIG[t].label}
            </button>
          ))}
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            type === 'call'
              ? 'Call outcome, follow-up agreed...'
              : type === 'task'
                ? 'What needs to be done?'
                : 'Log details...'
          }
          rows={2}
          className="w-full rounded-lg border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#C2540C]/25 focus:border-[#C2540C] transition-all resize-none"
        />

        {type === 'task' && (
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-lg border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C2540C]/25 focus:border-[#C2540C] transition-all"
          />
        )}

        <button
          type="submit"
          disabled={!content.trim() || logMutation.isPending}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#C2540C] hover:bg-[#D06B28] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {logMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <StickyNote className="w-3.5 h-3.5" />}
          Log {TYPE_CONFIG[type].label}
        </button>
      </form>

      {/* ── Timeline ── */}
      <div className="border-t border-[#ECE0D6] pt-4">
        <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-3">
          Timeline {activities ? `(${activities.length})` : ''}
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-[#FBEAE0] animate-pulse" />
            ))}
          </div>
        ) : !activities || activities.length === 0 ? (
          <p className="text-xs text-[#9B9B9B] italic py-2">
            No activity logged yet. Notes, calls, emails, meetings, and tasks will appear here.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {activities.map((activity, idx) => {
              const cfg = TYPE_CONFIG[activity.type];
              const isTask = activity.type === 'task';
              return (
                <motion.div
                  key={activity._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3), duration: 0.25 }}
                  className="flex items-start gap-2.5"
                >
                  {/* Completion toggle for tasks / icon otherwise */}
                  {isTask ? (
                    <button
                      type="button"
                      onClick={() => toggleTask(activity)}
                      disabled={updateMutation.isPending}
                      className="mt-0.5 text-[#16A34A] hover:text-[#12813A] transition-colors disabled:opacity-50"
                      title={activity.completedAt ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {activity.completedAt ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                  ) : (
                    <span className={clsx('mt-0.5 flex-shrink-0 w-6 h-6 rounded-md border flex items-center justify-center', cfg.styles)}>
                      {cfg.icon}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={clsx('px-1.5 py-0.5 rounded text-[10px] font-semibold border', cfg.styles)}>
                        {cfg.label}
                      </span>
                      <span className="text-[11px] font-medium text-[#1A1A1A]">
                        {activity.createdBy?.fullName || 'Unknown'}
                      </span>
                      <span className="text-[10px] text-[#9B9B9B] font-mono">
                        {new Date(activity.createdAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p
                      className={clsx(
                        'text-xs mt-1 leading-relaxed whitespace-pre-wrap break-words',
                        isTask && activity.completedAt ? 'text-[#9B9B9B] line-through' : 'text-[#1A1A1A]'
                      )}
                    >
                      {activity.content}
                    </p>
                    {isTask && activity.dueDate && (
                      <p className="text-[10px] text-[#B45309] mt-0.5 font-medium">
                        Due: {new Date(activity.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
