import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Priority, TaskStatus } from '../../types/database';
import { CheckSquare, X, Plus, Trash2 } from 'lucide-react';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  defaultProjectId,
}) => {
  const { filteredProjects, profiles, addTask } = useData();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || filteredProjects[0]?.id || '');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState(
    profiles.find((p) => p.role === 'editor')?.id || ''
  );
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  );
  const [checklist, setChecklist] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: 'chk_1', text: 'Gather brand assets & audio track', done: false },
    { id: 'chk_2', text: 'Export rough cut for internal review', done: false },
  ]);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;
    setChecklist([...checklist, { id: `chk_${Date.now()}`, text: newCheckItem.trim(), done: false }]);
    setNewCheckItem('');
  };

  const handleRemoveChecklist = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!title.trim() || !projectId) {
      setFormError('Please fill out all required fields (Task title, associated project).');
      return;
    }

    addTask({
      title: title.trim(),
      project_id: projectId,
      description: description.trim(),
      assigned_to: assignedTo || undefined,
      created_by: currentUser?.id || 'usr_pm_02',
      status: 'todo',
      priority,
      due_date: dueDate,
      checklist,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden my-auto sm:my-6 max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 sm:px-6 py-3 sm:py-4 bg-neutral-950 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <CheckSquare className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-neutral-100 truncate">Create Production Task</h2>
              <p className="text-xs text-neutral-400 truncate">Assign milestone task with sub-checklists</p>
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
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Master sound mix & add subtitle typography"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Associated Project *
              </label>
              <select
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
              >
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Assignee
              </label>
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 font-mono text-[11px] focus:border-amber-400 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Task Scope & Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions, color codes, file requirements..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden"
            />
          </div>

          {/* Checklist items */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">
              Checklist Items ({checklist.length})
            </label>
            <div className="space-y-1.5 mb-2 max-h-28 overflow-y-auto">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded bg-neutral-950 p-2 border border-neutral-800/80 text-neutral-300"
                >
                  <span>{item.text}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklist(item.id)}
                    className="text-neutral-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                placeholder="Add sub-task checklist item..."
                className="flex-1 rounded border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleAddChecklist}
                className="rounded bg-neutral-800 px-3 py-1.5 text-neutral-200 hover:bg-neutral-700"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
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
              className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-neutral-950 hover:bg-amber-300 transition-colors"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
