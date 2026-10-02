import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../common/StatusBadge';
import { Film, FileText, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

interface CopyEditorDashboardProps {
  onNavigateTab: (tab: any) => void;
  onSelectContent: (id: string) => void;
}

export const CopyEditorDashboard: React.FC<CopyEditorDashboardProps> = ({
  onNavigateTab,
  onSelectContent,
}) => {
  const { currentUser } = useAuth();
  const { filteredContentItems, filteredClients } = useData();

  const myDrafts = filteredContentItems.filter(
    (c) => c.status === 'idea' || c.status === 'planned' || c.status === 'in_production'
  );
  const awaitingReview = filteredContentItems.filter((c) => c.status === 'internal_review');
  const changesNeeded = filteredContentItems.filter((c) => c.status === 'changes_requested');
  const approved = filteredContentItems.filter((c) => c.status === 'approved' || c.status === 'published');

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-100">
            Copywriting & Narrative Desk
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Social hooks, reel scripts, carousel narrative decks, and caption optimization
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('content')}
          className="rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors"
        >
          View Full Content Queue
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">Drafting In Progress</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-neutral-100">
            {myDrafts.length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Captions & briefs</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">Revisions Requested</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-rose-400">
            {changesNeeded.length}
          </div>
          <div className="mt-1 text-[11px] text-rose-500/80">Copy adjustments needed</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">QA / Internal Review</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-indigo-400">
            {awaitingReview.length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Awaiting PM check</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">Approved Copy</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-400">
            {approved.length}
          </div>
          <div className="mt-1 text-[11px] text-emerald-500/80">Published deliverables</div>
        </div>
      </div>

      {/* Copy Queue */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-neutral-200">Social Copy & Script Queue</h2>
            <p className="text-[11px] text-neutral-400">Deliverables ready for writing or revisions</p>
          </div>
        </div>

        <div className="space-y-3">
          {filteredContentItems.map((item) => {
            const client = filteredClients.find((c) => c.id === item.client_id);
            return (
              <div
                key={item.id}
                onClick={() => onSelectContent(item.id)}
                className="flex items-center justify-between gap-2 p-3.5 rounded-lg border border-neutral-800/80 bg-neutral-950/40 hover:bg-neutral-800/50 cursor-pointer transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-neutral-200 truncate">{item.title}</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5 truncate">
                    {client?.company_name} · {item.platform} · {item.content_type.replace('_', ' ')}
                  </div>
                  {item.caption && (
                    <div className="text-[11px] text-neutral-500 line-clamp-1 italic mt-1">
                      "{item.caption}"
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={item.status} />
                  <ArrowRight className="h-3.5 w-3.5 text-neutral-600 hover:text-neutral-300" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
