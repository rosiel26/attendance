-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can update their own pending leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Users can delete their own pending leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Managers and admins can update any leave request" ON leave_requests;
DROP POLICY IF EXISTS "Managers and admins can delete any leave request" ON leave_requests;

-- Simpler, more permissive policies for testing
-- Policy: Allow users to update their own leave requests
CREATE POLICY "allow_update_own_leave"
ON leave_requests
FOR UPDATE
TO authenticated
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- Policy: Allow users to delete their own leave requests  
CREATE POLICY "allow_delete_own_leave"
ON leave_requests
FOR DELETE
TO authenticated
USING (user_id::text = auth.uid()::text);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'leave_requests';
