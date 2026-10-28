import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatusBadge, RoleBadge } from '../common/StatusBadge';
import { ContentItem } from '../../types/database';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Film,
  ArrowRight,
  CheckSquare,
  FileText,
  Sliders,
  Send,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

interface QCDashboardProps {
  onNavigateTab: (tab: any) => void;
  onSelectContent: (id: string) => void;
}

export const QCDashboard: React.FC<QCDashboardProps> = ({
  onNavigateTab,
  onSelectContent,
}) => {
  const { currentUser } = useAuth();
  const {
    filteredContentItems,
    clients,
    profiles,
    updateContentStatus,
    addComment,
    isSaving,
  } = useData();

  const [activeTab, setActiveTab] = useState<'pending_qc' | 'revisions' | 'passed' | 'all'>('pending_qc');
  const [inspectingItem, setInspectingItem] = useState<ContentItem | null>(null);
  const [qcNotes, setQcNotes] = useState('');
  const [checklist, setChecklist] = useState({
    aspectRatio: true,
    audioLevels: true,
    subtitlesSync: true,
    brandColors: true,
    safeZones: true,
  });

  const pendingQCItems = filteredContentItems.filter((c) => c.status === 'internal_review');
  const revisionItems = filteredContentItems.filter((c) => c.status === 'changes_requested');
  const clientReviewItems = filteredContentItems.filter((c) => c.status === 'client_review');
  const passedItems = filteredContentItems.filter((c) => c.status === 'approved' || c.status === 'published' || c.status === 'completed');

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.company_name || 'Client';
  };

  const getAssigneeName = (userId?: string) => {
    if (!userId) return 'Unassigned';
    return profiles.find((p) => p.id === userId)?.full_name || 'Editor';
  };

  const handlePassQC = async (item: ContentItem) => {
    const success = await updateContentStatus(item.id, 'client_review');
    if (success) {
      if (qcNotes.trim()) {
        await addComment({
          contentId: item.id,
          comment: `✅ [QC PASSED]: ${qcNotes.trim()}`,
        });
      }
      setInspectingItem(null);
      setQcNotes('');
    }
  };

  const handleRequestRevision = async (item: ContentItem) => {
    if (!qcNotes.trim()) {
      alert('Please enter specific QC revision notes for the editor before returning the deliverable.');
      return;
    }
    const success = await updateContentStatus(item.id, 'changes_requested');
    if (success) {
      await addComment({
        contentId: item.id,
        comment: `⚠️ [QC REVISION REQUIRED]: ${qcNotes.trim()}`,
      });
      setInspectingItem(null);
      setQcNotes('');
    }
  };

  const displayedItems = (() => {
    switch (activeTab) {
      case 'pending_qc':
        return pendingQCItems;
      case 'revisions':
        return revisionItems;
      case 'passed':
        return [...clientReviewItems, ...passedItems];
      case 'all':
      default:
        return filteredContentItems;
    }
  })();

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-100">
              Quality Control (QC) Console
            </h1>
            <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[11px] font-semibold text-purple-300 border border-purple-500/30">
              Agency QA Gatekeeper
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Review video deliverables, inspect technical framing, sound sync, brand compliance, and sign off before client distribution.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('content')}
            className="rounded-lg bg-neutral-900 border border-neutral-800 px-3.5 py-2 text-xs font-medium text-neutral-200 hover:border-neutral-700 transition-colors"
          >
            All Content Pipeline
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400 text-xs font-medium">Awaiting QC Review</span>
            <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-purple-300">
            {pendingQCItems.length}
          </div>
          <div className="mt-1 text-[11px] text-purple-400/80">Needs QC inspection</div>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4">
          <div className="text-neutral-400 text-xs font-medium">Revisions in Progress</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-rose-400">
            {revisionItems.length}
          </div>
          <div className="mt-1 text-[11px] text-rose-400/80">Returned to editor</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">With Client for Sign-Off</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-amber-300">
            {clientReviewItems.length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Passed internal QC</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">Approved & Shipped</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-400">
            {passedItems.length}
          </div>
          <div className="mt-1 text-[11px] text-emerald-500/80">Client approved</div>
        </div>
      </div>

      {/* Inspection Modal / Drawer if selecting an item */}
      {inspectingItem && (
        <div className="rounded-xl border border-purple-500/50 bg-neutral-900 p-5 space-y-4 shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-neutral-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase text-purple-400">QC Inspection Desk</span>
                <span className="text-neutral-600">·</span>
                <span className="text-xs text-neutral-400">{getClientName(inspectingItem.client_id)}</span>
              </div>
              <h3 className="font-display text-lg font-bold text-neutral-100 mt-1">
                {inspectingItem.title}
              </h3>
            </div>
            <button
              onClick={() => setInspectingItem(null)}
              className="text-neutral-400 hover:text-neutral-200 text-xs px-2 py-1"
            >
              Close ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Technical Checklist */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 space-y-3">
              <div className="font-semibold text-xs text-neutral-200 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-purple-400" />
                <span>Zero Media Quality Checklist</span>
              </div>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-neutral-100">
                  <input
                    type="checkbox"
                    checked={checklist.aspectRatio}
                    onChange={(e) => setChecklist({ ...checklist, aspectRatio: e.target.checked })}
                    className="rounded border-neutral-700 bg-neutral-900 text-purple-500"
                  />
                  <span>Aspect ratio & export specs match platform (9:16 / 16:9 / 1080p)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-neutral-100">
                  <input
                    type="checkbox"
                    checked={checklist.audioLevels}
                    onChange={(e) => setChecklist({ ...checklist, audioLevels: e.target.checked })}
                    className="rounded border-neutral-700 bg-neutral-900 text-purple-500"
                  />
                  <span>Audio loudness balanced, dialogue clear, music appropriately ducked</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-neutral-100">
                  <input
                    type="checkbox"
                    checked={checklist.subtitlesSync}
                    onChange={(e) => setChecklist({ ...checklist, subtitlesSync: e.target.checked })}
                    className="rounded border-neutral-700 bg-neutral-900 text-purple-500"
                  />
                  <span>Subtitles/captions synced correctly with zero spelling or grammatical errors</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-neutral-100">
                  <input
                    type="checkbox"
                    checked={checklist.brandColors}
                    onChange={(e) => setChecklist({ ...checklist, brandColors: e.target.checked })}
                    className="rounded border-neutral-700 bg-neutral-900 text-purple-500"
                  />
                  <span>Brand guidelines, logo typography, color palette, and assets adhered to</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-neutral-300 hover:text-neutral-100">
                  <input
                    type="checkbox"
                    checked={checklist.safeZones}
                    onChange={(e) => setChecklist({ ...checklist, safeZones: e.target.checked })}
                    className="rounded border-neutral-700 bg-neutral-900 text-purple-500"
                  />
                  <span>Safe zones respected (no important captions cut off by Instagram/TikTok UI)</span>
                </label>
              </div>
            </div>

            {/* QC Review Verdict & Notes */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-neutral-200">
                QC Feedback & Inspector Notes
              </label>
              <textarea
                rows={4}
                value={qcNotes}
                onChange={(e) => setQcNotes(e.target.value)}
                placeholder="Detail timecodes or revision instructions (e.g. at 00:14 lower background beat, fix subtitle typo on 'guaranteed')..."
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-100 placeholder-neutral-600 focus:border-purple-400 focus:outline-hidden"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectContent(inspectingItem.id)}
                  className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Open Full Deliverable</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleRequestRevision(inspectingItem)}
                    className="rounded-lg bg-rose-950/60 border border-rose-800/80 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-950 transition-colors"
                  >
                    Request Editor Revision
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handlePassQC(inspectingItem)}
                    className="rounded-lg bg-purple-500 px-4 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-purple-400 transition-colors"
                  >
                    Pass QC → Client Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Queue Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs border-b border-neutral-800 pb-3">
        {[
          { id: 'pending_qc', label: 'Pending QC Inspection', count: pendingQCItems.length },
          { id: 'revisions', label: 'In Revision Rework', count: revisionItems.length },
          { id: 'passed', label: 'Passed QC & Sign-Offs', count: clientReviewItems.length + passedItems.length },
          { id: 'all', label: 'All Content', count: filteredContentItems.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-purple-400 bg-purple-400/10 text-purple-300 font-semibold'
                : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Deliverable Queue List */}
      <div className="space-y-3">
        {displayedItems.length === 0 ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto opacity-70 mb-2" />
            <div className="text-sm font-semibold text-neutral-200">No deliverables in this queue</div>
            <p className="text-xs text-neutral-500 mt-1">
              All clear! Any content moved to Internal Review will appear here for Quality Control sign-off.
            </p>
          </div>
        ) : (
          displayedItems.map((item) => {
            const isSelected = inspectingItem?.id === item.id;
            return (
              <div
                key={item.id}
                className={`rounded-xl border p-4 transition-all ${
                  isSelected
                    ? 'border-purple-500/80 bg-purple-950/20'
                    : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono text-neutral-500">
                        {getClientName(item.client_id)}
                      </span>
                      <span className="text-neutral-600">·</span>
                      <StatusBadge status={item.status} />
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                        {item.content_type.replace('_', ' ')}
                      </span>
                    </div>
                    <div
                      onClick={() => onSelectContent(item.id)}
                      className="font-semibold text-neutral-200 hover:text-amber-400 cursor-pointer transition-colors text-sm truncate"
                    >
                      {item.title}
                    </div>
                    <div className="text-[11px] text-neutral-400 flex items-center gap-3">
                      <span>Lead: <strong className="text-neutral-300">{getAssigneeName(item.assigned_to)}</strong></span>
                      {(item.publishing_date || item.due_date) && (
                        <span>Target: <strong className="text-neutral-300">{item.publishing_date || item.due_date}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectContent(item.id)}
                      className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-700 transition-colors"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        setInspectingItem(item);
                        setQcNotes('');
                      }}
                      className="rounded-lg bg-purple-500 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-purple-400 transition-colors flex items-center gap-1.5"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Inspect & Sign Off</span>
                    </button>
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
