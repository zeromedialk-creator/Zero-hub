import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types/database';
import { INITIAL_PROFILES } from '../lib/initialData';
import { getSupabase } from '../lib/supabase';

interface AuthContextType {
  currentUser: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  switchPersona: (profileId: string) => void;
  updateCurrentUserProfile: (updates: Partial<Profile>) => void;
  availablePersonas: Profile[];
  isLiveSupabase: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LS_AUTH_USER_ID = 'zerohub_v4_auth_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveSupabase, setIsLiveSupabase] = useState<boolean>(false);

  useEffect(() => {
    // Clear all legacy demo auth keys
    try {
      localStorage.removeItem('zerohub_auth_user_id');
      localStorage.removeItem('zerohub_v2_auth_user_id');
      localStorage.removeItem('zerohub_data_profiles');
      localStorage.removeItem('zerohub_v2_data_profiles');
    } catch (e) {
      // Ignore
    }

    async function initializeAuth() {
      setIsLoading(true);
      setError(null);
      const supabase = getSupabase();

      if (supabase) {
        setIsLiveSupabase(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Fetch live profile
            const { data: profileData, error: profileErr } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileData && !profileErr) {
              setCurrentUser(profileData as Profile);
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Authentication session check', e);
        }
      } else {
        setIsLiveSupabase(false);
      }

      // Check registered profiles in v4 storage
      const storedProfilesRaw = localStorage.getItem('zerohub_v4_data_profiles');
      const storedProfiles: Profile[] = storedProfilesRaw ? JSON.parse(storedProfilesRaw) : INITIAL_PROFILES;

      const savedUserId = localStorage.getItem(LS_AUTH_USER_ID);
      const found = storedProfiles.find((p) => p.id === savedUserId) || INITIAL_PROFILES.find((p) => p.id === savedUserId);
      if (found) {
        setCurrentUser(found);
      } else {
        // Default to Super Admin account
        setCurrentUser(INITIAL_PROFILES[0]);
        localStorage.setItem(LS_AUTH_USER_ID, INITIAL_PROFILES[0].id);
      }
      setIsLoading(false);
    }

    initializeAuth();
  }, []);

  const signInWithEmail = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    const supabase = getSupabase();

    if (supabase && password) {
      try {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInErr) {
          setIsLoading(false);
          setError(signInErr.message);
          return { success: false, error: signInErr.message };
        }

        if (data.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileData) {
            setCurrentUser(profileData as Profile);
            localStorage.setItem(LS_AUTH_USER_ID, profileData.id);
            setIsLoading(false);
            return { success: true };
          }
        }
      } catch (err: any) {
        console.error('Sign in error:', err);
      }
    }

    // Local authentication lookup against registered profiles
    const normalized = email.toLowerCase().trim();
    const storedProfilesRaw = localStorage.getItem('zerohub_v4_data_profiles');
    const allProfiles: Profile[] = storedProfilesRaw ? JSON.parse(storedProfilesRaw) : INITIAL_PROFILES;
    const matched = allProfiles.find((p) => p.email.toLowerCase() === normalized) || INITIAL_PROFILES.find((p) => p.email.toLowerCase() === normalized);

    if (matched) {
      setCurrentUser(matched);
      localStorage.setItem(LS_AUTH_USER_ID, matched.id);
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    const errText = `Invalid email or password. Please verify your credentials or contact your administrator.`;
    setError(errText);
    return { success: false, error: errText };
  };

  const signOut = async () => {
    setIsLoading(true);
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Sign out error:', e);
      }
    }
    localStorage.removeItem(LS_AUTH_USER_ID);
    setCurrentUser(null);
    setIsLoading(false);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (resetErr) return { success: false, error: resetErr.message };
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }
    return { success: true };
  };

  const switchPersona = (profileId: string) => {
    const found = INITIAL_PROFILES.find((p) => p.id === profileId);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem(LS_AUTH_USER_ID, found.id);
    }
  };

  const updateCurrentUserProfile = (updates: Partial<Profile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates, updated_at: new Date().toISOString() };
    setCurrentUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        isLoading,
        error,
        signInWithEmail,
        signOut,
        resetPassword,
        switchPersona,
        updateCurrentUserProfile,
        availablePersonas: INITIAL_PROFILES,
        isLiveSupabase,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
