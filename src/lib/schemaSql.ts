export const DATABASE_MIGRATION_SQL = `-- ============================================================
-- ZERO HUB (ZERO MEDIA) - COMPLETE POSTGRESQL & RLS SCHEMA
-- Run this in your Database Dashboard: SQL Editor -> New Query
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin',
    'project_manager',
    'videographer',
    'editor',
    'copy_editor',
    'qc',
    'graphic_designer',
    'audio_engineer',
    'colorist',
    'strategist',
    'social_media_manager',
    'client',
    'viewer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- If user_role enum already existed without newer roles, add them dynamically
DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'videographer';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'qc';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'graphic_designer';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'audio_engineer';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'colorist';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'strategist';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'social_media_manager';
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM (
    'planning',
    'active',
    'waiting_for_client',
    'on_hold',
    'completed',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM (
    'todo',
    'in_progress',
    'review',
    'waiting',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE project_type_enum AS ENUM (
    'one_time',
    'monthly_retainer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE monthly_cycle_status_enum AS ENUM (
    'not_started',
    'planning',
    'in_progress',
    'completed',
    'closed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE content_status AS ENUM (
    'idea',
    'planned',
    'assigned',
    'in_production',
    'internal_review',
    'client_review',
    'changes_requested',
    'approved',
    'scheduled',
    'published',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Flexible ID supporting both Admin-created and Auth-created users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'viewer',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  phone TEXT,
  job_title TEXT,
  password TEXT DEFAULT 'zeromedia2026',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure password column exists on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'zeromedia2026';

-- Drop restrictive auth.users foreign key constraint if existing, so admins can create users freely
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  industry TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  logo_url TEXT,
  assigned_pm_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. CLIENT USERS TABLE (Maps client portal logins to clients)
CREATE TABLE IF NOT EXISTS public.client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, client_id)
);

-- 6. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL,
  project_type project_type_enum NOT NULL DEFAULT 'one_time',
  description TEXT,
  status project_status NOT NULL DEFAULT 'planning',
  priority priority_level NOT NULL DEFAULT 'medium',
  start_date DATE NOT NULL,
  deadline DATE NOT NULL,
  deliverable_targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all project columns exist for previously created tables
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'one_time';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deliverable_targets JSONB DEFAULT '[]'::jsonb;

-- 6b. MONTHLY CYCLES TABLE (For Monthly Retainer Projects)
CREATE TABLE IF NOT EXISTS public.monthly_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  month_name TEXT NOT NULL,
  month_number INT NOT NULL,
  year INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('not_started', 'planning', 'in_progress', 'completed', 'closed')),
  deliverable_targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(project_id, year, month_number)
);

CREATE INDEX IF NOT EXISTS idx_monthly_cycles_project ON public.monthly_cycles(project_id);
CREATE INDEX IF NOT EXISTS idx_monthly_cycles_client ON public.monthly_cycles(client_id);

-- 7. PROJECT MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(project_id, user_id)
);

-- 8. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  content_id UUID,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  priority priority_level NOT NULL DEFAULT 'medium',
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  checklist JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all task columns exist for previously created tables
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS content_id UUID;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS checklist JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_tasks_content ON public.tasks(content_id);

-- 9. CONTENT ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  monthly_cycle_id UUID REFERENCES public.monthly_cycles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  brief TEXT,
  caption TEXT,
  status content_status NOT NULL DEFAULT 'idea',
  priority priority_level NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  production_start_date DATE,
  due_date DATE NOT NULL,
  internal_due_date DATE,
  client_review_date DATE,
  approval_date DATE,
  publishing_date DATE,
  actual_published_date DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all content_items columns exist BEFORE creating indexes on them
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS internal_due_date DATE;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS production_start_date DATE;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS client_review_date DATE;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS approval_date DATE;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS publishing_date DATE;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS actual_published_date DATE;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS monthly_cycle_id UUID REFERENCES public.monthly_cycles(id) ON DELETE SET NULL;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT ARRAY['instagram']::TEXT[];

CREATE INDEX IF NOT EXISTS idx_content_items_cycle ON public.content_items(monthly_cycle_id);
CREATE INDEX IF NOT EXISTS idx_content_items_publishing ON public.content_items(publishing_date);
CREATE INDEX IF NOT EXISTS idx_content_items_platforms ON public.content_items USING GIN (platforms);

-- 9b. CONTENT CONTRIBUTORS TABLE
CREATE TABLE IF NOT EXISTS public.content_contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_in_content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_contributors_content ON public.content_contributors(content_id);

-- 9c. RECURRING CONTENT TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.recurring_content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  brief TEXT,
  caption TEXT,
  default_assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. CONTENT VERSIONS TABLE
CREATE TABLE IF NOT EXISTS public.content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(content_id, version_number)
);

-- 11. APPROVALS TABLE
CREATE TABLE IF NOT EXISTS public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'changes_requested')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 13. FILES TABLE
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 14. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  related_project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  related_content_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 15. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 16. CONFIGURABLE DYNAMIC OPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.app_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(category, key)
);

CREATE INDEX IF NOT EXISTS idx_app_options_cat ON public.app_options(category);

-- ============================================================
-- HELPER FUNCTIONS FOR SECURITY & RLS
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_team_member()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('super_admin', 'project_manager', 'editor', 'copy_editor', 'viewer')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.client_has_access(target_client_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_users 
    WHERE user_id = auth.uid() AND client_id = target_client_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Grant schema and table access to anon and authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Disable RLS on Zero Hub agency tables so app users and public anon client can access data
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_cycles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_contributors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_content_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_options DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if updating to prevent duplicate policy errors
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Super admin can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Team members can view all clients; clients only view their own" ON public.clients;
DROP POLICY IF EXISTS "Super admin and PMs can insert/update clients" ON public.clients;
DROP POLICY IF EXISTS "Super admin and PMs can update clients" ON public.clients;
DROP POLICY IF EXISTS "Projects viewable by team or owning client" ON public.projects;
DROP POLICY IF EXISTS "Projects manageable by admin or PM" ON public.projects;
DROP POLICY IF EXISTS "Content viewable by team or owning client" ON public.content_items;
DROP POLICY IF EXISTS "Team can manage content items" ON public.content_items;
DROP POLICY IF EXISTS "Clients can update content items for approval" ON public.content_items;
DROP POLICY IF EXISTS "Approvals viewable by team or client" ON public.approvals;
DROP POLICY IF EXISTS "Clients and team can insert/update approvals" ON public.approvals;
DROP POLICY IF EXISTS "Users can view and manage their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Activity logs viewable by team" ON public.activity_logs;
DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Monthly cycles viewable by team or owning client" ON public.monthly_cycles;
DROP POLICY IF EXISTS "Monthly cycles manageable by admin or PM" ON public.monthly_cycles;
DROP POLICY IF EXISTS "Contributors viewable by authenticated users" ON public.content_contributors;
DROP POLICY IF EXISTS "Contributors manageable by team" ON public.content_contributors;
DROP POLICY IF EXISTS "Templates viewable and manageable by team" ON public.recurring_content_templates;
DROP POLICY IF EXISTS "Tasks viewable by team or project clients" ON public.tasks;
DROP POLICY IF EXISTS "Team members can manage tasks" ON public.tasks;
DROP POLICY IF EXISTS "Comments viewable by team or authorized client" ON public.comments;
DROP POLICY IF EXISTS "Authenticated users can manage comments" ON public.comments;
DROP POLICY IF EXISTS "Files viewable by team or authorized client" ON public.files;
DROP POLICY IF EXISTS "Team and authorized clients can manage files" ON public.files;
DROP POLICY IF EXISTS "Client users viewable by team or own user" ON public.client_users;
DROP POLICY IF EXISTS "Admins can manage client users" ON public.client_users;
DROP POLICY IF EXISTS "Project members viewable by team" ON public.project_members;
DROP POLICY IF EXISTS "Admins and PMs can manage project members" ON public.project_members;
DROP POLICY IF EXISTS "App options viewable by authenticated users" ON public.app_options;
DROP POLICY IF EXISTS "Admins and PMs can manage app options" ON public.app_options;

-- PROFILES POLICIES
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Super admin can manage profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin() OR auth.uid() = id);

-- CLIENTS POLICIES
CREATE POLICY "Team members can view all clients; clients only view their own"
  ON public.clients FOR SELECT TO authenticated
  USING (
    public.is_team_member() 
    OR public.client_has_access(id)
  );

CREATE POLICY "Super admin and PMs can insert/update clients"
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.current_user_role() = 'project_manager');

CREATE POLICY "Super admin and PMs can update clients"
  ON public.clients FOR UPDATE TO authenticated
  USING (public.is_admin() OR public.current_user_role() = 'project_manager');

-- PROJECTS POLICIES
CREATE POLICY "Projects viewable by team or owning client"
  ON public.projects FOR SELECT TO authenticated
  USING (
    public.is_team_member() 
    OR public.client_has_access(client_id)
  );

CREATE POLICY "Projects manageable by admin or PM"
  ON public.projects FOR ALL TO authenticated
  USING (public.is_admin() OR public.current_user_role() = 'project_manager');

-- TASKS POLICIES
CREATE POLICY "Tasks viewable by team or project clients"
  ON public.tasks FOR SELECT TO authenticated
  USING (
    public.is_team_member()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND public.client_has_access(p.client_id)
    )
  );

CREATE POLICY "Team members can manage tasks"
  ON public.tasks FOR ALL TO authenticated
  USING (public.is_team_member());

-- CONTENT ITEMS POLICIES
CREATE POLICY "Content viewable by team or owning client"
  ON public.content_items FOR SELECT TO authenticated
  USING (
    public.is_team_member() 
    OR public.client_has_access(client_id)
  );

CREATE POLICY "Team can manage content items"
  ON public.content_items FOR ALL TO authenticated
  USING (public.is_team_member());

CREATE POLICY "Clients can update content items for approval"
  ON public.content_items FOR UPDATE TO authenticated
  USING (public.client_has_access(client_id) OR public.is_team_member())
  WITH CHECK (public.client_has_access(client_id) OR public.is_team_member());

-- CONTENT VERSIONS POLICIES
CREATE POLICY "Content versions viewable by team or client"
  ON public.content_versions FOR SELECT TO authenticated
  USING (
    public.is_team_member()
    OR EXISTS (
      SELECT 1 FROM public.content_items ci
      WHERE ci.id = content_id AND public.client_has_access(ci.client_id)
    )
  );

CREATE POLICY "Team can manage content versions"
  ON public.content_versions FOR ALL TO authenticated
  USING (public.is_team_member());

-- APPROVALS POLICIES
CREATE POLICY "Approvals viewable by team or client"
  ON public.approvals FOR SELECT TO authenticated
  USING (
    public.is_team_member()
    OR EXISTS (
      SELECT 1 FROM public.content_items ci 
      WHERE ci.id = content_id AND public.client_has_access(ci.client_id)
    )
  );

CREATE POLICY "Clients and team can insert/update approvals"
  ON public.approvals FOR ALL TO authenticated
  USING (true);

-- COMMENTS POLICIES
CREATE POLICY "Comments viewable by team or authorized client"
  ON public.comments FOR SELECT TO authenticated
  USING (
    public.is_team_member()
    OR (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.client_has_access(p.client_id)
    ))
    OR (content_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.content_items ci WHERE ci.id = content_id AND public.client_has_access(ci.client_id)
    ))
  );

CREATE POLICY "Authenticated users can manage comments"
  ON public.comments FOR ALL TO authenticated
  USING (public.is_team_member() OR auth.uid() = user_id);

-- FILES POLICIES
CREATE POLICY "Files viewable by team or authorized client"
  ON public.files FOR SELECT TO authenticated
  USING (
    public.is_team_member()
    OR (client_id IS NOT NULL AND public.client_has_access(client_id))
    OR (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.client_has_access(p.client_id)
    ))
  );

CREATE POLICY "Team and authorized clients can manage files"
  ON public.files FOR ALL TO authenticated
  USING (public.is_team_member() OR auth.uid() = uploaded_by);

-- CLIENT USERS POLICIES
CREATE POLICY "Client users viewable by team or own user"
  ON public.client_users FOR SELECT TO authenticated
  USING (public.is_team_member() OR auth.uid() = user_id);

CREATE POLICY "Admins can manage client users"
  ON public.client_users FOR ALL TO authenticated
  USING (public.is_admin() OR public.current_user_role() = 'project_manager');

-- PROJECT MEMBERS POLICIES
CREATE POLICY "Project members viewable by team"
  ON public.project_members FOR SELECT TO authenticated
  USING (public.is_team_member());

CREATE POLICY "Admins and PMs can manage project members"
  ON public.project_members FOR ALL TO authenticated
  USING (public.is_admin() OR public.current_user_role() = 'project_manager');

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view and manage their own notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id);

-- ACTIVITY LOGS POLICIES
CREATE POLICY "Activity logs viewable by team"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (public.is_team_member());

CREATE POLICY "Authenticated users can insert activity logs"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- MONTHLY CYCLES POLICIES
CREATE POLICY "Monthly cycles viewable by team or owning client"
  ON public.monthly_cycles FOR SELECT TO authenticated
  USING (
    public.is_team_member()
    OR public.client_has_access(client_id)
  );

CREATE POLICY "Monthly cycles manageable by admin or PM"
  ON public.monthly_cycles FOR ALL TO authenticated
  USING (public.is_admin() OR public.current_user_role() = 'project_manager');

-- CONTENT CONTRIBUTORS POLICIES
CREATE POLICY "Contributors viewable by authenticated users"
  ON public.content_contributors FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Contributors manageable by team"
  ON public.content_contributors FOR ALL TO authenticated
  USING (public.is_team_member());

-- RECURRING CONTENT TEMPLATES POLICIES
CREATE POLICY "Templates viewable and manageable by team"
  ON public.recurring_content_templates FOR ALL TO authenticated
  USING (public.is_team_member());

-- APP OPTIONS POLICIES
CREATE POLICY "App options viewable by authenticated users"
  ON public.app_options FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins and PMs can manage app options"
  ON public.app_options FOR ALL TO authenticated
  USING (public.is_admin() OR public.current_user_role() = 'project_manager');

-- ============================================================
-- INITIAL DYNAMIC OPTIONS SEED
-- ============================================================
INSERT INTO public.app_options (category, key, label, sort_order) VALUES
  ('content_type', 'social_media_post', 'Post (Image)', 1),
  ('content_type', 'reel', 'Reel', 2),
  ('content_type', 'carousel', 'Carousel', 3),
  ('content_type', 'story', 'Story', 4),
  ('content_type', 'video', 'Long Video', 5),
  ('content_type', 'advertisement', 'Paid Ad', 6),
  ('content_type', 'blog', 'Blog Article', 7),
  ('content_type', 'other', 'Other', 8),

  ('platform', 'instagram', 'Instagram', 1),
  ('platform', 'tiktok', 'TikTok', 2),
  ('platform', 'youtube', 'YouTube', 3),
  ('platform', 'facebook', 'Facebook', 4),
  ('platform', 'linkedin', 'LinkedIn', 5),
  ('platform', 'twitter', 'X / Twitter', 6),
  ('platform', 'pinterest', 'Pinterest', 7),
  ('platform', 'other', 'Other', 8),

  ('priority', 'low', 'Low', 1),
  ('priority', 'medium', 'Medium', 2),
  ('priority', 'high', 'High', 3),
  ('priority', 'urgent', 'Urgent', 4),

  ('content_status', 'idea', 'Idea', 1),
  ('content_status', 'planned', 'Planned', 2),
  ('content_status', 'assigned', 'Assigned', 3),
  ('content_status', 'in_production', 'In Production', 4),
  ('content_status', 'internal_review', 'Internal Review', 5),
  ('content_status', 'client_review', 'Client Review', 6),
  ('content_status', 'changes_requested', 'Changes Requested', 7),
  ('content_status', 'approved', 'Approved', 8),
  ('content_status', 'scheduled', 'Scheduled', 9),
  ('content_status', 'published', 'Published', 10),
  ('content_status', 'completed', 'Completed', 11),

  ('contributor_role', 'Shooting', 'Shooting / Cinematography', 1),
  ('contributor_role', 'Editing', 'Video Editing', 2),
  ('contributor_role', 'Caption', 'Copy & Caption', 3),
  ('contributor_role', 'Audio', 'Sound & Music', 4),
  ('contributor_role', 'Grading', 'Color Grading', 5),
  ('contributor_role', 'Strategy', 'Content Strategy', 6)
ON CONFLICT (category, key) DO NOTHING;

-- ============================================================
-- REALTIME REPLICATION (Instant Live Sync)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'profiles', 'clients', 'client_users', 'projects', 'monthly_cycles',
    'project_members', 'tasks', 'content_items', 'content_contributors',
    'recurring_content_templates', 'content_versions', 'approvals', 'comments',
    'files', 'notifications', 'activity_logs', 'app_options'
  ]) LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = tbl
    ) THEN
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
      EXCEPTION
        WHEN undefined_table THEN null;
        WHEN duplicate_object THEN null;
      END;
    END IF;
  END LOOP;
END $$;
`;

