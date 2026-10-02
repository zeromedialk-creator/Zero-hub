import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ContentItem, ContentType, Platform } from '../../types/database';
import { StatusBadge } from '../common/StatusBadge';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Film,
  FolderKanban,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  ListFilter,
  Instagram,
  Video,
  Share2,
  User,
  AlertCircle,
  MoveRight,
  RotateCcw,
  Sparkles,
  Filter,
} from 'lucide-react';

interface CalendarViewProps {
  onSelectProject: (id: string) => void;
  onSelectContent: (id: string) => void;
}

type CalendarDisplayMode = 'publishing' | 'internal_due' | 'both';
type ViewMode = 'month' | 'week' | 'list';

export const CalendarView: React.FC<CalendarViewProps> = ({ onSelectProject, onSelectContent }) => {
  const {
    filteredContentItems,
    filteredProjects,
    filteredClients,
    profiles,
    getDeadlineWarnings,
    rescheduleContentPublishingDate,
  } = useData();
  const { role } = useAuth();

  // Current viewed month (Defaulting to October 2026 based on campaign timeline)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // October 2026
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [displayMode, setDisplayMode] = useState<CalendarDisplayMode>('publishing');
  const [selectedDay, setSelectedDay] = useState<number | null>(5);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [showWarningPanel, setShowWarningPanel] = useState<boolean>(true);
  const [draggedContentId, setDraggedContentId] = useState<string | null>(null);

  // Quick date edit modal/popover state
  const [reschedulingItem, setReschedulingItem] = useState<ContentItem | null>(null);
  const [newPublishDateInput, setNewPublishDateInput] = useState<string>('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const handlePrevWeek = () => {
    setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000));
  };

  const handleNextWeek = () => {
    setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000));
  };

  // Filter content items according to current project/client/platform filters
  const filteredItems = filteredContentItems.filter((item) => {
    if (selectedClientId !== 'all' && item.client_id !== selectedClientId) return false;
    if (selectedProjectId !== 'all' && item.project_id !== selectedProjectId) return false;
    if (selectedPlatform !== 'all' && item.platform !== selectedPlatform) return false;
    return true;
  });

  // Calculate deadline warnings
  const warnings = getDeadlineWarnings();
  const criticalWarnings = warnings.publishingNotApproved;
  const overdueWarnings = warnings.overdue;
  const awaitingApproval = warnings.awaitingApproval;
  const dueSoon = warnings.dueSoon;

  const totalWarningCount =
    criticalWarnings.length + overdueWarnings.length + awaitingApproval.length;

  // Compile items for a given date string (YYYY-MM-DD)
  const getItemsForDate = (dateStr: string) => {
    return filteredItems.filter((item) => {
      const pubDate = item.publishing_date;
      const dueDate = item.internal_due_date || item.due_date;

      if (displayMode === 'publishing') {
        return pubDate === dateStr;
      }
      if (displayMode === 'internal_due') {
        return dueDate === dateStr;
      }
      // 'both'
      return pubDate === dateStr || dueDate === dateStr;
    });
  };

  // Compile items for a specific day of the current month
  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const contentEvents = getItemsForDate(dateStr);
    const projectDeadlines = filteredProjects.filter((p) => p.deadline === dateStr);
    return { contentEvents, projectDeadlines, total: contentEvents.length + projectDeadlines.length, dateStr };
  };

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : null;

  // Helpers to render format and platform icons
  const renderFormatBadge = (type: ContentType) => {
    switch (type) {
      case 'reel':
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400">🎬 Reel</span>;
      case 'social_media_post':
      case 'carousel':
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-400">📱 Post</span>;
      case 'video':
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-400">📹 Video</span>;
      case 'story':
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400">⚡ Story</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-300">📄 Deliverable</span>;
    }
  };

  const renderPlatformBadge = (plat: Platform) => {
    return (
      <span className="text-[10px] font-mono uppercase text-neutral-400">
        {plat}
      </span>
    );
  };

  // Drag and drop handler
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedContentId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    const contentId = e.dataTransfer.getData('text/plain') || draggedContentId;
    if (contentId) {
      rescheduleContentPublishingDate(contentId, targetDateStr);
    }
    setDraggedContentId(null);
  };

  // Reschedule modal submit
  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingItem || !newPublishDateInput) return;
    rescheduleContentPublishingDate(reschedulingItem.id, newPublishDateInput);
    setReschedulingItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Title & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              Zero Media Agency Schedule
            </span>
            <span className="rounded bg-amber-400/10 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-400/20">
              Content Calendar
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-100 mt-1">
            Content Publishing & Production Calendar
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Track individual publishing schedules, editorial deadlines, client approvals, and real-time delivery warnings.
          </p>
        </div>

        {/* View Mode Switcher: Month / Week / List */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-neutral-800 text-amber-300 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-neutral-800 text-amber-300 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-neutral-800 text-amber-300 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              List
            </button>
          </div>

          {/* Month / Week Navigation */}
          <div className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 p-1">
            <button
              onClick={viewMode === 'week' ? handlePrevWeek : handlePrevMonth}
              className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              title="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-semibold text-neutral-200 font-mono">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={viewMode === 'week' ? handleNextWeek : handleNextMonth}
              className="rounded p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              title="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* DEADLINE WARNINGS BAR (Section 8 Requirement) */}
      {totalWarningCount > 0 && (
        <div className="rounded-xl border border-rose-900/60 bg-rose-950/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-rose-300 flex items-center gap-2">
                  <span>Production Deadline Warnings & Attention Required</span>
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-400 font-mono">
                    {totalWarningCount} Active Alerts
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Overdue deliverables, pending approvals, and scheduled drops requiring sign-off
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowWarningPanel(!showWarningPanel)}
              className="text-xs text-rose-400 hover:underline"
            >
              {showWarningPanel ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          {showWarningPanel && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-rose-900/40">
              {/* Critical: Publishing Approaching but NOT approved */}
              {criticalWarnings.length > 0 && (
                <div className="rounded-lg border border-rose-800/80 bg-rose-950/40 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-rose-300">
                    <span className="flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                      Publishing Reached / Unapproved ({criticalWarnings.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {criticalWarnings.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onSelectContent(item.id)}
                        className="p-2 rounded bg-neutral-900/80 border border-rose-900/60 hover:border-rose-600 cursor-pointer text-xs"
                      >
                        <div className="font-semibold text-neutral-200 truncate">{item.title}</div>
                        <div className="flex items-center justify-between text-[10px] text-rose-300/80 mt-1">
                          <span>Publish: {item.publishing_date}</span>
                          <StatusBadge status={item.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overdue deliverables */}
              {overdueWarnings.length > 0 && (
                <div className="rounded-lg border border-amber-900/60 bg-amber-950/30 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      Overdue Deliverables ({overdueWarnings.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {overdueWarnings.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onSelectContent(item.id)}
                        className="p-2 rounded bg-neutral-900/80 border border-amber-900/60 hover:border-amber-500 cursor-pointer text-xs"
                      >
                        <div className="font-semibold text-neutral-200 truncate">{item.title}</div>
                        <div className="flex items-center justify-between text-[10px] text-amber-300/80 mt-1">
                          <span>Due: {item.internal_due_date || item.due_date}</span>
                          <StatusBadge status={item.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Awaiting Client Approval */}
              {awaitingApproval.length > 0 && (
                <div className="rounded-lg border border-indigo-900/60 bg-indigo-950/30 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                    <span className="flex items-center gap-1.5">
                      <Share2 className="h-3.5 w-3.5 text-indigo-400" />
                      Awaiting Client Sign-off ({awaitingApproval.length})
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {awaitingApproval.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onSelectContent(item.id)}
                        className="p-2 rounded bg-neutral-900/80 border border-indigo-900/60 hover:border-indigo-500 cursor-pointer text-xs"
                      >
                        <div className="font-semibold text-neutral-200 truncate">{item.title}</div>
                        <div className="flex items-center justify-between text-[10px] text-indigo-300/80 mt-1">
                          <span>Scheduled: {item.publishing_date}</span>
                          <span className="text-indigo-400 uppercase font-mono text-[9px]">In Review</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FILTER & DATE TARGET CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Display Mode: Publishing Date vs Internal Due Date */}
          <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-950 p-1">
            <span className="px-2 text-[10px] uppercase font-semibold text-neutral-400">Display Dates:</span>
            <button
              onClick={() => setDisplayMode('publishing')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                displayMode === 'publishing'
                  ? 'bg-amber-400 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Publishing Date
            </button>
            <button
              onClick={() => setDisplayMode('internal_due')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                displayMode === 'internal_due'
                  ? 'bg-amber-400 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Internal Due Date
            </button>
            <button
              onClick={() => setDisplayMode('both')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                displayMode === 'both'
                  ? 'bg-amber-400 text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Both
            </button>
          </div>

          {/* Project Retainer Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-200 focus:border-amber-400 focus:outline-hidden"
          >
            <option value="all">All Projects & Retainers</option>
            {filteredProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_name} {p.project_type === 'monthly_retainer' ? '(Retainer)' : ''}
              </option>
            ))}
          </select>

          {/* Platform Filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-200 focus:border-amber-400 focus:outline-hidden"
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="linkedin">LinkedIn</option>
            <option value="facebook">Facebook</option>
          </select>
        </div>

        <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          <span>{filteredItems.length} Deliverables scheduled in pipeline</span>
        </div>
      </div>

      {/* 1. MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar Grid (8 cols on desktop) */}
          <div className="lg:col-span-8 rounded-xl border border-neutral-800 bg-neutral-900/60 p-2 sm:p-4 overflow-hidden">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-800 mb-2">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {/* Empty leading padding */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-16 sm:min-h-24 rounded-lg bg-neutral-950/20 p-1" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const { contentEvents, projectDeadlines, total } = getEventsForDay(day);
                const isSelected = selectedDay === day;

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, dateStr)}
                    className={`min-h-16 sm:min-h-24 rounded-lg p-1 sm:p-1.5 border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-400 bg-neutral-900 shadow-md ring-1 ring-amber-400/40'
                        : 'border-neutral-800/80 bg-neutral-950/50 hover:border-neutral-700 hover:bg-neutral-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-mono text-[11px] sm:text-xs font-semibold tabular-nums ${
                          isSelected ? 'text-amber-400 font-bold' : 'text-neutral-300'
                        }`}
                      >
                        {day}
                      </span>
                      {total > 0 && (
                        <span className="font-mono text-[8px] sm:text-[9px] text-neutral-300 font-semibold rounded bg-neutral-800 px-1">
                          {total}
                        </span>
                      )}
                    </div>

                    {/* Micro cards on cell */}
                    <div className="space-y-1 my-1 overflow-hidden">
                      {contentEvents.slice(0, 2).map((item) => {
                        const assigned = profiles.find((p) => p.id === item.assigned_to);
                        const isPubApproachingUnapproved =
                          criticalWarnings.some((w) => w.id === item.id);

                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectContent(item.id);
                            }}
                            className={`p-1 rounded text-[9px] font-medium leading-tight truncate border cursor-grab active:cursor-grabbing transition-colors ${
                              isPubApproachingUnapproved
                                ? 'bg-rose-950/60 border-rose-700 text-rose-300'
                                : item.status === 'published'
                                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                                : item.status === 'client_review'
                                ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-200'
                            }`}
                            title={`${item.title} (${item.platform}) - Assigned to ${assigned?.full_name || 'Unassigned'}`}
                          >
                            <div className="flex items-center gap-1 truncate">
                              <span>{item.content_type === 'reel' ? '🎬' : '📱'}</span>
                              <span className="truncate">{item.title}</span>
                            </div>
                          </div>
                        );
                      })}

                      {total > 2 && (
                        <div className="text-[8px] sm:text-[9px] text-neutral-500 font-mono pl-0.5">
                          +{total - 2} more
                        </div>
                      )}
                    </div>

                    <div className="text-[8px] text-neutral-500 truncate capitalize font-mono">
                      {contentEvents[0]?.platform || ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Agenda & Day Inspector (4 cols on desktop) */}
          <div className="lg:col-span-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-neutral-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                    Day Schedule
                  </span>
                  <h3 className="text-sm font-semibold text-neutral-100 mt-0.5">
                    {selectedDay ? `${monthNames[month]} ${selectedDay}, ${year}` : 'Select a date'}
                  </h3>
                </div>
                {selectedDayEvents && (
                  <span className="text-xs font-mono text-neutral-400">
                    {selectedDayEvents.total} items
                  </span>
                )}
              </div>

              {selectedDayEvents && (
                <div className="space-y-3 max-h-[58vh] overflow-y-auto pr-1">
                  {selectedDayEvents.contentEvents.length === 0 ? (
                    <div className="py-8 text-center text-xs text-neutral-500">
                      No deliverables scheduled for {monthNames[month]} {selectedDay}.
                    </div>
                  ) : (
                    selectedDayEvents.contentEvents.map((item) => {
                      const assigned = profiles.find((p) => p.id === item.assigned_to);
                      const isCritical = criticalWarnings.some((w) => w.id === item.id);

                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg border space-y-2 transition-all ${
                            isCritical
                              ? 'border-rose-800 bg-rose-950/30'
                              : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                {renderFormatBadge(item.content_type)}
                                <span className="text-neutral-500">·</span>
                                {renderPlatformBadge(item.platform)}
                              </div>
                              <h4
                                onClick={() => onSelectContent(item.id)}
                                className="text-xs font-semibold text-neutral-100 mt-1 cursor-pointer hover:text-amber-400 transition-colors"
                              >
                                {item.title}
                              </h4>
                            </div>
                            <StatusBadge status={item.status} />
                          </div>

                          <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                            <User className="h-3 w-3 text-neutral-500" />
                            <span>Assigned: <strong className="text-neutral-200">{assigned?.full_name || 'Unassigned'}</strong></span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-neutral-400 pt-1 border-t border-neutral-900">
                            <div>
                              <span className="text-neutral-500 block">Internal Due:</span>
                              <span className="text-neutral-300 font-semibold">{item.internal_due_date || item.due_date}</span>
                            </div>
                            <div>
                              <span className="text-neutral-500 block">Publish Date:</span>
                              <span className="text-amber-400 font-semibold">{item.publishing_date || 'Unset'}</span>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={() => {
                                setReschedulingItem(item);
                                setNewPublishDateInput(item.publishing_date || '');
                              }}
                              className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                            >
                              <RotateCcw className="h-2.5 w-2.5" />
                              Reschedule Date
                            </button>

                            <button
                              onClick={() => onSelectContent(item.id)}
                              className="text-[10px] text-neutral-400 hover:text-white"
                            >
                              Open Details &rarr;
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 text-[10px] text-neutral-500 border-t border-neutral-800 flex items-center justify-between">
              <span>💡 Drag cards to reschedule publishing dates</span>
              <span className="font-mono text-neutral-400">Zero Media</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-4">
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, idx) => {
              // Current week starting from currentDate
              const dayOffset = idx - currentDate.getDay();
              const dateObj = new Date(currentDate.getTime() + dayOffset * 86400000);
              const dateStr = dateObj.toISOString().split('T')[0];
              const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()];
              const items = getItemsForDate(dateStr);

              return (
                <div
                  key={dateStr}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, dateStr)}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 p-2 min-h-[350px] flex flex-col justify-between"
                >
                  <div className="border-b border-neutral-800 pb-2 mb-2">
                    <div className="text-[10px] font-semibold uppercase text-neutral-500">{dayName}</div>
                    <div className="text-sm font-mono font-bold text-neutral-200">
                      {dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {items.length === 0 ? (
                      <div className="text-[10px] text-neutral-600 text-center py-6">No items</div>
                    ) : (
                      items.map((item) => {
                        const assigned = profiles.find((p) => p.id === item.assigned_to);
                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item.id)}
                            onClick={() => onSelectContent(item.id)}
                            className="p-2 rounded border border-neutral-800 bg-neutral-900/80 hover:border-amber-400/60 cursor-pointer space-y-1 text-xs"
                          >
                            <div className="flex items-center justify-between text-[9px]">
                              {renderFormatBadge(item.content_type)}
                              <StatusBadge status={item.status} />
                            </div>
                            <div className="font-semibold text-neutral-100 truncate">{item.title}</div>
                            <div className="text-[10px] text-neutral-400 flex items-center justify-between font-mono">
                              <span>{item.platform}</span>
                              <span className="text-neutral-500 truncate max-w-[70px]">{assigned?.full_name?.split(' ')[0]}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. LIST VIEW (Chronological Publishing Schedule) */}
      {viewMode === 'list' && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">
                Publishing Schedule Chronology
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Every individual content item ordered by scheduled release date
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400">
              {filteredItems.length} Deliverables Total
            </span>
          </div>

          <div className="divide-y divide-neutral-800">
            {filteredItems
              .sort((a, b) => (a.publishing_date || '').localeCompare(b.publishing_date || ''))
              .map((item) => {
                const client = filteredClients.find((c) => c.id === item.client_id);
                const assigned = profiles.find((p) => p.id === item.assigned_to);
                const isCritical = criticalWarnings.some((w) => w.id === item.id);

                return (
                  <div
                    key={item.id}
                    className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isCritical ? 'bg-rose-950/20 px-3 rounded-lg border border-rose-900/40 my-1' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300">
                        {item.content_type === 'reel' ? '🎬' : '📱'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-neutral-100 hover:text-amber-400 cursor-pointer" onClick={() => onSelectContent(item.id)}>
                            {item.title}
                          </span>
                          <StatusBadge status={item.status} />
                          {isCritical && (
                            <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-400 border border-rose-500/30">
                              Publishing Soon - Unapproved
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-neutral-400 mt-1 flex items-center gap-3 flex-wrap">
                          <span className="text-amber-400/90">{client?.company_name}</span>
                          <span>·</span>
                          <span className="capitalize">{item.platform} ({item.content_type.replace('_', ' ')})</span>
                          <span>·</span>
                          <span>Lead: <strong className="text-neutral-300">{assigned?.full_name || 'Unassigned'}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Dates & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-800">
                      <div className="text-right text-xs">
                        <div className="text-[10px] text-neutral-500 uppercase">Publishing Date</div>
                        <div className="font-mono font-bold text-amber-400 tabular-nums">
                          {item.publishing_date || 'Unscheduled'}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          Due: {item.internal_due_date || item.due_date}
                        </div>
                      </div>

                      <button
                        onClick={() => onSelectContent(item.id)}
                        className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-700 transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Reschedule Date Modal */}
      {reschedulingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">
                Reschedule Publishing Date
              </h3>
              <p className="text-xs text-neutral-400 mt-1 truncate">
                {reschedulingItem.title}
              </p>
            </div>

            <form onSubmit={handleConfirmReschedule} className="space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">
                  New Publishing Date
                </label>
                <input
                  type="date"
                  required
                  value={newPublishDateInput}
                  onChange={(e) => setNewPublishDateInput(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 font-mono focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReschedulingItem(null)}
                  className="px-3 py-1.5 text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-400 px-3.5 py-1.5 font-semibold text-neutral-950 hover:bg-amber-300"
                >
                  Confirm Date
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
