import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'icon' | 'pill' | 'compact' | 'sidebar';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'icon', className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  if (variant === 'pill') {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className={`inline-flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900/80 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-neutral-100 hover:border-neutral-700 transition-all cursor-pointer ${className}`}
      >
        {isDark ? (
          <>
            <Sun className="h-3.5 w-3.5 text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" />
            <span className="text-[11px]">Dark Mode</span>
          </>
        ) : (
          <>
            <Moon className="h-3.5 w-3.5 text-indigo-500 transition-transform duration-200 hover:-rotate-12" />
            <span className="text-[11px]">Light Mode</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'sidebar') {
    return (
      <button
        onClick={toggleTheme}
        type="button"
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 transition-colors cursor-pointer ${className}`}
      >
        <div className="flex items-center gap-2.5">
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-600" />
          )}
          <span>Appearance</span>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-800/80 text-neutral-300">
          {isDark ? 'Dark' : 'Light'}
        </span>
      </button>
    );
  }

  // Default 'icon' button for Header top bar
  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-neutral-100 hover:border-neutral-700 hover:bg-neutral-800/60 transition-all cursor-pointer ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-90" />
      ) : (
        <Moon className="h-4 w-4 text-indigo-600 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
};
