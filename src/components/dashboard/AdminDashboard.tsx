import React from 'react';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  Building2,
  FolderKanban,
  Film,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Activity,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: any) => void;
  onSelectProject: (id: string) => void;
  onSelectContent: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  onSelectProject,
  onSelectContent,
}) => {
  const { clients, projects, contentItems, tasks, activityLogs, profiles } = useData();

  const activeClients = clients.filter((c) => c.status === 'active').length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const inProductionContent = contentItems.filter((c) => c.status === 'in_production').length;
  const internalReviewContent = contentItems.filter((c) => c.status === 'internal_review').length;
  const clientReviewContent = contentItems.filter((c) => c.status === 'client_review').length;
  const changesRequestedContent = contentItems.filter((c) => c.status === 'changes_requested').length;
  const completedContent = contentItems.filter((c) => c.status === 'approved' || c.status === 'published' || c.status === 'completed').length;

  // Approaching deadlines (due within 7 days)
  const today = new Date();
  const approachingDeadlineProjects = projects.filter((p) => {
    const deadline = new Date(p.deadline);
    const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 14 && p.status !== 'completed';
  });

  return (
    <div className="space-y-6">
      {/* Editorial Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-100">
            Agency Executive Dashboard
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Global production metrics, client delivery pipelines, and studio throughput
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('content')}
            className="rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors whitespace-nowrap"
          >
            Review Production Pipeline
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (High density, tabular numerals, single elevation) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Active Clients</span>
            <Building2 className="h-4 w-4 text-neutral-500" />
          </div>
          <div className="mt-3 font-mono text-2xl font-bold tabular-nums text-neutral-100">
            {activeClients}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Total registered accounts: {clients.length}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Active Projects</span>
            <FolderKanban className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-3 font-mono text-2xl font-bold tabular-nums text-neutral-100">
            {activeProjects}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Across {activeClients} partner brands
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Client Review Queue</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 font-mono text-2xl font-bold tabular-nums text-amber-400">
            {clientReviewContent}
          </div>
          <div className="mt-1 text-[11px] text-amber-500/80">
            Awaiting client sign-off
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Changes Requested</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-3 font-mono text-2xl font-bold tabular-nums text-rose-400">
            {changesRequestedContent}
          </div>
          <div className="mt-1 text-[11px] text-rose-500/80">
            Active revision cycles
          </div>
        </div>
      </div>

      {/* Production Pipeline Overview Stats */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
        <div className="text-xs font-semibold text-neutral-300 mb-3 flex items-center justify-between">
          <span>Creative Production Breakdown</span>
          <span className="text-[11px] font-mono text-neutral-500">{contentItems.length} Total Deliverables</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="border-l-2 border-sky-500 pl-3 py-1 bg-neutral-950/40 rounded-r-lg">
            <div className="text-neutral-400 text-[11px]">In Production</div>
            <div className="font-mono text-lg font-bold text-sky-400 tabular-nums">{inProductionContent}</div>
          </div>
          <div className="border-l-2 border-indigo-500 pl-3 py-1 bg-neutral-950/40 rounded-r-lg">
            <div className="text-neutral-400 text-[11px]">Internal Review</div>
            <div className="font-mono text-lg font-bold text-indigo-400 tabular-nums">{internalReviewContent}</div>
          </div>
          <div className="border-l-2 border-amber-500 pl-3 py-1 bg-neutral-950/40 rounded-r-lg">
            <div className="text-neutral-400 text-[11px]">Client Review</div>
            <div className="font-mono text-lg font-bold text-amber-400 tabular-nums">{clientReviewContent}</div>
          </div>
          <div className="border-l-2 border-emerald-500 pl-3 py-1 bg-neutral-950/40 rounded-r-lg">
            <div className="text-neutral-400 text-[11px]">Approved & Done</div>
            <div className="font-mono text-lg font-bold text-emerald-400 tabular-nums">{completedContent}</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Deadlines & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approaching Project Deadlines */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-200">Approaching Deadlines</h2>
              <p className="text-[11px] text-neutral-400">Projects with deadlines in the next 14 days</p>
            </div>
            <button
              onClick={() => onNavigateTab('projects')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {approachingDeadlineProjects.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-500">
                No immediate deadlines in the next 14 days.
              </div>
            ) : (
              approachingDeadlineProjects.map((p) => {
                const client = clients.find((c) => c.id === p.client_id);
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectProject(p.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-neutral-800/80 bg-neutral-950/40 hover:bg-neutral-800/50 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-neutral-200 truncate">{p.project_name}</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5 truncate">
                        {client?.company_name} · Due {p.deadline}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <StatusBadge status={p.priority} type="priority" />
                      <StatusBadge status={p.status} type="project" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent System Activity */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-200">Recent Agency Activity</h2>
              <p className="text-[11px] text-neutral-400">Audit trail of approvals, uploads, and edits</p>
            </div>
            <button
              onClick={() => onNavigateTab('activity')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Audit Log</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {activityLogs.slice(0, 5).map((log) => {
              const user = profiles.find((p) => p.id === log.user_id);
              return (
                <div key={log.id} className="flex items-start gap-3 text-xs border-b border-neutral-800/40 pb-2.5 last:border-none">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-[10px] font-semibold text-neutral-300">
                    {user?.full_name?.charAt(0) || 'A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-neutral-200 font-medium">
                      {user?.full_name}: <span className="text-neutral-400 font-normal">{log.action}</span>
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500 mt-0.5">
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Workload Summary */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
        <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-200">Team Workload & Allocations</h2>
            <p className="text-[11px] text-neutral-400">Assigned deliverables and active tasks per team member</p>
          </div>
          <button
            onClick={() => onNavigateTab('settings')}
            className="text-xs text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>Manage Team</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {profiles.filter(p => p.role !== 'client' && p.role !== 'viewer').map((member) => {
            const memberTasks = tasks.filter((t) => t.assigned_to === member.id && t.status !== 'completed');
            const memberContent = contentItems.filter((c) => c.assigned_to === member.id && c.status !== 'completed');

            return (
              <div key={member.id} className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-950/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 font-semibold text-xs border border-amber-500/20">
                    {member.full_name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-200">{member.full_name}</div>
                    <div className="text-[10px] text-neutral-400">{member.job_title}</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded border border-neutral-800 bg-neutral-900/60 p-1.5">
                    <div className="font-mono text-sm font-bold text-neutral-200 tabular-nums">
                      {memberTasks.length}
                    </div>
                    <div className="text-[10px] text-neutral-500">Active Tasks</div>
                  </div>
                  <div className="rounded border border-neutral-800 bg-neutral-900/60 p-1.5">
                    <div className="font-mono text-sm font-bold text-amber-400 tabular-nums">
                      {memberContent.length}
                    </div>
                    <div className="text-[10px] text-neutral-500">Deliverables</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
