# Quick Reference Guide

## 🚀 Getting Started in 10 Minutes

### Step 1: Setup (2 min)
```bash
cd attendance-system
npm install
```

### Step 2: Configure (2 min)
Edit `.env.local`:
```env
VITE_SUPABASE_URL=https://gecidqdnnezymamgkcjv.supabase.co
VITE_SUPABASE_ANON_KEY=your_key_here
```

### Step 3: Database (3 min)
Copy SQL from DEPLOYMENT.md and run in Supabase SQL Editor

### Step 4: Run (2 min)
```bash
npm run dev
# Open http://localhost:5173
```

### Step 5: Test
Register → Check In → Check Out ✓

---

## 📁 Project Structure

```
attendance-system/
├── src/
│   ├── components/
│   │   ├── Auth/              # Login, Register, ProtectedRoute
│   │   ├── Dashboard/         # Employee, Manager, Admin
│   │   ├── Attendance/        # CheckIn/Out, Calendar
│   │   ├── Leave/             # LeaveRequest, LeaveHistory
│   │   └── Common/            # Header, Sidebar
│   ├── services/
│   │   └── supabaseService.js # All API calls
│   ├── stores/
│   │   ├── authStore.js       # Auth state
│   │   ├── attendanceStore.js # Attendance state
│   │   └── leaveStore.js      # Leave state
│   ├── hooks/
│   │   ├── useAuth.js         # Auth hook
│   │   └── useFetch.js        # Fetch hook
│   ├── utils/
│   │   ├── formatters.js      # Format dates, times
│   │   ├── validators.js      # Form validation
│   │   └── constants.js       # App constants
│   ├── styles/
│   │   └── index.css          # Global styles
│   ├── App.jsx                # Main app
│   └── main.jsx               # Entry point
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
├── PRD.md                     # Product requirements
├── DEPLOYMENT.md              # Deployment guide
├── COMPETITIVE_ANALYSIS.md    # Market analysis
└── README.md                  # Documentation
```

---

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:5173)

# Building
npm run build            # Build for production
npm run preview          # Preview production build locally

# Database
# - Go to Supabase Dashboard SQL Editor
# - Copy SQL from DEPLOYMENT.md
# - Run in editor

# Environment
# - Edit .env.local
# - Restart dev server after changes
```

---

## 🎨 Component Usage Examples

### CheckInOut Component
```jsx
import CheckInOut from './components/Attendance/CheckInOut';

export default function App() {
  return <CheckInOut />;
}
```

### AttendanceCalendar Component
```jsx
import AttendanceCalendar from './components/Attendance/AttendanceCalendar';

export default function App() {
  return <AttendanceCalendar />;
}
```

### LeaveRequest Component
```jsx
import LeaveRequest from './components/Leave/LeaveRequest';

export default function App() {
  return <LeaveRequest />;
}
```

---

## 📡 Service Functions

### Attendance Services
```javascript
import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getAttendanceRecords,
  getTeamAttendance,
} from './services/supabaseService';

// Check In
await checkIn(userId, geolocation);

// Check Out
await checkOut(userId);

// Get today's records
const { data } = await getTodayAttendance(userId);

// Get date range
const { data } = await getAttendanceRecords(userId, startDate, endDate);
```

### Leave Services
```javascript
import {
  requestLeave,
  getLeaveRequests,
  approveLeave,
  rejectLeave,
  getLeaveBalance,
} from './services/supabaseService';

// Request leave
await requestLeave({
  user_id: userId,
  leave_type: 'sick',
  start_date: '2026-02-01',
  end_date: '2026-02-03',
  reason: 'Sick leave'
});

// Approve leave
await approveLeave(leaveRequestId, approverId);

// Get balance
const { data } = await getLeaveBalance(userId);
```

---

## 🏪 State Management (Zustand)

### Auth Store
```javascript
import { useAuthStore } from './stores/authStore';

const MyComponent = () => {
  const { user, login, logout, loading } = useAuthStore();
  
  // Use auth state
};
```

### Attendance Store
```javascript
import { useAttendanceStore } from './stores/attendanceStore';

const MyComponent = () => {
  const { todayAttendance, fetchTodayAttendance } = useAttendanceStore();
  
  // Use attendance state
};
```

### Leave Store
```javascript
import { useLeaveStore } from './stores/leaveStore';

const MyComponent = () => {
  const { leaveRequests, fetchLeaveRequests } = useLeaveStore();
  
  // Use leave state
};
```

---

## 🛣️ Routing

```javascript
// src/App.jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/employee" element={<ProtectedRoute><EmployeeDashboard /></ProtectedRoute>} />
  <Route path="/manager" element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />
  <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
