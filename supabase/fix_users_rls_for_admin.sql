-- ============================================
-- FIX: Users Table RLS Policies for Admin Operations
-- ============================================
-- This adds policies to allow admins to manage users (insert, update, delete)
-- while maintaining security for regular users

-- Enable RLS on users table (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a function to check if user is admin (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = user_id AND role = 'admin'
  );
$$;

-- Drop all existing policies on users table
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON users';
    END LOOP;
END $$;

-- Also drop specific admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 4: Admin full access to users
CREATE POLICY "Admin full access to users"
ON public.users
FOR ALL
USING (
  is_admin(auth.uid())
)
WITH CHECK (
  is_admin(auth.uid())
);

-- Policy 5: Admins can insert new users
CREATE POLICY "Admins can insert users"
ON public.users
FOR INSERT
WITH CHECK (
  is_admin(auth.uid())
);

-- Policy 6: Admins can update any user
CREATE POLICY "Admins can update users"
ON public.users
FOR UPDATE
USING (
  is_admin(auth.uid())
)
WITH CHECK (
  is_admin(auth.uid())
);

-- Policy 7: Admins can delete users
CREATE POLICY "Admins can delete users"
ON public.users
FOR DELETE
USING (
  is_admin(auth.uid())
);

-- Policy 8: Managers can view their direct reports
CREATE POLICY "Managers can view their team"
ON public.users
FOR SELECT
USING (
  manager_id = auth.uid() OR
  auth.jwt()->'raw_user_meta_data'->>'role' IN ('manager', 'admin')
);