import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  FolderKanban,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Send,
  CalendarDays,
  Film,
  Plus,
  Users,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface ProjectManagerDashboardProps {
  onNavigateTab: (tab: any) => void;
  onSelectProject: (id: string) => void;
  onSelectContent: (id: string) => void;
}

export const ProjectManagerDashboard: React.FC<ProjectManagerDashboardProps> = ({
  onNavigateTab,
  onSelectProject,
  onSelectContent,
}) => {
  const { currentUser } = useAuth();
  const {
    clients,
    projects,
    tasks,
    contentItems,
    profiles,
    monthlyCycles,
    getDeadlineWarnings,
    getCycleMetrics,
    createNextMonthCycle,
  } = useData();

  // PM specific filtering
  const myClients = clients.filter((c) => c.assigned_pm_id === currentUser?.id || c.status === 'active');
  const myProjects = projects.filter((p) => p.project_manager_id === currentUser?.id || p.status === 'active');
  const myProjectIds = myProjects.map((p) => p.id);

  // Monthly Retainers (Sections 9 & 10)
  const retainerProjects = myProjects.filter((p) => p.project_type === 'monthly_retainer');
  const [selectedRetainerId, setSelectedRetainerId] = useState<string>(
    retainerProjects[0]?.id || ''
  );

  const selectedRetainer = retainerProjects.find((p) => p.id === selectedRetainerId) || retainerProjects[0];
  const retainerCycles = selectedRetainer
    ? monthlyCycles.filter((c) => c.project_id === selectedRetainer.id)
    : [];

  const [selectedCycleId, setSelectedCycleId] = useState<string>(
    retainerCycles[0]?.id || ''
  );

  const activeCycle =
    retainerCycles.find((c) => c.id === selectedCycleId) ||
    retainerCycles.find((c) => c.status === 'in_progress') ||
    retainerCycles[0];

  const cycleMetrics = activeCycle ? getCycleMetrics(activeCycle.id) : null;
  const cycleContent = activeCycle
    ? contentItems.filter((c) => c.monthly_cycle_id === activeCycle.id)
    : [];

  const retainerClient = selectedRetainer
    ? clients.find((c) => c.id === selectedRetainer.client_id)
    : null;

  // Deadline Warnings (Section 8)
  const warnings = getDeadlineWarnings();
  const overdueContent = warnings.overdue;
  const publishingNotApproved = warnings.publishingNotApproved;
  const awaitingApproval = warnings.awaitingApproval;

  const awaitingReviewContent = contentItems.filter(
    (c) => myProjectIds.includes(c.project_id) && (c.status === 'internal_review' || c.status === 'client_review')
  );

  const changesRequestedContent = contentItems.filter(
    (c) => myProjectIds.includes(c.project_id) && c.status === 'changes_requested'
  );

  const tasksDueSoon = tasks.filter(
    (t) => myProjectIds.includes(t.project_id) && t.status !== 'completed'
  );

  const handleCreateNextMonth = (projectId: string, currentCycleId?: string) => {
    const newCycle = createNextMonthCycle(projectId, currentCycleId);
    if (newCycle) {
      setSelectedCycleId(newCycle.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              Agency Operations
            </span>
            <span className="rounded bg-amber-400/10 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-400/20">
              Lead Project Manager
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-100 mt-1">
            Project Manager Hub
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Monthly retainers oversight, delivery targets, publishing schedules, and approval pipelines
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onNavigateTab('calendar')}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <CalendarDays className="h-3.5 w-3.5 text-amber-400" />
            <span>Content Calendar</span>
          </button>
          <button
            onClick={() => onNavigateTab('content')}
            className="rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors whitespace-nowrap"
          >
            Review Queue ({awaitingReviewContent.length})
          </button>
        </div>
      </div>

      {/* DEADLINE WARNING NOTICES (Section 8) */}
      {(publishingNotApproved.length > 0 || overdueContent.length > 0) && (
        <div className="rounded-xl border border-amber-500/30 bg-linear-to-r from-amber-950/40 via-neutral-900 to-neutral-950 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4" />
              <span>Production & Publishing Warning Alerts</span>
            </div>
            <span className="text-xs font-mono text-amber-400">
              {publishingNotApproved.length + overdueContent.length} Critical Items
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {publishingNotApproved.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectContent(item.id)}
                className="p-3 rounded-lg border border-rose-500/30 bg-rose-950/20 hover:bg-rose-950/40 cursor-pointer transition-colors flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-rose-400 font-bold uppercase text-[10px]">Unapproved Drop:</span>
                    <span className="text-neutral-100 font-medium">{item.title}</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    Publishing Date: <strong className="text-amber-300 font-mono">{item.publishing_date}</strong> · Status: {item.status}
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}

            {overdueContent.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectContent(item.id)}
                className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40 cursor-pointer transition-colors flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold uppercase text-[10px]">Overdue Due Date:</span>
                    <span className="text-neutral-100 font-medium">{item.title}</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    Internal Due: <strong className="text-rose-300 font-mono">{item.internal_due_date || item.due_date}</strong>
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 9 & 10: MONTHLY RETAINER OVERVIEW */}
      {selectedRetainer && activeCycle && cycleMetrics && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                  Monthly Retainer Dashboard
                </span>
                <span className="text-neutral-600">·</span>
                <span className="text-xs text-neutral-400 font-mono">
                  {retainerCycles.length} Cycles Available
                </span>
              </div>
              <h2 className="text-lg font-bold text-neutral-100 mt-0.5">
                {retainerClient?.company_name} — {activeCycle.month_name} {activeCycle.year}
              </h2>
              <p className="text-xs text-neutral-400">
                Project: {selectedRetainer.project_name} · Lead PM: {profiles.find((p) => p.id === selectedRetainer.project_manager_id)?.full_name || 'PM A'}
              </p>
            </div>

            {/* Cycle Selector & Next Month button */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={activeCycle.id}
                onChange={(e) => setSelectedCycleId(e.target.value)}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-amber-300 font-medium focus:border-amber-400 focus:outline-hidden"
              >
                {retainerCycles.map((cy) => (
                  <option key={cy.id} value={cy.id}>
                    Cycle: {cy.month_name} {cy.year} ({cy.status.replace('_', ' ')})
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleCreateNextMonth(selectedRetainer.id, activeCycle.id)}
                className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors flex items-center gap-1.5 shadow-sm"
                title="Creates next month cycle carrying forward deliverable targets"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Next Month</span>
              </button>
            </div>
          </div>

          {/* Section 9 Metrics Example: Target: 9, Completed: 5, In Production: 2, Client Review: 1, Planned: 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
              <div className="text-[11px] text-neutral-400 uppercase font-medium">Monthly Target</div>
              <div className="mt-1 font-mono text-2xl font-bold text-neutral-100">
                {cycleMetrics.target}
              </div>
              <div className="text-[10px] text-neutral-500">Deliverables contracted</div>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
              <div className="text-[11px] text-neutral-400 uppercase font-medium">Completed / Published</div>
              <div className="mt-1 font-mono text-2xl font-bold text-emerald-400">
                {cycleMetrics.completed}
              </div>
              <div className="text-[10px] text-emerald-500/80 font-mono">{cycleMetrics.progressPercent}% progress</div>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
              <div className="text-[11px] text-neutral-400 uppercase font-medium">In Production</div>
              <div className="mt-1 font-mono text-2xl font-bold text-sky-400">
                {cycleMetrics.inProduction}
              </div>
              <div className="text-[10px] text-neutral-500">Filming & Motion edit</div>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
              <div className="text-[11px] text-neutral-400 uppercase font-medium">Client Review</div>
              <div className="mt-1 font-mono text-2xl font-bold text-amber-400">
                {cycleMetrics.clientReview}
              </div>
              <div className="text-[10px] text-amber-500/80">Awaiting client sign-off</div>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
              <div className="text-[11px] text-neutral-400 uppercase font-medium">Planned / Assigned</div>
              <div className="mt-1 font-mono text-2xl font-bold text-neutral-300">
                {cycleMetrics.planned}
              </div>
              <div className="text-[10px] text-neutral-500">Scheduled drops</div>
            </div>
          </div>

          {/* Flexible Deliverable Targets breakdown: Posts: 3/5, Reels: 2/4 */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-300 uppercase tracking-wider">
                Deliverable Breakdown For {activeCycle.month_name}
              </span>
              <span className="font-mono text-amber-400 font-semibold">
                {cycleMetrics.completed} / {cycleMetrics.target} Completed ({cycleMetrics.progressPercent}%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {cycleMetrics.byTarget.map((bt) => {
                const targetPct = bt.target > 0 ? Math.round((bt.completed / bt.target) * 100) : 0;
                return (
                  <div key={bt.label} className="p-3 rounded-lg border border-neutral-800/80 bg-neutral-900/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-200">{bt.label}</span>
                      <span className="font-mono text-neutral-300 font-medium">
                        {bt.completed} / {bt.target}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all duration-300"
                        style={{ width: `${Math.min(targetPct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-500">
                      <span>Remaining: {Math.max(0, bt.target - bt.completed)}</span>
                      <span>{targetPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content Items in this Cycle */}
          <div>
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold uppercase tracking-wider text-neutral-300">
                Cycle Deliverables & Assigned Specialists ({cycleContent.length})
              </span>
              <button
                onClick={() => onSelectProject(selectedRetainer.id)}
                className="text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Manage in Project View</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {cycleContent.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-lg">
                  No content records created yet for {activeCycle.month_name} {activeCycle.year}.
                </div>
              ) : (
                cycleContent.map((item) => {
                  const assigned = profiles.find((p) => p.id === item.assigned_to);
                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectContent(item.id)}
                      className="p-3 rounded-lg border border-neutral-800/80 bg-neutral-950/40 hover:bg-neutral-800/40 cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-100 truncate">{item.title}</span>
                          <span className="text-[10px] font-mono uppercase text-neutral-400">
                            [{item.platform}]
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>Assigned to: <strong className="text-neutral-200">{assigned?.full_name || 'Unassigned'}</strong></span>
                          <span>·</span>
                          <span>Internal Due: <strong className="font-mono text-neutral-300">{item.internal_due_date || item.due_date}</strong></span>
                          <span>·</span>
                          <span className="text-amber-400">
                            Publishing: <strong className="font-mono text-amber-300">{item.publishing_date || 'Unscheduled'}</strong>
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">My Active Projects</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-neutral-100">
            {myProjects.length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Across {myClients.length} clients</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">Content In Review</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-amber-400">
            {awaitingReviewContent.length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Internal & Client review</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">Client Change Requests</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-rose-400">
            {changesRequestedContent.length}
          </div>
          <div className="mt-1 text-[11px] text-rose-500/80">Revisions needed</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">Tasks In Progress</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-sky-400">
            {tasksDueSoon.length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Team execution queue</div>
        </div>
      </div>

      {/* Two Columns: Content Requiring Action & Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Awaiting Review / Revision */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-200">Review & Revision Queue</h2>
              <p className="text-[11px] text-neutral-400">Deliverables requiring verification or client dispatch</p>
            </div>
            <button
              onClick={() => onNavigateTab('content')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Pipeline</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {[...awaitingReviewContent, ...changesRequestedContent].length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">No content items currently in review.</div>
            ) : (
              [...awaitingReviewContent, ...changesRequestedContent].slice(0, 5).map((item) => {
                const client = clients.find((c) => c.id === item.client_id);
                const assigned = profiles.find((p) => p.id === item.assigned_to);

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectContent(item.id)}
                    className="p-3 rounded-lg border border-neutral-800/80 bg-neutral-950/40 hover:bg-neutral-800/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-xs font-semibold text-neutral-200 truncate flex-1">{item.title}</div>
                      <div className="shrink-0"><StatusBadge status={item.status} /></div>
                    </div>
                    <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-neutral-400">
                      <span className="truncate">{client?.company_name} · Assigned to {assigned?.full_name || 'Unassigned'}</span>
                      <span className="font-mono text-neutral-500 shrink-0">Due {item.due_date}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Managed Campaigns */}
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-200">Active Campaigns</h2>
              <p className="text-[11px] text-neutral-400">Ongoing client deliverables and deadlines</p>
            </div>
            <button
              onClick={() => onNavigateTab('projects')}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>All Projects</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {myProjects.map((p) => {
              const client = clients.find((c) => c.id === p.client_id);
              const pTasks = tasks.filter((t) => t.project_id === p.id);
              const completedTasks = pTasks.filter((t) => t.status === 'completed');
              const progressPct = pTasks.length > 0 ? Math.round((completedTasks.length / pTasks.length) * 100) : 0;

              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  className="p-3.5 rounded-lg border border-neutral-800/80 bg-neutral-950/40 hover:bg-neutral-800/50 cursor-pointer transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-neutral-200 truncate">{p.project_name}</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5 truncate">{client?.company_name}</div>
                    </div>
                    <div className="self-start sm:self-auto shrink-0 flex items-center gap-1.5">
                      <StatusBadge status={p.project_type || 'one_time'} />
                      <StatusBadge status={p.status} type="project" />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-neutral-400">
                    <span>Deadline: <strong className="text-neutral-300 font-mono">{p.deadline}</strong></span>
                    <span className="font-mono tabular-nums">{progressPct}% tasks done</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-1.5 h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