export const CLIENT_USERS_LINKAGE_MIGRATION_SQL = `-- ============================================================
-- ZERO HUB - CLIENT USER INTERCONNECTION MIGRATION
-- Run this in your Database Dashboard: SQL Editor -> New Query
-- ============================================================

-- 1. Ensure client_users junction table exists
CREATE TABLE IF NOT EXISTS public.client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, client_id)
);

-- 2. Fast lookup indexes for role filtering and portal queries
CREATE INDEX IF NOT EXISTS idx_client_users_user_id ON public.client_users(user_id);
CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON public.client_users(client_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;

-- 4. Helper Function: client_has_access
CREATE OR REPLACE FUNCTION public.client_has_access(target_client_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_users 
    WHERE user_id = auth.uid() AND client_id = target_client_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Row Level Security Policies for client_users
DROP POLICY IF EXISTS "Client users viewable by team or own user" ON public.client_users;
CREATE POLICY "Client users viewable by team or own user"
  ON public.client_users FOR SELECT TO authenticated
  USING (
    public.is_team_member() 
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Admins can manage client users" ON public.client_users;
CREATE POLICY "Admins can manage client users"
  ON public.client_users FOR ALL TO authenticated
  USING (
    public.is_admin() 
    OR public.current_user_role() = 'project_manager'
  );

-- 6. Add client_users table to Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'client_users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.client_users;
  END IF;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;
`;

