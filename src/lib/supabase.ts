import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration keys stored in localStorage for user convenience
const LS_URL_KEY = 'zerohub_supabase_url';
const LS_KEY_KEY = 'zerohub_supabase_anon_key';

export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(LS_URL_KEY) || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY_KEY) || '' : '';

  return {
    url: localUrl || envUrl,
    anonKey: localKey || envKey,
  };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LS_URL_KEY, url.trim());
    localStorage.setItem(LS_KEY_KEY, anonKey.trim());
  }
}

export function clearStoredSupabaseConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LS_URL_KEY);
    localStorage.removeItem(LS_KEY_KEY);
  }
}

let supabaseInstance: SupabaseClient | null = null;
let currentUrl: string = '';
let currentKey: string = '';

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();

  if (!url || !anonKey) {
    return null;
  }

  if (supabaseInstance && currentUrl === url && currentKey === anonKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    currentUrl = url;
    currentKey = anonKey;
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  if (!url || !anonKey) {
    return { success: false, message: 'URL and Anon Key are required.' };
  }

  try {
    const testClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
    
    // Quick test query against public schema or auth health
    const { error } = await testClient.from('profiles').select('id').limit(1);
    
    if (error) {
      // If table doesn't exist yet, it still validated the credentials and reached the Supabase instance
      if (error.code === '42P01' || error.message.includes('relation "profiles" does not exist')) {
        return {
          success: true,
          message: 'Connected to Supabase! (The "profiles" table is not created yet; run the SQL migration script).',
        };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Successfully connected and verified database tables.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to connect to Supabase.' };
  }
}
