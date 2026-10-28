import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Priority, ProjectStatus, ProjectType, ProjectDeliverableTarget, formatRoleTitle } from '../../types/database';
import { FolderKanban, X, Plus, Trash2, CalendarDays, Sparkles, AlertTriangle } from 'lucide-react';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClientId?: string;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  defaultClientId,
}) => {
  const { filteredClients, profiles, addProject, getOptionsByCategory, isSaving } = useData();

  const formatOptions = getOptionsByCategory('content_type');
  const priorityOptions = getOptionsByCategory('priority');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const defaultDeadline = new Date(today.getTime() + 60 * 86400000).toISOString().split('T')[0];

  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('monthly_retainer');
  const [clientId, setClientId] = useState(defaultClientId || '');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('high');
  const [startDate, setStartDate] = useState(todayStr);
  const [deadline, setDeadline] = useState(defaultDeadline);
  const [pmId, setPmId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Flexible Deliverable Targets for Monthly Retainer
  const [targets, setTargets] = useState<ProjectDeliverableTarget[]>([
    { content_type: 'social_media_post', label: 'Posts', target_count: 4 },
    { content_type: 'reel', label: 'Reels', target_count: 4 },
  ]);

  const [formError, setFormError] = useState<string | null>(null);

  // Available Project Managers or Team Leads
  const availablePms = useMemo(() => {
    const pms = profiles.filter((p) => p.role === 'project_manager' || p.role === 'super_admin');
    if (pms.length > 0) return pms;
    const staff = profiles.filter((p) => p.role !== 'client' && p.role !== 'viewer');
    if (staff.length > 0) return staff;
    return profiles;
  }, [profiles]);

  // Compute effective clientId defensively so UI selection & submit payload always agree
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

  // Compute effective pmId defensively
  const effectivePmId = useMemo(() => {
    if (pmId && availablePms.some((p) => p.id === pmId)) {
      return pmId;
    }
    if (availablePms.length > 0) {
      return availablePms[0].id;
    }
    return '';
  }, [pmId, availablePms]);

  // Synchronize state whenever modal is opened or client/profile lists update
  useEffect(() => {
    if (isOpen) {
      setFormError(null);
      if (defaultClientId && filteredClients.some((c) => c.id === defaultClientId)) {
        setClientId(defaultClientId);
      } else if (!clientId || !filteredClients.some((c) => c.id === clientId)) {
        if (filteredClients.length > 0) {
          setClientId(filteredClients[0].id);
        }
      }

      if (!pmId || !availablePms.some((p) => p.id === pmId)) {
        if (availablePms.length > 0) {
          setPmId(availablePms[0].id);
        }
      }

      if (selectedMemberIds.length === 0) {
        const defaultEditor = profiles.find((p) => p.role === 'editor');
        if (defaultEditor) {
          setSelectedMemberIds([defaultEditor.id]);
        }
      }
    }
  }, [isOpen, defaultClientId, filteredClients, availablePms, profiles]);

  if (!isOpen) return null;

  const handleToggleMember = (userId: string) => {
    if (selectedMemberIds.includes(userId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  const handleAddTargetRow = () => {
    setTargets([
      ...targets,
      { content_type: 'social_media_post', label: 'Stories', target_count: 5 },
    ]);
  };

  const handleRemoveTargetRow = (index: number) => {
    if (targets.length <= 1) return;
    setTargets(targets.filter((_, idx) => idx !== index));
  };

  const handleTargetChange = (index: number, field: keyof ProjectDeliverableTarget, value: any) => {
    setTargets(
      targets.map((t, idx) => {
        if (idx !== index) return t;
        return { ...t, [field]: value };
      })
    );
  };

  const totalTargets = targets.reduce((sum, t) => sum + (Number(t.target_count) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = projectName.trim();
    if (!trimmedName) {
      setFormError('Please enter a project name.');
      return;
    }

    const targetClientId = clientId || effectiveClientId;
    if (!targetClientId) {
      if (filteredClients.length === 0) {
        setFormError('No client brands available. Please create a client brand first before creating a project.');
      } else {
        setFormError('Please select a client brand.');
      }
      return;
    }

    const targetPmId = pmId || effectivePmId;

    await addProject(
      {
        project_name: trimmedName,
        project_type: projectType,
        client_id: targetClientId,
        project_manager_id: targetPmId || undefined,
        description: description.trim(),
        status: 'active',
        priority,
        start_date: startDate,
        deadline,
        deliverable_targets: targets,
      },
      selectedMemberIds.filter(Boolean),
      targets
    );

    // Reset transient fields
    setProjectName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden my-auto sm:my-6 max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 sm:px-6 py-3 sm:py-4 bg-neutral-950 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <FolderKanban className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-neutral-100 truncate">Create New Project Campaign</h2>
              <p className="text-xs text-neutral-400 truncate">Configure one-time projects or ongoing monthly retainers</p>
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

          {/* PROJECT TYPE SELECTOR (Section 1 requirement) */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">
              Project Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${
                  projectType === 'monthly_retainer'
                    ? 'border-amber-400 bg-amber-500/10 text-white'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-neutral-100">Monthly Retainer</span>
                  <input
                    type="radio"
                    name="project_type"
                    value="monthly_retainer"
                    checked={projectType === 'monthly_retainer'}
                    onChange={() => setProjectType('monthly_retainer')}
                    className="text-amber-400 focus:ring-0"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Fixed recurring content delivery every month (e.g. 5 Posts, 4 Reels). Cycles continue without rebuilding.
                </p>
              </label>

              <label
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${
                  projectType === 'one_time'
                    ? 'border-amber-400 bg-amber-500/10 text-white'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-neutral-100">One-Time Project</span>
                  <input
                    type="radio"
                    name="project_type"
                    value="one_time"
                    checked={projectType === 'one_time'}
                    onChange={() => setProjectType('one_time')}
                    className="text-amber-400 focus:ring-0"
                  />
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Single campaign with scoped deliverable milestones and finite completion deadline.
                </p>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Monthly Social Media Management"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Client Brand *
              </label>
              {filteredClients.length === 0 ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>No client brands found. Please add a client first.</span>
                </div>
              ) : (
                <select
                  required
                  value={effectiveClientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
                >
                  {filteredClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Lead Project Manager *
              </label>
              {availablePms.length === 0 ? (
                <div className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-400 text-xs">
                  No staff profiles available
                </div>
              ) : (
                <select
                  required
                  value={effectivePmId}
                  onChange={(e) => setPmId(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
                >
                  {availablePms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({formatRoleTitle(p.role)})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* DYNAMIC DELIVERABLE TARGETS BUILDER (One-Time Projects & Monthly Retainers) */}
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <FolderKanban className="h-3.5 w-3.5" />
                  {projectType === 'monthly_retainer' ? 'Monthly Deliverable Targets' : 'Campaign Deliverable Targets'}
                </h3>
                <p className="text-[11px] text-neutral-400">
                  {projectType === 'monthly_retainer'
                    ? 'Define monthly target content quotas for this retainer (e.g. 4 Posts, 4 Reels per month)'
                    : 'Specify how many posts, reels, or videos need to be published in this one-time project'}
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-amber-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-md self-start sm:self-auto">
                Total Scope: {totalTargets} Deliverable{totalTargets === 1 ? '' : 's'}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-neutral-500 font-medium">Quick Presets:</span>
              <button
                type="button"
                onClick={() => setTargets([
                  { content_type: 'social_media_post', label: 'Posts', target_count: 4 },
                  { content_type: 'reel', label: 'Reels', target_count: 4 },
                ])}
                className="text-[10px] bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 px-2 py-0.5 rounded transition-colors"
              >
                4 Posts + 4 Reels
              </button>
              <button
                type="button"
                onClick={() => setTargets([
                  { content_type: 'reel', label: 'Reels / Shorts', target_count: 6 },
                  { content_type: 'video', label: 'Main Video', target_count: 1 },
                ])}
                className="text-[10px] bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 px-2 py-0.5 rounded transition-colors"
              >
                6 Reels + 1 Video
              </button>
              <button
                type="button"
                onClick={() => setTargets([
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
              {targets.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row.label}
                    onChange={(e) => handleTargetChange(idx, 'label', e.target.value)}
                    placeholder="e.g. Posts, Reels, Stories..."
                    className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 focus:border-amber-400"
                  />

                  <select
                    value={row.content_type}
                    onChange={(e) => handleTargetChange(idx, 'content_type', e.target.value)}
                    className="w-32 rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-xs text-neutral-300 focus:border-amber-400"
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
                      onChange={(e) => handleTargetChange(idx, 'target_count', parseInt(e.target.value) || 1)}
                      className="w-16 rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-xs font-mono text-center text-amber-400 font-bold focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveTargetRow(idx)}
                    disabled={targets.length <= 1}
                    className="p-1.5 text-neutral-500 hover:text-rose-400 disabled:opacity-20"
                    title="Remove row"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddTargetRow}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Plus className="h-3 w-3" />
              <span>Add Deliverable Type Target</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                {projectType === 'monthly_retainer' ? 'Retainer Start Date' : 'Kickoff Date'}
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 font-mono text-[11px] focus:border-amber-400 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                {projectType === 'monthly_retainer' ? 'Agreement Term / Renewal' : 'Deadline'}
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 font-mono text-[11px] focus:border-amber-400 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Project Scope Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of campaign scope, creative expectations, delivery SLA, channels..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-2">
              Assign Production Crew Members
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1 border border-neutral-800 rounded-lg bg-neutral-950">
              {profiles
                .filter((p) => p.role !== 'client' && p.role !== 'viewer')
                .map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-neutral-900 cursor-pointer text-neutral-300"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMemberIds.includes(user.id)}
                      onChange={() => handleToggleMember(user.id)}
                      className="rounded border-neutral-700 bg-neutral-900 text-amber-400 focus:ring-0"
                    />
                    <div>
                      <div className="font-semibold text-neutral-200">{user.full_name}</div>
                      <div className="text-[10px] text-neutral-400">{formatRoleTitle(user.role)}</div>
                    </div>
                  </label>
                ))}
            </div>
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
              disabled={isSaving}
              className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-neutral-950 hover:bg-amber-300 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Saving...' : projectType === 'monthly_retainer' ? 'Launch Monthly Retainer' : 'Launch Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