</Routes>
```

---

## 🎯 Key Files to Modify

### To Add New Feature
1. **Create Component:** `src/components/Feature/Feature.jsx`
2. **Create Service:** Add to `src/services/supabaseService.js`
3. **Create Store:** `src/stores/featureStore.js` (if needed)
4. **Add Route:** Update `src/App.jsx`
5. **Add to Dashboard:** Add to dashboard component

### To Add New Database Table
1. Run SQL in Supabase Editor
2. Create RLS policies
3. Update services with new queries
4. Create store for state management

---

## 🐛 Debugging

### Check Console Errors
```javascript
// Open browser DevTools (F12)
// Go to Console tab
// Look for errors
```

### Check Network Requests
```javascript
// DevTools → Network tab
// Look for failed API requests
// Check response status
```

### Check Supabase Logs
```
// Supabase Dashboard → Logs
// Filter by error level
// Check timestamps
```

### Enable Debug Logging
```javascript
// src/config/supabase.js
const supabase = createClient(url, key, {
  debug: true, // Enable debug logging
});
```

---

## 📊 Database Queries

### View All Attendance
```sql
SELECT * FROM attendance ORDER BY check_in_time DESC;
```

### View User's Attendance
```sql
SELECT * FROM attendance WHERE user_id = 'user_id' ORDER BY check_in_time DESC;
```

### View Leave Requests
```sql
SELECT * FROM leave_requests ORDER BY created_at DESC;
```

### View Pending Leave Requests
```sql
SELECT * FROM leave_requests WHERE status = 'pending' ORDER BY created_at DESC;
```

### View Leave Balance
```sql
SELECT * FROM leave_balances WHERE year = 2026;
```

---

## 🔐 Security Checklist

- [ ] Environment variables are secure
- [ ] No API keys in code
- [ ] HTTPS enabled
- [ ] RLS policies configured
- [ ] CORS properly set
- [ ] Input validation implemented
- [ ] SQL injection prevention
- [ ] XSS protection enabled

---

## 🚢 Deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables configured
- [ ] Database backups created
- [ ] RLS policies enabled
- [ ] Build succeeds: `npm run build`
- [ ] Bundle size < 500KB
- [ ] Performance optimized
- [ ] Security review completed
- [ ] Documentation updated

---

## 📞 Support Resources

### Documentation
- [README.md](./README.md) - Full documentation
- [PRD.md](./PRD.md) - Product requirements
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [COMPETITIVE_ANALYSIS.md](./COMPETITIVE_ANALYSIS.md) - Market analysis

### External Resources
- [Vite Docs](https://vitejs.dev/)
- [React Docs](https://react.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/)

### Troubleshooting
1. Check documentation
2. Review error messages
3. Check Supabase logs
4. Verify environment variables
5. Test with fresh install

---

## 🎁 Bonus Tips

### Performance Optimization
```javascript
// Use React.memo for expensive components
import { memo } from 'react';
const MyComponent = memo(({ data }) => {
  return <div>{data}</div>;
});

// Use useMemo for expensive calculations
const value = useMemo(() => expensiveCalculation(), [dependencies]);
```

### Toast Notifications
```javascript
import toast from 'react-hot-toast';

toast.success('Operation successful!');
toast.error('Error occurred!');
toast.loading('Processing...');
```

### Date Formatting
```javascript
import { format, startOfMonth } from 'date-fns';

const formatted = format(new Date(), 'MMM dd, yyyy');
const monthStart = startOfMonth(new Date());
```

### Tailwind Classes
```html
<!-- Button -->
<button class="btn-primary">Click me</button>

<!-- Card -->
<div class="card">Content</div>

<!-- Input -->
<input class="input-field" />
```

---

## 💻 System Requirements

- **Node.js:** v16+
- **npm:** v7+
- **Browser:** Modern browser (Chrome, Firefox, Safari, Edge)
- **RAM:** 4GB+
- **Disk:** 2GB free space

---

## 📦 Package Versions

```json
{
  "react": "^18.2.0",
  "vite": "^5.0.0",
  "@supabase/supabase-js": "^2.38.0",
  "zustand": "^4.4.0",
  "react-router-dom": "^6.20.0",
  "tailwindcss": "^3.4.0",
  "date-fns": "^2.30.0",
  "react-hook-form": "^7.48.0",
  "react-hot-toast": "^2.4.0"
}
```

---

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Create pull request
5. Get review
6. Merge

---

**Quick Reference Version:** 1.0  
**Last Updated:** January 2026  
**For Full Details:** See README.md, PRD.md, and DEPLOYMENT.md
