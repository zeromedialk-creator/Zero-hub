import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole, Profile } from '../../types/database';
import {
  Settings,
  Users,
  Shield,
  Database,
  Plus,
  ToggleLeft,
  ToggleRight,
  Key,
  Bell,
  Sparkles,
  Check,
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface AdminSettingsProps {
  onOpenSupabaseModal: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onOpenSupabaseModal }) => {
  const { profiles, createUserProfile, updateUserProfile, toggleUserStatus } = useData();
  const { role } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'database' | 'system'>('users');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // New user form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('editor');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    createUserProfile({
      full_name: fullName.trim(),
      email: email.trim(),
      job_title: jobTitle.trim() || 'Creative Specialist',
      role: userRole,
      status: 'active',
      phone: '+1 (555) 019-0000',
    });

    setFullName('');
    setEmail('');
    setJobTitle('');
    setIsCreatingUser(false);
  };

  if (role !== 'super_admin' && role !== 'project_manager') {
    return (
      <div className="py-16 text-center text-xs text-neutral-400">
        Access restricted. You need Super Admin or PM credentials to access Zero Hub settings.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-100">
            System Settings & Team Roles
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            {role === 'super_admin'
              ? 'Zero Media user access control, Supabase PostgreSQL schema sync, and security rules'
              : 'Zero Media user access control, permissions, and agency preferences'}
          </p>
        </div>

        {role === 'super_admin' && (
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSupabaseModal}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800/80 bg-emerald-950/40 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-950/60 transition-colors whitespace-nowrap"
            >
              <Database className="h-4 w-4 text-emerald-400" />
              <span>Supabase SQL & Connection</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 bg-neutral-900/40 px-4 pt-2 text-xs font-medium overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 mr-6 transition-colors border-b-2 shrink-0 ${
            activeTab === 'users'
              ? 'border-amber-400 text-amber-400 font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Team & User Access ({profiles.length})
        </button>
        {role === 'super_admin' && (
          <button
            onClick={() => setActiveTab('database')}
            className={`pb-3 mr-6 transition-colors border-b-2 shrink-0 ${
              activeTab === 'database'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Database & RLS Security
          </button>
        )}
        <button
          onClick={() => setActiveTab('system')}
          className={`pb-3 transition-colors border-b-2 shrink-0 ${
            activeTab === 'system'
              ? 'border-amber-400 text-amber-400 font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Agency Preferences
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-xs text-neutral-400">
              Manage accounts, assign roles (Super Admin, PM, Editor, Copy Editor, Client, Viewer), and toggle active access.
            </div>
            {role === 'super_admin' && (
              <button
                onClick={() => setIsCreatingUser(!isCreatingUser)}
                className="inline-flex items-center gap-1 rounded bg-amber-400 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add User</span>
              </button>
            )}
          </div>

          {/* New User Drawer */}
          {isCreatingUser && (
            <form
              onSubmit={handleCreateUser}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-4 text-xs"
            >
              <div className="font-semibold text-neutral-200">Provision New User Account</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-neutral-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Liam Evans"
                    className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. liam@zeromedia.agency"
                    className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. 3D Animator"
                    className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">System Role</label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as UserRole)}
                    className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="editor">Editor / Designer</option>
                    <option value="copy_editor">Content / Copy Editor</option>
                    <option value="client">Client</option>
                    <option value="viewer">Viewer / Management</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingUser(false)}
                  className="px-3 py-1.5 text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-amber-400 px-4 py-1.5 font-semibold text-neutral-950 hover:bg-amber-300"
                >
                  Save User
                </button>
              </div>
            </form>
          )}

          {/* User Table & Mobile Cards */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
            {/* Mobile User Cards */}
            <div className="md:hidden divide-y divide-neutral-800/60">
              {profiles.map((p) => (
                <div key={p.id} className="p-4 space-y-3 hover:bg-neutral-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-xs font-semibold text-amber-400">
                        {p.full_name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-neutral-200 text-xs truncate">{p.full_name}</div>
                        <div className="text-[11px] text-neutral-500 truncate">{p.email}</div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center text-[10px] uppercase font-semibold shrink-0 ${
                        p.status === 'active' ? 'text-emerald-400' : 'text-neutral-500'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/60">
                    <div>Title: <span className="text-neutral-300">{p.job_title}</span></div>
                    <div className="font-mono text-amber-400 capitalize">{p.role.replace('_', ' ')}</div>
                  </div>

                  {role === 'super_admin' && (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <select
                        value={p.role}
                        onChange={(e) => updateUserProfile(p.id, { role: e.target.value as UserRole })}
                        className="rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-200 flex-1"
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="project_manager">PM</option>
                        <option value="editor">Editor</option>
                        <option value="copy_editor">Copy Editor</option>
                        <option value="client">Client</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={() => toggleUserStatus(p.id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                          p.status === 'active'
                            ? 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-rose-400'
                            : 'border-emerald-800/60 bg-emerald-950/30 text-emerald-400'
                        }`}
                      >
                        {p.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop User Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="border-b border-neutral-800 bg-neutral-950/80 text-[11px] uppercase tracking-wider text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-800 text-[11px] font-semibold text-amber-400">
                            {p.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-200">{p.full_name}</div>
                            <div className="text-[10px] text-neutral-500">{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] capitalize text-amber-300">
                        {p.role.replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3 text-neutral-400">{p.job_title}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center text-[10px] uppercase font-semibold ${
                            p.status === 'active' ? 'text-emerald-400' : 'text-neutral-500'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {role === 'super_admin' && (
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={p.role}
                              onChange={(e) => updateUserProfile(p.id, { role: e.target.value as UserRole })}
                              className="rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-[10px] text-neutral-300"
                            >
                              <option value="super_admin">Super Admin</option>
                              <option value="project_manager">PM</option>
                              <option value="editor">Editor</option>
                              <option value="copy_editor">Copy Editor</option>
                              <option value="client">Client</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <button
                              onClick={() => toggleUserStatus(p.id)}
                              className="text-neutral-400 hover:text-amber-400 text-[11px]"
                            >
                              {p.status === 'active' ? 'Disable' : 'Enable'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'database' && (
        <div className="space-y-5 rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 text-xs">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                Row Level Security & Database Architecture
              </h3>
              <p className="text-neutral-400 mt-1">
                Zero Hub relies on 13 PostgreSQL tables with strict RLS enforcement at the database level.
              </p>
            </div>
            <button
              onClick={onOpenSupabaseModal}
              className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors"
            >
              Open SQL Migration Script
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 space-y-1.5">
              <div className="font-semibold text-neutral-200">13 Tables Defined</div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                profiles, clients, client_users, projects, project_members, tasks, content_items, content_versions, approvals, comments, files, notifications, activity_logs.
              </p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 space-y-1.5">
              <div className="font-semibold text-neutral-200">Granular RLS Policies</div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Clients are isolated to their own records. Editors see assigned content. PMs manage campaign workflows. Super Admins hold complete oversight.
              </p>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 space-y-1.5">
              <div className="font-semibold text-neutral-200">Automated Triggers</div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Auto-updates updated_at timestamp on records and automatically creates user profiles when signups occur.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-5 text-xs">
          <div>
            <h3 className="text-sm font-semibold text-neutral-100">Zero Media Agency Brand Configuration</h3>
            <p className="text-neutral-400 mt-0.5">Workspace defaults and global agency preferences</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-400 mb-1">Company Name</label>
              <input
                type="text"
                disabled
                value="Zero Media"
                className="w-full rounded border border-neutral-800 bg-neutral-950/60 px-3 py-1.5 text-neutral-300"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Internal System Name</label>
              <input
                type="text"
                disabled
                value="Zero Hub"
                className="w-full rounded border border-neutral-800 bg-neutral-950/60 px-3 py-1.5 text-neutral-300"
              />
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-4">
            <div className="text-xs font-semibold text-neutral-300 mb-2">Notification Defaults</div>
            <div className="space-y-2 text-neutral-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-neutral-700 bg-neutral-900 text-amber-400" />
                <span>Notify Project Managers instantly when client requests changes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-neutral-700 bg-neutral-900 text-amber-400" />
                <span>Notify Editors when new tasks or revisions are assigned</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-neutral-700 bg-neutral-900 text-amber-400" />
                <span>Email client contacts when deliverable enters Client Review</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
