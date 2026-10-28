import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatRoleTitle } from '../../types/database';
import {
  Bell,
  Search,
  Database,
  UserCheck,
  ChevronDown,
  LogOut,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Menu,
  X,
} from 'lucide-react';
import { ThemeToggle } from '../common/ThemeToggle';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenDbModal: () => void;
  onSelectContent?: (id: string) => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenDbModal,
  onSelectContent,
  onToggleMobileMenu,
  isMobileMenuOpen,
}) => {
  const { currentUser, role, signOut, isLiveDb } = useAuth();
  const { filteredNotifications, markNotificationAsRead, markAllNotificationsAsRead, isSaving } = useData();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const unreadNotifications = filteredNotifications.filter((n) => !n.read);

  const formatRoleName = (r?: string | null) => formatRoleTitle(r);

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-neutral-800/80 bg-neutral-950/90 px-3 md:px-6 backdrop-blur-md">
      {/* Zone 1: Single text element Brand Title + Mobile Menu Trigger */}
      <div className="flex items-center gap-2 sm:gap-6">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <a href="#dashboard" className="font-display text-lg font-extrabold tracking-tight text-neutral-100 hover:text-white transition-colors">
          Zero Hub
        </a>

        {/* Global Search trigger (Desktop) */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-1.5 text-xs text-neutral-400 hover:border-neutral-700 hover:text-neutral-200 transition-colors"
        >
          <Search className="h-3.5 w-3.5 text-neutral-500" />
          <span>Quick search...</span>
          <kbd className="rounded border border-neutral-800 bg-neutral-950 px-1.5 py-0.5 font-mono text-[10px] text-neutral-500">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Zone 2: Database connection badge & saving state */}
      <div className="flex items-center gap-2">
        {isSaving && (
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
            <span className="hidden sm:inline">Saving changes...</span>
            <span className="sm:hidden">Saving...</span>
          </div>
        )}

        {role === 'super_admin' && (
          <button
            onClick={onOpenDbModal}
            className={`flex items-center gap-1.5 rounded-lg border px-2 sm:px-2.5 py-1 text-xs font-medium transition-colors ${
              isLiveDb
                ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-950/60'
                : 'border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:border-neutral-700'
            }`}
            title="Configure Cloud Database & Connection"
          >
            <Database className={`h-3 w-3 ${isLiveDb ? 'text-emerald-400' : 'text-neutral-400'}`} />
            <span className="hidden sm:inline">
              {isLiveDb ? 'Database Live' : 'Database Config'}
            </span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isLiveDb ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>
        )}
      </div>

      {/* Zone 3: Mobile Search, Notifications & Persona Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          className="md:hidden rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 transition-colors"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Theme Mode Toggle (Sun/Moon icon) */}
        <ThemeToggle variant="icon" />

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="relative rounded-lg p-2 text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] rounded-xl border border-neutral-800 bg-neutral-900 p-2 shadow-2xl z-50">
              <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2">
                <span className="text-xs font-semibold text-neutral-200">
                  Notifications ({unreadNotifications.length})
                </span>
                {unreadNotifications.length > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-neutral-800/40">
                {filteredNotifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-neutral-500">No notifications yet</div>
                ) : (
                  filteredNotifications.slice(0, 6).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationAsRead(notif.id);
                        if (notif.related_content_id) {
                          onSelectContent?.(notif.related_content_id);
                          setShowNotificationMenu(false);
                        }
                      }}
                      className={`p-3 text-xs cursor-pointer hover:bg-neutral-800/60 transition-colors ${
                        !notif.read ? 'bg-neutral-800/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-neutral-200">{notif.title}</span>
                        {!notif.read && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                      </div>
                      <p className="mt-1 text-neutral-400 line-clamp-2 leading-relaxed">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Production Account & Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-2 sm:px-2.5 py-1.5 text-xs text-neutral-200 hover:border-neutral-700 transition-colors"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 font-semibold text-[11px] border border-amber-500/30">
              {currentUser?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-medium leading-none truncate max-w-[110px]">{currentUser?.full_name}</div>
              <div className="text-[10px] text-neutral-400 leading-none mt-1">
                {formatRoleName(role)}
              </div>
            </div>
            <ChevronDown className="h-3 w-3 text-neutral-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-xl border border-neutral-800 bg-neutral-900 p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* Profile Card Header */}
              <div className="flex items-center gap-3 border-b border-neutral-800/80 pb-3 mb-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-300 font-bold text-sm border border-amber-500/30">
                  {currentUser?.full_name?.charAt(0) || 'U'}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-neutral-900" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-neutral-100 truncate">
                    {currentUser?.full_name}
                  </div>
                  <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                    {currentUser?.email}
                  </div>
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 mt-1 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] font-semibold text-amber-400 capitalize">
                    {formatRoleName(role)}
                  </div>
                </div>
              </div>

              {/* Account Meta & Status */}
              <div className="space-y-2 py-1 text-xs">
                <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
                  <span>System Environment</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {isLiveDb ? 'Cloud Connected' : 'Active'}
                  </span>
                </div>
                {currentUser?.job_title && (
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
                    <span>Title</span>
                    <span className="text-neutral-300 font-medium truncate max-w-[140px]">
                      {currentUser.job_title}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1 pt-1 border-t border-neutral-800/60">
                  <span>Theme</span>
                  <ThemeToggle variant="pill" />
                </div>
              </div>

              {/* Sign Out Action */}
              <div className="border-t border-neutral-800 mt-3 pt-2">
                <button
                  onClick={() => {
                    signOut();
                    setShowProfileMenu(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/40 px-3 py-2 text-xs font-semibold text-rose-300 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