export const DATABASE_RLS_FIX_SQL = `-- ============================================================
-- ZERO HUB: INSTANT RLS UNLOCK & ACCESS FIX (RUN IN SUPABASE)
-- Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ============================================================
-- This script fixes the issue where data is visible in the Supabase
-- dashboard tables but blocked from showing in the Zero Hub web app.
-- It grants read/write permissions to the public anon key and disables
-- restrictive Row-Level Security on Zero Hub agency tables.

-- 1. Grant public schema usage and permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;

-- 2. Unlock all Zero Hub tables by disabling restrictive Row-Level Security
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'profiles', 'clients', 'client_users', 'projects', 'monthly_cycles',
    'project_members', 'tasks', 'content_items', 'content_contributors',
    'recurring_content_templates', 'content_versions', 'approvals', 'comments',
    'files', 'notifications', 'activity_logs', 'app_options'
  ]) LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', tbl);
    EXCEPTION WHEN undefined_table THEN
      null; -- Table does not exist yet; skip
    END;
  END LOOP;
END $$;

-- 3. Drop restrictive foreign key constraint to auth.users so admin can freely create users
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'zeromedia2026';

-- 4. Purge any legacy placeholder admin profile
DELETE FROM public.profiles WHERE email = 'zeromedia.lk@gmail.com' OR id = '6cdd37f7-38fa-4fb0-8a7b-b7324d80f83c';

-- Done! Refresh the Zero Hub app to immediately see all your Supabase data.
`;

