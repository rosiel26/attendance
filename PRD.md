# Attendance Management System - Product Requirements Document

## Executive Summary

The Attendance Management System is a modern, web-based solution for organizations to track employee attendance, manage work hours, handle leave requests, and generate comprehensive attendance reports. Built with Vite React frontend and Supabase backend, this system provides real-time tracking, intuitive UI, and powerful analytics to outperform existing competitors like Ylker.

**Key Differentiators:**
- Real-time GPS-based attendance verification
- Advanced analytics and predictive insights
- Mobile-responsive design for on-the-go check-ins
- Intelligent leave recommendations
- Automated compliance reporting
- Team-based dashboards and insights
- Integration capabilities with payroll systems

---

## 1. PRODUCT VISION & GOALS

### Vision
Empower organizations with a transparent, user-friendly attendance management system that streamlines workforce management, improves accountability, and saves administrative overhead.

### Primary Goals
1. Reduce manual attendance management overhead by 80%
2. Provide real-time visibility into employee attendance
3. Enable data-driven workforce decisions
4. Improve employee experience with mobile-first design
5. Ensure compliance with labor regulations

---

## 2. TARGET USERS

### Primary Users
- **HR Administrators** - Manage company-wide attendance policies and reporting
- **Department Managers** - Monitor team attendance and approve leaves
- **Employees** - Check in/out and manage personal attendance
- **Finance/Payroll Team** - Access attendance data for payroll processing

### Secondary Users
- **C-Suite/Executives** - View attendance dashboards and analytics
- **IT Administrators** - Manage system settings and user access

---

## 3. MVP FEATURES (Phase 1 - Core Functionality)

### 3.1 Employee Check-In/Check-Out System
**Features:**
- One-click check-in/check-out with timestamp
- Current time display on dashboard
- Last check-in status indicator
- Geolocation capture for remote verification (optional)
- Browser-based punch clock

**User Stories:**
- As an employee, I can check in when arriving at work
- As an employee, I can check out when leaving work
- As an employee, I can see my current status (checked in/out)
- As a manager, I can see real-time attendance status of my team

### 3.2 Daily Attendance Dashboard
**Features:**
- Daily attendance calendar view
- Check-in/check-out times display
- Total hours worked calculation
- Late/early arrival indicators
- Weekend/holiday marking
- Status badges (On Time, Late, Absent, Half-day, On Leave)
- Color-coded status indicators

**User Stories:**
- As an employee, I can view my daily attendance records
- As an employee, I can see my total hours for the day/week/month
- As a manager, I can view team member attendance at a glance

### 3.3 Leave Management System
**Features:**
- Leave request submission form
- Leave type selection (Sick, Personal, Casual, Paid, Unpaid)
- Date range picker for leave dates
- Optional notes/reason field
- Manager approval/rejection workflow
- Leave balance tracking
- Leave history view

**User Stories:**
- As an employee, I can request leave with reason
- As a manager, I can approve or reject leave requests
- As an employee, I can check my remaining leave balance
- As an employee, I can view my leave history

### 3.4 Attendance Tracking & Reports
**Features:**
- Weekly attendance view (calendar grid)
- Monthly attendance summary
- Attendance export to CSV/PDF
- Holiday calendar management
- Mark employees as absent/present/on-leave
- Generate payroll-ready reports
- Attendance statistics (present %, absent %)

**User Stories:**
- As a manager, I can generate attendance reports
- As HR, I can export attendance data for payroll
- As a manager, I can identify attendance patterns and issues

### 3.5 Holiday Management
**Features:**
- Company holiday calendar
- Recurring holiday setup (annual holidays)
- Holiday override per employee
- Holiday import from calendar files
- Holiday display on attendance calendar

### 3.6 User Authentication & Authorization
**Features:**
- Email/password registration and login
- Role-based access control (Admin, Manager, Employee)
- Organization/company management
- Department hierarchy
- User profile management
- Password reset functionality
- Session management

### 3.7 Admin Dashboard
**Features:**
- System settings configuration
- User management (add/remove users)
- Department management
- Policy configuration (work hours, late threshold)
- System logs and activity tracking
- Organization settings

### 3.8 Mobile Responsiveness
- Fully responsive design for mobile/tablet
- Touch-friendly check-in button
- Mobile-optimized navigation
- Offline support for critical features

---

## 4. POST-MVP FEATURES (Phase 2-3)

