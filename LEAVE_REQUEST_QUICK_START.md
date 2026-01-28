# 🎯 Leave Request Management - Quick Start

## What's New

Managers can now **approve or reject employee leave requests** with detailed rejection reasons directly from the Manager Dashboard.

## 🚀 Quick Setup

### Step 1: Database Update (Required)
Run this SQL in Supabase SQL Editor:
```sql
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
```

### Step 2: Test the Feature

1. **Login as Manager** → Manager Dashboard
2. **Click "📋 Leave Requests" tab**
3. **See pending leave requests from your team**
4. **Choose an action:**
   - Click **"✓ Approve"** → Instantly approves the request
   - Click **"✕ Reject"** → Opens modal to enter rejection reason

## 📋 Leave Request Workflow

### Employee Perspective
1. Go to "Leave Request" tab in Employee Dashboard
2. Fill out: Leave Type, Start Date, End Date, Reason
3. Submit and wait for manager approval
4. Check "Leave History" tab for status updates

### Manager Perspective
1. Go to "Leave Requests" tab in Manager Dashboard
2. See all pending requests from team members
3. **Approve**: Click green checkmark
4. **Reject**: Click red X and enter reason in modal

## ✨ Features

| Feature | Details |
|---------|---------|
| **Approval** | Instantly sets status to "approved" with timestamp |
| **Rejection** | Requires manager to provide reason via modal |
| **Validation** | Cannot reject without entering a reason |
| **Display** | Shows rejection reason in the table for rejected requests |
| **Tracking** | Records which manager approved/rejected and when |

## 📊 Table Columns

Shows for each leave request:
- 👤 **Employee** - Who requested leave
- 📅 **Leave Type** - Type of leave (Annual, Sick, etc.)
- 📆 **Start Date** - Beginning of leave period
- 📆 **End Date** - End of leave period
- 📝 **Reason** - Why employee requested leave
- 🏷️ **Status** - Pending (orange), Approved (green), Rejected (red)
- ⚙️ **Actions** - Approve/Reject buttons or rejection reason

## 🔧 Rejection Modal

When you click "Reject":
1. A popup modal appears
2. Enter your rejection reason
3. Click "Reject" to confirm or "Cancel" to go back
4. Reason is saved and displayed in the table

## 📱 Mobile Friendly

- Responsive design works on desktop and mobile
- Modal centers on screen with overlay
- Action buttons easily clickable on touch devices

## ❓ Troubleshooting

**Problem**: Modal doesn't appear when clicking reject
- **Solution**: Make sure database has `approved_at` column added

**Problem**: Cannot submit rejection without reason
- **Solution**: This is by design - enter a reason in the textarea first

**Problem**: Table shows no requests
- **Solution**: 
  - Check if team members exist in your department
  - Check if leave requests exist in the database
  - Verify your department_id is set correctly

## 📚 Full Documentation

See detailed guides:
- [LEAVE_REQUEST_GUIDE.md](LEAVE_REQUEST_GUIDE.md) - Complete feature guide
- [LEAVE_REQUEST_IMPLEMENTATION.md](LEAVE_REQUEST_IMPLEMENTATION.md) - Implementation details
- [LEAVE_REQUEST_SCHEMA_UPDATE.md](LEAVE_REQUEST_SCHEMA_UPDATE.md) - Database schema

## 🎓 Example Workflow

```
1. Employee Raj requests 3 days of leave (Jan 15-17)
   → Status: "pending"

2. Manager sees request in Leave Requests tab
   → Options: Approve or Reject

3. Manager clicks "Reject" 
   → Modal appears

4. Manager types: "Project deadline is Jan 20, need your presence"
   → Clicks "Reject"

5. Raj's leave request shows:
   → Status: "rejected" (red)
   → Reason: "Project deadline is Jan 20, need your presence"
```

## 🎯 Next Steps

1. ✅ Run the SQL migration to add `approved_at` column
2. ✅ Login as a manager
3. ✅ Test approving a leave request
4. ✅ Test rejecting with a reason
5. ✅ Verify rejection reason displays in table

Happy leave management! 🎉
