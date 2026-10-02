import React, { createContext, useContext, useState, useEffect } from 'react';
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
  Priority,
  MonthlyCycle,
  ContentContributor,
  RecurringContentTemplate,
  ProjectDeliverableTarget,
  ProjectType,
  MonthlyCycleStatus,
} from '../types/database';
import {
  INITIAL_PROFILES,
  INITIAL_CLIENTS,
  INITIAL_PROJECTS,
  INITIAL_PROJECT_MEMBERS,
  INITIAL_TASKS,
  INITIAL_CONTENT_ITEMS,
  INITIAL_CONTENT_VERSIONS,
  INITIAL_APPROVALS,
  INITIAL_COMMENTS,
  INITIAL_FILES,
  INITIAL_NOTIFICATIONS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_CLIENT_USERS,
  INITIAL_MONTHLY_CYCLES,
  INITIAL_CONTENT_CONTRIBUTORS,
  INITIAL_RECURRING_TEMPLATES,
} from '../lib/initialData';
import { useAuth } from './AuthContext';
import { getSupabase } from '../lib/supabase';

interface DataContextType {
  // Raw / complete collections
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

  // Role-filtered collections
  filteredClients: Client[];
  filteredProjects: Project[];
  filteredTasks: Task[];
  filteredContentItems: ContentItem[];
  filteredFiles: FileRecord[];
  filteredNotifications: Notification[];
  filteredMonthlyCycles: MonthlyCycle[];
  filteredRecurringTemplates: RecurringContentTemplate[];

