import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Profile,
  Client,
  Project,
  Task,
  ContentItem,
  ContentVersion,
  Approval,
  Comment,
  FileRecord,
  Notification,
  ActivityLog,
  ClientUser,
  ProjectMember,
  ContentStatus,
  ProjectStatus,
  TaskStatus,
  Platform,
  MonthlyCycle,
  ContentContributor,
  RecurringContentTemplate,
  ProjectDeliverableTarget,
  AppOption,
  OptionCategory,
} from '../types/database';
import {
  INITIAL_PROFILES,
  INITIAL_CLIENTS,
  INITIAL_PROJECTS,
  INITIAL_MONTHLY_CYCLES,
  INITIAL_CONTENT_ITEMS,
  INITIAL_TASKS,
  INITIAL_RECURRING_TEMPLATES,
  INITIAL_CLIENT_USERS,
} from '../lib/initialData';
import { useAuth } from './AuthContext';
import { getDbClient as getSupabase } from '../lib/database';

export const DEFAULT_APP_OPTIONS: AppOption[] = [
  { id: 'opt_1', category: 'content_type', key: 'social_media_post', label: 'Post (Image)', is_active: true, sort_order: 1 },
  { id: 'opt_2', category: 'content_type', key: 'reel', label: 'Reel', is_active: true, sort_order: 2 },
  { id: 'opt_3', category: 'content_type', key: 'carousel', label: 'Carousel', is_active: true, sort_order: 3 },
  { id: 'opt_4', category: 'content_type', key: 'story', label: 'Story', is_active: true, sort_order: 4 },
  { id: 'opt_5', category: 'content_type', key: 'video', label: 'Long Video', is_active: true, sort_order: 5 },
  { id: 'opt_6', category: 'content_type', key: 'advertisement', label: 'Paid Ad', is_active: true, sort_order: 6 },
  { id: 'opt_7', category: 'content_type', key: 'blog', label: 'Blog Article', is_active: true, sort_order: 7 },
  { id: 'opt_8', category: 'content_type', key: 'other', label: 'Other', is_active: true, sort_order: 8 },

  { id: 'opt_9', category: 'platform', key: 'instagram', label: 'Instagram', is_active: true, sort_order: 1 },
  { id: 'opt_10', category: 'platform', key: 'tiktok', label: 'TikTok', is_active: true, sort_order: 2 },
  { id: 'opt_11', category: 'platform', key: 'youtube', label: 'YouTube', is_active: true, sort_order: 3 },
  { id: 'opt_12', category: 'platform', key: 'facebook', label: 'Facebook', is_active: true, sort_order: 4 },
  { id: 'opt_13', category: 'platform', key: 'linkedin', label: 'LinkedIn', is_active: true, sort_order: 5 },
  { id: 'opt_14', category: 'platform', key: 'twitter', label: 'X / Twitter', is_active: true, sort_order: 6 },
  { id: 'opt_15', category: 'platform', key: 'pinterest', label: 'Pinterest', is_active: true, sort_order: 7 },
  { id: 'opt_16', category: 'platform', key: 'other', label: 'Other', is_active: true, sort_order: 8 },

  { id: 'opt_17', category: 'priority', key: 'low', label: 'Low', is_active: true, sort_order: 1 },
  { id: 'opt_18', category: 'priority', key: 'medium', label: 'Medium', is_active: true, sort_order: 2 },
  { id: 'opt_19', category: 'priority', key: 'high', label: 'High', is_active: true, sort_order: 3 },
  { id: 'opt_20', category: 'priority', key: 'urgent', label: 'Urgent', is_active: true, sort_order: 4 },

  { id: 'opt_21', category: 'content_status', key: 'idea', label: 'Idea', is_active: true, sort_order: 1 },
  { id: 'opt_22', category: 'content_status', key: 'planned', label: 'Planned', is_active: true, sort_order: 2 },
  { id: 'opt_23', category: 'content_status', key: 'assigned', label: 'Assigned', is_active: true, sort_order: 3 },
  { id: 'opt_24', category: 'content_status', key: 'in_production', label: 'In Production', is_active: true, sort_order: 4 },
  { id: 'opt_25', category: 'content_status', key: 'internal_review', label: 'Internal Review', is_active: true, sort_order: 5 },
  { id: 'opt_26', category: 'content_status', key: 'client_review', label: 'Client Review', is_active: true, sort_order: 6 },
  { id: 'opt_27', category: 'content_status', key: 'changes_requested', label: 'Changes Requested', is_active: true, sort_order: 7 },
  { id: 'opt_28', category: 'content_status', key: 'approved', label: 'Approved', is_active: true, sort_order: 8 },
  { id: 'opt_29', category: 'content_status', key: 'scheduled', label: 'Scheduled', is_active: true, sort_order: 9 },
  { id: 'opt_30', category: 'content_status', key: 'published', label: 'Published', is_active: true, sort_order: 10 },
  { id: 'opt_31', category: 'content_status', key: 'completed', label: 'Completed', is_active: true, sort_order: 11 },

  { id: 'opt_32', category: 'contributor_role', key: 'Shooting', label: 'Shooting / Cinematography', is_active: true, sort_order: 1 },
  { id: 'opt_33', category: 'contributor_role', key: 'Editing', label: 'Video Editing', is_active: true, sort_order: 2 },
  { id: 'opt_34', category: 'contributor_role', key: 'Caption', label: 'Copy & Caption', is_active: true, sort_order: 3 },
  { id: 'opt_35', category: 'contributor_role', key: 'QC', label: 'Quality Control (QC Review)', is_active: true, sort_order: 4 },
  { id: 'opt_36', category: 'contributor_role', key: 'Audio', label: 'Sound & Music', is_active: true, sort_order: 5 },
  { id: 'opt_37', category: 'contributor_role', key: 'Grading', label: 'Color Grading', is_active: true, sort_order: 6 },
  { id: 'opt_38', category: 'contributor_role', key: 'Graphics', label: 'Graphics & Thumbnail Design', is_active: true, sort_order: 7 },
  { id: 'opt_39', category: 'contributor_role', key: 'Strategy', label: 'Content Strategy', is_active: true, sort_order: 8 },

  { id: 'opt_role_1', category: 'user_role', key: 'super_admin', label: 'Super Admin', is_active: true, sort_order: 1 },
  { id: 'opt_role_2', category: 'user_role', key: 'project_manager', label: 'Project Manager (PM)', is_active: true, sort_order: 2 },
  { id: 'opt_role_3', category: 'user_role', key: 'videographer', label: 'Videographer / Cinematographer', is_active: true, sort_order: 3 },
  { id: 'opt_role_4', category: 'user_role', key: 'editor', label: 'Video Editor / Motion Graphics', is_active: true, sort_order: 4 },
  { id: 'opt_role_5', category: 'user_role', key: 'copy_editor', label: 'Copywriter / Script Editor', is_active: true, sort_order: 5 },
  { id: 'opt_role_6', category: 'user_role', key: 'qc', label: 'Quality Control (QC Specialist)', is_active: true, sort_order: 6 },
  { id: 'opt_role_7', category: 'user_role', key: 'graphic_designer', label: 'Graphic Designer / Thumbnail Artist', is_active: true, sort_order: 7 },
  { id: 'opt_role_8', category: 'user_role', key: 'audio_engineer', label: 'Sound & Audio Engineer', is_active: true, sort_order: 8 },
  { id: 'opt_role_9', category: 'user_role', key: 'colorist', label: 'Colorist / Color Grader', is_active: true, sort_order: 9 },
  { id: 'opt_role_10', category: 'user_role', key: 'strategist', label: 'Content Strategist', is_active: true, sort_order: 10 },
  { id: 'opt_role_11', category: 'user_role', key: 'social_media_manager', label: 'Social Media Manager', is_active: true, sort_order: 11 },
  { id: 'opt_role_12', category: 'user_role', key: 'client', label: 'Client Representative', is_active: true, sort_order: 12 },
  { id: 'opt_role_13', category: 'user_role', key: 'viewer', label: 'Viewer / Stakeholder', is_active: true, sort_order: 13 },
];

export const LS_CUSTOM_PROFILES_KEY = 'zerohub_custom_profiles';
export const LS_DELETED_USERS_KEY = 'zerohub_deleted_users_v2';
export const LS_CONTENT_VERSIONS_KEY = 'zerohub_content_versions_v2';

export function getStoredContentVersions(): ContentVersion[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_CONTENT_VERSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredContentVersion(version: ContentVersion): void {
  if (typeof window === 'undefined' || !version) return;
  try {
    const current = getStoredContentVersions();
    const filtered = current.filter((v) => v.id !== version.id);
    filtered.push(version);
    localStorage.setItem(LS_CONTENT_VERSIONS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('saveStoredContentVersion error:', e);
  }
}

export function saveStoredContentVersions(versions: ContentVersion[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LS_CONTENT_VERSIONS_KEY, JSON.stringify(versions));
  } catch (e) {
    console.warn('saveStoredContentVersions error:', e);
  }
}

export function getDeletedUserEmails(): string[] {
  const defaults = ['zeromedia.lk@gmail.com', '6cdd37f7-38fa-4fb0-8a7b-b7324d80f83c', 'usr_admin_zeromedia'];
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = localStorage.getItem(LS_DELETED_USERS_KEY);
    const set = new Set<string>(defaults.map((d) => d.toLowerCase().trim()));
    if (raw) {
      const parsed: string[] = JSON.parse(raw);
      parsed.forEach((item) => {
        if (item) set.add(String(item).toLowerCase().trim());
      });
    }
    return Array.from(set);
  } catch {
    return defaults;
  }
}

export function isUserDeleted(id?: string, email?: string): boolean {
  if (!id && !email) return false;
  const deleted = getDeletedUserEmails();
  const normalizedId = id ? String(id).toLowerCase().trim() : '';
  const normalizedEmail = email ? String(email).toLowerCase().trim() : '';

  for (const item of deleted) {
    if (!item) continue;
    const norm = String(item).toLowerCase().trim();
    if (normalizedId && norm === normalizedId) return true;
    if (normalizedEmail && norm === normalizedEmail) return true;
    if (normalizedId && normalizedId.includes('@') && norm === normalizedId) return true;
    if (normalizedEmail && norm === normalizedId) return true;
    if (normalizedId && norm === normalizedEmail) return true;
  }
  return false;
}

export function recordDeletedUser(id?: string, email?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getDeletedUserEmails();
    const set = new Set<string>(current.map((s) => s.toLowerCase().trim()));
    if (id && String(id).trim()) set.add(String(id).toLowerCase().trim());
    if (email && String(email).trim()) set.add(String(email).toLowerCase().trim());
    localStorage.setItem(LS_DELETED_USERS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn('recordDeletedUser error:', e);
  }
}

export function getStoredCustomProfiles(): Profile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LS_CUSTOM_PROFILES_KEY);
    if (!raw) return [];
    const list: Profile[] = JSON.parse(raw);
    return list.filter(
      (p) =>
        p &&
        p.id &&
        !p.id.startsWith('mock_') &&
        !p.id.startsWith('demo_') &&
        !p.id.startsWith('test_') &&
        !p.email?.includes('example.com') &&
        !isUserDeleted(p.id, p.email)
    );
  } catch {
    return [];
  }
}

export function saveStoredCustomProfile(profile: Profile): void {
  if (typeof window === 'undefined' || !profile) return;
  if (isUserDeleted(profile.id, profile.email)) return;
  try {
    const current = getStoredCustomProfiles();
    const filtered = current.filter(
      (p) => p.id !== profile.id && p.email?.toLowerCase().trim() !== profile.email?.toLowerCase().trim()
    );
    filtered.push(profile);
    localStorage.setItem(LS_CUSTOM_PROFILES_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent('zerohub-profiles-changed', { detail: profile }));
  } catch (e) {
    console.warn('saveStoredCustomProfile error:', e);
  }
}

export function removeStoredCustomProfile(profileId: string, email?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(LS_CUSTOM_PROFILES_KEY);
    if (raw) {
      const list: Profile[] = JSON.parse(raw);
      const filtered = list.filter((p) => {
        if (!p) return false;
        if (p.id === profileId || String(p.id).toLowerCase().trim() === String(profileId).toLowerCase().trim()) return false;
        if (email && p.email && p.email.toLowerCase().trim() === email.toLowerCase().trim()) return false;
        if (isUserDeleted(p.id, p.email)) return false;
        return true;
      });
      localStorage.setItem(LS_CUSTOM_PROFILES_KEY, JSON.stringify(filtered));
    }
    window.dispatchEvent(new CustomEvent('zerohub-profiles-changed', { detail: { id: profileId, email, removed: true } }));
  } catch (e) {
    console.warn('removeStoredCustomProfile error:', e);
  }
}

