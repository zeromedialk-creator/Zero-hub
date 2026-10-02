import React from 'react';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../common/StatusBadge';
import { Building2, FolderKanban, Film, TrendingUp, CheckCircle2, Clock } from 'lucide-react';

interface ViewerDashboardProps {
  onNavigateTab: (tab: any) => void;
  onSelectProject: (id: string) => void;
  onSelectContent: (id: string) => void;
}

export const ViewerDashboard: React.FC<ViewerDashboardProps> = ({
  onNavigateTab,
  onSelectProject,
  onSelectContent,
}) => {
  const { clients, projects, contentItems, tasks } = useData();

  const totalClients = clients.length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const totalDeliverables = contentItems.length;
  const approvedDeliverables = contentItems.filter(
    (c) => c.status === 'approved' || c.status === 'published' || c.status === 'completed'
  ).length;

  const approvalRate = totalDeliverables > 0 ? Math.round((approvedDeliverables / totalDeliverables) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-100">
            Agency Management & Audit Overview
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Read-only high-level performance indicators, project delivery health, and client retention
          </p>
        </div>
        <div className="rounded bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-xs text-neutral-400 font-mono">
          Viewer / Read-Only Mode
        </div>
      </div>

      {/* High-level KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">Total Clients</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-neutral-100">
            {totalClients}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Contracted portfolio</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">Active Campaigns</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-sky-400">
            {activeProjects}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Live production scopes</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">Content Delivery Rate</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-400">
            {approvalRate}%
          </div>
          <div className="mt-1 text-[11px] text-emerald-500/80">Approved / Shipped</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">Total Creative Assets</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-amber-400">
            {totalDeliverables}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Videos, reels & carousels</div>
        </div>
      </div>

      {/* Campaigns Overview */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-neutral-200 border-b border-neutral-800 pb-3">
          Agency Campaigns Delivery Status
        </h2>
        <div className="space-y-3">
          {projects.map((p) => {
            const client = clients.find((c) => c.id === p.client_id);
            const pContent = contentItems.filter((c) => c.project_id === p.id);
            const pApproved = pContent.filter((c) => c.status === 'approved' || c.status === 'published').length;
            const pct = pContent.length > 0 ? Math.round((pApproved / pContent.length) * 100) : 0;

            return (
              <div
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="p-3.5 rounded-lg border border-neutral-800/80 bg-neutral-950/40 hover:bg-neutral-800/40 cursor-pointer transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-neutral-200">{p.project_name}</span>
                    <span className="text-neutral-500 text-xs ml-2">· {client?.company_name}</span>
                  </div>
                  <div className="self-start sm:self-auto shrink-0">
                    <StatusBadge status={p.status} type="project" />
                  </div>
                </div>
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-neutral-400">
                  <span>Target: <strong className="text-neutral-300 font-mono">{p.deadline}</strong></span>
                  <span className="font-mono tabular-nums">{pApproved}/{pContent.length} approved ({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
