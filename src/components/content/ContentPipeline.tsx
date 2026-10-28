import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ContentItem, ContentStatus, ContentType, Platform } from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import { PlatformBadge, PlatformListBadges, formatPlatformName } from '../common/PlatformBadge';
import {
  Film,
  Plus,
  Filter,
  LayoutGrid,
  List,
  Eye,
  Upload,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Instagram,
  Video,
  X,
  Layers,
} from 'lucide-react';

interface ContentPipelineProps {
  onSelectContent: (id: string) => void;
  onOpenCreateModal: (defaultStatus?: ContentStatus) => void;
  onOpenReviewModal: (id: string) => void;
  onOpenVersionModal: (id: string) => void;
}

const WORKFLOW_STEPS: { status: ContentStatus; label: string; desc: string }[] = [
  { status: 'idea', label: 'Idea', desc: 'Concept incubation' },
  { status: 'planned', label: 'Planned', desc: 'Briefed in sprint' },
  { status: 'assigned', label: 'Assigned', desc: 'Editor allocated' },
  { status: 'in_production', label: 'In Production', desc: 'Active filming/edit' },
  { status: 'internal_review', label: 'Internal Review', desc: 'Agency QA' },
  { status: 'client_review', label: 'Client Review', desc: 'Client sign-off' },
  { status: 'changes_requested', label: 'Changes Requested', desc: 'Revision loop' },
  { status: 'approved', label: 'Approved', desc: 'Ready for queue' },
  { status: 'scheduled', label: 'Scheduled', desc: 'Social scheduler' },
  { status: 'published', label: 'Published', desc: 'Live on channels' },
  { status: 'completed', label: 'Completed', desc: 'Archived deliverables' },
];

