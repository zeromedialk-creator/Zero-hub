import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { FileRecord } from '../../types/database';
import {
  FolderArchive,
  Upload,
  FileText,
  Film,
  Image as ImageIcon,
  File,
  Download,
  Trash2,
  Search,
  Filter,
  ExternalLink,
} from 'lucide-react';

export const FileManager: React.FC = () => {
  const { filteredFiles, filteredClients, filteredProjects, addFile, deleteFile } = useData();
  const { currentUser, role } = useAuth();

  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // New file form state
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('image/png');
  const [newFileSize, setNewFileSize] = useState('4.2 MB');
  const [newClientId, setNewClientId] = useState(filteredClients[0]?.id || '');
  const [newProjectId, setNewProjectId] = useState(filteredProjects[0]?.id || '');

  const files = filteredFiles.filter((f) => {
    if (selectedClient !== 'all' && f.client_id !== selectedClient) return false;
    if (selectedType !== 'all') {
      if (selectedType === 'images' && !f.file_type.includes('image')) return false;
      if (selectedType === 'videos' && !f.file_type.includes('video')) return false;
      if (selectedType === 'pdf' && !f.file_type.includes('pdf')) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return f.file_name.toLowerCase().includes(q) || f.file_path.toLowerCase().includes(q);
    }
    return true;
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <ImageIcon className="h-4 w-4 text-emerald-400" />;
    if (fileType.includes('video')) return <Film className="h-4 w-4 text-sky-400" />;
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4 text-rose-400" />;
    return <File className="h-4 w-4 text-amber-400" />;
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const client = filteredClients.find((c) => c.id === newClientId);
    const clientSlug = client?.company_name.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'agency';

    addFile({
      client_id: newClientId,
      project_id: newProjectId,
      file_name: newFileName.trim(),
      file_path: `${clientSlug}/vault/${newFileName.trim()}`,
      file_type: newFileType,
      file_size: newFileSize,
      uploaded_by: currentUser?.id || 'usr_editor_03',
    });

    setNewFileName('');
    setIsUploading(false);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-100">
            Agency File Vault
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Cloud assets organized strictly by Client → Project → Deliverable hierarchy
          </p>
        </div>

        {role !== 'client' && role !== 'viewer' && (
          <button
            onClick={() => setIsUploading(!isUploading)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3.5 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-300 transition-colors whitespace-nowrap"
          >
            <Upload className="h-4 w-4" />
            <span>Upload New Asset</span>
          </button>
        )}
      </div>

      {/* Upload Dropdown Card */}
      {isUploading && (
        <form
          onSubmit={handleUploadSubmit}
          className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 space-y-4 text-xs"
        >
          <div className="font-semibold text-neutral-200">Upload to Cloud Asset Vault</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-neutral-400 mb-1">File Name</label>
              <input
                type="text"
                required
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="e.g. Master_Color_Grade_Cut_4K.mov"
                className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Client Hierarchy</label>
              <select
                value={newClientId}
                onChange={(e) => setNewClientId(e.target.value)}
                className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
              >
                {filteredClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Asset Format</label>
              <select
                value={newFileType}
                onChange={(e) => setNewFileType(e.target.value)}
                className="w-full rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
              >
                <option value="video/mp4">Video (MP4 / MOV)</option>
                <option value="image/png">Image (PNG / JPG)</option>
                <option value="application/pdf">Document (PDF)</option>
                <option value="application/octet-stream">Asset / Project File (LUT, ZIP)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsUploading(false)}
              className="px-3 py-1.5 text-neutral-400 hover:text-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-amber-400 px-4 py-1.5 font-semibold text-neutral-950 hover:bg-amber-300"
            >
              Commit File to Storage
            </button>
          </div>
        </form>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search vault files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-56 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:border-neutral-700 focus:outline-hidden"
          />

          {role !== 'client' && (
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full sm:w-auto rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 focus:border-neutral-700 focus:outline-hidden"
            >
              <option value="all">All Client Buckets</option>
              {filteredClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 focus:border-neutral-700 focus:outline-hidden"
          >
            <option value="all">All File Types</option>
            <option value="images">Images</option>
            <option value="videos">Videos</option>
            <option value="pdf">PDFs & Briefs</option>
          </select>
        </div>

        <div className="text-[11px] font-mono text-neutral-400 tabular-nums">
          {files.length} {files.length === 1 ? 'file' : 'files'}
        </div>
      </div>

      {/* Files List / Table */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
        {/* Mobile File Cards */}
        <div className="sm:hidden divide-y divide-neutral-800/60">
          {files.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              No files found in storage.
            </div>
          ) : (
            files.map((f) => {
              const client = filteredClients.find((c) => c.id === f.client_id);
              return (
                <div key={f.id} className="p-4 space-y-2.5 hover:bg-neutral-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="mt-0.5 shrink-0">{getFileIcon(f.file_type)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-neutral-200 text-xs break-all leading-snug">
                          {f.file_name}
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5 truncate">
                          {client?.company_name || 'Agency Shared'} · {f.file_size || '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-neutral-500 truncate bg-neutral-950/60 px-2 py-1 rounded border border-neutral-800/50">
                    {f.file_path}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-800/60">
                    <a
                      href={f.file_path}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:text-amber-400 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </a>
                    {role !== 'client' && (
                      <button
                        onClick={() => deleteFile(f.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-900/40 bg-rose-950/20 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[650px]">
          <thead className="border-b border-neutral-800 bg-neutral-950/80 text-[11px] uppercase tracking-wider text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-medium">File Name</th>
              <th className="px-4 py-3 font-medium">Storage Path</th>
              <th className="px-4 py-3 font-medium">Client Bucket</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {files.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-neutral-500">
                  No files found in storage.
                </td>
              </tr>
            ) : (
              files.map((f) => {
                const client = filteredClients.find((c) => c.id === f.client_id);
                return (
                  <tr key={f.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {getFileIcon(f.file_type)}
                        <span className="font-semibold text-neutral-200">{f.file_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-neutral-400 truncate max-w-xs">
                      {f.file_path}
                    </td>
                    <td className="px-4 py-3 text-neutral-300">{client?.company_name || 'Agency Shared'}</td>
                    <td className="px-4 py-3 font-mono text-neutral-400 tabular-nums">
                      {f.file_size || '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={f.file_path}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded p-1 text-neutral-400 hover:text-amber-400 transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        {role !== 'client' && (
                          <button
                            onClick={() => deleteFile(f.id)}
                            className="rounded p-1 text-neutral-400 hover:text-rose-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};
