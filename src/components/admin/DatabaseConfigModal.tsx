import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getStoredDbConfig,
  saveStoredDbConfig,
  clearStoredDbConfig,
  testDbConnection,
} from '../../lib/database';
import {
  DATABASE_MIGRATION_SQL,
  CLIENT_USERS_LINKAGE_MIGRATION_SQL,
  DATABASE_RLS_FIX_SQL,
  USER_CREATION_PROFILES_FIX_SQL,
  SUPABASE_AUTH_AND_PASSWORD_SETUP_SQL,
  SUPABASE_CASCADE_USER_DELETE_SQL,
  CONTENT_IDEA_STAGE_MIGRATION_SQL,
  CONTENT_PLATFORMS_MULTI_SELECT_MIGRATION_SQL,
  PROJECT_DELIVERABLE_TARGETS_MIGRATION_SQL,
} from '../../lib/schemaSql';
import { Check, Copy, Database, RefreshCw, Shield, AlertCircle, X, Unlock, Key, Trash2, Sparkles, Share2, Target } from 'lucide-react';

interface DatabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'project_targets' | 'platforms_multi' | 'idea_stage' | 'user_delete' | 'auth_pass' | 'user_fix' | 'rls_fix' | 'client_link' | 'full';
}

export const DatabaseConfigModal: React.FC<DatabaseConfigModalProps> = ({ isOpen, onClose, initialMode }) => {
  const { role } = useAuth();
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [activeTab, setActiveTab] = useState<'config' | 'sql'>('config');
  const [sqlMode, setSqlMode] = useState<'project_targets' | 'platforms_multi' | 'idea_stage' | 'user_delete' | 'auth_pass' | 'user_fix' | 'rls_fix' | 'client_link' | 'full'>(initialMode || 'project_targets');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; rlsWarning?: boolean } | null>(null);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const config = getStoredDbConfig();
      setUrl(config.url);
      setAnonKey(config.anonKey);
      setTestResult(null);
      if (initialMode) {
        setSqlMode(initialMode);
        setActiveTab('sql');
      }
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredDbConfig(url, anonKey);
    handleTest();
  };

  const handleClear = () => {
    clearStoredDbConfig();
    setUrl('');
    setAnonKey('');
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testDbConnection(url, anonKey);
    setTestResult(result);
    setTesting(false);
  };

  const getSqlToCopy = () => {
    if (sqlMode === 'project_targets') return PROJECT_DELIVERABLE_TARGETS_MIGRATION_SQL;
    if (sqlMode === 'platforms_multi') return CONTENT_PLATFORMS_MULTI_SELECT_MIGRATION_SQL;
    if (sqlMode === 'idea_stage') return CONTENT_IDEA_STAGE_MIGRATION_SQL;
    if (sqlMode === 'user_delete') return SUPABASE_CASCADE_USER_DELETE_SQL;
    if (sqlMode === 'auth_pass') return SUPABASE_AUTH_AND_PASSWORD_SETUP_SQL;
    if (sqlMode === 'user_fix') return USER_CREATION_PROFILES_FIX_SQL;
    if (sqlMode === 'rls_fix') return DATABASE_RLS_FIX_SQL;
    if (sqlMode === 'client_link') return CLIENT_USERS_LINKAGE_MIGRATION_SQL;
    return DATABASE_MIGRATION_SQL;
  };

  const handleCopySql = () => {
    const textToCopy = getSqlToCopy();
    navigator.clipboard.writeText(textToCopy);
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
              <h2 className="text-sm sm:text-base font-semibold text-neutral-100 truncate">Cloud Database & Authentication</h2>
              <p className="text-xs text-neutral-400 truncate">PostgreSQL connection, storage, and Row-Level Security (RLS)</p>
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
                  Cloud Database Architecture
                </div>
                <p>
                  Zero Hub connects to your PostgreSQL database using the secure public API key with Row Level Security (RLS) enforcement.
                  Your service-role key is never requested or stored.
                </p>
                <div className="text-neutral-400 pt-1">
                  1. Go to your <span className="text-emerald-400 font-mono">Cloud Database Console &gt; Project Settings &gt; API</span>.
                  <br />
                  2. Copy your <strong>Project URL</strong> and <strong>Public API Key</strong> below.
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Database Project URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://xyzcompany.db.co"
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs font-mono text-neutral-100 placeholder-neutral-600 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Database Public API Key
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Mode Selector */}
                <div className="flex flex-wrap items-center gap-1.5 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setSqlMode('project_targets')}
                    className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                      sqlMode === 'project_targets'
                        ? 'bg-amber-400 text-neutral-950 font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Target className="h-3 w-3" />
                    <span>Project Targets SQL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSqlMode('platforms_multi')}
                    className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                      sqlMode === 'platforms_multi'
                        ? 'bg-amber-400 text-neutral-950 font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Share2 className="h-3 w-3" />
                    <span>Multi-Platform SQL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSqlMode('idea_stage')}
                    className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                      sqlMode === 'idea_stage'
                        ? 'bg-amber-400 text-neutral-950 font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Content "Idea" Step SQL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSqlMode('user_delete')}
                    className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                      sqlMode === 'user_delete'
                        ? 'bg-rose-500 text-neutral-950 font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Cascade User Deletion</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSqlMode('auth_pass')}
                    className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                      sqlMode === 'auth_pass'
                        ? 'bg-amber-400 text-neutral-950 font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Key className="h-3 w-3" />
                    <span>Auth & Passwords (SQL)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSqlMode('user_fix')}
                    className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                      sqlMode === 'user_fix'
                        ? 'bg-amber-400 text-neutral-950 font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Shield className="h-3 w-3" />
                    <span>User Profiles Fix</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSqlMode('rls_fix')}
                    className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                      sqlMode === 'rls_fix'
                        ? 'bg-emerald-500 text-neutral-950 font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Unlock className="h-3 w-3" />
                    <span>RLS Fix (Unlock Data)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSqlMode('client_link')}
                    className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                      sqlMode === 'client_link'
                        ? 'bg-purple-500 text-neutral-950 font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Client Linkage SQL
                  </button>
                  <button
                    type="button"
                    onClick={() => setSqlMode('full')}
                    className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                      sqlMode === 'full'
                        ? 'bg-blue-500 text-neutral-950 font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Full Database Schema
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>
                        {sqlMode === 'project_targets' && 'Copy Project Targets Migration SQL'}
                        {sqlMode === 'platforms_multi' && 'Copy Multi-Platform Migration SQL'}
                        {sqlMode === 'idea_stage' && 'Copy Idea Stage Migration SQL'}
                        {sqlMode === 'user_delete' && 'Copy User Cascade Deletion SQL'}
                        {sqlMode === 'auth_pass' && 'Copy Auth & Passwords SQL'}
                        {sqlMode === 'user_fix' && 'Copy User Creation Fix SQL'}
                        {sqlMode === 'rls_fix' && 'Copy RLS Unlock SQL'}
                        {sqlMode === 'client_link' && 'Copy Client Linkage SQL'}
                        {sqlMode === 'full' && 'Copy Full SQL'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs text-neutral-400">
                {sqlMode === 'project_targets' && (
                  <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg text-amber-300 space-y-1.5">
                    <p className="font-semibold text-amber-200 flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-amber-400" />
                      Project Deliverable Targets Migration SQL (One-Time Projects & Retainers):
                    </p>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      Run this in your <strong>Supabase Dashboard &rarr; SQL Editor &rarr; New Query &rarr; Run</strong>.
                      This ensures the <code className="text-amber-300 font-mono">deliverable_targets JSONB</code> and <code className="text-amber-300 font-mono">project_type</code> columns exist on <code className="text-amber-300 font-mono">public.projects</code>, creates GIN indexes for JSON querying, disables restrictive RLS, and adds projects to Realtime live sync.
                    </p>
                  </div>
                )}
                {sqlMode === 'idea_stage' && (
                  <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-lg text-amber-300 space-y-1.5">
                    <p className="font-semibold text-amber-200 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      Content Deliverable "Idea" Step Migration SQL:
                    </p>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      Run this in your <strong>Supabase Dashboard &rarr; SQL Editor &rarr; New Query &rarr; Run</strong>.
                      This ensures the <code className="text-amber-300 font-mono">content_status</code> ENUM includes <code className="text-amber-300 font-mono">'idea'</code>, sets the default column status on <code className="text-amber-300 font-mono">content_items</code> to <code className="text-amber-300 font-mono">'idea'</code>, and ensures all RLS policies permit saving and updating deliverables at the Idea stage.
                    </p>
                  </div>
                )}
                {sqlMode === 'user_delete' && (
                  <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-lg text-rose-300 space-y-1.5">
                    <p className="font-semibold text-rose-200 flex items-center gap-1.5">
                      <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                      Permanent User Deletion, Auto Cascade & Unassign SQL:
                    </p>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      Run this in your <strong>Supabase Dashboard &rarr; SQL Editor &rarr; New Query &rarr; Run</strong>.
                      This creates the server-side procedure <code className="text-rose-300 font-mono">delete_user_cascade</code>, configures
                      foreign keys with <code className="text-rose-300 font-mono">ON DELETE SET NULL / CASCADE</code>, unblocks RLS deletion,
                      and unassigns the deleted user from all tasks, deliverables, projects, and dashboards so they <strong>never reappear</strong>.
                    </p>
                  </div>
                )}
                {sqlMode === 'user_fix' && (
                  <div className="p-3 bg-amber-950/30 border border-amber-500/20 rounded-lg text-amber-300 space-y-1">
                    <p className="font-semibold text-amber-200 flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-amber-400" />
                      Fix Saved Users Disappearing (Drop auth.users foreign key constraint):
                    </p>
                    <p className="text-[11px] text-neutral-300">
                      If newly created users from Admin Settings disappear after saving or refreshing, run this in your <strong>Supabase Dashboard &rarr; SQL Editor &rarr; New Query &rarr; Run</strong>. It unlinks <code className="text-amber-400 font-mono">public.profiles</code> from <code className="text-amber-400 font-mono">auth.users(id)</code>, sets default UUID generation, and disables restrictive RLS policies so created users persist permanently in Supabase.
                    </p>
                  </div>
                )}
                {sqlMode === 'rls_fix' && (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-lg text-emerald-300 space-y-1">
                    <p className="font-semibold text-emerald-200 flex items-center gap-1.5">
                      <Unlock className="h-3.5 w-3.5" />
                      Instantly Unlock Data from Supabase Tables:
                    </p>
                    <p className="text-[11px] text-neutral-300">
                      If you see data in Supabase tables but the app shows 0 rows, copy this script, open your <strong>Supabase Dashboard &rarr; SQL Editor &rarr; New Query</strong>, paste and click <strong>Run</strong>. This immediately grants read and write permissions to the web app.
                    </p>
                  </div>
                )}
                {sqlMode === 'client_link' && (
                  <span>
                    Executes the <code className="text-purple-400 font-mono">client_users</code> table creation, fast lookup indexes, RLS policies, and realtime publications to interconnect client users to companies.
                  </span>
                )}
                {sqlMode === 'full' && (
                  <span>
                    Full PostgreSQL schema including profiles, clients, client_users, projects, monthly cycles, content pipeline, and security roles.
                  </span>
                )}
              </div>

              <div className="relative max-h-96 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-950 p-4 font-mono text-[11px] leading-relaxed text-neutral-300">
                <pre>{getSqlToCopy()}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
