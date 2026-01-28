-- RLS Policies for Manager Leave Approval
-- This allows managers and admins to approve/reject leave requests
-- Run this in your Supabase SQL Editor

-- First, drop existing conflicting policies
DROP POLICY IF EXISTS "allow_update_own_leave" ON leave_requests;
DROP POLICY IF EXISTS "allow_delete_own_leave" ON leave_requests;
DROP POLICY IF EXISTS "Users can update their own pending leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Users can delete their own pending leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Managers and admins can update any leave request" ON leave_requests;
DROP POLICY IF EXISTS "Managers and admins can delete any leave request" ON leave_requests;

-- Enable RLS on leave_requests table
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to update their own pending leave requests
CREATE POLICY "users_update_own_pending_leave"
ON leave_requests
FOR UPDATE
TO authenticated
USING (
  user_id::text = auth.uid()::text 
  AND status = 'pending'
)
WITH CHECK (
  user_id::text = auth.uid()::text 
  AND status = 'pending'
);

-- Policy 2: Allow users to delete their own pending leave requests
CREATE POLICY "users_delete_own_pending_leave"
ON leave_requests
FOR DELETE
TO authenticated
USING (
  user_id::text = auth.uid()::text 
  AND status = 'pending'
);

-- Policy 3: Allow managers and admins to update ANY leave request
CREATE POLICY "managers_admins_update_all_leave"
ON leave_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
    AND users.role IN ('manager', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
    AND users.role IN ('manager', 'admin')
  )
);

-- Policy 4: Allow managers and admins to delete ANY leave request
CREATE POLICY "managers_admins_delete_all_leave"
ON leave_requests
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
    AND users.role IN ('manager', 'admin')
  )
);

-- Policy 5: Allow users to view their own leave requests
CREATE POLICY "users_view_own_leave"
ON leave_requests
FOR SELECT
TO authenticated
USING (user_id::text = auth.uid()::text);

-- Policy 6: Allow managers and admins to view all leave requests
CREATE POLICY "managers_admins_view_all_leave"
ON leave_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id::text = auth.uid()::text
    AND users.role IN ('manager', 'admin')
  )
);

-- Policy 7: Allow users to insert their own leave requests
CREATE POLICY "users_insert_own_leave"
ON leave_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id::text = auth.uid()::text);

-- Verify all policies were created successfully
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'leave_requests'
ORDER BY policyname;

-- Test query to check if current user is a manager/admin
SELECT 
  id, 
  email, 
  role,
  CASE 
    WHEN role IN ('manager', 'admin') THEN 'Can approve/reject leave requests'
    ELSE 'Can only manage own leave requests'
  END as permissions
FROM users
WHERE id::text = auth.uid()::text;
