import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { Search, FolderKanban, Building2, Film, CheckSquare, X, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject?: (id: string) => void;
  onSelectClient?: (id: string) => void;
  onSelectContent?: (id: string) => void;
  onSelectTask?: (id: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
  onSelectClient,
  onSelectContent,
  onSelectTask,
}) => {
  const { filteredClients, filteredProjects, filteredContentItems, filteredTasks } = useData();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingClients = q
    ? filteredClients.filter(
        (c) =>
          c.company_name.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q) ||
          c.contact_person.toLowerCase().includes(q)
      )
    : [];

  const matchingProjects = q
    ? filteredProjects.filter(
        (p) =>
          p.project_name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      )
    : [];

  const matchingContent = q
    ? filteredContentItems.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.platform.toLowerCase().includes(q) ||
          c.content_type.toLowerCase().includes(q) ||
          c.brief?.toLowerCase().includes(q)
      )
    : [];

  const matchingTasks = q
    ? filteredTasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      )
    : [];

  const hasResults =
    matchingClients.length > 0 ||
    matchingProjects.length > 0 ||
    matchingContent.length > 0 ||
    matchingTasks.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 pt-3 sm:pt-20 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-neutral-800 px-4 py-3 bg-neutral-950 shrink-0">
          <Search className="h-4 w-4 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, projects, content, tasks..."
            className="flex-1 bg-transparent text-sm text-neutral-100 placeholder-neutral-500 focus:outline-hidden"
          />
          <button
            onClick={onClose}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 max-h-[70vh] sm:max-h-96 overflow-y-auto p-4 space-y-4">
          {!query && (
            <div className="py-8 text-center text-xs text-neutral-500">
              Type to search across Zero Media clients, active campaigns, and creative deliverables.
            </div>
          )}

          {query && !hasResults && (
            <div className="py-8 text-center text-xs text-neutral-500">
              No matching records found for "{query}".
            </div>
          )}

          {/* Content Items */}
          {matchingContent.length > 0 && (
            <div>
              <div className="text-[11px] font-medium tracking-wide uppercase text-neutral-400 mb-2 flex items-center gap-1.5">
                <Film className="h-3 w-3 text-neutral-400" /> Content Deliverables ({matchingContent.length})
              </div>
              <div className="space-y-1">
                {matchingContent.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectContent?.(item.id);
                      onClose();
                    }}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg hover:bg-neutral-800/60 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="text-xs font-medium text-neutral-200 group-hover:text-amber-300 transition-colors truncate">
                        {item.title}
                      </div>
                      <span className="text-[10px] text-neutral-500 capitalize shrink-0">{item.platform}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <StatusBadge status={item.status} />
                      <ArrowRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-neutral-300 transition-colors shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {matchingProjects.length > 0 && (
            <div>
              <div className="text-[11px] font-medium tracking-wide uppercase text-neutral-400 mb-2 flex items-center gap-1.5">
                <FolderKanban className="h-3 w-3 text-neutral-400" /> Projects ({matchingProjects.length})
              </div>
              <div className="space-y-1">
                {matchingProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProject?.(p.id);
                      onClose();
                    }}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg hover:bg-neutral-800/60 cursor-pointer transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-neutral-200 group-hover:text-amber-300 transition-colors truncate">
                        {p.project_name}
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate">{p.description}</div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <StatusBadge status={p.status} />
                      <ArrowRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-neutral-300 transition-colors shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clients */}
          {matchingClients.length > 0 && (
            <div>
              <div className="text-[11px] font-medium tracking-wide uppercase text-neutral-400 mb-2 flex items-center gap-1.5">
                <Building2 className="h-3 w-3 text-neutral-400" /> Clients ({matchingClients.length})
              </div>
              <div className="space-y-1">
                {matchingClients.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectClient?.(c.id);
                      onClose();
                    }}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg hover:bg-neutral-800/60 cursor-pointer transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-neutral-200 group-hover:text-amber-300 transition-colors truncate">
                        {c.company_name}
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate">{c.industry} · {c.contact_person}</div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-neutral-300 transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {matchingTasks.length > 0 && (
            <div>
              <div className="text-[11px] font-medium tracking-wide uppercase text-neutral-400 mb-2 flex items-center gap-1.5">
                <CheckSquare className="h-3 w-3 text-neutral-400" /> Tasks ({matchingTasks.length})
              </div>
              <div className="space-y-1">
                {matchingTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onSelectTask?.(t.id);
                      onClose();
                    }}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg hover:bg-neutral-800/60 cursor-pointer transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-neutral-200 group-hover:text-amber-300 transition-colors truncate">
                        {t.title}
                      </div>
                      <div className="text-[11px] text-neutral-500 truncate">Due {t.due_date}</div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <StatusBadge status={t.status} />
                      <ArrowRight className="h-3.5 w-3.5 text-neutral-600 group-hover:text-neutral-300 transition-colors shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
