import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  clearStoredSupabaseConfig,
  testSupabaseConnection,
} from '../../lib/supabase';
import { SUPABASE_MIGRATION_SQL } from '../../lib/schemaSql';
import { Check, Copy, Database, ExternalLink, RefreshCw, Shield, AlertCircle, X } from 'lucide-react';

interface SupabaseMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseMigrationModal: React.FC<SupabaseMigrationModalProps> = ({ isOpen, onClose }) => {
  const { role } = useAuth();
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [activeTab, setActiveTab] = useState<'config' | 'sql'>('config');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getStoredSupabaseConfig();
      setUrl(config.url);
      setAnonKey(config.anonKey);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen || role !== 'super_admin') return null;

  const handleSave = () => {
    saveStoredSupabaseConfig(url, anonKey);
    handleTest();
  };

  const handleClear = () => {
    clearStoredSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection(url, anonKey);
    setTestResult(result);
    setTesting(false);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_MIGRATION_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden my-auto sm:my-8 max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 sm:px-6 py-3 sm:py-4 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Database className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-neutral-100 truncate">Supabase Database & Authentication</h2>
              <p className="text-xs text-neutral-400 truncate">PostgreSQL connection, storage buckets, and RLS security</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/40 px-4 sm:px-6 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-3 text-xs font-medium transition-colors border-b-2 mr-6 ${
              activeTab === 'config'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Connection Settings
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-3 text-xs font-medium transition-colors border-b-2 ${
              activeTab === 'sql'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            PostgreSQL & RLS Schema (SQL)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {activeTab === 'config' ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-4 text-xs text-neutral-300 leading-relaxed space-y-2">
                <div className="font-semibold text-neutral-200 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  Direct Supabase Architecture
                </div>
                <p>
                  Zero Hub connects to your Supabase PostgreSQL database using the anonymous public key with Row Level Security (RLS) enforcement.
                  Your service-role key is never requested or stored.
                </p>
                <div className="text-neutral-400 pt-1">
                  1. Go to <span className="text-emerald-400 font-mono">Supabase Dashboard &gt; Project Settings &gt; API</span>.
                  <br />
                  2. Copy your <strong>Project URL</strong> and <strong>anon / public key</strong> below.
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Supabase Anon / Public Key
                  </label>
                  <input
                    type="password"
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {testResult && (
                <div
                  className={`rounded-lg border p-3 text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300'
                      : 'border-rose-800/60 bg-rose-950/30 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold">{testResult.success ? 'Connected: ' : 'Connection Failed: '}</span>
                    {testResult.message}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-neutral-400 hover:text-rose-400 transition-colors self-start sm:self-auto"
                >
                  Clear Config
                </button>
                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={testing || !url}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 sm:px-4 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} />
                    Test Connection
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex-1 sm:flex-initial rounded-lg bg-emerald-500 px-3 sm:px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-emerald-400 transition-colors text-center"
                  >
                    Save & Connect
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-neutral-400">
                  Run this SQL in your Supabase project (<strong>SQL Editor &gt; New Query</strong>) to create all required tables and RLS security.
                </div>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy SQL Schema</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative max-h-96 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950 p-4 font-mono text-[11px] leading-relaxed text-neutral-300">
                <pre>{SUPABASE_MIGRATION_SQL}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
