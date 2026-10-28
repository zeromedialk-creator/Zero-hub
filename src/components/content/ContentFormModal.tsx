import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ContentStatus, ContentType, Platform, Priority, formatRoleTitle } from '../../types/database';
import { Film, X, Calendar, UserPlus, Trash2, ChevronDown } from 'lucide-react';
import { formatPlatformName } from '../common/PlatformBadge';

interface ContentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  defaultClientId?: string;
  defaultCycleId?: string;
  defaultStatus?: ContentStatus;
}

export const ContentFormModal: React.FC<ContentFormModalProps> = ({
  isOpen,
  onClose,
  defaultProjectId,
  defaultClientId,
  defaultCycleId,
  defaultStatus = 'idea',
}) => {
  const {
    filteredClients,
    filteredProjects,
    profiles,
    monthlyCycles,
    addContentItem,
    addContentContributor,
    getOptionsByCategory,
    isSaving,
  } = useData();
  const { currentUser } = useAuth();

  const formatOptions = getOptionsByCategory('content_type');
  const platformOptions = getOptionsByCategory('platform');
  const priorityOptions = getOptionsByCategory('priority');

  const [clientId, setClientId] = useState(defaultClientId || '');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [cycleId, setCycleId] = useState(defaultCycleId || '');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<ContentStatus>(defaultStatus || 'idea');
  const [contentType, setContentType] = useState<ContentType>('social_media_post');
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['instagram']);
  const [isMultiPlatform, setIsMultiPlatform] = useState<boolean>(false);
  const [isPlatformDropdownOpen, setIsPlatformDropdownOpen] = useState<boolean>(false);
  const platformDropdownRef = useRef<HTMLDivElement>(null);

  // Close platform popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        platformDropdownRef.current &&
        !platformDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPlatformDropdownOpen(false);
      }
    };
    if (isPlatformDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPlatformDropdownOpen]);

  const [priority, setPriority] = useState<Priority>('medium');
  const [brief, setBrief] = useState('');
  const [caption, setCaption] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  // Individual Content Dates (Calculated dynamically)
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const in5Days = new Date(today.getTime() + 5 * 86400000).toISOString().split('T')[0];
  const in7Days = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0];
  const in10Days = new Date(today.getTime() + 10 * 86400000).toISOString().split('T')[0];

  const [productionStartDate, setProductionStartDate] = useState(todayStr);
  const [internalDueDate, setInternalDueDate] = useState(in5Days);
  const [clientReviewDate, setClientReviewDate] = useState(in7Days);
  const [publishingDate, setPublishingDate] = useState(in10Days);
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  // Optional Contributors (Section 14)
  const [contributors, setContributors] = useState<Array<{ user_id: string; role_in_content: string }>>([]);

  const [formError, setFormError] = useState<string | null>(null);

  // Compute effective clientId defensively
  const effectiveClientId = useMemo(() => {
    if (clientId && filteredClients.some((c) => c.id === clientId)) {
      return clientId;
    }
    if (defaultClientId && filteredClients.some((c) => c.id === defaultClientId)) {
      return defaultClientId;
    }
    if (filteredClients.length > 0) {
      return filteredClients[0].id;
    }
    return '';
  }, [clientId, defaultClientId, filteredClients]);

  // Filter projects by selected client
  const clientProjects = useMemo(() => {
    return filteredProjects.filter((p) => p.client_id === effectiveClientId);
  }, [filteredProjects, effectiveClientId]);

  // Compute effective projectId defensively
  const effectiveProjectId = useMemo(() => {
    if (projectId && clientProjects.some((p) => p.id === projectId)) {
      return projectId;
    }
    if (defaultProjectId && clientProjects.some((p) => p.id === defaultProjectId)) {
      return defaultProjectId;
    }
    if (clientProjects.length > 0) {
      return clientProjects[0].id;
    }
    if (projectId && filteredProjects.some((p) => p.id === projectId)) {
      return projectId;
    }
    if (filteredProjects.length > 0) {
      return filteredProjects[0].id;
    }
    return '';
  }, [projectId, defaultProjectId, clientProjects, filteredProjects]);

  const selectedProject = filteredProjects.find((p) => p.id === effectiveProjectId);
  const isRetainer = selectedProject?.project_type === 'monthly_retainer';
  const projectCycles = monthlyCycles.filter((c) => c.project_id === effectiveProjectId);

  // Synchronize state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setFormError(null);
      setStatus(defaultStatus || 'idea');
      setTitle('');
      setBrief('');
      setCaption('');
      setNotes('');
      setThumbnailUrl('');
      setContributors([]);
      setPlatform('instagram');
      setSelectedPlatforms(['instagram']);
      setIsMultiPlatform(false);
      if (defaultClientId && filteredClients.some((c) => c.id === defaultClientId)) {
        setClientId(defaultClientId);
      } else if (!clientId || !filteredClients.some((c) => c.id === clientId)) {
        if (filteredClients.length > 0) setClientId(filteredClients[0].id);
      }

      if (defaultProjectId && filteredProjects.some((p) => p.id === defaultProjectId)) {
        setProjectId(defaultProjectId);
      } else if (!projectId || !filteredProjects.some((p) => p.id === projectId)) {
        if (clientProjects.length > 0) {
          setProjectId(clientProjects[0].id);
        } else if (filteredProjects.length > 0) {
          setProjectId(filteredProjects[0].id);
        }
      }

      const defaultEditor = profiles.find((p) => p.role === 'editor') || profiles[0];
      if (defaultEditor && !assignedTo) {
        setAssignedTo(defaultEditor.id);
      }
    }
  }, [isOpen, defaultStatus, defaultClientId, defaultProjectId, filteredClients, filteredProjects, clientProjects, profiles]);

  if (!isOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const targetTitle = title.trim();
    if (!targetTitle) {
      setFormError('Please enter a deliverable title.');
      return;
    }

    const targetClientId = clientId || effectiveClientId;
    if (!targetClientId) {
      setFormError('Please select a client brand.');
      return;
    }

    const targetProjectId = projectId || effectiveProjectId;
    if (!targetProjectId) {
      setFormError('Please select an associated project.');
      return;
    }

    const effectiveThumbnail = thumbnailUrl.trim() || undefined;

    const finalPlatforms = selectedPlatforms.length > 0 ? selectedPlatforms : [platform || 'instagram'];
    const primaryPlatform = platform || finalPlatforms[0] || 'instagram';

    const createdItem = await addContentItem({
      client_id: targetClientId,
      project_id: targetProjectId,
      monthly_cycle_id: isRetainer ? (cycleId || projectCycles[0]?.id) : undefined,
      title: targetTitle,
      content_type: contentType,
      platform: primaryPlatform,
      platforms: finalPlatforms,
      priority,
      brief: brief.trim(),
      caption: caption.trim(),
      notes: notes.trim(),
      status: status || 'idea',
      assigned_to: assignedTo || undefined,
      production_start_date: productionStartDate,
      internal_due_date: internalDueDate,
      due_date: internalDueDate,
      client_review_date: clientReviewDate,
      publishing_date: publishingDate,
      created_by: currentUser?.id || profiles[0]?.id || 'unknown',
      thumbnail_url: effectiveThumbnail,
    });

    // Add any contributors
    if (createdItem && contributors.length > 0) {
      for (const contributor of contributors) {
        if (contributor.user_id) {
          await addContentContributor(
            createdItem.id,
            contributor.user_id,
            contributor.role_in_content
          );
        }
      }
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
                value={effectiveClientId}
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
                value={effectiveProjectId}
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

          {/* Workflow Stage / Pipeline Step */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-neutral-200 font-semibold text-xs">
                Pipeline Stage / Step *
              </label>
              <span className="text-[10px] font-mono text-amber-400/90 font-medium">
                {status === 'idea' ? 'Step 1 of 11 (Incubation)' : status === 'planned' ? 'Step 2 of 11 (Sprint)' : '11-Step Lifecycle'}
              </span>
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentStatus)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-100 font-medium focus:border-amber-400 focus:outline-hidden"
            >
              <option value="idea">💡 Idea (Step 1 — Concept incubation & brainstorming)</option>
              <option value="planned">📋 Planned (Step 2 — Briefed into sprint queue)</option>
              <option value="assigned">👤 Assigned (Step 3 — Editor allocated)</option>
              <option value="in_production">🎬 In Production (Step 4 — Filming & active editing)</option>
              <option value="internal_review">🔍 Internal Review (Step 5 — Agency QA review)</option>
              <option value="client_review">👁️ Client Review (Step 6 — Client portal review & sign-off)</option>
              <option value="scheduled">📅 Scheduled (Step 9 — Queued in publishing scheduler)</option>
              <option value="published">🚀 Published (Step 10 — Live on channels)</option>
              <option value="completed">✅ Completed (Step 11 — Archived deliverable)</option>
            </select>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              {status === 'idea'
                ? 'Saved deliverable will be placed in the "Idea" incubation step on the Kanban pipeline for concept development.'
                : status === 'planned'
                ? 'Saved deliverable will be placed in the "Planned" step for scheduled sprint execution.'
                : `Saved deliverable will enter directly into the "${status.replace(/_/g, ' ')}" step.`}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Format Type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as ContentType)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
              >
                {formatOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative" ref={platformDropdownRef}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-neutral-300 font-medium">Platform</label>
                  <label className="inline-flex items-center gap-1 cursor-pointer select-none text-[11px] text-neutral-400 hover:text-amber-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={isMultiPlatform}
                      onChange={(e) => {
                        const next = e.target.checked;
                        setIsMultiPlatform(next);
                        if (!next) {
                          const keep = selectedPlatforms[0] || platform || 'instagram';
                          setPlatform(keep);
                          setSelectedPlatforms([keep]);
                        }
                      }}
                      className="rounded border-neutral-700 bg-neutral-950 text-amber-400 focus:ring-0 h-3 w-3 cursor-pointer"
                    />
                    <span className={isMultiPlatform ? 'text-amber-400 font-semibold' : ''}>Multi</span>
                  </label>
                </div>
                {isMultiPlatform && selectedPlatforms.length > 1 && (
                  <span className="text-[10px] text-amber-400/90 font-mono font-medium">
                    ({selectedPlatforms.length})
                  </span>
                )}
              </div>

              {/* Compact trigger button */}
              <button
                type="button"
                onClick={() => setIsPlatformDropdownOpen((prev) => !prev)}
                className={`w-full rounded-lg border bg-neutral-950 px-3 py-2 text-neutral-200 text-left flex items-center justify-between gap-1.5 transition-colors focus:border-amber-400 focus:outline-hidden ${
                  isPlatformDropdownOpen
                    ? 'border-amber-400 ring-1 ring-amber-400/30'
                    : isMultiPlatform && selectedPlatforms.length > 1
                    ? 'border-amber-500/50'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
                title={isMultiPlatform ? selectedPlatforms.map(formatPlatformName).join(', ') : formatPlatformName(platform)}
              >
                <span className="text-xs text-neutral-200 truncate">
                  {isMultiPlatform
                    ? selectedPlatforms.length === 0
                      ? 'Select platforms'
                      : selectedPlatforms.length === 1
                      ? formatPlatformName(selectedPlatforms[0])
                      : selectedPlatforms.length === 2
                      ? `${formatPlatformName(selectedPlatforms[0])}, ${formatPlatformName(selectedPlatforms[1])}`
                      : `${formatPlatformName(selectedPlatforms[0])} +${selectedPlatforms.length - 1} more`
                    : formatPlatformName(platform)}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-neutral-400 shrink-0 transition-transform duration-150 ${
                    isPlatformDropdownOpen ? 'rotate-180 text-amber-400' : ''
                  }`}
                />
              </button>

              {/* Dropdown with checkboxes next to each platform name */}
              {isPlatformDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border border-neutral-700 bg-neutral-900 shadow-2xl overflow-hidden py-1 min-w-[200px]">
                  <div className="max-h-56 overflow-y-auto divide-y divide-neutral-800/60">
                    {platformOptions.map((opt) => {
                      const pKey = opt.key as Platform;
                      const isChecked = isMultiPlatform
                        ? selectedPlatforms.includes(pKey)
                        : platform === pKey;

                      return (
                        <div
                          key={opt.key}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isMultiPlatform) {
                              if (isChecked) {
                                if (selectedPlatforms.length > 1) {
                                  const next = selectedPlatforms.filter((p) => p !== pKey);
                                  setSelectedPlatforms(next);
                                  if (platform === pKey) {
                                    setPlatform(next[0]);
                                  }
                                }
                              } else {
                                setSelectedPlatforms([...selectedPlatforms, pKey]);
                              }
                            } else {
                              setPlatform(pKey);
                              setSelectedPlatforms([pKey]);
                              setIsPlatformDropdownOpen(false);
                            }
                          }}
                          className={`flex items-center justify-between px-2.5 py-1.5 cursor-pointer text-xs transition-colors select-none ${
                            isChecked
                              ? 'bg-amber-400/10 text-amber-200 hover:bg-amber-400/15'
                              : 'text-neutral-300 hover:bg-neutral-800/70 hover:text-neutral-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // Row onClick handles state
                              className="rounded border-neutral-700 bg-neutral-950 text-amber-400 focus:ring-0 h-3.5 w-3.5 pointer-events-none"
                            />
                            <span className="font-medium truncate">{opt.label}</span>
                          </div>
                          {isMultiPlatform && isChecked && selectedPlatforms.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPlatform(pKey);
                                const reordered = [pKey, ...selectedPlatforms.filter((p) => p !== pKey)];
                                setSelectedPlatforms(reordered);
                              }}
                              title={platform === pKey ? 'Primary master platform' : 'Set as primary'}
                              className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 ml-1.5 transition-colors ${
                                platform === pKey
                                  ? 'bg-amber-400 text-neutral-950 font-bold'
                                  : 'text-neutral-500 hover:text-amber-300 hover:bg-neutral-800'
                              }`}
                            >
                              {platform === pKey ? 'Primary' : 'Make 1st'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {isMultiPlatform && (
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-neutral-950 border-t border-neutral-800 text-[10px]">
                      <span className="text-neutral-400 font-mono">
                        {selectedPlatforms.length} selected
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsPlatformDropdownOpen(false)}
                        className="text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded hover:bg-amber-400/10 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              )}
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
                      {p.full_name} ({formatRoleTitle(p.role)})
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
                {priorityOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
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
                            {p.full_name} ({formatRoleTitle(p.role)})
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

