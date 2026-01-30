-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
  target_role VARCHAR(50) DEFAULT 'all' CHECK (target_role IN ('all', 'team', 'employee', 'manager', 'admin')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policy for admins/managers to create announcements
CREATE POLICY "Admins and managers can create announcements"
  ON announcements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Create policy for admins/managers to delete their own announcements
CREATE POLICY "Admins and managers can delete announcements"
  ON announcements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Create policy for everyone to view announcements
CREATE POLICY "Everyone can view announcements"
  ON announcements
  FOR SELECT
  USING (true);

-- Create policy for admins/managers to update announcements
CREATE POLICY "Admins and managers can update announcements"
  ON announcements
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );
