import React, { useState } from 'react';
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
} from 'lucide-react';

interface TaskListProps {
  onOpenCreateTaskModal: () => void;
}

const TASK_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'review', label: 'Review' },
  { status: 'waiting', label: 'Waiting' },
  { status: 'completed', label: 'Completed' },
];

export const TaskList: React.FC<TaskListProps> = ({ onOpenCreateTaskModal }) => {
  const { filteredTasks, filteredProjects, profiles, updateTaskStatus, toggleChecklistItem } = useData();
  const { currentUser, role } = useAuth();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [mobileTaskStage, setMobileTaskStage] = useState<string>('all');

  const tasks = filteredTasks.filter((t) => {
    if (projectFilter !== 'all' && t.project_id !== projectFilter) return false;
    if (assigneeFilter !== 'all' && t.assigned_to !== assigneeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-100">
            Task Execution Board
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Production checklist items, video cut milestones, and sub-deliverables
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'list' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          {role !== 'client' && role !== 'viewer' && (
            <button
              onClick={onOpenCreateTaskModal}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 focus:border-neutral-700 focus:outline-hidden"
          >
            <option value="all">All Projects ({filteredProjects.length})</option>
            {filteredProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_name}
              </option>
            ))}
          </select>

          {role !== 'client' && (
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 focus:border-neutral-700 focus:outline-hidden"
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
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-48 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:border-neutral-700 focus:outline-hidden"
          />
        </div>

        <div className="text-[11px] font-mono text-neutral-400 tabular-nums">
          {tasks.length} total tasks
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
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

                        return (
                          <div
                            key={t.id}
                            className="rounded-lg border border-neutral-800 bg-neutral-950 p-3.5 space-y-2 hover:border-neutral-700 transition-colors shadow-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-neutral-400 font-medium line-clamp-1 truncate max-w-[140px]">
                                {project?.project_name}
                              </span>
                              <StatusBadge status={t.priority} type="priority" />
                            </div>

                            <h4 className="text-xs font-semibold text-neutral-200 leading-snug">
                              {t.title}
                            </h4>

                            {t.description && (
                              <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                                {t.description}
                              </p>
                            )}

                            {/* Checklist mini progress */}
                            {t.checklist && t.checklist.length > 0 && (
                              <div className="space-y-1 pt-1">
                                {t.checklist.map((item) => (
                                  <label
                                    key={item.id}
                                    className="flex items-center gap-1.5 text-[11px] text-neutral-400 cursor-pointer hover:text-white"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={item.done}
                                      onChange={() => toggleChecklistItem(t.id, item.id)}
                                      className="rounded border-neutral-700 bg-neutral-900 text-amber-400 focus:ring-0"
                                    />
                                    <span className={item.done ? 'line-through text-neutral-600' : ''}>
                                      {item.text}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-neutral-800/70 text-[10px] text-neutral-500">
                              <span>Due {t.due_date}</span>
                              <span>{assigned?.full_name?.split(' ')[0] || 'Unassigned'}</span>
                            </div>

                            {/* Status changer buttons */}
                            {role !== 'client' && (
                              <div className="pt-1 flex gap-1">
                                <select
                                  value={t.status}
                                  onChange={(e) => updateTaskStatus(t.id, e.target.value as TaskStatus)}
                                  className="w-full rounded border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-[11px] text-neutral-300 focus:border-amber-400 focus:outline-hidden"
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

                return (
                  <div key={t.id} className="p-4 space-y-2.5 hover:bg-neutral-800/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-neutral-200 leading-snug">
                          {t.title}
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5 truncate">
                          {project?.project_name}
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
                      <div>Assigned: <span className="text-neutral-300">{assigned?.full_name || 'Unassigned'}</span></div>
                      <div className="font-mono text-neutral-400">Due {t.due_date}</div>
                    </div>

                    {role !== 'client' && (
                      <div className="pt-1">
                        <select
                          value={t.status}
                          onChange={(e) => updateTaskStatus(t.id, e.target.value as TaskStatus)}
                          className="w-full rounded border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-300 focus:border-amber-400 focus:outline-hidden"
                        >
                          {TASK_COLUMNS.map((tc) => (
                            <option key={tc.status} value={tc.status}>
                              Update Status: {tc.label}
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

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead className="border-b border-neutral-800 bg-neutral-950/80 text-[11px] uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Task</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Assignee</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-neutral-500">
                      No matching tasks found.
                    </td>
                  </tr>
                ) : (
                  tasks.map((t) => {
                    const project = filteredProjects.find((p) => p.id === t.project_id);
                    const assigned = profiles.find((p) => p.id === t.assigned_to);

                    return (
                      <tr key={t.id} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-neutral-200">{t.title}</td>
                        <td className="px-4 py-3 text-neutral-400">{project?.project_name}</td>
                        <td className="px-4 py-3 text-neutral-300">{assigned?.full_name || 'Unassigned'}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={t.priority} type="priority" />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={t.status} type="task" />
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-neutral-400 tabular-nums">
                          {t.due_date}
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
