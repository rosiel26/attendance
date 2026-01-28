# ✅ Leave Request Feature - Verification Checklist

## Pre-Deployment Checklist

Use this checklist to verify the Leave Request Management feature is properly set up and ready for use.

---

## 📋 Database Setup

- [ ] **Supabase project is accessible**
  - Navigate to your Supabase dashboard
  - Verify you can access the project

- [ ] **`leave_requests` table exists**
  - Go to Supabase SQL Editor
  - Run: `SELECT * FROM leave_requests LIMIT 1;`
  - Should show table structure

- [ ] **`approved_at` column exists** ⚠️ CRITICAL
  - Run: `ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;`
  - Verify column appears in table schema

- [ ] **All required columns present**
  - `id` (UUID PK) ✓
  - `user_id` (UUID FK to users) ✓
  - `leave_type` (VARCHAR) ✓
  - `start_date` (DATE) ✓
  - `end_date` (DATE) ✓
  - `reason` (TEXT) ✓
  - `status` (VARCHAR) ✓
  - `approved_by` (UUID FK to users) ✓
  - `rejection_reason` (TEXT) ✓
  - `approved_at` (TIMESTAMP) ✓ **NEW**
  - `created_at` (TIMESTAMP) ✓
  - `updated_at` (TIMESTAMP) ✓

- [ ] **RLS policies configured**
  - Verify RLS is enabled on `leave_requests` table
  - Policies exist for INSERT, SELECT, UPDATE

---

## 🔧 Code Implementation

- [ ] **ManagerDashboard.jsx updated**
  - File exists: `src/components/Dashboard/ManagerDashboard.jsx`
  - Contains `rejectingRequestId` state variable
  - Contains `rejectionReason` state variable
  - Has rejection reason modal UI
  - Has `handleApproveLeave` function
  - Has `handleRejectLeave` function
  - Leave Requests tab implemented

- [ ] **State variables present**
  ```javascript
  const [rejectingRequestId, setRejectingRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  ```

- [ ] **Modal dialog renders correctly**
  - Modal appears when `rejectingRequestId` is set
  - Textarea for reason input visible
  - Reject and Cancel buttons present
  - Submit button disabled when reason is empty

- [ ] **Handler functions work**
  - `handleApproveLeave()` updates with status='approved'
  - `handleRejectLeave()` validates reason before submitting
  - Both functions update `approved_at` timestamp
  - Both functions update `approved_by` field

- [ ] **Tab navigation works**
  - "📋 Leave Requests" tab clickable
  - Tab content displays when clicked
  - No console errors when switching tabs

---

## 🎨 UI/UX Verification

- [ ] **Leave Requests table displays**
  - Table headers visible
  - Column headers: Employee, Leave Type, Start Date, End Date, Reason, Status, Actions
  - Data rows populated (if leave requests exist)

- [ ] **Status badges display correctly**
  - Pending: 🟠 Orange badge
  - Approved: 🟢 Green badge
  - Rejected: 🔴 Red badge

- [ ] **Action buttons visible for pending requests**
  - "✓ Approve" button green
  - "✕ Reject" button red
  - Both buttons clickable

- [ ] **Modal dialog appearance**
  - Appears centered on screen
  - Semi-transparent overlay behind modal
  - "Reject Leave Request" heading visible
  - Textarea with placeholder text present
  - "Reject" button present (disabled until reason entered)
  - "Cancel" button present

- [ ] **Rejection reason displays**
  - After rejecting, reason shows in table
  - Red text in Actions column
  - Format: "Reason: [text]"

- [ ] **Toast notifications appear**
  - Approve action shows success toast
  - Reject action shows success toast
  - Errors show error toast
  - Toasts auto-dismiss after 3 seconds

---

## 🧪 Functional Testing

### Test 1: View Leave Requests ✓
- [ ] Login as manager
- [ ] Navigate to Manager Dashboard
- [ ] Click "📋 Leave Requests" tab
- [ ] See table with leave requests
- [ ] Verify employee names display

### Test 2: Approve Request ✓
- [ ] Find a pending leave request (🟠 orange)
- [ ] Click "✓ Approve" button
- [ ] Verify success toast shows
- [ ] Verify status changes to 🟢 green
- [ ] Verify buttons disappear from row

### Test 3: Reject Without Reason (Error Case) ✓
- [ ] Find another pending request
- [ ] Click "✕ Reject" button
- [ ] Modal appears
- [ ] Try clicking "Reject" without entering reason
- [ ] Verify: Button is disabled (grayed out)
- [ ] OR Verify: Error toast shows "Please enter a reason for rejection"

### Test 4: Reject With Reason ✓
- [ ] Keep modal open (from Test 3)
- [ ] Type in textarea: "Budget constraints this quarter"
- [ ] Verify "Reject" button becomes enabled (bright red)
- [ ] Click "Reject" button
- [ ] Verify: Modal closes
- [ ] Verify: Success toast shows
- [ ] Verify: Request status changes to 🔴 red
- [ ] Verify: Rejection reason displays in Actions column
- [ ] Verify: Rejection reason text readable

### Test 5: Cancel Rejection ✓
- [ ] Find another pending request
- [ ] Click "✕ Reject" button
- [ ] Modal appears
- [ ] Type some reason text
- [ ] Click "Cancel" button
- [ ] Verify: Modal closes
- [ ] Verify: Request unchanged (still pending)
- [ ] Verify: No toast notification

### Test 6: Multiple Requests ✓
- [ ] Create several leave requests with different statuses
- [ ] Verify all display correctly in table
- [ ] Verify mix of pending, approved, rejected visible
- [ ] Verify rejection reasons display for rejected items

---

## 📱 Responsive Design Testing

