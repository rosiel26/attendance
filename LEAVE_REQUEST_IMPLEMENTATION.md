# Leave Request Management - Implementation Summary

## ✅ Implementation Complete

The leave request management feature is now fully implemented in the Manager Dashboard. Here's what has been added:

## What's Working

### 1. **Leave Request Display Table**
- Shows all leave requests from the manager's team members
- Displays: Employee name, leave type, start/end dates, reason, and status
- Color-coded status badges (pending, approved, rejected)
- Joins with the users table to display employee names

### 2. **Approve Functionality** ✓
- Managers can click "✓ Approve" button on pending requests
- Records the approval with:
  - `status: 'approved'`
  - `approved_by: <manager_id>`
  - `approved_at: <timestamp>`
- Shows success toast notification

### 3. **Reject with Reason Modal** ✓
- Managers click "✕ Reject" button to open rejection modal
- Modal includes:
  - Textarea for entering rejection reason
  - Form validation (prevents empty reason)
  - "Reject" and "Cancel" buttons
  - Submit button disabled until reason is provided
- Records rejection with:
  - `status: 'rejected'`
  - `rejection_reason: <entered_text>`
  - `approved_by: <manager_id>`
  - `approved_at: <timestamp>`
- Shows success toast notification

### 4. **Rejection Reason Display** ✓
- When a request is rejected, the actions column shows:
  - Red status badge "rejected"
  - Rejection reason displayed in small text

## Code Changes Made

### ManagerDashboard.jsx

**State Variables Added:**
```javascript
const [rejectingRequestId, setRejectingRequestId] = useState(null);
const [rejectionReason, setRejectionReason] = useState('');
```

**Modal Dialog Added:**
- Fixed positioning overlay with semi-transparent background
- Centered modal box
- Textarea for reason input
- Reject and Cancel buttons
- Form validation

**Table Actions Column:**
```javascript
{request.status === 'pending' && (
  <div className="space-x-2 flex">
    <button onClick={() => handleApproveLeave(request.id)}>✓ Approve</button>
    <button onClick={() => setRejectingRequestId(request.id)}>✕ Reject</button>
  </div>
)}
{request.status === 'rejected' && request.rejection_reason && (
  <div className="text-xs text-red-600">
    <strong>Reason:</strong> {request.rejection_reason}
  </div>
)}
```

**Handler Functions:**
- `handleApproveLeave()`: Updates status to 'approved' with timestamp
- `handleRejectLeave()`: Validates reason, updates status to 'rejected', stores reason and timestamp

## Database Schema Required

Make sure the `leave_requests` table has these columns:

```sql
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
  approved_at TIMESTAMP,  -- ⚠️ IMPORTANT: Add this column if missing
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## ⚠️ Required Action: Database Migration

Before testing, run this SQL in Supabase to add the missing `approved_at` column:

```sql
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
```

## How to Test

1. **Setup**: 
   - Ensure you have the database schema with all columns
   - Create a test manager account
   - Create a test employee account assigned to the manager's department
   - Employee submits a leave request

2. **Test Approval Flow**:
   - Login as manager
   - Go to Manager Dashboard → Leave Requests tab
   - Click "✓ Approve" on a pending request
   - Verify: Status changes to "approved" (green badge)

3. **Test Rejection Flow**:
   - Click "✕ Reject" on another pending request
   - Modal appears asking for rejection reason
   - Try clicking "Reject" without entering reason
   - Verify: Error toast "Please enter a reason for rejection"
   - Enter rejection reason (e.g., "Not approved due to project deadline")
   - Click "Reject"
   - Verify: Status changes to "rejected" (red badge)
   - Verify: Rejection reason is displayed in the Actions column

## Feature Characteristics

✅ **Modal Validation**: Cannot reject without providing a reason
✅ **Loading States**: Buttons disabled during API calls
✅ **Toast Notifications**: User feedback on success/error
✅ **Timestamp Recording**: All approvals/rejections are timestamped
✅ **Manager Tracking**: Stores who approved/rejected each request
✅ **Reason Display**: Rejection reasons are visible in the table

## Files Modified/Created

1. **d:\attendance\src\components\Dashboard\ManagerDashboard.jsx** - Main implementation
2. **d:\attendance\LEAVE_REQUEST_SCHEMA_UPDATE.md** - Database migration guide
3. **d:\attendance\LEAVE_REQUEST_GUIDE.md** - Complete feature documentation

## Next Steps (Optional Enhancements)

1. Add email notifications when leave is approved/rejected
2. Show remaining leave balance when requesting
3. Add leave calendar view
4. Add audit trail for leave request changes
5. Add multi-day leave summary in employee dashboard

## Important Notes

- The `approved_at` column in the database schema is required for the feature to work properly
- All API calls use Supabase with proper error handling
- The component respects user permissions (manager can only see their team's requests)
- The modal prevents invalid submissions with client-side validation
