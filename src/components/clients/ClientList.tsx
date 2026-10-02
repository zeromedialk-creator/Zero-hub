import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Client } from '../../types/database';
import { Building2, Plus, Search, Archive, ExternalLink, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface ClientListProps {
  onSelectClient: (id: string) => void;
  onOpenCreateClientModal: () => void;
}

export const ClientList: React.FC<ClientListProps> = ({ onSelectClient, onOpenCreateClientModal }) => {
  const { filteredClients, projects, contentItems, profiles } = useData();
  const { role } = useAuth();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'archived'>('active');

  const clients = filteredClients.filter((c) => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.company_name.toLowerCase().includes(q) ||
        c.contact_person.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-100">
            {role === 'client' ? 'Client Profile & Overview' : 'Client Accounts & Brands'}
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            {role === 'client'
              ? 'Your company contact details, assigned creative team, and campaign history'
              : 'Zero Media client roster, points of contact, and retainer portfolio'}
          </p>
        </div>

        {role !== 'client' && role !== 'viewer' && (
          <button
            onClick={onOpenCreateClientModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Client</span>
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search clients by name, industry, contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:border-neutral-700 focus:outline-hidden"
          />

          {role !== 'client' && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full sm:w-auto rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 focus:border-neutral-700 focus:outline-hidden"
            >
              <option value="all">All Accounts</option>
              <option value="active">Active Only</option>
              <option value="archived">Archived</option>
            </select>
          )}
        </div>

        <div className="text-[11px] font-mono text-neutral-400 tabular-nums">
          {clients.length} {clients.length === 1 ? 'client' : 'clients'}
        </div>
      </div>

      {/* Grid of Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {clients.length === 0 ? (
          <div className="col-span-full py-16 text-center rounded-xl border border-dashed border-neutral-800 bg-neutral-900/30 p-8 space-y-3">
            <Building2 className="h-8 w-8 text-neutral-600 mx-auto" />
            <div className="text-sm font-semibold text-neutral-300">No client accounts yet</div>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Start by adding your first client brand to organize campaigns, projects, and creative deliverables.
            </p>
            {role !== 'client' && role !== 'viewer' && (
              <button
                onClick={onOpenCreateClientModal}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add First Client</span>
              </button>
            )}
          </div>
        ) : (
          clients.map((c) => {
            const clientProjects = projects.filter((p) => p.client_id === c.id);
            const activePrjs = clientProjects.filter((p) => p.status === 'active').length;
            const clientContent = contentItems.filter((item) => item.client_id === c.id);
            const pendingApprovals = clientContent.filter((item) => item.status === 'client_review').length;
            const pm = profiles.find((p) => p.id === c.assigned_pm_id);

            return (
              <div
                key={c.id}
                onClick={() => onSelectClient(c.id)}
                className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4 hover:border-neutral-700 cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] uppercase tracking-wider text-amber-400/90 font-medium">
                        {c.industry}
                      </span>
                      <h3 className="text-base font-semibold text-neutral-100 mt-0.5 truncate">
                        {c.company_name}
                      </h3>
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={c.status} />
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-neutral-400 border-t border-neutral-800/80 pt-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-neutral-500" />
                      <span className="truncate">{c.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-neutral-500" />
                      <span>{c.phone}</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 pt-1">
                      Lead Contact: <strong className="text-neutral-300">{c.contact_person}</strong>
                    </div>
                  </div>
                </div>

                <div className="border-t border-neutral-800/80 pt-3 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded border border-neutral-800 bg-neutral-950/60 p-1.5">
                      <div className="font-mono text-sm font-bold text-neutral-200 tabular-nums">
                        {clientProjects.length}
                      </div>
                      <div className="text-[10px] text-neutral-500">Projects</div>
                    </div>
                    <div className="rounded border border-neutral-800 bg-neutral-950/60 p-1.5">
                      <div className="font-mono text-sm font-bold text-neutral-200 tabular-nums">
                        {clientContent.length}
                      </div>
                      <div className="text-[10px] text-neutral-500">Deliverables</div>
                    </div>
                    <div className="rounded border border-neutral-800 bg-neutral-950/60 p-1.5">
                      <div className="font-mono text-sm font-bold text-amber-400 tabular-nums">
                        {pendingApprovals}
                      </div>
                      <div className="text-[10px] text-neutral-500">In Review</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
                    <span className="text-[11px]">PM: {pm?.full_name || 'Unassigned'}</span>
                    <span className="text-amber-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      View Profile <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
