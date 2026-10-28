import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ContentStatus, Platform, ContentType, formatRoleTitle } from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import {
  Film,
  X,
  Upload,
  Download,
  Calendar,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  User,
  Building2,
  ExternalLink,
  Users,
  Plus,
  Trash2,
  CalendarDays,
  Sparkles,
  ArrowRight,
  Share2,
  Layers,
} from 'lucide-react';

import { MediaViewer } from '../common/MediaViewer';
import { PlatformBadge, PlatformListBadges, formatPlatformName } from '../common/PlatformBadge';

interface ContentDetailModalProps {
  contentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenVersionModal: (id: string) => void;
  onOpenReviewModal: (id: string) => void;
}

export const ContentDetailModal: React.FC<ContentDetailModalProps> = ({
  contentId,
  isOpen,
  onClose,
  onOpenVersionModal,
  onOpenReviewModal,
}) => {
  const {
    getContentById,
    getClientById,
    getProjectById,
    getCycleById,
    profiles,
    contentVersions,
    approvals,
    comments,
    contentContributors,
    addComment,
    updateContentStatus,
    updateContentItem,
    addContentContributor,
    removeContentContributor,
    getOptionsByCategory,
  } = useData();
  const { currentUser, role } = useAuth();

  const platformOptions = getOptionsByCategory('platform');
  const [commentText, setCommentText] = useState('');
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionVal, setCaptionVal] = useState('');
  const [mobileTab, setMobileTab] = useState<'content' | 'metadata' | 'discussion'>('content');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // Platform edit state
  const [isEditingPlatforms, setIsEditingPlatforms] = useState(false);
  const [editedPlatforms, setEditedPlatforms] = useState<Platform[]>([]);

  // Contributor add state
  const [isAddingContrib, setIsAddingContrib] = useState(false);
  const [newContribUserId, setNewContribUserId] = useState('');
  const [newContribRole, setNewContribRole] = useState('Editing');
  const [dismissRevisionNotice, setDismissRevisionNotice] = useState(false);

  React.useEffect(() => {
    setDismissRevisionNotice(false);
    setIsEditingPlatforms(false);
  }, [contentId]);

  if (!isOpen || !contentId) return null;

  const item = getContentById(contentId);
  if (!item) return null;

  const client = getClientById(item.client_id);
  const project = getProjectById(item.project_id);
  const cycle = item.monthly_cycle_id ? getCycleById(item.monthly_cycle_id) : null;
  const assigned = profiles.find((p) => p.id === item.assigned_to);
  const creator = profiles.find((p) => p.id === item.created_by);
  const versions = contentVersions
    .filter((v) => v.content_id === contentId)
    .sort((a, b) => b.version_number - a.version_number);
  const activeVersion = versions.find((v) => v.id === selectedVersionId) || versions[0];
  const itemComments = comments.filter((c) => c.content_id === contentId);
  const itemApprovals = approvals.filter((a) => a.content_id === contentId);
  const latestChangeRequest = itemApprovals.find((a) => a.status === 'changes_requested');
  const requesterProfile = latestChangeRequest
    ? profiles.find((p) => p.id === latestChangeRequest.client_user_id)
    : null;
  const itemContributors = contentContributors.filter((cc) => cc.content_id === contentId);
  const itemPlatforms = (Array.isArray(item.platforms) && item.platforms.length > 0) ? item.platforms : [item.platform];

  // Check whether a revised version was uploaded after the change request was submitted
  const hasRevisedVersionUploaded = Boolean(
    latestChangeRequest && versions.some(
      (v) => new Date(v.created_at).getTime() > new Date(latestChangeRequest.created_at).getTime() || v.version_number > 1
    )
  );

  // Active revision request alert only appears when changes are actively requested and not yet addressed by a revised version
  const isRevisionRequestActive = item.status === 'changes_requested' && !hasRevisedVersionUploaded;

  // Check deadline warning conditions dynamically
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const inThreeDays = new Date(today.getTime() + 3 * 86400000).toISOString().split('T')[0];
  const isOverdue =
    (item.internal_due_date && item.internal_due_date < todayStr && !['completed', 'published', 'approved'].includes(item.status)) ||
    (item.due_date && item.due_date < todayStr && !['completed', 'published', 'approved'].includes(item.status));

  const isPublishingApproachingNotApproved =
    item.publishing_date &&
    item.publishing_date <= inThreeDays &&
    !['approved', 'scheduled', 'published', 'completed'].includes(item.status);

  const handleSaveCaption = () => {
    updateContentItem(contentId, { caption: captionVal });
    setEditingCaption(false);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment({ contentId, comment: commentText.trim() });
    setCommentText('');
  };

  const handleCreateContributor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContribUserId) return;
    addContentContributor(contentId, newContribUserId, newContribRole);
    setIsAddingContrib(false);
    setNewContribUserId('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden my-auto sm:my-6 max-h-[94dvh] sm:max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 sm:px-6 py-3 sm:py-4 bg-neutral-950 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Film className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-semibold text-neutral-100 truncate">{item.title}</h2>
                <StatusBadge status={item.status} />
                {cycle && (
                  <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                    Cycle: {cycle.month_name} {cycle.year}
                  </span>
                )}
              </div>
              <div className="text-[11px] sm:text-xs text-neutral-400 mt-1 truncate flex items-center gap-2 flex-wrap">
                <span>{client?.company_name}</span>
                <span>·</span>
                <span>{project?.project_name}</span>
                <span>·</span>
                <PlatformListBadges platforms={item.platforms} platform={item.platform} maxDisplay={4} size="xs" />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* DEADLINE WARNING ALERTS (Section 8 requirement) */}
        {isPublishingApproachingNotApproved && (
          <div className="bg-amber-950/50 border-b border-amber-600/40 px-4 sm:px-6 py-2 text-xs text-amber-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              <strong>Publishing Warning:</strong> Publishing scheduled for{' '}
              <strong className="underline">{item.publishing_date}</strong> but deliverable is not approved yet (Status: {item.status.replace('_', ' ')}).
            </span>
          </div>
        )}

        {isOverdue && !isPublishingApproachingNotApproved && (
          <div className="bg-rose-950/50 border-b border-rose-600/40 px-4 sm:px-6 py-2 text-xs text-rose-300 flex items-center gap-2">
            <Clock className="h-4 w-4 text-rose-400 shrink-0" />
            <span>
              <strong>Overdue Alert:</strong> Internal due date ({item.internal_due_date || item.due_date}) has passed. Action required to prevent publishing delay.
            </span>
          </div>
        )}

        {/* Mobile Tab Switcher */}
        <div className="lg:hidden flex border-b border-neutral-800 bg-neutral-950/60 px-4 pt-2 text-xs font-medium">
          <button
            onClick={() => setMobileTab('content')}
            className={`pb-2.5 mr-4 transition-colors border-b-2 font-semibold ${
              mobileTab === 'content'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Overview & Brief
          </button>
          <button
            onClick={() => setMobileTab('metadata')}
            className={`pb-2.5 mr-4 transition-colors border-b-2 font-semibold ${
              mobileTab === 'metadata'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Dates & Team
          </button>
          <button
            onClick={() => setMobileTab('discussion')}
            className={`pb-2.5 transition-colors border-b-2 font-semibold ${
              mobileTab === 'discussion'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Discussion ({itemComments.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left Area (7 cols on desktop) */}
          <div
            className={`lg:col-span-7 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-neutral-800 space-y-4 sm:space-y-5 ${
              mobileTab !== 'content' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* Version Switcher Pills (If multiple versions exist) */}
            {versions.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mr-1 shrink-0">
                  Version:
                </span>
                {versions.map((ver) => {
                  const isCurrent = (activeVersion?.id === ver.id);
                  const isMasterLatest = (versions[0]?.id === ver.id);
                  return (
                    <button
                      key={ver.id}
                      type="button"
                      onClick={() => setSelectedVersionId(ver.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-mono font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                        isCurrent
                          ? 'bg-amber-400 text-neutral-950 font-bold shadow-xs'
                          : 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
                      }`}
                    >
                      <span>V{ver.version_number}</span>
                      {isMasterLatest && (
                        <span className={`text-[9px] px-1 rounded uppercase tracking-wider ${
                          isCurrent ? 'bg-neutral-950/20 text-neutral-900 font-bold' : 'bg-amber-400/20 text-amber-300'
                        }`}>
                          Latest
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Media Showcase Player */}
            {(activeVersion || item.thumbnail_url) && (
              <MediaViewer
                fileUrl={activeVersion?.file_url || item.thumbnail_url}
                fileName={activeVersion?.file_name}
                title={item.title}
                versionNumber={activeVersion?.version_number}
                thumbnailUrl={item.thumbnail_url}
                notes={activeVersion?.notes}
              />
            )}

            {/* Automated Workflow Pipeline Stage (Automatic stage progression) */}
            <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                    Workflow Pipeline Stage
                  </span>
                  <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
                    11-Step Lifecycle
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {role !== 'client' && role !== 'viewer' ? (
                    <select
                      value={item.status}
                      onChange={(e) => updateContentStatus(item.id, e.target.value as ContentStatus)}
                      className="rounded-lg border border-neutral-700 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-100 font-medium focus:border-amber-400 focus:outline-hidden"
                    >
                      <option value="idea">💡 Idea (Step 1 — Incubation)</option>
                      <option value="planned">📋 Planned (Step 2 — Sprint)</option>
                      <option value="assigned">👤 Assigned (Step 3 — Editor)</option>
                      <option value="in_production">🎬 In Production (Step 4 — Active edit)</option>
                      <option value="internal_review">🔍 Internal Review (Step 5 — QA)</option>
                      <option value="client_review">👁️ Client Review (Step 6 — Sign-off)</option>
                      <option value="changes_requested">⚠️ Changes Requested (Step 7)</option>
                      <option value="approved">✅ Approved (Step 8 — Locked)</option>
                      <option value="scheduled">📅 Scheduled (Step 9 — Queue)</option>
                      <option value="published">🚀 Published (Step 10 — Live)</option>
                      <option value="completed">📦 Completed (Step 11 — Archive)</option>
                    </select>
                  ) : (
                    <StatusBadge status={item.status} />
                  )}
                </div>
              </div>

              {/* Automatic Pipeline State Description */}
              <div className="rounded-lg border border-neutral-800/90 bg-neutral-900/60 p-2.5 text-xs">
                {item.status === 'idea' ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-amber-300">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>Step 1: Idea Incubation</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Deliverable is currently incubating in the idea stage for concept development, scripting, and review. When ready to brief into active sprint, promote it to <strong className="text-teal-400 font-semibold">Planned</strong>.
                    </p>
                  </div>
                ) : item.status === 'planned' ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-teal-300">
                      <Clock className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                      <span>Step 2: Planned Sprint</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Deliverable is scheduled in the sprint queue with target dates. When team is ready to shoot or edit, move to <strong className="text-sky-400 font-semibold">In Production</strong>.
                    </p>
                  </div>
                ) : item.status === 'client_review' ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-amber-300">
                      <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span>In Client Review</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Deliverable is actively under review. Pipeline stage changes automatically to{' '}
                      <strong className="text-emerald-400 font-semibold">Approved</strong> or{' '}
                      <strong className="text-rose-400 font-semibold">Changes Requested</strong> based on the client review decision.
                    </p>
                  </div>
                ) : item.status === 'changes_requested' ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-rose-400">
                      <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                      <span>Revisions Requested by Client</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Client submitted revision feedback. Uploading a revised version will automatically transition this deliverable back to{' '}
                      <strong className="text-amber-300 font-semibold">Client Review</strong>.
                    </p>
                  </div>
                ) : item.status === 'approved' ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Client Approved</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Approved by client on {item.approval_date || 'scheduled date'}. Content is locked and ready to queue for publishing.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-neutral-200 capitalize">
                        {item.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">Stage: {item.status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Pipeline stage updates automatically according to review decisions, version uploads, and production milestones.
                    </p>
                  </div>
                )}
              </div>

              {/* Automatic Workflow Action Shortcuts */}
              {role !== 'client' && role !== 'viewer' && (
                <div className="space-y-2 pt-0.5">
                  {item.status === 'idea' && (
                    <button
                      type="button"
                      onClick={() => updateContentStatus(item.id, 'planned', 'Promoted from Idea to Planned sprint')}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-400/50 bg-amber-400/15 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400 hover:text-neutral-950 transition-colors shadow-xs"
                    >
                      <span>Promote to Planned Sprint (Step 2)</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {item.status === 'planned' && (
                    <button
                      type="button"
                      onClick={() => updateContentStatus(item.id, 'in_production', 'Started creative production')}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-400/50 bg-sky-500/15 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500 hover:text-neutral-950 transition-colors shadow-xs"
                    >
                      <span>Start Production (Step 4)</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {item.status === 'assigned' && (
                    <button
                      type="button"
                      onClick={() => updateContentStatus(item.id, 'in_production', 'Started creative production')}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-sky-400/50 bg-sky-500/15 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500 hover:text-neutral-950 transition-colors shadow-xs"
                    >
                      <span>Begin Production (Step 4)</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {item.status === 'in_production' && (
                    <div className="flex items-center gap-2 w-full flex-wrap sm:flex-nowrap">
                      <button
                        type="button"
                        onClick={() => updateContentStatus(item.id, 'internal_review', 'Submitted for agency QA review')}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-400/40 bg-indigo-500/15 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/25 transition-colors"
                      >
                        <span>Submit for Internal QA (Step 5)</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateContentStatus(item.id, 'client_review', 'Deliverable submitted for client review')}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/15 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400 hover:text-neutral-950 transition-colors"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Send to Client Review (Step 6)</span>
                      </button>
                    </div>
                  )}

                  {item.status === 'internal_review' && (
                    <button
                      type="button"
                      onClick={() => updateContentStatus(item.id, 'client_review', 'Deliverable submitted for client review')}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/20 transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Send Deliverable to Client Review (Step 6)</span>
                    </button>
                  )}

                  {item.status === 'changes_requested' && (
                    <button
                      type="button"
                      onClick={() => onOpenVersionModal(item.id)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-200 hover:text-white hover:border-neutral-600 transition-colors"
                    >
                      <Upload className="h-3.5 w-3.5 text-amber-400" />
                      <span>Upload Revised Version</span>
                    </button>
                  )}

                  {item.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => updateContentStatus(item.id, 'scheduled', 'Deliverable queued in scheduler')}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-teal-400/40 bg-teal-500/15 px-3 py-2 text-xs font-semibold text-teal-300 hover:bg-teal-500 hover:text-neutral-950 transition-colors"
                    >
                      <span>Queue in Publishing Scheduler (Step 9)</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {item.status === 'scheduled' && (
                    <button
                      type="button"
                      onClick={() => updateContentStatus(item.id, 'published', 'Deliverable confirmed live on channels')}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500 hover:text-neutral-950 transition-colors"
                    >
                      <span>Confirm Published Live on Channels (Step 10)</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {item.status === 'published' && (
                    <button
                      type="button"
                      onClick={() => updateContentStatus(item.id, 'completed', 'Deliverable completed and archived')}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Mark Deliverable Completed & Archive (Step 11)</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Client View Action Shortcut (Only for Client end) */}
            {role === 'client' && (item.status === 'client_review' || item.status === 'changes_requested') && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-center justify-between">
                <span className="text-xs font-medium text-amber-300">
                  Deliverable is ready for your review and decision
                </span>
                <button
                  onClick={() => onOpenReviewModal(item.id)}
                  className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors shadow-xs"
                >
                  Open Client Review Desk &rarr;
                </button>
              </div>
            )}

            {/* CLIENT REVISION REQUEST PROMINENT ALERT (Closes once revised version is submitted or user dismisses) */}
            {isRevisionRequestActive && !dismissRevisionNotice && (
              <div className="rounded-xl border border-rose-500/50 bg-rose-950/30 p-4 space-y-3 shadow-md relative">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                      Client Requested Revisions
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {latestChangeRequest && (
                      <span className="text-[11px] font-mono text-neutral-400">
                        Submitted {new Date(latestChangeRequest.created_at).toLocaleDateString()} at{' '}
                        {new Date(latestChangeRequest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setDismissRevisionNotice(true)}
                      className="rounded p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                      title="Close revision message"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-rose-900/60 bg-neutral-950/90 p-3.5 text-xs text-neutral-100 leading-relaxed font-sans space-y-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-400 flex items-center justify-between">
                    <span>Client's Specific Instructions:</span>
                    {requesterProfile && (
                      <span className="text-neutral-400 font-normal">
                        By <strong className="text-neutral-200">{requesterProfile.full_name}</strong> ({requesterProfile.role.replace('_', ' ')})
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap font-medium text-neutral-200">
                    "{latestChangeRequest?.comment || item.notes || 'Please make adjustments based on client review.'}"
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap pt-1 text-xs">
                  {role === 'client' ? (
                    <button
                      onClick={() => onOpenReviewModal(item.id)}
                      className="rounded-lg bg-rose-500/15 border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/25 transition-colors flex items-center gap-1.5"
                    >
                      <span>Open Sign-off Review Desk &rarr;</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 w-full justify-end">
                      <button
                        onClick={() => updateContentStatus(item.id, 'in_production')}
                        className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
                        title="Move deliverable back into active edit"
                      >
                        Set In Production
                      </button>
                      <button
                        onClick={() => onOpenVersionModal(item.id)}
                        className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <Upload className="h-3 w-3" />
                        <span>Upload Revised Version</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Revised Version Submitted Status: Replaces revision request banner once resolved */}
            {hasRevisedVersionUploaded && item.status === 'client_review' && !dismissRevisionNotice && (
              <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3.5 text-xs text-sky-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-sky-300 block">
                      Revised Version Submitted
                    </span>
                    <span className="text-[11px] text-sky-200/80">
                      Customer requested revisions have been addressed with a new version and dispatched to Client Review.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissRevisionNotice(true)}
                  className="rounded p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors shrink-0"
                  title="Close message"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Creative Brief */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                Creative Production Brief
              </div>
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3.5 text-xs text-neutral-300 leading-relaxed">
                {item.brief || 'No detailed brief available.'}
              </div>
            </div>

            {/* Caption & Copy Section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Caption / Social Copy
                </span>
                {!editingCaption && role !== 'client' && (
                  <button
                    onClick={() => {
                      setCaptionVal(item.caption || '');
                      setEditingCaption(true);
                    }}
                    className="text-xs text-amber-400 hover:underline"
                  >
                    Edit Copy
                  </button>
                )}
              </div>

              {editingCaption ? (
                <div className="space-y-2">
                  <textarea
                    rows={4}
                    value={captionVal}
                    onChange={(e) => setCaptionVal(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-200 focus:border-amber-400 focus:outline-hidden"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingCaption(false)}
                      className="px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCaption}
                      className="rounded bg-amber-400 px-3 py-1 text-xs font-semibold text-neutral-950 hover:bg-amber-300"
                    >
                      Save Copy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3.5 text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {item.caption || 'No caption created yet.'}
                </div>
              )}
            </div>

            {/* Production Notes if any */}
            {item.notes && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Production Notes
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-2.5 text-xs text-neutral-400">
                  {item.notes}
                </div>
              </div>
            )}

            {/* Deliverable Versions List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Deliverable Versions ({versions.length})
                </span>
                {role !== 'client' && (
                  <button
                    onClick={() => onOpenVersionModal(item.id)}
                    className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline"
                  >
                    <Upload className="h-3 w-3" />
                    <span>Upload New Version</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {versions.length === 0 ? (
                  <div className="rounded border border-dashed border-neutral-800 p-4 text-center text-xs text-neutral-500">
                    No files uploaded yet.
                  </div>
                ) : (
                  versions.map((v) => {
                    const uploader = profiles.find((p) => p.id === v.uploaded_by);
                    const isSelected = activeVersion?.id === v.id;
                    const isLatest = versions[0]?.id === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVersionId(v.id)}
                        className={`cursor-pointer flex items-center justify-between rounded-lg border p-2.5 text-xs transition-colors ${
                          isSelected
                            ? 'border-amber-500/60 bg-amber-500/10'
                            : 'border-neutral-800/80 bg-neutral-950/40 hover:border-neutral-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-neutral-200 flex items-center gap-2">
                            <span>Version {v.version_number}: {v.file_name}</span>
                            {isLatest && (
                              <span className="rounded bg-amber-400/20 px-1.5 py-0.2 text-[9px] font-mono text-amber-300 border border-amber-400/30">
                                Latest
                              </span>
                            )}
                            {isSelected && (
                              <span className="text-[10px] text-amber-400 font-medium">
                                (Active Preview)
                              </span>
                            )}
                          </div>
                          {v.notes && <div className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">{v.notes}</div>}
                          <div className="text-[10px] text-neutral-500 mt-0.5">
                            Uploaded by {uploader?.full_name || 'Team member'} · {new Date(v.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedVersionId(v.id)}
                            className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                              isSelected
                                ? 'bg-amber-400 text-neutral-950 font-bold'
                                : 'bg-neutral-800 text-neutral-300 hover:text-white'
                            }`}
                          >
                            {isSelected ? 'Viewing' : 'View'}
                          </button>
                          <a
                            href={v.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded border border-neutral-700 bg-neutral-800 p-1.5 text-neutral-300 hover:text-white transition-colors"
                            title="Download file"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Area: Metadata, Individual Dates, Contributors, Comments (5 cols on desktop) */}
          <div
            className={`lg:col-span-5 p-4 sm:p-6 space-y-5 flex flex-col justify-between bg-neutral-950/20 ${
              mobileTab === 'content' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className={`space-y-4 ${mobileTab === 'discussion' ? 'hidden lg:block' : 'block'}`}>
              {/* DISTRIBUTION PLATFORMS */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Target Platforms ({itemPlatforms.length})</span>
                  </div>
                  {role !== 'client' && !isEditingPlatforms && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditedPlatforms(itemPlatforms);
                        setIsEditingPlatforms(true);
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-medium"
                    >
                      Edit Channels
                    </button>
                  )}
                </div>

                {isEditingPlatforms ? (
                  <div className="space-y-2.5 pt-1">
                    <p className="text-[11px] text-neutral-400">
                      Mark platforms to cross-post this deliverable:
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {platformOptions.map((opt) => {
                        const isSelected = editedPlatforms.includes(opt.key as Platform);
                        return (
                          <div
                            key={opt.key}
                            onClick={() => {
                              if (isSelected) {
                                if (editedPlatforms.length > 1) {
                                  setEditedPlatforms(editedPlatforms.filter((p) => p !== opt.key));
                                }
                              } else {
                                setEditedPlatforms([...editedPlatforms, opt.key as Platform]);
                              }
                            }}
                            className={`cursor-pointer rounded border p-2 flex items-center gap-2 text-xs transition-colors select-none ${
                              isSelected
                                ? 'border-amber-400/60 bg-amber-400/10 text-neutral-100 font-semibold'
                                : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-neutral-700 bg-neutral-950 text-amber-400 pointer-events-none h-3.5 w-3.5"
                            />
                            <span className="truncate">{opt.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-end gap-2 pt-1 border-t border-neutral-800">
                      <button
                        type="button"
                        onClick={() => setIsEditingPlatforms(false)}
                        className="px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (editedPlatforms.length > 0) {
                            updateContentItem(item.id, {
                              platforms: editedPlatforms,
                              platform: editedPlatforms[0],
                            });
                          }
                          setIsEditingPlatforms(false);
                        }}
                        className="rounded bg-amber-400 px-3 py-1 text-xs font-semibold text-neutral-950 hover:bg-amber-300"
                      >
                        Save Channels
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {itemPlatforms.map((p, idx) => (
                      <PlatformBadge
                        key={`${p}_${idx}`}
                        platform={p}
                        isPrimary={idx === 0 && itemPlatforms.length > 1}
                        size="sm"
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 6: INDIVIDUAL CONTENT DATES */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400 border-b border-neutral-800 pb-2">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>Production & Publishing Dates</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-0.5">
                    <span className="text-neutral-500">Production Start:</span>
                    <span className="font-mono text-neutral-200 tabular-nums">
                      {item.production_start_date || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-neutral-500">Internal Due:</span>
                    <span className="font-mono text-neutral-200 tabular-nums">
                      {item.internal_due_date || item.due_date}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-neutral-500">Client Review Date:</span>
                    <span className="font-mono text-neutral-200 tabular-nums">
                      {item.client_review_date || 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-neutral-500">Approval Date:</span>
                    <span className="font-mono text-emerald-400 tabular-nums">
                      {item.approval_date || (item.status === 'approved' ? 'Approved' : 'Pending')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-t border-neutral-800/60">
                    <span className="text-amber-400 font-medium">Publishing Date:</span>
                    <span className="font-mono text-amber-300 font-bold tabular-nums">
                      {item.publishing_date || 'Unscheduled'}
                    </span>
                  </div>
                  {item.actual_published_date && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-emerald-400">Actual Published:</span>
                      <span className="font-mono text-emerald-400 tabular-nums font-semibold">
                        {item.actual_published_date}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* TEAM ASSIGNMENTS & MULTIPLE CONTRIBUTORS (Section 4 & 14) */}
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300">
                    <Users className="h-3.5 w-3.5 text-sky-400" />
                    <span>Creative Team & Contributors</span>
                  </div>
                  {role !== 'client' && !isAddingContrib && (
                    <button
                      onClick={() => setIsAddingContrib(true)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Contributor</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  {/* Lead Assignee */}
                  <div className="flex items-center justify-between py-1 bg-neutral-900/60 rounded px-2">
                    <div>
                      <span className="text-neutral-400 font-medium">Lead Assignee: </span>
                      <strong className="text-neutral-100">{assigned?.full_name || 'Unassigned'}</strong>
                    </div>
                    <span className="text-[10px] text-neutral-500 capitalize">{assigned?.role.replace('_', ' ')}</span>
                  </div>

                  {/* Multiple Contributors */}
                  {itemContributors.map((contrib) => {
                    const contribUser = profiles.find((p) => p.id === contrib.user_id);
                    return (
                      <div
                        key={contrib.id}
                        className="flex items-center justify-between py-1 px-2 rounded border border-neutral-800/80 bg-neutral-950/40"
                      >
                        <div>
                          <span className="text-amber-300 font-semibold">{contrib.role_in_content}: </span>
                          <span className="text-neutral-200">{contribUser?.full_name || 'Team member'}</span>
                        </div>
                        {role !== 'client' && (
                          <button
                            onClick={() => removeContentContributor(contrib.id)}
                            className="text-neutral-500 hover:text-rose-400 p-0.5"
                            title="Remove"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Contributor Form */}
                  {isAddingContrib && (
                    <form onSubmit={handleCreateContributor} className="space-y-2 pt-2 border-t border-neutral-800">
                      <div className="flex gap-2">
                        <select
                          required
                          value={newContribUserId}
                          onChange={(e) => setNewContribUserId(e.target.value)}
                          className="flex-1 rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-200"
                        >
                          <option value="">Select team member...</option>
                          {profiles
                            .filter((p) => p.role !== 'client' && p.role !== 'viewer')
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.full_name} ({formatRoleTitle(p.role)})
                              </option>
                            ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Role (e.g. Shooting, Editing, Caption)"
                          value={newContribRole}
                          onChange={(e) => setNewContribRole(e.target.value)}
                          className="w-36 rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-200"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingContrib(false)}
                          className="px-2 py-0.5 text-xs text-neutral-400"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!newContribUserId}
                          className="rounded bg-amber-400 px-2.5 py-0.5 text-xs font-semibold text-neutral-950 disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>

            {/* Discussion Feed */}
            <div
              className={`border-t border-neutral-800 pt-4 space-y-3 ${
                mobileTab === 'metadata' ? 'hidden lg:block' : 'block'
              }`}
            >
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                Discussion Stream ({itemComments.length})
              </h4>

              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {itemComments.length === 0 ? (
                  <div className="py-3 text-center text-xs text-neutral-500">
                    No notes or comments yet.
                  </div>
                ) : (
                  itemComments.map((comm) => {
                    const author = profiles.find((p) => p.id === comm.user_id);
                    const isRevisionReq = comm.comment.includes('Revision Request');
                    return (
                      <div
                        key={comm.id}
                        className={`rounded-lg p-2.5 text-xs ${
                          isRevisionReq
                            ? 'border border-rose-500/40 bg-rose-950/25'
                            : 'border border-neutral-800 bg-neutral-950/60'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className={`font-semibold flex items-center gap-1.5 ${isRevisionReq ? 'text-rose-400' : 'text-neutral-200'}`}>
                            {isRevisionReq && <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />}
                            <span>{author?.full_name || 'User'}</span>
                            {isRevisionReq && (
                              <span className="rounded bg-rose-500/20 px-1.5 py-0.2 text-[9px] font-bold text-rose-300 uppercase tracking-wider">
                                Client Request
                              </span>
                            )}
                          </span>
                          <span className="text-neutral-500 text-[10px]">
                            {new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={`leading-relaxed ${isRevisionReq ? 'text-rose-100 font-medium' : 'text-neutral-300'}`}>
                          {comm.comment}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Post comment or feedback..."
                  className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-600 focus:border-neutral-700 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-700 transition-colors disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

