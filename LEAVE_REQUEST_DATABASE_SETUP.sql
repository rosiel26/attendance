-- ============================================
-- LEAVE REQUEST DATABASE SETUP
-- ============================================
-- Run this SQL in Supabase SQL Editor to ensure
-- the leave_requests table is properly configured
-- ============================================

-- Drop the table if you want to recreate it (CAUTION: This will delete all data)
-- DROP TABLE IF EXISTS leave_requests CASCADE;

-- Create leave_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type VARCHAR NOT NULL CHECK (leave_type IN ('sick', 'casual', 'annual', 'unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- If the table already exists, drop and recreate the check constraint
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_leave_type_check;
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_leave_type_check 
  CHECK (leave_type IN ('sick', 'casual', 'annual', 'unpaid'));

ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_status_check;
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add approved_at column if it doesn't exist (for existing tables)
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_created_at ON leave_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Users can insert their own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Users can update their own pending leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Managers can view all leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Managers can update leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Admins can view all leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Admins can update all leave requests" ON leave_requests;

-- RLS Policy: Users can view their own leave requests
CREATE POLICY "Users can view their own leave requests"
ON leave_requests
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own leave requests
CREATE POLICY "Users can insert their own leave requests"
ON leave_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own pending leave requests
CREATE POLICY "Users can update their own pending leave requests"
ON leave_requests
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- RLS Policy: Managers can view all leave requests
CREATE POLICY "Managers can view all leave requests"
ON leave_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('manager', 'admin')
  )
);

-- RLS Policy: Managers can update leave requests (approve/reject)
CREATE POLICY "Managers can update leave requests"
ON leave_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('manager', 'admin')
  )
);

-- RLS Policy: Admins can view all leave requests
CREATE POLICY "Admins can view all leave requests"
ON leave_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- RLS Policy: Admins can update all leave requests
CREATE POLICY "Admins can update all leave requests"
ON leave_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leave_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_leave_requests_updated_at_trigger ON leave_requests;
CREATE TRIGGER update_leave_requests_updated_at_trigger
BEFORE UPDATE ON leave_requests
FOR EACH ROW
EXECUTE FUNCTION update_leave_requests_updated_at();

-- Verify the setup
SELECT 
  'leave_requests table setup complete!' as message,
  COUNT(*) as total_requests
FROM leave_requests;

-- Show the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'leave_requests'
ORDER BY ordinal_position;
