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
        return 'text-teal-400 border-l-2 border-teal-500 pl-1.5 font-medium';
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