### Phase 2 (Q2 2026)
1. **Biometric Integration** - Fingerprint, facial recognition
2. **Advanced Analytics** - Predictive insights, trend analysis
3. **Shift Management** - Multi-shift support, rotating schedules
4. **Geofencing** - GPS-based location verification
5. **Integration APIs** - Payroll system, ERP systems
6. **Mobile App** - Native iOS/Android applications
7. **Email Notifications** - Approval alerts, deadline reminders
8. **Overtime Management** - Overtime calculation and approval

### Phase 3 (Q4 2026)
1. **AI-powered Insights** - Anomaly detection, pattern recognition
2. **Compliance Reports** - Labor law compliance tracking
3. **Team Analytics** - Productivity metrics, team performance
4. **Attendance Predictions** - ML-based absenteeism prediction
5. **Calendar Sync** - Google Calendar, Outlook integration
6. **Video Verification** - Proof of presence with selfie
7. **Visitor Management** - Guest tracking
8. **Anonymous Feedback** - Employee pulse surveys

---

## 5. TECHNICAL ARCHITECTURE

### 5.1 Tech Stack

**Frontend:**
- **Framework:** React 18+
- **Build Tool:** Vite
- **State Management:** Redux Toolkit / Zustand
- **UI Components:** Material-UI (MUI) or Tailwind CSS
- **Charts:** Chart.js / Recharts
- **Date/Time:** Day.js or date-fns
- **HTTP Client:** Axios
- **Authentication:** Supabase Auth
- **Real-time:** Supabase Realtime
- **Geolocation:** Geolocation API

**Backend:**
- **Platform:** Supabase
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** Supabase Auth
- **Real-time Updates:** Supabase Realtime
- **File Storage:** Supabase Storage
- **Functions:** Supabase Edge Functions (for automation)

**Database Schema Overview:**

```sql
-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  code VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users/Employees
CREATE TABLE users (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR NOT NULL,
  role VARCHAR (admin, manager, employee),
  department_id UUID REFERENCES departments(id),
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR NOT NULL,
  manager_id UUID REFERENCES users(id)
);

-- Attendance Records
CREATE TABLE attendance (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  duration_hours DECIMAL,
  status VARCHAR (on-time, late, absent, on-leave),
  notes TEXT,
  geolocation JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Requests
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  leave_type VARCHAR (sick, personal, casual, paid, unpaid),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR (pending, approved, rejected),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Balances
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  leave_type VARCHAR,
  total_days INT,
  used_days INT,
  remaining_days INT,
  year INT
);

-- Holidays
CREATE TABLE holidays (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Policies
CREATE TABLE attendance_policies (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  work_start_time TIME,
  work_end_time TIME,
  late_threshold_minutes INT DEFAULT 15,
  half_day_hours DECIMAL DEFAULT 4,
  overtime_multiplier DECIMAL DEFAULT 1.5
);
```

---

## 6. DETAILED BUILD STEPS

### Step 1: Project Setup

#### 1.1 Create Vite React Project
```bash
npm create vite@latest attendance-system -- --template react
cd attendance-system
npm install
```

#### 1.2 Install Core Dependencies
```bash
npm install react-router-dom axios zustand
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install @supabase/supabase-js
npm install recharts chart.js react-chartjs-2
npm install date-fns dayjs
npm install react-hot-toast
npm install react-hook-form
npm install clsx
npm install -D tailwindcss postcss autoprefixer
```

#### 1.3 Setup Tailwind CSS (Optional)
```bash
npx tailwindcss init -p
```

### Step 2: Configure Supabase

#### 2.1 Create Supabase Client
Create `src/config/supabase.js`:
```javascript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gecidqdnnezymamgkcjv.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

#### 2.2 Get Supabase Credentials
1. Go to https://app.supabase.com
2. Select your project (gecidqdnnezymamgkcjv)
3. Go to Settings → API
4. Copy the project URL and anon key
5. Create `.env.local` file:
```
VITE_SUPABASE_URL=https://gecidqdnnezymamgkcjv.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 3: Database Setup

#### 3.1 Create Database Tables
In Supabase SQL Editor, execute the schema from section 5.1

#### 3.2 Setup Row Level Security (RLS)
Enable RLS on all tables and create policies:

