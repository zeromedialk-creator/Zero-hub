export type UserRole = 
  | 'super_admin'
  | 'project_manager'
  | 'videographer'
  | 'editor'
  | 'copy_editor'
  | 'qc'
  | 'graphic_designer'
  | 'audio_engineer'
  | 'colorist'
  | 'strategist'
  | 'social_media_manager'
  | 'client'
  | 'viewer'
  | (string & {});

export interface SystemRoleDefinition {
  key: string;
  label: string;
  department: 'Leadership' | 'Production' | 'Post-Production' | 'Editorial' | 'Quality' | 'Distribution' | 'Client';
  description: string;
  defaultJobTitle: string;
  badgeClass: string;
  isClientRole?: boolean;
}

export const SYSTEM_ROLE_DEFINITIONS: SystemRoleDefinition[] = [
  {
    key: 'super_admin',
    label: 'Super Admin',
    department: 'Leadership',
    description: 'Complete system authority, database management, team & client administration',
    defaultJobTitle: 'Agency Director / Super Admin',
    badgeClass: 'text-amber-400 border-amber-500/30 bg-amber-400/10',
  },
  {
    key: 'project_manager',
    label: 'Project Manager (PM)',
    department: 'Leadership',
    description: 'Campaign management, retainer cycles, client coordination, and task routing',
    defaultJobTitle: 'Project & Account Manager',
    badgeClass: 'text-sky-400 border-sky-500/30 bg-sky-400/10',
  },
  {
    key: 'videographer',
    label: 'Videographer / Cinematographer',
    department: 'Production',
    description: 'On-set filming, camera operation, lighting, raw footage capture & intake',
    defaultJobTitle: 'Lead Videographer & Cinematographer',
    badgeClass: 'text-orange-400 border-orange-500/30 bg-orange-400/10',
  },
  {
    key: 'editor',
    label: 'Video Editor / Motion Graphics',
    department: 'Post-Production',
    description: 'Footage editing, cuts, transitions, sound design, pacing, and visual effects',
    defaultJobTitle: 'Senior Video Editor',
    badgeClass: 'text-blue-400 border-blue-500/30 bg-blue-400/10',
  },
  {
    key: 'copy_editor',
    label: 'Copywriter / Script Editor',
    department: 'Editorial',
    description: 'Video scripts, reel hooks, social captions, copywriting, and storytelling',
    defaultJobTitle: 'Content Scriptwriter & Copy Editor',
    badgeClass: 'text-emerald-400 border-emerald-500/30 bg-emerald-400/10',
  },
  {
    key: 'qc',
    label: 'Quality Control (QC Specialist)',
    department: 'Quality',
    description: 'Pre-client quality assurance, technical specs, audio/sync review, brand standards check',
    defaultJobTitle: 'Quality Control (QC) Specialist',
    badgeClass: 'text-purple-400 border-purple-500/30 bg-purple-400/10',
  },
  {
    key: 'graphic_designer',
    label: 'Graphic Designer / Thumbnail Artist',
    department: 'Post-Production',
    description: 'High-CTR YouTube/Instagram thumbnails, carousel slides, brand graphics',
    defaultJobTitle: 'Graphic & Visual Designer',
    badgeClass: 'text-pink-400 border-pink-500/30 bg-pink-400/10',
  },
  {
    key: 'audio_engineer',
    label: 'Sound & Audio Engineer',
    department: 'Post-Production',
    description: 'Sound engineering, Foley, audio mixing, dialogue cleanup, and audio mastering',
    defaultJobTitle: 'Audio Engineer & Sound Designer',
    badgeClass: 'text-yellow-400 border-yellow-500/30 bg-yellow-400/10',
  },
  {
    key: 'colorist',
    label: 'Colorist / Color Grader',
    department: 'Post-Production',
    description: 'Color grading, cinematic LUT matching, lighting balance, and visual consistency',
    defaultJobTitle: 'Colorist & Grading Specialist',
    badgeClass: 'text-indigo-400 border-indigo-500/30 bg-indigo-400/10',
  },
  {
    key: 'strategist',
    label: 'Content Strategist',
    department: 'Editorial',
    description: 'Content strategy, audience retention research, viral trend curation, and growth',
    defaultJobTitle: 'Creative & Content Strategist',
    badgeClass: 'text-cyan-400 border-cyan-500/30 bg-cyan-400/10',
  },
  {
    key: 'social_media_manager',
    label: 'Social Media Manager',
    department: 'Distribution',
    description: 'Content scheduling, channel publishing, engagement, and post distribution',
    defaultJobTitle: 'Social Media Distribution Manager',
    badgeClass: 'text-teal-400 border-teal-500/30 bg-teal-400/10',
  },
  {
    key: 'client',
    label: 'Client Representative',
    department: 'Client',
    description: 'Review deliverable versions, timestamped feedback, approval sign-offs',
    defaultJobTitle: 'Brand Representative',
    badgeClass: 'text-amber-300 border-amber-400/30 bg-amber-400/10',
    isClientRole: true,
  },
  {
    key: 'viewer',
    label: 'Viewer / Stakeholder',
    department: 'Leadership',
    description: 'Read-only access to campaigns, deliverable calendar, and high-level progress',
    defaultJobTitle: 'Agency Stakeholder / Observer',
    badgeClass: 'text-neutral-400 border-neutral-700 bg-neutral-800/40',
  },
];

