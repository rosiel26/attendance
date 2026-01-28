# Setup & Deployment Guide - AttendanceHub

## Quick Start (5 minutes)

### 1. Get Supabase Credentials
1. Go to https://app.supabase.com
2. Select project `gecidqdnnezymamgkcjv`
3. Click Settings → API
4. Copy:
   - Project URL: `https://gecidqdnnezymamgkcjv.supabase.co`
   - Anon Key: (copy the key shown)

### 2. Update .env.local
```bash
VITE_SUPABASE_URL=https://gecidqdnnezymamgkcjv.supabase.co
VITE_SUPABASE_ANON_KEY=your_copied_key_here
```

### 3. Install & Run
```bash
npm install
npm run dev
```

Visit: http://localhost:5173

---

## Complete Setup Steps

### Step 1: Initial Project Setup

```bash
# Install dependencies
npm install

# Verify installation
npm list
```

**Expected packages:**
- react@18.2.0+
- vite@5.0.0+
- @supabase/supabase-js@2.38.0+
- zustand@4.4.0+
- date-fns@2.30.0+
- react-hot-toast@2.4.0+

### Step 2: Supabase Database Setup

#### A. Create Tables
Open Supabase SQL Editor and run:

```sql
-- 1. Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'employee' CHECK (role IN ('admin', 'manager', 'employee')),
  department_id UUID,
  phone VARCHAR,
  avatar_url VARCHAR,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  duration_hours DECIMAL(5,2),
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('on-time', 'late', 'absent', 'on-leave', 'half-day', 'checked-in', 'checked-out')),
  geolocation JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type VARCHAR NOT NULL CHECK (leave_type IN ('sick', 'personal', 'casual', 'paid', 'unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create leave_balances table
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type VARCHAR NOT NULL,
  total_days INT DEFAULT 0,
  used_days INT DEFAULT 0,
  remaining_days INT DEFAULT 0,
  year INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, leave_type, year)
);

-- 7. Create holidays table
CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_type VARCHAR CHECK (recurring_type IN ('annual', 'monthly')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, date)
);

-- 8. Create attendance_policies table
CREATE TABLE IF NOT EXISTS attendance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  work_start_time TIME DEFAULT '09:00',
  work_end_time TIME DEFAULT '17:00',
  late_threshold_minutes INT DEFAULT 15,
  half_day_hours DECIMAL DEFAULT 4,
  overtime_multiplier DECIMAL DEFAULT 1.5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_check_in_time ON attendance(check_in_time);
CREATE INDEX idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);

-- Create unique index for one check-in per day per user
CREATE UNIQUE INDEX idx_attendance_unique_daily ON attendance(user_id, DATE(check_in_time));
```

#### B. Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can view own attendance
CREATE POLICY "Users can view own attendance"
  ON attendance FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own attendance
CREATE POLICY "Users can insert own attendance"
  ON attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own attendance
CREATE POLICY "Users can update own attendance"
  ON attendance FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can view own leave requests
CREATE POLICY "Users can view own leave requests"
  ON leave_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert own leave requests
CREATE POLICY "Users can insert own leave requests"
  ON leave_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view own leave balance
CREATE POLICY "Users can view own leave balance"
  ON leave_balances FOR SELECT
  USING (auth.uid() = user_id);

-- Managers can view team attendance
CREATE POLICY "Managers can view team attendance"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin')
    )
  );

-- Managers can view team leave requests
CREATE POLICY "Managers can view team leave requests"
  ON leave_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin')
    )
  );

-- Managers can update leave requests
CREATE POLICY "Managers can update leave requests"
  ON leave_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin')
    )
  );
```

### Step 3: Environment Configuration

Create `.env.local`:
```env
VITE_SUPABASE_URL=https://gecidqdnnezymamgkcjv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 4: Development Server

```bash
npm run dev
```

Output:
```
  VITE v5.0.0  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Step 5: Test Features

1. **Register New Account**
   - Go to http://localhost:5173/register
   - Create test account
   - Check email for confirmation

2. **Test Check-In/Out**
   - Login with test account
   - Click "Check In"
   - Click "Check Out"
   - Verify records in Supabase

3. **Test Leave Request**
   - Go to Leave section
   - Submit leave request
   - Verify in database

---

## Production Deployment

### Option 1: Deploy to Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Build project
npm run build

# 3. Deploy
vercel

# 4. Follow prompts:
# - Select yes to connect project
# - Add environment variables
# - Deploy
```

### Option 2: Deploy to Netlify

```bash
# 1. Build project
npm run build

# 2. Go to netlify.com and create account

# 3. Option A: Connect GitHub repo
# - Click "New site from Git"
# - Select repository
# - Build command: npm run build
# - Publish directory: dist
# - Add environment variables
# - Deploy

# Option B: Manual deploy
# npm install -g netlify-cli
# netlify deploy --prod --dir=dist
```

### Option 3: Deploy to Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Serve
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

Build and run:
```bash
docker build -t attendance-hub .
docker run -p 5173:5173 -e VITE_SUPABASE_URL=... attendance-hub
```

---

## Environment Variables

### Development (.env.local)
```env
VITE_SUPABASE_URL=https://gecidqdnnezymamgkcjv.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Production (.env.production)
```env
VITE_SUPABASE_URL=https://gecidqdnnezymamgkcjv.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_APP_ENV=production
```

---

## Database Backup & Recovery

### Backup
```bash
# Using Supabase CLI
supabase db pull

# Or manual SQL export
# Supabase Dashboard → SQL Editor → Tables → Export to SQL
```

### Recovery
```bash
# Restore from SQL
supabase db push < backup.sql
```

---

## Monitoring & Debugging

### Check Logs
```bash
# Supabase Dashboard → Logs
# Filter by:
# - Authentication errors
# - Database errors
# - API errors
```

### Common Issues

| Issue | Solution |
|-------|----------|
| ANON_KEY missing | Add to .env.local |
| Database connection error | Verify Supabase URL and key |
| Auth failing | Check email verification |
| No attendance records | Check RLS policies |
| Slow queries | Add database indexes |

---

## Scaling Considerations

### Database Optimization
- Add indexes on frequently queried columns
- Archive old attendance records
- Partition large tables by date

### Application Optimization
- Implement pagination for large datasets
- Use React.memo for expensive components
- Optimize images and assets
- Enable gzip compression

### Infrastructure Scaling
- Use CDN for static files (Vercel handles this)
- Enable database read replicas (Supabase)
- Implement caching strategies
- Monitor API response times

---

## Security Checklist

- [ ] All environment variables secured
- [ ] HTTPS enabled on all endpoints
- [ ] RLS policies properly configured
- [ ] SQL injection prevention implemented
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Regular security audits conducted
- [ ] Data encryption at rest and in transit

---

## Performance Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| Page Load | < 2s | - |
| API Response | < 200ms | - |
| Database Query | < 100ms | - |
| Build Time | < 30s | - |
| Bundle Size | < 500KB | - |

---

## Troubleshooting Deployment

### Build Fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Loading
- Verify .env.local syntax
- Restart dev server
- Check for typos in variable names

### Database Connection Issues
- Verify credentials
- Check Supabase project status
- Review RLS policies
- Check network connectivity

---

**Version:** 1.0.0  
**Last Updated:** January 2026  
**For Support:** Check README.md and PRD.md
