-- ============================================
-- ADD: Manager and Department columns to users table
-- ============================================
-- This adds manager_id and ensures department_id exists in the users table
-- for proper employee hierarchy and department assignment

-- Add manager_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'manager_id') THEN
        ALTER TABLE users ADD COLUMN manager_id UUID REFERENCES users(id);
    END IF;
END $$;

-- Add department_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'department_id') THEN
        ALTER TABLE users ADD COLUMN department_id UUID REFERENCES departments(id);
    END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);