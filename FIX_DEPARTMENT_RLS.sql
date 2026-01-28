-- ============================================
-- FIX: Department RLS Policy Error
-- ============================================
-- Run this script in Supabase SQL Editor to fix the
-- "new row violates row-level security policy" error.
-- ============================================

-- 1. Enable RLS on departments (ensure it's on)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can insert departments" ON departments;
DROP POLICY IF EXISTS "Admins can update departments" ON departments;
DROP POLICY IF EXISTS "Admins can delete departments" ON departments;
DROP POLICY IF EXISTS "Everyone can view departments" ON departments;

-- 3. Create Policy: Admins can insert departments
CREATE POLICY "Admins can insert departments"
ON departments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 4. Create Policy: Admins can update departments
CREATE POLICY "Admins can update departments"
ON departments
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 5. Create Policy: Admins can delete departments
CREATE POLICY "Admins can delete departments"
ON departments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- 6. Create Policy: Everyone can view departments
CREATE POLICY "Everyone can view departments"
ON departments
FOR SELECT
USING (true);

-- 7. Verify
SELECT 'Department policies updated successfully!' as message;