# 📖 Leave Request Management - Visual Guide

## User Interface Overview

### Manager Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│                   Manager Dashboard                  │
├─────────────────────────────────────────────────────┤
│  [📊 Overview] [👥 Employees] [📋 Leave Requests] [📊 Attendance]
├─────────────────────────────────────────────────────┤
│                                                       │
│  Leave Requests - Team                              │
│  ┌───────────────────────────────────────────────┐  │
│  │ Employee │ Leave │ Start  │ End   │ Reason │ │  │
│  │          │ Type  │ Date   │ Date  │        │ │  │
│  ├───────────────────────────────────────────────┤  │
│  │ Raj      │ 🔵    │ Jan 15 │ Jan 17│ Family │ │  │
│  │          │ Annual│        │       │ Visit  │ │  │
│  │          │       │        │       │        │ │  │
│  │ Status   │ Actions                         │ │  │
│  │ 🟠       │ ✓ Approve    ✕ Reject         │ │  │
│  │ pending  │                                 │ │  │
│  ├───────────────────────────────────────────────┤  │
│  │ Priya    │ 🟠    │ Feb 5  │ Feb 5 │ Sick   │ │  │
│  │ Sick     │       │        │       │ Leave  │ │  │
│  │ 🟢 approved                                │ │  │
│  │ (approved on Jan 10, 2024)                 │ │  │
│  ├───────────────────────────────────────────────┤  │
│  │ Arjun    │ 🔵    │ Feb 20 │ Feb 20│ Dentist│ │  │
│  │ Personal │       │        │       │        │ │  │
│  │ 🔴 rejected                                │ │  │
│  │ Reason: Not approved due to year-end     │ │  │
│  │ project launch                             │ │  │
│  └───────────────────────────────────────────────┘  │
│                                                       │
└─────────────────────────────────────────────────────┘
```

## Rejection Modal Workflow

### Step 1: Click Reject Button
```
Table shows pending requests
       ↓
User sees "✕ Reject" button
       ↓
User clicks "✕ Reject"
```

### Step 2: Modal Appears
```
┌────────────────────────────────────────┐
│     ❌  (Click X to close)              │
│                                        │
│  Reject Leave Request                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Enter reason for rejection...    │ │
│  │                                  │ │
│  │ _____________________________     │ │
│  │ _____________________________     │ │
│  │ _____________________________     │ │
│  │ _____________________________     │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [  Reject  ]  [  Cancel  ]           │
│                                        │
└────────────────────────────────────────┘
```

### Step 3: Enter Reason
```
Manager types in textarea:
"Project launch scheduled for Feb 25,
need your presence in the office."
```

### Step 4: Submit or Cancel
```
If "Reject" clicked:
  → Database updates with rejection
  → Modal closes
  → Table refreshes
  → Green success toast shows
  → Reason displays in table

If "Cancel" clicked:
  → Modal closes
  → Reason discarded
  → Table unchanged
```

## Status Color Legend

| Badge | Status | Color | Action Visible |
|-------|--------|-------|----------------|
| 🟠 | pending | Orange | YES - Approve/Reject |
| 🟢 | approved | Green | NO - Status only |
| 🔴 | rejected | Red | NO - Shows reason |

## Table Column Details

### Employee Column
```
Shows full name from users table
Example: "Raj Kumar"
```

### Leave Type Column
```
Leave type with colored badge
┌─────────────┐
│ 🔵 Annual   │
│   Leave     │
└─────────────┘
```

### Dates Columns
```
Formatted as locale date
Example: "1/15/2024"
```

### Reason Column
```
Text reason provided by employee
Truncated if too long (max-w-xs)
Example: "Family visit to hometown"
```

### Status Column
```
Colored badge with status text
┌─────────────┐    ┌────────────┐    ┌─────────────┐
│ 🟠 pending  │    │ 🟢 approved│    │ 🔴 rejected │
└─────────────┘    └────────────┘    └─────────────┘
```

### Actions Column

**For Pending Requests:**
```
┌──────────────────────────┐
│ ✓ Approve  ✕ Reject     │
└──────────────────────────┘
Clickable green and red buttons
```

**For Rejected Requests:**
```
┌──────────────────────────┐
│ Reason:                  │
│ Not approved due to      │
│ year-end project launch  │
└──────────────────────────┘
Small red text showing reason
```

**For Approved Requests:**
```
(No action buttons)
Request is read-only
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  Manager Dashboard Loads                │
├─────────────────────────────────────────────────────────┤
│                           ↓                              │
│      fetchManagerData() - Get Manager's Department       │
│                           ↓                              │
│     Query: users WHERE id = manager_id                  │
│     Result: department_id = "dept-123"                  │
│                           ↓                              │
│   Query: users WHERE department_id = "dept-123"        │
│   Result: Array of team members (5 employees)           │
│                           ↓                              │
│  Query: leave_requests WHERE user_id IN (team_ids)     │
│  Result: 3 leave requests                               │
│                           ↓                              │
│   JOIN with users table for employee names              │
│                           ↓                              │
│        Render Leave Requests Table                       │
│                           ↓                              │
│     User Clicks Approve or Reject Button                │
│           ↙────────────────────────────╲                │
│          ↙                              ↘               │
│     APPROVE                           REJECT             │
│         ↓                               ↓                │
│  Update SQL:              Show Modal Dialog              │
│  UPDATE                   Wait for Reason Input          │
│  leave_requests           User Enters Reason             │
│  SET status='approved'    Click Reject Button            │
│  approved_by=user_id      ↓                              │
│  approved_at=NOW()        Update SQL:                    │
│         ↓                 UPDATE                         │
│  Toast: "Approved"        leave_requests                 │
│         ↓                 SET status='rejected'          │
│  Refresh Table            rejection_reason=input        │
│                           approved_by=user_id           │
│                           approved_at=NOW()             │
│                           ↓                              │
│                           Toast: "Rejected"             │
│                           ↓                              │
│                           Close Modal                     │
│                           ↓                              │
│                           Refresh Table                   │
│                                                           │
│         Table Now Shows Updated Status                   │
└─────────────────────────────────────────────────────────┘
```

## Approval Timeline Example

```
Employee creates request: Jan 10, 2024 10:30 AM
                    ↓
