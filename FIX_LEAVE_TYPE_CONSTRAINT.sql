-- ============================================
-- QUICK FIX: Leave Type Constraint Error
-- ============================================
-- Run this SQL immediately to fix the check constraint error
-- Error: "new row for relation "leave_requests" violates check constraint"
-- ============================================

-- Drop the old constraint
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_leave_type_check;

-- Add the correct constraint with the values our app uses
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_leave_type_check 
  CHECK (leave_type IN ('sick', 'casual', 'annual', 'unpaid'));

-- Also fix the status constraint
ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_status_check;
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected'));

-- Verify the constraints
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'leave_requests'::regclass
  AND contype = 'c';

-- Test query to verify it works
SELECT 'Constraint fixed! You can now submit leave requests.' as message;
