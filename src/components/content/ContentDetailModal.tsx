import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ContentStatus, Platform, ContentType } from '../../types/database';
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
  User,
  Building2,
  ExternalLink,
  Users,
  Plus,
  Trash2,
  CalendarDays,
  Sparkles,
} from 'lucide-react';

interface ContentDetailModalProps {
  contentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenVersionModal: (id: string) => void;
  onOpenReviewModal: (id: string) => void;
}

const ALL_STATUSES: { value: ContentStatus; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'planned', label: 'Planned' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_production', label: 'In Production' },
  { value: 'internal_review', label: 'Internal Review' },
  { value: 'client_review', label: 'Client Review' },
  { value: 'changes_requested', label: 'Changes Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'completed', label: 'Completed' },
];

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
    comments,
    contentContributors,
    addComment,
    updateContentStatus,
    updateContentItem,
    addContentContributor,
    removeContentContributor,
  } = useData();
  const { currentUser, role } = useAuth();

  const [commentText, setCommentText] = useState('');
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionVal, setCaptionVal] = useState('');
  const [mobileTab, setMobileTab] = useState<'content' | 'metadata' | 'discussion'>('content');

  // Contributor add state
  const [isAddingContrib, setIsAddingContrib] = useState(false);
  const [newContribUserId, setNewContribUserId] = useState('');
  const [newContribRole, setNewContribRole] = useState('Editing');

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
  const itemComments = comments.filter((c) => c.content_id === contentId);
  const itemContributors = contentContributors.filter((cc) => cc.content_id === contentId);

  // Check deadline warning conditions (Section 8)
  const todayStr = '2026-10-02';
  const isOverdue =
    (item.internal_due_date && item.internal_due_date < todayStr && !['completed', 'published', 'approved'].includes(item.status)) ||
    (item.due_date && item.due_date < todayStr && !['completed', 'published', 'approved'].includes(item.status));

  const isPublishingApproachingNotApproved =
    item.publishing_date &&
    item.publishing_date <= '2026-10-06' &&
    !['approved', 'scheduled', 'published', 'completed'].includes(item.status);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateContentStatus(contentId, e.target.value as ContentStatus);
  };

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
              <div className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 truncate flex items-center gap-2">
                <span>{client?.company_name}</span>
                <span>·</span>
                <span>{project?.project_name}</span>
                <span>·</span>
                <span className="font-mono text-neutral-300 capitalize">{item.platform}</span>
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
            Media & Brief
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
            {/* Visual media header */}
            {item.thumbnail_url && (
              <div className="aspect-video w-full rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden relative">
                <img
                  src={item.thumbnail_url}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* Workflow state control */}
            {role !== 'client' && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                    Workflow Pipeline Stage
                  </span>
                  {item.status === 'client_review' && (
                    <button
                      onClick={() => onOpenReviewModal(item.id)}
                      className="text-xs text-amber-400 hover:underline font-semibold"
                    >
                      Open Client Sign-off View &rarr;
                    </button>
                  )}
                </div>
                <select
                  value={item.status}
                  onChange={handleStatusChange}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-medium text-amber-400 focus:border-amber-400 focus:outline-hidden"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      Stage: {s.label}
                    </option>
                  ))}
                </select>
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
                  versions.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-800/80 bg-neutral-950/40 p-2.5 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-neutral-200">
                          Version {v.version_number}: {v.file_name}
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">{v.notes}</div>
                      </div>
                      <a
                        href={v.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-neutral-700 bg-neutral-800 p-1.5 text-neutral-300 hover:text-white"
                        title="Download file"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ))
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
                                {p.full_name} ({p.role.replace('_', ' ')})
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
                    return (
                      <div
                        key={comm.id}
                        className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-neutral-200">
                            {author?.full_name || 'User'}
                          </span>
                          <span className="text-neutral-500 text-[10px]">
                            {new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-neutral-300 leading-relaxed">{comm.comment}</p>
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