```sql
-- Enable RLS on all tables
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

-- Employees can see only their own records
CREATE POLICY "Users can see own attendance" ON attendance
  FOR SELECT USING (auth.uid() = user_id);

-- Managers can see team attendance
CREATE POLICY "Managers can see team attendance" ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'manager'
    )
  );

-- Employees can insert their own attendance
CREATE POLICY "Users can insert own attendance" ON attendance
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Step 4: Project Structure

```
attendance-system/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── Dashboard/
│   │   │   ├── EmployeeDashboard.jsx
│   │   │   ├── ManagerDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── Attendance/
│   │   │   ├── CheckInOut.jsx
│   │   │   ├── AttendanceCalendar.jsx
│   │   │   └── AttendanceDetails.jsx
│   │   ├── Leave/
│   │   │   ├── LeaveRequest.jsx
│   │   │   ├── LeaveApproval.jsx
│   │   │   └── LeaveBalance.jsx
│   │   ├── Reports/
│   │   │   ├── AttendanceReport.jsx
│   │   │   ├── ReportGenerator.jsx
│   │   │   └── ReportExport.jsx
│   │   ├── Common/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── Modal.jsx
│   │   └── Admin/
│   │       ├── UserManagement.jsx
│   │       ├── DepartmentManagement.jsx
│   │       ├── PolicySettings.jsx
│   │       └── HolidayManagement.jsx
│   ├── services/
│   │   ├── authService.js
│   │   ├── attendanceService.js
│   │   ├── leaveService.js
│   │   ├── reportService.js
│   │   ├── userService.js
│   │   └── supabaseService.js
│   ├── stores/
│   │   ├── authStore.js
│   │   ├── attendanceStore.js
│   │   ├── leaveStore.js
│   │   └── userStore.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useAttendance.js
│   │   └── useFetch.js
│   ├── utils/
│   │   ├── dateUtils.js
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── constants.js
│   ├── config/
│   │   ├── supabase.js
│   │   └── apiConfig.js
│   ├── styles/
│   │   ├── index.css
│   │   └── tailwind.css
│   ├── App.jsx
│   └── main.jsx
├── .env.local
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

### Step 5: Core Implementation

#### 5.1 Supabase Service Layer
Create `src/services/supabaseService.js`:
```javascript
import { supabase } from '../config/supabase';

// Attendance functions
export const checkIn = async (userId, geolocation = null) => {
  return await supabase.from('attendance').insert([
    {
      user_id: userId,
      check_in_time: new Date(),
      geolocation,
    }
  ]);
};

export const checkOut = async (userId) => {
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .is('check_out_time', null)
    .single();

  if (attendance) {
    const checkInTime = new Date(attendance.check_in_time);
    const checkOutTime = new Date();
    const duration = (checkOutTime - checkInTime) / (1000 * 60 * 60);

    return await supabase
      .from('attendance')
      .update({
        check_out_time: checkOutTime,
        duration_hours: duration.toFixed(2),
      })
      .eq('id', attendance.id);
  }
};

export const getAttendanceRecords = async (userId, startDate, endDate) => {
  return await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', userId)
    .gte('check_in_time', startDate)
    .lte('check_in_time', endDate)
    .order('check_in_time', { ascending: false });
};

// Leave functions
export const requestLeave = async (leaveData) => {
  return await supabase.from('leave_requests').insert([leaveData]);
};

export const getLeaveRequests = async (userId, role) => {
  if (role === 'employee') {
    return await supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  } else if (role === 'manager') {
    // Get leave requests from team members
    return await supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false });
  }
};

export const approveLeave = async (leaveRequestId, approverUserId) => {
  return await supabase
    .from('leave_requests')
    .update({ status: 'approved', approved_by: approverUserId })
    .eq('id', leaveRequestId);
};

export const rejectLeave = async (leaveRequestId) => {
  return await supabase
    .from('leave_requests')
    .update({ status: 'rejected' })
    .eq('id', leaveRequestId);
};
```

#### 5.2 State Management (Zustand)
Create `src/stores/authStore.js`:
```javascript
import { create } from 'zustand';
import { supabase } from '../config/supabase';

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      set({ user: data.user, error: null });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },

  signup: async (email, password, fullName) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      set({ user: data.user, error: null });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
}));
```

