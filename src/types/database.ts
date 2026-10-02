export type UserRole = 
  | 'super_admin'
  | 'project_manager'
  | 'editor'
  | 'copy_editor'
  | 'client'
  | 'viewer';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  phone?: string;
  job_title?: string;
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
  brief?: string;
  caption?: string;
  default_assigned_to?: string;
  notes?: string;
  created_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  project_manager_id: string;
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
  | 'other';

export interface ContentItem {
  id: string;
  project_id: string;
  client_id: string;
  monthly_cycle_id?: string;
  title: string;
  content_type: ContentType;
  platform: Platform;
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
