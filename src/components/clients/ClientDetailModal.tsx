import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  Building2,
  X,
  Mail,
  Phone,
  MapPin,
  FolderKanban,
  Film,
  FolderArchive,
  Clock,
  CheckCircle2,
  AlertCircle,
  Archive,
  Edit2,
  ArrowRight,
  Send,
} from 'lucide-react';

interface ClientDetailModalProps {
  clientId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (id: string) => void;
  onSelectContent: (id: string) => void;
  onOpenEditModal?: (client: any) => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  clientId,
  isOpen,
  onClose,
  onSelectProject,
  onSelectContent,
  onOpenEditModal,
}) => {
  const { getClientById, projects, contentItems, files, activityLogs, comments, addComment, archiveClient, profiles } = useData();
  const { role } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'content' | 'files' | 'notes'>('overview');
  const [newNote, setNewNote] = useState('');

  if (!isOpen || !clientId) return null;

  const client = getClientById(clientId);
  if (!client) return null;

  const clientProjects = projects.filter((p) => p.client_id === clientId);
  const activeProjects = clientProjects.filter((p) => p.status === 'active');
  const completedProjects = clientProjects.filter((p) => p.status === 'completed');

  const clientContent = contentItems.filter((c) => c.client_id === clientId);
  const pendingApprovals = clientContent.filter((c) => c.status === 'client_review');

  const clientFiles = files.filter((f) => f.client_id === clientId);
  const clientActivity = activityLogs.filter(
    (a) => a.entity_id === clientId || a.metadata?.client === client.company_name
  );
  const pm = profiles.find((p) => p.id === client.assigned_pm_id);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addComment({ projectId: clientProjects[0]?.id, comment: `[Client Note]: ${newNote.trim()}` });
    setNewNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden my-auto sm:my-6 max-h-[94dvh] sm:max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 sm:px-6 py-3 sm:py-4 bg-neutral-950 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-semibold text-neutral-100 truncate">{client.company_name}</h2>
                <StatusBadge status={client.status} />
              </div>
              <div className="text-[11px] sm:text-xs text-neutral-400 truncate">
                {client.industry} · Assigned PM: {pm?.full_name || 'Unassigned'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {role === 'super_admin' && (
              <button
                onClick={() => archiveClient(client.id)}
                className="hidden sm:inline-flex rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:text-rose-400 transition-colors"
              >
                {client.status === 'active' ? 'Archive Client' : 'Restore Client'}
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Controls with Horizontal Touch Scroll */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-4 sm:px-6 pt-2 text-xs font-medium overflow-x-auto whitespace-nowrap flex-nowrap scrollbar-none shrink-0">
          {(['overview', 'projects', 'content', 'files', 'notes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 mr-4 sm:mr-6 capitalize transition-colors border-b-2 shrink-0 ${
                activeTab === tab
                  ? 'border-amber-400 text-amber-400 font-semibold'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tab === 'projects'
                ? `Projects (${clientProjects.length})`
                : tab === 'content'
                ? `Deliverables (${clientContent.length})`
                : tab === 'files'
                ? `Files (${clientFiles.length})`
                : tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Contact Information & Retainer Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                    Contact Information
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-neutral-300">
                      <span className="text-neutral-500 w-24">Key Contact:</span>
                      <span className="font-semibold">{client.contact_person}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-300">
                      <span className="text-neutral-500 w-24">Email:</span>
                      <a href={`mailto:${client.email}`} className="text-amber-400 hover:underline">
                        {client.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-300">
                      <span className="text-neutral-500 w-24">Phone:</span>
                      <span>{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-300">
                      <span className="text-neutral-500 w-24">Studio Address:</span>
                      <span>{client.address || 'Remote account'}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-4 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                    Creative Production Guidelines
                  </h3>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {client.notes || 'No specific creative guidelines provided yet.'}
                  </p>
                </div>
              </div>

              {/* Pending Approvals Spotlight */}
              {pendingApprovals.length > 0 && (
                <div className="rounded-lg border border-amber-800/60 bg-amber-950/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                      <Clock className="h-4 w-4" /> Pending Client Approvals ({pendingApprovals.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {pendingApprovals.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onClose();
                          onSelectContent(item.id);
                        }}
                        className="flex items-center justify-between p-2.5 rounded bg-neutral-900 border border-neutral-800 cursor-pointer hover:border-neutral-700"
                      >
                        <span className="text-xs font-medium text-neutral-200">{item.title}</span>
                        <span className="text-xs text-amber-400 flex items-center gap-1">
                          Review <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Client Activity Audit */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 mb-3">
                  Recent Account Activity
                </h3>
                <div className="space-y-2">
                  {clientActivity.length === 0 ? (
                    <div className="py-4 text-center text-xs text-neutral-500">No logged activity yet.</div>
                  ) : (
                    clientActivity.slice(0, 5).map((act) => (
                      <div key={act.id} className="text-xs text-neutral-400 border-b border-neutral-800/40 pb-2">
                        <span className="text-neutral-200">{act.action}</span> ·{' '}
                        <span className="font-mono text-[10px] text-neutral-500">
                          {new Date(act.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-3">
              {clientProjects.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">No projects yet.</div>
              ) : (
                clientProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onClose();
                      onSelectProject(p.id);
                    }}
                    className="flex items-center justify-between p-3.5 rounded-lg border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/40 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">{p.project_name}</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">{p.description}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-neutral-500 tabular-nums">
                        Due {p.deadline}
                      </span>
                      <StatusBadge status={p.status} type="project" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-2">
              {clientContent.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">No deliverables recorded.</div>
              ) : (
                clientContent.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onClose();
                      onSelectContent(item.id);
                    }}
                    className="flex items-center justify-between p-3 rounded-lg border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-800/40 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">{item.title}</div>
                      <div className="text-[10px] text-neutral-400 capitalize">
                        {item.platform} · {item.content_type.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-neutral-500 tabular-nums">
                        {item.due_date}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-2">
              {clientFiles.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">No files uploaded.</div>
              ) : (
                clientFiles.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-neutral-800 bg-neutral-950/60 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-neutral-200">{f.file_name}</div>
                      <div className="text-[11px] text-neutral-400">{f.file_size || 'File'}</div>
                    </div>
                    <a
                      href={f.file_path}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 hover:underline"
                    >
                      Download
                    </a>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record internal client meeting note or direction..."
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-200 focus:border-amber-400 focus:outline-hidden"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="rounded bg-amber-400 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-300"
                  >
                    Save Note
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
