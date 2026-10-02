import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Activity, Filter, Clock, User, ArrowRight } from 'lucide-react';

interface ActivityTimelineProps {
  onSelectProject?: (id: string) => void;
  onSelectContent?: (id: string) => void;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ onSelectProject, onSelectContent }) => {
  const { activityLogs, profiles } = useData();
  const [filterType, setFilterType] = useState<string>('all');

  const logs = activityLogs.filter((log) => {
    if (filterType !== 'all' && log.entity_type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-100">
            System Activity & Audit Log
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Chronological audit trail of all project assignments, version uploads, and client sign-offs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 focus:border-amber-400 focus:outline-hidden"
          >
            <option value="all">All Actions ({activityLogs.length})</option>
            <option value="content">Content & Versions</option>
            <option value="approval">Client Approvals</option>
            <option value="task">Tasks</option>
            <option value="project">Projects</option>
            <option value="client">Clients</option>
          </select>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3.5 sm:p-6">
        <div className="relative border-l border-neutral-800 ml-2 sm:ml-4 space-y-5 sm:space-y-6">
          {logs.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              No activity logs recorded.
            </div>
          ) : (
            logs.map((log) => {
              const user = profiles.find((p) => p.id === log.user_id);
              const date = new Date(log.created_at);

              return (
                <div key={log.id} className="relative pl-4 sm:pl-6 group">
                  {/* Indicator Dot */}
                  <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border border-neutral-950 bg-amber-400" />

                  <div className="rounded-lg border border-neutral-800/80 bg-neutral-950/60 p-3 sm:p-3.5 space-y-1 hover:border-neutral-700 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-neutral-200">{user?.full_name || 'System User'}</span>
                        <span className="text-[10px] text-neutral-500 font-mono capitalize">
                          ({user?.role.replace('_', ' ')})
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-neutral-500 tabular-nums">
                        {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-300 font-medium">{log.action}</p>

                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="text-[11px] font-mono text-neutral-500 bg-neutral-900/60 p-2 rounded mt-1.5 overflow-x-auto">
                        {JSON.stringify(log.metadata, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