export const USER_CREATION_PROFILES_FIX_SQL = `-- ============================================================
-- ZERO HUB: FIX USER CREATION & PROFILES IN SUPABASE
-- Run this in Supabase Dashboard: SQL Editor -> New Query -> Run
-- ============================================================
-- This script fixes the issue where newly created users from
-- Admin Settings fail to save or disappear upon reload.
-- It unlinks profiles from the strict auth.users foreign key constraint,
-- unlocks Row-Level Security on profiles & client_users, and ensures
-- all necessary columns exist.

-- 1. Remove the restrictive foreign key constraint to auth.users(id)
-- This allows Zero Media admins to create team members, editors, copy editors,
-- and clients directly from the Admin Settings dashboard.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Ensure all columns exist on public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'zeromedia2026';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 3. Ensure role column accepts all Zero Hub roles (QC, Videographer, Editors, Designers, etc.)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin',
    'project_manager',
    'videographer',
    'editor',
    'copy_editor',
    'qc',
    'graphic_designer',
    'audio_engineer',
    'colorist',
    'strategist',
    'social_media_manager',
    'client',
    'viewer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'videographer';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'qc';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'graphic_designer';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'audio_engineer';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'colorist';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'strategist';
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'social_media_manager';
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN undefined_object THEN null;
END $$;

-- Convert role column to TEXT for maximum flexibility across all agency positions & custom admin roles
ALTER TABLE public.profiles ALTER COLUMN role TYPE TEXT USING role::text;

-- 4. Unlock public.profiles & public.client_users (Disable restrictive RLS)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_users DISABLE ROW LEVEL SECURITY;

-- 5. Grant read and write access to public anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.profiles TO anon, authenticated;
GRANT ALL ON TABLE public.client_users TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 6. Add profiles & client_users to Supabase Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'client_users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.client_users;
  END IF;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- 7. Purge legacy placeholder accounts so only authenticated admin users exist
DELETE FROM public.profiles WHERE email = 'zeromedia.lk@gmail.com' OR id = '6cdd37f7-38fa-4fb0-8a7b-b7324d80f83c';

-- All set! Users created in Zero Hub Admin Settings will now persist permanently in Supabase.
`;