interface DataContextType {
  // Raw / complete collections from Supabase
  profiles: Profile[];
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  contentItems: ContentItem[];
  contentVersions: ContentVersion[];
  approvals: Approval[];
  comments: Comment[];
  files: FileRecord[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
  clientUsers: ClientUser[];
  projectMembers: ProjectMember[];
  monthlyCycles: MonthlyCycle[];
  contentContributors: ContentContributor[];
  recurringTemplates: RecurringContentTemplate[];
  appOptions: AppOption[];

  // Database Connection & Reliability States
  isSaving: boolean;
  isLoadingData: boolean;
  dbError: string | null;
  clearDbError: () => void;
  lastSyncTime: string | null;
  refreshAllData: () => Promise<void>;

  // Dynamic Options Methods
  getOptionsByCategory: (category: OptionCategory | string) => AppOption[];
  addOption: (optionData: Omit<AppOption, 'id'>) => Promise<AppOption | null>;
  updateOption: (id: string, updates: Partial<AppOption>) => Promise<boolean>;
  deleteOption: (id: string) => Promise<boolean>;

  // Role-filtered collections
  filteredClients: Client[];
  filteredProjects: Project[];
  filteredTasks: Task[];
  filteredContentItems: ContentItem[];
  filteredFiles: FileRecord[];
  filteredNotifications: Notification[];
  filteredMonthlyCycles: MonthlyCycle[];
  filteredRecurringTemplates: RecurringContentTemplate[];

  // Mutation actions (all save to Supabase)
  addClient: (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => Promise<Client | null>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<boolean>;
  archiveClient: (id: string) => Promise<boolean>;

  addProject: (
    projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>,
    memberIds?: string[],
    initialCycleTargets?: ProjectDeliverableTarget[]
  ) => Promise<Project | null>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<boolean>;
  updateProjectStatus: (id: string, status: ProjectStatus) => Promise<boolean>;

  // Monthly Retainer & Cycle actions
  addMonthlyCycle: (cycleData: Omit<MonthlyCycle, 'id' | 'created_at' | 'updated_at'>) => Promise<MonthlyCycle | null>;
  updateMonthlyCycle: (id: string, updates: Partial<MonthlyCycle>) => Promise<boolean>;
  createNextMonthCycle: (projectId: string, fromCycleId?: string) => Promise<MonthlyCycle | null>;

  // Multiple contributors actions
  addContentContributor: (
    dataOrContentId: string | Omit<ContentContributor, 'id'>,
    userId?: string,
    roleInContent?: string
  ) => Promise<void>;
  removeContentContributor: (id: string) => Promise<void>;

  // Recurring templates actions
  addRecurringTemplate: (templateData: Omit<RecurringContentTemplate, 'id' | 'created_at'>) => Promise<void>;
  deleteRecurringTemplate: (id: string) => Promise<void>;
  createContentFromTemplate: (
    templateId: string,
    cycleId?: string,
    overrideDates?: { internal_due_date?: string; publishing_date?: string }
  ) => Promise<void>;

  addTask: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<Task | null>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<boolean>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  toggleChecklistItem: (taskId: string, itemId: string) => Promise<boolean>;
  syncTasksWithSystem: () => Promise<number>;

  addContentItem: (
    itemData: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>,
    contributors?: { user_id: string; role_in_content: string }[]
  ) => Promise<ContentItem | null>;
  updateContentItem: (id: string, updates: Partial<ContentItem>) => Promise<boolean>;
  updateContentStatus: (id: string, newStatus: ContentStatus, note?: string) => Promise<boolean>;
  rescheduleContentPublishingDate: (id: string, newPublishingDate: string) => Promise<boolean>;

  addContentVersion: (contentId: string, versionData: { file_url: string; file_name?: string; notes: string }) => Promise<void>;
  
  // Client Approval Actions
  approveContent: (contentId: string, comment?: string) => Promise<void>;
  requestChanges: (contentId: string, comment: string) => Promise<void>;

  addComment: (data: { projectId?: string; contentId?: string; comment: string }) => Promise<void>;
  addFile: (fileData: Omit<FileRecord, 'id' | 'created_at'>) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;

  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  // Admin user operations & client linkage
  createUserProfile: (userData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>, clientId?: string) => Promise<Profile | null>;
  updateUserProfile: (id: string, updates: Partial<Profile>, clientId?: string) => Promise<void>;
  deleteUserProfile: (id: string) => Promise<boolean>;
  toggleUserStatus: (id: string) => Promise<void>;
  linkUserToClient: (userId: string, clientId: string) => Promise<boolean>;
  unlinkUserFromClient: (userId: string, clientId: string) => Promise<boolean>;
  getClientForUser: (userId: string) => Client | undefined;
  getUsersForClient: (clientId: string) => Profile[];

  // Helpers & Calculations
  getClientById: (id: string) => Client | undefined;
  getProfileById: (id: string) => Profile | undefined;
  getProjectById: (id: string) => Project | undefined;
  getContentById: (id: string) => ContentItem | undefined;
  getCycleById: (id: string) => MonthlyCycle | undefined;
  getCyclesByProjectId: (projectId: string) => MonthlyCycle[];
  getActiveCycleForProject: (projectId: string) => MonthlyCycle | undefined;
  getCycleMetrics: (cycleId: string) => {
    target: number;
    completed: number;
    remaining: number;
    progressPercent: number;
    byType: { type: string; label: string; target: number; completed: number }[];
    byTarget: { type: string; label: string; target: number; completed: number }[];
    inProduction: number;
    clientReview: number;
    planned: number;
    changesRequested: number;
    totalItemsCount: number;
  };
  getDeadlineWarnings: () => {
    overdue: ContentItem[];
    dueSoon: ContentItem[];
    publishingApproaching: ContentItem[];
    awaitingApproval: ContentItem[];
    publishingNotApproved: ContentItem[];
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, role } = useAuth();

  // Supabase Database State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [contentVersions, setContentVersions] = useState<ContentVersion[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [monthlyCycles, setMonthlyCycles] = useState<MonthlyCycle[]>([]);
  const [contentContributors, setContentContributors] = useState<ContentContributor[]>([]);
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringContentTemplate[]>([]);
  const [appOptions, setAppOptions] = useState<AppOption[]>(DEFAULT_APP_OPTIONS);

  // Status flags
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const clearDbError = useCallback(() => setDbError(null), []);

  // Primary loader from Supabase
  const refreshAllData = useCallback(async () => {
    const supabase = getSupabase();
    const deleted = getDeletedUserEmails();

    if (!supabase) {
      const customProfiles = getStoredCustomProfiles();
      const profileMap = new Map<string, Profile>();
      INITIAL_PROFILES.forEach((p) => {
        if (!isUserDeleted(p.id, p.email)) {
          const key = (p.email || p.id).toLowerCase().trim();
          profileMap.set(key, p);
        }
      });
      customProfiles.forEach((p) => {
        if (!isUserDeleted(p.id, p.email)) {
          const key = (p.email || p.id).toLowerCase().trim();
          profileMap.set(key, p);
        }
      });
      setProfiles(Array.from(profileMap.values()));
      setClients(INITIAL_CLIENTS);
      setProjects(INITIAL_PROJECTS);
      setContentItems(INITIAL_CONTENT_ITEMS);
      setTasks(INITIAL_TASKS);
      setMonthlyCycles(INITIAL_MONTHLY_CYCLES);
      setClientUsers(INITIAL_CLIENT_USERS);
      setRecurringTemplates(INITIAL_RECURRING_TEMPLATES);

      // Load stored content versions and synthesize fallback version 1 if needed
      const storedVersions = getStoredContentVersions();
      const versionItemIds = new Set(storedVersions.map((v) => v.content_id));
      INITIAL_CONTENT_ITEMS.forEach((item) => {
        if (item.thumbnail_url && !versionItemIds.has(item.id)) {
          storedVersions.push({
            id: `ver_auto_${item.id}_1`,
            content_id: item.id,
            version_number: 1,
            file_url: item.thumbnail_url,
            file_name: `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}_V1`,
            uploaded_by: item.assigned_to || item.created_by || 'team_member',
            notes: 'Initial deliverable master asset',
            created_at: item.created_at || new Date().toISOString(),
          });
        }
      });
      setContentVersions(storedVersions);
      saveStoredContentVersions(storedVersions);
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);
    try {
      // 1. Fetch profiles
      const { data: profData, error: profErr } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
      if (profErr) {
        console.warn('Supabase profiles fetch warning:', profErr.message);
        if (profErr.code === '42501' || profErr.message.toLowerCase().includes('policy')) {
          setDbError(`Row-Level Security is blocking profiles access: "${profErr.message}". Run the User Creation Fix SQL in Supabase.`);
        }
      }

      // Collect custom profiles from localStorage
      const customProfiles = getStoredCustomProfiles();
      const initialProfileMap = new Map<string, Profile>();
      if (profData && profData.length > 0) {
        (profData as Profile[]).forEach((p) => {
          if (!isUserDeleted(p.id, p.email)) {
            const key = (p.email || p.id).toLowerCase().trim();
            initialProfileMap.set(key, p);
          }
        });
      }
      customProfiles.forEach((p) => {
        if (!isUserDeleted(p.id, p.email)) {
          const key = (p.email || p.id).toLowerCase().trim();
          if (!initialProfileMap.has(key)) {
            initialProfileMap.set(key, p);
          }
        }
      });
      INITIAL_PROFILES.forEach((p) => {
        if (!isUserDeleted(p.id, p.email)) {
          const key = (p.email || p.id).toLowerCase().trim();
          if (!initialProfileMap.has(key)) {
            initialProfileMap.set(key, p);
          }
        }
      });
      setProfiles(Array.from(initialProfileMap.values()));

      // 2. Fetch clients
      const { data: cliData, error: cliErr } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
      if (cliErr) {
        console.warn('Supabase clients fetch warning:', cliErr.message);
        if (cliErr.code === '42501' || cliErr.message.toLowerCase().includes('policy')) {
          setDbError(`Row-Level Security is blocking data access: "${cliErr.message}". Run the RLS Fix SQL in Supabase.`);
        }
      }
      if (cliData) {
        const sanitizedClients = (cliData as Client[]).map((cli) =>
          isUserDeleted(cli.assigned_pm_id) ? { ...cli, assigned_pm_id: undefined } : cli
        );
        setClients(sanitizedClients);
      }

      // 3. Fetch projects
      const { data: prjData, error: prjErr } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (prjErr) {
        console.warn('Supabase projects fetch warning:', prjErr.message);
      }
      let currentProjectsList: Project[] = [];
      if (prjData) {
        currentProjectsList = prjData.map((p: any) => ({
          ...p,
          project_manager_id: isUserDeleted(p.project_manager_id) ? undefined : p.project_manager_id,
          deliverable_targets: typeof p.deliverable_targets === 'string'
            ? (() => { try { return JSON.parse(p.deliverable_targets); } catch { return []; } })()
            : (Array.isArray(p.deliverable_targets) ? p.deliverable_targets : []),
        }));
        setProjects(currentProjectsList);
      } else {
        currentProjectsList = INITIAL_PROJECTS.map((p) => ({
          ...p,
          project_manager_id: isUserDeleted(p.project_manager_id) ? undefined : p.project_manager_id,
        }));
        setProjects(currentProjectsList);
      }

      // 4. Fetch content items
      const { data: cntData, error: cntErr } = await supabase.from('content_items').select('*').order('created_at', { ascending: false });
      if (cntErr) {
        console.warn('Supabase content_items fetch warning:', cntErr.message);
      }

      // 5. Fetch content versions
      const { data: verData, error: verErr } = await supabase.from('content_versions').select('*').order('version_number', { ascending: false });
      if (verErr) {
        console.warn('Supabase content_versions fetch warning:', verErr.message);
      }

      // 6. Fetch activity logs (needed for fallback sync across devices)
      const { data: actData } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false });
      if (actData) {
        setActivityLogs(actData as ActivityLog[]);

        // Check if there are profiles backed up in activity logs and merge with active profiles
        const logProfiles = actData
          ?.filter((l) => (l.metadata as any)?.custom_profile)
          .map((l) => (l.metadata as any).custom_profile as Profile)
          .filter((p) => !isUserDeleted(p.id, p.email)) || [];

        if (logProfiles.length > 0) {
          setProfiles((prev) => {
            const pMap = new Map<string, Profile>();
            prev.filter((p) => !isUserDeleted(p.id, p.email)).forEach((p) => pMap.set((p.email || p.id).toLowerCase(), p));
            logProfiles.forEach((p) => {
              if (!isUserDeleted(p.id, p.email) && !pMap.has((p.email || p.id).toLowerCase())) {
                pMap.set((p.email || p.id).toLowerCase(), p);
              }
            });
            return Array.from(pMap.values());
          });
        }
      }

      // Merge and consolidate content versions across database, activity logs, and local storage
      const logVersions = actData
        ?.filter((l) => (l.metadata as any)?.version_record)
        .map((l) => (l.metadata as any).version_record as ContentVersion) || [];

      const localStoredVersions = getStoredContentVersions();
      const versionMap = new Map<string, ContentVersion>();

      // 1) First populate from local storage
      localStoredVersions.forEach((v) => {
        if (v && v.id) versionMap.set(v.id, v);
      });

      // 2) Merge from activity log backups
      logVersions.forEach((v) => {
        if (v && v.id) versionMap.set(v.id, v);
      });

      // 3) Supabase table versions take highest precedence
      if (verData) {
        (verData as ContentVersion[]).forEach((v) => {
          if (v && v.id) versionMap.set(v.id, v);
        });
      }

      // 4) Synthesize fallback Version 1 for any content item that has a thumbnail_url or asset but no explicit version record
      if (cntData) {
        const existingContentVersionIds = new Set(Array.from(versionMap.values()).map((v) => v.content_id));
        (cntData as ContentItem[]).forEach((item) => {
          if (item.thumbnail_url && !existingContentVersionIds.has(item.id)) {
            const autoVer: ContentVersion = {
              id: `ver_auto_${item.id}_1`,
              content_id: item.id,
              version_number: 1,
              file_url: item.thumbnail_url,
              file_name: `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}_V1`,
              uploaded_by: item.assigned_to || item.created_by || 'team_member',
              notes: 'Initial deliverable master asset',
              created_at: item.created_at || new Date().toISOString(),
            };
            versionMap.set(autoVer.id, autoVer);
          }
        });
      }

      const consolidatedVersions = Array.from(versionMap.values()).sort(
        (a, b) => b.version_number - a.version_number
      );
      setContentVersions(consolidatedVersions);
      saveStoredContentVersions(consolidatedVersions);

      // 7. Fetch approvals
      const { data: appData } = await supabase.from('approvals').select('*').order('created_at', { ascending: false });
      const logApprovals = actData
        ?.filter((l) => (l.metadata as any)?.approval_record)
        .map((l) => (l.metadata as any).approval_record as Approval) || [];

      const approvalMap = new Map<string, Approval>();
      if (appData) (appData as Approval[]).forEach((a) => approvalMap.set(a.id, a));
      logApprovals.forEach((a) => {
        if (!approvalMap.has(a.id)) approvalMap.set(a.id, a);
      });
      const allApprovals = Array.from(approvalMap.values());
      setApprovals(allApprovals);

      let currentContentList: ContentItem[] = [];
      if (cntData) {
        const syncedItems = (cntData as any[]).map((raw) => {
          let parsedPlatforms: Platform[] = [];
          if (Array.isArray(raw.platforms) && raw.platforms.length > 0) {
            parsedPlatforms = raw.platforms;
          } else if (typeof raw.platforms === 'string') {
            try {
              const p = JSON.parse(raw.platforms);
              if (Array.isArray(p) && p.length > 0) parsedPlatforms = p;
            } catch {
              parsedPlatforms = [raw.platforms as Platform];
            }
          }
          if (parsedPlatforms.length === 0 && raw.platform) {
            parsedPlatforms = [raw.platform as Platform];
          }

          const c: ContentItem = {
            ...raw,
            platform: raw.platform || parsedPlatforms[0] || 'instagram',
            platforms: parsedPlatforms.length > 0 ? parsedPlatforms : [(raw.platform || 'instagram') as Platform],
          };

          const itemApps = allApprovals
            .filter((a) => a.content_id === c.id)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          const latestApp = itemApps[0];

          if (latestApp) {
            // Check if there are versions uploaded AFTER the latest review decision
            const newerVersions = consolidatedVersions.filter(
              (v: any) => v.content_id === c.id && (
                new Date(v.created_at).getTime() > new Date(latestApp.created_at).getTime() ||
                v.version_number > 1
              )
            );

            if (newerVersions.length > 0) {
              // A revised version exists addressing the change request: transition to client_review and clear old change request note
              if (c.status === 'changes_requested') {
                return {
                  ...c,
                  status: 'client_review' as ContentStatus,
                  notes: '',
                };
              }
            } else {
              if (latestApp.status === 'changes_requested' && c.status !== 'changes_requested' && c.status !== 'client_review') {
                return {
                  ...c,
                  status: 'changes_requested' as ContentStatus,
                  notes: latestApp.comment || c.notes,
                };
              } else if (latestApp.status === 'approved' && c.status === 'client_review') {
                return {
                  ...c,
                  status: 'approved' as ContentStatus,
                };
              }
            }
          }
          return c;
        });

        currentContentList = syncedItems.map((c) =>
          isUserDeleted(c.assigned_to) ? { ...c, assigned_to: undefined } : c
        );
        setContentItems(currentContentList);
      } else {
        currentContentList = INITIAL_CONTENT_ITEMS.map((c) =>
          isUserDeleted(c.assigned_to) ? { ...c, assigned_to: undefined } : c
        );
        setContentItems(currentContentList);
      }

      // 8. Fetch tasks
      const { data: tskData, error: tskErr } = await supabase.from('tasks').select('*').order('due_date', { ascending: true });
      const logTasks = actData
        ?.filter((l) => l.entity_type === 'task' && (l.metadata as any)?.task_data)
        .map((l) => (l.metadata as any).task_data as Task) || [];

      const taskMap = new Map<string, Task>();
      if (!tskErr && tskData && (tskData.length > 0 || logTasks.length > 0)) {
        (tskData as Task[]).forEach((t) => {
          const sanitizedTask = isUserDeleted(t.assigned_to) ? { ...t, assigned_to: undefined } : t;
          taskMap.set(t.id, sanitizedTask);
        });
        logTasks.forEach((t) => {
          if (!taskMap.has(t.id)) {
            const sanitizedTask = isUserDeleted(t.assigned_to) ? { ...t, assigned_to: undefined } : t;
            taskMap.set(t.id, sanitizedTask);
          }
        });
      } else {
        INITIAL_TASKS.forEach((t) => {
          const sanitizedTask = isUserDeleted(t.assigned_to) ? { ...t, assigned_to: undefined } : t;
          taskMap.set(t.id, sanitizedTask);
        });
        logTasks.forEach((t) => {
          const sanitizedTask = isUserDeleted(t.assigned_to) ? { ...t, assigned_to: undefined } : t;
          taskMap.set(t.id, sanitizedTask);
        });
      }
      setTasks(Array.from(taskMap.values()));

      // 9. Fetch comments
      const { data: comData } = await supabase.from('comments').select('*').order('created_at', { ascending: true });
      const logComments = actData
        ?.filter((l) => (l.metadata as any)?.comment_record)
        .map((l) => (l.metadata as any).comment_record as Comment) || [];
      const commentMap = new Map<string, Comment>();
      if (comData) (comData as Comment[]).forEach((c) => commentMap.set(c.id, c));
      logComments.forEach((c) => {
        if (!commentMap.has(c.id)) commentMap.set(c.id, c);
      });
      setComments(Array.from(commentMap.values()));

      // 10. Fetch files
      const { data: filData } = await supabase.from('files').select('*').order('created_at', { ascending: false });
      if (filData) setFiles(filData as FileRecord[]);

      // 11. Fetch notifications
      const { data: notifData } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (notifData) setNotifications((notifData as Notification[]).filter((n) => !isUserDeleted(n.user_id)));

      // 12. Fetch project members & client users
      const { data: pmData } = await supabase.from('project_members').select('*');
      if (pmData) setProjectMembers((pmData as ProjectMember[]).filter((pm) => !isUserDeleted(pm.user_id)));

      const { data: cuData } = await supabase.from('client_users').select('*');
      if (cuData && cuData.length > 0) {
        setClientUsers((cuData as ClientUser[]).filter((cu) => !isUserDeleted(cu.user_id)));
      } else {
        setClientUsers(INITIAL_CLIENT_USERS.filter((cu) => !isUserDeleted(cu.user_id)));
      }

      // 13. Dynamic Options from Supabase app_options table
      const { data: optData, error: optErr } = await supabase.from('app_options').select('*').order('sort_order', { ascending: true });
      if (!optErr && optData && optData.length > 0) {
        setAppOptions(optData as AppOption[]);
      } else {
        // Look in activity_logs for custom options saved in Supabase
        const customOptLogs = actData?.filter((l) => l.entity_type === 'system' && (l.metadata as any)?.custom_app_options);
        if (customOptLogs && customOptLogs.length > 0) {
          const latestLog = customOptLogs[0];
          const merged = (latestLog.metadata as any).custom_app_options as AppOption[];
          setAppOptions(merged);
        }
      }

      // 14. Monthly Cycles
      const { data: cycData, error: cycErr } = await supabase.from('monthly_cycles').select('*').order('year', { ascending: false });
      if (!cycErr && cycData && cycData.length > 0) {
        setMonthlyCycles(cycData as MonthlyCycle[]);
      } else {
        // Check for cycles stored in Supabase activity_logs
        const logCycles = actData
          ?.filter((l) => (l.entity_type === 'project' || l.entity_type === 'system') && (l.metadata as any)?.monthly_cycle)
          .map((l) => (l.metadata as any).monthly_cycle as MonthlyCycle) || [];

        const cycleMap = new Map<string, MonthlyCycle>();
        INITIAL_MONTHLY_CYCLES.forEach((c) => cycleMap.set(c.id, c));
        logCycles.forEach((c) => cycleMap.set(c.id, c));
        setMonthlyCycles(Array.from(cycleMap.values()));
      }

      // 15. Content Contributors & Recurring Templates
      const { data: cbData } = await supabase.from('content_contributors').select('*');
      if (cbData) setContentContributors(cbData as ContentContributor[]);

      const { data: tmplData } = await supabase.from('recurring_content_templates').select('*');
      if (tmplData && tmplData.length > 0) {
        setRecurringTemplates(tmplData as RecurringContentTemplate[]);
      } else {
        setRecurringTemplates(INITIAL_RECURRING_TEMPLATES);
      }

      // Automatic Synchronization: Ensure all assigned deliverables, contributors, and revision requests have tasks
      const currentTasksList = Array.from(taskMap.values());
      const hasTask = (pId: string, cId?: string, uId?: string, titlePrefix?: string) => {
        return currentTasksList.some((t) => {
          if (t.project_id !== pId) return false;
          if (cId && t.content_id !== cId) return false;
          if (uId && t.assigned_to !== uId) return false;
          if (titlePrefix && !t.title.toLowerCase().includes(titlePrefix.toLowerCase())) return false;
          return true;
        });
      };

      if (currentContentList && currentContentList.length > 0) {
        currentContentList.forEach((item) => {
          if (item.assigned_to && !hasTask(item.project_id, item.id, item.assigned_to, item.title)) {
            const autoId = `task_auto_${item.id}_${item.assigned_to}`;
            if (!taskMap.has(autoId)) {
              taskMap.set(autoId, {
                id: autoId,
                project_id: item.project_id,
                content_id: item.id,
                assigned_to: item.assigned_to,
                created_by: item.created_by || 'system',
                title: `Produce: ${item.title}`,
                description: `Deliverable assignment: ${item.title} (${item.content_type.replace(/_/g, ' ')} on ${item.platform}).\nDue: ${item.internal_due_date || item.due_date}.\nBrief: ${item.brief || 'Complete creative deliverable production.'}`,
                status: ['completed', 'published', 'approved'].includes(item.status) ? 'completed' : 'todo',
                priority: item.priority || 'medium',
                due_date: item.internal_due_date || item.due_date,
                checklist: [
                  { id: 'chk_1', text: 'Review creative brief & format specs', done: false },
                  { id: 'chk_2', text: 'Produce draft / first cut', done: false },
                  { id: 'chk_3', text: 'Upload v1 preview for QA and client review', done: false },
                ],
                created_at: item.created_at || new Date().toISOString(),
                updated_at: item.updated_at || new Date().toISOString(),
              });
            }
          }

          if (item.status === 'changes_requested') {
            const bound = new Set<string>();
            if (item.assigned_to) bound.add(item.assigned_to);
            if (cbData) {
              (cbData as ContentContributor[]).filter((c) => c.content_id === item.id).forEach((c) => bound.add(c.user_id));
            }
            if (bound.size === 0 && currentProjectsList.length > 0) {
              const pr = currentProjectsList.find((p) => p.id === item.project_id);
              if (pr?.project_manager_id) bound.add(pr.project_manager_id);
            }
            const revDue = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
            bound.forEach((bId) => {
              if (!hasTask(item.project_id, item.id, bId, '[Client Revision]')) {
                const rId = `task_rev_${item.id}_${bId}`;
                if (!taskMap.has(rId)) {
                  taskMap.set(rId, {
                    id: rId,
                    project_id: item.project_id,
                    content_id: item.id,
                    assigned_to: bId,
                    created_by: 'client',
                    title: `[Client Revision] ${item.title}`,
                    description: `Client requested changes on "${item.title}":\n\n"${item.notes || 'Please make adjustments based on client review.'}"\n\nPlease apply requested adjustments and upload a new cut/version for review.`,
                    status: 'todo',
                    priority: 'urgent',
                    due_date: revDue,
                    checklist: [
                      { id: 'rchk_1', text: 'Review client feedback notes & instructions', done: false },
                      { id: 'rchk_2', text: 'Apply revisions and adjustments to cut', done: false },
                      { id: 'rchk_3', text: 'Upload revised cut for review', done: false },
                    ],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  });
                }
              }
            });
          }
        });
      }

      // Auto-sync project assignments for Project Managers and assigned team members
      if (currentProjectsList && currentProjectsList.length > 0) {
        currentProjectsList.forEach((pr) => {
          if (pr.project_manager_id && !hasTask(pr.id, undefined, pr.project_manager_id, 'Project Setup & Kickoff')) {
            const autoPmId = `task_proj_pm_${pr.id}_${pr.project_manager_id}`;
            if (!taskMap.has(autoPmId)) {
              taskMap.set(autoPmId, {
                id: autoPmId,
                project_id: pr.id,
                assigned_to: pr.project_manager_id,
                created_by: 'system',
                title: `Project Setup & Kickoff: ${pr.project_name}`,
                description: `Lead coordination for project "${pr.project_name}". Review deliverables schedule, retainer cycles, and coordinate team members.`,
                status: pr.status === 'completed' ? 'completed' : 'in_progress',
                priority: pr.priority || 'medium',
                due_date: pr.deadline || pr.start_date,
                checklist: [
                  { id: 'pchk_1', text: 'Confirm brand brief & client communication channel', done: false },
                  { id: 'pchk_2', text: 'Setup monthly retainer cycle targets & publishing queue', done: false },
                  { id: 'pchk_3', text: 'Assign videographers, editors, and creators', done: false },
                ],
                created_at: pr.created_at || new Date().toISOString(),
                updated_at: pr.updated_at || new Date().toISOString(),
              });
            }
          }
        });
      }

      if (pmData && currentProjectsList.length > 0) {
        (pmData as ProjectMember[]).forEach((pm) => {
          const pr = currentProjectsList.find((p) => p.id === pm.project_id);
          if (pr && pm.user_id !== pr.project_manager_id && !hasTask(pr.id, undefined, pm.user_id, 'Project Onboarding')) {
            const autoMemId = `task_proj_mem_${pr.id}_${pm.user_id}`;
            if (!taskMap.has(autoMemId)) {
              taskMap.set(autoMemId, {
                id: autoMemId,
                project_id: pr.id,
                assigned_to: pm.user_id,
                created_by: 'system',
                title: `Project Onboarding: ${pr.project_name}`,
                description: `Assigned as creative team member on "${pr.project_name}". Review creative brand guidelines and upcoming deliverables schedule.`,
                status: pr.status === 'completed' ? 'completed' : 'todo',
                priority: 'medium',
                due_date: pr.deadline || pr.start_date,
                created_at: pr.created_at || new Date().toISOString(),
                updated_at: pr.updated_at || new Date().toISOString(),
              });
            }
          }
        });
      }

      setTasks(Array.from(taskMap.values()));
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e: any) {
      console.error('Error loading database data:', e);
      setDbError(e?.message || 'Failed to fetch data from database');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Load data on mount & setup Realtime subscription
  useEffect(() => {
    // Explicitly purge legacy zeromedia.lk@gmail.com account
    recordDeletedUser('6cdd37f7-38fa-4fb0-8a7b-b7324d80f83c', 'zeromedia.lk@gmail.com');
    removeStoredCustomProfile('6cdd37f7-38fa-4fb0-8a7b-b7324d80f83c');

    refreshAllData();

    const supabase = getSupabase();
    if (supabase) {
      (async () => {
        try {
          await supabase
            .from('profiles')
            .delete()
            .or('email.eq.zeromedia.lk@gmail.com,id.eq.6cdd37f7-38fa-4fb0-8a7b-b7324d80f83c');
        } catch {
          // ignore
        }
      })();

      const channel = supabase
        .channel('zerohub-realtime-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => refreshAllData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => refreshAllData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'client_users' }, () => refreshAllData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => refreshAllData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'content_items' }, () => refreshAllData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'content_versions' }, () => refreshAllData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => refreshAllData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'approvals' }, () => refreshAllData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => refreshAllData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => refreshAllData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_logs' }, () => refreshAllData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'app_options' }, () => refreshAllData())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [refreshAllData]);

  // Re-fetch database data as soon as a user signs in or user identity changes
  useEffect(() => {
    if (currentUser?.id) {
      refreshAllData();
    }
  }, [currentUser?.id, refreshAllData]);

  // Log activity helper (always writes directly to database)
  const logActivity = useCallback(async (action: string, entity_type: ActivityLog['entity_type'], entity_id?: string, metadata?: Record<string, any>) => {
    const supabase = getSupabase();
    const userId = currentUser?.id || profiles[0]?.id || 'unknown';

    const localLog: ActivityLog = {
      id: crypto.randomUUID(),
      user_id: userId,
      action,
      entity_type,
      entity_id,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    };
    setActivityLogs((prev) => [localLog, ...prev]);

    if (supabase) {
      try {
        await supabase.from('activity_logs').insert([{
          user_id: userId,
          action,
          entity_type,
          entity_id: entity_id && entity_id.includes('-') ? entity_id : undefined,
          metadata: metadata || {},
        }]);
      } catch (err) {
        console.warn('Database activity log error:', err);
      }
    }
  }, [currentUser]);

  // Create notification helper (always writes directly to database)
  const createNotification = useCallback(async (
    userId: string,
    title: string,
    message: string,
    type: Notification['type'],
    relatedProjectId?: string,
    relatedContentId?: string
  ) => {
    const supabase = getSupabase();
    const localNotif: Notification = {
      id: crypto.randomUUID(),
      user_id: userId,
      title,
      message,
      type,
      related_project_id: relatedProjectId,
      related_content_id: relatedContentId,
      read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [localNotif, ...prev]);

    if (supabase) {
      try {
        await supabase.from('notifications').insert([{
          user_id: userId,
          title,
          message,
          type,
          related_project_id: relatedProjectId && relatedProjectId.includes('-') ? relatedProjectId : undefined,
          related_content_id: relatedContentId && relatedContentId.includes('-') ? relatedContentId : undefined,
          read: false,
        }]);
      } catch (err) {
        console.warn('Database notification error:', err);
      }
    }
  }, []);

  // Determine client ID associated with current user if role is client
  const associatedClient = useMemo(() => {
    if (currentUser?.role !== 'client') return null;
    const matched = clientUsers.find((cu) => cu.user_id === currentUser.id);
    if (matched?.client_id) return matched.client_id;
    // Fallback: match by email in clients list if not mapped in client_users
    const byEmail = clients.find((c) => c.email.toLowerCase() === currentUser.email.toLowerCase());
    if (byEmail?.id) return byEmail.id;
    // Fallback: If not explicitly linked, bind to first company workspace
    return clients.length > 0 ? clients[0].id : null;
  }, [currentUser, clientUsers, clients]);

  // Filtered collections according to role
  const filteredClients = useMemo(() => {
    if (!currentUser) return clients;
    if (role === 'client') {
      if (!associatedClient) return clients.length > 0 ? [clients[0]] : [];
      return clients.filter((c) => c.id === associatedClient);
    }
    return clients;
  }, [clients, currentUser, role, associatedClient]);

  const filteredProjects = useMemo(() => {
    if (!currentUser) return projects;
    if (role === 'client') {
      if (!associatedClient) return projects;
      return projects.filter((p) => p.client_id === associatedClient);
    }
    if (role === 'editor') {
      const myProjectIds = projectMembers
        .filter((pm) => pm.user_id === currentUser.id)
        .map((pm) => pm.project_id);
      const assigned = projects.filter((p) => myProjectIds.includes(p.id) || p.project_manager_id === currentUser.id);
      return assigned.length > 0 ? assigned : projects;
    }
    return projects;
  }, [projects, currentUser, role, associatedClient, projectMembers]);

  const filteredMonthlyCycles = useMemo(() => {
    if (!currentUser) return monthlyCycles;
    if (role === 'client') {
      if (!associatedClient) return [];
      return monthlyCycles.filter((c) => c.client_id === associatedClient);
    }
    return monthlyCycles;
  }, [monthlyCycles, currentUser, role, associatedClient]);

  const filteredRecurringTemplates = useMemo(() => {
    if (!currentUser) return recurringTemplates;
    if (role === 'client') {
      if (!associatedClient) return [];
      return recurringTemplates.filter((t) => t.client_id === associatedClient);
    }
    return recurringTemplates;
  }, [recurringTemplates, currentUser, role, associatedClient]);

  const filteredContentItems = useMemo(() => {
    if (!currentUser) return contentItems;
    if (role === 'client') {
      if (!associatedClient) return [];
      return contentItems.filter((c) => c.client_id === associatedClient);
    }
    if (role === 'qc') {
      // QC specialists inspect all deliverables, especially items in internal review, client review, and revision loops
      return contentItems;
    }
    if (role === 'videographer') {
      return contentItems.filter(
        (c) =>
          c.assigned_to === currentUser.id ||
          c.contributors?.some((cb) => cb.user_id === currentUser.id) ||
          (c.content_type === 'video' || c.content_type === 'reel') ||
          filteredProjects.some((p) => p.id === c.project_id)
      );
    }
    if (role === 'editor') {
      return contentItems.filter(
        (c) =>
          c.assigned_to === currentUser.id ||
          c.contributors?.some((cb) => cb.user_id === currentUser.id) ||
          filteredProjects.some((p) => p.id === c.project_id)
      );
    }
    if (role === 'copy_editor') {
      return contentItems.filter(
        (c) =>
          c.assigned_to === currentUser.id ||
          c.created_by === currentUser.id ||
          c.contributors?.some((cb) => cb.user_id === currentUser.id) ||
          ['idea', 'planned', 'assigned', 'in_production', 'changes_requested'].includes(c.status)
      );
    }
    if (['graphic_designer', 'audio_engineer', 'colorist'].includes(role || '')) {
      return contentItems.filter(
        (c) =>
          c.assigned_to === currentUser.id ||
          c.contributors?.some((cb) => cb.user_id === currentUser.id) ||
          filteredProjects.some((p) => p.id === c.project_id)
      );
    }
    return contentItems;
  }, [contentItems, currentUser, role, associatedClient, filteredProjects]);

  const filteredTasks = useMemo(() => {
    if (!currentUser) return tasks;
    if (role === 'client') {
      if (!associatedClient) return [];
      const clientProjectIds = filteredProjects.map((p) => p.id);
      return tasks.filter((t) => clientProjectIds.includes(t.project_id));
    }
    return tasks;
  }, [tasks, currentUser, role, filteredProjects, associatedClient]);

  const filteredFiles = useMemo(() => {
    if (!currentUser) return files;
    if (role === 'client') {
      if (!associatedClient) return [];
      return files.filter((f) => f.client_id === associatedClient);
    }
    return files;
  }, [files, currentUser, role, associatedClient]);

  const filteredNotifications = useMemo(() => {
    if (!currentUser) return notifications;
    return notifications.filter((n) => n.user_id === currentUser.id);
  }, [notifications, currentUser]);

  // Dynamic Options Management
  const getOptionsByCategory = useCallback((category: OptionCategory | string) => {
    return appOptions
      .filter((opt) => opt.category === category && opt.is_active !== false)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [appOptions]);

  const addOption = async (optionData: Omit<AppOption, 'id'>): Promise<AppOption | null> => {
    setIsSaving(true);
    setDbError(null);
    const supabase = getSupabase();

    const newId = crypto.randomUUID();
    const newOption: AppOption = {
      ...optionData,
      id: newId,
      created_at: new Date().toISOString(),
    };

    // Optimistic state
    setAppOptions((prev) => [...prev, newOption]);

    if (supabase) {
      try {
        const { data, error } = await supabase.from('app_options').insert([{
          category: optionData.category,
          key: optionData.key,
          label: optionData.label,
          is_active: optionData.is_active ?? true,
          sort_order: optionData.sort_order ?? 99,
          metadata: optionData.metadata || {},
        }]).select();

        if (error) {
          // If table not yet created, persist in system activity log
          await supabase.from('activity_logs').insert([{
            user_id: currentUser?.id || profiles[0]?.id || 'unknown',
            action: `Added option ${optionData.label} (${optionData.category})`,
            entity_type: 'system',
            metadata: { custom_app_options: [...appOptions, newOption] },
          }]);
        } else if (data && data[0]) {
          setAppOptions((prev) => prev.map((o) => (o.id === newId ? (data[0] as AppOption) : o)));
        }

        logActivity(`Created dynamic option "${optionData.label}" in ${optionData.category}`, 'system', newId);
        setIsSaving(false);
        return newOption;
      } catch (err: any) {
        setDbError(err?.message || 'Failed to save option');
      }
    }

    setIsSaving(false);
    return newOption;
  };

  const updateOption = async (id: string, updates: Partial<AppOption>): Promise<boolean> => {
    setIsSaving(true);
    setDbError(null);
    setAppOptions((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('app_options').update(updates).eq('id', id);
        logActivity(`Updated option ${id}`, 'system', id);
      } catch (err: any) {
        console.warn('Update option fallback:', err);
      }
    }
    setIsSaving(false);
    return true;
  };

  const deleteOption = async (id: string): Promise<boolean> => {
    setIsSaving(true);
    setDbError(null);
    setAppOptions((prev) => prev.filter((o) => o.id !== id));

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('app_options').delete().eq('id', id);
      } catch (err: any) {
        console.warn('Delete option fallback:', err);
      }
    }
    setIsSaving(false);
    return true;
  };

  // ==========================================
  // CLIENT MUTATIONS
  // ==========================================
  const addClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client | null> => {
    setIsSaving(true);
    setDbError(null);
    const supabase = getSupabase();

    if (!supabase) {
      setIsSaving(false);
      setDbError('Database client is not connected.');
      return null;
    }

    try {
      const payload = {
        company_name: clientData.company_name.trim(),
        contact_person: clientData.contact_person.trim(),
        email: clientData.email.trim(),
        phone: clientData.phone.trim(),
        address: clientData.address?.trim() || null,
        industry: clientData.industry.trim(),
        notes: clientData.notes?.trim() || null,
        status: clientData.status || 'active',
        logo_url: clientData.logo_url || null,
        assigned_pm_id: clientData.assigned_pm_id && clientData.assigned_pm_id.includes('-') ? clientData.assigned_pm_id : null,
      };

      const { data, error } = await supabase.from('clients').insert([payload]).select();

      if (error) {
        setDbError(`Failed to save client: ${error.message}`);
        setIsSaving(false);
        return null;
      }

      if (data && data[0]) {
        const createdClient = data[0] as Client;
        setClients((prev) => [createdClient, ...prev]);
        logActivity(`Added new client "${createdClient.company_name}"`, 'client', createdClient.id, { company: createdClient.company_name });
        setIsSaving(false);
        return createdClient;
      }
    } catch (e: any) {
      setDbError(e?.message || 'Database error creating client');
    }

    setIsSaving(false);
    return null;
  };

  const updateClient = async (id: string, updates: Partial<Client>): Promise<boolean> => {
    setIsSaving(true);
    setDbError(null);
    const supabase = getSupabase();

    try {
      if (supabase) {
        const { error } = await supabase.from('clients').update(updates).eq('id', id);
        if (error) {
          setDbError(error.message);
          setIsSaving(false);
          return false;
        }
      }

      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c))
      );
      const client = clients.find((c) => c.id === id);
      logActivity(`Updated client details for "${client?.company_name || id}"`, 'client', id);
      setIsSaving(false);
      return true;
    } catch (e: any) {
      setDbError(e?.message || 'Failed to update client');
      setIsSaving(false);
      return false;
    }
  };

  const archiveClient = async (id: string): Promise<boolean> => {
    const client = clients.find((c) => c.id === id);
    const newStatus = client?.status === 'active' ? 'archived' : 'active';
    return updateClient(id, { status: newStatus });
  };

  // ==========================================
  // PROJECT MUTATIONS
  // ==========================================
  const addProject = async (
    projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>,
    memberIds: string[] = [],
    initialCycleTargets?: ProjectDeliverableTarget[]
  ): Promise<Project | null> => {
    setIsSaving(true);
    setDbError(null);
    const supabase = getSupabase();
    const pmId = projectData.project_manager_id && projectData.project_manager_id.includes('-')
      ? projectData.project_manager_id
      : currentUser?.id || profiles[0]?.id || 'unknown';

    const newId = crypto.randomUUID();
    let createdProject: Project = {
      ...projectData,
      id: newId,
      project_manager_id: pmId,
      project_type: projectData.project_type || 'one_time',
      deliverable_targets: initialCycleTargets || projectData.deliverable_targets || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (supabase) {
        const payload: any = {
          client_id: projectData.client_id,
          project_manager_id: pmId,
          project_name: projectData.project_name.trim(),
          description: projectData.description?.trim() || '',
          status: projectData.status || 'planning',
          priority: projectData.priority || 'medium',
          start_date: projectData.start_date,
          deadline: projectData.deadline,
        };

        // Try inserting with deliverable_targets & project_type if schema supports them
        let result = await supabase.from('projects').insert([{
          ...payload,
          project_type: projectData.project_type || 'one_time',
          deliverable_targets: initialCycleTargets || projectData.deliverable_targets || [],
        }]).select();

        if (result.error && result.error.code === 'PGRST204') {
          // Fallback without newer columns if table is pending SQL migration
          result = await supabase.from('projects').insert([payload]).select();
        }

        if (result.error) {
          console.warn('Project table insert error, backing up locally:', result.error.message);
        } else if (result.data && result.data[0]) {
          createdProject = result.data[0] as Project;
          createdProject.project_type = projectData.project_type || 'one_time';
          createdProject.deliverable_targets = initialCycleTargets || projectData.deliverable_targets || [];
        }

        // Insert project members if specified
        if (memberIds.length > 0) {
          const membersToInsert = memberIds
            .filter((uId) => uId && uId.includes('-'))
            .map((uId) => ({ project_id: createdProject.id, user_id: uId }));
          
          if (membersToInsert.length > 0) {
            try {
              await supabase.from('project_members').insert(membersToInsert);
            } catch (err) {
              console.warn('project_members insert note:', err);
            }
          }
        }
      }

      setProjects((prev) => [createdProject, ...prev]);

      // Automatic monthly cycle generation for retainers
      if (projectData.project_type === 'monthly_retainer') {
        const cycleBaseDate = projectData.start_date ? new Date(projectData.start_date) : new Date();
        const cycleMonthName = cycleBaseDate.toLocaleString('default', { month: 'long' });
        const cycleMonthNumber = cycleBaseDate.getMonth() + 1;
        const cycleYear = cycleBaseDate.getFullYear();
        const lastDayOfCycle = new Date(cycleYear, cycleMonthNumber, 0).getDate();
        const cycleStart = `${cycleYear}-${String(cycleMonthNumber).padStart(2, '0')}-01`;
        const cycleEnd = `${cycleYear}-${String(cycleMonthNumber).padStart(2, '0')}-${String(lastDayOfCycle).padStart(2, '0')}`;

        await addMonthlyCycle({
          project_id: createdProject.id,
          client_id: createdProject.client_id,
          month_name: cycleMonthName,
          month_number: cycleMonthNumber,
          year: cycleYear,
          start_date: cycleStart,
          end_date: cycleEnd,
          status: 'in_progress',
          deliverable_targets: initialCycleTargets || [
            { content_type: 'social_media_post', label: 'Posts', target_count: 4 },
            { content_type: 'reel', label: 'Reels', target_count: 4 },
          ],
          notes: `Initial ${cycleMonthName} ${cycleYear} retainer cycle.`,
        });
      }

      // Automatically create a kickoff task for the assigned Project Manager
      if (createdProject.project_manager_id) {
        await addTask({
          project_id: createdProject.id,
          assigned_to: createdProject.project_manager_id,
          created_by: currentUser?.id || profiles[0]?.id || 'unknown',
          title: `Project Setup & Kickoff: ${createdProject.project_name}`,
          description: `Lead coordination for project "${createdProject.project_name}". Review deliverables schedule, retainer cycles, and coordinate team members.`,
          status: 'in_progress',
          priority: createdProject.priority || 'medium',
          due_date: createdProject.deadline || createdProject.start_date,
          checklist: [
            { id: 'pchk_1', text: 'Confirm brand brief & client communication channel', done: false },
            { id: 'pchk_2', text: 'Setup monthly retainer cycle targets & publishing queue', done: false },
            { id: 'pchk_3', text: 'Assign videographers, editors, and creators', done: false },
          ],
        });
      }

      // Automatically create onboarding tasks for assigned team members
      if (memberIds && memberIds.length > 0) {
        for (const mId of memberIds) {
          if (mId && mId !== createdProject.project_manager_id) {
            await addTask({
              project_id: createdProject.id,
              assigned_to: mId,
              created_by: currentUser?.id || profiles[0]?.id || 'unknown',
              title: `Project Onboarding: ${createdProject.project_name}`,
              description: `Assigned as creative team member on "${createdProject.project_name}". Review creative brand guidelines and upcoming deliverables schedule.`,
              status: 'todo',
              priority: 'medium',
              due_date: createdProject.deadline || createdProject.start_date,
            });
          }
        }
      }

      logActivity(`Created project "${createdProject.project_name}"`, 'project', createdProject.id);
      setIsSaving(false);
      return createdProject;
    } catch (e: any) {
      setDbError(e?.message || 'Database error creating project');
    }

    setIsSaving(false);
    return null;
  };

  const updateProject = async (id: string, updates: Partial<Project>): Promise<boolean> => {
    setIsSaving(true);
    setDbError(null);
    const supabase = getSupabase();

    try {
      if (supabase) {
        // Strip targets if column not in DB
        const payload = { ...updates };
        const { error } = await supabase.from('projects').update(payload).eq('id', id);
        if (error && error.code === 'PGRST204') {
          delete (payload as any).deliverable_targets;
          delete (payload as any).project_type;
          await supabase.from('projects').update(payload).eq('id', id);
        }
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p))
      );
      const p = projects.find((proj) => proj.id === id);
      logActivity(`Updated project "${p?.project_name || id}"`, 'project', id);
      setIsSaving(false);
      return true;
    } catch (e: any) {
      setDbError(e?.message || 'Failed to update project');
      setIsSaving(false);
      return false;
    }
  };

  const updateProjectStatus = async (id: string, status: ProjectStatus): Promise<boolean> => {
    return updateProject(id, { status });
  };

  // ==========================================
  // MONTHLY CYCLE MUTATIONS
  // ==========================================
  const addMonthlyCycle = async (cycleData: Omit<MonthlyCycle, 'id' | 'created_at' | 'updated_at'>): Promise<MonthlyCycle | null> => {
    setIsSaving(true);
    setDbError(null);
    const supabase = getSupabase();

    const newId = crypto.randomUUID();
    const newCycle: MonthlyCycle = {
      ...cycleData,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setMonthlyCycles((prev) => [newCycle, ...prev]);

    if (supabase) {
      try {
        const { data, error } = await supabase.from('monthly_cycles').insert([{
          project_id: cycleData.project_id,
          client_id: cycleData.client_id,
          month_name: cycleData.month_name,
          month_number: cycleData.month_number,
          year: cycleData.year,
          start_date: cycleData.start_date,
          end_date: cycleData.end_date,
          status: cycleData.status,
          deliverable_targets: cycleData.deliverable_targets || [],
          notes: cycleData.notes,
        }]).select();

        if (error) {
          // If dedicated table is pending migration, persist directly to Supabase activity_logs
          await supabase.from('activity_logs').insert([{
            user_id: currentUser?.id || profiles[0]?.id || 'unknown',
            action: `Created monthly cycle "${cycleData.month_name} ${cycleData.year}"`,
            entity_type: 'project',
            entity_id: cycleData.project_id,
            metadata: { monthly_cycle: newCycle },
          }]);
        } else if (data && data[0]) {
          setMonthlyCycles((prev) => prev.map((c) => (c.id === newId ? (data[0] as MonthlyCycle) : c)));
        }
      } catch (err: any) {
        console.warn('monthly_cycles insert note:', err);
      }
    }

    logActivity(`Created monthly cycle "${newCycle.month_name} ${newCycle.year}"`, 'project', newCycle.project_id);
    setIsSaving(false);
    return newCycle;
  };

  const updateMonthlyCycle = async (id: string, updates: Partial<MonthlyCycle>): Promise<boolean> => {
    setIsSaving(true);
    setMonthlyCycles((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c))
    );

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('monthly_cycles').update(updates).eq('id', id);
      } catch (err) {
        console.warn('update monthly cycle:', err);
      }
    }

    const cycle = monthlyCycles.find((c) => c.id === id);
    logActivity(`Updated monthly cycle "${cycle?.month_name} ${cycle?.year}"`, 'project', cycle?.project_id);
    setIsSaving(false);
    return true;
  };

  const createNextMonthCycle = async (projectId: string, fromCycleId?: string): Promise<MonthlyCycle | null> => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return null;

    const projectCycles = monthlyCycles.filter((c) => c.project_id === projectId);
    const baseCycle = fromCycleId
      ? projectCycles.find((c) => c.id === fromCycleId)
      : [...projectCycles].sort((a, b) => (b.year * 12 + b.month_number) - (a.year * 12 + a.month_number))[0];

    const now = new Date();
    let nextYear = now.getFullYear();
    let nextMonthNumber = now.getMonth() + 2;
    if (nextMonthNumber > 12) {
      nextMonthNumber = 1;
      nextYear += 1;
    }

    if (baseCycle) {
      if (baseCycle.month_number === 12) {
        nextMonthNumber = 1;
        nextYear = baseCycle.year + 1;
      } else {
        nextMonthNumber = baseCycle.month_number + 1;
        nextYear = baseCycle.year;
      }
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const nextMonthName = monthNames[nextMonthNumber - 1];
    const daysInNextMonth = new Date(nextYear, nextMonthNumber, 0).getDate();
    const startDate = `${nextYear}-${String(nextMonthNumber).padStart(2, '0')}-01`;
    const endDate = `${nextYear}-${String(nextMonthNumber).padStart(2, '0')}-${String(daysInNextMonth).padStart(2, '0')}`;

    const carriedTargets = baseCycle?.deliverable_targets || project.deliverable_targets || [
      { content_type: 'social_media_post', label: 'Posts', target_count: 5 },
      { content_type: 'reel', label: 'Reels', target_count: 4 },
    ];

    return addMonthlyCycle({
      project_id: projectId,
      client_id: project.client_id,
      month_name: nextMonthName,
      month_number: nextMonthNumber,
      year: nextYear,
      start_date: startDate,
      end_date: endDate,
      status: 'planning',
      deliverable_targets: carriedTargets.map((t) => ({ ...t })),
      notes: `${nextMonthName} ${nextYear} retainer scope. Targets carried forward.`,
    });
  };

  // ==========================================
  // CONTENT CONTRIBUTORS MUTATIONS
  // ==========================================
  const addContentContributor = async (
    dataOrContentId: string | Omit<ContentContributor, 'id'>,
    userId?: string,
    roleInContent?: string
  ) => {
    const data: Omit<ContentContributor, 'id'> =
      typeof dataOrContentId === 'string'
        ? {
            content_id: dataOrContentId,
            user_id: userId || '',
            role_in_content: roleInContent || 'Contributor',
          }
        : dataOrContentId;

    const newId = crypto.randomUUID();
    const newContributor: ContentContributor = {
      ...data,
      id: newId,
      created_at: new Date().toISOString(),
    };
    setContentContributors((prev) => [...prev, newContributor]);

    const supabase = getSupabase();
    if (supabase && data.user_id?.includes('-') && data.content_id?.includes('-')) {
      try {
        await supabase.from('content_contributors').insert([data]);
      } catch (e) {
        console.warn('content contributor insert:', e);
      }
    }

    // Automatically create a task for the contributor so it appears in their task board
    const targetItem = contentItems.find((c) => c.id === data.content_id);
    if (targetItem && data.user_id) {
      const existingTask = tasks.find(
        (t) => t.content_id === targetItem.id && t.assigned_to === data.user_id && t.title.includes(data.role_in_content)
      );
      if (!existingTask) {
        await addTask({
          project_id: targetItem.project_id,
          content_id: targetItem.id,
          assigned_to: data.user_id,
          created_by: currentUser?.id || profiles[0]?.id || 'unknown',
          title: `[${data.role_in_content}] ${targetItem.title}`,
          description: `Production role: ${data.role_in_content} on "${targetItem.title}" (${targetItem.content_type.replace(/_/g, ' ')} on ${targetItem.platform}).\nDue: ${targetItem.internal_due_date || targetItem.due_date}.\nBrief: ${targetItem.brief || 'Contributor assignment'}`,
          status: ['completed', 'published', 'approved'].includes(targetItem.status) ? 'completed' : 'todo',
          priority: targetItem.priority || 'medium',
          due_date: targetItem.internal_due_date || targetItem.due_date,
          checklist: [
            { id: `cchk_1_${Date.now()}`, text: `Execute ${data.role_in_content} assignment`, done: false },
            { id: `cchk_2_${Date.now()}`, text: 'Submit/sync work to main project pipeline', done: false },
          ],
        });
      }
    }
  };

  const removeContentContributor = async (id: string) => {
    setContentContributors((prev) => prev.filter((c) => c.id !== id));
    const supabase = getSupabase();
    if (supabase && id.includes('-')) {
      try {
        await supabase.from('content_contributors').delete().eq('id', id);
      } catch (e) {
        console.warn('remove contributor error:', e);
      }
    }
  };

  // ==========================================
  // RECURRING TEMPLATES MUTATIONS
  // ==========================================
  const addRecurringTemplate = async (templateData: Omit<RecurringContentTemplate, 'id' | 'created_at'>) => {
    const newId = crypto.randomUUID();
    const newTmpl: RecurringContentTemplate = {
      ...templateData,
      id: newId,
      created_at: new Date().toISOString(),
    };
    setRecurringTemplates((prev) => [newTmpl, ...prev]);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('recurring_content_templates').insert([templateData]);
      } catch (e) {
        console.warn('recurring template insert:', e);
      }
    }
    logActivity(`Created template "${templateData.title}"`, 'content', newId);
  };

  const deleteRecurringTemplate = async (id: string) => {
    setRecurringTemplates((prev) => prev.filter((t) => t.id !== id));
    const supabase = getSupabase();
    if (supabase && id.includes('-')) {
      try {
        await supabase.from('recurring_content_templates').delete().eq('id', id);
      } catch (e) {
        console.warn('delete template error:', e);
      }
    }
  };

  const createContentFromTemplate = async (
    templateId: string,
    cycleId?: string,
    overrideDates?: { internal_due_date?: string; publishing_date?: string }
  ) => {
    const tmpl = recurringTemplates.find((t) => t.id === templateId);
    if (!tmpl) return;

    const targetProject = tmpl.project_id ? projects.find((p) => p.id === tmpl.project_id) : projects[0];
    const targetCycle = cycleId
      ? monthlyCycles.find((c) => c.id === cycleId)
      : (targetProject ? getActiveCycleForProject(targetProject.id) : undefined);

    const now = new Date(2026, 9, 4);
    const defaultDueDate = overrideDates?.internal_due_date || new Date(now.getTime() + 5 * 86400000).toISOString().split('T')[0];
    const defaultPublishDate = overrideDates?.publishing_date || new Date(now.getTime() + 8 * 86400000).toISOString().split('T')[0];

    await addContentItem({
      title: `${tmpl.title} (Draft)`,
      content_type: tmpl.content_type,
      platform: tmpl.platform,
      brief: tmpl.brief || '',
      caption: tmpl.caption || '',
      client_id: tmpl.client_id || targetProject?.client_id || '',
      project_id: targetProject?.id || '',
      monthly_cycle_id: targetCycle?.id,
      status: 'planned',
      priority: 'medium',
      assigned_to: tmpl.default_assigned_to,
      due_date: defaultDueDate,
      internal_due_date: defaultDueDate,
      publishing_date: defaultPublishDate,
      created_by: currentUser?.id || profiles[0]?.id || 'unknown',
      notes: tmpl.notes,
    });
  };

  // ==========================================
  // TASK MUTATIONS
  // ==========================================
  const addTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task | null> => {
    setIsSaving(true);
    setDbError(null);
    const supabase = getSupabase();

    const newId = crypto.randomUUID();
    const newTask: Task = {
      ...taskData,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);

    if (supabase) {
      try {
        const payload: any = {
          project_id: taskData.project_id,
          content_id: taskData.content_id && taskData.content_id.includes('-') ? taskData.content_id : null,
          assigned_to: taskData.assigned_to && taskData.assigned_to.includes('-') ? taskData.assigned_to : null,
          created_by: currentUser?.id || profiles[0]?.id || 'unknown',
          title: taskData.title.trim(),
          description: taskData.description || '',
          status: taskData.status || 'todo',
          priority: taskData.priority || 'medium',
          due_date: taskData.due_date,
          checklist: taskData.checklist || [],
        };

        let result = await supabase.from('tasks').insert([payload]).select();
        if (result.error && result.error.code === 'PGRST204') {
          delete payload.content_id;
          result = await supabase.from('tasks').insert([payload]).select();
        }

        if (result.error) {
          console.warn('tasks table insert notice, saving to activity_logs:', result.error.message);
          // Persist directly to database so other users/devices retrieve it
          await supabase.from('activity_logs').insert([{
            user_id: currentUser?.id || profiles[0]?.id || 'unknown',
            action: `Created task "${newTask.title}"`,
            entity_type: 'task',
            entity_id: newTask.project_id,
            metadata: { task_data: newTask },
          }]);
        } else if (result.data && result.data[0]) {
          setTasks((prev) => prev.map((t) => (t.id === newId ? (result.data![0] as Task) : t)));
        }
      } catch (err: any) {
        console.warn('Task insert error:', err);
      }
    }

    if (newTask.assigned_to) {
      createNotification(
        newTask.assigned_to,
        'New Task Assigned',
        `You were assigned: "${newTask.title}"`,
        'task',
        newTask.project_id
      );
    }

    logActivity(`Created task "${newTask.title}"`, 'task', newId, { assigned_to: newTask.assigned_to });
    setIsSaving(false);
    return newTask;
  };

  const updateTask = async (id: string, updates: Partial<Task>): Promise<boolean> => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t))
    );

    const supabase = getSupabase();
    if (supabase && id.includes('-')) {
      try {
        await supabase.from('tasks').update(updates).eq('id', id);
      } catch (e) {
        console.warn('update task in database:', e);
      }
    }
    return true;
  };

  const updateTaskStatus = async (id: string, status: TaskStatus): Promise<boolean> => {
    const completedAt = status === 'completed' ? new Date().toISOString() : undefined;
    return updateTask(id, { status, completed_at: completedAt });
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const supabase = getSupabase();
    if (supabase && id.includes('-')) {
      try {
        await supabase.from('tasks').delete().eq('id', id);
      } catch (e) {
        console.warn('delete task in database:', e);
      }
    }
    return true;
  };

  const toggleChecklistItem = async (taskId: string, itemId: string): Promise<boolean> => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.checklist) return false;

    const updatedChecklist = task.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );

    return updateTask(taskId, { checklist: updatedChecklist });
  };

  const syncTasksWithSystem = async (): Promise<number> => {
    let createdCount = 0;
    const currentTasks = [...tasks];

    const hasTask = (pId: string, cId?: string, uId?: string, titlePrefix?: string) => {
      return currentTasks.some((t) => {
        if (t.project_id !== pId) return false;
        if (cId && t.content_id !== cId) return false;
        if (uId && t.assigned_to !== uId) return false;
        if (titlePrefix && !t.title.toLowerCase().includes(titlePrefix.toLowerCase())) return false;
        return true;
      });
    };

    // 1. Content deliverables sync
    for (const item of contentItems) {
      if (item.assigned_to && !hasTask(item.project_id, item.id, item.assigned_to, item.title)) {
        await addTask({
          project_id: item.project_id,
          content_id: item.id,
          assigned_to: item.assigned_to,
          created_by: item.created_by || currentUser?.id || 'system',
          title: `Produce: ${item.title}`,
          description: `Deliverable assignment: ${item.title} (${item.content_type.replace(/_/g, ' ')} on ${item.platform}).\nDue: ${item.internal_due_date || item.due_date}.\nBrief: ${item.brief || 'Complete creative deliverable production according to sprint requirements.'}`,
          status: ['completed', 'published', 'approved'].includes(item.status) ? 'completed' : 'todo',
          priority: item.priority || 'medium',
          due_date: item.internal_due_date || item.due_date,
          checklist: [
            { id: 'chk_1', text: 'Review creative brief & format specs', done: false },
            { id: 'chk_2', text: 'Produce draft / first cut', done: false },
            { id: 'chk_3', text: 'Upload v1 preview for QA and client review', done: false },
          ],
        });
        createdCount++;
      }

      // Contributors on item
      const itemContribs = contentContributors.filter((cc) => cc.content_id === item.id);
      for (const contrib of itemContribs) {
        if (contrib.user_id && !hasTask(item.project_id, item.id, contrib.user_id, contrib.role_in_content)) {
          await addTask({
            project_id: item.project_id,
            content_id: item.id,
            assigned_to: contrib.user_id,
            created_by: item.created_by || currentUser?.id || 'system',
            title: `[${contrib.role_in_content}] ${item.title}`,
            description: `Production role: ${contrib.role_in_content} on "${item.title}". Platform: ${item.platform}. Due: ${item.internal_due_date || item.due_date}.`,
            status: ['completed', 'published', 'approved'].includes(item.status) ? 'completed' : 'todo',
            priority: item.priority || 'medium',
            due_date: item.internal_due_date || item.due_date,
            checklist: [
              { id: 'cchk_1', text: `Execute ${contrib.role_in_content} requirements`, done: false },
              { id: 'cchk_2', text: 'Submit assets to lead editor/project pipeline', done: false },
            ],
          });
          createdCount++;
        }
      }

      // Revisions requested
      if (item.status === 'changes_requested') {
        const boundIds = new Set<string>();
        if (item.assigned_to) boundIds.add(item.assigned_to);
        itemContribs.forEach((c) => boundIds.add(c.user_id));
        if (boundIds.size === 0) {
          const pr = projects.find((p) => p.id === item.project_id);
          if (pr?.project_manager_id) boundIds.add(pr.project_manager_id);
        }

        const revDue = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];
        const latestComment = approvals.find((a) => a.content_id === item.id && a.status === 'changes_requested')?.comment || item.notes || 'Please make adjustments based on client review.';

        for (const bId of Array.from(boundIds)) {
          if (!hasTask(item.project_id, item.id, bId, '[Client Revision]')) {
            await addTask({
              project_id: item.project_id,
              content_id: item.id,
              assigned_to: bId,
              created_by: currentUser?.id || 'system',
              title: `[Client Revision] ${item.title}`,
              description: `Client requested changes on "${item.title}":\n\n"${latestComment}"\n\nPlease apply requested adjustments and upload a new cut/version for review.`,
              status: 'todo',
              priority: 'urgent',
              due_date: revDue,
              checklist: [
                { id: 'rev_1', text: 'Review client feedback notes & instructions', done: false },
                { id: 'rev_2', text: 'Apply revisions and adjustments to cut', done: false },
                { id: 'rev_3', text: 'Upload revised cut for review', done: false },
              ],
            });
            createdCount++;
          }
        }
      }
    }

    // 2. Projects sync
    for (const pr of projects) {
      if (pr.project_manager_id && !hasTask(pr.id, undefined, pr.project_manager_id, 'Project Setup & Kickoff')) {
        await addTask({
          project_id: pr.id,
          assigned_to: pr.project_manager_id,
          created_by: currentUser?.id || 'system',
          title: `Project Setup & Kickoff: ${pr.project_name}`,
          description: `Lead coordination for project "${pr.project_name}". Review deliverables schedule, retainer cycles, and coordinate team members.`,
          status: pr.status === 'completed' ? 'completed' : 'in_progress',
          priority: pr.priority || 'medium',
          due_date: pr.deadline || pr.start_date,
          checklist: [
            { id: 'pchk_1', text: 'Confirm brand brief & client communication channel', done: false },
            { id: 'pchk_2', text: 'Setup monthly retainer cycle targets & publishing queue', done: false },
            { id: 'pchk_3', text: 'Assign videographers, editors, and creators', done: false },
          ],
        });
        createdCount++;
      }

      const members = projectMembers.filter((pm) => pm.project_id === pr.id);
      for (const m of members) {
        if (m.user_id !== pr.project_manager_id && !hasTask(pr.id, undefined, m.user_id, 'Project Onboarding')) {
          await addTask({
            project_id: pr.id,
            assigned_to: m.user_id,
            created_by: currentUser?.id || 'system',
            title: `Project Onboarding: ${pr.project_name}`,
            description: `Assigned as creative team member on "${pr.project_name}". Review creative brand guidelines and upcoming deliverables schedule.`,
            status: pr.status === 'completed' ? 'completed' : 'todo',
            priority: 'medium',
            due_date: pr.deadline || pr.start_date,
          });
          createdCount++;
        }
      }
    }

    return createdCount;
  };

  // ==========================================
  // CONTENT ITEM MUTATIONS
  // ==========================================
  const addContentItem = async (
    itemData: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>,
    contributors?: { user_id: string; role_in_content: string }[]
  ): Promise<ContentItem | null> => {
    setIsSaving(true);
    setDbError(null);
    const supabase = getSupabase();

    const internalDue = itemData.internal_due_date || itemData.due_date;
    const createdBy = currentUser?.id || profiles[0]?.id || 'unknown';
    const assignedTo = itemData.assigned_to && itemData.assigned_to.includes('-') ? itemData.assigned_to : null;

    const finalPlatforms: Platform[] =
      Array.isArray(itemData.platforms) && itemData.platforms.length > 0
        ? itemData.platforms
        : [itemData.platform || 'instagram'];
    const primaryPlatform: Platform = itemData.platform || finalPlatforms[0] || 'instagram';

    let createdItem: ContentItem = {
      ...itemData,
      platform: primaryPlatform,
      platforms: finalPlatforms,
      id: crypto.randomUUID(),
      due_date: internalDue,
      internal_due_date: internalDue,
      created_by: createdBy,
      priority: itemData.priority || 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (supabase) {
        const basePayload: any = {
          project_id: itemData.project_id,
          client_id: itemData.client_id,
          title: itemData.title.trim(),
          content_type: itemData.content_type,
          platform: primaryPlatform,
          brief: itemData.brief?.trim() || '',
          caption: itemData.caption?.trim() || '',
          status: itemData.status || 'idea',
          due_date: internalDue,
          publishing_date: itemData.publishing_date || null,
          created_by: createdBy,
          thumbnail_url: itemData.thumbnail_url || null,
          assigned_to: assignedTo,
        };

        // Attempt full insert with platforms, priority, internal_due_date, monthly_cycle_id
        let result = await supabase.from('content_items').insert([{
          ...basePayload,
          platforms: finalPlatforms,
          priority: itemData.priority || 'medium',
          internal_due_date: internalDue,
          production_start_date: itemData.production_start_date || null,
          client_review_date: itemData.client_review_date || null,
          monthly_cycle_id: itemData.monthly_cycle_id && itemData.monthly_cycle_id.includes('-') ? itemData.monthly_cycle_id : null,
        }]).select();

        if (result.error && (result.error.code === 'PGRST204' || result.error.message?.includes('platforms'))) {
          // Fallback without platforms if table is pending SQL migration
          result = await supabase.from('content_items').insert([{
            ...basePayload,
            priority: itemData.priority || 'medium',
            internal_due_date: internalDue,
            production_start_date: itemData.production_start_date || null,
            client_review_date: itemData.client_review_date || null,
            monthly_cycle_id: itemData.monthly_cycle_id && itemData.monthly_cycle_id.includes('-') ? itemData.monthly_cycle_id : null,
          }]).select();
          if (result.error && result.error.code === 'PGRST204') {
            result = await supabase.from('content_items').insert([basePayload]).select();
          }
        }

        if (result.error) {
          console.warn('content_items database insert notice, saving in local state:', result.error.message);
        } else if (result.data && result.data[0]) {
          createdItem = result.data[0] as ContentItem;
          createdItem.platform = primaryPlatform;
          createdItem.platforms = finalPlatforms;
          createdItem.priority = itemData.priority || 'medium';
          createdItem.internal_due_date = internalDue;
          createdItem.monthly_cycle_id = itemData.monthly_cycle_id;
        }
      }

      // Add contributors if specified
      if (contributors && contributors.length > 0) {
        for (const c of contributors) {
          await addContentContributor(createdItem.id, c.user_id, c.role_in_content);
        }
      }

      setContentItems((prev) => [createdItem, ...prev]);

      // Automatically create a deliverable task for the assigned user so it appears in their task board!
      if (createdItem.assigned_to) {
        const platformDesc = (createdItem.platforms && createdItem.platforms.length > 1)
          ? `[${createdItem.platforms.join(', ')}]`
          : createdItem.platform;
        await addTask({
          project_id: createdItem.project_id,
          content_id: createdItem.id,
          assigned_to: createdItem.assigned_to,
          created_by: createdItem.created_by,
          title: `Produce: ${createdItem.title}`,
          description: `Deliverable assignment: ${createdItem.title}\nFormat: ${createdItem.content_type.replace(/_/g, ' ')} (${platformDesc})\nDue: ${createdItem.internal_due_date || createdItem.due_date}\nBrief: ${createdItem.brief || 'Complete creative production according to sprint requirements.'}`,
          status: ['completed', 'published', 'approved'].includes(createdItem.status) ? 'completed' : 'todo',
          priority: createdItem.priority || 'medium',
          due_date: createdItem.internal_due_date || createdItem.due_date,
          checklist: [
            { id: `chk_1_${Date.now()}`, text: 'Review creative brief & format specs', done: false },
            { id: `chk_2_${Date.now()}`, text: 'Produce draft / first cut', done: false },
            { id: `chk_3_${Date.now()}`, text: 'Upload v1 preview for QA and client review', done: false },
          ],
        });
      }

      logActivity(`Created content item "${createdItem.title}"`, 'content', createdItem.id, {
        type: createdItem.content_type,
        platform: createdItem.platform,
        platforms: createdItem.platforms,
        publishing_date: createdItem.publishing_date,
      });

      setIsSaving(false);
      return createdItem;
    } catch (e: any) {
      setDbError(e?.message || 'Database error creating content deliverable');
    }

    setIsSaving(false);
    return null;
  };

  const updateContentItem = async (id: string, updates: Partial<ContentItem>): Promise<boolean> => {
    setIsSaving(true);
    setDbError(null);
    const supabase = getSupabase();

    try {
      if (supabase && id.includes('-')) {
        const payload: any = { ...updates };
        delete payload.contributors;
        if (updates.platforms && (!updates.platform || updates.platform.length === 0)) {
          payload.platform = updates.platforms[0] || 'instagram';
        }
        
        let { error } = await supabase.from('content_items').update(payload).eq('id', id);
        if (error && (error.code === 'PGRST204' || error.message?.includes('platforms'))) {
          delete payload.platforms;
          delete payload.priority;
          delete payload.internal_due_date;
          delete payload.monthly_cycle_id;
          await supabase.from('content_items').update(payload).eq('id', id);
        }
      }

      setContentItems((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const internalDue = updates.internal_due_date || updates.due_date || c.internal_due_date || c.due_date;
          const updatedPlatforms = updates.platforms || (updates.platform ? [updates.platform] : c.platforms) || [c.platform];
          const updatedPlatform = updates.platform || (updates.platforms && updates.platforms[0]) || c.platform;
          return {
            ...c,
            ...updates,
            platform: updatedPlatform,
            platforms: updatedPlatforms,
            internal_due_date: internalDue,
            due_date: internalDue,
            updated_at: new Date().toISOString(),
          };
        })
      );

      // If assignee changed, automatically create a task for the new assignee
      const existing = contentItems.find((c) => c.id === id);
      if (updates.assigned_to && updates.assigned_to !== existing?.assigned_to && existing) {
        const hasTask = tasks.some((t) => t.content_id === id && t.assigned_to === updates.assigned_to);
        if (!hasTask) {
          await addTask({
            project_id: existing.project_id,
            content_id: existing.id,
            assigned_to: updates.assigned_to,
            created_by: currentUser?.id || profiles[0]?.id || 'unknown',
            title: `Produce: ${existing.title}`,
            description: `Deliverable assignment: ${existing.title} (${existing.content_type.replace(/_/g, ' ')} on ${existing.platform}).\nDue: ${existing.internal_due_date || existing.due_date}.\nBrief: ${existing.brief || 'Complete creative production according to sprint requirements.'}`,
            status: ['completed', 'published', 'approved'].includes(updates.status || existing.status) ? 'completed' : 'todo',
            priority: existing.priority || 'medium',
            due_date: existing.internal_due_date || existing.due_date,
            checklist: [
              { id: `chk_1_${Date.now()}`, text: 'Review creative brief & format specs', done: false },
              { id: `chk_2_${Date.now()}`, text: 'Produce draft / first cut', done: false },
              { id: `chk_3_${Date.now()}`, text: 'Upload v1 preview for QA and client review', done: false },
            ],
          });
        }
      }

      // If marked completed or published, sync any open deliverable tasks to completed
      if (updates.status === 'completed' || updates.status === 'published') {
        const deliverableTasks = tasks.filter((t) => t.content_id === id && t.status !== 'completed');
        for (const dt of deliverableTasks) {
          await updateTaskStatus(dt.id, 'completed');
        }
      }

      setIsSaving(false);
      return true;
    } catch (e: any) {
      setDbError(e?.message || 'Failed to update content item');
      setIsSaving(false);
      return false;
    }
  };

  const rescheduleContentPublishingDate = async (id: string, newPublishingDate: string): Promise<boolean> => {
    const item = contentItems.find((c) => c.id === id);
    if (!item) return false;

    const ok = await updateContentItem(id, { publishing_date: newPublishingDate });
    if (ok) {
      logActivity(`Rescheduled "${item.title}" to ${newPublishingDate}`, 'content', id, {
        previous: item.publishing_date,
        newPublishingDate,
      });
    }
    return ok;
  };

  const updateContentStatus = async (id: string, newStatus: ContentStatus, note?: string): Promise<boolean> => {
    const item = contentItems.find((c) => c.id === id);
    if (!item) return false;

    const ok = await updateContentItem(id, { status: newStatus });
    if (ok) {
      logActivity(`Changed content "${item.title}" status to "${newStatus.replace('_', ' ')}"`, 'content', id, {
        status: newStatus,
        note,
      });

      // Workflow notification triggers
      if (newStatus === 'client_review') {
        const targetClientUsers = clientUsers.filter((cu) => cu.client_id === item.client_id);
        targetClientUsers.forEach((cu) => {
          createNotification(
            cu.user_id,
            'Content Ready for Review',
            `"${item.title}" is ready for your approval.`,
            'approval',
            item.project_id,
            item.id
          );
        });
      } else if (newStatus === 'changes_requested') {
        const project = projects.find((p) => p.id === item.project_id);
        const client = clients.find((c) => c.id === item.client_id);
        const recipientUserIds = new Set<string>();

        // 1. Lead assignee
        if (item.assigned_to) recipientUserIds.add(item.assigned_to);
        // 2. Project Manager assigned to the project
        if (project?.project_manager_id) recipientUserIds.add(project.project_manager_id);
        // 3. Project Manager assigned to the client
        if (client?.assigned_pm_id) recipientUserIds.add(client.assigned_pm_id);
        // 4. Project team members
        projectMembers
          .filter((pm) => pm.project_id === item.project_id)
          .forEach((pm) => recipientUserIds.add(pm.user_id));
        // 5. Deliverable contributors (Shooting, Editing, Caption, etc.)
        contentContributors
          .filter((cc) => cc.content_id === item.id)
          .forEach((cc) => recipientUserIds.add(cc.user_id));
        // 6. Super admins and other PMs
        profiles
          .filter((p) => p.role === 'super_admin' || p.role === 'project_manager')
          .forEach((p) => recipientUserIds.add(p.id));

        recipientUserIds.forEach((uid) => {
          createNotification(
            uid,
            'Revisions Requested by Client',
            `Client requested revisions on "${item.title}": "${note || 'See revision feedback notes'}"`,
            'changes_requested',
            item.project_id,
            item.id
          );
        });
      } else if (newStatus === 'approved') {
        const project = projects.find((p) => p.id === item.project_id);
        const client = clients.find((c) => c.id === item.client_id);
        const recipientUserIds = new Set<string>();

        if (project?.project_manager_id) recipientUserIds.add(project.project_manager_id);
        if (client?.assigned_pm_id) recipientUserIds.add(client.assigned_pm_id);
        if (item.assigned_to) recipientUserIds.add(item.assigned_to);
        projectMembers
          .filter((pm) => pm.project_id === item.project_id)
          .forEach((pm) => recipientUserIds.add(pm.user_id));
        contentContributors
          .filter((cc) => cc.content_id === item.id)
          .forEach((cc) => recipientUserIds.add(cc.user_id));

        recipientUserIds.forEach((uid) => {
          createNotification(
            uid,
            'Content Approved!',
            `Client approved "${item.title}". Ready for scheduling.`,
            'approval',
            item.project_id,
            item.id
          );
        });
      }
    }
    return ok;
  };

  const addContentVersion = async (contentId: string, versionData: { file_url: string; file_name?: string; notes: string }) => {
    const existing = contentVersions.filter((v) => v.content_id === contentId);
    const newVersionNumber = existing.length + 1;
    const newId = crypto.randomUUID();
    const userId = currentUser?.id || profiles[0]?.id || 'unknown';

    const newVer: ContentVersion = {
      id: newId,
      content_id: contentId,
      version_number: newVersionNumber,
      file_url: versionData.file_url,
      file_name: versionData.file_name || `Version_${newVersionNumber}`,
      uploaded_by: userId,
      notes: versionData.notes,
      created_at: new Date().toISOString(),
    };

    setContentVersions((prev) => {
      const updated = [newVer, ...prev.filter((v) => v.id !== newId)];
      saveStoredContentVersions(updated);
      return updated;
    });
    saveStoredContentVersion(newVer);

    const item = contentItems.find((c) => c.id === contentId);
    const todayDate = new Date().toISOString().split('T')[0];

    // Automatically transition workflow pipeline stage to client_review upon new version upload
    const shouldAutoAdvance = !item || ['changes_requested', 'in_production', 'internal_review', 'assigned'].includes(item.status);
    const targetStatus: ContentStatus = shouldAutoAdvance ? 'client_review' : item.status;

    await updateContentItem(contentId, {
      thumbnail_url: versionData.file_url,
      status: targetStatus,
      client_review_date: todayDate,
      notes: '', // Clear previous customer change request notes so the revision message closes
    });

    if (shouldAutoAdvance) {
      await updateContentStatus(contentId, 'client_review', `Version ${newVersionNumber} uploaded and queued for client review`);
    }

    // Automatically complete any pending client revision tasks for this deliverable
    const revisionTasks = tasks.filter(
      (t) => t.content_id === contentId && t.title.startsWith('[Client Revision]') && t.status !== 'completed'
    );
    for (const rt of revisionTasks) {
      await updateTaskStatus(rt.id, 'completed');
    }

    const supabase = getSupabase();
    if (supabase && contentId.includes('-')) {
      try {
        const { error: verInsertErr } = await supabase.from('content_versions').insert([{
          content_id: contentId,
          version_number: newVersionNumber,
          file_url: versionData.file_url,
          file_name: versionData.file_name || `Version_${newVersionNumber}`,
          uploaded_by: userId,
          notes: versionData.notes,
        }]);

        if (verInsertErr) {
          console.warn('content_versions database insert warning, backing up to activity logs:', verInsertErr.message);
          await supabase.from('activity_logs').insert([{
            user_id: userId,
            action: `Uploaded Version ${newVersionNumber} for "${item?.title || contentId}"`,
            entity_type: 'content',
            entity_id: contentId,
            metadata: { version_record: newVer },
          }]);
        }
      } catch (e) {
        console.warn('version upload database exception:', e);
      }
    }

    // Proactively notify client users about the uploaded deliverable version
    if (item?.client_id) {
      const targetClientUsers = clientUsers.filter((cu) => cu.client_id === item.client_id);
      targetClientUsers.forEach((cu) => {
        createNotification(
          cu.user_id,
          `New Version Uploaded (V${newVersionNumber})`,
          `"${item.title}" Version ${newVersionNumber} has been uploaded and is ready for your review.`,
          'approval',
          item.project_id,
          item.id
        );
      });
    }

    logActivity(`Uploaded Version ${newVersionNumber} for "${item?.title || contentId}"`, 'content', contentId, {
      version_record: newVer,
      version_number: newVersionNumber,
      file_name: newVer.file_name,
    });
  };

  const approveContent = async (contentId: string, comment?: string) => {
    const item = contentItems.find((c) => c.id === contentId);
    if (!item) return;

    const userId = currentUser?.id || profiles[0]?.id || 'unknown';
    const noteText = comment || 'Approved by client.';
    const newApproval: Approval = {
      id: crypto.randomUUID(),
      content_id: contentId,
      client_user_id: userId,
      status: 'approved',
      comment: noteText,
      created_at: new Date().toISOString(),
    };
    setApprovals((prev) => [newApproval, ...prev]);

    const supabase = getSupabase();
    if (supabase && contentId.includes('-')) {
      try {
        const { error } = await supabase.from('approvals').insert([{
          content_id: contentId,
          client_user_id: userId,
          status: 'approved',
          comment: noteText,
        }]);
        if (error) {
          await supabase.from('activity_logs').insert([{
            user_id: userId,
            action: `Client approved "${item.title}"`,
            entity_type: 'content',
            entity_id: contentId,
            metadata: { approval_record: newApproval },
          }]);
        }
      } catch (e) {
        console.warn('approval insert error:', e);
      }
    }

    const todayDate = new Date().toISOString().split('T')[0];
    setContentItems((prev) =>
      prev.map((c) =>
        c.id === contentId
          ? {
              ...c,
              status: 'approved',
              approval_date: todayDate,
              updated_at: new Date().toISOString(),
            }
          : c
      )
    );

    if (supabase && contentId.includes('-')) {
      try {
        await supabase
          .from('content_items')
          .update({ status: 'approved', approval_date: todayDate })
          .eq('id', contentId);
      } catch (e) {
        console.warn('content item direct approve status update:', e);
      }
    }

    await updateContentItem(contentId, {
      status: 'approved',
      approval_date: todayDate,
    });

    await updateContentStatus(contentId, 'approved', noteText);
    
    // Also record in comments stream so discussion records sign-off
    await addComment({
      contentId,
      projectId: item.project_id,
      comment: `✅ [Client Approved]: ${noteText}`,
    });

    logActivity(`Client approved "${item.title}"`, 'approval', contentId, { comment: noteText, approval_record: newApproval });
  };

  const requestChanges = async (contentId: string, comment: string) => {
    const item = contentItems.find((c) => c.id === contentId);
    if (!item) return;

    const userId = currentUser?.id || profiles[0]?.id || 'unknown';
    const newApproval: Approval = {
      id: crypto.randomUUID(),
      content_id: contentId,
      client_user_id: userId,
      status: 'changes_requested',
      comment,
      created_at: new Date().toISOString(),
    };
    setApprovals((prev) => [newApproval, ...prev]);

    const supabase = getSupabase();
    if (supabase && contentId.includes('-')) {
      try {
        const { error } = await supabase.from('approvals').insert([{
          content_id: contentId,
          client_user_id: userId,
          status: 'changes_requested',
          comment,
        }]);
        if (error) {
          // If approvals table schema or RLS has restriction, preserve in activity_logs
          await supabase.from('activity_logs').insert([{
            user_id: userId,
            action: `Client requested revisions on "${item.title}": ${comment.substring(0, 50)}`,
            entity_type: 'content',
            entity_id: contentId,
            metadata: { approval_record: newApproval },
          }]);
        }
      } catch (e) {
        console.warn('approval request changes error:', e);
      }
    }

    // Update item status and persist revision notes directly on the deliverable
    setContentItems((prev) =>
      prev.map((c) =>
        c.id === contentId
          ? {
              ...c,
              status: 'changes_requested',
              notes: comment,
              updated_at: new Date().toISOString(),
            }
          : c
      )
    );

    if (supabase && contentId.includes('-')) {
      try {
        await supabase
          .from('content_items')
          .update({ status: 'changes_requested', notes: comment })
          .eq('id', contentId);
      } catch (e) {
        console.warn('content item direct status update:', e);
      }
    }

    await updateContentItem(contentId, {
      status: 'changes_requested',
      notes: comment,
    });

    // Notify all team members via status update handler
    await updateContentStatus(contentId, 'changes_requested', comment);

    // Automatically post to item discussion feed so all team members and PM see it in comments
    await addComment({
      contentId,
      projectId: item.project_id,
      comment: `⚠️ [Client Revision Request]: ${comment}`,
    });

    // Automatically create urgent revision tasks for all team members bound to this deliverable
    const boundUserIds = new Set<string>();
    if (item.assigned_to) boundUserIds.add(item.assigned_to);
    contentContributors
      .filter((cc) => cc.content_id === contentId && cc.user_id)
      .forEach((cc) => boundUserIds.add(cc.user_id));

    if (boundUserIds.size === 0) {
      const pr = projects.find((p) => p.id === item.project_id);
      if (pr?.project_manager_id) boundUserIds.add(pr.project_manager_id);
      const cl = clients.find((c) => c.id === item.client_id);
      if (cl?.assigned_pm_id) boundUserIds.add(cl.assigned_pm_id);
    }

    const revisionDueDate = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

    for (const boundUid of Array.from(boundUserIds)) {
      await addTask({
        project_id: item.project_id,
        content_id: item.id,
        assigned_to: boundUid,
        created_by: userId,
        title: `[Client Revision] ${item.title}`,
        description: `Client requested changes on "${item.title}":\n\n"${comment}"\n\nPlease apply requested adjustments and upload a revised cut/version for review.`,
        status: 'todo',
        priority: 'urgent',
        due_date: revisionDueDate,
        checklist: [
          { id: `rchk_1_${Date.now()}`, text: 'Review client feedback notes & instructions', done: false },
          { id: `rchk_2_${Date.now()}`, text: 'Apply revisions and adjustments to cut', done: false },
          { id: `rchk_3_${Date.now()}`, text: 'Upload revised version for client review', done: false },
        ],
      });
    }

    logActivity(`Client requested revisions on "${item.title}"`, 'approval', contentId, { comment, approval_record: newApproval });
  };

  const addComment = async (data: { projectId?: string; contentId?: string; comment: string }) => {
    const userId = currentUser?.id || profiles[0]?.id || 'unknown';
    const newId = crypto.randomUUID();
    const newComment: Comment = {
      id: newId,
      user_id: userId,
      project_id: data.projectId,
      content_id: data.contentId,
      comment: data.comment,
      created_at: new Date().toISOString(),
    };
    setComments((prev) => [...prev, newComment]);

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('comments').insert([{
          user_id: userId,
          project_id: data.projectId && data.projectId.includes('-') ? data.projectId : null,
          content_id: data.contentId && data.contentId.includes('-') ? data.contentId : null,
          comment: data.comment,
        }]);
        if (error) {
          // If comments RLS requires migration script, persist in activity_logs
          await supabase.from('activity_logs').insert([{
            user_id: userId,
            action: `Added comment: ${data.comment.substring(0, 40)}`,
            entity_type: data.contentId ? 'content' : 'project',
            entity_id: data.contentId || data.projectId,
            metadata: { comment_record: newComment },
          }]);
        }
      } catch (e) {
        console.warn('comment insert database:', e);
      }
    }

    logActivity(`Added comment`, 'system', data.contentId || data.projectId);
  };

  const addFile = async (fileData: Omit<FileRecord, 'id' | 'created_at'>) => {
    const newId = crypto.randomUUID();
    const newFile: FileRecord = {
      ...fileData,
      id: newId,
      created_at: new Date().toISOString(),
    };
    setFiles((prev) => [newFile, ...prev]);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('files').insert([{
          client_id: fileData.client_id && fileData.client_id.includes('-') ? fileData.client_id : null,
          project_id: fileData.project_id && fileData.project_id.includes('-') ? fileData.project_id : null,
          content_id: fileData.content_id && fileData.content_id.includes('-') ? fileData.content_id : null,
          uploaded_by: fileData.uploaded_by && fileData.uploaded_by.includes('-') ? fileData.uploaded_by : currentUser?.id,
          file_name: fileData.file_name,
          file_path: fileData.file_path,
          file_type: fileData.file_type,
          file_size: fileData.file_size,
        }]);
      } catch (e) {
        console.warn('file insert error:', e);
      }
    }

    logActivity(`Uploaded file "${newFile.file_name}"`, 'file', newFile.id);
  };

  const deleteFile = async (id: string) => {
    const file = files.find((f) => f.id === id);
    setFiles((prev) => prev.filter((f) => f.id !== id));

    const supabase = getSupabase();
    if (supabase && id.includes('-')) {
      try {
        await supabase.from('files').delete().eq('id', id);
      } catch (e) {
        console.warn('delete file error:', e);
      }
    }

    logActivity(`Removed file "${file?.file_name || id}"`, 'file', id);
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    const supabase = getSupabase();
    if (supabase && id.includes('-')) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
      } catch (e) {
        console.warn('notification update error:', e);
      }
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) =>
      prev.map((n) => (n.user_id === currentUser?.id ? { ...n, read: true } : n))
    );

    const supabase = getSupabase();
    if (supabase && currentUser?.id) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('user_id', currentUser.id);
      } catch (e) {
        console.warn('all notifications update error:', e);
      }
    }
  };

  const linkUserToClient = async (userId: string, clientId: string): Promise<boolean> => {
    if (!userId || !clientId) return false;
    const existing = clientUsers.find((cu) => cu.user_id === userId && cu.client_id === clientId);
    if (existing) return true;

    const newCuId = crypto.randomUUID();
    const newRecord: ClientUser = {
      id: newCuId,
      user_id: userId,
      client_id: clientId,
      created_at: new Date().toISOString(),
    };

    // Replace or assign primary client link for this user
    setClientUsers((prev) => [...prev.filter((cu) => cu.user_id !== userId), newRecord]);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('client_users').delete().eq('user_id', userId);
        await supabase.from('client_users').insert([{
          id: newCuId,
          user_id: userId,
          client_id: clientId,
        }]);
      } catch (e) {
        console.warn('link user to client in database:', e);
      }
    }

    const targetUser = profiles.find((p) => p.id === userId);
    const targetClient = clients.find((c) => c.id === clientId);
    logActivity(
      `Linked client user "${targetUser?.full_name || userId}" to client brand "${targetClient?.company_name || clientId}"`,
      'client',
      clientId
    );
    return true;
  };

  const unlinkUserFromClient = async (userId: string, clientId: string): Promise<boolean> => {
    if (!userId || !clientId) return false;
    setClientUsers((prev) => prev.filter((cu) => !(cu.user_id === userId && cu.client_id === clientId)));

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('client_users').delete().match({ user_id: userId, client_id: clientId });
      } catch (e) {
        console.warn('unlink user from client in database:', e);
      }
    }

    const targetUser = profiles.find((p) => p.id === userId);
    const targetClient = clients.find((c) => c.id === clientId);
    logActivity(
      `Unlinked client user "${targetUser?.full_name || userId}" from brand "${targetClient?.company_name || clientId}"`,
      'client',
      clientId
    );
    return true;
  };

  const getClientForUser = useCallback((userId: string) => {
    const link = clientUsers.find((cu) => cu.user_id === userId);
    if (!link) return undefined;
    return clients.find((c) => c.id === link.client_id);
  }, [clientUsers, clients]);

  const getUsersForClient = useCallback((clientId: string) => {
    const userIds = clientUsers.filter((cu) => cu.client_id === clientId).map((cu) => cu.user_id);
    return profiles.filter((p) => userIds.includes(p.id));
  }, [clientUsers, profiles]);

  const createUserProfile = async (
    userData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>,
    clientId?: string
  ): Promise<Profile | null> => {
    setIsSaving(true);
    setDbError(null);

    const newId = crypto.randomUUID();
    const newProfile: Profile = {
      ...userData,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Save to local storage immediately so it NEVER disappears
    saveStoredCustomProfile(newProfile);

    // 2. Optimistically add to state
    setProfiles((prev) => {
      const filtered = prev.filter(
        (p) => p.id !== newId && p.email.toLowerCase() !== newProfile.email.toLowerCase()
      );
      return [...filtered, newProfile];
    });

    const supabase = getSupabase();
    if (supabase) {
      try {
        const payload: any = {
          id: newId,
          full_name: userData.full_name,
          email: userData.email.toLowerCase(),
          role: userData.role,
          status: userData.status || 'active',
          phone: userData.phone || null,
          job_title: userData.job_title || null,
          password: userData.password || 'zeromedia2026',
        };

        let { data, error } = await supabase.from('profiles').insert([payload]).select();

        // If password column does not exist yet in Supabase table, retry without password column
        if (error && (error.message.includes('password') || error.code === 'PGRST204' || error.code === '42703')) {
          delete payload.password;
          const retry = await supabase.from('profiles').insert([payload]).select();
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          console.warn('Supabase profiles insert error:', error.message, error.details);
          const isFkErr = error.message.toLowerCase().includes('foreign key') || error.message.toLowerCase().includes('profiles_id_fkey');
          const isRlsErr = error.code === '42501' || error.message.toLowerCase().includes('policy') || error.message.toLowerCase().includes('permission');

          if (isFkErr) {
            setDbError(
              `Notice: foreign key constraint on auth.users prevented cloud save ("${error.message}"). The user was safely saved locally! Run the "User Creation & Profiles Fix SQL" in your Supabase SQL Editor to enable full cloud synchronization.`
            );
          } else if (isRlsErr) {
            setDbError(
              `Notice: Row Level Security blocked profile insert. The user was saved locally! Run the "User Creation & Profiles Fix SQL" in Supabase to sync.`
            );
          } else {
            setDbError(`Database notice: ${error.message}. User saved locally.`);
          }
        } else if (data && data[0]) {
          const synced = data[0] as Profile;
          saveStoredCustomProfile(synced);
          setProfiles((prev) => prev.map((p) => (p.id === newId ? synced : p)));
        }
      } catch (e: any) {
        console.warn('create user profile in database error:', e);
        setDbError(e?.message || 'Database connection error while saving user');
      }
    }

    if (clientId) {
      const newCuId = crypto.randomUUID();
      const newRecord: ClientUser = {
        id: newCuId,
        user_id: newId,
        client_id: clientId,
        created_at: new Date().toISOString(),
      };
      setClientUsers((prev) => [...prev, newRecord]);

      if (supabase) {
        try {
          const { error: cuErr } = await supabase.from('client_users').insert([{
            id: newCuId,
            user_id: newId,
            client_id: clientId,
          }]);
          if (cuErr) {
            console.warn('client_users insert notice:', cuErr.message);
          }
        } catch (e) {
          console.warn('create client_users in database:', e);
        }
      }
    }

    logActivity(
      `Created team user "${newProfile.full_name}" (${newProfile.role})`,
      'user',
      newId,
      { custom_profile: newProfile }
    );

    setIsSaving(false);
    return newProfile;
  };

  const updateUserProfile = async (id: string, updates: Partial<Profile>, clientId?: string) => {
    const target = profiles.find((p) => p.id === id);
    if (target) {
      const updated = { ...target, ...updates, updated_at: new Date().toISOString() };
      saveStoredCustomProfile(updated);
    }

    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p))
    );

    const supabase = getSupabase();
    if (supabase && id.includes('-')) {
      try {
        const { error } = await supabase.from('profiles').update(updates).eq('id', id);
        if (error && (error.message?.includes('password') || error.code === 'PGRST204' || error.code === '42703')) {
          const stripped = { ...updates };
          delete stripped.password;
          await supabase.from('profiles').update(stripped).eq('id', id);
        }
      } catch (e) {
        console.warn('update user profile:', e);
      }
    }

    if (clientId !== undefined) {
      if (clientId) {
        await linkUserToClient(id, clientId);
      } else {
        setClientUsers((prev) => prev.filter((cu) => cu.user_id !== id));
        if (supabase) {
          try {
            await supabase.from('client_users').delete().eq('user_id', id);
          } catch (e) {
            console.warn('delete client_users in database:', e);
          }
        }
      }
    }
  };

  const deleteUserProfile = async (id: string): Promise<boolean> => {
    const target = profiles.find(
      (p) => p.id === id || (p.email && p.email.toLowerCase().trim() === String(id).toLowerCase().trim())
    );
    const targetId = target?.id || id;
    const targetEmail = target?.email || (id.includes('@') ? id : '');

    // Record as deleted so this ID and email never reappear across loads
    recordDeletedUser(targetId, targetEmail);
    removeStoredCustomProfile(targetId, targetEmail);

    // 1. Immediately remove from profiles list
    setProfiles((prev) =>
      prev.filter(
        (p) =>
          p.id !== targetId &&
          p.email?.toLowerCase().trim() !== targetEmail.toLowerCase().trim() &&
          !isUserDeleted(p.id, p.email)
      )
    );

    // 2. Remove from client users (removes from client portal access & contacts)
    setClientUsers((prev) => prev.filter((cu) => cu.user_id !== targetId));

    // 3. Remove from project members
    setProjectMembers((prev) => prev.filter((pm) => pm.user_id !== targetId));

    // 4. Remove from content contributors
    setContentContributors((prev) => prev.filter((cc) => cc.user_id !== targetId));

    // 5. Remove notifications for this user
    setNotifications((prev) => prev.filter((n) => n.user_id !== targetId));

    // 6. Remove approvals
    setApprovals((prev) => prev.filter((a) => a.client_user_id !== targetId));

    // 7. Unassign from all projects (if this user was project manager)
    setProjects((prev) =>
      prev.map((proj) => (proj.project_manager_id === targetId ? { ...proj, project_manager_id: undefined } : proj))
    );

    // 8. Unassign from all clients (if this user was assigned PM)
    setClients((prev) =>
      prev.map((cli) => (cli.assigned_pm_id === targetId ? { ...cli, assigned_pm_id: undefined } : cli))
    );

    // 9. Unassign from all tasks (removes from dashboard workload and task assignee filters/options)
    setTasks((prev) =>
      prev.map((task) => (task.assigned_to === targetId ? { ...task, assigned_to: undefined } : task))
    );

    // 10. Unassign from all content items (removes from dashboard deliverables and pipeline)
    setContentItems((prev) =>
      prev.map((ci) => (ci.assigned_to === targetId ? { ...ci, assigned_to: undefined } : ci))
    );

    // Database deletion and cascade cleanup if Supabase is connected
    const supabase = getSupabase();
    if (supabase) {
      // 1. Try server-side RPC procedure if created (bypasses RLS & foreign key locks with SECURITY DEFINER)
      try {
        await supabase.rpc('delete_user_cascade', {
          target_user_id: targetId,
          target_user_email: targetEmail || null,
        });
      } catch (e) {
        try {
          await supabase.rpc('delete_user_profile', {
            user_uuid: targetId,
            user_email: targetEmail || null,
          });
        } catch {}
      }

      // 2. Direct database cascade cleanup fallback
      try {
        const fallbackAdmin = profiles.find((p) => p.id !== targetId && p.role === 'super_admin') || profiles.find((p) => p.id !== targetId);
        const fallbackAdminId = fallbackAdmin?.id;

        // Clean unassign on tasks & handle created_by foreign keys
        await supabase.from('tasks').update({ assigned_to: null }).eq('assigned_to', targetId);
        if (fallbackAdminId) {
          await supabase.from('tasks').update({ created_by: fallbackAdminId }).eq('created_by', targetId);
        } else {
          try { await supabase.from('tasks').update({ created_by: null }).eq('created_by', targetId); } catch {}
        }

        // Clean unassign on content items & handle created_by foreign keys
        await supabase.from('content_items').update({ assigned_to: null }).eq('assigned_to', targetId);
        if (fallbackAdminId) {
          await supabase.from('content_items').update({ created_by: fallbackAdminId }).eq('created_by', targetId);
        } else {
          try { await supabase.from('content_items').update({ created_by: null }).eq('created_by', targetId); } catch {}
        }

        // Unassign projects and clients
        await supabase.from('projects').update({ project_manager_id: null }).eq('project_manager_id', targetId);
        await supabase.from('clients').update({ assigned_pm_id: null }).eq('assigned_pm_id', targetId);

        // Remove from relationship tables
        await supabase.from('client_users').delete().eq('user_id', targetId);
        await supabase.from('project_members').delete().eq('user_id', targetId);
        await supabase.from('content_contributors').delete().eq('user_id', targetId);
        await supabase.from('notifications').delete().eq('user_id', targetId);
        await supabase.from('approvals').delete().eq('client_user_id', targetId);

        // Reassign or clean uploads and comments so foreign keys don't block profile deletion
        if (fallbackAdminId) {
          await supabase.from('files').update({ uploaded_by: fallbackAdminId }).eq('uploaded_by', targetId);
          await supabase.from('content_versions').update({ uploaded_by: fallbackAdminId }).eq('uploaded_by', targetId);
          await supabase.from('comments').update({ user_id: fallbackAdminId }).eq('user_id', targetId);
          await supabase.from('activity_logs').update({ user_id: fallbackAdminId }).eq('user_id', targetId);
        } else {
          try { await supabase.from('activity_logs').delete().eq('user_id', targetId); } catch {}
        }

        // Permanently delete profile record by ID and by Email
        await supabase.from('profiles').delete().eq('id', targetId);
        if (targetEmail) {
          await supabase.from('profiles').delete().eq('email', targetEmail.trim().toLowerCase());
          await supabase.from('profiles').delete().eq('email', targetEmail.trim());
        }
      } catch (e: any) {
        console.warn('delete user profile from database fallback error:', e);
      }
    }

    // Notify AuthContext and any external listeners
    window.dispatchEvent(
      new CustomEvent('zerohub-profiles-changed', {
        detail: { id: targetId, email: targetEmail, removed: true },
      })
    );

    logActivity(`Deleted user account "${target?.full_name || targetId}" (${target?.role || 'user'})`, 'user', targetId);
    return true;
  };

  const toggleUserStatus = async (id: string) => {
    const p = profiles.find((prof) => prof.id === id);
    if (!p) return;
    const nextStatus = p.status === 'active' ? 'inactive' : 'active';
    await updateUserProfile(id, { status: nextStatus });
    logActivity(`Changed user status of "${p.full_name}" to ${nextStatus}`, 'user', id);
  };

  // Helper selectors & Calculations
  const getClientById = useCallback((id: string) => clients.find((c) => c.id === id), [clients]);
  const getProfileById = useCallback((id: string) => profiles.find((p) => p.id === id), [profiles]);
  const getProjectById = useCallback((id: string) => projects.find((p) => p.id === id), [projects]);
  const getContentById = useCallback((id: string) => contentItems.find((c) => c.id === id), [contentItems]);
  const getCycleById = useCallback((id: string) => monthlyCycles.find((c) => c.id === id), [monthlyCycles]);
  
  const getCyclesByProjectId = useCallback((projectId: string) =>
    monthlyCycles
      .filter((c) => c.project_id === projectId)
      .sort((a, b) => (b.year * 12 + b.month_number) - (a.year * 12 + a.month_number)),
    [monthlyCycles]
  );

  const getActiveCycleForProject = useCallback((projectId: string) => {
    const projectCycles = getCyclesByProjectId(projectId);
    return (
      projectCycles.find((c) => c.status === 'in_progress') ||
      projectCycles.find((c) => c.status === 'planning') ||
      projectCycles[0]
    );
  }, [getCyclesByProjectId]);

  const getCycleMetrics = useCallback((cycleId: string) => {
    const cycle = monthlyCycles.find((c) => c.id === cycleId);
    const itemsInCycle = contentItems.filter((item) => item.monthly_cycle_id === cycleId);

    const targets = cycle?.deliverable_targets || [];
    const totalTarget = targets.reduce((sum, t) => sum + (Number(t.target_count) || 0), 0) || itemsInCycle.length || 1;

    const completedItems = itemsInCycle.filter((i) => i.status === 'published' || i.status === 'completed');
    const completedCount = completedItems.length;
    const remaining = Math.max(0, totalTarget - completedCount);
    const progressPercent = totalTarget > 0 ? Math.round((completedCount / totalTarget) * 100) : 0;

    const inProduction = itemsInCycle.filter((i) => i.status === 'in_production' || i.status === 'internal_review').length;
    const clientReview = itemsInCycle.filter((i) => i.status === 'client_review').length;
    const planned = itemsInCycle.filter((i) => i.status === 'planned' || i.status === 'idea' || i.status === 'assigned').length;
    const changesRequested = itemsInCycle.filter((i) => i.status === 'changes_requested').length;

    const byType = targets.map((t) => {
      const completedForType = completedItems.filter((i) => {
        if (t.content_type && i.content_type === t.content_type) return true;
        const lbl = t.label.toLowerCase();
        if (lbl.includes('post') && (i.content_type === 'social_media_post' || i.content_type === 'carousel')) return true;
        if (lbl.includes('reel') && (i.content_type === 'reel' || i.content_type === 'video')) return true;
        if (lbl.includes('stor') && i.content_type === 'story') return true;
        return i.title.toLowerCase().includes(lbl);
      }).length;

      return {
        type: t.content_type,
        label: t.label,
        target: t.target_count,
        completed: completedForType,
      };
    });

    return {
      target: totalTarget,
      completed: completedCount,
      remaining,
      progressPercent,
      byType,
      byTarget: byType,
      inProduction,
      clientReview,
      planned,
      changesRequested,
      totalItemsCount: itemsInCycle.length,
    };
  }, [monthlyCycles, contentItems]);

  const getDeadlineWarnings = useCallback(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayTime = today.getTime();

    const activeItems = filteredContentItems.filter((c) => c.status !== 'completed');

    const overdue = activeItems.filter((c) => {
      if (c.status === 'published' || c.status === 'completed') return false;
      const dueDate = c.internal_due_date || c.due_date;
      if (dueDate && dueDate < todayStr) return true;
      if (c.publishing_date && c.publishing_date < todayStr) return true;
      return false;
    });

    const dueSoon = activeItems.filter((c) => {
      if (c.status === 'published' || c.status === 'completed') return false;
      const dueDate = c.internal_due_date || c.due_date;
      if (!dueDate) return false;
      const diff = (new Date(dueDate).getTime() - todayTime) / (1000 * 3600 * 24);
      return diff >= 0 && diff <= 3;
    });

    const publishingApproaching = activeItems.filter((c) => {
      if (!c.publishing_date) return false;
      const diff = (new Date(c.publishing_date).getTime() - todayTime) / (1000 * 3600 * 24);
      return diff >= 0 && diff <= 3;
    });

    const awaitingApproval = activeItems.filter((c) => c.status === 'client_review');

    const publishingNotApproved = activeItems.filter((c) => {
      if (!c.publishing_date) return false;
      const diff = (new Date(c.publishing_date).getTime() - todayTime) / (1000 * 3600 * 24);
      const isNotApproved = ['idea', 'planned', 'assigned', 'in_production', 'internal_review', 'client_review', 'changes_requested'].includes(c.status);
      return diff <= 2 && isNotApproved;
    });

    return {
      overdue,
      dueSoon,
      publishingApproaching,
      awaitingApproval,
      publishingNotApproved,
    };
  }, [filteredContentItems]);

  return (
    <DataContext.Provider
      value={{
        profiles,
        clients,
        projects,
        tasks,
        contentItems,
        contentVersions,
        approvals,
        comments,
        files,
        notifications,
        activityLogs,
        clientUsers,
        projectMembers,
        monthlyCycles,
        contentContributors,
        recurringTemplates,
        appOptions,

        isSaving,
        isLoadingData,
        dbError,
        clearDbError,
        lastSyncTime,
        refreshAllData,

        getOptionsByCategory,
        addOption,
        updateOption,
        deleteOption,

        filteredClients,
        filteredProjects,
        filteredTasks,
        filteredContentItems,
        filteredFiles,
        filteredNotifications,
        filteredMonthlyCycles,
        filteredRecurringTemplates,

        addClient,
        updateClient,
        archiveClient,

        addProject,
        updateProject,
        updateProjectStatus,

        addMonthlyCycle,
        updateMonthlyCycle,
        createNextMonthCycle,

        addContentContributor,
        removeContentContributor,

        addRecurringTemplate,
        deleteRecurringTemplate,
        createContentFromTemplate,

        addTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
        toggleChecklistItem,
        syncTasksWithSystem,

        addContentItem,
        updateContentItem,
        updateContentStatus,
        rescheduleContentPublishingDate,

        addContentVersion,
        approveContent,
        requestChanges,

        addComment,
        addFile,
        deleteFile,

        markNotificationAsRead,
        markAllNotificationsAsRead,

        createUserProfile,
        updateUserProfile,
        deleteUserProfile,
        toggleUserStatus,
        linkUserToClient,
        unlinkUserFromClient,
        getClientForUser,
        getUsersForClient,

        getClientById,
        getProfileById,
        getProjectById,
        getContentById,
        getCycleById,
        getCyclesByProjectId,
        getActiveCycleForProject,
        getCycleMetrics,
        getDeadlineWarnings,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
