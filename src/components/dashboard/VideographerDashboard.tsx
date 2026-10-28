import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { StatusBadge, RoleBadge } from '../common/StatusBadge';
import {
  Video,
  Camera,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FolderArchive,
  ArrowRight,
  ExternalLink,
  Plus,
  Layers,
  MapPin,
  Film,
} from 'lucide-react';

interface VideographerDashboardProps {
  onNavigateTab: (tab: any) => void;
  onSelectContent: (id: string) => void;
  onSelectTask?: (id: string) => void;
}

export const VideographerDashboard: React.FC<VideographerDashboardProps> = ({
  onNavigateTab,
  onSelectContent,
  onSelectTask,
}) => {
  const { currentUser } = useAuth();
  const {
    filteredContentItems,
    filteredTasks,
    clients,
    projects,
    updateContentStatus,
  } = useData();

  const [activeTab, setActiveTab] = useState<'shoots' | 'footage' | 'tasks'>('shoots');

  // Shoots where user is assigned or contributor, or video/reel format
  const myShoots = filteredContentItems.filter((c) => {
    const isDirect = c.assigned_to === currentUser?.id;
    const isContributor = c.contributors?.some(
      (cb) => cb.user_id === currentUser?.id && (cb.role_in_content.toLowerCase().includes('shoot') || cb.role_in_content.toLowerCase().includes('camera'))
    );
    const isVideoFormat = c.content_type === 'video' || c.content_type === 'reel';
    return isDirect || isContributor || isVideoFormat;
  });

  const inProductionShoots = myShoots.filter((c) => c.status === 'in_production' || c.status === 'planned');
  const needsFootageIngest = myShoots.filter((c) => c.status === 'planned' || c.status === 'assigned');
  const completedShoots = myShoots.filter((c) => ['internal_review', 'client_review', 'approved', 'published', 'completed'].includes(c.status));

  const myTasks = filteredTasks.filter((t) => t.assigned_to === currentUser?.id);
  const activeTasks = myTasks.filter((t) => t.status !== 'completed');

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.company_name || 'Client';
  };

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.project_name || 'Campaign';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-100">
              Videography & Camera Studio
            </h1>
            <span className="rounded bg-orange-500/20 px-2 py-0.5 text-[11px] font-semibold text-orange-300 border border-orange-500/30">
              On-Set & Field Production
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Shoot schedule, shot lists, on-location camera calls, and raw footage intake for post-production editing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('calendar')}
            className="rounded-lg bg-neutral-900 border border-neutral-800 px-3.5 py-2 text-xs font-medium text-neutral-200 hover:border-neutral-700 transition-colors flex items-center gap-1.5"
          >
            <Calendar className="h-3.5 w-3.5 text-amber-400" />
            <span>Production Calendar</span>
          </button>
          <button
            onClick={() => onNavigateTab('files')}
            className="rounded-lg bg-orange-500 px-3.5 py-2 text-xs font-semibold text-neutral-950 hover:bg-orange-400 transition-colors flex items-center gap-1.5"
          >
            <FolderArchive className="h-3.5 w-3.5" />
            <span>Raw Footage Vault</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-orange-500/30 bg-orange-950/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400 text-xs font-medium">Scheduled Shoots</span>
            <Camera className="h-4 w-4 text-orange-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-orange-300">
            {inProductionShoots.length}
          </div>
          <div className="mt-1 text-[11px] text-orange-400/80">Active filming pipeline</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">Pending Raw Footage</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-amber-400">
            {needsFootageIngest.length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Camera card offload needed</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">My Assigned Tasks</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-sky-400">
            {activeTasks.length}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">Gear prep & call sheets</div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
          <div className="text-neutral-400 text-xs font-medium">Completed Shoots</div>
          <div className="mt-2 font-mono text-2xl font-bold tabular-nums text-emerald-400">
            {completedShoots.length}
          </div>
          <div className="mt-1 text-[11px] text-emerald-500/80">In post-production / shipped</div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex flex-wrap gap-2 text-xs border-b border-neutral-800 pb-3">
        {[
          { id: 'shoots', label: 'Filming Deliverables', count: myShoots.length },
          { id: 'footage', label: 'Raw Footage & Drives', count: needsFootageIngest.length },
          { id: 'tasks', label: 'Production Tasks', count: myTasks.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-orange-400 bg-orange-400/10 text-orange-300 font-semibold'
                : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Content for Tabs */}
      {activeTab === 'shoots' && (
        <div className="space-y-3">
          {myShoots.length === 0 ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-8 text-center">
              <Camera className="h-8 w-8 text-orange-400 mx-auto opacity-70 mb-2" />
              <div className="text-sm font-semibold text-neutral-200">No scheduled filming sessions</div>
              <p className="text-xs text-neutral-500 mt-1">
                When reels or long-form video deliverables are scheduled, they will appear here with shot lists and target dates.
              </p>
            </div>
          ) : (
            myShoots.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 hover:border-neutral-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono text-neutral-500">
                        {getClientName(item.client_id)}
                      </span>
                      <span className="text-neutral-600">·</span>
                      <span className="text-[11px] text-amber-300 font-medium">
                        {getProjectName(item.project_id)}
                      </span>
                      <span className="text-neutral-600">·</span>
                      <StatusBadge status={item.status} />
                    </div>

                    <div
                      onClick={() => onSelectContent(item.id)}
                      className="font-semibold text-neutral-200 hover:text-orange-400 cursor-pointer transition-colors text-sm truncate"
                    >
                      {item.title}
                    </div>

                    <div className="text-[11px] text-neutral-400 flex flex-wrap items-center gap-3">
                      <span>Format: <strong className="text-neutral-300 uppercase">{item.content_type}</strong></span>
                      {(item.publishing_date || item.due_date) && (
                        <span>Target: <strong className="text-neutral-300">{item.publishing_date || item.due_date}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectContent(item.id)}
                      className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-700 transition-colors"
                    >
                      Shot Notes & Brief
                    </button>
                    {item.status === 'planned' && (
                      <button
                        onClick={() => updateContentStatus(item.id, 'in_production')}
                        className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-orange-400 transition-colors"
                      >
                        Start Filming
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'footage' && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h3 className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
                <FolderArchive className="h-4 w-4 text-orange-400" />
                <span>Raw Footage Ingest & Storage Links</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Centralized storage tracking for camera offloads, Google Drive folders, and NAS backups
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('files')}
              className="rounded-lg bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 text-xs text-neutral-200 transition-colors"
            >
              Open File Vault
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 space-y-2">
              <div className="text-xs font-semibold text-neutral-300">Camera Ingest Protocol</div>
              <ul className="text-xs text-neutral-400 space-y-1.5 list-disc list-inside">
                <li>Double backup: 1x Local Fast SSD + 1x Cloud/NAS Backup</li>
                <li>Verify 10-bit color profile (S-Log3 / D-Log / ProRes)</li>
                <li>Include sync clapper or audio scratch track for editors</li>
                <li>Label folders: <code className="text-orange-300 bg-neutral-900 px-1 py-0.5 rounded font-mono text-[10px]">YYYY-MM-DD_CLIENT_PROJECT_CAM-A</code></li>
              </ul>
            </div>

            <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 space-y-2">
              <div className="text-xs font-semibold text-neutral-300">Storage Quick Jump</div>
              <p className="text-xs text-neutral-400">
                Uploaded raw takes are automatically mirrored to the assigned post-production editor for immediate rough cutting.
              </p>
              <button
                onClick={() => onNavigateTab('files')}
                className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium pt-1"
              >
                <span>Browse File Vault Folders</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {myTasks.length === 0 ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-8 text-center text-xs text-neutral-500">
              No tasks currently assigned to you.
            </div>
          ) : (
            myTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onSelectTask && onSelectTask(task.id)}
                className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5 hover:border-neutral-700 transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-neutral-200">{task.title}</div>
                  <div className="text-neutral-500 text-[11px]">{getProjectName(task.project_id)}</div>
                </div>
                <StatusBadge status={task.status} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
