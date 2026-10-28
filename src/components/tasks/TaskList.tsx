import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Task, TaskStatus } from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import {
  CheckSquare,
  Plus,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  User,
  FolderKanban,
  Check,
  Film,
  AlertTriangle,
  RotateCcw,
  Trash2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface TaskListProps {
  onOpenCreateTaskModal: () => void;
  onSelectContent?: (id: string) => void;
  onSelectProject?: (id: string) => void;
  onOpenVersionModal?: (id: string) => void;
}

const TASK_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'review', label: 'Review' },
  { status: 'waiting', label: 'Waiting' },
  { status: 'completed', label: 'Completed' },
];

export const TaskList: React.FC<TaskListProps> = ({
  onOpenCreateTaskModal,
  onSelectContent,
  onSelectProject,
  onOpenVersionModal,
}) => {
  const {
    filteredTasks,
    filteredProjects,
    contentItems,
    profiles,
    updateTaskStatus,
    toggleChecklistItem,
    deleteTask,
    syncTasksWithSystem,
  } = useData();
  const { currentUser, role } = useAuth();

  const isStaffRole =
    role !== 'super_admin' && role !== 'project_manager' && role !== 'client' && role !== 'viewer';

  // Primary Scope Tab: "my" (My Tasks), "all" (All Team Tasks), "revisions" (Client Revisions)
  const [scopeTab, setScopeTab] = useState<'my' | 'all' | 'revisions'>(isStaffRole ? 'my' : 'all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [mobileTaskStage, setMobileTaskStage] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const handleSyncTasks = async () => {
    setIsSyncing(true);
    setSyncNotice(null);
    try {
      const added = await syncTasksWithSystem();
      setSyncNotice(
        added > 0
          ? `Synced ${added} deliverable & project task${added === 1 ? '' : 's'}!`
          : 'All deliverables & projects are up to date!'
      );
      setTimeout(() => setSyncNotice(null), 4000);
    } catch {
      setSyncNotice('Task sync completed.');
      setTimeout(() => setSyncNotice(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Metrics for tabs
  const myTasksCount = useMemo(() => {
    if (!currentUser) return 0;
    return filteredTasks.filter((t) => t.assigned_to === currentUser.id && t.status !== 'completed').length;
  }, [filteredTasks, currentUser]);

  const revisionsCount = useMemo(() => {
    return filteredTasks.filter((t) => t.title.startsWith('[Client Revision]') && t.status !== 'completed').length;
  }, [filteredTasks]);

  // Filter tasks based on selected scope and filters
  const tasks = useMemo(() => {
    return filteredTasks.filter((t) => {
      // 1. Primary scope tab
      if (scopeTab === 'my') {
        if (currentUser && t.assigned_to !== currentUser.id) return false;
      } else if (scopeTab === 'revisions') {
        if (!t.title.startsWith('[Client Revision]') && t.priority !== 'urgent') return false;
      }

      // 2. Project filter
      if (projectFilter !== 'all' && t.project_id !== projectFilter) return false;

      // 3. Assignee filter (active in "all" or "revisions")
      if (assigneeFilter !== 'all' && t.assigned_to !== assigneeFilter) return false;

      // 4. Search query
      if (search) {
        const q = search.toLowerCase();
        return t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
      }

      return true;
    });
  }, [filteredTasks, scopeTab, projectFilter, assigneeFilter, search, currentUser]);

  return (
    <div className="space-y-6">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-100">
              Task Execution Board
            </h1>
            <span className="rounded-md bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-400/20">
              Auto-Synced
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Production checklist items, deliverable milestones, client revisions, and assigned project responsibilities
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sync Deliverables Button */}
          <button
            onClick={handleSyncTasks}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-200 hover:text-white hover:border-neutral-600 transition-colors disabled:opacity-50"
            title="Scan all deliverables and projects to synchronize missing tasks"
          >
            <RotateCcw className={`h-3.5 w-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Deliverables'}</span>
          </button>

          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Kanban Board View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'list' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Table / List View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          {role !== 'client' && role !== 'viewer' && (
            <button
              onClick={onOpenCreateTaskModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors whitespace-nowrap shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Banner Notification if fired */}
      {syncNotice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-2.5 text-xs text-emerald-300 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{syncNotice}</span>
          </div>
          <button
            onClick={() => setSyncNotice(null)}
            className="text-emerald-400 hover:text-emerald-200 text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Scope Tabs (My Tasks vs All Team Tasks vs Client Revisions) */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-1">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => {
              setScopeTab('my');
              setAssigneeFilter('all');
            }}
            className={`flex items-center gap-2 pb-2.5 px-1 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              scopeTab === 'my'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>My Tasks</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono tabular-nums ${
                scopeTab === 'my' ? 'bg-amber-400/20 text-amber-300' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {myTasksCount}
            </span>
          </button>

          <button
            onClick={() => setScopeTab('all')}
            className={`flex items-center gap-2 pb-2.5 px-1 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              scopeTab === 'all'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <span>All Team Tasks</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono tabular-nums ${
                scopeTab === 'all' ? 'bg-amber-400/20 text-amber-300' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {filteredTasks.length}
            </span>
          </button>

          {revisionsCount > 0 && (
            <button
              onClick={() => setScopeTab('revisions')}
              className={`flex items-center gap-2 pb-2.5 px-1 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                scopeTab === 'revisions'
                  ? 'border-rose-400 text-rose-400'
                  : 'border-transparent text-rose-400/70 hover:text-rose-300'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span>Client Revisions</span>
              <span className="rounded-full bg-rose-500/20 px-1.5 py-0.2 text-[10px] font-mono tabular-nums text-rose-300 font-bold border border-rose-500/30">
                {revisionsCount}
              </span>
            </button>
          )}
        </div>

        <div className="hidden sm:block text-[11px] font-mono text-neutral-400 tabular-nums">
          Showing {tasks.length} task{tasks.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 focus:border-amber-400 focus:outline-hidden"
          >
            <option value="all">All Projects ({filteredProjects.length})</option>
            {filteredProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_name}
              </option>
            ))}
          </select>

          {scopeTab !== 'my' && role !== 'client' && (
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 focus:border-amber-400 focus:outline-hidden"
            >
              <option value="all">All Assignees</option>
              {profiles
                .filter((p) => p.role !== 'client' && p.role !== 'viewer')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
            </select>
          )}

          <input
            type="text"
            placeholder="Search tasks, deliverables, briefs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-60 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:border-amber-400 focus:outline-hidden"
          />
        </div>

        <div className="text-[11px] font-mono text-neutral-400 tabular-nums sm:hidden">
          {tasks.length} tasks
        </div>
      </div>

      {/* Mobile Stage Selector for Kanban */}
      {viewMode === 'kanban' && (
        <div className="md:hidden space-y-2">
          <div className="text-[11px] font-medium text-neutral-400 flex items-center justify-between">
            <span>Filter Task Status:</span>
            <span className="font-mono text-neutral-500">
              {mobileTaskStage === 'all'
                ? 'All Stages'
                : TASK_COLUMNS.find((c) => c.status === mobileTaskStage)?.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs -mx-1 px-1">
            <button
              onClick={() => setMobileTaskStage('all')}
              className={`rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors shrink-0 ${
                mobileTaskStage === 'all'
                  ? 'bg-amber-400 text-neutral-950 font-semibold shadow-xs'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              All Tasks ({tasks.length})
            </button>
            {TASK_COLUMNS.map((col) => {
              const count = tasks.filter((t) => t.status === col.status).length;
              return (
                <button
                  key={col.status}
                  onClick={() => setMobileTaskStage(col.status)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors shrink-0 flex items-center gap-1.5 ${
                    mobileTaskStage === col.status
                      ? 'bg-amber-400 text-neutral-950 font-semibold shadow-xs'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  <span>{col.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1 rounded ${
                      mobileTaskStage === col.status ? 'bg-neutral-950/20' : 'bg-neutral-800'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Kanban / List Display */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4 items-start">
          {TASK_COLUMNS.filter((col) => {
            if (mobileTaskStage !== 'all') {
              return col.status === mobileTaskStage;
            }
            return true;
          }).map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-3">
                    <span className="text-xs font-semibold text-neutral-200">{col.label}</span>
                    <span className="font-mono text-xs tabular-nums text-neutral-300 font-medium rounded bg-neutral-800 px-2 py-0.5">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {colTasks.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-neutral-800/70 p-4 text-center text-[11px] text-neutral-600">
                        No tasks in this stage
                      </div>
                    ) : (
                      colTasks.map((t) => {
                        const project = filteredProjects.find((p) => p.id === t.project_id);
                        const assigned = profiles.find((p) => p.id === t.assigned_to);
                        const linkedContent = t.content_id
                          ? contentItems.find((c) => c.id === t.content_id)
                          : null;
                        const isRevision = t.title.startsWith('[Client Revision]');

                        return (
                          <div
                            key={t.id}
                            className={`rounded-lg border p-3.5 space-y-2.5 transition-colors shadow-xs relative group ${
                              isRevision
                                ? 'border-rose-500/50 bg-rose-950/20 hover:border-rose-400'
                                : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                            }`}
                          >
                            {/* Header row: Project & Priority */}
                            <div className="flex items-center justify-between gap-1">
                              <span
                                onClick={() => onSelectProject && project && onSelectProject(project.id)}
                                className={`text-[10px] font-medium line-clamp-1 truncate max-w-[130px] ${
                                  onSelectProject ? 'cursor-pointer hover:text-amber-400 text-neutral-400' : 'text-neutral-500'
                                }`}
                              >
                                {project?.project_name || 'Project'}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <StatusBadge status={t.priority} type="priority" />
                                {role !== 'client' && (
                                  <button
                                    onClick={() => deleteTask(t.id)}
                                    title="Delete task"
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-500 hover:text-rose-400 transition-opacity"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Client Revision Alert Banner */}
                            {isRevision && (
                              <div className="rounded border border-rose-500/30 bg-rose-950/40 p-1.5 flex items-center justify-between gap-1 text-[10px] text-rose-300 font-semibold">
                                <div className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 text-rose-400 shrink-0" />
                                  <span>Client Revision Required</span>
                                </div>
                                {linkedContent && onSelectContent && (
                                  <button
                                    onClick={() => onSelectContent(linkedContent.id)}
                                    className="text-amber-300 hover:underline flex items-center gap-0.5"
                                  >
                                    <span>Cut</span>
                                    <ArrowRight className="h-2.5 w-2.5" />
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Linked Content Deliverable Pill */}
                            {linkedContent && (
                              <div
                                onClick={() => onSelectContent && onSelectContent(linkedContent.id)}
                                className={`flex items-center justify-between gap-1.5 rounded border border-neutral-800/80 bg-neutral-900/60 px-2 py-1 text-[10px] text-neutral-300 ${
                                  onSelectContent ? 'cursor-pointer hover:border-amber-400 hover:text-amber-300' : ''
                                }`}
                              >
                                <div className="flex items-center gap-1 truncate">
                                  <Film className="h-3 w-3 text-amber-400 shrink-0" />
                                  <span className="truncate">{linkedContent.title}</span>
                                </div>
                                <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-mono shrink-0">
                                  {linkedContent.platform}
                                </span>
                              </div>
                            )}

                            {/* Task Title */}
                            <h4 className="text-xs font-semibold text-neutral-200 leading-snug">
                              {t.title}
                            </h4>

                            {t.description && (
                              <p className="text-[11px] text-neutral-400 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                                {t.description}
                              </p>
                            )}

                            {/* Checklist mini progress */}
                            {t.checklist && t.checklist.length > 0 && (
                              <div className="space-y-1 pt-1 bg-neutral-900/40 p-2 rounded border border-neutral-800/60">
                                {t.checklist.map((item) => (
                                  <label
                                    key={item.id}
                                    className="flex items-center gap-1.5 text-[11px] text-neutral-300 cursor-pointer hover:text-white"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={item.done}
                                      onChange={() => toggleChecklistItem(t.id, item.id)}
                                      className="rounded border-neutral-700 bg-neutral-900 text-amber-400 focus:ring-0"
                                    />
                                    <span className={item.done ? 'line-through text-neutral-500' : ''}>
                                      {item.text}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {/* Footer: Due date & Assignee */}
                            <div className="flex items-center justify-between pt-2 border-t border-neutral-800/70 text-[10px] text-neutral-400">
                              <span className="font-mono">Due {t.due_date}</span>
                              <span className="flex items-center gap-1 font-medium text-neutral-300">
                                <User className="h-2.5 w-2.5 text-neutral-500" />
                                <span>{assigned?.full_name?.split(' ')[0] || 'Unassigned'}</span>
                              </span>
                            </div>

                            {/* Quick Action Shortcut for Deliverables */}
                            {linkedContent && onSelectContent && (
                              <div className="pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => onSelectContent(linkedContent.id)}
                                  className="w-full text-center rounded border border-neutral-800 bg-neutral-900/80 px-2 py-1 text-[10px] font-medium text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors flex items-center justify-center gap-1"
                                >
                                  <span>Open Deliverable Desk</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </button>
                              </div>
                            )}

                            {/* Status changer select */}
                            {role !== 'client' && (
                              <div className="pt-1">
                                <select
                                  value={t.status}
                                  onChange={(e) => updateTaskStatus(t.id, e.target.value as TaskStatus)}
                                  className="w-full rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-[11px] text-neutral-300 focus:border-amber-400 focus:outline-hidden"
                                >
                                  {TASK_COLUMNS.map((tc) => (
                                    <option key={tc.status} value={tc.status}>
                                      Move to: {tc.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View (Desktop table + Mobile cards) */
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-neutral-800/60">
            {tasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                No matching tasks found.
              </div>
            ) : (
              tasks.map((t) => {
                const project = filteredProjects.find((p) => p.id === t.project_id);
                const assigned = profiles.find((p) => p.id === t.assigned_to);
                const linkedContent = t.content_id
                  ? contentItems.find((c) => c.id === t.content_id)
                  : null;
                const isRevision = t.title.startsWith('[Client Revision]');

                return (
                  <div key={t.id} className="p-4 space-y-2.5 hover:bg-neutral-800/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {isRevision && (
                          <div className="inline-flex items-center gap-1 rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-300 border border-rose-500/30 mb-1">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            <span>Client Revision</span>
                          </div>
                        )}
                        <div className="text-xs font-semibold text-neutral-200 leading-snug">
                          {t.title}
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5 truncate flex items-center gap-1.5">
                          <span>{project?.project_name}</span>
                          {linkedContent && (
                            <>
                              <span>·</span>
                              <button
                                onClick={() => onSelectContent && onSelectContent(linkedContent.id)}
                                className="text-amber-400 hover:underline flex items-center gap-0.5 truncate"
                              >
                                <Film className="h-3 w-3 inline" />
                                <span>{linkedContent.title}</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StatusBadge status={t.priority} type="priority" />
                        <StatusBadge status={t.status} type="task" />
                      </div>
                    </div>

                    {t.description && (
                      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                        {t.description}
                      </p>
                    )}

                    {/* Checklist */}
                    {t.checklist && t.checklist.length > 0 && (
                      <div className="space-y-1.5 pt-1 bg-neutral-950/40 p-2.5 rounded-lg border border-neutral-800/50">
                        {t.checklist.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer hover:text-white"
                          >
                            <input
                              type="checkbox"
                              checked={item.done}
                              onChange={() => toggleChecklistItem(t.id, item.id)}
                              className="rounded border-neutral-700 bg-neutral-900 text-amber-400 focus:ring-0"
                            />
                            <span className={item.done ? 'line-through text-neutral-500' : ''}>
                              {item.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-800/60">
                      <div>
                        Assigned: <span className="text-neutral-300">{assigned?.full_name || 'Unassigned'}</span>
                      </div>
                      <div className="font-mono text-neutral-400">Due {t.due_date}</div>
                    </div>

                    {role !== 'client' && (
                      <div className="flex items-center gap-2 pt-1">
                        <select
                          value={t.status}
                          onChange={(e) => updateTaskStatus(t.id, e.target.value as TaskStatus)}
                          className="flex-1 rounded border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-300 focus:border-amber-400 focus:outline-hidden"
                        >
                          {TASK_COLUMNS.map((tc) => (
                            <option key={tc.status} value={tc.status}>
                              Update Status: {tc.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => deleteTask(t.id)}
                          className="p-1.5 rounded border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-rose-400"
                          title="Delete task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="border-b border-neutral-800 bg-neutral-950/80 text-[11px] uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 font-medium">Associated Scope</th>
                  <th className="px-4 py-3 font-medium">Assignee</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-neutral-500">
                      No matching tasks found.
                    </td>
                  </tr>
                ) : (
                  tasks.map((t) => {
                    const project = filteredProjects.find((p) => p.id === t.project_id);
                    const assigned = profiles.find((p) => p.id === t.assigned_to);
                    const linkedContent = t.content_id
                      ? contentItems.find((c) => c.id === t.content_id)
                      : null;
                    const isRevision = t.title.startsWith('[Client Revision]');

                    return (
                      <tr key={t.id} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-neutral-200">
                          <div className="space-y-0.5">
                            {isRevision && (
                              <span className="inline-flex items-center gap-1 rounded bg-rose-500/20 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-rose-300 border border-rose-500/30 mr-1.5">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                Revision
                              </span>
                            )}
                            <span className="font-semibold text-neutral-100">{t.title}</span>
                            {t.description && (
                              <div className="text-[11px] text-neutral-400 line-clamp-1">
                                {t.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-300">
                          <div className="space-y-0.5">
                            <div className="font-medium">{project?.project_name || 'Project'}</div>
                            {linkedContent && (
                              <button
                                onClick={() => onSelectContent && onSelectContent(linkedContent.id)}
                                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 truncate max-w-[180px]"
                              >
                                <Film className="h-3 w-3" />
                                <span className="truncate">{linkedContent.title}</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-300">
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-[10px] text-amber-400 font-bold">
                              {assigned?.full_name?.charAt(0) || '?'}
                            </div>
                            <span>{assigned?.full_name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={t.priority} type="priority" />
                        </td>
                        <td className="px-4 py-3">
                          {role !== 'client' ? (
                            <select
                              value={t.status}
                              onChange={(e) => updateTaskStatus(t.id, e.target.value as TaskStatus)}
                              className="rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-200 focus:border-amber-400 focus:outline-hidden"
                            >
                              {TASK_COLUMNS.map((tc) => (
                                <option key={tc.status} value={tc.status}>
                                  {tc.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <StatusBadge status={t.status} type="task" />
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-neutral-400 tabular-nums">
                          {t.due_date}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {linkedContent && onSelectContent && (
                              <button
                                onClick={() => onSelectContent(linkedContent.id)}
                                className="rounded p-1 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
                                title="Open deliverable preview"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {role !== 'client' && (
                              <button
                                onClick={() => deleteTask(t.id)}
                                className="rounded p-1 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                                title="Delete task"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