Status: 🟠 pending
                    ↓
Manager approves: Jan 11, 2024 2:15 PM
                    ↓
Status: 🟢 approved
Details: Approved by Manager ID xyz on Jan 11, 2024
                    ↓
Employee sees approval in Leave History
```

## Rejection Timeline Example

```
Employee creates request: Feb 1, 2024 9:00 AM
                    ↓
Status: 🟠 pending
                    ↓
Manager clicks Reject: Feb 1, 2024 4:45 PM
                    ↓
Manager enters reason: "Budget constraints for this quarter"
                    ↓
Manager clicks Reject button
                    ↓
Status: 🔴 rejected
Details: 
- Rejected by Manager ID xyz on Feb 1, 2024
- Reason: "Budget constraints for this quarter"
                    ↓
Employee sees rejection with reason in Leave History
```

## Modal Interaction States

### 1. Closed State
Modal is not visible
```
Table displays normally
```

### 2. Open State - Empty
Modal open, no text entered
```
┌──────────────────────────┐
│ Reject Leave Request     │
│                          │
│ [empty textarea]         │
│                          │
│ [Reject DISABLED] [Cancel]
└──────────────────────────┘
Reject button is grayed out/disabled
```

### 3. Open State - With Text
Modal open, reason entered
```
┌──────────────────────────┐
│ Reject Leave Request     │
│                          │
│ "Budget constraints"     │
│ "for this quarter"       │
│                          │
│ [Reject ENABLED] [Cancel]
└──────────────────────────┘
Reject button is bright red and clickable
```

### 4. Closed After Rejection
Modal closes, table updates
```
Previous pending request now shows:
Status: 🔴 rejected
Reason: "Budget constraints for this quarter"
```

## Responsive Design

### Desktop View
```
Full table with all columns visible
Leave Request Type | Start Date | End Date | Reason | Status | Actions
All in one row
```

### Tablet View
```
Horizontal scroll on table
Reason column truncated with ellipsis (...)
Actions buttons slightly smaller
Modal centered on screen
```

### Mobile View
```
Heavy horizontal scroll for table
All columns preserved
Modal takes 90% of screen width
Buttons stack or reduce padding
Reason text truncated more aggressively
```

## Error States

### No Leave Requests
```
Table shows:
"No leave requests"
Empty state message
```

### Department Not Set
```
Toast Error: "Manager department not set"
Table remains empty
```

### API Error During Approval
```
Toast Error: "Failed to approve leave request"
Button re-enabled
Table unchanged
```

### API Error During Rejection
```
Toast Error: "Failed to reject leave request"
Modal remains open
Reason text preserved
User can retry
```

## Success Feedback

### Successful Approval
```
✓ Toast appears: "✓ Leave request approved!"
✓ Table refreshes immediately
✓ Request status changes to 🟢 approved
✓ Approve/Reject buttons disappear
✓ Toast auto-dismisses after 3 seconds
```

### Successful Rejection
```
✓ Toast appears: "✕ Leave request rejected"
✓ Modal closes automatically
✓ Rejection reason cleared
✓ Table refreshes immediately
✓ Request status changes to 🔴 rejected
✓ Rejection reason displays in Actions
✓ Toast auto-dismisses after 3 seconds
```

---

This visual guide helps understand the complete user experience of the leave request management feature.
