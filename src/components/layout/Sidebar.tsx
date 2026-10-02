import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Film,
  CheckSquare,
  Calendar,
  FolderArchive,
  Activity,
  Settings,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';

export type NavigationTab =
  | 'dashboard'
  | 'clients'
  | 'projects'
  | 'content'
  | 'tasks'
  | 'calendar'
  | 'files'
  | 'activity'
  | 'settings';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { role, currentUser } = useAuth();
  const { filteredContentItems } = useData();

  // Highlight pending client reviews if there are any
  const pendingReviewCount = filteredContentItems.filter((c) => c.status === 'client_review').length;

  const navItems = [
    { id: 'dashboard' as NavigationTab, label: 'Dashboard', icon: LayoutDashboard },
    // Clients tab is visible to team members, or for clients as "My Account"
    {
      id: 'clients' as NavigationTab,
      label: role === 'client' ? 'Client Profile' : 'Clients',
      icon: Building2,
      visible: true,
    },
    { id: 'projects' as NavigationTab, label: 'Projects', icon: FolderKanban, visible: true },
    {
      id: 'content' as NavigationTab,
      label: 'Content Pipeline',
      icon: Film,
      badge: pendingReviewCount > 0 ? `${pendingReviewCount} review` : undefined,
      visible: true,
    },
    { id: 'tasks' as NavigationTab, label: 'Tasks', icon: CheckSquare, visible: role !== 'client' },
    { id: 'calendar' as NavigationTab, label: 'Calendar', icon: Calendar, visible: true },
    { id: 'files' as NavigationTab, label: 'File Vault', icon: FolderArchive, visible: true },
    { id: 'activity' as NavigationTab, label: 'Activity Log', icon: Activity, visible: role !== 'client' },
    {
      id: 'settings' as NavigationTab,
      label: 'Admin Settings',
      icon: Settings,
      visible: role === 'super_admin' || role === 'project_manager',
    },
  ];

  const renderNavContent = () => (
    <>
      {/* Brand Sub-header */}
      <div>
        <div className="px-5 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-amber-400 rounded-full" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
                Zero Media
              </div>
              <div className="text-[11px] text-neutral-500">Internal Workspace</div>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              aria-label="Close navigation drawer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="space-y-0.5 px-3">
          {navItems
            .filter((item) => item.visible !== false)
            .map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-neutral-900 text-amber-300 font-semibold border-l-2 border-amber-400 pl-2.5'
                      : 'text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-amber-400' : 'text-neutral-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono text-amber-400 font-semibold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </nav>
      </div>

      {/* Footer system notice */}
      <div className="px-4">
        <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/40 p-3 text-[11px]">
          <div className="flex items-center gap-1.5 text-neutral-300 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Zero Hub Cloud</span>
          </div>
          <p className="mt-1 text-neutral-500 text-[10px] leading-relaxed">
            {role === 'super_admin'
              ? 'Role-Based Access Active · Supabase Postgres RLS'
              : 'Role-Based Access Active · Enterprise Secured'}
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Static Sidebar (Preserved exactly for desktop/laptop users) */}
      <aside className="hidden md:flex w-60 shrink-0 border-r border-neutral-800 bg-neutral-950 flex-col justify-between py-4">
        {renderNavContent()}
      </aside>

      {/* Mobile Off-Canvas Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onCloseMobile}
          />

          {/* Drawer Content */}
          <aside className="relative z-50 w-72 max-w-[85vw] h-full max-h-[100dvh] overflow-y-auto bg-neutral-950 border-r border-neutral-800 flex flex-col justify-between py-5 shadow-2xl animate-in slide-in-from-left duration-200 overscroll-contain">
            {renderNavContent()}
          </aside>
        </div>
      )}
    </>
  );
};
