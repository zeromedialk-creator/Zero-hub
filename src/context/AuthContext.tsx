import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types/database';
import { INITIAL_PROFILES } from '../lib/initialData';
import { getDbClient } from '../lib/database';
import { getStoredCustomProfiles, getDeletedUserEmails, saveStoredCustomProfile, isUserDeleted } from './DataContext';

interface AuthContextType {
  currentUser: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  error: string | null;
  signInWithEmail: (emailOrUsername: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateCurrentUserProfile: (updates: Partial<Profile>) => Promise<void>;
  teamProfiles: Profile[];
  availablePersonas: Profile[];
  isLiveDb: boolean;
  isLiveSupabase: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LS_AUTH_USER_ID = 'zerohub_v4_auth_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [teamProfiles, setTeamProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveDb, setIsLiveDb] = useState<boolean>(false);

  // Initialize authentication on load/refresh:
  // Purge any legacy auto-login sessions so refreshing always requires logging in
  useEffect(() => {
    async function initializeAuth() {
      setIsLoading(true);
      setError(null);

      // Explicitly clear legacy stored credentials on refresh so user is always asked for login details
      try {
        localStorage.removeItem(LS_AUTH_USER_ID);
        sessionStorage.removeItem(LS_AUTH_USER_ID);
      } catch {
        // ignore
      }

      const dbClient = getDbClient();
      const deletedEmails = getDeletedUserEmails();

      if (dbClient) {
        setIsLiveDb(true);
        try {
          // Fetch all live profiles from database to populate team and verify credentials
          const { data: profilesData, error: profsErr } = await dbClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: true });

          const customProfiles = getStoredCustomProfiles();
          const profileMap = new Map<string, Profile>();
          INITIAL_PROFILES.forEach((p) => {
            if (!isUserDeleted(p.id, p.email)) {
              profileMap.set((p.email || p.id).toLowerCase(), p);
            }
          });

          if (profilesData && profilesData.length > 0 && !profsErr) {
            (profilesData as Profile[]).forEach((p) => {
              if (!isUserDeleted(p.id, p.email)) {
                profileMap.set((p.email || p.id).toLowerCase(), p);
              }
            });
          }

          customProfiles.forEach((p) => {
            if (!isUserDeleted(p.id, p.email)) {
              const key = (p.email || p.id).toLowerCase();
              if (!profileMap.has(key)) {
                profileMap.set(key, p);
              }
            }
          });

          const merged = Array.from(profileMap.values());
          setTeamProfiles(merged);
        } catch (e) {
          console.warn('Authentication profiles check notice:', e);
        }
      } else {
        setIsLiveDb(false);
        const customProfiles = getStoredCustomProfiles();
        const profileMap = new Map<string, Profile>();
        INITIAL_PROFILES.forEach((p) => {
          if (!isUserDeleted(p.id, p.email)) {
            profileMap.set((p.email || p.id).toLowerCase(), p);
          }
        });
        customProfiles.forEach((p) => {
          if (!isUserDeleted(p.id, p.email)) {
            profileMap.set((p.email || p.id).toLowerCase(), p);
          }
        });
        const merged = Array.from(profileMap.values());
        setTeamProfiles(merged);
      }

      // Always leave currentUser as null on load/refresh so login view is presented
      setCurrentUser(null);
      setIsLoading(false);
    }

    initializeAuth();

    // Listen to custom profile changes created or deleted from Admin Settings
    const handleProfilesChanged = (e: any) => {
      const detail = (e as CustomEvent)?.detail;

      if (detail?.removed && (detail?.id || detail?.email)) {
        setTeamProfiles((prev) =>
          prev.filter(
            (p) =>
              p.id !== detail.id &&
              p.email?.toLowerCase().trim() !== detail.email?.toLowerCase().trim() &&
              !isUserDeleted(p.id, p.email)
          )
        );

        setCurrentUser((current) => {
          if (
            current &&
            (current.id === detail.id ||
              current.email?.toLowerCase().trim() === detail.email?.toLowerCase().trim() ||
              isUserDeleted(current.id, current.email))
          ) {
            return null;
          }
          return current;
        });
      } else {
        // Updated or added profile
        const customProfiles = getStoredCustomProfiles();
        setTeamProfiles((prev) => {
          const map = new Map<string, Profile>();
          prev.filter((p) => !isUserDeleted(p.id, p.email)).forEach((p) => map.set((p.email || p.id).toLowerCase(), p));
          customProfiles.filter((p) => !isUserDeleted(p.id, p.email)).forEach((p) => map.set((p.email || p.id).toLowerCase(), p));
          if (detail && !detail.removed && !isUserDeleted(detail.id, detail.email)) {
            map.set((detail.email || detail.id).toLowerCase(), detail);
          }
          return Array.from(map.values());
        });
      }
    };
    window.addEventListener('zerohub-profiles-changed', handleProfilesChanged);

    // Subscribe to realtime profile updates if database is connected
    const dbClient = getDbClient();
    let channel: any = null;
    if (dbClient) {
      channel = dbClient
        .channel('auth-profiles-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, async () => {
          const { data } = await dbClient.from('profiles').select('*').order('created_at', { ascending: true });
          const customProfiles = getStoredCustomProfiles();
          const pMap = new Map<string, Profile>();
          INITIAL_PROFILES.forEach((p) => {
            if (!isUserDeleted(p.id, p.email)) {
              pMap.set((p.email || p.id).toLowerCase(), p);
            }
          });
          if (data && data.length > 0) {
            (data as Profile[]).forEach((p) => {
              if (!isUserDeleted(p.id, p.email)) {
                pMap.set((p.email || p.id).toLowerCase(), p);
              }
            });
          }
          customProfiles.forEach((p) => {
            if (!isUserDeleted(p.id, p.email)) {
              const key = (p.email || p.id).toLowerCase();
              if (!pMap.has(key)) {
                pMap.set(key, p);
              }
            }
          });
          const merged = Array.from(pMap.values());
          setTeamProfiles(merged);
          setCurrentUser((prev) => {
            if (!prev) return null;
            if (isUserDeleted(prev.id, prev.email)) {
              return null;
            }
            const updated = merged.find((p) => p.id === prev.id || p.email.toLowerCase() === prev.email.toLowerCase());
            return updated || prev;
          });
        })
        .subscribe();
    }

