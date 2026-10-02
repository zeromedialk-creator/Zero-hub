import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ContentType, Platform, Priority } from '../../types/database';
import { Film, X, Calendar, UserPlus, Trash2 } from 'lucide-react';

interface ContentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  defaultClientId?: string;
  defaultCycleId?: string;
}

export const ContentFormModal: React.FC<ContentFormModalProps> = ({
  isOpen,
  onClose,
  defaultProjectId,
  defaultClientId,
  defaultCycleId,
}) => {
  const {
    filteredClients,
    filteredProjects,
    profiles,
    monthlyCycles,
    addContentItem,
    addContentContributor,
  } = useData();
  const { currentUser } = useAuth();

  const [clientId, setClientId] = useState(defaultClientId || filteredClients[0]?.id || '');
  const [projectId, setProjectId] = useState(defaultProjectId || filteredProjects[0]?.id || '');
  const [cycleId, setCycleId] = useState(defaultCycleId || '');
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<ContentType>('social_media_post');
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [priority, setPriority] = useState<Priority>('medium');
  const [brief, setBrief] = useState('');
  const [caption, setCaption] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState(
    profiles.find((p) => p.role === 'editor')?.id || ''
  );

  // Individual Content Dates (Sections 4 & 6)
  const [productionStartDate, setProductionStartDate] = useState('2026-10-01');
  const [internalDueDate, setInternalDueDate] = useState('2026-10-06');
  const [clientReviewDate, setClientReviewDate] = useState('2026-10-08');
  const [publishingDate, setPublishingDate] = useState('2026-10-10');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  // Optional Contributors (Section 14)
  const [contributors, setContributors] = useState<Array<{ user_id: string; role_in_content: string }>>([]);

  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter projects by selected client
  const clientProjects = filteredProjects.filter((p) => p.client_id === clientId);
  const selectedProject = filteredProjects.find((p) => p.id === projectId);
  const isRetainer = selectedProject?.project_type === 'monthly_retainer';
  const projectCycles = monthlyCycles.filter((c) => c.project_id === projectId);

  const handleAddContributor = () => {
    const candidate = profiles.find((p) => p.role !== 'client' && p.role !== 'viewer');
    if (candidate) {
      setContributors([
        ...contributors,
        { user_id: candidate.id, role_in_content: 'Editing' },
      ]);
    }
  };

  const handleRemoveContributor = (index: number) => {
    setContributors(contributors.filter((_, idx) => idx !== index));
  };

  const handleContributorChange = (index: number, field: 'user_id' | 'role_in_content', val: string) => {
    setContributors(
      contributors.map((c, idx) => (idx === index ? { ...c, [field]: val } : c))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim() || !clientId || !projectId) {
      setFormError('Please fill out all required fields (Deliverable title, client, project).');
      return;
    }

    const effectiveThumbnail =
      thumbnailUrl.trim() ||
      (contentType === 'reel' || contentType === 'video'
        ? '/src/assets/images/content_fashion_reel_1790837276139.jpg'
        : '/src/assets/images/content_beverage_ad_1790837287649.jpg');

    const createdItem = addContentItem({
      client_id: clientId,
      project_id: projectId,
      monthly_cycle_id: isRetainer ? (cycleId || projectCycles[0]?.id) : undefined,
      title: title.trim(),
      content_type: contentType,
      platform,
      priority,
      brief: brief.trim(),
      caption: caption.trim(),
      notes: notes.trim(),
      status: 'planned',
      assigned_to: assignedTo || undefined,
      production_start_date: productionStartDate,
      internal_due_date: internalDueDate,
      due_date: internalDueDate,
      client_review_date: clientReviewDate,
      publishing_date: publishingDate,
      created_by: currentUser?.id || 'usr_admin_01',
      thumbnail_url: effectiveThumbnail,
    });

    // Add any contributors
    if (createdItem && contributors.length > 0) {
      contributors.forEach((contributor) => {
        if (contributor.user_id) {
          addContentContributor(
            createdItem.id,
            contributor.user_id,
            contributor.role_in_content
          );
        }
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden my-auto sm:my-6 max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 sm:px-6 py-3 sm:py-4 bg-neutral-950 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Film className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-neutral-100 truncate">Create New Content Deliverable</h2>
              <p className="text-xs text-neutral-400 truncate">
                Add content with specific dates, assignments, and contributors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs flex-1 overflow-y-auto">
          {formError && (
            <div className="rounded-lg border border-rose-800/80 bg-rose-950/40 p-2.5 text-xs text-rose-300">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Deliverable Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Post 01 — Feature Spotlight // Oct 5"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Client Brand *
              </label>
              <select
                required
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  const firstPrj = filteredProjects.find((p) => p.client_id === e.target.value);
                  if (firstPrj) {
                    setProjectId(firstPrj.id);
                    const cycles = monthlyCycles.filter((c) => c.project_id === firstPrj.id);
                    if (cycles.length > 0) setCycleId(cycles[0].id);
                  }
                }}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
              >
                {filteredClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Associated Project *
              </label>
              <select
                required
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  const cycles = monthlyCycles.filter((c) => c.project_id === e.target.value);
                  if (cycles.length > 0) setCycleId(cycles[0].id);
                }}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
              >
                {clientProjects.length === 0 ? (
                  <option value="">No projects found for client</option>
                ) : (
                  clientProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_name} {p.project_type === 'monthly_retainer' ? '(Retainer)' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Monthly Cycle Selector if Retainer */}
          {isRetainer && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <label className="block text-amber-300 font-medium mb-1">
                Monthly Cycle * (Retainer Scope)
              </label>
              <select
                value={cycleId || projectCycles[0]?.id || ''}
                onChange={(e) => setCycleId(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-amber-200 focus:border-amber-400 focus:outline-hidden font-medium"
              >
                {projectCycles.length === 0 ? (
                  <option value="">No cycles created yet</option>
                ) : (
                  projectCycles.map((cy) => (
                    <option key={cy.id} value={cy.id}>
                      {cy.month_name} {cy.year} ({cy.status.replace('_', ' ')})
                    </option>
                  ))
                )}
              </select>
              <p className="text-[11px] text-neutral-400 mt-1">
                Deliverables assigned to this cycle count directly toward its deliverable targets.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Format Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
              >
                <option value="social_media_post">Post (Image)</option>
                <option value="reel">Reel</option>
                <option value="carousel">Carousel</option>
                <option value="story">Story</option>
                <option value="video">Long Video</option>
                <option value="advertisement">Paid Ad</option>
                <option value="blog">Blog</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="facebook">Facebook</option>
                <option value="linkedin">LinkedIn</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Lead Assignee</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
              >
                <option value="">Unassigned</option>
                {profiles
                  .filter((p) => p.role !== 'client' && p.role !== 'viewer')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role.replace('_', ' ')})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* INDIVIDUAL CONTENT DATES (Sections 4 & 6) */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
              <Calendar className="h-4 w-4 text-amber-400" />
              <span>Individual Content Production & Publishing Dates</span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Every deliverable has its own independent production start, internal due date, client review date, and publishing date.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Production Start</label>
                <input
                  type="date"
                  value={productionStartDate}
                  onChange={(e) => setProductionStartDate(e.target.value)}
                  className="w-full rounded border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-neutral-200 font-mono text-[11px] focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Internal Due Date *</label>
                <input
                  type="date"
                  required
                  value={internalDueDate}
                  onChange={(e) => setInternalDueDate(e.target.value)}
                  className="w-full rounded border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-neutral-200 font-mono text-[11px] focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Client Review Date</label>
                <input
                  type="date"
                  value={clientReviewDate}
                  onChange={(e) => setClientReviewDate(e.target.value)}
                  className="w-full rounded border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-neutral-200 font-mono text-[11px] focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] text-amber-400 font-medium mb-1">Publishing Date *</label>
                <input
                  type="date"
                  required
                  value={publishingDate}
                  onChange={(e) => setPublishingDate(e.target.value)}
                  className="w-full rounded border border-amber-500/50 bg-neutral-900 px-2.5 py-1.5 text-amber-200 font-mono text-[11px] font-semibold focus:border-amber-400 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* MULTIPLE CONTRIBUTORS (Section 14) */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
                <UserPlus className="h-4 w-4 text-sky-400" />
                <span>Optional Multiple Contributors (Shooting, Editing, Caption, etc.)</span>
              </div>
              <button
                type="button"
                onClick={handleAddContributor}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
              >
                + Add Contributor
              </button>
            </div>

            {contributors.length === 0 ? (
              <p className="text-[11px] text-neutral-500">
                No extra contributors added. The Lead Assignee handles this deliverable.
              </p>
            ) : (
              <div className="space-y-2">
                {contributors.map((contrib, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={contrib.user_id}
                      onChange={(e) => handleContributorChange(idx, 'user_id', e.target.value)}
                      className="flex-1 rounded border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-neutral-200 focus:border-neutral-700"
                    >
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
                      value={contrib.role_in_content}
                      onChange={(e) => handleContributorChange(idx, 'role_in_content', e.target.value)}
                      className="w-40 rounded border border-neutral-800 bg-neutral-900 px-2.5 py-1.5 text-neutral-200 placeholder-neutral-600 focus:border-neutral-700"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveContributor(idx)}
                      className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors"
                      title="Remove contributor"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Creative Production Brief
            </label>
            <textarea
              rows={2}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Visual direction, audio style, hook duration, camera angles, color grading..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Draft Caption / Copy
            </label>
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Initial caption draft or hook..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-2.5 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Production Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Asset links, sound requirements, client preferences..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-neutral-950 hover:bg-amber-300 transition-colors shadow-sm"
            >
              Create Deliverable
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

