import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../common/StatusBadge';
import { ContentItem } from '../../types/database';
import {
  Film,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  ArrowRight,
  Eye,
  Check,
  MessageSquare,
  Send,
  Calendar,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface ClientDashboardProps {
  onNavigateTab: (tab: any) => void;
  onSelectProject: (id: string) => void;
  onSelectContent: (id: string) => void;
  onOpenReviewModal: (contentId: string) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  onNavigateTab,
  onSelectProject,
  onSelectContent,
  onOpenReviewModal,
}) => {
  const { currentUser } = useAuth();
  const {
    filteredClients,
    filteredProjects,
    filteredContentItems,
    filteredMonthlyCycles,
    getCycleMetrics,
    approveContent,
    requestChanges,
    addComment,
    comments,
    profiles,
  } = useData();

  const myCompany = filteredClients[0];

  // Find retainer projects and the active cycle for the client
  const clientRetainers = filteredProjects.filter((p) => p.project_type === 'monthly_retainer');
  const primaryRetainer = clientRetainers[0] || filteredProjects[0];

  const availableCycles = primaryRetainer
    ? filteredMonthlyCycles.filter((c) => c.project_id === primaryRetainer.id)
    : filteredMonthlyCycles;

  const [selectedCycleId, setSelectedCycleId] = useState<string>(
    availableCycles.find((c) => c.status === 'in_progress')?.id || availableCycles[0]?.id || ''
  );

  const activeCycle =
    availableCycles.find((c) => c.id === selectedCycleId) ||
    availableCycles.find((c) => c.status === 'in_progress') ||
    availableCycles[0];

  const cycleMetrics = activeCycle ? getCycleMetrics(activeCycle.id) : null;

  // Active section tab: 'awaiting_approval' | 'approved' | 'changes_requested' | 'scheduled' | 'published' | 'all'
  const [activeSection, setActiveSection] = useState<
    'awaiting_approval' | 'approved' | 'changes_requested' | 'scheduled' | 'published' | 'all'
  >('awaiting_approval');

  // Filter content items belonging to current cycle or client
  const cycleItems = activeCycle
    ? filteredContentItems.filter((c) => c.monthly_cycle_id === activeCycle.id)
    : filteredContentItems;

  // Categorize content items into Section 11 required buckets:
  const awaitingApprovalItems = cycleItems.filter((c) => c.status === 'client_review');
  const approvedItems = cycleItems.filter((c) => c.status === 'approved');
  const changesRequestedItems = cycleItems.filter((c) => c.status === 'changes_requested');
  const scheduledItems = cycleItems.filter((c) => c.status === 'scheduled');
  const publishedItems = cycleItems.filter((c) => c.status === 'published' || c.status === 'completed');

  // Inline feedback modal / state
  const [inlineFeedbackItemId, setInlineFeedbackItemId] = useState<string | null>(null);
  const [inlineFeedbackText, setInlineFeedbackText] = useState('');

  const handleQuickApprove = (itemId: string) => {
    approveContent(itemId, 'Approved by client via client portal dashboard.');
  };

  const handleSubmitInlineChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineFeedbackItemId || !inlineFeedbackText.trim()) return;
    requestChanges(inlineFeedbackItemId, inlineFeedbackText.trim());
    setInlineFeedbackItemId(null);
    setInlineFeedbackText('');
  };

  // Get active items to display based on selected section
  const getSectionItems = (): { title: string; items: ContentItem[]; count: number } => {
    switch (activeSection) {
      case 'awaiting_approval':
        return { title: 'Awaiting Your Approval', items: awaitingApprovalItems, count: awaitingApprovalItems.length };
      case 'approved':
        return { title: 'Approved Deliverables', items: approvedItems, count: approvedItems.length };
      case 'changes_requested':
        return { title: 'Changes Requested (In Revision)', items: changesRequestedItems, count: changesRequestedItems.length };
      case 'scheduled':
        return { title: 'Scheduled For Publishing', items: scheduledItems, count: scheduledItems.length };
      case 'published':
        return { title: 'Published Deliverables', items: publishedItems, count: publishedItems.length };
      default:
        return { title: 'All Deliverables', items: cycleItems, count: cycleItems.length };
    }
  };

  const currentSectionData = getSectionItems();

  return (
    <div className="space-y-6">
      {/* Client Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              {myCompany?.company_name || 'Client Workspace'}
            </span>
            <span className="rounded bg-amber-400/10 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-400/20">
              Client Portal
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-100 mt-1">
            Brand Approvals & Retainer Hub
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Welcome back, {currentUser?.full_name}. Review upcoming drops, preview captions, sign off deliverables, or request adjustments.
          </p>
        </div>

        {awaitingApprovalItems.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-semibold text-amber-300">
              {awaitingApprovalItems.length} deliverable{awaitingApprovalItems.length > 1 ? 's' : ''} awaiting your decision
            </span>
          </div>
        )}
      </div>

      {/* SECTION 11: MONTHLY RETAINER OVERVIEW FOR CLIENT */}
      {activeCycle && (
        <div className="rounded-xl border border-amber-500/30 bg-linear-to-r from-amber-950/30 via-neutral-900 to-neutral-950 p-5 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                Monthly Retainer Scope
              </div>
              <h2 className="text-xl font-bold text-neutral-100 mt-0.5">
                {activeCycle.month_name} {activeCycle.year}
              </h2>
              <p className="text-xs text-neutral-400">
                {myCompany?.company_name} · {primaryRetainer?.project_name}
              </p>
            </div>

            {/* Cycle Selector if multiple months exist */}
            {availableCycles.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400">Viewing Month:</span>
                <select
                  value={activeCycle.id}
                  onChange={(e) => setSelectedCycleId(e.target.value)}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-amber-300 font-medium focus:border-amber-400 focus:outline-hidden"
                >
                  {availableCycles.map((cy) => (
                    <option key={cy.id} value={cy.id}>
                      {cy.month_name} {cy.year} ({cy.status.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Target & Progress Cards (Section 11 requirement: Target: 5 Posts, 4 Reels, Progress: 5 / 9) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-4 space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Monthly Contracted Target
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold text-neutral-100">
                  {cycleMetrics?.target || 9}
                </span>
                <span className="text-xs text-neutral-500">Deliverables</span>
              </div>
              {/* Target deliverable breakdown e.g. 5 Posts, 4 Reels */}
              <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                {cycleMetrics?.byTarget.map((t) => (
                  <span
                    key={t.label}
                    className="rounded bg-neutral-900 border border-neutral-800 px-2 py-0.5 text-neutral-300 font-medium"
                  >
                    <strong>{t.target}</strong> {t.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-4 space-y-1.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                Approved & Completed
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold text-emerald-400">
                  {cycleMetrics?.completed || 0}
                </span>
                <span className="text-xs text-neutral-400">
                  of {cycleMetrics?.target || 9} items
                </span>
              </div>
              <div className="text-xs text-neutral-400 font-mono">
                Progress: <strong className="text-emerald-300">{cycleMetrics?.completed} / {cycleMetrics?.target}</strong> ({cycleMetrics?.progressPercent}%)
              </div>
              <div className="mt-1.5 h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${cycleMetrics?.progressPercent || 0}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-4 space-y-2 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                  Decision Pipeline
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-neutral-300">
                  <span>Awaiting Your Approval:</span>
                  <strong className="text-amber-400 font-mono text-sm">{awaitingApprovalItems.length}</strong>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-400 mt-1">
                  <span>In Revision:</span>
                  <span className="font-mono text-rose-400">{changesRequestedItems.length}</span>
                </div>
              </div>
              <div className="text-[10px] text-neutral-500 italic">
                Agency creative team handles revisions and publishing automatically upon sign-off.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 11 SECTIONS:
          Awaiting Approval | Approved | Changes Requested | Scheduled | Published | All */}
      <div className="space-y-4">
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-2 sm:px-4 pt-2 text-xs font-medium overflow-x-auto whitespace-nowrap flex-nowrap scrollbar-none">
          {[
            { id: 'awaiting_approval', label: 'Awaiting Approval', count: awaitingApprovalItems.length, highlight: awaitingApprovalItems.length > 0 },
            { id: 'approved', label: 'Approved', count: approvedItems.length },
            { id: 'changes_requested', label: 'Changes Requested', count: changesRequestedItems.length },
            { id: 'scheduled', label: 'Scheduled', count: scheduledItems.length },
            { id: 'published', label: 'Published', count: publishedItems.length },
            { id: 'all', label: 'All Content', count: cycleItems.length },
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={`pb-3 mr-4 sm:mr-6 transition-colors border-b-2 flex items-center gap-1.5 shrink-0 ${
                activeSection === sec.id
                  ? 'border-amber-400 text-amber-400 font-semibold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>{sec.label}</span>
              <span
                className={`rounded px-1.5 py-0.2 text-[10px] font-mono tabular-nums ${
                  sec.highlight && activeSection !== sec.id
                    ? 'bg-amber-400/20 text-amber-300 font-bold'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {sec.count}
              </span>
            </button>
          ))}
        </div>

        {/* Section Content Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-neutral-200 uppercase tracking-wider">
              {currentSectionData.title} ({currentSectionData.count})
            </span>
            <span className="text-[11px] text-neutral-500">
              Showing deliverables for {activeCycle ? `${activeCycle.month_name} ${activeCycle.year}` : 'Active Retainer'}
            </span>
          </div>

          {currentSectionData.items.length === 0 ? (
            <div className="py-12 text-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30 p-8 space-y-2">
              <Film className="h-8 w-8 text-neutral-600 mx-auto" />
              <div className="text-sm font-semibold text-neutral-300">No deliverables in this category</div>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Items will populate here as they progress through the creative pipeline.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {currentSectionData.items.map((item) => {
                const itemComms = comments.filter((c) => c.content_id === item.id);
                const assigned = profiles.find((p) => p.id === item.assigned_to);

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-900/70 overflow-hidden flex flex-col justify-between hover:border-neutral-700 transition-all shadow-md"
                  >
                    <div>
                      {/* Thumbnail / Preview (Section 11 requirement) */}
                      {item.thumbnail_url && (
                        <div
                          onClick={() => onOpenReviewModal(item.id)}
                          className="aspect-video w-full bg-neutral-950 overflow-hidden relative cursor-pointer group"
                        >
                          <img
                            src={item.thumbnail_url}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <span className="rounded-lg bg-neutral-900/90 text-white px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 border border-neutral-700">
                              <Eye className="h-3.5 w-3.5 text-amber-400" />
                              Preview & Inspect
                            </span>
                          </div>
                          <div className="absolute top-2 left-2">
                            <span className="rounded bg-black/70 backdrop-blur-xs px-2 py-0.5 text-[10px] font-mono uppercase text-white font-medium border border-white/10">
                              {item.platform}
                            </span>
                          </div>
                          <div className="absolute top-2 right-2">
                            <span className="rounded bg-black/70 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold capitalize text-amber-400 border border-white/10">
                              {item.content_type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            onClick={() => onSelectContent(item.id)}
                            className="text-sm font-bold text-neutral-100 hover:text-amber-400 cursor-pointer leading-snug"
                          >
                            {item.title}
                          </h3>
                          <StatusBadge status={item.status} />
                        </div>

                        {/* Caption Preview (Section 11 requirement) */}
                        {item.caption ? (
                          <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-2.5 text-xs text-neutral-300 leading-relaxed font-sans line-clamp-3">
                            <span className="text-[10px] font-semibold text-amber-400 block mb-1 uppercase tracking-wider">
                              Draft Caption:
                            </span>
                            {item.caption}
                          </div>
                        ) : (
                          <p className="text-xs text-neutral-500 italic line-clamp-2">
                            {item.brief || 'Brief in progress.'}
                          </p>
                        )}

                        {/* Metadata row: Platform & Publishing Date */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-800/60 text-neutral-400">
                          <span className="flex items-center gap-1">
                            <span className="text-neutral-500">Channel:</span>
                            <strong className="text-neutral-200 capitalize font-medium">{item.platform}</strong>
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <span className="text-neutral-500">Publishing:</span>
                            <strong className="text-amber-400 font-semibold">{item.publishing_date || 'TBD'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Area (Section 11: Approve, Request Changes, Add comments, Preview) */}
                    <div className="p-4 pt-2 border-t border-neutral-800 bg-neutral-950/40 space-y-2">
                      {/* Inline feedback box if opened */}
                      {inlineFeedbackItemId === item.id ? (
                        <form onSubmit={handleSubmitInlineChanges} className="space-y-2 pt-1">
                          <textarea
                            rows={2}
                            required
                            value={inlineFeedbackText}
                            onChange={(e) => setInlineFeedbackText(e.target.value)}
                            placeholder="Detail required adjustments or creative edits..."
                            className="w-full rounded-lg border border-rose-500/50 bg-neutral-900 p-2 text-xs text-neutral-200 focus:outline-hidden focus:border-rose-400"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setInlineFeedbackItemId(null);
                                setInlineFeedbackText('');
                              }}
                              className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="rounded bg-rose-500 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-600 transition-colors"
                            >
                              Submit Change Request
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onOpenReviewModal(item.id)}
                              className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors flex items-center gap-1"
                            >
                              <Eye className="h-3.5 w-3.5 text-amber-400" />
                              <span>Preview</span>
                            </button>
                            <button
                              onClick={() => onSelectContent(item.id)}
                              className="rounded-lg border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
                              title="View discussion stream"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>{itemComms.length}</span>
                            </button>
                          </div>

                          {/* Approval / Changes action buttons */}
                          {item.status === 'client_review' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setInlineFeedbackItemId(item.id)}
                                className="rounded-lg border border-rose-500/40 bg-rose-950/20 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-950/50 transition-colors"
                              >
                                Request Changes
                              </button>
                              <button
                                onClick={() => handleQuickApprove(item.id)}
                                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors flex items-center gap-1 shadow-sm"
                              >
                                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                <span>Approve</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] font-mono text-neutral-500">
                              Status: {item.status.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

