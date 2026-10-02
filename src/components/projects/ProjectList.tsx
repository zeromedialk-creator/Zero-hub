import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ProjectStatus, Priority } from '../../types/database';
import { FolderKanban, Plus, Filter, Search, Calendar, Users, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface ProjectListProps {
  onSelectProject: (id: string) => void;
  onOpenCreateModal: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ onSelectProject, onOpenCreateModal }) => {
  const {
    filteredProjects,
    filteredClients,
    tasks,
    contentItems,
    profiles,
    monthlyCycles,
    getCycleMetrics,
    getActiveCycleForProject,
  } = useData();
  const { role } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const projects = filteredProjects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && p.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.project_name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-100">
            Agency Campaigns & Projects
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Active creative scopes, cross-functional project teams, and delivery milestones
          </p>
        </div>

        {role !== 'client' && role !== 'viewer' && (
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Create Project</span>
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-56 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:border-neutral-700 focus:outline-hidden"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 focus:border-neutral-700 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="waiting_for_client">Waiting for Client</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 focus:border-neutral-700 focus:outline-hidden"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="text-[11px] font-mono text-neutral-400 tabular-nums">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.length === 0 ? (
          <div className="col-span-full py-16 text-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30 p-8 space-y-3">
            <FolderKanban className="h-8 w-8 text-neutral-600 mx-auto" />
            <div className="text-sm font-semibold text-neutral-300">No campaigns launched yet</div>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Create your first project campaign to manage milestones, assign team members, and track deliverables.
            </p>
            {role !== 'client' && role !== 'viewer' && (
              <button
                onClick={onOpenCreateModal}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create First Project</span>
              </button>
            )}
          </div>
        ) : (
          projects.map((p) => {
            const client = filteredClients.find((c) => c.id === p.client_id);
            const pm = profiles.find((prof) => prof.id === p.project_manager_id);
            const pTasks = tasks.filter((t) => t.project_id === p.id);
            const completedTasks = pTasks.filter((t) => t.status === 'completed');
            const pContent = contentItems.filter((c) => c.project_id === p.id);
            const isRetainer = p.project_type === 'monthly_retainer';
            const activeCycle = isRetainer ? getActiveCycleForProject(p.id) : null;
            const cycleMetrics = activeCycle ? getCycleMetrics(activeCycle.id) : null;

            const progress = isRetainer && cycleMetrics
              ? cycleMetrics.progressPercent
              : pTasks.length > 0
              ? Math.round((completedTasks.length / pTasks.length) * 100)
              : 0;

            return (
              <div
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4 hover:border-neutral-700 cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] uppercase tracking-wider text-amber-400/90 font-medium truncate">
                        {client?.company_name}
                      </div>
                      <h3 className="text-base font-semibold text-neutral-100 mt-0.5 leading-snug">
                        {p.project_name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 self-start flex-wrap">
                      <StatusBadge status={p.project_type || 'one_time'} />
                      <StatusBadge status={p.priority} type="priority" />
                      <StatusBadge status={p.status} type="project" />
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="border-t border-neutral-800/80 pt-3 space-y-3">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>{isRetainer ? 'Current Cycle:' : 'Target Deadline:'}</span>
                    <span className="font-mono text-neutral-200 tabular-nums font-semibold">
                      {isRetainer && activeCycle ? `${activeCycle.month_name} ${activeCycle.year}` : p.deadline}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                      <span>
                        {isRetainer && cycleMetrics
                          ? `Deliverables (${cycleMetrics.completed}/${cycleMetrics.target})`
                          : `Task Progress (${completedTasks.length}/${pTasks.length})`}
                      </span>
                      <span className="font-mono tabular-nums">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isRetainer ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                    <span className="text-[11px]">PM: {pm?.full_name || 'Unassigned'}</span>
                    <span className="text-amber-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      {pContent.length} Deliverables <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
