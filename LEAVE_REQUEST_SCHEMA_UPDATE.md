# Leave Request Schema Update

## Overview
The leave request management feature requires an additional column in the `leave_requests` table to track when a leave request was approved or rejected.

## Required Migration

Run the following SQL in Supabase SQL Editor to add the missing column:

```sql
-- Add approved_at column to track approval/rejection timestamp
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);
```

## Column Details

| Column | Type | Purpose |
|--------|------|---------|
| `approved_at` | TIMESTAMP | Records when a leave request was approved or rejected |
| `approved_by` | UUID | Stores the ID of the manager who approved/rejected the request |
| `rejection_reason` | TEXT | Stores the reason for rejection (already exists) |
| `status` | VARCHAR | Can be 'pending', 'approved', or 'rejected' |

## Implementation Notes

1. The `approved_by` column already exists in the schema
2. The `rejection_reason` column already exists in the schema
3. Only `approved_at` needs to be added
4. All three columns are used together in the leave request workflow

## Manager Dashboard Features

With these columns in place, managers can:
- Approve leave requests (sets status='approved', approved_by=manager_id, approved_at=timestamp)
- Reject leave requests with a detailed reason (status='rejected', rejection_reason=text, approved_at=timestamp)
- View rejection reasons when a request has been denied

## Testing the Feature

1. Login as a Manager
2. Go to Manager Dashboard → Leave Requests tab
3. Click "Reject" on a pending leave request
4. Enter a rejection reason in the modal dialog
5. Click "Reject" button to submit
6. Verify the request status changes to "rejected" with the reason displayed
