import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  Film,
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Upload,
  ArrowRight,
} from 'lucide-react';

interface EditorDashboardProps {
  onNavigateTab: (tab: any) => void;
  onSelectContent: (id: string) => void;
  onSelectTask: (id: string) => void;
}

export const EditorDashboard: React.FC<EditorDashboardProps> = ({
  onNavigateTab,
  onSelectContent,
  onSelectTask,
}) => {
  const { currentUser } = useAuth();
  const { filteredTasks, filteredContentItems, updateTaskStatus, toggleChecklistItem, clients } = useData();

  const myTasks = filteredTasks.filter((t) => t.assigned_to === currentUser?.id);
  const myContent = filteredContentItems.filter((c) => c.assigned_to === currentUser?.id);

  const activeTasks = myTasks.filter((t) => t.status !== 'completed');
  const completedTasks = myTasks.filter((t) => t.status === 'completed');

  const revisionItems = myContent.filter((c) => c.status === 'changes_requested');
  const inProductionItems = myContent.filter((c) => c.status === 'in_production');
  const completedItems = myContent.filter((c) => c.status === 'approved' || c.status === 'published');

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-100">
            Editor & Designer Studio
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Assigned video reels, motion graphics, cut revisions, and deliverable exports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('tasks')}
            className="rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors whitespace-nowrap"
          >
            My Task Board ({activeTasks.length})
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">Assigned Tasks</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-neutral-100">
            {activeTasks.length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">{completedTasks.length} completed</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">Active Deliverables</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-sky-400">
            {inProductionItems.length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">In video/motion production</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">Revisions Requested</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-rose-400">
            {revisionItems.length}
          </div>
          <div className="mt-1 text-[11px] text-rose-500/80">Requires client rework</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">Approved / Shipped</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-400">
            {completedItems.length}
          </div>
          <div className="mt-1 text-[11px] text-emerald-500/80">Client approved</div>
        </div>
      </div>

      {/* Urgent Revisions Warning banner if any */}
      {revisionItems.length > 0 && (
        <div className="rounded-xl border border-rose-800/60 bg-rose-950/20 p-4">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
            <AlertTriangle className="h-4 w-4" />
            <span>Client Revisions Requested ({revisionItems.length})</span>
          </div>
          <p className="mt-1 text-xs text-rose-300/80">
            The client has left feedback requiring adjustments. Check the comments, update the edit, and upload a new version.
          </p>
          <div className="mt-3 space-y-2">
            {revisionItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectContent(item.id)}
                className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors"
              >
                <span className="text-xs font-medium text-neutral-200">{item.title}</span>
                <span className="text-xs text-rose-400 flex items-center gap-1 font-medium">
                  Review Feedback <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Columns: Active Tasks & Deliverables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Tasks with Checklists */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-200">My Production Tasks</h2>
              <p className="text-[11px] text-neutral-400">Check off items as you complete stages</p>
            </div>
            <button
              onClick={() => onNavigateTab('tasks')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Kanban</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-4">
            {activeTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                You're all caught up! No pending tasks assigned.
              </div>
            ) : (
              activeTasks.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-neutral-800/80 bg-neutral-950/40 p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-200">{t.title}</span>
                    <StatusBadge status={t.status} type="task" />
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">{t.description}</p>

                  {/* Checklist items */}
                  {t.checklist && t.checklist.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {t.checklist.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer hover:text-white"
                        >
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() => toggleChecklistItem(t.id, item.id)}
                            className="rounded border-neutral-700 bg-neutral-900 text-amber-400 focus:ring-0 focus:ring-offset-0"
                          />
                          <span className={item.done ? 'line-through text-neutral-500' : ''}>
                            {item.text}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800/50 text-[11px]">
                    <span className="text-neutral-500">Due {t.due_date}</span>
                    <button
                      onClick={() => updateTaskStatus(t.id, 'completed')}
                      className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mark Completed
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assigned Content Deliverables */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-200">Assigned Deliverables</h2>
              <p className="text-[11px] text-neutral-400">Click to upload versions or view media brief</p>
            </div>
            <button
              onClick={() => onNavigateTab('content')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>All Content</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {myContent.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                No deliverables currently assigned.
              </div>
            ) : (
              myContent.map((c) => {
                const client = clients.find((cli) => cli.id === c.client_id);
                return (
                  <div
                    key={c.id}
                    onClick={() => onSelectContent(c.id)}
                    className="flex items-center justify-between gap-2 p-3 rounded-lg border border-neutral-800/80 bg-neutral-950/40 hover:bg-neutral-800/50 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-neutral-200 truncate">{c.title}</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5 truncate">
                        {client?.company_name} · {c.content_type.replace('_', ' ')} · Due {c.due_date}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={c.status} />
                      <ArrowRight className="h-3.5 w-3.5 text-neutral-600 hover:text-neutral-300" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