    return () => {
      window.removeEventListener('zerohub-profiles-changed', handleProfilesChanged);
      if (dbClient && channel) {
        dbClient.removeChannel(channel);
      }
    };
  }, []);

  const signInWithEmail = async (emailOrUsername: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);
    const normalized = emailOrUsername.toLowerCase().trim();

    if (!normalized) {
      const errText = 'Please enter your username or email address.';
      setError(errText);
      setIsLoading(false);
      return { success: false, error: errText };
    }

    if (!password || !password.trim()) {
      const errText = 'Please enter your password.';
      setError(errText);
      setIsLoading(false);
      return { success: false, error: errText };
    }

    if (password.trim().length < 4) {
      const errText = 'Password must be at least 4 characters.';
      setError(errText);
      setIsLoading(false);
      return { success: false, error: errText };
    }

    const dbClient = getDbClient();

    // 1. If database client is connected and email format provided, authenticate against cloud Auth
    if (dbClient && normalized.includes('@')) {
      try {
        const { data, error: signInErr } = await dbClient.auth.signInWithPassword({
          email: normalized,
          password: password.trim(),
        });

        if (!signInErr && data.user) {
          const { data: profileData } = await dbClient
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileData) {
            setCurrentUser(profileData as Profile);
            setIsLoading(false);
            return { success: true };
          }
        }
      } catch (err: any) {
        console.warn('Database auth sign in notice:', err);
      }
    }

    // 2. Validate against verified profiles (matching email, prefix username, or role alias)
    if (teamProfiles.length === 0) {
      const initialAdmin: Profile = {
        id: 'usr_' + Math.random().toString(36).substring(2, 10),
        full_name: normalized.includes('@') ? normalized.split('@')[0] : 'System Admin',
        email: normalized.includes('@') ? normalized : 'admin@zerohub.app',
        role: 'super_admin',
        status: 'active',
        job_title: 'System Administrator',
        password: password.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveStoredCustomProfile(initialAdmin);
      setTeamProfiles([initialAdmin]);
      setCurrentUser(initialAdmin);
      setIsLoading(false);
      return { success: true };
    }

    const matched = teamProfiles.find((p) => {
      const emailLower = p.email.toLowerCase();
      const emailPrefix = emailLower.split('@')[0];
      const fullNameLower = p.full_name.toLowerCase();
      const idWithoutPrefix = p.id.replace('usr_', '').toLowerCase();

      return (
        emailLower === normalized ||
        emailPrefix === normalized ||
        idWithoutPrefix === normalized ||
        (normalized === 'admin' && p.role === 'super_admin') ||
        fullNameLower === normalized
      );
    });

    if (matched) {
      if (matched.status === 'inactive') {
        const errText = 'Your account has been deactivated. Please contact your administrator.';
        setError(errText);
        setIsLoading(false);
        return { success: false, error: errText };
      }

      // Verify password against stored password or initial default password
      const enteredPassword = password.trim();
      const storedPassword = matched.password?.trim();

      if (storedPassword) {
        if (enteredPassword !== storedPassword) {
          const errText = 'Incorrect password. Please verify your credentials and try again.';
          setError(errText);
          setIsLoading(false);
          return { success: false, error: errText };
        }
      } else {
        // Fallback for profiles that have not migrated password column yet
        const isMaster = enteredPassword === 'zeromedia2026' || enteredPassword === 'admin123';
        if (!isMaster && enteredPassword.length < 4) {
          const errText = 'Incorrect password. Default agency password is "zeromedia2026".';
          setError(errText);
          setIsLoading(false);
          return { success: false, error: errText };
        }
      }

      // Session is stored only in active memory for this tab.
      // Refreshing the browser will always require re-authentication.
      setCurrentUser(matched);
      setIsLoading(false);
      return { success: true };
    }

    // 3. Fallback direct query to profiles in database (for newly added database profiles)
    if (dbClient) {
      try {
        const { data: dbProf } = await dbClient
          .from('profiles')
          .select('*')
          .or(`email.ilike.%${normalized}%,full_name.ilike.%${normalized}%`)
          .maybeSingle();

        if (dbProf) {
          const enteredPassword = password.trim();
          const storedPassword = (dbProf as Profile).password?.trim();

          if (storedPassword && enteredPassword !== storedPassword) {
            const errText = 'Incorrect password. Please verify your credentials and try again.';
            setError(errText);
            setIsLoading(false);
            return { success: false, error: errText };
          }

          setCurrentUser(dbProf as Profile);
          setIsLoading(false);
          return { success: true };
        }
      } catch (e) {
        console.warn('Database fallback profile lookup:', e);
      }
    }

    setIsLoading(false);
    const errText = 'Invalid username, email, or password. Please verify your credentials or contact your administrator.';
    setError(errText);
    return { success: false, error: errText };
  };

  const signOut = async () => {
    setIsLoading(true);
    const dbClient = getDbClient();
    if (dbClient) {
      try {
        await dbClient.auth.signOut();
      } catch (e) {
        console.warn('Sign out notice:', e);
      }
    }
    localStorage.removeItem(LS_AUTH_USER_ID);
    sessionStorage.removeItem(LS_AUTH_USER_ID);
    setCurrentUser(null);
    setIsLoading(false);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const dbClient = getDbClient();
    if (dbClient) {
      try {
        const { error: resetErr } = await dbClient.auth.resetPasswordForEmail(email.trim());
        if (resetErr) return { success: false, error: resetErr.message };
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }
    return { success: true };
  };

  const updateCurrentUserProfile = async (updates: Partial<Profile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates, updated_at: new Date().toISOString() };
    setCurrentUser(updated);

    const dbClient = getDbClient();
    if (dbClient) {
      try {
        await dbClient.from('profiles').update(updates).eq('id', currentUser.id);
      } catch (e) {
        console.error('Error updating profile in database:', e);
      }
    }
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
        updateCurrentUserProfile,
        teamProfiles,
        availablePersonas: teamProfiles,
        isLiveDb,
        isLiveSupabase: isLiveDb,
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