export const SUPABASE_AUTH_AND_PASSWORD_SETUP_SQL = `-- ============================================================
-- ZERO HUB: COMPLETE SUPABASE AUTHENTICATION & PASSWORDS SETUP
-- Run this in Supabase Dashboard: SQL Editor -> New Query -> Run
-- ============================================================
-- This script configures user authentication, password storage,
-- and ensures that login credentials verification works seamlessly
-- from the Zero Hub login portal.

-- 1. Ensure public.profiles table exists with UUID primary key
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'viewer',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  phone TEXT,
  job_title TEXT,
  password TEXT DEFAULT 'zeromedia2026',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Add password column to public.profiles if already existing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'zeromedia2026';
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Populate default password ('zeromedia2026') for any profiles missing one
UPDATE public.profiles 
SET password = 'zeromedia2026' 
WHERE password IS NULL OR TRIM(password) = '';

-- 4. Purge legacy placeholder accounts so only authenticated admin users exist
DELETE FROM public.profiles WHERE email = 'zeromedia.lk@gmail.com' OR id = '6cdd37f7-38fa-4fb0-8a7b-b7324d80f83c';

-- 5. Grant query permissions on public schema to anon and authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.profiles TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 6. Disable Row Level Security on profiles table so login queries are not blocked
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 7. Add profiles to realtime sync publication for instant cross-device updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- 8. (Optional) If you also use Supabase Auth (auth.users), link user
-- Note: Zero Hub can authenticate directly against public.profiles using the
-- email/username and password column, eliminating complex JWT signups.
`;

