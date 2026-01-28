-- RLS Policies for Leave Request Edit and Delete Operations
-- Run this in your Supabase SQL Editor

-- Enable RLS on leave_requests table (if not already enabled)
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to update their own pending leave requests
CREATE POLICY "Users can update their own pending leave requests"
ON leave_requests
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() = user_id 
  AND status = 'pending'
);

-- Policy: Allow users to delete their own pending leave requests
CREATE POLICY "Users can delete their own pending leave requests"
ON leave_requests
FOR DELETE
USING (
  auth.uid() = user_id 
  AND status = 'pending'
);

-- Policy: Allow managers and admins to update any leave request
CREATE POLICY "Managers and admins can update any leave request"
ON leave_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('manager', 'admin')
  )
);

-- Policy: Allow managers and admins to delete any leave request
CREATE POLICY "Managers and admins can delete any leave request"
ON leave_requests
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('manager', 'admin')
  )
);

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'leave_requests';
