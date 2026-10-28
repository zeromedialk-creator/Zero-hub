import React from 'react';
import { ContentStatus, ProjectStatus, TaskStatus, Priority } from '../../types/database';

interface StatusBadgeProps {
  status: ContentStatus | ProjectStatus | TaskStatus | Priority | string;
  type?: 'content' | 'project' | 'task' | 'priority';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'content' }) => {
  // Respecting Section 1A Zero-Pill & Metadata Discipline:
  // Render as clean, unboxed text or subtle hairline indicator rather than garish candy pills.

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getStyle = () => {
    switch (status) {
      case 'approved':
      case 'completed':
      case 'published':
        return 'text-emerald-400 border-l-2 border-emerald-500 pl-1.5 font-medium';
      case 'client_review':
        return 'text-amber-400 border-l-2 border-amber-500 pl-1.5 font-semibold animate-pulse';
      case 'changes_requested':
        return 'text-rose-400 border-l-2 border-rose-500 pl-1.5 font-medium';
      case 'in_production':
      case 'in_progress':
      case 'active':
        return 'text-sky-400 border-l-2 border-sky-500 pl-1.5 font-medium';
      case 'planning':
      case 'planned':
        return 'text-teal-400 border-l-2 border-teal-500 pl-1.5 font-medium';
      case 'idea':
        return 'text-amber-300 border-l-2 border-amber-400 pl-1.5 font-semibold';
      case 'assigned':
        return 'text-purple-400 border-l-2 border-purple-500 pl-1.5 font-medium';
      case 'scheduled':
        return 'text-cyan-400 border-l-2 border-cyan-500 pl-1.5 font-medium';
      case 'not_started':
        return 'text-neutral-400 border-l-2 border-neutral-500 pl-1.5 font-medium';
      case 'closed':
        return 'text-neutral-500 border-l-2 border-neutral-600 pl-1.5';
      case 'monthly_retainer':
        return 'text-amber-300 border-l-2 border-amber-400 pl-1.5 font-semibold';
      case 'one_time':
        return 'text-neutral-400 border-l-2 border-neutral-600 pl-1.5 font-medium';
      case 'internal_review':
      case 'review':
        return 'text-indigo-400 border-l-2 border-indigo-500 pl-1.5 font-medium';
      case 'urgent':
        return 'text-rose-400 border-l-2 border-rose-500 pl-1.5 font-semibold';
      case 'high':
        return 'text-amber-400 border-l-2 border-amber-500 pl-1.5 font-medium';
      case 'waiting_for_client':
      case 'waiting':
        return 'text-orange-400 border-l-2 border-orange-500 pl-1.5 font-medium';
      case 'archived':
      case 'on_hold':
        return 'text-neutral-500 border-l-2 border-neutral-600 pl-1.5';
      default:
        return 'text-neutral-400 border-l-2 border-neutral-700 pl-1.5';
    }
  };

  return (
    <span className={`inline-flex items-center text-xs tracking-tight uppercase tabular-nums ${getStyle()}`}>
      {formatText(status)}
    </span>
  );
};

export const RoleBadge: React.FC<{ role?: string | null; className?: string }> = ({ role, className = '' }) => {
  const norm = (role || 'viewer').toLowerCase();

  const getRoleStyle = () => {
    switch (norm) {
      case 'super_admin':
        return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
      case 'project_manager':
        return 'text-sky-400 border-sky-500/40 bg-sky-500/10';
      case 'videographer':
        return 'text-orange-400 border-orange-500/40 bg-orange-500/10';
      case 'editor':
        return 'text-blue-400 border-blue-500/40 bg-blue-500/10';
      case 'copy_editor':
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
      case 'qc':
        return 'text-purple-400 border-purple-500/40 bg-purple-500/10';
      case 'graphic_designer':
        return 'text-pink-400 border-pink-500/40 bg-pink-500/10';
      case 'audio_engineer':
        return 'text-yellow-400 border-yellow-500/40 bg-yellow-500/10';
      case 'colorist':
        return 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10';
      case 'strategist':
        return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';
      case 'social_media_manager':
        return 'text-teal-400 border-teal-500/40 bg-teal-500/10';
      case 'client':
        return 'text-amber-300 border-amber-400/40 bg-amber-400/10';
      case 'viewer':
      default:
        return 'text-neutral-400 border-neutral-700 bg-neutral-800/40';
    }
  };

  const formatName = (r: string) => {
    if (r === 'qc') return 'QC Specialist';
    if (r === 'super_admin') return 'Super Admin';
    if (r === 'project_manager') return 'PM';
    return r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide border capitalize ${getRoleStyle()} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      <span>{formatName(norm)}</span>
    </span>
  );
};
