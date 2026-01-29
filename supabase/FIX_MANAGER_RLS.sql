-- ============================================
-- FIX: Manager RLS Policy for Users Table
-- ============================================
-- Run this in Supabase SQL Editor

-- Drop existing manager policies if they exist (handle different naming conventions)
DROP POLICY IF EXISTS "Managers can view their team" ON users;
DROP POLICY IF EXISTS "Managers can view team leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Managers can view team corrections" ON attendance_corrections;

-- Create a function to check if user is a manager (using users table, not JWT)
DROP FUNCTION IF EXISTS is_manager(uuid);
CREATE OR REPLACE FUNCTION is_manager(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = p_user_id AND role = 'manager'
  );
$$;

-- Policy for users table: managers can view their direct reports
CREATE POLICY "Managers can view their team" ON users
FOR SELECT
USING (
  users.manager_id = auth.uid()
  OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Policy for attendance table: managers can view their team's attendance
DROP POLICY IF EXISTS "Managers can view team attendance" ON attendance;
CREATE POLICY "Managers can view team attendance" ON attendance
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = attendance.user_id AND u.manager_id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Policy for leave_requests table: managers can view their team's requests
CREATE POLICY "Managers can view team leave requests" ON leave_requests
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = leave_requests.user_id AND u.manager_id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Policy for attendance_corrections table: managers can view their team's corrections
CREATE POLICY "Managers can view team corrections" ON attendance_corrections
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = attendance_corrections.user_id AND u.manager_id = auth.uid())
  OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Verify policies were created
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public';
