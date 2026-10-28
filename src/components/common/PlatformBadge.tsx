import React from 'react';
import { Platform } from '../../types/database';
import { Instagram, Video, Share2, Globe, Hash, Pin, Layers } from 'lucide-react';

export function formatPlatformName(platform?: string | null): string {
  if (!platform) return 'Other';
  const norm = platform.toLowerCase().trim();
  switch (norm) {
    case 'instagram':
      return 'Instagram';
    case 'tiktok':
      return 'TikTok';
    case 'youtube':
      return 'YouTube';
    case 'facebook':
      return 'Facebook';
    case 'linkedin':
      return 'LinkedIn';
    case 'twitter':
    case 'x':
    case 'x_twitter':
      return 'X / Twitter';
    case 'pinterest':
      return 'Pinterest';
    case 'other':
      return 'Other';
    default:
      return platform.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export function getPlatformBadgeStyle(platform?: string | null): {
  badge: string;
  text: string;
  border: string;
  bg: string;
  dot: string;
  accent: string;
} {
  const norm = (platform || '').toLowerCase().trim();
  switch (norm) {
    case 'instagram':
      return {
        badge: 'bg-pink-500/10 text-pink-400 border-pink-500/25',
        text: 'text-pink-400',
        border: 'border-pink-500/30',
        bg: 'bg-pink-500/10',
        dot: 'bg-pink-500',
        accent: '#ec4899',
      };
    case 'tiktok':
      return {
        badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25',
        text: 'text-cyan-300',
        border: 'border-cyan-500/30',
        bg: 'bg-cyan-500/10',
        dot: 'bg-cyan-400',
        accent: '#06b6d4',
      };
    case 'youtube':
      return {
        badge: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
        bg: 'bg-rose-500/10',
        dot: 'bg-rose-500',
        accent: '#f43f5e',
      };
    case 'facebook':
      return {
        badge: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
        bg: 'bg-blue-500/10',
        dot: 'bg-blue-500',
        accent: '#3b82f6',
      };
    case 'linkedin':
      return {
        badge: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
        text: 'text-sky-400',
        border: 'border-sky-500/30',
        bg: 'bg-sky-500/10',
        dot: 'bg-sky-500',
        accent: '#0284c7',
      };
    case 'twitter':
    case 'x':
    case 'x_twitter':
      return {
        badge: 'bg-neutral-500/10 text-neutral-300 border-neutral-600/30',
        text: 'text-neutral-300',
        border: 'border-neutral-600/40',
        bg: 'bg-neutral-500/10',
        dot: 'bg-neutral-400',
        accent: '#a3a3a3',
      };
    case 'pinterest':
      return {
        badge: 'bg-red-500/10 text-red-400 border-red-500/25',
        text: 'text-red-400',
        border: 'border-red-500/30',
        bg: 'bg-red-500/10',
        dot: 'bg-red-500',
        accent: '#ef4444',
      };
    default:
      return {
        badge: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
        text: 'text-amber-300',
        border: 'border-amber-500/30',
        bg: 'bg-amber-500/10',
        dot: 'bg-amber-400',
        accent: '#f59e0b',
      };
  }
}

export const PlatformBadge: React.FC<{
  platform: Platform | string;
  isPrimary?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  showIcon?: boolean;
}> = ({ platform, isPrimary = false, size = 'sm', className = '', showIcon = true }) => {
  const style = getPlatformBadgeStyle(platform);
  const name = formatPlatformName(platform);

  const sizeClasses = {
    xs: 'px-1.5 py-0.2 text-[9px] gap-1',
    sm: 'px-2 py-0.5 text-[10px] gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  }[size];

  const iconSize = size === 'xs' ? 'h-2.5 w-2.5' : size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  const renderIcon = () => {
    if (!showIcon) return null;
    const norm = platform.toLowerCase().trim();
    if (norm === 'instagram') return <Instagram className={iconSize} />;
    if (norm === 'youtube' || norm === 'tiktok') return <Video className={iconSize} />;
    if (norm === 'pinterest') return <Pin className={iconSize} />;
    if (norm === 'twitter' || norm === 'x') return <Hash className={iconSize} />;
    if (norm === 'facebook' || norm === 'linkedin') return <Share2 className={iconSize} />;
    return <Globe className={iconSize} />;
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded border tracking-wide uppercase transition-colors shrink-0 ${style.badge} ${sizeClasses} ${className}`}
    >
      {renderIcon()}
      <span>{name}</span>
      {isPrimary && (
        <span
          className="text-[8px] font-mono uppercase px-1 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold ml-0.5"
          title="Primary distribution channel"
        >
          Primary
        </span>
      )}
    </span>
  );
};

export const PlatformListBadges: React.FC<{
  platforms?: (Platform | string)[];
  platform?: Platform | string;
  maxDisplay?: number;
  size?: 'xs' | 'sm';
  className?: string;
}> = ({ platforms, platform, maxDisplay = 2, size = 'xs', className = '' }) => {
  const effectivePlatforms: (Platform | string)[] =
    Array.isArray(platforms) && platforms.length > 0
      ? platforms
      : platform
      ? [platform]
      : ['instagram'];

  const visible = effectivePlatforms.slice(0, maxDisplay);
  const extraCount = effectivePlatforms.length - maxDisplay;

  return (
    <div className={`flex items-center gap-1 flex-wrap ${className}`}>
      {visible.map((p, idx) => (
        <PlatformBadge key={`${p}_${idx}`} platform={p} size={size} />
      ))}
      {extraCount > 0 && (
        <span
          className="inline-flex items-center gap-0.5 rounded border border-neutral-700 bg-neutral-800/80 px-1.5 py-0.2 text-[9px] font-mono text-neutral-300 font-medium"
          title={`Also releasing on: ${effectivePlatforms.slice(maxDisplay).map(formatPlatformName).join(', ')}`}
        >
          <Layers className="h-2.5 w-2.5 text-amber-400" />
          <span>+{extraCount}</span>
        </span>
      )}
    </div>
  );
};