export const SUPABASE_CASCADE_USER_DELETE_SQL = `-- ============================================================
-- ZERO HUB: COMPLETE CASCADE USER DELETION & DATABASE CLEANUP SCRIPT
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ============================================================
-- This script fixes the issue where deleted users reappeared or
-- could not be deleted due to foreign key constraints and RLS.
--
-- 1. Updates all table foreign keys to ON DELETE SET NULL or ON DELETE CASCADE
--    so deleting a user profile NEVER fails with a foreign key violation.
-- 2. Makes created_by and user_id columns nullable across tasks, content,
--    activity logs, files, and comments.
-- 3. Creates the server-side stored procedure "delete_user_cascade"
--    (SECURITY DEFINER) that unassigns the user from tasks, deliverables,
--    projects, clients, and dashboards, and permanently deletes their profile.
-- 4. Automatically purges the legacy "zeromedia.lk@gmail.com" account.
-- ============================================================

-- STEP 1: FIX FOREIGN KEY CONSTRAINTS TO ENABLE AUTOMATIC CASCADE/UNASSIGN
DO $$
BEGIN
  -- Tasks: assigned_to becomes NULL when user is deleted
  BEGIN
    ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_assigned_to_fkey 
      FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Tasks: created_by becomes NULL or cascades
  BEGIN
    ALTER TABLE public.tasks ALTER COLUMN created_by DROP NOT NULL;
    ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_created_by_fkey;
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Content items: assigned_to becomes NULL
  BEGIN
    ALTER TABLE public.content_items DROP CONSTRAINT IF EXISTS content_items_assigned_to_fkey;
    ALTER TABLE public.content_items ADD CONSTRAINT content_items_assigned_to_fkey 
      FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Content items: created_by becomes NULL
  BEGIN
    ALTER TABLE public.content_items ALTER COLUMN created_by DROP NOT NULL;
    ALTER TABLE public.content_items DROP CONSTRAINT IF EXISTS content_items_created_by_fkey;
    ALTER TABLE public.content_items ADD CONSTRAINT content_items_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Projects: project_manager_id becomes NULL
  BEGIN
    ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_project_manager_id_fkey;
    ALTER TABLE public.projects ADD CONSTRAINT projects_project_manager_id_fkey 
      FOREIGN KEY (project_manager_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Clients: assigned_pm_id becomes NULL
  BEGIN
    ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_assigned_pm_id_fkey;
    ALTER TABLE public.clients ADD CONSTRAINT clients_assigned_pm_id_fkey 
      FOREIGN KEY (assigned_pm_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Client Users: deletes row when profile is deleted
  BEGIN
    ALTER TABLE public.client_users DROP CONSTRAINT IF EXISTS client_users_user_id_fkey;
    ALTER TABLE public.client_users ADD CONSTRAINT client_users_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Project Members: deletes row when profile is deleted
  BEGIN
    ALTER TABLE public.project_members DROP CONSTRAINT IF EXISTS project_members_user_id_fkey;
    ALTER TABLE public.project_members ADD CONSTRAINT project_members_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Content Contributors: deletes row when profile is deleted
  BEGIN
    ALTER TABLE public.content_contributors DROP CONSTRAINT IF EXISTS content_contributors_user_id_fkey;
    ALTER TABLE public.content_contributors ADD CONSTRAINT content_contributors_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Notifications: deletes row when profile is deleted
  BEGIN
    ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Approvals: deletes row when profile is deleted
  BEGIN
    ALTER TABLE public.approvals DROP CONSTRAINT IF EXISTS approvals_client_user_id_fkey;
    ALTER TABLE public.approvals ADD CONSTRAINT approvals_client_user_id_fkey 
      FOREIGN KEY (client_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Activity logs: user_id allows NULL
  BEGIN
    ALTER TABLE public.activity_logs ALTER COLUMN user_id DROP NOT NULL;
    ALTER TABLE public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey;
    ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Files: uploaded_by allows NULL
  BEGIN
    ALTER TABLE public.files ALTER COLUMN uploaded_by DROP NOT NULL;
    ALTER TABLE public.files DROP CONSTRAINT IF EXISTS files_uploaded_by_fkey;
    ALTER TABLE public.files ADD CONSTRAINT files_uploaded_by_fkey 
      FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Content versions: uploaded_by allows NULL
  BEGIN
    ALTER TABLE public.content_versions ALTER COLUMN uploaded_by DROP NOT NULL;
    ALTER TABLE public.content_versions DROP CONSTRAINT IF EXISTS content_versions_uploaded_by_fkey;
    ALTER TABLE public.content_versions ADD CONSTRAINT content_versions_uploaded_by_fkey 
      FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Comments: user_id allows NULL
  BEGIN
    ALTER TABLE public.comments ALTER COLUMN user_id DROP NOT NULL;
    ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;
    ALTER TABLE public.comments ADD CONSTRAINT comments_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Recurring templates: default_assigned_to becomes NULL
  BEGIN
    ALTER TABLE public.recurring_content_templates DROP CONSTRAINT IF EXISTS recurring_content_templates_default_assigned_to_fkey;
    ALTER TABLE public.recurring_content_templates ADD CONSTRAINT recurring_content_templates_default_assigned_to_fkey 
      FOREIGN KEY (default_assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- STEP 2: CREATE CASCADE DELETE STORED PROCEDURE (RPC)
CREATE OR REPLACE FUNCTION public.delete_user_cascade(target_user_id UUID, target_user_email TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_fallback_admin UUID;
BEGIN
  -- Look for an alternate active admin to reassign ownership
  SELECT id INTO v_fallback_admin
  FROM public.profiles
  WHERE id != target_user_id AND role = 'super_admin'
  LIMIT 1;

  IF v_fallback_admin IS NULL THEN
    SELECT id INTO v_fallback_admin
    FROM public.profiles
    WHERE id != target_user_id
    LIMIT 1;
  END IF;

  -- 1. Unassign from all tasks (assigned_to -> NULL)
  UPDATE public.tasks SET assigned_to = NULL WHERE assigned_to = target_user_id;
  IF v_fallback_admin IS NOT NULL THEN
    UPDATE public.tasks SET created_by = v_fallback_admin WHERE created_by = target_user_id;
  ELSE
    UPDATE public.tasks SET created_by = NULL WHERE created_by = target_user_id;
  END IF;

  -- 2. Unassign from all deliverables and content items (assigned_to -> NULL)
  UPDATE public.content_items SET assigned_to = NULL WHERE assigned_to = target_user_id;
  IF v_fallback_admin IS NOT NULL THEN
    UPDATE public.content_items SET created_by = v_fallback_admin WHERE created_by = target_user_id;
  ELSE
    UPDATE public.content_items SET created_by = NULL WHERE created_by = target_user_id;
  END IF;

  -- 3. Unassign from all projects (project_manager_id -> NULL)
  UPDATE public.projects SET project_manager_id = NULL WHERE project_manager_id = target_user_id;

  -- 4. Unassign from all clients (assigned_pm_id -> NULL)
  UPDATE public.clients SET assigned_pm_id = NULL WHERE assigned_pm_id = target_user_id;

  -- 5. Delete relational links
  DELETE FROM public.project_members WHERE user_id = target_user_id;
  DELETE FROM public.client_users WHERE user_id = target_user_id;
  DELETE FROM public.content_contributors WHERE user_id = target_user_id;
  DELETE FROM public.notifications WHERE user_id = target_user_id;
  DELETE FROM public.approvals WHERE client_user_id = target_user_id;

  -- 6. Files, versions, comments & activity logs
  IF v_fallback_admin IS NOT NULL THEN
    UPDATE public.files SET uploaded_by = v_fallback_admin WHERE uploaded_by = target_user_id;
    UPDATE public.content_versions SET uploaded_by = v_fallback_admin WHERE uploaded_by = target_user_id;
    UPDATE public.comments SET user_id = v_fallback_admin WHERE user_id = target_user_id;
    UPDATE public.activity_logs SET user_id = v_fallback_admin WHERE user_id = target_user_id;
  ELSE
    UPDATE public.files SET uploaded_by = NULL WHERE uploaded_by = target_user_id;
    UPDATE public.content_versions SET uploaded_by = NULL WHERE uploaded_by = target_user_id;
    UPDATE public.comments SET user_id = NULL WHERE user_id = target_user_id;
    DELETE FROM public.activity_logs WHERE user_id = target_user_id;
  END IF;

  -- 7. Permanently delete from profiles table by UUID
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- Also delete by email if provided
  IF target_user_email IS NOT NULL AND TRIM(target_user_email) != '' THEN
    DELETE FROM public.profiles WHERE LOWER(TRIM(email)) = LOWER(TRIM(target_user_email));
  END IF;

  -- 8. Delete from auth.users if Supabase Auth was used
  BEGIN
    DELETE FROM auth.users WHERE id = target_user_id;
    IF target_user_email IS NOT NULL AND TRIM(target_user_email) != '' THEN
      DELETE FROM auth.users WHERE LOWER(TRIM(email)) = LOWER(TRIM(target_user_email));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN TRUE;
END;
$$;

-- Create convenient function alias
CREATE OR REPLACE FUNCTION public.delete_user_profile(user_uuid UUID, user_email TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.delete_user_cascade(user_uuid, user_email);
END;
$$;

-- Grant execution to all roles
GRANT EXECUTE ON FUNCTION public.delete_user_cascade(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_user_profile(UUID, TEXT) TO anon, authenticated, service_role;

-- STEP 3: CONFIGURE ROW-LEVEL SECURITY SO PROFILE DELETION IS NEVER BLOCKED
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow profiles delete" ON public.profiles;
CREATE POLICY "Allow profiles delete" 
  ON public.profiles FOR DELETE 
  TO anon, authenticated 
  USING (true);

DROP POLICY IF EXISTS "Allow profiles all operations" ON public.profiles;
CREATE POLICY "Allow profiles all operations" 
  ON public.profiles FOR ALL 
  TO anon, authenticated 
  USING (true) 
  WITH CHECK (true);

-- Ensure tasks, content, projects, and clients can be updated
DROP POLICY IF EXISTS "Allow tasks unassign update" ON public.tasks;
CREATE POLICY "Allow tasks unassign update" ON public.tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow content unassign update" ON public.content_items;
CREATE POLICY "Allow content unassign update" ON public.content_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow projects unassign update" ON public.projects;
CREATE POLICY "Allow projects unassign update" ON public.projects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow clients unassign update" ON public.clients;
CREATE POLICY "Allow clients unassign update" ON public.clients FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- STEP 4: PURGE LEGACY ZERO MEDIA ADMIN ACCOUNT IMMEDIATELY
DO $$
BEGIN
  PERFORM public.delete_user_cascade('6cdd37f7-38fa-4fb0-8a7b-b7324d80f83c'::uuid, 'zeromedia.lk@gmail.com');
  DELETE FROM public.profiles WHERE LOWER(TRIM(email)) = 'zeromedia.lk@gmail.com' OR id = '6cdd37f7-38fa-4fb0-8a7b-b7324d80f83c';
EXCEPTION WHEN OTHERS THEN
  DELETE FROM public.profiles WHERE LOWER(TRIM(email)) = 'zeromedia.lk@gmail.com' OR id = '6cdd37f7-38fa-4fb0-8a7b-b7324d80f83c';
END $$;
`;

