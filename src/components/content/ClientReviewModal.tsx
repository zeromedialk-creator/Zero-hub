import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Clock,
  Send,
  Download,
  Film,
  ExternalLink,
} from 'lucide-react';

import { MediaViewer } from '../common/MediaViewer';

interface ClientReviewModalProps {
  contentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClientReviewModal: React.FC<ClientReviewModalProps> = ({ contentId, isOpen, onClose }) => {
  const { getContentById, contentVersions, approvals, comments, approveContent, requestChanges, addComment, profiles } = useData();
  const { currentUser, role } = useAuth();

  const [decision, setDecision] = useState<'approve' | 'request_changes' | null>(null);
  const [commentText, setCommentText] = useState('');
  const [newDiscussionComment, setNewDiscussionComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'decision' | 'preview' | 'discussion'>('decision');
  const [reopenReview, setReopenReview] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [dismissRevisionNotice, setDismissRevisionNotice] = useState(false);

  React.useEffect(() => {
    setDismissRevisionNotice(false);
  }, [contentId]);

  if (!isOpen || !contentId || role !== 'client') return null;

  const item = getContentById(contentId);
  if (!item) return null;

  const versions = contentVersions.filter((v) => v.content_id === contentId).sort((a, b) => b.version_number - a.version_number);
  const latestVersion = versions[0];
  const activeVersion = versions.find((v) => v.id === selectedVersionId) || latestVersion;
  const itemComments = comments.filter((c) => c.content_id === contentId);
  const itemApprovals = approvals.filter((a) => a.content_id === contentId);
  const latestChangeRequest = itemApprovals.find((a) => a.status === 'changes_requested');
  const requesterProfile = latestChangeRequest
    ? profiles.find((p) => p.id === latestChangeRequest.client_user_id)
    : null;

  // Check whether a revised version was uploaded after the change request was submitted
  const hasRevisedVersionUploaded = Boolean(
    latestChangeRequest && versions.some(
      (v) => new Date(v.created_at).getTime() > new Date(latestChangeRequest.created_at).getTime() || v.version_number > 1
    )
  );

  // Active revision request alert only appears when changes are actively requested and not yet addressed
  const isRevisionRequestActive = item.status === 'changes_requested' && !hasRevisedVersionUploaded;

  const canSubmitReview = role === 'client';

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (decision === 'request_changes' && !commentText.trim()) {
      setFormError('Please provide detailed feedback explaining what changes are needed.');
      return;
    }

    setSubmitting(true);
    try {
      if (decision === 'approve') {
        await approveContent(contentId, commentText || 'Approved by client.');
      } else if (decision === 'request_changes') {
        await requestChanges(contentId, commentText);
      }
      setSubmitting(false);
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to submit review decision');
      setSubmitting(false);
    }
  };

  const handleSendDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscussionComment.trim()) return;
    addComment({ contentId, comment: newDiscussionComment.trim() });
    setNewDiscussionComment('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden my-2 sm:my-6 max-h-[94vh] sm:max-h-[88vh] flex flex-col">
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
              </div>
              <div className="text-[11px] sm:text-xs text-neutral-400 capitalize truncate">
                {item.platform} · {item.content_type.replace('_', ' ')} · V{latestVersion?.version_number || 1}
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

        {/* Mobile Tab Switcher */}
        <div className="lg:hidden flex border-b border-neutral-800 bg-neutral-950/60 px-4 pt-2 text-xs font-medium">
          <button
            onClick={() => setMobileTab('decision')}
            className={`pb-2.5 mr-4 transition-colors border-b-2 font-semibold ${
              mobileTab === 'decision'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Sign-Off & Decision
          </button>
          <button
            onClick={() => setMobileTab('preview')}
            className={`pb-2.5 mr-4 transition-colors border-b-2 font-semibold ${
              mobileTab === 'preview'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            Asset Preview & Brief
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

        {/* Content Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left Column: Visual Asset Preview & Caption (7 cols on desktop, shown on mobile if mobileTab === 'preview') */}
          <div className={`lg:col-span-7 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-neutral-800 space-y-4 sm:space-y-5 ${
            mobileTab !== 'preview' ? 'hidden lg:block' : 'block'
          }`}>
            {/* Version Switcher Pills (If multiple versions exist) */}
            {versions.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mr-1 shrink-0">
                  Select Version:
                </span>
                {versions.map((ver) => {
                  const isCurrent = (activeVersion?.id === ver.id);
                  const isMasterLatest = (latestVersion?.id === ver.id);
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

            {/* Visual Media Showcase with Video & Image & Cloud Link support */}
            <MediaViewer
              fileUrl={activeVersion?.file_url || item.thumbnail_url}
              fileName={activeVersion?.file_name}
              title={item.title}
              versionNumber={activeVersion?.version_number || 1}
              thumbnailUrl={item.thumbnail_url}
              notes={activeVersion?.notes}
            />

            {/* Creative Brief */}
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 block mb-1">
                Creative Brief
              </label>
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs text-neutral-300 leading-relaxed">
                {item.brief || 'No brief specified.'}
              </div>
            </div>

            {/* Final Social Caption */}
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 block mb-1">
                Approved Copy / Caption
              </label>
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs text-neutral-300 whitespace-pre-wrap font-sans leading-relaxed">
                {item.caption || 'No caption drafted yet.'}
              </div>
            </div>

            {/* Version History Archive */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 block">
                  Version History ({versions.length})
                </label>
                <span className="text-[10px] text-neutral-500">
                  Click any version to preview asset
                </span>
              </div>
              <div className="space-y-2">
                {versions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-neutral-800 p-3 text-center text-xs text-neutral-500">
                    No version history records found.
                  </div>
                ) : (
                  versions.map((ver) => {
                    const uploader = profiles.find((p) => p.id === ver.uploaded_by);
                    const isSelected = activeVersion?.id === ver.id;
                    const isLatest = latestVersion?.id === ver.id;
                    return (
                      <div
                        key={ver.id}
                        onClick={() => setSelectedVersionId(ver.id)}
                        className={`cursor-pointer flex items-center justify-between rounded-lg border p-2.5 text-xs transition-colors ${
                          isSelected
                            ? 'border-amber-500/60 bg-amber-500/10'
                            : 'border-neutral-800/80 bg-neutral-950/40 hover:border-neutral-700'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-neutral-200 flex items-center gap-2">
                            <span>Version {ver.version_number}: {ver.file_name}</span>
                            {isLatest && (
                              <span className="rounded bg-amber-400/20 px-1.5 py-0.2 text-[9px] font-mono text-amber-300 border border-amber-400/30">
                                Latest Master
                              </span>
                            )}
                            {isSelected && (
                              <span className="text-[10px] text-amber-400 font-medium">
                                (Now Previewing)
                              </span>
                            )}
                          </div>
                          {ver.notes && <div className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">{ver.notes}</div>}
                          <div className="text-[10px] text-neutral-500 mt-0.5">
                            Uploaded by {uploader?.full_name || 'Creative Team'} · {new Date(ver.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setSelectedVersionId(ver.id)}
                            className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                              isSelected
                                ? 'bg-amber-400 text-neutral-950 font-bold'
                                : 'bg-neutral-800 text-neutral-300 hover:text-white'
                            }`}
                          >
                            {isSelected ? 'Viewing' : 'Inspect'}
                          </button>
                          <a
                            href={ver.file_url}
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

          {/* Right Column: Approval Action & Discussion (5 cols on desktop, shown on mobile if mobileTab === 'decision' or 'discussion') */}
          <div className={`lg:col-span-5 p-4 sm:p-6 space-y-6 flex flex-col justify-between bg-neutral-950/30 ${
            mobileTab === 'preview' ? 'hidden lg:flex' : 'flex'
          }`}>
            {/* Approval Decision Form (Always on desktop, on mobile if mobileTab === 'decision') */}
            <div className={`space-y-4 ${mobileTab === 'discussion' ? 'hidden lg:block' : 'block'}`}>
              <div className="border-b border-neutral-800 pb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
                  Client Review Decision
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Sign off for release or submit revision notes to the creative team
                </p>
              </div>

              {item.status === 'approved' && !reopenReview ? (
                <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/30 p-4 text-xs text-emerald-300 space-y-3">
                  <div className="font-semibold flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Content Approved!
                  </div>
                  <p className="text-[11px] text-emerald-300/80">
                    This deliverable is locked and queued for publishing on {item.publishing_date || 'scheduled date'}.
                  </p>
                  {canSubmitReview && (
                    <button
                      type="button"
                      onClick={() => {
                        setReopenReview(true);
                        setDecision('request_changes');
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Request Further Changes / Revise</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* PROMINENT REVISION REQUEST FEEDBACK CARD (Closes when revised version is submitted or dismissed) */}
                  {isRevisionRequestActive && !dismissRevisionNotice && (
                    <div className="rounded-xl border border-rose-500/40 bg-rose-950/25 p-4 space-y-2.5 shadow-sm relative">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider">
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                          <span>Revisions Requested by Client</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {latestChangeRequest && (
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {new Date(latestChangeRequest.created_at).toLocaleDateString()} at{' '}
                              {new Date(latestChangeRequest.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setDismissRevisionNotice(true)}
                            className="rounded p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                            title="Close message"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="rounded-lg border border-rose-900/50 bg-neutral-950/80 p-3 text-xs text-neutral-100 leading-relaxed font-sans">
                        <span className="text-[10px] font-semibold text-rose-400 block mb-1 uppercase tracking-wider">
                          Client Revision Instructions:
                        </span>
                        <p className="whitespace-pre-wrap text-neutral-200 font-medium">
                          "{latestChangeRequest?.comment || item.notes || 'Revisions required.'}"
                        </p>
                        <div className="text-[10px] text-neutral-400 mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                          <span>
                            Requested by: <strong className="text-neutral-200">{requesterProfile?.full_name || 'Client Representative'}</strong>
                          </span>
                          <span className="capitalize text-neutral-500">{requesterProfile?.role.replace('_', ' ') || 'Client'}</span>
                        </div>
                      </div>

                      {role !== 'client' ? (
                        <div className="rounded-lg bg-neutral-900/80 border border-neutral-800 p-2.5 text-[11px] text-neutral-300 space-y-1">
                          <div className="font-semibold text-amber-300 flex items-center gap-1">
                            <span>⚡ Creative Team Action Required:</span>
                          </div>
                          <p className="text-neutral-400">
                            Please adjust the edit or copy based on the client notes above, then upload Version {(latestVersion?.version_number || 1) + 1} to request re-approval.
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-neutral-900/80 border border-neutral-800 p-2.5 text-[11px] text-emerald-400/90 flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>Your change request has been notified to the Zero Media production team.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Revised Version Ready for Sign-Off: Replaces old change request alert */}
                  {hasRevisedVersionUploaded && item.status === 'client_review' && !dismissRevisionNotice && (
                    <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3.5 text-xs text-sky-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 shrink-0">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-sky-300 block">
                            Revised Version Ready for Sign-Off
                          </span>
                          <span className="text-[11px] text-sky-200/80">
                            A revised cut addressing previous revision notes has been uploaded. Please review the updated version and submit your decision below.
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

                  {/* Decision Sign-Off Form */}
                  {!canSubmitReview ? (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200 space-y-1">
                      <div className="font-semibold text-amber-300">Client Sign-off Exclusive</div>
                      <p className="text-neutral-300 text-[11px] leading-relaxed">
                        Sign-off decisions are reserved for client representatives. Production team members can view feedback, review comments, or inspect assets.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitDecision} className="space-y-3 pt-1">
                      <div className="text-xs font-medium text-neutral-300">
                        {item.status === 'changes_requested' ? 'Update Review Decision:' : 'Submit Decision:'}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDecision('approve')}
                          className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-semibold transition-colors ${
                            decision === 'approve'
                              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                              : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700'
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDecision('request_changes')}
                          className={`flex items-center justify-center gap-2 rounded-lg border p-3 text-xs font-semibold transition-colors ${
                            decision === 'request_changes'
                              ? 'border-rose-500 bg-rose-500/15 text-rose-400'
                              : 'border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-700'
                          }`}
                        >
                          <AlertCircle className="h-4 w-4" />
                          <span>Request Changes</span>
                        </button>
                      </div>

                      {decision && (
                        <div className="space-y-2.5 pt-1">
                          {formError && (
                            <div className="rounded-lg border border-rose-800/80 bg-rose-950/40 p-2.5 text-xs text-rose-300">
                              {formError}
                            </div>
                          )}

                          {/* Automatic Workflow Pipeline Stage Indicator */}
                          <div className="rounded-lg bg-neutral-900 border border-neutral-800 p-2.5 text-[11px] flex items-center justify-between">
                            <span className="text-neutral-400">Automatic Pipeline Stage:</span>
                            <span
                              className={`font-semibold font-mono flex items-center gap-1.5 ${
                                decision === 'approve' ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              <span>{decision === 'approve' ? 'Approved' : 'Changes Requested'}</span>
                              <span className="text-[10px] font-sans text-neutral-500">
                                (auto-updates pipeline)
                              </span>
                            </span>
                          </div>

                          <label className="text-[11px] font-medium text-neutral-300 block">
                            {decision === 'request_changes'
                              ? 'Detailed Feedback Notes (Explain what adjustments are required):'
                              : 'Approval Note (Optional):'}
                          </label>
                          <textarea
                            rows={3}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder={
                              decision === 'request_changes'
                                ? 'e.g. Please extend the end logo lockup by 1 second and adjust caption line 2...'
                                : 'Looks great! Ready to push live.'
                            }
                            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden"
                          />

                          <button
                            type="submit"
                            disabled={submitting || (decision === 'request_changes' && !commentText.trim())}
                            className={`w-full rounded-lg py-2.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                              decision === 'approve'
                                ? 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'
                                : 'bg-rose-500 text-white hover:bg-rose-400'
                            }`}
                          >
                            {decision === 'approve' ? 'Confirm Approval (Auto-Advance)' : 'Submit Change Request (Auto-Advance)'}
                          </button>
                        </div>
                      )}
                    </form>
                  )}

                  {/* Sign-off & Revision Audit History */}
                  {itemApprovals.length > 0 && (
                    <div className="border-t border-neutral-800 pt-3 space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                        Review History & Audit Trail ({itemApprovals.length})
                      </div>
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {itemApprovals.map((app) => {
                          const appUser = profiles.find((p) => p.id === app.client_user_id);
                          const isApproved = app.status === 'approved';
                          return (
                            <div
                              key={app.id}
                              className={`rounded-lg border p-2 text-xs space-y-1 ${
                                isApproved
                                  ? 'border-emerald-800/40 bg-emerald-950/15 text-emerald-200'
                                  : 'border-rose-800/40 bg-rose-950/15 text-rose-200'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold flex items-center gap-1.5">
                                  {isApproved ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                  ) : (
                                    <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                                  )}
                                  <span>{isApproved ? 'Approved' : 'Changes Requested'}</span>
                                  <span className="text-neutral-400 font-normal">
                                    by {appUser?.full_name || 'Client User'}
                                  </span>
                                </span>
                                <span className="text-[10px] text-neutral-500 font-mono">
                                  {new Date(app.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              {app.comment && (
                                <p className="text-[11px] text-neutral-300 italic pl-5 leading-relaxed">
                                  "{app.comment}"
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Creative Discussion & Feedback Stream (Always on desktop, on mobile if mobileTab === 'discussion') */}
            <div className={`border-t border-neutral-800 pt-4 space-y-3 ${mobileTab === 'decision' ? 'hidden lg:block' : 'block'}`}>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Item Discussion ({itemComments.length})
                </h4>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {itemComments.length === 0 ? (
                  <div className="py-4 text-center text-xs text-neutral-500">
                    No comments yet. Start the conversation below.
                  </div>
                ) : (
                  itemComments.map((comm) => {
                    const author = profiles.find((p) => p.id === comm.user_id);
                    const isClient = author?.role === 'client';
                    const isRevisionReq = comm.comment.includes('Revision Request');
                    return (
                      <div
                        key={comm.id}
                        className={`rounded-lg p-2.5 text-xs ${
                          isRevisionReq
                            ? 'border border-rose-500/40 bg-rose-950/25'
                            : isClient
                            ? 'border border-amber-500/20 bg-amber-500/5'
                            : 'border border-neutral-800 bg-neutral-950/60'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className={`font-semibold flex items-center gap-1.5 ${isRevisionReq ? 'text-rose-400' : 'text-neutral-200'}`}>
                            {isRevisionReq && <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />}
                            <span>{author?.full_name || 'Team member'} {isClient ? '· Client' : ''}</span>
                            {isRevisionReq && (
                              <span className="rounded bg-rose-500/20 px-1.5 py-0.2 text-[9px] font-bold text-rose-300 uppercase tracking-wider">
                                Change Request
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

              {/* Add Comment Input */}
              <form onSubmit={handleSendDiscussion} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newDiscussionComment}
                  onChange={(e) => setNewDiscussionComment(e.target.value)}
                  placeholder="Type a message or question..."
                  className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-600 focus:border-neutral-700 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!newDiscussionComment.trim()}
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
