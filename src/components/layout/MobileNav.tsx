import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { NavigationTab } from './Sidebar';
import { LayoutDashboard, Film, FolderKanban, CheckSquare, Building2, Menu } from 'lucide-react';

interface MobileNavProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentTab, onSelectTab, onOpenMenu }) => {
  const { role } = useAuth();
  const { filteredContentItems } = useData();

  const pendingReviewCount = filteredContentItems.filter((c) => c.status === 'client_review').length;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-md px-1 pt-1.5 pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] flex items-center justify-around shadow-2xl">
      {/* 1. Dashboard */}
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 min-h-[44px] text-[10px] font-medium transition-colors ${
          currentTab === 'dashboard' ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
        }`}
      >
        <LayoutDashboard className="h-4 w-4 mb-0.5 shrink-0" />
        <span className="truncate">Home</span>
      </button>

      {/* 2. Content Pipeline */}
      <button
        onClick={() => onSelectTab('content')}
        className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 min-h-[44px] text-[10px] font-medium transition-colors ${
          currentTab === 'content' ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
        }`}
      >
        <Film className="h-4 w-4 mb-0.5 shrink-0" />
        <span className="truncate">Content</span>
        {pendingReviewCount > 0 && (
          <span className="absolute top-1 right-3 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        )}
      </button>

      {/* 3. Projects */}
      <button
        onClick={() => onSelectTab('projects')}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 min-h-[44px] text-[10px] font-medium transition-colors ${
          currentTab === 'projects' ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
        }`}
      >
        <FolderKanban className="h-4 w-4 mb-0.5 shrink-0" />
        <span className="truncate">Projects</span>
      </button>

      {/* 4. Tasks or Client Profile */}
      {role === 'client' ? (
        <button
          onClick={() => onSelectTab('clients')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 min-h-[44px] text-[10px] font-medium transition-colors ${
            currentTab === 'clients' ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Building2 className="h-4 w-4 mb-0.5 shrink-0" />
          <span className="truncate">Profile</span>
        </button>
      ) : (
        <button
          onClick={() => onSelectTab('tasks')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 min-h-[44px] text-[10px] font-medium transition-colors ${
            currentTab === 'tasks' ? 'text-amber-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <CheckSquare className="h-4 w-4 mb-0.5 shrink-0" />
          <span className="truncate">Tasks</span>
        </button>
      )}

      {/* 5. More Menu button */}
      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center flex-1 py-1 px-1 min-h-[44px] text-[10px] font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
      >
        <Menu className="h-4 w-4 mb-0.5 shrink-0" />
        <span className="truncate">More</span>
      </button>
    </nav>
  );
};
