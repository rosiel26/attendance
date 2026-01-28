# Leave Request Management - Complete Guide

## Feature Overview

The attendance system now includes a complete leave request management workflow that allows employees to request time off and managers to approve or reject those requests with detailed feedback.

## User Flow

### Employee Workflow
1. Employee navigates to "Leave Request" tab in Employee Dashboard
2. Fills out leave request form with:
   - Leave Type (e.g., Annual Leave, Sick Leave, etc.)
   - Start Date
   - End Date
   - Reason for leave
3. Submits the request
4. Request status is set to "pending"
5. Employee can view request status in "Leave History" tab

### Manager Workflow
1. Manager navigates to "Leave Requests" tab in Manager Dashboard
2. Views all pending leave requests from their team
3. For each request, can:
   - **Approve**: Directly approve by clicking "✓ Approve" button
   - **Reject**: Click "✕ Reject" button to open modal dialog
4. When rejecting:
   - A modal dialog appears
   - Manager enters rejection reason in textarea
   - Clicks "Reject" button to submit
   - Request status changes to "rejected" with reason displayed

## Table Columns (Leave Requests)

| Column | Display | Notes |
|--------|---------|-------|
| Employee | employee name | Joined from users table via user_id |
| Leave Type | badge (blue) | Shows type of leave being requested |
| Start Date | formatted date | Start of leave period |
| End Date | formatted date | End of leave period |
| Reason | text | Employee's reason for leave request |
| Status | colored badge | pending (orange), approved (green), rejected (red) |
| Actions | buttons | Approve/Reject for pending requests, Reason display for rejected |

## Database Schema

### leave_requests Table Structure

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
  approved_at TIMESTAMP,  -- NEW COLUMN - See LEAVE_REQUEST_SCHEMA_UPDATE.md
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Component Implementation

### ManagerDashboard.jsx
- **State Management**:
  - `leaveRequests`: Array of leave requests for manager's team
  - `rejectingRequestId`: Tracks which request is being rejected
  - `rejectionReason`: Stores the rejection reason entered by manager
  - `loading`: Loading state during API calls

- **Key Functions**:
  - `fetchManagerData()`: Fetches team members and their leave requests
  - `handleApproveLeave()`: Updates leave request status to 'approved' with timestamp
  - `handleRejectLeave()`: Updates leave request with 'rejected' status and rejection reason

- **UI Components**:
  - Leave Requests Table: Displays all pending/approved/rejected requests
  - Rejection Reason Modal: Appears when manager clicks reject, captures reason
  - Status Badges: Color-coded status indicators
  - Action Buttons: Approve/Reject buttons visible only for pending requests

### Modal Dialog Feature
```jsx
{rejectingRequestId && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h3 className="text-lg font-bold mb-4">Reject Leave Request</h3>
      <textarea
        value={rejectionReason}
        onChange={(e) => setRejectionReason(e.target.value)}
        placeholder="Enter reason for rejection..."
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 mb-4"
        rows="4"
      ></textarea>
      <div className="flex gap-3">
        <button onClick={() => handleRejectLeave(rejectingRequestId)}>Reject</button>
        <button onClick={() => { setRejectingRequestId(null); setRejectionReason(''); }}>Cancel</button>
      </div>
    </div>
  </div>
)}
```

## API Integration

All operations use Supabase with the following endpoints:

### Fetch Leave Requests
```javascript
const { data: leaveData } = await supabase
  .from('leave_requests')
  .select('*, users(full_name, email)')
  .in('user_id', teamIds)
  .order('created_at', { ascending: false });
```

### Approve Leave Request
```javascript
const { error } = await supabase
  .from('leave_requests')
  .update({ 
    status: 'approved', 
    approved_by: user?.id,
    approved_at: new Date().toISOString()
  })
  .eq('id', leaveId);
```

### Reject Leave Request
```javascript
const { error } = await supabase
  .from('leave_requests')
  .update({
    status: 'rejected',
    rejection_reason: rejectionReason.trim(),
    approved_by: user?.id,
    approved_at: new Date().toISOString(),
  })
  .eq('id', leaveId);
```

## UI/UX Features

1. **Modal Dialog**: Focused UI for entering rejection reason
2. **Validation**: Prevents rejection without providing a reason
3. **Visual Feedback**: Toast notifications for success/error messages
4. **Disabled States**: Buttons disabled during loading to prevent double submissions
5. **Rejection Display**: When rejected, the rejection reason is displayed instead of action buttons
6. **Color Coding**: 
   - Orange badge for pending requests
   - Green badge for approved requests
   - Red badge for rejected requests

## Error Handling

- **Missing Rejection Reason**: Shows toast "Please enter a reason for rejection"
- **API Errors**: Shows toast "Failed to approve/reject leave request"
- **Department Not Set**: Shows toast "Manager department not set"

## Testing Checklist

- [ ] Create a test employee and request leave
- [ ] Login as manager and view pending leave requests
- [ ] Click approve on a request and verify status changes to green "approved"
- [ ] Click reject on a request and verify modal appears
- [ ] Try to reject without entering reason - should show error
- [ ] Enter rejection reason and submit - verify status changes to red "rejected"
- [ ] Verify rejection reason displays in the actions column
- [ ] Check that approved_at timestamp is recorded correctly

## Future Enhancements

1. Email notifications when leave request is approved/rejected
2. Leave balance tracking and remaining days display
3. Bulk actions for multiple leave requests
4. Calendar view of approved leave
5. Team coverage analysis
6. Leave request history and audit trail