export const CONTENT_IDEA_STAGE_MIGRATION_SQL = `-- ============================================================
-- ZERO HUB: CONTENT DELIVERABLE "IDEA" STEP ENABLER MIGRATION
-- Run this in your Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

-- Step 1: Ensure 'idea' enum value is present in content_status enum
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum
      JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
      WHERE pg_type.typname = 'content_status' AND pg_enum.enumlabel = 'idea'
    ) THEN
      ALTER TYPE public.content_status ADD VALUE 'idea' BEFORE 'planned';
    END IF;
  ELSE
    CREATE TYPE public.content_status AS ENUM (
      'idea',
      'planned',
      'assigned',
      'in_production',
      'internal_review',
      'client_review',
      'changes_requested',
      'approved',
      'scheduled',
      'published',
      'completed'
    );
  END IF;
EXCEPTION
  WHEN duplicate_object THEN null;
  WHEN others THEN null;
END $$;

-- Step 2: Set default value of content_items.status column to 'idea'
ALTER TABLE public.content_items ALTER COLUMN status SET DEFAULT 'idea';

-- Step 3: If status uses a TEXT check constraint, update it to include 'idea'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'content_items' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.content_items DROP CONSTRAINT IF EXISTS content_items_status_check;
    ALTER TABLE public.content_items ADD CONSTRAINT content_items_status_check 
      CHECK (status::text IN (
        'idea', 'planned', 'assigned', 'in_production', 
        'internal_review', 'client_review', 'changes_requested', 
        'approved', 'scheduled', 'published', 'completed'
      ));
  END IF;
EXCEPTION
  WHEN others THEN null;
END $$;

-- Step 4: Ensure RLS policies allow selecting, inserting, and updating deliverables
DROP POLICY IF EXISTS "Allow content items all" ON public.content_items;
CREATE POLICY "Allow content items all" ON public.content_items
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Verification: Check deliverable status distribution
SELECT status, COUNT(*) AS count 
FROM public.content_items 
GROUP BY status 
ORDER BY count DESC;
`;

