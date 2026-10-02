export const SUPABASE_MIGRATION_SQL = `-- ============================================================
-- ZERO HUB (ZERO MEDIA) - COMPLETE POSTGRESQL & RLS SCHEMA
-- Run this in your Supabase Dashboard: SQL Editor -> New Query
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin',
    'project_manager',
    'editor',
    'copy_editor',
    'client',
    'viewer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
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

-- 3. PROFILES TABLE (Syncs with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'viewer',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  phone TEXT,
  job_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

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
  status monthly_cycle_status_enum NOT NULL DEFAULT 'planning',
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

CREATE INDEX IF NOT EXISTS idx_content_items_cycle ON public.content_items(monthly_cycle_id);
CREATE INDEX IF NOT EXISTS idx_content_items_publishing ON public.content_items(publishing_date);

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

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_content_templates ENABLE ROW LEVEL SECURITY;

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
`;
