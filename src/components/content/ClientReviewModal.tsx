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

  if (!isOpen || !contentId) return null;

  const item = getContentById(contentId);
  if (!item) return null;

  const versions = contentVersions.filter((v) => v.content_id === contentId).sort((a, b) => b.version_number - a.version_number);
  const latestVersion = versions[0];
  const itemComments = comments.filter((c) => c.content_id === contentId);
  const itemApprovals = approvals.filter((a) => a.content_id === contentId);

  const handleSubmitDecision = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (decision === 'request_changes' && !commentText.trim()) {
      setFormError('Please provide detailed feedback explaining what changes are needed.');
      return;
    }

    setSubmitting(true);
    if (decision === 'approve') {
      approveContent(contentId, commentText || 'Approved by client.');
    } else if (decision === 'request_changes') {
      requestChanges(contentId, commentText);
    }
    setSubmitting(false);
    onClose();
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
            {/* Visual Media Showcase */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden shadow-inner">
              {latestVersion?.file_url || item.thumbnail_url ? (
                <div className="relative aspect-video sm:aspect-4/3 w-full bg-neutral-950 flex items-center justify-center group">
                  <img
                    src={latestVersion?.file_url || item.thumbnail_url}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute bottom-3 right-3 rounded-md bg-neutral-950/80 px-2.5 py-1 text-[11px] font-mono text-neutral-300 backdrop-blur-xs border border-neutral-800">
                    Version {latestVersion?.version_number || 1} Master
                  </div>
                </div>
              ) : (
                <div className="aspect-video w-full flex items-center justify-center text-xs text-neutral-500">
                  Visual asset undergoing processing
                </div>
              )}
            </div>

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
              <label className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 block mb-2">
                Version History ({versions.length})
              </label>
              <div className="space-y-2">
                {versions.map((ver) => {
                  const uploader = profiles.find((p) => p.id === ver.uploaded_by);
                  return (
                    <div
                      key={ver.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-800/80 bg-neutral-950/40 p-2.5 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-neutral-200">
                          Version {ver.version_number}: {ver.file_name}
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">{ver.notes}</div>
                        <div className="text-[10px] text-neutral-500 mt-0.5">
                          Uploaded by {uploader?.full_name || 'Team member'} · {new Date(ver.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <a
                        href={ver.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-neutral-700 bg-neutral-800 p-1.5 text-neutral-300 hover:text-white"
                        title="Download file"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  );
                })}
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

              {item.status === 'approved' ? (
                <div className="rounded-lg border border-emerald-900/60 bg-emerald-950/30 p-4 text-xs text-emerald-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Content Approved!
                  </div>
                  <p className="text-[11px] text-emerald-300/80">
                    This deliverable is locked and queued for publishing on {item.publishing_date || 'scheduled date'}.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitDecision} className="space-y-3">
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
                    <div className="space-y-2 pt-1">
                      {formError && (
                        <div className="rounded-lg border border-rose-800/80 bg-rose-950/40 p-2.5 text-xs text-rose-300">
                          {formError}
                        </div>
                      )}
                      <label className="text-[11px] font-medium text-neutral-300 block">
                        {decision === 'request_changes'
                          ? 'Required Feedback Notes (Explain what to adjust):'
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
                        {decision === 'approve' ? 'Confirm Approval' : 'Submit Change Request'}
                      </button>
                    </div>
                  )}
                </form>
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
                    return (
                      <div
                        key={comm.id}
                        className={`rounded-lg p-2.5 text-xs ${
                          isClient
                            ? 'border border-amber-500/20 bg-amber-500/5'
                            : 'border border-neutral-800 bg-neutral-950/60'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-neutral-200">
                            {author?.full_name || 'Team member'} {isClient ? '· Client' : ''}
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