export const CONTENT_PLATFORMS_MULTI_SELECT_MIGRATION_SQL = `-- ============================================================
-- ZERO HUB: MULTI-PLATFORM DELIVERABLE DISTRIBUTION MIGRATION
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ============================================================
-- This script adds the "platforms" column (TEXT[] array) to public.content_items,
-- backfills existing content deliverables so their current single "platform"
-- value is automatically populated into the "platforms" array, and creates
-- a high-performance GIN index for querying deliverables by channel.

-- Step 1: Add platforms array column to content_items table
ALTER TABLE public.content_items 
ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT ARRAY['instagram']::TEXT[];

-- Step 2: Backfill existing deliverables where platforms is NULL or empty
-- to automatically use their current single 'platform' value
UPDATE public.content_items 
SET platforms = ARRAY[platform]::TEXT[] 
WHERE platforms IS NULL OR cardinality(platforms) = 0;

-- Step 3: Create high-performance GIN index for multi-platform array queries
CREATE INDEX IF NOT EXISTS idx_content_items_platforms 
ON public.content_items USING GIN (platforms);

-- Step 4: Add platforms array column to recurring_content_templates as well
ALTER TABLE public.recurring_content_templates 
ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT ARRAY['instagram']::TEXT[];

UPDATE public.recurring_content_templates 
SET platforms = ARRAY[platform]::TEXT[] 
WHERE platforms IS NULL OR cardinality(platforms) = 0;

-- Step 5: Verification - list deliverables with their platforms
SELECT id, title, platform, platforms 
FROM public.content_items 
ORDER BY created_at DESC 
LIMIT 10;
`;

export const PROJECT_DELIVERABLE_TARGETS_MIGRATION_SQL = `-- ============================================================
-- ZERO HUB: ONE-TIME & RETAINER PROJECT DELIVERABLE TARGETS MIGRATION
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ============================================================
-- This script ensures that both one-time projects and monthly retainers
-- can save, track, and manage deliverable targets (e.g. number of Posts,
-- Reels, Stories, Videos) with full JSONB support in Supabase.

-- Step 1: Ensure project_type and deliverable_targets columns exist on public.projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'one_time';

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS deliverable_targets JSONB DEFAULT '[]'::jsonb;

-- Step 2: Ensure any legacy projects have a valid JSONB empty array if NULL
UPDATE public.projects 
SET deliverable_targets = '[]'::jsonb 
WHERE deliverable_targets IS NULL;

-- Step 3: Create GIN index on deliverable_targets for efficient JSON querying
CREATE INDEX IF NOT EXISTS idx_projects_deliverable_targets 
ON public.projects USING GIN (deliverable_targets);

CREATE INDEX IF NOT EXISTS idx_projects_type 
ON public.projects (project_type);

-- Step 4: Ensure public schema permissions allow read/write for projects
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.projects TO anon, authenticated;

-- Step 5: Ensure Row Level Security is disabled or unlocked on projects
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- Step 6: Ensure projects table is in the Supabase Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'projects'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
  END IF;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- Step 7: Verification Query - check projects and their deliverable targets
SELECT id, project_name, project_type, deliverable_targets, created_at 
FROM public.projects 
ORDER BY created_at DESC 
LIMIT 10;
`;