- [ ] **Desktop (1920px+)**
  - [ ] Table displays all columns
  - [ ] Modal centered on screen
  - [ ] Buttons have proper hover effects
  - [ ] No horizontal scroll needed

- [ ] **Tablet (768px - 1024px)**
  - [ ] Table scrollable if needed
  - [ ] Modal still centered
  - [ ] Touch-friendly button sizes
  - [ ] Readable on smaller screen

- [ ] **Mobile (320px - 767px)**
  - [ ] Table responsive/scrollable
  - [ ] Modal takes ~90% screen width
  - [ ] Buttons large enough to tap
  - [ ] Text readable without zoom
  - [ ] Rejection reason textarea usable

---

## 🔐 Security Verification

- [ ] **Only team members' requests shown**
  - Manager sees only their department's requests
  - Cannot see other departments' requests

- [ ] **Manager ID recorded**
  - `approved_by` field contains manager's ID
  - Verify in database: SELECT approved_by FROM leave_requests;

- [ ] **Timestamps recorded**
  - `approved_at` field populated on approval/rejection
  - Timestamps are valid and correct

- [ ] **Data persistence**
  - Refresh page after approval/rejection
  - Status change persists
  - Rejection reason still visible

---

## 🚨 Error Handling Verification

- [ ] **Invalid rejection (empty reason)**
  - [ ] Error message clear and helpful
  - [ ] Button prevents submission
  - [ ] User can fix by entering reason

- [ ] **Database error**
  - [ ] Error message shown to user
  - [ ] No console errors (or handled gracefully)
  - [ ] Table still displays (doesn't crash)

- [ ] **Network error**
  - [ ] Toast shows error message
  - [ ] Can retry action
  - [ ] No duplicate submissions

- [ ] **Missing data**
  - [ ] Employee names show (or fallback to ID)
  - [ ] Dates format correctly
  - [ ] Status displays default if missing

---

## 📊 Data Verification

### In Database
- [ ] **After approval, verify:**
  ```sql
  SELECT id, status, approved_by, approved_at 
  FROM leave_requests 
  WHERE status = 'approved' 
  LIMIT 1;
  ```
  - `status` = 'approved' ✓
  - `approved_by` = manager UUID ✓
  - `approved_at` = recent timestamp ✓

- [ ] **After rejection, verify:**
  ```sql
  SELECT id, status, rejection_reason, approved_by, approved_at 
  FROM leave_requests 
  WHERE status = 'rejected' 
  LIMIT 1;
  ```
  - `status` = 'rejected' ✓
  - `rejection_reason` = entered text ✓
  - `approved_by` = manager UUID ✓
  - `approved_at` = recent timestamp ✓

---

## 🎯 Performance Verification

- [ ] **Page loads within 3 seconds**
  - Manager Dashboard loads quickly
  - Leave Requests tab responsive

- [ ] **Table renders quickly**
  - 50+ requests load and display
  - No noticeable lag

- [ ] **Button clicks responsive**
  - Approve/Reject buttons respond instantly
  - Modal appears/closes without delay

- [ ] **No duplicate actions**
  - Buttons disabled during API call
  - Prevents double-click issues

---

## 📚 Documentation Verification

- [ ] **Documentation files exist**
  - [ ] LEAVE_REQUEST_QUICK_START.md
  - [ ] LEAVE_REQUEST_GUIDE.md
  - [ ] LEAVE_REQUEST_VISUAL_GUIDE.md
  - [ ] LEAVE_REQUEST_SCHEMA_UPDATE.md
  - [ ] LEAVE_REQUEST_IMPLEMENTATION.md
  - [ ] LEAVE_REQUEST_COMPLETION_STATUS.md
  - [ ] LEAVE_REQUEST_SUMMARY.md
  - [ ] LEAVE_REQUEST_DOCUMENTATION_INDEX.md

- [ ] **Documentation accurate**
  - [ ] Instructions match actual implementation
  - [ ] Screenshots/diagrams helpful
  - [ ] Examples are correct

---

## ✨ Final Verification

- [ ] **All tests passed** ✓
- [ ] **No console errors** ✓
- [ ] **Database schema complete** ✓
- [ ] **Code implementation complete** ✓
- [ ] **UI/UX looks good** ✓
- [ ] **Documentation complete** ✓
- [ ] **Ready for production** ✓

---

## 🚀 Launch Checklist

Before launching to production:

- [ ] All items above are checked
- [ ] Team has been trained on the feature
- [ ] Backup of database taken
- [ ] Error monitoring set up
- [ ] User feedback mechanism in place
- [ ] Rollback plan documented
- [ ] Change log updated

---

## 📊 Sign-Off

| Item | Status | Date | By |
|------|--------|------|-----|
| Development | ✅ Complete | Today | - |
| Testing | ⏳ Pending | - | - |
| Deployment | ⏳ Pending | - | - |
| Launch | ⏳ Pending | - | - |

---

## 🐛 Known Issues & Workarounds

| Issue | Workaround |
|-------|-----------|
| Table empty | Verify team members exist in department |
| Modal won't open | Refresh page, check console for errors |
| Rejection reason not saving | Ensure DB migration was run |
| Toasts not showing | Check react-hot-toast is imported |

---

## 📞 Support Contacts

- **For setup help**: See LEAVE_REQUEST_SCHEMA_UPDATE.md
- **For usage help**: See LEAVE_REQUEST_QUICK_START.md
- **For technical help**: See LEAVE_REQUEST_IMPLEMENTATION.md
- **For feature help**: See LEAVE_REQUEST_GUIDE.md

---

**Last Updated**: Today
**Status**: ✅ Ready for Verification
**Next Action**: Complete all checklist items and proceed with testing
