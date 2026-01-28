-- ============================================
-- FIX: Attendance RLS Policy Error
-- ============================================
-- This fixes the 403 error when users try to check in/out
-- The attendance table needs RLS policies to allow users to insert/update their own records

-- 1. Enable RLS on attendance table (ensure it's on)
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies that might be conflicting
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can insert own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can update own attendance" ON attendance;
DROP POLICY IF EXISTS "Managers can view all attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can view all attendance" ON attendance;

-- 3. RLS Policies for attendance table

-- Users can view their own attendance records
CREATE POLICY "Users can view own attendance" ON attendance
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own attendance records (for check-in)
CREATE POLICY "Users can insert own attendance" ON attendance
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own attendance records (for check-out)
CREATE POLICY "Users can update own attendance" ON attendance
    FOR UPDATE USING (auth.uid() = user_id);

-- Managers can view attendance records of their team members
CREATE POLICY "Managers can view team attendance" ON attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u1
            JOIN users u2 ON u1.manager_id = u2.id
            WHERE u1.id = attendance.user_id
            AND u2.id = auth.uid()
        )
    );

-- Admins can view all attendance records
CREATE POLICY "Admins can view all attendance" ON attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at (if not exists)
DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance;
CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();