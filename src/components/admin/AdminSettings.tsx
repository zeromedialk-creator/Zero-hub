import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole, Profile, SYSTEM_ROLE_DEFINITIONS, formatRoleTitle, SystemRoleDefinition } from '../../types/database';
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
  Trash2,
  Building2,
  Link2,
  AlertTriangle,
  RefreshCw,
  Briefcase,
  CheckCircle2,
  Filter,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { StatusBadge, RoleBadge } from '../common/StatusBadge';

interface AdminSettingsProps {
  onOpenDbModal: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onOpenDbModal }) => {
  const {
    profiles,
    clients,
    createUserProfile,
    updateUserProfile,
    deleteUserProfile,
    toggleUserStatus,
    linkUserToClient,
    unlinkUserFromClient,
    getClientForUser,
    dbError,
  } = useData();
  const { role, currentUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'users' | 'database' | 'options' | 'system'>('users');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [userSuccessMsg, setUserSuccessMsg] = useState<string | null>(null);
  const [userErrorMsg, setUserErrorMsg] = useState<string | null>(null);

  // Dynamic Options Management State
  const { appOptions, addOption, deleteOption, isSaving } = useData();
  const [selectedOptCategory, setSelectedOptCategory] = useState<string>('content_type');
  const [newOptionLabel, setNewOptionLabel] = useState<string>('');
  const [newOptionKey, setNewOptionKey] = useState<string>('');
  const [optionSuccess, setOptionSuccess] = useState<string | null>(null);

  const handleCreateOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptionLabel.trim()) return;

    const key = newOptionKey.trim() || newOptionLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const result = await addOption({
      category: selectedOptCategory,
      key,
      label: newOptionLabel.trim(),
      is_active: true,
      sort_order: appOptions.filter((o) => o.category === selectedOptCategory).length + 1,
    });

    if (result) {
      setNewOptionLabel('');
      setNewOptionKey('');
      setOptionSuccess(`Saved "${result.label}" to database!`);
      setTimeout(() => setOptionSuccess(null), 3000);
    }
  };

  // Dynamic combined role options (built-in system roles + any custom user_role options from DB)
  const customRoleOptions = useMemo(
    () => appOptions.filter((o) => o.category === 'user_role'),
    [appOptions]
  );

  const allRoleList = useMemo<SystemRoleDefinition[]>(() => {
    const list: SystemRoleDefinition[] = [...SYSTEM_ROLE_DEFINITIONS];
    customRoleOptions.forEach((opt) => {
      if (!list.some((r) => r.key === opt.key)) {
        list.push({
          key: opt.key,
          label: opt.label,
          department: 'Production',
          description: `Custom duty/role: ${opt.label}`,
          defaultJobTitle: opt.label,
          badgeClass: 'text-amber-300 border-amber-500/30 bg-amber-400/10',
        });
      }
    });
    return list;
  }, [customRoleOptions]);

  // Role filter on user list
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Filtered users according to selected role filter
  const filteredProfiles = useMemo(() => {
    if (roleFilter === 'all') return profiles;
    return profiles.filter((p) => p.role === roleFilter);
  }, [profiles, roleFilter]);

  // New user form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('Senior Video Editor');
  const [userRole, setUserRole] = useState<UserRole>('editor');
  const [assignedClientId, setAssignedClientId] = useState<string>('');
  const [userPassword, setUserPassword] = useState('');

  // Auto-fill suggested job title when role changes
  const handleRoleSelectChange = (nextRole: UserRole) => {
    setUserRole(nextRole);
    if (nextRole === 'client' && !assignedClientId && clients.length > 0) {
      setAssignedClientId(clients[0].id);
    }
    const def = allRoleList.find((r) => r.key === nextRole);
    if (def) {
      // If jobTitle is empty or matches another default, auto-populate with the duty title
      if (!jobTitle.trim() || allRoleList.some((r) => r.defaultJobTitle === jobTitle.trim())) {
        setJobTitle(def.defaultJobTitle);
      }
    }
  };

  // Change password modal state
  const [passwordModalUser, setPasswordModalUser] = useState<Profile | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Dedicated Delete User Confirmation State
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState<boolean>(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    setIsSubmittingUser(true);
    setUserErrorMsg(null);
    setUserSuccessMsg(null);

    const roleDef = allRoleList.find((r) => r.key === userRole);
    const resolvedTitle = jobTitle.trim() || roleDef?.defaultJobTitle || 'Creative Specialist';

    try {
      const created = await createUserProfile(
        {
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          job_title: resolvedTitle,
          role: userRole,
          status: 'active',
          phone: '',
          password: userPassword.trim() || 'zeromedia2026',
        },
        userRole === 'client' && assignedClientId ? assignedClientId : undefined
      );

      if (created) {
        setUserSuccessMsg(`User "${created.full_name}" (${created.email}) created successfully as ${formatRoleTitle(created.role)}! Password set.`);
        setFullName('');
        setEmail('');
        setJobTitle('Senior Video Editor');
        setUserRole('editor');
        setUserPassword('');
        setAssignedClientId('');
        setIsCreatingUser(false);
        setTimeout(() => setUserSuccessMsg(null), 6000);
      } else {
        setUserErrorMsg('Could not save user profile. Please check database permissions or SQL schema.');
      }
    } catch (err: any) {
      setUserErrorMsg(err?.message || 'Error occurred while creating user.');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleSaveUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !newPasswordValue.trim()) return;

    if (newPasswordValue.trim().length < 4) {
      setUserErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    setIsSavingPassword(true);
    try {
      await updateUserProfile(passwordModalUser.id, { password: newPasswordValue.trim() });
      setUserSuccessMsg(`Password updated successfully for "${passwordModalUser.full_name}".`);
      setPasswordModalUser(null);
      setNewPasswordValue('');
      setTimeout(() => setUserSuccessMsg(null), 4000);
    } catch (err: any) {
      setUserErrorMsg(err?.message || 'Failed to update user password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteUser = (p: Profile) => {
    setUserToDelete(p);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      const deletedName = userToDelete.full_name;
      const success = await deleteUserProfile(userToDelete.id);
      if (success) {
        setUserSuccessMsg(`User "${deletedName}" was permanently removed from the system, dashboards, and all related assignments.`);
        setUserToDelete(null);
        setTimeout(() => setUserSuccessMsg(null), 6000);
      } else {
        setUserErrorMsg(`Could not delete user "${deletedName}".`);
      }
    } catch (err: any) {
      setUserErrorMsg(err?.message || 'Failed to delete user.');
    } finally {
      setIsDeletingUser(false);
    }
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
              ? 'Zero Media user access control, PostgreSQL schema sync, and security rules'
              : 'Zero Media user access control, permissions, and agency preferences'}
          </p>
        </div>

        {role === 'super_admin' && (
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenDbModal}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800/80 bg-emerald-950/40 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-950/60 transition-colors whitespace-nowrap"
            >
              <Database className="h-4 w-4 text-emerald-400" />
              <span>Database SQL & Connection</span>
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
          onClick={() => setActiveTab('options')}
          className={`pb-3 mr-6 transition-colors border-b-2 shrink-0 ${
            activeTab === 'options'
              ? 'border-amber-400 text-amber-400 font-semibold'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Dynamic Options & Taxonomies ({appOptions.length})
        </button>
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
          {/* User Feedback Notifications */}
          {userSuccessMsg && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3.5 text-xs text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{userSuccessMsg}</span>
              </div>
              <div className="flex items-center gap-2">
                {role === 'super_admin' && (
                  <button
                    onClick={onOpenDbModal}
                    className="inline-flex items-center gap-1.5 rounded-md border border-emerald-600/60 bg-emerald-900/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-800/40 transition-colors shrink-0"
                  >
                    <Database className="h-3 w-3" />
                    <span>View Supabase Cascade SQL</span>
                  </button>
                )}
                <button onClick={() => setUserSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
                  &times;
                </button>
              </div>
            </div>
          )}

          {userErrorMsg && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 p-3.5 text-xs text-rose-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{userErrorMsg}</span>
              </div>
              <button onClick={() => setUserErrorMsg(null)} className="text-rose-400 hover:text-rose-200">
                &times;
              </button>
            </div>
          )}

          {dbError && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3.5 text-xs text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{dbError}</span>
              </div>
              <button
                onClick={onOpenDbModal}
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/60 bg-amber-900/40 px-2.5 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-900/60 transition-colors shrink-0"
              >
                <Database className="h-3.5 w-3.5" />
                <span>View Supabase SQL Fix</span>
              </button>
            </div>
          )}

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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                    placeholder="e.g. member@zeromedia.lk"
                    className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Video Editor"
                    className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">System Role & Duty</label>
                  <select
                    value={userRole}
                    onChange={(e) => handleRoleSelectChange(e.target.value as UserRole)}
                    className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
                  >
                    <optgroup label="Leadership & Management">
                      {allRoleList
                        .filter((r) => r.department === 'Leadership')
                        .map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.label}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Production (On-Set & Camera)">
                      {allRoleList
                        .filter((r) => r.department === 'Production')
                        .map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.label}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Post-Production & Creative Craft">
                      {allRoleList
                        .filter((r) => r.department === 'Post-Production')
                        .map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.label}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Quality Assurance & Review">
                      {allRoleList
                        .filter((r) => r.department === 'Quality')
                        .map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.label}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Editorial & Storytelling">
                      {allRoleList
                        .filter((r) => r.department === 'Editorial')
                        .map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.label}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Distribution & Publishing">
                      {allRoleList
                        .filter((r) => r.department === 'Distribution')
                        .map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.label}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Client & External Stakeholders">
                      {allRoleList
                        .filter((r) => r.department === 'Client')
                        .map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.label}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Login Password</label>
                  <input
                    type="text"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="Set temporary password"
                    className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-neutral-200 font-mono focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Selected Role Duty & Responsibility Insight */}
              {(() => {
                const activeRoleDef = allRoleList.find((r) => r.key === userRole);
                if (!activeRoleDef) return null;
                return (
                  <div className="flex items-start sm:items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950/80 p-3 text-xs text-neutral-300">
                    <RoleBadge role={activeRoleDef.key} />
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-neutral-200">{activeRoleDef.label}</span>
                      <span className="text-neutral-500 mx-1.5">·</span>
                      <span className="text-neutral-400">{activeRoleDef.description}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Conditional Client Brand Association for Client Users */}
              {userRole === 'client' && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                    <Building2 className="h-4 w-4" />
                    <span>Link to Client Brand / Company *</span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Connecting this account to a company brand links the user to their campaigns, retainer cycles, deliverables, and approval workflow.
                  </p>
                  <select
                    required
                    value={assignedClientId}
                    onChange={(e) => setAssignedClientId(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 focus:border-amber-400 focus:outline-hidden"
                  >
                    <option value="">-- Select Client Company --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name} ({c.contact_person} · {c.industry})
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  disabled={isSubmittingUser}
                  className="rounded bg-amber-400 px-4 py-1.5 font-semibold text-neutral-950 hover:bg-amber-300 disabled:opacity-50 transition-colors"
                >
                  {isSubmittingUser ? 'Saving User...' : 'Save User'}
                </button>
              </div>
            </form>
          )}

          {/* User Role Filter Bar & Counter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/40 p-3 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Filter className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>Filter by System Duty:</span>
              <span className="font-semibold text-neutral-200">
                {roleFilter === 'all' ? 'All Roles' : formatRoleTitle(roleFilter)} ({filteredProfiles.length})
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  roleFilter === 'all'
                    ? 'bg-amber-400 text-neutral-950 font-semibold'
                    : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                }`}
              >
                All ({profiles.length})
              </button>
              {allRoleList
                .filter((r) => profiles.some((p) => p.role === r.key))
                .map((r) => {
                  const count = profiles.filter((p) => p.role === r.key).length;
                  const isActive = roleFilter === r.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setRoleFilter(r.key)}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors border ${
                        isActive
                          ? 'border-amber-400 bg-amber-400/10 text-amber-300 font-semibold'
                          : 'border-neutral-800/80 bg-neutral-900 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {r.label} ({count})
                    </button>
                  );
                })}
            </div>
          </div>

          {/* User Table & Mobile Cards */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
            {/* Mobile User Cards */}
            <div className="md:hidden divide-y divide-neutral-800/60">
              {filteredProfiles.map((p) => {
                const linkedClient = getClientForUser(p.id);
                return (
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
                      <RoleBadge role={p.role} />
                    </div>

                    {/* Brand Link for Client Users */}
                    {p.role === 'client' && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-800/60 gap-2">
                        <div className="flex items-center gap-1.5 text-neutral-400 shrink-0">
                          <Building2 className="h-3.5 w-3.5 text-amber-400" />
                          <span>Brand:</span>
                        </div>
                        {role === 'super_admin' ? (
                          <select
                            value={linkedClient?.id || ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                linkUserToClient(p.id, e.target.value);
                              } else if (linkedClient) {
                                unlinkUserFromClient(p.id, linkedClient.id);
                              }
                            }}
                            className={`rounded border px-2 py-1 text-[11px] flex-1 max-w-[190px] truncate ${
                              linkedClient
                                ? 'border-neutral-800 bg-neutral-950 text-neutral-200'
                                : 'border-rose-800/80 bg-rose-950/40 text-rose-300 font-semibold'
                            }`}
                          >
                            <option value="">⚠️ Not Linked (No Access)</option>
                            {clients.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.company_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={linkedClient ? 'text-amber-300 font-medium' : 'text-rose-400 font-medium'}>
                            {linkedClient?.company_name || '⚠️ Unlinked'}
                          </span>
                        )}
                      </div>
                    )}

                    {role === 'super_admin' && (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-800/40">
                        <select
                          value={p.role}
                          onChange={(e) => updateUserProfile(p.id, { role: e.target.value as UserRole })}
                          className="rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-xs text-neutral-200 flex-1"
                        >
                          {allRoleList.map((r) => (
                            <option key={r.key} value={r.key}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            setPasswordModalUser(p);
                            setNewPasswordValue(p.password || 'zeromedia2026');
                          }}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-medium border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-amber-400 flex items-center gap-1 transition-colors"
                          title="Change or view login password"
                        >
                          <Key className="h-3 w-3" />
                          <span>Password</span>
                        </button>
                        <button
                          onClick={() => toggleUserStatus(p.id)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors ${
                            p.status === 'active'
                              ? 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-rose-400'
                              : 'border-emerald-800/60 bg-emerald-950/30 text-emerald-400'
                          }`}
                        >
                          {p.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(p)}
                          className="rounded-lg p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop User Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[720px]">
                <thead className="border-b border-neutral-800 bg-neutral-950/80 text-[11px] uppercase tracking-wider text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Assigned Brand / Company</th>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredProfiles.map((p) => {
                    const linkedClient = getClientForUser(p.id);
                    return (
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
                        <td className="px-4 py-3">
                          <RoleBadge role={p.role} />
                        </td>
                        <td className="px-4 py-3">
                          {p.role === 'client' ? (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                              {role === 'super_admin' ? (
                                <select
                                  value={linkedClient?.id || ''}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      linkUserToClient(p.id, e.target.value);
                                    } else if (linkedClient) {
                                      unlinkUserFromClient(p.id, linkedClient.id);
                                    }
                                  }}
                                  className={`rounded border px-2 py-1 text-[11px] max-w-[190px] truncate ${
                                    linkedClient
                                      ? 'border-neutral-800 bg-neutral-950 text-neutral-200'
                                      : 'border-rose-800/80 bg-rose-950/40 text-rose-300 font-semibold'
                                  }`}
                                >
                                  <option value="">⚠️ Not linked to brand</option>
                                  {clients.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.company_name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className={linkedClient ? 'text-neutral-200 font-medium' : 'text-rose-400 font-medium'}>
                                  {linkedClient?.company_name || '⚠️ Unlinked'}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-neutral-500 text-[11px]">Zero Media Internal</span>
                          )}
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
                                className="rounded border border-neutral-800 bg-neutral-950 px-2 py-1 text-[10px] text-neutral-300 max-w-[140px]"
                              >
                                {allRoleList.map((r) => (
                                  <option key={r.key} value={r.key}>
                                    {r.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => {
                                  setPasswordModalUser(p);
                                  setNewPasswordValue(p.password || 'zeromedia2026');
                                }}
                                className="text-neutral-400 hover:text-amber-400 text-[11px] flex items-center gap-1"
                                title="Change or view login password"
                              >
                                <Key className="h-3 w-3" />
                                <span>Password</span>
                              </button>
                              <button
                                onClick={() => toggleUserStatus(p.id)}
                                className="text-neutral-400 hover:text-amber-400 text-[11px]"
                              >
                                {p.status === 'active' ? 'Disable' : 'Enable'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(p)}
                                className="text-neutral-500 hover:text-rose-400 p-1 rounded transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
              onClick={onOpenDbModal}
              className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors"
            >
              Open SQL Migration Script
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 space-y-1.5">
              <div className="font-semibold text-neutral-200">14 Tables Defined</div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                profiles, clients, client_users, projects, project_members, tasks, content_items, content_versions, approvals, comments, files, notifications, activity_logs, app_options.
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

          {/* User Cascade & Deletion Fix Script Card */}
          <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-4 space-y-2 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-rose-200 flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-rose-400" />
                  Cascade User Deletion & Cleanup Script
                </div>
                <p className="text-[11px] text-neutral-300 mt-0.5">
                  If deleted users ever reappear in the admin panel or fail to delete due to Supabase foreign key constraints, run this SQL script. It creates server-side cascade routines and unassigns users from tasks, deliverables, projects, and dashboards automatically.
                </p>
              </div>
              <button
                onClick={onOpenDbModal}
                className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <Database className="h-3.5 w-3.5" />
                <span>View & Copy SQL Script</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Database-backed Options Tab */}
      {activeTab === 'options' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">Dynamic Database Options & Categories</h3>
              <p className="text-xs text-neutral-400">
                All formats, platforms, priorities, statuses, and roles are stored in the database and shared across all devices in real-time.
              </p>
            </div>
            {optionSuccess && (
              <span className="text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-md">
                {optionSuccess}
              </span>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { id: 'content_type', label: 'Content Formats' },
              { id: 'platform', label: 'Social Platforms' },
              { id: 'priority', label: 'Priorities' },
              { id: 'content_status', label: 'Workflow Statuses' },
              { id: 'contributor_role', label: 'Contributor Roles' },
              { id: 'user_role', label: 'User Roles & Duties' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedOptCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                  selectedOptCategory === cat.id
                    ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                    : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {cat.label} ({appOptions.filter((o) => o.category === cat.id).length})
              </button>
            ))}
          </div>

          {/* Add Option Form */}
          <form
            onSubmit={handleCreateOption}
            className="rounded-xl border border-neutral-800 bg-neutral-900/80 p-4 space-y-3 text-xs"
          >
            <div className="font-semibold text-neutral-200 flex items-center justify-between">
              <span>Add New Option to Database</span>
              <span className="text-[11px] font-mono text-amber-400 capitalize">
                Category: {selectedOptCategory.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-neutral-400 mb-1">Display Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Threads, Newsletter, 3D Render..."
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">System Key (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={newOptionKey}
                  onChange={(e) => setNewOptionKey(e.target.value)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 font-mono text-neutral-200 focus:border-amber-400 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSaving || !newOptionLabel.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-300 disabled:opacity-50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Save Option to Database</span>
              </button>
            </div>
          </form>

          {/* Option List Grid */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
            <div className="px-4 py-3 bg-neutral-950 border-b border-neutral-800 text-xs font-semibold text-neutral-300 flex items-center justify-between">
              <span>Configured Options for Category</span>
              <span className="text-[11px] text-neutral-500">Live in Database</span>
            </div>

            <div className="divide-y divide-neutral-800/60 text-xs">
              {appOptions.filter((o) => o.category === selectedOptCategory).length === 0 ? (
                <div className="p-6 text-center text-neutral-500">
                  No options created in this category yet. Add one above!
                </div>
              ) : (
                appOptions
                  .filter((o) => o.category === selectedOptCategory)
                  .map((opt) => (
                    <div
                      key={opt.id}
                      className="px-4 py-3 flex items-center justify-between hover:bg-neutral-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <div>
                          <div className="font-semibold text-neutral-200">{opt.label}</div>
                          <div className="text-[11px] font-mono text-neutral-500">key: {opt.key}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-500 font-mono bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded">
                          Order: {opt.sort_order}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteOption(opt.id)}
                          className="p-1 text-neutral-500 hover:text-rose-400 transition-colors rounded"
                          title="Remove option"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
              )}
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

          {/* Theme & Appearance Configuration */}
          <div className="border-t border-neutral-800 pt-4">
            <div className="text-xs font-semibold text-neutral-300 mb-1">Interface Appearance & Theme</div>
            <p className="text-[11px] text-neutral-400 mb-3">
              Switch between Light Mode and Dark Mode. You can also toggle this at any time using the Sun/Moon icon in the top header.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'border-amber-400 bg-amber-400/10 ring-1 ring-amber-400 shadow-sm'
                    : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                }`}
              >
                <div className="h-9 w-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-xs">
                  <Sun className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-100 flex items-center gap-1.5">
                    <span>Light Mode</span>
                    {theme === 'light' && (
                      <span className="text-[10px] bg-amber-400 text-neutral-950 font-bold px-1.5 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Crisp, clean daytime studio palette
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'border-amber-400 bg-amber-400/10 ring-1 ring-amber-400 shadow-sm'
                    : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                }`}
              >
                <div className="h-9 w-9 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center text-amber-400 shrink-0">
                  <Moon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-100 flex items-center gap-1.5">
                    <span>Dark Mode</span>
                    {theme === 'dark' && (
                      <span className="text-[10px] bg-amber-400 text-neutral-950 font-bold px-1.5 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Cinematic dark workspace
                  </div>
                </div>
              </button>
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

      {/* Change Password Modal */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-100">Set Account Password</h3>
                  <p className="text-[11px] text-neutral-400">For {passwordModalUser.full_name} ({passwordModalUser.email})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPasswordModalUser(null)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveUserPassword} className="space-y-4">
              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">New Password</label>
                <input
                  type="text"
                  required
                  value={newPasswordValue}
                  onChange={(e) => setNewPasswordValue(e.target.value)}
                  placeholder="Enter new password (min 4 characters)"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 font-mono focus:border-amber-400 focus:outline-hidden"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Enter a secure password for this account (minimum 4 characters).
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-3.5 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword || !newPasswordValue.trim()}
                  className="rounded-lg bg-amber-400 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-300 disabled:opacity-50 transition-colors"
                >
                  {isSavingPassword ? 'Saving Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-xl border border-rose-800/80 bg-neutral-900 p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-neutral-100">Permanently Delete User Account?</h3>
                <p className="mt-1 text-xs text-neutral-400">
                  Are you sure you want to delete <strong className="text-neutral-200">{userToDelete.full_name}</strong> (<span className="font-mono text-neutral-400">{userToDelete.email}</span>)?
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs space-y-2">
              <div className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">Cascade Deletion Summary:</div>
              <ul className="space-y-1 text-neutral-400 text-[11px] list-disc list-inside">
                <li>User profile and login credentials permanently erased</li>
                <li>Unassigned from all active and completed tasks</li>
                <li>Unassigned from deliverables and content pipeline items</li>
                <li>Unassigned from projects & brand client contacts</li>
                <li>Removed from internal team workload summaries on Dashboard</li>
              </ul>
            </div>

            <div className="mt-3 p-2.5 rounded-lg border border-rose-900/40 bg-rose-950/30 text-[11px] text-rose-300 flex items-center justify-between gap-2">
              <span>
                💡 Run <strong>Cascade User Deletion SQL</strong> in Supabase to sync foreign keys in the cloud.
              </span>
              {role === 'super_admin' && (
                <button
                  type="button"
                  onClick={() => {
                    setUserToDelete(null);
                    onOpenDbModal();
                  }}
                  className="underline font-semibold hover:text-white shrink-0"
                >
                  View SQL
                </button>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={() => setUserToDelete(null)}
                className="rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingUser}
                onClick={handleConfirmDeleteUser}
                className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingUser ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
