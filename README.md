# AttendanceHub - Employee Attendance Management System

A modern, feature-rich attendance management system built with Vite React and Supabase. Track employee attendance, manage leaves, and generate comprehensive reports with real-time synchronization.

## 🚀 Features

### MVP Features
- ✅ Real-time Check-In/Check-Out System
- ✅ Daily Attendance Dashboard
- ✅ Attendance Calendar View
- ✅ Leave Request Management
- ✅ Leave Balance Tracking
- ✅ User Authentication
- ✅ Mobile Responsive Design
- ✅ Holiday Management

### Post-MVP Features (Phase 2-3)
- 🔄 GPS-Based Geolocation Tracking
- 🔄 Biometric Integration
- 🔄 Advanced Analytics & Insights
- 🔄 Mobile App (iOS/Android)
- 🔄 Payroll System Integration
- 🔄 AI-Powered Predictions

## 💻 Tech Stack

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **State Management:** Zustand
- **UI Components:** Material-UI + Tailwind CSS
- **HTTP Client:** Axios
- **Date Handling:** date-fns
- **Forms:** React Hook Form
- **Notifications:** React Hot Toast

### Backend
- **Platform:** Supabase
- **Database:** PostgreSQL
- **Authentication:** Supabase Auth
- **Real-time:** Supabase Realtime
- **Project ID:** `gecidqdnnezymamgkcjv`

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project
- Supabase project credentials

## 🛠️ Installation & Setup

### Step 1: Clone/Create Project
```bash
cd attendance-system
npm install
```

### Step 2: Configure Environment
Create `.env.local` file:
```env
VITE_SUPABASE_URL=https://gecidqdnnezymamgkcjv.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Get your credentials from [Supabase Dashboard](https://app.supabase.com)

### Step 3: Setup Database

Go to Supabase SQL Editor and execute the SQL schema:

```sql
-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  code VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'employee',
  department_id UUID REFERENCES departments(id),
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR NOT NULL,
  manager_id UUID REFERENCES users(id)
);

-- Attendance
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  duration_hours DECIMAL(5,2),
  status VARCHAR DEFAULT 'pending',
  geolocation JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Requests
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type VARCHAR NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Balances
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leave_type VARCHAR NOT NULL,
  total_days INT DEFAULT 0,
  used_days INT DEFAULT 0,
  remaining_days INT DEFAULT 0,
  year INT NOT NULL,
  UNIQUE(user_id, leave_type, year)
);

-- Holidays
CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Policies
CREATE TABLE attendance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  work_start_time TIME DEFAULT '09:00',
  work_end_time TIME DEFAULT '17:00',
  late_threshold_minutes INT DEFAULT 15,
  half_day_hours DECIMAL DEFAULT 4,
  overtime_multiplier DECIMAL DEFAULT 1.5
);

-- Enable RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users table
-- Allow ANYONE (authenticated or not) to view managers during registration
CREATE POLICY "Anyone can view managers" ON users
  FOR SELECT USING (role = 'manager');

-- Allow authenticated users to view their own profile
CREATE POLICY "Users can see own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Allow managers to see their department's employees
CREATE POLICY "Managers can see their team" ON users
  FOR SELECT USING (
    auth.uid() IS NOT NULL 
    AND (
      auth.uid() = manager_id 
      OR manager_id IN (SELECT id FROM users WHERE organization_id = users.organization_id AND role = 'manager')
    )
  );

-- Allow admins to see all users in their organization
CREATE POLICY "Admins can see organization users" ON users
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND auth.uid() IN (SELECT id FROM users WHERE role = 'admin' AND organization_id = users.organization_id)
  );

-- RLS Policies for Attendance
CREATE POLICY "Users can see own attendance" ON attendance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attendance" ON attendance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Leave Requests
CREATE POLICY "Users can see own leave requests" ON leave_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own leave requests" ON leave_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Step 4: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Step 5: Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## 📱 Usage

### Employee
1. Register with email and password
2. Click "Check In" when arriving at office
3. Click "Check Out" when leaving
4. View attendance calendar for the month
5. Request leave from the Leave section
6. Track leave balance

### Manager
- Monitor team attendance
- Approve/reject leave requests
- Generate team reports

### Admin
- Manage users and departments
- Set attendance policies
- Manage holidays
- View system analytics

## 🚀 Deployment

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Connect your repo to Netlify via dashboard
```

### Deploy with Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## 📊 API Endpoints

All API calls are handled through Supabase client:

### Attendance
- `checkIn(userId, geolocation)` - Check in employee
- `checkOut(userId)` - Check out employee
- `getTodayAttendance(userId)` - Get today's records
- `getAttendanceRecords(userId, startDate, endDate)` - Get attendance range

### Leave
- `requestLeave(leaveData)` - Request leave
- `getLeaveRequests(userId, role)` - Get leave requests
- `approveLeave(leaveRequestId, approverUserId)` - Approve leave
- `rejectLeave(leaveRequestId, reason)` - Reject leave
- `getLeaveBalance(userId)` - Get leave balance

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Supabase Auth for user authentication
- Password hashing and secure session management
- HTTPS for all communications
- Environment variables for sensitive data

## 📝 Project Structure

```
attendance-system/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   ├── Dashboard/
│   │   ├── Attendance/
│   │   ├── Leave/
│   │   └── Common/
│   ├── services/
│   │   └── supabaseService.js
│   ├── stores/
│   │   ├── authStore.js
│   │   ├── attendanceStore.js
│   │   └── leaveStore.js
│   ├── hooks/
│   ├── utils/
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
└── .env.local
```

## 🐛 Troubleshooting

### Supabase Connection Issues
- Verify `.env.local` has correct credentials
- Check Supabase project is active
- Ensure ANON_KEY is not empty

### Database Errors
- Run RLS policies in SQL editor
- Check table permissions in Supabase
- Verify user authentication

### Build Errors
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Vite cache: `rm -rf .vite`
- Check Node version: `node --version`

## 📚 Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/)

## 📄 License

MIT License - feel free to use this project for commercial and personal purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For issues and questions:
- Check [FAQs in PRD.md](./PRD.md)
- Review Supabase documentation
- Check GitHub issues

---

**Version:** 1.0.0  
**Last Updated:** January 2026  
**Built with ❤️ using Vite, React, and Supabase**