#### 5.3 Check-In/Check-Out Component
Create `src/components/Attendance/CheckInOut.jsx`:
```javascript
import React, { useState, useEffect } from 'react';
import { checkIn, checkOut, getTodayAttendance } from '../../services/supabaseService';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export const CheckInOut = () => {
  const { user } = useAuthStore();
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  const fetchTodayStatus = async () => {
    const { data } = await getTodayAttendance(user?.id);
    if (data && data.length > 0) {
      const today = data[0];
      setCheckInTime(today.check_in_time);
      setCheckedIn(!today.check_out_time);
    }
  };

  const handleCheckIn = async () => {
    try {
      const { error } = await checkIn(user?.id);
      if (error) throw error;
      setCheckInTime(new Date());
      setCheckedIn(true);
      toast.success('Checked in successfully!');
    } catch (error) {
      toast.error('Check-in failed: ' + error.message);
    }
  };

  const handleCheckOut = async () => {
    try {
      const { error } = await checkOut(user?.id);
      if (error) throw error;
      setCheckedIn(false);
      toast.success('Checked out successfully!');
    } catch (error) {
      toast.error('Check-out failed: ' + error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-lg">
      <div className="text-6xl font-bold text-gray-800 mb-4">
        {currentTime.toLocaleTimeString()}
      </div>
      <div className="text-xl text-gray-600 mb-8">
        {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>

      {checkInTime && (
        <div className="mb-6 text-center">
          <p className="text-gray-700">Check-in Time: <span className="font-bold">{new Date(checkInTime).toLocaleTimeString()}</span></p>
        </div>
      )}

      <button
        onClick={checkedIn ? handleCheckOut : handleCheckIn}
        className={`px-8 py-4 rounded-lg font-bold text-white text-xl transition-all ${
          checkedIn
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-green-500 hover:bg-green-600'
        }`}
      >
        {checkedIn ? 'Check Out' : 'Check In'}
      </button>

      <div className="mt-8 text-sm text-gray-600">
        Status: <span className={`font-bold ${checkedIn ? 'text-green-600' : 'text-gray-600'}`}>
          {checkedIn ? 'Checked In' : 'Checked Out'}
        </span>
      </div>
    </div>
  );
};
```