  // Mutation actions
  addClient: (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  archiveClient: (id: string) => void;

  addProject: (
    projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>,
    memberIds?: string[],
    initialCycleTargets?: ProjectDeliverableTarget[]
  ) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;

  // Monthly Retainer & Cycle actions
  addMonthlyCycle: (cycleData: Omit<MonthlyCycle, 'id' | 'created_at' | 'updated_at'>) => MonthlyCycle;
  updateMonthlyCycle: (id: string, updates: Partial<MonthlyCycle>) => void;
  createNextMonthCycle: (projectId: string, fromCycleId?: string) => MonthlyCycle | null;

  // Multiple contributors actions
  addContentContributor: (
    dataOrContentId: string | Omit<ContentContributor, 'id'>,
    userId?: string,
    roleInContent?: string
  ) => void;
  removeContentContributor: (id: string) => void;

  // Recurring templates actions
  addRecurringTemplate: (templateData: Omit<RecurringContentTemplate, 'id' | 'created_at'>) => void;
  deleteRecurringTemplate: (id: string) => void;
  createContentFromTemplate: (templateId: string, cycleId?: string, overrideDates?: { internal_due_date?: string; publishing_date?: string }) => void;

  addTask: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;

  addContentItem: (
    itemData: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>,
    contributors?: { user_id: string; role_in_content: string }[]
  ) => ContentItem;
  updateContentItem: (id: string, updates: Partial<ContentItem>) => void;
  updateContentStatus: (id: string, newStatus: ContentStatus, note?: string) => void;
  rescheduleContentPublishingDate: (id: string, newPublishingDate: string) => void;

  addContentVersion: (contentId: string, versionData: { file_url: string; file_name?: string; notes: string }) => void;
  
  // Client Approval Actions
  approveContent: (contentId: string, comment?: string) => void;
  requestChanges: (contentId: string, comment: string) => void;

  addComment: (data: { projectId?: string; contentId?: string; comment: string }) => void;
  addFile: (fileData: Omit<FileRecord, 'id' | 'created_at'>) => void;
  deleteFile: (id: string) => void;

  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Admin user operations
  createUserProfile: (userData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => void;
  updateUserProfile: (id: string, updates: Partial<Profile>) => void;
  toggleUserStatus: (id: string) => void;

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

const LS_PREFIX = 'zerohub_v4_data_';

// Routine to erase legacy demo data from browser storage
function purgeLegacyDemoData() {
  try {
    const legacyKeys = [
      'zerohub_data_profiles',
      'zerohub_data_clients',
      'zerohub_data_projects',
      'zerohub_data_tasks',
      'zerohub_data_content_items',
      'zerohub_data_content_versions',
      'zerohub_data_approvals',
      'zerohub_data_comments',
      'zerohub_data_files',
      'zerohub_data_notifications',
      'zerohub_data_activity_logs',
      'zerohub_data_client_users',
      'zerohub_data_project_members',
      'zerohub_v2_data_profiles',
      'zerohub_v2_data_clients',
      'zerohub_v2_data_projects',
      'zerohub_v2_data_tasks',
      'zerohub_v2_data_content_items',
      'zerohub_v2_data_content_versions',
      'zerohub_v2_data_approvals',
      'zerohub_v2_data_comments',
      'zerohub_v2_data_files',
      'zerohub_v2_data_notifications',
      'zerohub_v2_data_activity_logs',
      'zerohub_v2_data_client_users',
      'zerohub_v2_data_project_members',
      'zerohub_v3_data_profiles',
      'zerohub_v3_data_clients',
      'zerohub_v3_data_projects',
      'zerohub_v3_data_tasks',
      'zerohub_v3_data_content_items',
      'zerohub_v3_data_content_versions',
      'zerohub_v3_data_approvals',
      'zerohub_v3_data_comments',
      'zerohub_v3_data_files',
      'zerohub_v3_data_notifications',
      'zerohub_v3_data_activity_logs',
      'zerohub_v3_data_client_users',
      'zerohub_v3_data_project_members',
    ];
    legacyKeys.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    // Ignore storage restrictions
  }
}

purgeLegacyDemoData();

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, role } = useAuth();

  // Load from local storage or fallback to initial agency seed
  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem(`${LS_PREFIX}profiles`);
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(`${LS_PREFIX}clients`);
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(`${LS_PREFIX}projects`);
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>(() => {
    const saved = localStorage.getItem(`${LS_PREFIX}project_members`);
    return saved ? JSON.parse(saved) : INITIAL_PROJECT_MEMBERS;
  });

  const [clientUsers, setClientUsers] = useState<ClientUser[]>(() => {
    const saved = localStorage.getItem(`${LS_PREFIX}client_users`);
    return saved ? JSON.parse(saved) : INITIAL_CLIENT_USERS;
  });

  const [monthlyCycles, setMonthlyCycles] = useState<MonthlyCycle[]>(() => {
    const saved = localStorage.getItem(`${LS_PREFIX}monthly_cycles`);
    return saved ? JSON.parse(saved) : INITIAL_MONTHLY_CYCLES;
  });

  const [contentContributors, setContentContributors] = useState<ContentContributor[]>(() => {
    const saved = localStorage.getItem(`${LS_PREFIX}content_contributors`);
    return saved ? JSON.parse(saved) : INITIAL_CONTENT_CONTRIBUTORS;
  });

  const [recurringTemplates, setRecurringTemplates] = useState<RecurringContentTemplate[]>(() => {
    const saved = localStorage.getItem(`${LS_PREFIX}recurring_templates`);
    return saved ? JSON.parse(saved) : INITIAL_RECURRING_TEMPLATES;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(`${LS_PREFIX}tasks`);
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [contentItems, setContentItems] = useState<ContentItem[]>(() => {
    const saved = localStorage.getItem(`${LS_PREFIX}content_items`);
    return saved ? JSON.parse(saved) : INITIAL_CONTENT_ITEMS;
  });

  const [contentVersions, setContentVersions] = useState<ContentVersion[]>(() => {
    const saved = localStorage.getItem(`${LS_PREFIX}content_versions`);
    return saved ? JSON.parse(saved) : INITIAL_CONTENT_VERSIONS;
  });

  const [approvals, setApprovals] = useState<Approval[]>(() => {
    const saved = localStorage.getItem(`${LS_PREFIX}approvals`);
    return saved ? JSON.parse(saved) : INITIAL_APPROVALS;
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem(`${LS_PREFIX}comments`);
    return saved ? JSON.parse(saved) : INITIAL_COMMENTS;
  });

  const [files, setFiles] = useState<FileRecord[]>(() => {
    const saved = localStorage.getItem(`${LS_PREFIX}files`);
    return saved ? JSON.parse(saved) : INITIAL_FILES;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem(`${LS_PREFIX}notifications`);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem(`${LS_PREFIX}activity_logs`);
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
  });

  // Persist local state whenever changes happen
  useEffect(() => {
    localStorage.setItem(`${LS_PREFIX}profiles`, JSON.stringify(profiles));
  }, [profiles]);
  useEffect(() => {
    localStorage.setItem(`${LS_PREFIX}clients`, JSON.stringify(clients));
  }, [clients]);
  useEffect(() => {
    localStorage.setItem(`${LS_PREFIX}projects`, JSON.stringify(projects));
  }, [projects]);
  useEffect(() => {
    localStorage.setItem(`${LS_PREFIX}project_members`, JSON.stringify(projectMembers));
  }, [projectMembers]);
  useEffect(() => {
    localStorage.setItem(`${LS_PREFIX}client_users`, JSON.stringify(clientUsers));
  }, [clientUsers]);
  useEffect(() => {
    localStorage.setItem(`${LS_PREFIX}monthly_cycles`, JSON.stringify(monthlyCycles));
  }, [monthlyCycles]);
  useEffect(() => {
    localStorage.setItem(`${LS_PREFIX}content_contributors`, JSON.stringify(contentContributors));
  }, [contentContributors]);
  useEffect(() => {
    localStorage.setItem(`${LS_PREFIX}recurring_templates`, JSON.stringify(recurringTemplates));
  }, [recurringTemplates]);
  useEffect(() => {
    localStorage.setItem(`${LS_PREFIX}tasks`, JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem(`${LS_PREFIX}content_items`, JSON.stringify(contentItems));
  }, [contentItems]);
  useEffect(() => {
    localStorage.setItem(`${LS_PREFIX}content_versions`, JSON.stringify(contentVersions));
  }, [contentVersions]);
  useEffect(() => {
    localStorage.setItem(`${LS_PREFIX}approvals`, JSON.stringify(approvals));
  }, [approvals]);
  useEffect(() => {
    localStorage.setItem(`${LS_PREFIX}comments`, JSON.stringify(comments));
  }, [comments]);
  useEffect(() => {
    localStorage.setItem(`${LS_PREFIX}files`, JSON.stringify(files));
  }, [files]);
  useEffect(() => {
    localStorage.setItem(`${LS_PREFIX}notifications`, JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => {
    localStorage.setItem(`${LS_PREFIX}activity_logs`, JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Log activity helper
  const logActivity = (action: string, entity_type: ActivityLog['entity_type'], entity_id?: string, metadata?: Record<string, any>) => {
    const newLog: ActivityLog = {
      id: `act_${Date.now()}`,
      user_id: currentUser?.id || 'usr_admin_01',
      action,
      entity_type,
      entity_id,
      metadata,
      created_at: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    // Also push to Supabase if live
    const supabase = getSupabase();
    if (supabase) {
      Promise.resolve(
        supabase.from('activity_logs').insert([{
          user_id: newLog.user_id,
          action: newLog.action,
          entity_type: newLog.entity_type,
          entity_id: newLog.entity_id,
          metadata: newLog.metadata,
        }])
      ).catch((err: any) => console.warn('Supabase log error:', err));
    }
  };

  // Helper function to create notification
  const createNotification = (
    userId: string,
    title: string,
    message: string,
    type: Notification['type'],
    relatedProjectId?: string,
    relatedContentId?: string
  ) => {
    const newNotif: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      title,
      message,
      type,
      related_project_id: relatedProjectId,
      related_content_id: relatedContentId,
      read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Determine client ID associated with current user if role is client
  const associatedClient = currentUser?.role === 'client'
    ? clientUsers.find((cu) => cu.user_id === currentUser.id)?.client_id || 'cli_abc_company'
    : null;

  // Filtered collections according to role
  const filteredClients = React.useMemo(() => {
    if (!currentUser) return [];
    if (role === 'client') {
      return clients.filter((c) => c.id === associatedClient);
    }
    return clients;
  }, [clients, currentUser, role, associatedClient]);

  const filteredProjects = React.useMemo(() => {
    if (!currentUser) return [];
    if (role === 'client') {
      return projects.filter((p) => p.client_id === associatedClient);
    }
    if (role === 'editor') {
      const myProjectIds = projectMembers
        .filter((pm) => pm.user_id === currentUser.id)
        .map((pm) => pm.project_id);
      return projects.filter((p) => myProjectIds.includes(p.id) || p.project_manager_id === currentUser.id);
    }
    return projects;
  }, [projects, currentUser, role, associatedClient, projectMembers]);

  const filteredMonthlyCycles = React.useMemo(() => {
    if (!currentUser) return [];
    if (role === 'client') {
      return monthlyCycles.filter((c) => c.client_id === associatedClient);
    }
    return monthlyCycles;
  }, [monthlyCycles, currentUser, role, associatedClient]);

  const filteredRecurringTemplates = React.useMemo(() => {
    if (!currentUser) return [];
    if (role === 'client') {
      return recurringTemplates.filter((t) => t.client_id === associatedClient);
    }
    return recurringTemplates;
  }, [recurringTemplates, currentUser, role, associatedClient]);

  const filteredContentItems = React.useMemo(() => {
    if (!currentUser) return [];
    if (role === 'client') {
      return contentItems.filter((c) => c.client_id === associatedClient);
    }
    if (role === 'editor') {
      return contentItems.filter((c) => c.assigned_to === currentUser.id || filteredProjects.some((p) => p.id === c.project_id));
    }
    if (role === 'copy_editor') {
      return contentItems.filter((c) => c.assigned_to === currentUser.id || c.created_by === currentUser.id || ['idea', 'planned', 'assigned', 'in_production', 'changes_requested'].includes(c.status));
    }
    return contentItems;
  }, [contentItems, currentUser, role, associatedClient, filteredProjects]);

  const filteredTasks = React.useMemo(() => {
    if (!currentUser) return [];
    if (role === 'client') {
      const clientProjectIds = filteredProjects.map((p) => p.id);
      return tasks.filter((t) => clientProjectIds.includes(t.project_id));
    }
    if (role === 'editor' || role === 'copy_editor') {
      return tasks.filter((t) => t.assigned_to === currentUser.id);
    }
    return tasks;
  }, [tasks, currentUser, role, filteredProjects]);

  const filteredFiles = React.useMemo(() => {
    if (!currentUser) return [];
    if (role === 'client') {
      return files.filter((f) => f.client_id === associatedClient);
    }
    return files;
  }, [files, currentUser, role, associatedClient]);

  const filteredNotifications = React.useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter((n) => n.user_id === currentUser.id);
  }, [notifications, currentUser]);

  // Actions
  const addClient = (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
    const newId = `cli_${Date.now()}`;
    const newClient: Client = {
      ...clientData,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setClients((prev) => [newClient, ...prev]);
    logActivity(`Added new client "${newClient.company_name}"`, 'client', newId, { company: newClient.company_name });
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c))
    );
    const client = clients.find((c) => c.id === id);
    logActivity(`Updated client details for "${client?.company_name || id}"`, 'client', id);
  };

  const archiveClient = (id: string) => {
    const client = clients.find((c) => c.id === id);
    const newStatus = client?.status === 'active' ? 'archived' : 'active';
    updateClient(id, { status: newStatus });
    logActivity(`${newStatus === 'archived' ? 'Archived' : 'Restored'} client "${client?.company_name}"`, 'client', id);
  };

  const addProject = (
    projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>,
    memberIds: string[] = [],
    initialCycleTargets?: ProjectDeliverableTarget[]
  ): Project => {
    const newId = `prj_${Date.now()}`;
    const newProject: Project = {
      ...projectData,
      id: newId,
      project_type: projectData.project_type || 'one_time',
      deliverable_targets: initialCycleTargets || projectData.deliverable_targets || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProjects((prev) => [newProject, ...prev]);

    if (memberIds.length > 0) {
      const newMembers = memberIds.map((uId) => ({
        id: `pm_${Date.now()}_${uId}`,
        project_id: newId,
        user_id: uId,
      }));
      setProjectMembers((prev) => [...prev, ...newMembers]);
    }

    logActivity(`Created ${newProject.project_type === 'monthly_retainer' ? 'monthly retainer project' : 'project'} "${newProject.project_name}"`, 'project', newId, {
      priority: newProject.priority,
      project_type: newProject.project_type,
    });

    // If it's a monthly retainer, automatically initialize the initial cycle!
    if (newProject.project_type === 'monthly_retainer') {
      const startDateObj = newProject.start_date ? new Date(newProject.start_date) : new Date(2026, 9, 1);
      const year = startDateObj.getFullYear() || 2026;
      const monthNumber = startDateObj.getMonth() + 1 || 10;
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthName = monthNames[monthNumber - 1];
      const lastDay = new Date(year, monthNumber, 0).getDate();
      const cycleStart = `${year}-${String(monthNumber).padStart(2, '0')}-01`;
      const cycleEnd = `${year}-${String(monthNumber).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      const defaultTargets = (initialCycleTargets && initialCycleTargets.length > 0)
        ? initialCycleTargets
        : [
            { content_type: 'social_media_post', label: 'Posts', target_count: 5 },
            { content_type: 'reel', label: 'Reels', target_count: 4 },
          ];

      const initialCycle: MonthlyCycle = {
        id: `cycle_${Date.now()}`,
        project_id: newId,
        client_id: newProject.client_id,
        month_name: monthName,
        month_number: monthNumber,
        year,
        start_date: cycleStart,
        end_date: cycleEnd,
        status: 'in_progress',
        deliverable_targets: defaultTargets,
        notes: `Initial ${monthName} ${year} monthly cycle.`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setMonthlyCycles((prev) => [initialCycle, ...prev]);
    }

    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p))
    );
    const p = projects.find((proj) => proj.id === id);
    logActivity(`Updated project "${p?.project_name || id}"`, 'project', id);
  };

  const updateProjectStatus = (id: string, status: ProjectStatus) => {
    const p = projects.find((proj) => proj.id === id);
    setProjects((prev) =>
      prev.map((proj) => (proj.id === id ? { ...proj, status, updated_at: new Date().toISOString() } : proj))
    );
    logActivity(`Changed project "${p?.project_name}" status to "${status.replace('_', ' ')}"`, 'project', id, { status });
  };

  // Monthly Retainer & Cycle Mutations
  const addMonthlyCycle = (cycleData: Omit<MonthlyCycle, 'id' | 'created_at' | 'updated_at'>): MonthlyCycle => {
    const newId = `cycle_${Date.now()}`;
    const newCycle: MonthlyCycle = {
      ...cycleData,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setMonthlyCycles((prev) => [newCycle, ...prev]);
    logActivity(`Created monthly cycle "${newCycle.month_name} ${newCycle.year}"`, 'project', newCycle.project_id);
    return newCycle;
  };

  const updateMonthlyCycle = (id: string, updates: Partial<MonthlyCycle>) => {
    setMonthlyCycles((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c))
    );
    const cycle = monthlyCycles.find((c) => c.id === id);
    logActivity(`Updated monthly cycle "${cycle?.month_name} ${cycle?.year}"`, 'project', cycle?.project_id);
  };

  const createNextMonthCycle = (projectId: string, fromCycleId?: string): MonthlyCycle | null => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) return null;

    const projectCycles = monthlyCycles.filter((c) => c.project_id === projectId);
    const baseCycle = fromCycleId
      ? projectCycles.find((c) => c.id === fromCycleId)
      : [...projectCycles].sort((a, b) => (b.year * 12 + b.month_number) - (a.year * 12 + a.month_number))[0];

    let nextYear = 2026;
    let nextMonthNumber = 11;

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

    // Target carry forward (without copying previous content)
    const carriedTargets = baseCycle?.deliverable_targets || project.deliverable_targets || [
      { content_type: 'social_media_post', label: 'Posts', target_count: 5 },
      { content_type: 'reel', label: 'Reels', target_count: 4 },
    ];

    const newCycle: MonthlyCycle = {
      id: `cycle_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      project_id: projectId,
      client_id: project.client_id,
      month_name: nextMonthName,
      month_number: nextMonthNumber,
      year: nextYear,
      start_date: startDate,
      end_date: endDate,
      status: 'planning',
      deliverable_targets: carriedTargets.map((t) => ({ ...t })),
      notes: `${nextMonthName} ${nextYear} monthly cycle created. Carried forward targets (${carriedTargets.map(t => `${t.target_count} ${t.label}`).join(', ')}). October content remains unchanged.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setMonthlyCycles((prev) => [newCycle, ...prev]);

    logActivity(`Created Next Month cycle "${nextMonthName} ${nextYear}" for "${project.project_name}"`, 'project', projectId, {
      month: nextMonthName,
      year: nextYear,
      targets: carriedTargets,
    });

    return newCycle;
  };

  // Content Contributors actions
  const addContentContributor = (
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

    const newId = `cb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newContributor: ContentContributor = {
      ...data,
      id: newId,
      created_at: new Date().toISOString(),
    };
    setContentContributors((prev) => [...prev, newContributor]);

    setContentItems((prev) =>
      prev.map((item) => {
        if (item.id !== data.content_id) return item;
        const currentContributors = item.contributors || [];
        return {
          ...item,
          contributors: [...currentContributors, newContributor],
          updated_at: new Date().toISOString(),
        };
      })
    );
  };

  const removeContentContributor = (id: string) => {
    setContentContributors((prev) => prev.filter((c) => c.id !== id));
    setContentItems((prev) =>
      prev.map((item) => ({
        ...item,
        contributors: (item.contributors || []).filter((c) => c.id !== id),
        updated_at: new Date().toISOString(),
      }))
    );
  };

  // Recurring Templates actions
  const addRecurringTemplate = (templateData: Omit<RecurringContentTemplate, 'id' | 'created_at'>) => {
    const newId = `tmpl_${Date.now()}`;
    const newTemplate: RecurringContentTemplate = {
      ...templateData,
      id: newId,
      created_at: new Date().toISOString(),
    };
    setRecurringTemplates((prev) => [newTemplate, ...prev]);
    logActivity(`Created recurring content template "${newTemplate.title}"`, 'content', newId);
  };

  const deleteRecurringTemplate = (id: string) => {
    setRecurringTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const createContentFromTemplate = (
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

    const now = new Date(2026, 9, 2);
    const defaultDueDate = overrideDates?.internal_due_date || new Date(now.getTime() + 5 * 86400000).toISOString().split('T')[0];
    const defaultPublishDate = overrideDates?.publishing_date || new Date(now.getTime() + 8 * 86400000).toISOString().split('T')[0];

    addContentItem({
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
      created_by: currentUser?.id || 'usr_admin_01',
      notes: tmpl.notes,
    });
  };

  const addTask = (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    const newId = `tsk_${Date.now()}`;
    const newTask: Task = {
      ...taskData,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);

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
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t))
    );
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    const t = tasks.find((item) => item.id === id);
    const completedAt = status === 'completed' ? new Date().toISOString() : undefined;
    setTasks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status, completed_at: completedAt, updated_at: new Date().toISOString() } : item))
    );
    logActivity(`Updated task "${t?.title}" status to "${status}"`, 'task', id, { status });
  };

  const toggleChecklistItem = (taskId: string, itemId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId || !t.checklist) return t;
        const updatedChecklist = t.checklist.map((item) =>
          item.id === itemId ? { ...item, done: !item.done } : item
        );
        return { ...t, checklist: updatedChecklist, updated_at: new Date().toISOString() };
      })
    );
  };

  const addContentItem = (
    itemData: Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>,
    contributors?: { user_id: string; role_in_content: string }[]
  ): ContentItem => {
    const newId = `cnt_${Date.now()}`;
    const internalDue = itemData.internal_due_date || itemData.due_date;
    const newItem: ContentItem = {
      ...itemData,
      id: newId,
      internal_due_date: internalDue,
      due_date: internalDue,
      priority: itemData.priority || 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (contributors && contributors.length > 0) {
      const contributorRecords: ContentContributor[] = contributors.map((c, idx) => ({
        id: `cb_${Date.now()}_${idx}`,
        content_id: newId,
        user_id: c.user_id,
        role_in_content: c.role_in_content,
        created_at: new Date().toISOString(),
      }));
      newItem.contributors = contributorRecords;
      setContentContributors((prev) => [...prev, ...contributorRecords]);
    }

    setContentItems((prev) => [newItem, ...prev]);

    logActivity(`Created content item "${newItem.title}"`, 'content', newId, {
      type: newItem.content_type,
      platform: newItem.platform,
      publishing_date: newItem.publishing_date,
      monthly_cycle_id: newItem.monthly_cycle_id,
    });

    return newItem;
  };

  const updateContentItem = (id: string, updates: Partial<ContentItem>) => {
    setContentItems((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const internalDue = updates.internal_due_date || updates.due_date || c.internal_due_date || c.due_date;
        return {
          ...c,
          ...updates,
          internal_due_date: internalDue,
          due_date: internalDue,
          updated_at: new Date().toISOString(),
        };
      })
    );
  };

  const rescheduleContentPublishingDate = (id: string, newPublishingDate: string) => {
    const item = contentItems.find((c) => c.id === id);
    if (!item) return;

    updateContentItem(id, { publishing_date: newPublishingDate });
    logActivity(`Rescheduled "${item.title}" publishing date to ${newPublishingDate}`, 'content', id, {
      previous: item.publishing_date,
      newPublishingDate,
    });
  };

  const updateContentStatus = (id: string, newStatus: ContentStatus, note?: string) => {
    const item = contentItems.find((c) => c.id === id);
    if (!item) return;

    setContentItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus, updated_at: new Date().toISOString() } : c))
    );

    logActivity(`Changed content "${item.title}" status to "${newStatus.replace('_', ' ')}"`, 'content', id, {
      status: newStatus,
      note,
    });

    // Workflow notification hooks
    if (newStatus === 'client_review') {
      // Notify client users connected to this client
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
      // Notify PM and Editor
      if (item.assigned_to) {
        createNotification(
          item.assigned_to,
          'Revisions Requested',
          `Client requested revisions on "${item.title}": ${note || 'See notes'}`,
          'changes_requested',
          item.project_id,
          item.id
        );
      }
    } else if (newStatus === 'approved') {
      // Notify PM & Editor
      const project = projects.find((p) => p.id === item.project_id);
      if (project?.project_manager_id) {
        createNotification(
          project.project_manager_id,
          'Content Approved!',
          `Client approved "${item.title}". Ready for scheduling.`,
          'approval',
          item.project_id,
          item.id
        );
      }
    }
  };

  const addContentVersion = (contentId: string, versionData: { file_url: string; file_name?: string; notes: string }) => {
    const existing = contentVersions.filter((v) => v.content_id === contentId);
    const newVersionNumber = existing.length + 1;
    const newVer: ContentVersion = {
      id: `ver_${Date.now()}`,
      content_id: contentId,
      version_number: newVersionNumber,
      file_url: versionData.file_url,
      file_name: versionData.file_name || `Version_${newVersionNumber}`,
      uploaded_by: currentUser?.id || 'usr_editor_03',
      notes: versionData.notes,
      created_at: new Date().toISOString(),
    };

    setContentVersions((prev) => [...prev, newVer]);
    
    // Update thumbnail of content item
    updateContentItem(contentId, { thumbnail_url: versionData.file_url });

    const item = contentItems.find((c) => c.id === contentId);
    logActivity(`Uploaded Version ${newVersionNumber} for "${item?.title || contentId}"`, 'content', contentId, {
      version: newVersionNumber,
    });
  };

  const approveContent = (contentId: string, comment?: string) => {
    const item = contentItems.find((c) => c.id === contentId);
    if (!item) return;

    const newApproval: Approval = {
      id: `appr_${Date.now()}`,
      content_id: contentId,
      client_user_id: currentUser?.id || 'usr_client_05',
      status: 'approved',
      comment: comment || 'Approved by client.',
      created_at: new Date().toISOString(),
    };
    setApprovals((prev) => [newApproval, ...prev]);

    updateContentStatus(contentId, 'approved', comment);
    logActivity(`Client approved "${item.title}"`, 'approval', contentId, { comment });
  };

  const requestChanges = (contentId: string, comment: string) => {
    const item = contentItems.find((c) => c.id === contentId);
    if (!item) return;

    const newApproval: Approval = {
      id: `appr_${Date.now()}`,
      content_id: contentId,
      client_user_id: currentUser?.id || 'usr_client_05',
      status: 'changes_requested',
      comment,
      created_at: new Date().toISOString(),
    };
    setApprovals((prev) => [newApproval, ...prev]);

    updateContentStatus(contentId, 'changes_requested', comment);
    logActivity(`Client requested revisions on "${item.title}"`, 'approval', contentId, { comment });
  };

  const addComment = (data: { projectId?: string; contentId?: string; comment: string }) => {
    const newComment: Comment = {
      id: `comm_${Date.now()}`,
      user_id: currentUser?.id || 'usr_admin_01',
      project_id: data.projectId,
      content_id: data.contentId,
      comment: data.comment,
      created_at: new Date().toISOString(),
    };
    setComments((prev) => [...prev, newComment]);

    logActivity(`Added comment on ${data.contentId ? 'content' : 'project'}`, 'system', data.contentId || data.projectId, {
      snippet: data.comment.substring(0, 40),
    });
  };

  const addFile = (fileData: Omit<FileRecord, 'id' | 'created_at'>) => {
    const newFile: FileRecord = {
      ...fileData,
      id: `fil_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setFiles((prev) => [newFile, ...prev]);
    logActivity(`Uploaded file "${newFile.file_name}"`, 'file', newFile.id);
  };

  const deleteFile = (id: string) => {
    const file = files.find((f) => f.id === id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
    logActivity(`Removed file "${file?.file_name || id}"`, 'file', id);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => (n.user_id === currentUser?.id ? { ...n, read: true } : n))
    );
  };

  const createUserProfile = (userData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) => {
    const newId = `usr_${Date.now()}`;
    const newProfile: Profile = {
      ...userData,
      id: newId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProfiles((prev) => [...prev, newProfile]);
    logActivity(`Created team user "${newProfile.full_name}" (${newProfile.role})`, 'user', newId);
  };

  const updateUserProfile = (id: string, updates: Partial<Profile>) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p))
    );
  };

  const toggleUserStatus = (id: string) => {
    const p = profiles.find((prof) => prof.id === id);
    if (!p) return;
    const nextStatus = p.status === 'active' ? 'inactive' : 'active';
    updateUserProfile(id, { status: nextStatus });
    logActivity(`Changed user status of "${p.full_name}" to ${nextStatus}`, 'user', id);
  };

  // Helper selectors & Calculations
  const getClientById = (id: string) => clients.find((c) => c.id === id);
  const getProfileById = (id: string) => profiles.find((p) => p.id === id);
  const getProjectById = (id: string) => projects.find((p) => p.id === id);
  const getContentById = (id: string) => contentItems.find((c) => c.id === id);
  const getCycleById = (id: string) => monthlyCycles.find((c) => c.id === id);
  
  const getCyclesByProjectId = (projectId: string) =>
    monthlyCycles
      .filter((c) => c.project_id === projectId)
      .sort((a, b) => (b.year * 12 + b.month_number) - (a.year * 12 + a.month_number));

  const getActiveCycleForProject = (projectId: string) => {
    const projectCycles = getCyclesByProjectId(projectId);
    return (
      projectCycles.find((c) => c.status === 'in_progress') ||
      projectCycles.find((c) => c.status === 'planning') ||
      projectCycles[0]
    );
  };

  const getCycleMetrics = (cycleId: string) => {
    const cycle = monthlyCycles.find((c) => c.id === cycleId);
    const itemsInCycle = contentItems.filter((item) => item.monthly_cycle_id === cycleId);

    const targets = cycle?.deliverable_targets || [];
    const totalTarget = targets.reduce((sum, t) => sum + (Number(t.target_count) || 0), 0) || itemsInCycle.length || 1;

    // Completed items are published or completed
    const completedItems = itemsInCycle.filter((i) => i.status === 'published' || i.status === 'completed');
    const completedCount = completedItems.length;
    const remaining = Math.max(0, totalTarget - completedCount);
    const progressPercent = totalTarget > 0 ? Math.round((completedCount / totalTarget) * 100) : 0;

    const inProduction = itemsInCycle.filter((i) => i.status === 'in_production' || i.status === 'internal_review').length;
    const clientReview = itemsInCycle.filter((i) => i.status === 'client_review').length;
    const planned = itemsInCycle.filter((i) => i.status === 'planned' || i.status === 'idea' || i.status === 'assigned').length;
    const changesRequested = itemsInCycle.filter((i) => i.status === 'changes_requested').length;

    // Breakdown by target type (flexible for any deliverable type)
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
  };

  const getDeadlineWarnings = () => {
    // Agency timeline reference: 2026-10-02
    const todayStr = '2026-10-02';
    const todayDate = new Date(todayStr);

    const activeItems = filteredContentItems.filter((c) => c.status !== 'completed');

    // 1. Overdue: internal due date or publishing date in past and not published
    const overdue = activeItems.filter((c) => {
      if (c.status === 'published' || c.status === 'completed') return false;
      const dueDate = c.internal_due_date || c.due_date;
      if (dueDate && dueDate < todayStr) return true;
      if (c.publishing_date && c.publishing_date < todayStr) return true;
      return false;
    });

    // 2. Due soon: internal due date within 3 days
    const dueSoon = activeItems.filter((c) => {
      if (c.status === 'published' || c.status === 'completed') return false;
      const dueDate = c.internal_due_date || c.due_date;
      if (!dueDate) return false;
      const diff = (new Date(dueDate).getTime() - todayDate.getTime()) / (1000 * 3600 * 24);
      return diff >= 0 && diff <= 3;
    });

    // 3. Publishing date approaching: publishing date within 3 days
    const publishingApproaching = activeItems.filter((c) => {
      if (!c.publishing_date) return false;
      const diff = (new Date(c.publishing_date).getTime() - todayDate.getTime()) / (1000 * 3600 * 24);
      return diff >= 0 && diff <= 3;
    });

    // 4. Content awaiting client approval
    const awaitingApproval = activeItems.filter((c) => c.status === 'client_review');

    // 5. CRITICAL: Publishing date reached or approaching (within 2 days or past), but content NOT approved!
    const publishingNotApproved = activeItems.filter((c) => {
      if (!c.publishing_date) return false;
      const diff = (new Date(c.publishing_date).getTime() - todayDate.getTime()) / (1000 * 3600 * 24);
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
  };

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
        toggleChecklistItem,

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
        toggleUserStatus,

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
