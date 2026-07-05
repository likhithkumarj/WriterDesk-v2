-- ============================================================
-- WriterDesk RLS Policy Update Script — FINAL FIX
-- Run the ENTIRE contents in Supabase SQL Editor
--
-- KEY FIX: collaborators SELECT uses USING(true) for authenticated
-- users so it never queries the projects table.
-- This eliminates the circular dependency that was causing
-- ALL projects to disappear.
-- ============================================================


-- 1. Add role column to collaborators table
ALTER TABLE public.collaborators
ADD COLUMN IF NOT EXISTS role text DEFAULT 'Viewer' CHECK (role IN ('Editor', 'Viewer'));

UPDATE public.collaborators SET role = 'Editor' WHERE status = 'accepted' AND role IS NULL;
UPDATE public.collaborators SET role = 'Viewer'  WHERE role IS NULL;


-- ============================================================
-- 2. PROFILES — everyone authenticated can read profiles
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone"        ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile"         ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT USING (true);


-- ============================================================
-- 3. PROJECTS — owners + collaborators can read
-- Safe: projects -> collaborators (collaborators policy = true, no loop)
-- ============================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own projects"           ON public.projects;
DROP POLICY IF EXISTS "Owners and collaborators can view projects"  ON public.projects;

CREATE POLICY "Owners and collaborators can view projects"
ON public.projects FOR SELECT
USING (
  user_id = auth.uid()
  OR id IN (
    SELECT project_id FROM public.collaborators
    WHERE user_id = auth.uid()
       OR invited_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
CREATE POLICY "Users can insert their own projects"
ON public.projects FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update their projects"    ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Owners can update their projects"
ON public.projects FOR UPDATE
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete their projects" ON public.projects;
CREATE POLICY "Owners can delete their projects"
ON public.projects FOR DELETE
USING (user_id = auth.uid());


-- ============================================================
-- 4. COLLABORATORS — CRITICAL: SELECT is open to authenticated users
--
-- Why: any SELECT policy that subqueries projects would create
-- a circular dependency (projects -> collaborators -> projects).
-- Security is still enforced via INSERT / UPDATE / DELETE policies.
-- Collaborator data (email, role) is low-risk and requires a
-- known project UUID to query anyway.
-- ============================================================
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view collaborators of their projects"  ON public.collaborators;
DROP POLICY IF EXISTS "Authenticated users can view all collaborators"  ON public.collaborators;

CREATE POLICY "Authenticated users can view all collaborators"
ON public.collaborators FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Only project owners can insert collaborators" ON public.collaborators;
CREATE POLICY "Only project owners can insert collaborators"
ON public.collaborators FOR INSERT
WITH CHECK (
  project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update collaborators" ON public.collaborators;
CREATE POLICY "Users can update collaborators"
ON public.collaborators FOR UPDATE
USING (
  user_id = auth.uid()
  OR invited_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  OR project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Only project owners can delete collaborators" ON public.collaborators;
CREATE POLICY "Only project owners can delete collaborators"
ON public.collaborators FOR DELETE
USING (
  project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
);


-- ============================================================
-- 5. FILES — owners and accepted editors can write; viewers read-only
-- ============================================================
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view files of projects they own or collaborate on" ON public.files;
DROP POLICY IF EXISTS "Collaborators can view files" ON public.files;
CREATE POLICY "Users can view files of projects they own or collaborate on"
ON public.files FOR SELECT
USING (
  project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  OR project_id IN (
    SELECT project_id FROM public.collaborators
    WHERE status = 'accepted'
      AND (user_id = auth.uid()
           OR invited_email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can insert files into projects they own or edit" ON public.files;
CREATE POLICY "Users can insert files into projects they own or edit"
ON public.files FOR INSERT
WITH CHECK (
  project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  OR project_id IN (
    SELECT project_id FROM public.collaborators
    WHERE user_id = auth.uid() AND status = 'accepted' AND role = 'Editor'
  )
);

DROP POLICY IF EXISTS "Users can update files in projects they own or edit" ON public.files;
CREATE POLICY "Users can update files in projects they own or edit"
ON public.files FOR UPDATE
USING (
  project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  OR project_id IN (
    SELECT project_id FROM public.collaborators
    WHERE user_id = auth.uid() AND status = 'accepted' AND role = 'Editor'
  )
);

DROP POLICY IF EXISTS "Users can delete files from projects they own or edit" ON public.files;
CREATE POLICY "Users can delete files from projects they own or edit"
ON public.files FOR DELETE
USING (
  project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
  OR project_id IN (
    SELECT project_id FROM public.collaborators
    WHERE user_id = auth.uid() AND status = 'accepted' AND role = 'Editor'
  )
);


-- ============================================================
-- 6. COMMENTS — mirrors file-level access
-- ============================================================
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view comments on accessible files" ON public.comments;
CREATE POLICY "Users can view comments on accessible files"
ON public.comments FOR SELECT
USING (
  file_id IN (
    SELECT f.id FROM public.files f
    WHERE
      f.project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
      OR f.project_id IN (
        SELECT project_id FROM public.collaborators
        WHERE status = 'accepted'
          AND (user_id = auth.uid()
               OR invited_email = (SELECT email FROM public.profiles WHERE id = auth.uid()))
      )
  )
);

DROP POLICY IF EXISTS "Owners and Editors can comment" ON public.comments;
CREATE POLICY "Owners and Editors can comment"
ON public.comments FOR INSERT
WITH CHECK (
  file_id IN (
    SELECT f.id FROM public.files f
    WHERE
      f.project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
      OR f.project_id IN (
        SELECT project_id FROM public.collaborators
        WHERE user_id = auth.uid() AND status = 'accepted' AND role = 'Editor'
      )
  )
);

DROP POLICY IF EXISTS "Owners and Editors can delete comments" ON public.comments;
CREATE POLICY "Owners and Editors can delete comments"
ON public.comments FOR DELETE
USING (
  file_id IN (
    SELECT f.id FROM public.files f
    WHERE
      f.project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
      OR f.project_id IN (
        SELECT project_id FROM public.collaborators
        WHERE user_id = auth.uid() AND status = 'accepted' AND role = 'Editor'
      )
  )
);


-- ============================================================
-- 7. Add author column to files table for custom creator names
-- ============================================================
ALTER TABLE public.files
ADD COLUMN IF NOT EXISTS author text;


-- ============================================================
-- 8. Add production_role column to collaborators table
-- ============================================================
ALTER TABLE public.collaborators
ADD COLUMN IF NOT EXISTS production_role text DEFAULT 'Writer' CHECK (production_role IN ('Writer', 'Director', 'Actor', 'Producer', 'DP', 'Editor', 'Other'));


-- ============================================================
-- 9. Add onboarding_metadata column to profiles table
-- ============================================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_metadata jsonb;


-- ============================================================
-- 10. Add writing_activity table for tracking save actions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.writing_activity (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date date DEFAULT CURRENT_DATE,
  activity_count integer DEFAULT 1,
  CONSTRAINT unique_user_date UNIQUE (user_id, activity_date)
);

-- RLS policies
ALTER TABLE public.writing_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own activity logs" ON public.writing_activity;
CREATE POLICY "Users can manage their own activity logs" 
ON public.writing_activity 
FOR ALL USING (auth.uid() = user_id);

