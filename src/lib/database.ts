import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration keys stored in localStorage for user convenience
const LS_URL_KEY = 'zerohub_db_url';
const LS_KEY_KEY = 'zerohub_db_anon_key';
const LEGACY_URL_KEY = 'zerohub_supabase_url';
const LEGACY_KEY_KEY = 'zerohub_supabase_anon_key';

export function getStoredDbConfig(): { url: string; anonKey: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined'
    ? localStorage.getItem(LS_URL_KEY) || localStorage.getItem(LEGACY_URL_KEY) || ''
    : '';
  const localKey = typeof window !== 'undefined'
    ? localStorage.getItem(LS_KEY_KEY) || localStorage.getItem(LEGACY_KEY_KEY) || ''
    : '';

  return {
    url: localUrl || envUrl,
    anonKey: localKey || envKey,
  };
}

export function saveStoredDbConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LS_URL_KEY, url.trim());
    localStorage.setItem(LS_KEY_KEY, anonKey.trim());
  }
}

export function clearStoredDbConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LS_URL_KEY);
    localStorage.removeItem(LS_KEY_KEY);
    localStorage.removeItem(LEGACY_URL_KEY);
    localStorage.removeItem(LEGACY_KEY_KEY);
  }
}

let dbInstance: SupabaseClient | null = null;
let currentUrl: string = '';
let currentKey: string = '';

export function getDbClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredDbConfig();

  if (!url || !anonKey) {
    return null;
  }

  if (dbInstance && currentUrl === url && currentKey === anonKey) {
    return dbInstance;
  }

  try {
    dbInstance = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    currentUrl = url;
    currentKey = anonKey;
    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize database client:', error);
    return null;
  }
}

export async function testDbConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string; rlsWarning?: boolean }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL and API Key are required.' };
  }

  try {
    const testClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
    
    // Quick test query against public schema
    const { data: profData, error: profErr } = await testClient.from('profiles').select('id').limit(1);
    
    if (profErr) {
      if (profErr.code === '42P01' || profErr.message.includes('relation "profiles" does not exist')) {
        return {
          success: true,
          message: 'Connected to Supabase! The "profiles" table is not created yet; run the SQL schema in your Supabase SQL editor.',
        };
      }
      if (profErr.code === '42501' || profErr.message.toLowerCase().includes('permission denied') || profErr.message.toLowerCase().includes('policy')) {
        return {
          success: false,
          rlsWarning: true,
          message: `Connected, but Row Level Security (RLS) is blocking read access: "${profErr.message}". Run the RLS Fix SQL script in Supabase.`,
        };
      }
      return { success: false, message: profErr.message };
    }

    // Also check projects and clients
    const { data: prjData, error: prjErr } = await testClient.from('projects').select('id').limit(5);
    const { data: cliData, error: cliErr } = await testClient.from('clients').select('id').limit(5);

    let summary = 'Successfully connected to database.';
    const prjCount = prjData ? prjData.length : 0;
    const cliCount = cliData ? cliData.length : 0;
    summary += ` Verified tables: ${cliCount} client(s), ${prjCount} project(s) accessible.`;

    return { success: true, message: summary };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to connect to Database.' };
  }
}

// Aliases
export const getSupabase = getDbClient;
export const testSupabaseConnection = testDbConnection;
export const getStoredSupabaseConfig = getStoredDbConfig;
export const saveStoredSupabaseConfig = saveStoredDbConfig;
export const clearStoredSupabaseConfig = clearStoredDbConfig;