export function formatRoleTitle(role?: string | null): string {
  if (!role) return 'Team Member';
  const match = SYSTEM_ROLE_DEFINITIONS.find((r) => r.key === role.toLowerCase());
  if (match) return match.label;
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  phone?: string;
  job_title?: string;
  password?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address?: string;
  industry: string;
  notes?: string;
  status: 'active' | 'archived';
  logo_url?: string;
  assigned_pm_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientUser {
  id: string;
  user_id: string;
  client_id: string;
  created_at?: string;
}

export type ProjectStatus = 
  | 'planning'
  | 'active'
  | 'waiting_for_client'
  | 'on_hold'
  | 'completed'
  | 'archived';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type ProjectType = 'one_time' | 'monthly_retainer';

export interface ProjectDeliverableTarget {
  id?: string;
  content_type: string;
  label: string;
  target_count: number;
}

export type MonthlyCycleStatus = 
  | 'not_started'
  | 'planning'
  | 'in_progress'
  | 'completed'
  | 'closed';

export interface MonthlyCycle {
  id: string;
  project_id: string;
  client_id: string;
  month_name: string;
  month_number: number;
  year: number;
  start_date: string;
  end_date: string;
  status: MonthlyCycleStatus;
  deliverable_targets: ProjectDeliverableTarget[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentContributor {
  id: string;
  content_id: string;
  user_id: string;
  role_in_content: string; // e.g. Shooting, Editing, Caption, Audio
  created_at?: string;
}

export interface RecurringContentTemplate {
  id: string;
  project_id?: string;
  client_id?: string;
  title: string;
  content_type: ContentType;
  platform: Platform;
  platforms?: Platform[];
  brief?: string;
  caption?: string;
  default_assigned_to?: string;
  notes?: string;
  created_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  project_manager_id?: string;
  project_name: string;
  project_type?: ProjectType;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  start_date: string;
  deadline: string;
  deliverable_targets?: ProjectDeliverableTarget[];
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'waiting' | 'completed';

export interface TaskChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  project_id: string;
  content_id?: string;
  assigned_to?: string;
  created_by: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  due_date: string;
  completed_at?: string;
  checklist?: TaskChecklistItem[];
  created_at: string;
  updated_at: string;
}

export type ContentStatus = 
  | 'idea'
  | 'planned'
  | 'assigned'
  | 'in_production'
  | 'internal_review'
  | 'client_review'
  | 'changes_requested'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'completed';

export type ContentType = 
  | 'social_media_post'
  | 'carousel'
  | 'reel'
  | 'video'
  | 'story'
  | 'advertisement'
  | 'blog'
  | 'other';

export type Platform = 
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'linkedin'
  | 'youtube'
  | 'twitter'
  | 'pinterest'
  | 'other'
  | (string & {});

export interface ContentItem {
  id: string;
  project_id: string;
  client_id: string;
  monthly_cycle_id?: string;
  title: string;
  content_type: ContentType;
  platform: Platform;
  platforms?: Platform[];
  brief: string;
  caption: string;
  status: ContentStatus;
  priority?: Priority;
  assigned_to?: string;
  contributors?: ContentContributor[];
  production_start_date?: string;
  due_date: string; // Internal due date
  internal_due_date?: string;
  client_review_date?: string;
  approval_date?: string;
  publishing_date?: string;
  actual_published_date?: string;
  created_by: string;
  thumbnail_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function getContentPlatforms(item?: Partial<ContentItem> | null): Platform[] {
  if (!item) return ['instagram'];
  if (Array.isArray(item.platforms) && item.platforms.length > 0) {
    return item.platforms;
  }
  if (item.platform) {
    return [item.platform];
  }
  return ['instagram'];
}

export interface ContentVersion {
  id: string;
  content_id: string;
  version_number: number;
  file_url: string;
  file_name?: string;
  file_type?: string;
  uploaded_by: string;
  notes: string;
  created_at: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'changes_requested';

export interface Approval {
  id: string;
  content_id: string;
  client_user_id: string;
  status: ApprovalStatus;
  comment?: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  project_id?: string;
  content_id?: string;
  comment: string;
  created_at: string;
}

export interface FileRecord {
  id: string;
  client_id?: string;
  project_id?: string;
  content_id?: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size?: string;
  created_at: string;
}

export type NotificationType = 
  | 'task'
  | 'approval'
  | 'changes_requested'
  | 'comment'
  | 'deadline'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  related_project_id?: string;
  related_content_id?: string;
  read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: 'client' | 'project' | 'task' | 'content' | 'approval' | 'file' | 'user' | 'system';
  entity_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export type OptionCategory = 
  | 'content_type'
  | 'platform'
  | 'content_status'
  | 'project_status'
  | 'task_status'
  | 'priority'
  | 'contributor_role'
  | 'user_role';

export interface AppOption {
  id: string;
  category: OptionCategory | string;
  key: string;
  label: string;
  is_active: boolean;
  sort_order: number;
  metadata?: Record<string, any>;
  created_at?: string;
}
