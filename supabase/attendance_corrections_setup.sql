-- Create attendance_corrections table
CREATE TABLE IF NOT EXISTS attendance_corrections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    missing_type TEXT NOT NULL CHECK (missing_type IN ('check_in', 'check_out')),
    requested_time TIME NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    remarks TEXT,
    requested_by UUID NOT NULL REFERENCES users(id),
    attendance_id UUID REFERENCES attendance(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_corrections_user_id ON attendance_corrections(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_corrections_status ON attendance_corrections(status);
CREATE INDEX IF NOT EXISTS idx_attendance_corrections_date ON attendance_corrections(attendance_date);

-- Enable RLS
ALTER TABLE attendance_corrections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Employees can view their own corrections
CREATE POLICY "Users can view own corrections" ON attendance_corrections
    FOR SELECT USING (auth.uid() = user_id);

-- Managers and admins can view all corrections
CREATE POLICY "Managers can view all corrections" ON attendance_corrections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('manager', 'admin')
        )
    );

-- Employees can insert their own corrections
CREATE POLICY "Users can create own corrections" ON attendance_corrections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Managers and admins can update corrections (approve/reject)
CREATE POLICY "Managers can update corrections" ON attendance_corrections
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role IN ('manager', 'admin')
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_attendance_corrections_updated_at
    BEFORE UPDATE ON attendance_corrections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add attendance_id column if it doesn't exist (for existing tables)
ALTER TABLE attendance_corrections ADD COLUMN IF NOT EXISTS attendance_id UUID REFERENCES attendance(id);