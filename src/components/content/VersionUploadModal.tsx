import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Upload, X, Film, Check, AlertCircle } from 'lucide-react';

interface VersionUploadModalProps {
  contentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VersionUploadModal: React.FC<VersionUploadModalProps> = ({ contentId, isOpen, onClose }) => {
  const { getContentById, contentVersions, addContentVersion, updateContentStatus } = useData();
  const { currentUser } = useAuth();

  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [notes, setNotes] = useState('');
  const [moveToClientReview, setMoveToClientReview] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen || !contentId) return null;

  const item = getContentById(contentId);
  if (!item) return null;

  const versions = contentVersions.filter((v) => v.content_id === contentId);
  const nextVerNumber = versions.length + 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!notes.trim()) {
      setFormError('Please include changelog / release notes for this version.');
      return;
    }

    const effectiveUrl = fileUrl || item.thumbnail_url || '/src/assets/images/content_fashion_reel_1790837276139.jpg';
    const effectiveFileName = fileName || `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}_V${nextVerNumber}.mp4`;

    addContentVersion(contentId, {
      file_url: effectiveUrl,
      file_name: effectiveFileName,
      notes: notes.trim(),
    });

    if (moveToClientReview) {
      updateContentStatus(contentId, 'client_review', `Version ${nextVerNumber} submitted for client approval.`);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden my-auto sm:my-6 max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 sm:px-6 py-3 sm:py-4 bg-neutral-950 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
              <Upload className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-neutral-100 truncate">Upload Version {nextVerNumber}</h2>
              <p className="text-xs text-neutral-400 truncate">{item.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs flex-1 overflow-y-auto">
          {formError && (
            <div className="rounded-lg border border-rose-800/80 bg-rose-950/40 p-2.5 text-xs text-rose-300">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              File Attachment Name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder={`e.g. ${item.title}_Master_V${nextVerNumber}.mp4`}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Media File URL / Storage Path
            </label>
            <input
              type="text"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="Leave blank to use current master or paste storage URL"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Changelog & Revision Notes (Required)
            </label>
            <textarea
              rows={3}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail changes made: color grading adjusted, typography synced, client feedback addressed..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden leading-relaxed"
            />
          </div>

          <label className="flex items-center gap-2 text-neutral-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={moveToClientReview}
              onChange={(e) => setMoveToClientReview(e.target.checked)}
              className="rounded border-neutral-700 bg-neutral-900 text-amber-400 focus:ring-0"
            />
            <span>Automatically dispatch to <strong>Client Review</strong> upon upload</span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-neutral-950 hover:bg-amber-300 transition-colors"
            >
              Upload Version {nextVerNumber}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
