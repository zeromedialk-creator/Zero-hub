import React, { useState } from 'react';
import {
  Film,
  Download,
  ExternalLink,
  Play,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Eye,
  Maximize2,
} from 'lucide-react';

interface MediaViewerProps {
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  title?: string;
  versionNumber?: number;
  thumbnailUrl?: string;
  notes?: string;
  aspectRatioClass?: string;
}

export const isVideoMedia = (url?: string, name?: string, type?: string): boolean => {
  if (!url && !name && !type) return false;
  const str = `${url || ''} ${name || ''} ${type || ''}`.toLowerCase();
  return (
    str.includes('.mp4') ||
    str.includes('.mov') ||
    str.includes('.webm') ||
    str.includes('.m4v') ||
    str.includes('.mkv') ||
    str.includes('video/') ||
    str.includes('youtube.com') ||
    str.includes('youtu.be') ||
    str.includes('vimeo.com')
  );
};

export const isImageMedia = (url?: string, name?: string, type?: string): boolean => {
  if (!url && !name && !type) return false;
  const str = `${url || ''} ${name || ''} ${type || ''}`.toLowerCase();
  return (
    str.includes('.jpg') ||
    str.includes('.jpeg') ||
    str.includes('.png') ||
    str.includes('.webp') ||
    str.includes('.gif') ||
    str.includes('.svg') ||
    str.includes('image/')
  );
};

export const MediaViewer: React.FC<MediaViewerProps> = ({
  fileUrl,
  fileName,
  fileType,
  title,
  versionNumber,
  thumbnailUrl,
  notes,
  aspectRatioClass = 'aspect-video sm:aspect-16/9',
}) => {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const effectiveUrl = fileUrl || thumbnailUrl;
  const isVideo = isVideoMedia(effectiveUrl, fileName, fileType);
  const isImage = !isVideo && (isImageMedia(effectiveUrl, fileName, fileType) || !!thumbnailUrl);

  const isExternalEmbed =
    effectiveUrl &&
    (effectiveUrl.includes('drive.google.com') ||
      effectiveUrl.includes('dropbox.com') ||
      effectiveUrl.includes('loom.com') ||
      effectiveUrl.includes('frame.io') ||
      effectiveUrl.includes('figma.com'));

  if (!effectiveUrl) {
    return (
      <div
        className={`w-full ${aspectRatioClass} rounded-xl border border-dashed border-neutral-800 bg-neutral-950 flex flex-col items-center justify-center p-6 text-center space-y-2`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-neutral-600 border border-neutral-800">
          <Film className="h-6 w-6" />
        </div>
        <div className="text-xs font-semibold text-neutral-300">
          No Media File Attached
        </div>
        <p className="text-[11px] text-neutral-500 max-w-xs">
          Creative team has not uploaded an asset file for this version yet.
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden shadow-inner group">
      {/* Top Banner overlay info */}
      <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 flex-wrap pointer-events-none">
        {versionNumber && (
          <span className="rounded-md bg-neutral-950/85 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400 border border-amber-400/30 backdrop-blur-md shadow-sm">
            V{versionNumber} Master
          </span>
        )}
        {isVideo && (
          <span className="rounded-md bg-neutral-950/85 px-2 py-0.5 text-[10px] font-semibold text-sky-400 border border-sky-400/30 backdrop-blur-md flex items-center gap-1 shadow-sm">
            <Film className="h-3 w-3" />
            <span>Video Deliverable</span>
          </span>
        )}
        {isImage && (
          <span className="rounded-md bg-neutral-950/85 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-400/30 backdrop-blur-md flex items-center gap-1 shadow-sm">
            <ImageIcon className="h-3 w-3" />
            <span>Static Asset</span>
          </span>
        )}
      </div>

      {/* Top Right Quick Actions */}
      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
        <a
          href={effectiveUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800 p-1.5 text-neutral-300 hover:text-white backdrop-blur-md transition-colors"
          title="Open in new window / full screen"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <a
          href={effectiveUrl}
          download={fileName || `deliverable_v${versionNumber || 1}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-amber-400 hover:bg-amber-300 p-1.5 text-neutral-950 transition-colors shadow-sm"
          title="Download master file"
        >
          <Download className="h-3.5 w-3.5 stroke-[2.5]" />
        </a>
      </div>

      {/* Visual Canvas */}
      <div className={`relative w-full ${aspectRatioClass} bg-neutral-950 flex items-center justify-center overflow-hidden`}>
        {isVideo && !videoError ? (
          <video
            key={effectiveUrl}
            src={effectiveUrl}
            controls
            playsInline
            preload="metadata"
            poster={thumbnailUrl}
            onError={() => setVideoError(true)}
            className="w-full h-full max-h-full max-w-full object-contain bg-black"
          >
            Your browser does not support the video tag.
          </video>
        ) : isImage && !imageError ? (
          <img
            key={effectiveUrl}
            src={effectiveUrl}
            alt={title || fileName || 'Deliverable Asset'}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full max-h-full max-w-full object-contain"
          />
        ) : isExternalEmbed ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-neutral-900/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <ExternalLink className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-neutral-200">
                Cloud Vault Hosted Asset
              </div>
              <p className="text-[11px] text-neutral-400 max-w-md">
                This version is hosted on external cloud storage. Click below to inspect the high-resolution master asset.
              </p>
            </div>
            <a
              href={effectiveUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors shadow-sm"
            >
              <span>Open Master in Cloud Viewer</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : (
          /* General file representation fallback */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-neutral-900/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-800 text-amber-400 border border-neutral-700">
              {isVideo ? <Film className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
            </div>
            <div className="space-y-1">
              <div className="text-xs font-semibold text-neutral-200">
                {fileName || 'Deliverable Version Asset'}
              </div>
              <p className="text-[11px] font-mono text-neutral-500 max-w-sm truncate">
                {effectiveUrl}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={effectiveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:text-white hover:bg-neutral-700 transition-colors"
              >
                <Eye className="h-3.5 w-3.5 text-amber-400" />
                <span>Open File</span>
              </a>
              <a
                href={effectiveUrl}
                download={fileName || 'asset'}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar: File name, Notes & Metadata */}
      {(fileName || notes) && (
        <div className="p-3 bg-neutral-950 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="min-w-0">
            {fileName && (
              <div className="font-semibold text-neutral-200 truncate flex items-center gap-1.5">
                <span className="text-neutral-400 text-[11px]">File:</span>
                <span className="font-mono text-xs text-neutral-200 truncate">{fileName}</span>
              </div>
            )}
            {notes && (
              <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                <span className="text-amber-400/90 font-medium">Release Notes:</span> {notes}
              </div>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <a
              href={effectiveUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Direct Link</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