#### 5.4 Attendance Calendar Component
Create `src/components/Attendance/AttendanceCalendar.jsx`:
```javascript
import React, { useState, useEffect } from 'react';
import { getAttendanceRecords } from '../../services/supabaseService';
import { useAuthStore } from '../../stores/authStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';

export const AttendanceCalendar = () => {
  const { user } = useAuthStore();
  const [attendance, setAttendance] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchMonthlyAttendance();
  }, [currentMonth]);

  const fetchMonthlyAttendance = async () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const { data } = await getAttendanceRecords(user?.id, start, end);
    
    const attendanceMap = {};
    data?.forEach(record => {
      const date = format(new Date(record.check_in_time), 'yyyy-MM-dd');
      attendanceMap[date] = record;
    });
    setAttendance(attendanceMap);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getStatusColor = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = attendance[dateStr];
    if (!record) return 'bg-gray-100';
    return record.duration_hours ? 'bg-green-100' : 'bg-yellow-100';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Attendance Calendar</h2>
      <div className="mb-4 flex justify-between items-center">
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
          ← Previous
        </button>
        <span className="font-bold">{format(currentMonth, 'MMMM yyyy')}</span>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
          Next →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="font-bold text-center p-2">{day}</div>
        ))}
        {days.map(day => (
          <div key={day} className={`p-3 rounded text-center ${getStatusColor(day)}`}>
            <div className="font-bold">{format(day, 'd')}</div>
            {attendance[format(day, 'yyyy-MM-dd')] && (
              <div className="text-xs">{attendance[format(day, 'yyyy-MM-dd')].duration_hours}h</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

#### 5.5 Leave Request Component
Create `src/components/Leave/LeaveRequest.jsx`:
```javascript
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { requestLeave } from '../../services/supabaseService';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export const LeaveRequest = () => {
  const { user } = useAuthStore();
  const { register, handleSubmit, reset } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { error } = await requestLeave({
        user_id: user?.id,
        leave_type: data.leaveType,
        start_date: data.startDate,
        end_date: data.endDate,
        reason: data.reason,
        status: 'pending',
      });
      if (error) throw error;
      toast.success('Leave request submitted successfully!');
      reset();
    } catch (error) {
      toast.error('Failed to submit leave request: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md">
      <h2 className="text-2xl font-bold mb-4">Request Leave</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Leave Type</label>
          <select {...register('leaveType')} className="w-full p-2 border rounded">
            <option value="sick">Sick Leave</option>
            <option value="personal">Personal Leave</option>
            <option value="casual">Casual Leave</option>
            <option value="paid">Paid Leave</option>
            <option value="unpaid">Unpaid Leave</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Start Date</label>
          <input type="date" {...register('startDate')} className="w-full p-2 border rounded" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">End Date</label>
          <input type="date" {...register('endDate')} className="w-full p-2 border rounded" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Reason</label>
          <textarea {...register('reason')} className="w-full p-2 border rounded" rows="4"></textarea>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded font-bold hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
};
```

### Step 6: Routing Setup
Create `src/App.jsx`:
```javascript
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { supabase } from './config/supabase';

import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import EmployeeDashboard from './components/Dashboard/EmployeeDashboard';
import ManagerDashboard from './components/Dashboard/ManagerDashboard';
import AdminDashboard from './components/Dashboard/AdminDashboard';

function App() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/employee" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
        <Route path="/manager" element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
```

### Step 7: Build & Deploy

#### 7.1 Development
```bash
npm run dev
```

#### 7.2 Production Build
```bash
npm run build
```

#### 7.3 Deploy (Options)
**Vercel:**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm run build
# Connect repo to Netlify via dashboard
```

**Docker (Optional):**
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

---

## 7. COMPETITIVE ADVANTAGES vs Ylker

| Feature | Ylker | Our System |
|---------|-------|-----------|
| **Real-time Geolocation** | Limited | ✅ GPS-based verification |
| **Advanced Analytics** | Basic | ✅ Predictive insights & ML |
| **Mobile App** | No | ✅ Native iOS/Android planned |
| **Offline Support** | No | ✅ Offline capability |
| **Integration APIs** | No | ✅ Payroll & ERP integration |
| **Customizable Policies** | Limited | ✅ Flexible policy engine |
| **Team Analytics** | No | ✅ Comprehensive team insights |
| **Compliance Reporting** | Basic | ✅ Labor law compliance |
| **Biometric Support** | No | ✅ Fingerprint & facial recognition |
| **User Experience** | Good | ✅ Superior modern UI/UX |

---

## 8. SUCCESS METRICS

### Key Performance Indicators (KPIs)
1. **Adoption Rate:** 80% employee adoption within 3 months
2. **System Uptime:** 99.9% availability
3. **User Satisfaction:** NPS score > 50
4. **Time Saved:** 10+ hours/month per HR admin
5. **Data Accuracy:** 99.5% attendance records accuracy
6. **Error Rate:** < 0.1% system errors
7. **Response Time:** < 200ms API response time
8. **Active Users:** 85% DAU (Daily Active Users)

---

## 9. TIMELINE & MILESTONES

### Phase 1 (MVP) - 8 weeks
- Week 1-2: Setup & architecture
- Week 3-4: Core attendance features
- Week 5-6: Leave management
- Week 7-8: Testing & deployment

### Phase 2 - 12 weeks (Weeks 9-20)
- Geofencing & GPS integration
- Payroll system integration
- Mobile app MVP

### Phase 3 - 16 weeks (Weeks 21-36)
- AI-powered analytics
- Biometric integration
- Advanced compliance reporting

---

## 10. BUDGET ESTIMATE

### Infrastructure (Monthly)
- Supabase Pro: $25
- Hosting (Vercel): $20
- Domain: $12
- Email Service: $50
- **Total: ~$107/month**

### Development
- Frontend: 160 hours
- Backend: 120 hours
- Testing: 80 hours
- **Total: 360 hours**

### Post-Launch (Monthly)
- Maintenance: 20 hours
- Support: 30 hours
- Feature development: 40 hours

---

## 11. RISKS & MITIGATION

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Data breach | Critical | Implement encryption, SSL, regular audits |
| System downtime | High | Database backups, failover systems |
| Poor adoption | High | User training, excellent UX, documentation |
| Integration issues | Medium | Comprehensive API documentation |
| Performance issues | Medium | Load testing, optimization, CDN |

---

## 12. SUCCESS CRITERIA

- ✅ MVP launched on schedule
- ✅ Zero critical security vulnerabilities
- ✅ 95%+ system uptime
- ✅ All core features tested and working
- ✅ User documentation complete
- ✅ 50+ initial pilot users
- ✅ NPS > 40 within first month

---

## Appendix: Getting Started Checklist

- [ ] Create Supabase account & project (gecidqdnnezymamgkcjv)
- [ ] Clone repository
- [ ] Create `.env.local` with Supabase credentials
- [ ] Run `npm install`
- [ ] Run database migrations
- [ ] Run `npm run dev`
- [ ] Test check-in/check-out
- [ ] Test leave requests
- [ ] Test authentication
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Next Review:** March 2026