export const ContentPipeline: React.FC<ContentPipelineProps> = ({
  onSelectContent,
  onOpenCreateModal,
  onOpenReviewModal,
  onOpenVersionModal,
}) => {
  const { filteredContentItems, filteredClients, filteredProjects, profiles, approvals, contentVersions, updateContentStatus } = useData();
  const { role } = useAuth();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileActiveStage, setMobileActiveStage] = useState<string>('all');
  const [dismissedFeedbackIds, setDismissedFeedbackIds] = useState<Set<string>>(new Set());

  const handleDismissFeedback = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedFeedbackIds((prev) => new Set(prev).add(id));
  };

  // Filter content
  const items = filteredContentItems.filter((item) => {
    if (selectedClient !== 'all' && item.client_id !== selectedClient) return false;
    if (selectedPlatform !== 'all') {
      const plats = (item.platforms && item.platforms.length > 0) ? item.platforms : [item.platform];
      if (!plats.includes(selectedPlatform as Platform)) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.brief?.toLowerCase().includes(q) ||
        item.caption?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-100">
            Content Production Pipeline
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Complete 11-step creative lifecycle: Idea → Production → Client Sign-off → Published
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle (interactive buttons) */}
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
              onClick={() => setViewMode('table')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === 'table' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          {role !== 'client' && role !== 'viewer' && (
            <button
              onClick={() => onOpenCreateModal('idea')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Create Content</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {role !== 'client' && (
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 focus:border-neutral-700 focus:outline-hidden"
            >
              <option value="all">All Clients ({filteredClients.length})</option>
              {filteredClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 focus:border-neutral-700 focus:outline-hidden"
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="linkedin">LinkedIn</option>
            <option value="facebook">Facebook</option>
            <option value="other">Other</option>
          </select>

          <input
            type="text"
            placeholder="Search deliverables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-48 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:border-neutral-700 focus:outline-hidden"
          />
        </div>

        <div className="text-[11px] font-mono text-neutral-400 tabular-nums">
          Showing {items.length} of {filteredContentItems.length} items
        </div>
      </div>

      {filteredContentItems.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30 p-6 text-center space-y-2">
          <Film className="h-6 w-6 text-neutral-600 mx-auto" />
          <div className="text-sm font-semibold text-neutral-300">Production pipeline is clear</div>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            No creative deliverables are currently in the 11-step production lifecycle.
          </p>
          {role !== 'client' && role !== 'viewer' && (
            <button
              onClick={() => onOpenCreateModal('idea')}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create First Deliverable (Idea)</span>
            </button>
          )}
        </div>
      )}

      {/* Mobile Stage Selector for Kanban */}
      {viewMode === 'kanban' && (
        <div className="md:hidden space-y-2">
          <div className="text-[11px] font-medium text-neutral-400 flex items-center justify-between">
            <span>Filter By Production Stage:</span>
            <span className="font-mono text-neutral-500">
              {mobileActiveStage === 'all'
                ? 'All Stages'
                : WORKFLOW_STEPS.find((s) => s.status === mobileActiveStage)?.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs -mx-1 px-1">
            <button
              onClick={() => setMobileActiveStage('all')}
              className={`rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors shrink-0 ${
                mobileActiveStage === 'all'
                  ? 'bg-amber-400 text-neutral-950 font-semibold shadow-xs'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              All Stages ({items.length})
            </button>
            {WORKFLOW_STEPS.map((step) => {
              const count = items.filter((i) => i.status === step.status).length;
              return (
                <button
                  key={step.status}
                  onClick={() => setMobileActiveStage(step.status)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors shrink-0 flex items-center gap-1.5 ${
                    mobileActiveStage === step.status
                      ? 'bg-amber-400 text-neutral-950 font-semibold shadow-xs'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  <span>{step.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1 rounded ${
                      mobileActiveStage === step.status ? 'bg-neutral-950/20' : 'bg-neutral-800'
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

      {/* View Content */}
      {viewMode === 'kanban' ? (
        /* Horizontal Scrolling Kanban on Desktop, Responsive Stage Filter on Mobile */
        <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-6 pt-1">
          {WORKFLOW_STEPS.filter((step) => {
            // Only filter down if on mobile and a specific stage is chosen
            // We use mobileActiveStage state; on desktop users can see all stages if they want or reset
            if (mobileActiveStage !== 'all') {
              return step.status === mobileActiveStage;
            }
            return true;
          }).map((step) => {
            const stepItems = items.filter((item) => item.status === step.status);
            return (
              <div
                key={step.status}
                className="w-full md:w-72 shrink-0 rounded-xl border border-neutral-800/90 bg-neutral-900/40 p-3.5 flex flex-col justify-between"
              >
                {/* Column Header */}
                <div>
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5 mb-3">
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">{step.label}</div>
                      <div className="text-[10px] text-neutral-500">{step.desc}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs tabular-nums rounded bg-neutral-800 px-2 py-0.5 text-neutral-300 font-medium">
                        {stepItems.length}
                      </span>
                      {role !== 'client' && role !== 'viewer' && (
                        <button
                          type="button"
                          onClick={() => onOpenCreateModal(step.status)}
                          title={`Add deliverable to ${step.label}`}
                          className="flex h-5 w-5 items-center justify-center rounded text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Cards in Column */}
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                    {stepItems.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-neutral-800/70 p-4 text-center text-[11px] text-neutral-600">
                        No deliverables in this stage
                      </div>
                    ) : (
                      stepItems.map((item) => {
                        const client = filteredClients.find((c) => c.id === item.client_id);
                        const assigned = profiles.find((p) => p.id === item.assigned_to);
                        const itemVersions = contentVersions.filter((v) => v.content_id === item.id);
                        const latestVer = itemVersions.sort((a, b) => b.version_number - a.version_number)[0];

                        return (
                          <div
                            key={item.id}
                            className="rounded-lg border border-neutral-800 bg-neutral-950 p-3.5 space-y-2.5 hover:border-neutral-700 transition-colors shadow-xs group"
                          >
                            <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase tracking-wider gap-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <PlatformListBadges platforms={item.platforms} platform={item.platform} maxDisplay={2} />
                                {latestVer && (
                                  <span className="rounded bg-amber-400/15 border border-amber-400/30 px-1 py-0.2 font-mono text-[9px] font-bold text-amber-300 shrink-0">
                                    V{latestVer.version_number}
                                  </span>
                                )}
                              </div>
                              <span className="capitalize shrink-0 text-neutral-400">{item.content_type.replace('_', ' ')}</span>
                            </div>

                            {/* Content Name / Title */}
                            <h3
                              onClick={() => onSelectContent(item.id)}
                              className="text-xs font-semibold text-neutral-200 hover:text-amber-300 cursor-pointer leading-snug line-clamp-2"
                            >
                              {item.title}
                            </h3>

                            <div className="text-[11px] text-neutral-400 truncate">
                              {client?.company_name}
                            </div>

                            {item.status === 'changes_requested' && !dismissedFeedbackIds.has(item.id) && (
                              <div className="rounded bg-rose-950/40 border border-rose-900/40 p-2 text-[10px] text-rose-200 relative group/msg">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="font-bold text-rose-400 uppercase tracking-wider block">
                                    Client Feedback:
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDismissFeedback(item.id, e)}
                                    className="rounded p-0.5 text-rose-400 hover:text-white hover:bg-rose-900/50 transition-colors"
                                    title="Close message"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                                <p className="line-clamp-2 italic">
                                  "{approvals.find((a) => a.content_id === item.id && a.status === 'changes_requested')?.comment || item.notes || 'Revisions requested'}"
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-neutral-800/70 text-[10px] text-neutral-500">
                              <span>Due {item.due_date}</span>
                              <span>{assigned?.full_name?.split(' ')[0] || 'Unassigned'}</span>
                            </div>

                            {/* Interactive Quick Actions */}
                            <div className="flex items-center justify-between pt-1 gap-2 text-[11px]">
                              {role === 'client' && item.status === 'client_review' ? (
                                <button
                                  onClick={() => onOpenReviewModal(item.id)}
                                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/40 px-2.5 py-1.5 text-xs font-medium hover:bg-amber-400 hover:text-neutral-950 transition-colors min-h-[36px]"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Review & Sign-Off</span>
                                </button>
                              ) : role === 'client' && item.status === 'changes_requested' ? (
                                <button
                                  onClick={() => onOpenReviewModal(item.id)}
                                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 transition-colors text-xs font-medium min-h-[36px]"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Review Desk</span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => onSelectContent(item.id)}
                                    className="flex-1 text-center py-1.5 rounded bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800/60 transition-colors text-xs"
                                  >
                                    Inspect
                                  </button>
                                  {role !== 'client' && (
                                    <button
                                      onClick={() => onOpenVersionModal(item.id)}
                                      className="flex-1 text-center py-1.5 rounded bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 border border-amber-400/20 transition-colors text-xs font-medium"
                                    >
                                      + Version
                                    </button>
                                  )}
                                </>
                              )}
                            </div>

                            {role !== 'client' && role !== 'viewer' && (
                              <div className="pt-1.5">
                                {item.status === 'idea' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateContentStatus(item.id, 'planned', 'Promoted from Idea to Planned sprint');
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2 py-1 text-[11px] font-semibold hover:bg-amber-400 hover:text-neutral-950 transition-colors"
                                    title="Move deliverable to Planned sprint stage"
                                  >
                                    <span>Promote to Planned Sprint</span>
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                )}
                                {item.status === 'planned' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateContentStatus(item.id, 'in_production', 'Started production');
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 px-2 py-1 text-[11px] font-semibold hover:bg-sky-500 hover:text-neutral-950 transition-colors"
                                    title="Move deliverable to In Production stage"
                                  >
                                    <span>Start Production</span>
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                )}
                                {item.status === 'assigned' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateContentStatus(item.id, 'in_production', 'Started production');
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 px-2 py-1 text-[11px] font-semibold hover:bg-sky-500 hover:text-neutral-950 transition-colors"
                                    title="Move deliverable to In Production stage"
                                  >
                                    <span>Start Production</span>
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                )}
                                {item.status === 'in_production' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateContentStatus(item.id, 'internal_review', 'Sent for internal review');
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-1 text-[11px] font-semibold hover:bg-indigo-500 hover:text-neutral-950 transition-colors"
                                    title="Move to Internal Review"
                                  >
                                    <span>Submit for Internal QA</span>
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                )}
                                {item.status === 'internal_review' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateContentStatus(item.id, 'client_review', 'Submitted for client sign-off');
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2 py-1 text-[11px] font-semibold hover:bg-amber-400 hover:text-neutral-950 transition-colors"
                                    title="Send to Client Review"
                                  >
                                    <span>Send to Client Review</span>
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                )}
                                {item.status === 'approved' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateContentStatus(item.id, 'scheduled', 'Queued in scheduler');
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30 px-2 py-1 text-[11px] font-semibold hover:bg-teal-500 hover:text-neutral-950 transition-colors"
                                    title="Queue in scheduler"
                                  >
                                    <span>Queue Scheduled</span>
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                )}
                                {item.status === 'scheduled' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateContentStatus(item.id, 'published', 'Marked published');
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-1 text-[11px] font-semibold hover:bg-emerald-500 hover:text-neutral-950 transition-colors"
                                    title="Confirm published"
                                  >
                                    <span>Mark Published</span>
                                    <ArrowRight className="h-3 w-3" />
                                  </button>
                                )}
                                {item.status === 'published' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateContentStatus(item.id, 'completed', 'Completed and archived deliverable');
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-neutral-900 text-neutral-300 border border-neutral-700/80 px-2 py-1 text-[11px] font-semibold hover:bg-neutral-800 hover:text-white transition-colors"
                                    title="Archive deliverable"
                                  >
                                    <span>Complete & Archive</span>
                                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                  </button>
                                )}
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
        /* High-Density Table View (Desktop table + Mobile cards) */
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
          {/* Mobile Cards for Table View */}
          <div className="md:hidden divide-y divide-neutral-800/60">
            {items.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                No matching deliverables found.
              </div>
            ) : (
              items.map((item) => {
                const client = filteredClients.find((c) => c.id === item.client_id);
                const assigned = profiles.find((p) => p.id === item.assigned_to);

                return (
                  <div key={item.id} className="p-4 space-y-2.5 hover:bg-neutral-800/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => onSelectContent(item.id)}
                          className="text-left font-semibold text-neutral-200 hover:text-amber-300 transition-colors text-xs leading-snug line-clamp-2"
                        >
                          {item.title}
                        </button>
                        <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1.5 flex-wrap">
                          <span>{client?.company_name}</span>
                          <span>·</span>
                          <PlatformListBadges platforms={item.platforms} platform={item.platform} maxDisplay={2} />
                          <span>·</span>
                          <span className="capitalize">{item.content_type.replace('_', ' ')}</span>
                        </div>
                      </div>
                      {role !== 'client' ? (
                        <select
                          value={item.status}
                          onChange={(e) => updateContentStatus(item.id, e.target.value as ContentStatus)}
                          className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[11px] text-neutral-200 focus:border-amber-400 focus:outline-hidden font-medium shrink-0"
                        >
                          {WORKFLOW_STEPS.map((s) => (
                            <option key={s.status} value={s.status}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <StatusBadge status={item.status} />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-800/60">
                      <div>Assigned: <span className="text-neutral-300">{assigned?.full_name || 'Unassigned'}</span></div>
                      <div className="font-mono text-neutral-400">Due {item.due_date}</div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {role === 'client' && (item.status === 'client_review' || item.status === 'changes_requested') ? (
                        <button
                          onClick={() => onOpenReviewModal(item.id)}
                          className={`w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                            item.status === 'changes_requested'
                              ? 'bg-rose-500 text-white hover:bg-rose-600'
                              : 'bg-amber-400 text-neutral-950 hover:bg-amber-300'
                          }`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>{item.status === 'changes_requested' ? 'Sign-Off / Revision Desk' : 'Review & Decide'}</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => onSelectContent(item.id)}
                            className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 py-2 text-center text-xs font-medium text-neutral-300 hover:text-white"
                          >
                            Inspect
                          </button>
                          {role !== 'client' && (
                            <button
                              onClick={() => onOpenVersionModal(item.id)}
                              className="flex-1 rounded-lg border border-amber-400/30 bg-amber-400/10 py-2 text-center text-xs font-semibold text-amber-300 hover:bg-amber-400/20"
                            >
                              + New Version
                            </button>
                          )}
                        </>
                      )}
                    </div>
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
                  <th className="px-4 py-3 font-medium">Deliverable</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Platform</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assigned</th>
                  <th className="px-4 py-3 font-medium text-right">Due Date</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-neutral-500">
                      No matching deliverables found.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const client = filteredClients.find((c) => c.id === item.client_id);
                    const assigned = profiles.find((p) => p.id === item.assigned_to);
                    const itemVersions = contentVersions.filter((v) => v.content_id === item.id);
                    const latestVer = itemVersions.sort((a, b) => b.version_number - a.version_number)[0];

                    return (
                      <tr key={item.id} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onSelectContent(item.id)}
                              className="text-left font-semibold text-neutral-200 hover:text-amber-300 transition-colors"
                            >
                              {item.title}
                            </button>
                            {latestVer && (
                              <span className="rounded bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.2 font-mono text-[9px] font-bold text-amber-300">
                                V{latestVer.version_number}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-500 capitalize">
                            {item.content_type.replace('_', ' ')}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-300">{client?.company_name}</td>
                        <td className="px-4 py-3">
                          <PlatformListBadges platforms={item.platforms} platform={item.platform} maxDisplay={3} />
                        </td>
                        <td className="px-4 py-3">
                          {role !== 'client' ? (
                            <select
                              value={item.status}
                              onChange={(e) => updateContentStatus(item.id, e.target.value as ContentStatus)}
                              className="rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs text-neutral-200 focus:border-amber-400 focus:outline-hidden font-medium"
                            >
                              {WORKFLOW_STEPS.map((s) => (
                                <option key={s.status} value={s.status}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <StatusBadge status={item.status} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-neutral-400">{assigned?.full_name || 'Unassigned'}</td>
                        <td className="px-4 py-3 text-right font-mono text-neutral-400 tabular-nums">
                          {item.due_date}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {role === 'client' && (item.status === 'client_review' || item.status === 'changes_requested') ? (
                            <button
                              onClick={() => onOpenReviewModal(item.id)}
                              className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                item.status === 'changes_requested'
                                  ? 'bg-rose-500 text-white hover:bg-rose-400'
                                  : 'bg-amber-400 text-neutral-950 hover:bg-amber-300'
                              }`}
                            >
                              {item.status === 'changes_requested' ? 'Sign-Off' : 'Review'}
                            </button>
                          ) : (
                            <button
                              onClick={() => onSelectContent(item.id)}
                              className="text-amber-400 hover:underline font-medium"
                            >
                              Inspect
                            </button>
                          )}
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
