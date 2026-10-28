import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ProjectStatus, Priority, MonthlyCycle, ContentItem, ProjectDeliverableTarget } from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import {
  FolderKanban,
  X,
  CheckSquare,
  Film,
  FolderArchive,
  Users,
  Send,
  Calendar,
  AlertCircle,
  Plus,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  CalendarDays,
  FileCheck,
  ChevronRight,
  TrendingUp,
  Target,
  Edit3,
  Trash2,
} from 'lucide-react';

interface ProjectDetailModalProps {
  projectId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectContent: (id: string) => void;
  onOpenCreateTaskModal: (projectId: string) => void;
}

const ALL_PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'waiting_for_client', label: 'Waiting for Client' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  projectId,
  isOpen,
  onClose,
  onSelectContent,
  onOpenCreateTaskModal,
}) => {
  const {
    getProjectById,
    getClientById,
    tasks,
    contentItems,
    files,
    comments,
    projectMembers,
    profiles,
    activityLogs,
    monthlyCycles,
    contentContributors,
    recurringTemplates,
    addComment,
    updateProjectStatus,
    updateProject,
    getOptionsByCategory,
    updateTaskStatus,
    createNextMonthCycle,
    updateMonthlyCycle,
    getCyclesByProjectId,
    getActiveCycleForProject,
    getCycleMetrics,
    createContentFromTemplate,
  } = useData();
  const { role } = useAuth();

  // Tab state: Overview | Tasks | Content | Calendar | Monthly Cycles | Files | Comments | Activity
  const [activeTab, setActiveTab] = useState<
    'overview' | 'tasks' | 'content' | 'calendar' | 'cycles' | 'files' | 'comments' | 'activity'
  >('overview');

  const [commentText, setCommentText] = useState('');
  const [selectedCycleIdFilter, setSelectedCycleIdFilter] = useState<string>('all');
  const [cycleCreationSuccess, setCycleCreationSuccess] = useState<string | null>(null);

  // Targets editor state
  const formatOptions = getOptionsByCategory('content_type');
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [editingTargets, setEditingTargets] = useState<ProjectDeliverableTarget[]>([]);

  if (!isOpen || !projectId) return null;

  const project = getProjectById(projectId);
  if (!project) return null;

  const client = getClientById(project.client_id);
  const pm = profiles.find((p) => p.id === project.project_manager_id);
  const isRetainer = project.project_type === 'monthly_retainer';

  const pCycles = getCyclesByProjectId(projectId);
  const activeCycle = getActiveCycleForProject(projectId) || pCycles[0];
  const activeCycleMetrics = activeCycle ? getCycleMetrics(activeCycle.id) : null;

  // Deliverable targets for one-time projects
  const oneTimeTargets: ProjectDeliverableTarget[] = (!isRetainer && Array.isArray(project.deliverable_targets))
    ? project.deliverable_targets
    : [];
  const hasOneTimeTargets = oneTimeTargets.length > 0;

  const pTasks = tasks.filter((t) => t.project_id === projectId);
  const pAllContent = contentItems.filter((c) => c.project_id === projectId);
  const pFiles = files.filter((f) => f.project_id === projectId);
  const pComments = comments.filter((c) => c.project_id === projectId);
  const pMembers = projectMembers.filter((m) => m.project_id === projectId);
  const pActivity = activityLogs.filter(
    (a) => a.entity_id === projectId || a.metadata?.project === project.project_name
  );

  const oneTimeMetrics = useMemo(() => {
    if (!hasOneTimeTargets) return null;
    const totalTarget = oneTimeTargets.reduce((sum, t) => sum + (Number(t.target_count) || 0), 0) || pAllContent.length || 1;
    const completedItems = pAllContent.filter((i) => i.status === 'published' || i.status === 'completed');
    const completedCount = completedItems.length;
    const remaining = Math.max(0, totalTarget - completedCount);
    const progressPercent = totalTarget > 0 ? Math.round((completedCount / totalTarget) * 100) : 0;

    const inProduction = pAllContent.filter((i) => i.status === 'in_production' || i.status === 'internal_review').length;
    const clientReview = pAllContent.filter((i) => i.status === 'client_review').length;

    const byType = oneTimeTargets.map((t) => {
      const completedForType = completedItems.filter((i) => {
        if (t.content_type && i.content_type === t.content_type) return true;
        const lbl = t.label.toLowerCase();
        if (lbl.includes('post') && (i.content_type === 'social_media_post' || i.content_type === 'carousel')) return true;
        if (lbl.includes('reel') && (i.content_type === 'reel' || i.content_type === 'video')) return true;
        if (lbl.includes('stor') && i.content_type === 'story') return true;
        return i.title.toLowerCase().includes(lbl);
      }).length;

      return {
        type: t.content_type,
        label: t.label,
        target: t.target_count,
        completed: completedForType,
      };
    });

    return {
      target: totalTarget,
      completed: completedCount,
      remaining,
      progressPercent,
      byType,
      inProduction,
      clientReview,
    };
  }, [hasOneTimeTargets, oneTimeTargets, pAllContent]);

  const handleStartEditTargets = () => {
    const existing = project.deliverable_targets && project.deliverable_targets.length > 0
      ? project.deliverable_targets.map((t) => ({ ...t }))
      : [
          { content_type: 'social_media_post', label: 'Posts', target_count: 4 },
          { content_type: 'reel', label: 'Reels', target_count: 4 },
        ];
    setEditingTargets(existing);
    setIsEditingTargets(true);
  };

  const handleSaveTargets = async () => {
    await updateProject(project.id, { deliverable_targets: editingTargets });
    setIsEditingTargets(false);
  };

  const handleAddEditTargetRow = () => {
    setEditingTargets([
      ...editingTargets,
      { content_type: 'social_media_post', label: 'Stories', target_count: 4 },
    ]);
  };

  const handleRemoveEditTargetRow = (idx: number) => {
    if (editingTargets.length <= 1) return;
    setEditingTargets(editingTargets.filter((_, i) => i !== idx));
  };

  const handleEditTargetChange = (idx: number, field: keyof ProjectDeliverableTarget, val: any) => {
    setEditingTargets(
      editingTargets.map((t, i) => (i === idx ? { ...t, [field]: val } : t))
    );
  };

  // Filtered deliverables according to selected cycle filter
  const displayedContent = pAllContent.filter((item) => {
    if (selectedCycleIdFilter === 'all') return true;
    return item.monthly_cycle_id === selectedCycleIdFilter;
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment({ projectId, comment: commentText.trim() });
    setCommentText('');
  };

  const handleCreateNextMonth = async () => {
    const newCycle = await createNextMonthCycle(projectId, activeCycle?.id);
    if (newCycle) {
      setCycleCreationSuccess(
        `Successfully created ${newCycle.month_name} ${newCycle.year} cycle with carried forward targets! Previous cycles remain unchanged.`
      );
      setTimeout(() => setCycleCreationSuccess(null), 5000);
      setActiveTab('cycles');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden my-auto sm:my-6 max-h-[95dvh] sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 sm:px-6 py-3.5 sm:py-4 bg-neutral-950 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-neutral-100 truncate">
                  {project.project_name}
                </h2>
                <StatusBadge status={project.project_type || 'one_time'} />
                <StatusBadge status={project.priority} type="priority" />
                <StatusBadge status={project.status} type="project" />
              </div>
              <div className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 truncate flex items-center gap-2">
                <span>Client: <strong className="text-neutral-200">{client?.company_name}</strong></span>
                <span>·</span>
                <span>Lead PM: <strong className="text-neutral-200">{pm?.full_name || 'Unassigned'}</strong></span>
                {isRetainer && activeCycle && (
                  <>
                    <span>·</span>
                    <span className="text-amber-400 font-semibold">
                      Current Cycle: {activeCycle.month_name} {activeCycle.year}
                    </span>
                    <span>·</span>
                    <span className="text-emerald-400 font-mono">
                      Progress: {activeCycleMetrics?.completed}/{activeCycleMetrics?.target} ({activeCycleMetrics?.progressPercent}%)
                    </span>
                  </>
                )}
                {!isRetainer && hasOneTimeTargets && oneTimeMetrics && (
                  <>
                    <span>·</span>
                    <span className="text-amber-400 font-semibold">
                      Scope: {oneTimeMetrics.target} Deliverables
                    </span>
                    <span>·</span>
                    <span className="text-emerald-400 font-mono">
                      Published: {oneTimeMetrics.completed}/{oneTimeMetrics.target} ({oneTimeMetrics.progressPercent}%)
                    </span>
                  </>
                )}
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

        {/* Tab Controls matching Section 17: Overview | Tasks | Content | Calendar | Monthly Cycles | Files | Comments | Activity */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-4 sm:px-6 pt-2 text-xs font-medium overflow-x-auto whitespace-nowrap flex-nowrap scrollbar-none shrink-0">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'tasks', label: `Tasks (${pTasks.length})` },
            { id: 'content', label: `Content (${pAllContent.length})` },
            { id: 'calendar', label: 'Calendar' },
            ...(isRetainer ? [{ id: 'cycles', label: `Monthly Cycles (${pCycles.length})` }] : []),
            { id: 'files', label: `Files (${pFiles.length})` },
            { id: 'comments', label: `Comments (${pComments.length})` },
            { id: 'activity', label: 'Activity' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 mr-4 sm:mr-6 capitalize transition-colors border-b-2 shrink-0 ${
                activeTab === tab.id
                  ? 'border-amber-400 text-amber-400 font-semibold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Success Alert Banner for Create Next Month */}
        {cycleCreationSuccess && (
          <div className="bg-emerald-950/40 border-b border-emerald-900/60 px-6 py-2.5 text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{cycleCreationSuccess}</span>
            </div>
            <button onClick={() => setCycleCreationSuccess(null)} className="text-emerald-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Monthly Retainer Performance Card (Section 9/17) */}
              {isRetainer && activeCycle && activeCycleMetrics && (
                <div className="rounded-xl border border-amber-500/30 bg-linear-to-r from-amber-950/30 via-neutral-900 to-neutral-950 p-5 space-y-4 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                        Monthly Retainer Overview
                      </div>
                      <h3 className="text-base font-bold text-neutral-100 mt-0.5">
                        {client?.company_name} — {activeCycle.month_name} {activeCycle.year}
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Deliverable targets and production milestone status
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={activeCycle.status} />
                      {role !== 'client' && role !== 'viewer' && (
                        <button
                          onClick={handleCreateNextMonth}
                          className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors shadow-sm flex items-center gap-1.5"
                          title="Creates next month cycle carrying forward targets"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Create Next Month</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* High level metrics (Target, Completed, Remaining, Progress) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
                      <div className="text-[11px] text-neutral-400 uppercase font-medium">Target</div>
                      <div className="mt-1 font-mono text-2xl font-bold text-neutral-100">
                        {activeCycleMetrics.target}
                      </div>
                      <div className="text-[10px] text-neutral-500">Deliverables required</div>
                    </div>

                    <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3">
                      <div className="text-[11px] text-emerald-400 uppercase font-medium">Completed</div>
                      <div className="mt-1 font-mono text-2xl font-bold text-emerald-400">
                        {activeCycleMetrics.completed}
                      </div>
                      <div className="text-[10px] text-emerald-500/80">Published & Sign-off</div>
                    </div>

                    <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
                      <div className="text-[11px] text-neutral-400 uppercase font-medium">Remaining</div>
                      <div className="mt-1 font-mono text-2xl font-bold text-amber-400">
                        {activeCycleMetrics.remaining}
                      </div>
                      <div className="text-[10px] text-neutral-500">Deliverables in flight</div>
                    </div>

                    <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
                      <div className="text-[11px] text-neutral-400 uppercase font-medium">Progress</div>
                      <div className="mt-1 font-mono text-2xl font-bold text-sky-400">
                        {activeCycleMetrics.progressPercent}%
                      </div>
                      <div className="text-[10px] text-neutral-500">Overall month target</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-neutral-400 font-mono">
                      <span>Monthly Delivery Completion</span>
                      <span>{activeCycleMetrics.completed} of {activeCycleMetrics.target} ({activeCycleMetrics.progressPercent}%)</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${activeCycleMetrics.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Deliverable Type Breakdown (Posts: 3/5, Reels: 2/4) */}
                  <div className="border-t border-neutral-800/80 pt-3">
                    <div className="text-xs font-semibold text-neutral-300 mb-2">
                      Deliverable Target Breakdown:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {activeCycleMetrics.byType.map((bt) => (
                        <div
                          key={bt.label}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-800 bg-neutral-950/50 text-xs"
                        >
                          <span className="font-semibold text-neutral-200">{bt.label}</span>
                          <span className="font-mono text-amber-400 font-bold">
                            {bt.completed} / {bt.target}
                          </span>
                        </div>
                      ))}

                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-800 bg-neutral-950/50 text-xs">
                        <span className="text-neutral-400">In Production</span>
                        <span className="font-mono text-sky-400 font-bold">{activeCycleMetrics.inProduction}</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-800 bg-neutral-950/50 text-xs">
                        <span className="text-neutral-400">Client Review</span>
                        <span className="font-mono text-amber-400 font-bold">{activeCycleMetrics.clientReview}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TARGETS CONFIGURATION / EDITOR PANEL (One-Time Projects & Retainers) */}
              {isEditingTargets && (
                <div className="p-4 rounded-xl border border-amber-500/40 bg-neutral-950 space-y-3 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                        <Target className="h-4 w-4" />
                        Configure Deliverable Targets ({isRetainer ? 'Monthly Retainer' : 'One-Time Project'})
                      </h3>
                      <p className="text-[11px] text-neutral-400">
                        Define deliverable target quotas (e.g. how many Posts, Reels, Stories) for this project
                      </p>
                    </div>
                    <span className="font-mono text-xs font-bold text-amber-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-md self-start sm:self-auto">
                      Total: {editingTargets.reduce((sum, t) => sum + (Number(t.target_count) || 0), 0)} Deliverables
                    </span>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] text-neutral-500 font-medium">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => setEditingTargets([
                        { content_type: 'social_media_post', label: 'Posts', target_count: 4 },
                        { content_type: 'reel', label: 'Reels', target_count: 4 },
                      ])}
                      className="text-[10px] bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 px-2 py-0.5 rounded transition-colors"
                    >
                      4 Posts + 4 Reels
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTargets([
                        { content_type: 'reel', label: 'Reels / Shorts', target_count: 6 },
                        { content_type: 'video', label: 'Main Video', target_count: 1 },
                      ])}
                      className="text-[10px] bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 px-2 py-0.5 rounded transition-colors"
                    >
                      6 Reels + 1 Video
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTargets([
                        { content_type: 'social_media_post', label: 'Posts', target_count: 5 },
                        { content_type: 'reel', label: 'Reels', target_count: 3 },
                        { content_type: 'story', label: 'Stories', target_count: 6 },
                      ])}
                      className="text-[10px] bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 px-2 py-0.5 rounded transition-colors"
                    >
                      Multi-Format
                    </button>
                  </div>

                  <div className="space-y-2">
                    {editingTargets.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={row.label}
                          onChange={(e) => handleEditTargetChange(idx, 'label', e.target.value)}
                          placeholder="e.g. Posts, Reels, Stories..."
                          className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 focus:border-amber-400"
                        />

                        <select
                          value={row.content_type}
                          onChange={(e) => handleEditTargetChange(idx, 'content_type', e.target.value)}
                          className="w-32 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-xs text-neutral-300 focus:border-amber-400"
                        >
                          {formatOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-neutral-500">Qty:</span>
                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={row.target_count}
                            onChange={(e) => handleEditTargetChange(idx, 'target_count', parseInt(e.target.value) || 1)}
                            className="w-16 rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-xs font-mono text-center text-amber-400 font-bold focus:border-amber-400"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveEditTargetRow(idx)}
                          disabled={editingTargets.length <= 1}
                          className="p-1.5 text-neutral-500 hover:text-rose-400 disabled:opacity-20"
                          title="Remove row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                    <button
                      type="button"
                      onClick={handleAddEditTargetRow}
                      className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Target Type</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingTargets(false)}
                        className="px-3 py-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-850 text-neutral-300 text-xs transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveTargets}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs transition-colors"
                      >
                        Save Targets to Project
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* One-Time Project Deliverable Targets Performance Card */}
              {!isRetainer && hasOneTimeTargets && oneTimeMetrics && !isEditingTargets && (
                <div className="rounded-xl border border-amber-500/30 bg-linear-to-r from-amber-950/30 via-neutral-900 to-neutral-950 p-5 space-y-4 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                        Campaign Deliverable Targets
                      </div>
                      <h3 className="text-base font-bold text-neutral-100 mt-0.5">
                        {client?.company_name} — {project.project_name}
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Scoped deliverable milestones & publishing progress
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={project.status} type="project" />
                      {role !== 'client' && role !== 'viewer' && (
                        <button
                          onClick={handleStartEditTargets}
                          className="rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 px-3 py-1.5 text-xs font-medium transition-colors shadow-sm flex items-center gap-1.5"
                          title="Edit deliverable targets for this project"
                        >
                          <Target className="h-3.5 w-3.5 text-amber-400" />
                          <span>Edit Targets</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* High level metrics (Target, Completed, Remaining, Progress) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
                      <div className="text-[11px] text-neutral-400 uppercase font-medium">Target Scope</div>
                      <div className="mt-1 font-mono text-2xl font-bold text-neutral-100">
                        {oneTimeMetrics.target}
                      </div>
                      <div className="text-[10px] text-neutral-500">Deliverables contracted</div>
                    </div>

                    <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-3">
                      <div className="text-[11px] text-emerald-400 uppercase font-medium">Completed</div>
                      <div className="mt-1 font-mono text-2xl font-bold text-emerald-400">
                        {oneTimeMetrics.completed}
                      </div>
                      <div className="text-[10px] text-emerald-500/80">Published & Sign-off</div>
                    </div>

                    <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
                      <div className="text-[11px] text-neutral-400 uppercase font-medium">Remaining</div>
                      <div className="mt-1 font-mono text-2xl font-bold text-amber-400">
                        {oneTimeMetrics.remaining}
                      </div>
                      <div className="text-[10px] text-neutral-500">In production / review</div>
                    </div>

                    <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
                      <div className="text-[11px] text-neutral-400 uppercase font-medium">Progress</div>
                      <div className="mt-1 font-mono text-2xl font-bold text-sky-400">
                        {oneTimeMetrics.progressPercent}%
                      </div>
                      <div className="text-[10px] text-neutral-500">Overall scope target</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-neutral-400 font-mono">
                      <span>Campaign Deliverable Completion</span>
                      <span>{oneTimeMetrics.completed} of {oneTimeMetrics.target} ({oneTimeMetrics.progressPercent}%)</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${oneTimeMetrics.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Deliverable Type Breakdown (Posts: 3/5, Reels: 2/4) */}
                  <div className="border-t border-neutral-800/80 pt-3">
                    <div className="text-xs font-semibold text-neutral-300 mb-2">
                      Deliverable Target Breakdown:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {oneTimeMetrics.byType.map((bt) => (
                        <div
                          key={bt.label}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-800 bg-neutral-950/50 text-xs"
                        >
                          <span className="font-semibold text-neutral-200">{bt.label}</span>
                          <span className="font-mono text-amber-400 font-bold">
                            {bt.completed} / {bt.target}
                          </span>
                        </div>
                      ))}

                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-800 bg-neutral-950/50 text-xs">
                        <span className="text-neutral-400">In Production</span>
                        <span className="font-mono text-sky-400 font-bold">{oneTimeMetrics.inProduction}</span>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-800 bg-neutral-950/50 text-xs">
                        <span className="text-neutral-400">Client Review</span>
                        <span className="font-mono text-amber-400 font-bold">{oneTimeMetrics.clientReview}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Set Deliverable Targets Prompt if One-Time Project without Targets */}
              {!isRetainer && !hasOneTimeTargets && !isEditingTargets && role !== 'client' && role !== 'viewer' && (
                <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-amber-400" />
                      <span>Configure Deliverable Targets for this Campaign</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Specify how many posts, reels, or videos need to be published in this project to track scope and progress.
                    </p>
                  </div>
                  <button
                    onClick={handleStartEditTargets}
                    className="rounded-lg bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors whitespace-nowrap self-start sm:self-auto flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Set Deliverable Targets</span>
                  </button>
                </div>
              )}

              {/* Status Selector for Team */}
              {role !== 'client' && role !== 'viewer' && (
                <div className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
                  <span className="text-xs font-semibold text-neutral-300">Project Master Status:</span>
                  <select
                    value={project.status}
                    onChange={(e) => updateProjectStatus(project.id, e.target.value as ProjectStatus)}
                    className="rounded border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-amber-400 font-medium focus:border-amber-400 focus:outline-hidden"
                  >
                    {ALL_PROJECT_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Project Scope Description */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1.5">
                  Project Scope & Service Level
                </h3>
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-4 text-xs text-neutral-300 leading-relaxed">
                  {project.description}
                </div>
              </div>

              {/* Retainer Timeline Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-3">
                  <div className="text-neutral-500">Retainer Kickoff Date:</div>
                  <div className="font-mono text-neutral-200 font-semibold mt-0.5">{project.start_date}</div>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-3">
                  <div className="text-neutral-500">Agreement Term / Renewal:</div>
                  <div className="font-mono text-amber-400 font-semibold mt-0.5">{project.deadline}</div>
                </div>
              </div>

              {/* Team Members Allocation */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Assigned Project Team
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {pMembers.map((m) => {
                    const u = profiles.find((p) => p.id === m.user_id);
                    return (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-lg border border-neutral-800 bg-neutral-950/50 text-xs flex items-center gap-2.5"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-800 text-amber-400 font-bold text-[11px]">
                          {u?.full_name?.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-neutral-200 truncate">{u?.full_name}</div>
                          <div className="text-[10px] text-neutral-500 truncate capitalize">
                            {u?.role.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-neutral-400">Execution Task Checklist</span>
                {role !== 'client' && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCreateTaskModal(project.id);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Task</span>
                  </button>
                )}
              </div>

              {pTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">No tasks created yet.</div>
              ) : (
                pTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-neutral-800 bg-neutral-950/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-neutral-200">{t.title}</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Due {t.due_date} · {t.description}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-neutral-800/40">
                      <StatusBadge status={t.status} type="task" />
                      {role !== 'client' && t.status !== 'completed' && (
                        <button
                          onClick={() => updateTaskStatus(t.id, 'completed')}
                          className="text-xs text-emerald-400 hover:underline"
                        >
                          Mark Done
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: CONTENT */}
          {activeTab === 'content' && (
            <div className="space-y-4">
              {/* Cycle Filter Bar */}
              {isRetainer && pCycles.length > 0 && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-neutral-800 bg-neutral-950 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-400 font-medium">Filter Cycle:</span>
                    <select
                      value={selectedCycleIdFilter}
                      onChange={(e) => setSelectedCycleIdFilter(e.target.value)}
                      className="rounded border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-200 focus:border-amber-400"
                    >
                      <option value="all">All Monthly Cycles ({pAllContent.length} items)</option>
                      {pCycles.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.month_name} {c.year} — {c.status.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="text-neutral-500 font-mono text-[11px]">
                    Showing {displayedContent.length} deliverables
                  </span>
                </div>
              )}

              <div className="space-y-3">
                {displayedContent.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-500">
                    No deliverables found for this filter.
                  </div>
                ) : (
                  displayedContent.map((item) => {
                    const assigned = profiles.find((p) => p.id === item.assigned_to);
                    const cycle = monthlyCycles.find((c) => c.id === item.monthly_cycle_id);
                    const itemContribs = contentContributors.filter((cb) => cb.content_id === item.id);

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          onClose();
                          onSelectContent(item.id);
                        }}
                        className="p-3.5 rounded-lg border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/40 cursor-pointer transition-colors space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-neutral-100">{item.title}</span>
                              <span className="text-[10px] text-amber-400 uppercase font-mono">
                                {item.content_type === 'reel' ? '🎬 Reel' : '📱 Post'}
                              </span>
                              <span className="text-[10px] text-neutral-400 capitalize">({item.platform})</span>
                            </div>
                            <div className="text-[11px] text-neutral-400 mt-1 line-clamp-1">
                              {item.brief}
                            </div>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>

                        {/* Assignee & Dates (Section 4, 6 requirement: different assignee & dates for every item) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-900 text-xs">
                          <div className="flex items-center gap-3 text-neutral-400 text-[11px] flex-wrap">
                            <span>Lead: <strong className="text-neutral-200">{assigned?.full_name || 'Unassigned'}</strong></span>
                            {itemContribs.length > 0 && (
                              <span>
                                Contributors: {itemContribs.map((cb) => `${cb.role_in_content}: ${profiles.find(p => p.id === cb.user_id)?.full_name || 'Team'}`).join(', ')}
                              </span>
                            )}
                            {cycle && (
                              <span className="text-amber-400/80 font-mono">Cycle: {cycle.month_name} {cycle.year}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs font-mono">
                            <span className="text-neutral-400">
                              Internal Due: <strong className="text-neutral-200">{item.internal_due_date || item.due_date}</strong>
                            </span>
                            <span className="text-neutral-400">
                              Publishing: <strong className="text-amber-400">{item.publishing_date || 'Unscheduled'}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CALENDAR (Embedded Retainer Content Schedule) */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-100">
                    Retainer Publishing Schedule
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Chronological publishing drops and editorial dates for {project.project_name}
                  </p>
                </div>
                <span className="text-xs font-mono text-amber-400">
                  {pAllContent.length} Deliverables Total
                </span>
              </div>

              <div className="divide-y divide-neutral-800">
                {pAllContent
                  .sort((a, b) => (a.publishing_date || '').localeCompare(b.publishing_date || ''))
                  .map((item) => {
                    const assigned = profiles.find((p) => p.id === item.assigned_to);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          onClose();
                          onSelectContent(item.id);
                        }}
                        className="py-3 flex items-center justify-between gap-3 hover:bg-neutral-800/30 px-2 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="font-mono text-xs font-bold text-amber-400 w-24">
                            {item.publishing_date || 'Unscheduled'}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-neutral-200 flex items-center gap-2">
                              <span>{item.title}</span>
                              <StatusBadge status={item.status} />
                            </div>
                            <div className="text-[11px] text-neutral-400 capitalize">
                              {item.platform} · {item.content_type.replace('_', ' ')} · Assignee: {assigned?.full_name || 'Unassigned'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-xs">
                          <span className="text-[10px] text-neutral-500 block">Internal Due:</span>
                          <span className="font-mono text-neutral-300">{item.internal_due_date || item.due_date}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 5: MONTHLY CYCLES (Section 2, 12, 17 Requirement) */}
          {activeTab === 'cycles' && isRetainer && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-100">
                    Monthly Retainer Cycles
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Previous cycles remain preserved as historical record. Click "Create Next Month" to advance cycle.
                  </p>
                </div>

                {role !== 'client' && role !== 'viewer' && (
                  <button
                    onClick={handleCreateNextMonth}
                    className="rounded-lg bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Next Month</span>
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {pCycles.map((cycle) => {
                  const cycleMetric = getCycleMetrics(cycle.id);
                  const isCurrent = activeCycle?.id === cycle.id;

                  return (
                    <div
                      key={cycle.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCurrent
                          ? 'border-amber-400/80 bg-neutral-950/80 shadow-md ring-1 ring-amber-400/30'
                          : 'border-neutral-800 bg-neutral-950/40'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-neutral-100">
                              {cycle.month_name} {cycle.year}
                            </h4>
                            <StatusBadge status={cycle.status} />
                            {isCurrent && (
                              <span className="rounded bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-400/20">
                                Current Active Cycle
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-400 mt-1">
                            Term: {cycle.start_date} to {cycle.end_date}
                          </div>
                          {cycle.notes && (
                            <div className="text-xs text-neutral-400 mt-1 italic">
                              "{cycle.notes}"
                            </div>
                          )}
                        </div>

                        {/* Cycle Status Change */}
                        {role !== 'client' && role !== 'viewer' && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-neutral-400">Cycle Status:</span>
                            <select
                              value={cycle.status}
                              onChange={(e) => updateMonthlyCycle(cycle.id, { status: e.target.value as any })}
                              className="rounded border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-200 focus:border-amber-400"
                            >
                              <option value="not_started">Not Started</option>
                              <option value="planning">Planning</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="closed">Closed</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Deliverable Targets & Progress */}
                      <div className="mt-4 pt-3 border-t border-neutral-900 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800">
                          <span className="text-neutral-500 block text-[10px] uppercase">Target Deliverables</span>
                          <span className="font-mono text-base font-bold text-neutral-200">{cycleMetric.target}</span>
                        </div>
                        <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800">
                          <span className="text-neutral-500 block text-[10px] uppercase">Completed</span>
                          <span className="font-mono text-base font-bold text-emerald-400">{cycleMetric.completed}</span>
                        </div>
                        <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800">
                          <span className="text-neutral-500 block text-[10px] uppercase">Remaining</span>
                          <span className="font-mono text-base font-bold text-amber-400">{cycleMetric.remaining}</span>
                        </div>
                        <div className="bg-neutral-900/60 p-2.5 rounded-lg border border-neutral-800">
                          <span className="text-neutral-500 block text-[10px] uppercase">Cycle Progress</span>
                          <span className="font-mono text-base font-bold text-sky-400">{cycleMetric.progressPercent}%</span>
                        </div>
                      </div>

                      {/* Type Targets Pill List */}
                      <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
                        <span className="text-[11px] text-neutral-400">Monthly Targets:</span>
                        {cycle.deliverable_targets?.map((dt) => (
                          <span
                            key={dt.label}
                            className="rounded bg-neutral-900 px-2 py-0.5 text-xs text-neutral-300 border border-neutral-800 font-mono"
                          >
                            {dt.target_count} {dt.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: FILES */}
          {activeTab === 'files' && (
            <div className="space-y-2">
              {pFiles.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">No project files attached.</div>
              ) : (
                pFiles.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-neutral-800 bg-neutral-950/60 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-neutral-200">{f.file_name}</div>
                      <div className="text-[11px] text-neutral-400">{f.file_size}</div>
                    </div>
                    <a href={f.file_path} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">
                      Download
                    </a>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 7: COMMENTS */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="max-h-60 overflow-y-auto space-y-2">
                {pComments.length === 0 ? (
                  <div className="py-6 text-center text-xs text-neutral-500">
                    No project comments yet. Post an update below.
                  </div>
                ) : (
                  pComments.map((comm) => {
                    const author = profiles.find((p) => p.id === comm.user_id);
                    return (
                      <div
                        key={comm.id}
                        className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-neutral-200">
                            {author?.full_name || 'User'}
                          </span>
                          <span className="text-[10px] text-neutral-500">
                            {new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-neutral-300 leading-relaxed">{comm.comment}</p>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-neutral-800">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Post comment or milestone update..."
                  className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 focus:border-amber-400 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="rounded-lg bg-amber-400 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 8: ACTIVITY */}
          {activeTab === 'activity' && (
            <div className="space-y-2">
              {pActivity.length === 0 ? (
                <div className="text-xs text-neutral-500 py-6 text-center">No activity logged yet.</div>
              ) : (
                pActivity.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg border border-neutral-800/80 bg-neutral-950/50 text-xs flex items-center justify-between">
                    <div>
                      <div className="text-neutral-200 font-medium">{a.action}</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {new Date(a.created_at).toLocaleString()}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 uppercase">
                      {a.entity_type}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
