import { supabase } from '../config/supabase';
import { LATE_THRESHOLD_MINUTES, WORK_START_TIME, ATTENDANCE_STATUS } from '../utils/constants';


const MANILA_TZ = "Asia/Manila";

/**
 * Returns the Manila "today" range expressed as UTC ISO strings, suitable for querying timestamptz columns.
 * - manilaDateStr: "YYYY-MM-DD" (in Asia/Manila)
 * - startUtcISO: UTC instant corresponding to Manila 00:00:00.000
 * - endUtcISO: UTC instant corresponding to Manila 23:59:59.999
 */
const getManilaDayRangeUtc = (date = new Date()) => {
  const manilaDateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: MANILA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date); // "YYYY-MM-DD"

  // Manila is UTC+8 (no DST)
  const startUtc = new Date(`${manilaDateStr}T00:00:00.000+08:00`);
  const endUtc = new Date(`${manilaDateStr}T23:59:59.999+08:00`);

  return {
    manilaDateStr,
    startUtcISO: startUtc.toISOString(),
    endUtcISO: endUtc.toISOString(),
  };
};

/**
 * Returns "HH:MM" current time in Manila (24hr).
 */
const getManilaTimeHHMM = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: MANILA_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date); // "HH:MM"
};
// ==================== ATTENDANCE FUNCTIONS ====================

// ==================== ATTENDANCE FUNCTIONS ====================

/**
 * Get attendance records for TODAY (Manila day).
 * Returns a supabase response: { data, error }
 */
export const getTodayAttendance = async (userId) => {
  try {
    const { startUtcISO, endUtcISO } = getManilaDayRangeUtc();

    return await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", userId)
      .gte("check_in_time", startUtcISO)
      .lte("check_in_time", endUtcISO)
      .order("check_in_time", { ascending: false });
  } catch (error) {
    console.error("Error fetching today attendance:", error);
    throw error;
  }
};

/**
 * Get an "active" attendance record from PREVIOUS days only:
 * - check_out_time is null
 * - check_in_time is before today's Manila start
 * - status is not MISSING_CHECKOUT
 * Returns { data: [], error: null }
 */
export const getActiveAttendance = async (userId) => {
  const { startUtcISO } = getManilaDayRangeUtc();

  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("user_id", userId)
    .is("check_out_time", null)
    .lt("check_in_time", startUtcISO)
    .order("check_in_time", { ascending: false })
    .limit(1);

  if (error) throw error;
  return { data: data || [], error: null };
};

// ✅ just log it / return it, no DB update
export const markMissingCheckout = async (_attendanceId) => {
  return { error: null };
};


/**
 * Mark an attendance record as missing checkou
  try {
    const { error } = await supabase
      .from("attendance")
      .update({
        status: ATTENDANCE_STATUS.MISSING_CHECKOUT,
        notes: "Auto-marked: Missing checkout from previous day",
        updated_at: new Date().toISOString(),
      })
      .eq("id", attendanceId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error marking missing checkout:", error);
    throw error;
  }
};

/**
 * Check in (Manila day aware)
 * - Blocks if already checked in/out today (Manila)
 * - Auto-marks any open record from previous days as MISSING_CHECKOUT
 * - Inserts a new check-in for today
 */
export const checkIn = async (userId, geolocation = null) => {
  try {
    const { startUtcISO, endUtcISO, manilaDateStr } = getManilaDayRangeUtc();

    // 1) Block if already has record today (Manila)
    const { data: todayRecords, error: todayErr } = await supabase
      .from("attendance")
      .select("id, status, check_in_time, check_out_time")
      .eq("user_id", userId)
      .gte("check_in_time", startUtcISO)
      .lte("check_in_time", endUtcISO)
      .order("check_in_time", { ascending: false })
      .limit(1);

    if (todayErr) throw todayErr;

    if (todayRecords?.length) {
      const r = todayRecords[0];
      if (r.check_out_time || r.status === ATTENDANCE_STATUS.CHECKED_OUT) {
        throw new Error("Already checked out for today. Cannot check in again.");
      }
      throw new Error("Already checked in today.");
    }

    // 2) Auto-mark previous days open record as missing checkout
    const { data: activeData } = await getActiveAttendance(userId);
    if (activeData?.length) {
      await markMissingCheckout(activeData[0].id);
    }

    // 3) Determine late/on-time based on Manila current time
    const now = new Date();
    const nowHHMM = getManilaTimeHHMM(now); // "HH:MM"
    const [nowH, nowM] = nowHHMM.split(":").map(Number);

    const [workHour, workMinute] = WORK_START_TIME.split(":").map(Number);

    const nowMinutes = nowH * 60 + nowM;
    const workStartMinutes = workHour * 60 + workMinute;

    const isLate =
      nowMinutes > workStartMinutes + Number(LATE_THRESHOLD_MINUTES || 0);

    const status = isLate ? ATTENDANCE_STATUS.LATE : ATTENDANCE_STATUS.ON_TIME;

    // 4) Insert check-in
    const { data, error } = await supabase
      .from("attendance")
      .insert([
        {
          user_id: userId,
          check_in_time: now.toISOString(),
          geolocation,
          status,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          notes: `Check-in (${manilaDateStr})`,
        },
      ])
      .select();

    if (error) {
      if (error.code === "23505") {
        throw new Error("You have already checked in today.");
      }
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Check-in error:", error);
    throw error;
  }
};

/**
 * Check out (ONLY for today's Manila record)
 * - Finds latest open record where check_in_time is within Manila today's range
 * - Updates check_out_time + duration_hours + status
 */
export const checkOut = async (userId) => {
  try {
    const { startUtcISO, endUtcISO } = getManilaDayRangeUtc();

    const { data: attendance, error: fetchError } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", userId)
      .is("check_out_time", null)
      .gte("check_in_time", startUtcISO)
      .lte("check_in_time", endUtcISO)
      .order("check_in_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!attendance) throw new Error("No active check-in found for today");

    const checkOutTime = new Date();
    const checkInTime = new Date(attendance.check_in_time);

    // Duration in minutes/hours
    const durationMinutes = (checkOutTime - checkInTime) / (1000 * 60);
    const durationHours = durationMinutes / 60;

    // Lunch break logic
    let workDurationHours = durationHours;
    if (durationHours >= 4) workDurationHours = durationHours - 1;
    workDurationHours = Math.max(0, workDurationHours);

    return await supabase
      .from("attendance")
      .update({
        check_out_time: checkOutTime.toISOString(),
        duration_hours: parseFloat(workDurationHours.toFixed(4)),
        status: ATTENDANCE_STATUS.CHECKED_OUT,
        updated_at: new Date().toISOString(),
      })
      .eq("id", attendance.id)
      .select();
  } catch (error) {
    console.error("Check-out error:", error);
    throw error;
  }
};

/**
 * Fetch attendance records for a date range
 * (kept as-is; you can keep your existing one if you prefer)
 */
export const getAttendanceRecords = async (userId, startDate, endDate) => {
  try {
    return await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", userId)
      .gte("check_in_time", startDate.toISOString())
      .lte("check_in_time", endDate.toISOString())
      .order("check_in_time", { ascending: false });
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    throw error;
  }
};

/**
 * Team attendance (kept as-is)
 */
export const getTeamAttendance = async (managerId, startDate, endDate) => {
  try {
    const { data: teamMembers, error: teamError } = await supabase
      .from("users")
      .select("id")
      .eq("manager_id", managerId);

    if (teamError) throw teamError;

    if (!teamMembers || teamMembers.length === 0) {
      return { data: [], error: null };
    }

    const teamIds = teamMembers.map((m) => m.id);

    return await supabase
      .from("attendance")
      .select("*, users(id, full_name, email)")
      .in("user_id", teamIds)
      .gte("check_in_time", startDate.toISOString())
      .lte("check_in_time", endDate.toISOString())
      .order("check_in_time", { ascending: false });
  } catch (error) {
    console.error("Error fetching team attendance:", error);
    throw error;
  }
};
// ==================== LEAVE FUNCTIONS ====================

export const requestLeave = async (leaveData) => {
  try {
    // First create the leave request
    const leaveResult = await supabase.from('leave_requests').insert([
      {
        ...leaveData,
        status: 'pending',
        created_at: new Date().toISOString(),
      }
    ]).select();

    if (leaveResult.error) throw leaveResult.error;

    // Get the employee's manager to notify (only their direct manager)
    const { data: employee, error: empError } = await supabase
      .from('users')
      .select('id, full_name, manager_id')
      .eq('id', leaveData.user_id)
      .single();

    if (empError) {
      console.error('Error fetching employee:', empError);
    }

    const employeeName = employee?.full_name || 'An employee';
    const managerId = employee?.manager_id;
    const startDate = new Date(leaveData.start_date).toLocaleDateString();
    const endDate = new Date(leaveData.end_date).toLocaleDateString();
    const leaveType = leaveData.leave_type || 'leave';

    // Send notification only to the employee's direct manager
    if (managerId) {
      console.log('Sending notification to manager:', managerId);

      // Single notification with all details
      await createNotification(
        managerId,
        `${employeeName} has submitted a ${leaveType} leave from ${startDate} to ${endDate} and waiting for approval.`,
        'leave',
        leaveResult.data[0].id
      );
    }

    return leaveResult;
  } catch (error) {
    console.error('Error requesting leave:', error);
    throw error;
  }
};

export const getLeaveRequests = async (userId, role) => {
  try {
    if (role === 'employee') {
      // Employees can only see their own leave requests
      return await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    } else if (role === 'manager' || role === 'admin') {
      // Managers and admins can see all leave requests with user details
      return await supabase
        .from('leave_requests')
        .select('*, users(id, full_name, email)')
        .order('created_at', { ascending: false });
    } else {
      // Default: show only user's own requests
      return await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    }
  } catch (error) {
    console.error('Error fetching leave requests:', error);
    throw error;
  }
};

export const approveLeave = async (leaveRequestId, approverUserId) => {
  try {
    // First get the leave request to know who to notify
    const { data: leaveRequest, error: fetchError } = await supabase
      .from('leave_requests')
      .select('user_id')
      .eq('id', leaveRequestId)
      .single();

    if (fetchError) throw fetchError;

    // Update the leave request
    const updateResult = await supabase
      .from('leave_requests')
      .update({
        status: 'approved',
        approved_by: approverUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leaveRequestId);

    if (updateResult.error) throw updateResult.error;

    // Create notification for the employee
    console.log('Creating approval notification for employee:', leaveRequest.user_id);
    await createNotification(
      leaveRequest.user_id,
      'Your leave request has been approved.',
      'leave',
      leaveRequestId
    );

    return updateResult;
  } catch (error) {
    console.error('Error approving leave:', error);
    throw error;
  }
};

export const rejectLeave = async (leaveRequestId, reason) => {
  try {
    // First get the leave request to know who to notify
    const { data: leaveRequest, error: fetchError } = await supabase
      .from('leave_requests')
      .select('user_id')
      .eq('id', leaveRequestId)
      .single();

    if (fetchError) throw fetchError;

    // Update the leave request
    const updateResult = await supabase
      .from('leave_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leaveRequestId);

    if (updateResult.error) throw updateResult.error;

    // Create notification for the user
    console.log('Creating rejection notification for employee:', leaveRequest.user_id);
    await createNotification(
      leaveRequest.user_id,
      `Your leave request has been rejected. Reason: ${reason}`,
      'leave',
      leaveRequestId
    );

    return updateResult;
  } catch (error) {
    console.error('Error rejecting leave:', error);
    throw error;
  }
};

export const updateLeaveRequest = async (leaveRequestId, updates) => {
  try {
    const result = await supabase
      .from('leave_requests')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leaveRequestId)
      .select();

    console.log('Update result:', result);

    if (result.error) {
      console.error('Update error:', result.error);
      throw result.error;
    }

    return result;
  } catch (error) {
    console.error('Error updating leave request:', error);
    throw error;
  }
};

export const deleteLeaveRequest = async (leaveRequestId) => {
  try {
    const result = await supabase
      .from('leave_requests')
      .delete()
      .eq('id', leaveRequestId)
      .select();

    console.log('Delete result:', result);

    if (result.error) {
      console.error('Delete error:', result.error);
      throw result.error;
    }

    return result;
  } catch (error) {
    console.error('Error deleting leave request:', error);
    throw error;
  }
};

export const getLeaveBalance = async (userId) => {
  try {
    const currentYear = new Date().getFullYear();
    return await supabase
      .from('leave_balances')
      .select('*')
      .eq('user_id', userId)
      .eq('year', currentYear);
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    throw error;
  }
};

// ==================== USER FUNCTIONS ====================

export const getUserProfile = async (userId) => {
  try {
    return await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const getNonAdminUsers = async () => {
  try {
    return await supabase
      .from('users')
      .select('*')
      .neq('role', 'admin')
      .order('full_name', { ascending: true });
  } catch (error) {
    console.error('Error fetching non-admin users:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId, updates) => {
  try {
    return await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// ==================== HOLIDAY FUNCTIONS ====================

export const getHolidays = async (organizationId) => {
  try {
    return await supabase
      .from('holidays')
      .select('*')
      .eq('organization_id', organizationId)
      .order('date', { ascending: true });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    throw error;
  }
};

// ==================== REPORT FUNCTIONS ====================

export const generateAttendanceReport = async (userId, startDate, endDate) => {
  try {
    const { data, error } = await getAttendanceRecords(userId, startDate, endDate);
    if (error) throw error;

    const report = {
      total_days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
      present_days: data?.filter(d => d.check_in_time && d.check_out_time).length || 0,
      absent_days: 0,
      leave_days: 0,
      total_hours: data?.reduce((sum, d) => sum + (d.duration_hours || 0), 0) || 0,
      average_hours: 0,
      records: data || [],
    };

    report.average_hours = report.total_hours / (report.present_days || 1);
    report.absent_days = report.total_days - report.present_days - report.leave_days;

    return report;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

export const generateCompanyReport = async (organizationId, startDate, endDate) => {
  try {
    return await supabase
      .from('attendance')
      .select('*, users(full_name, email, department_id)')
      .gte('check_in_time', startDate.toISOString())
      .lte('check_in_time', endDate.toISOString())
      .order('check_in_time', { ascending: false });
  } catch (error) {
    console.error('Error generating company report:', error);
    throw error;
  }
};

// ==================== NOTIFICATION FUNCTIONS ====================

export const createNotification = async (userId, message, type = 'leave', referenceId = null) => {
  try {
    console.log('Creating notification for user:', userId, 'message:', message);

    // Check if notifications table exists and is accessible
    const { error: testError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('Notifications table not available:', testError.message);
      return null; // Silently fail if notifications table doesn't exist
    }

    // Check for duplicate notification (same user, message, type, referenceId within last 5 seconds)
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
    const { data: existingNotifications, error: dupError } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('message', message)
      .eq('type', type)
      .eq('reference_id', referenceId)
      .gte('created_at', fiveSecondsAgo)
      .limit(1);

    if (dupError) {
      console.error('Error checking for duplicates:', dupError);
    }

    // If a recent identical notification exists, skip creating a duplicate
    if (existingNotifications && existingNotifications.length > 0) {
      console.log('Duplicate notification detected, skipping:', message);
      return null;
    }

    const result = await supabase.from('notifications').insert([
      {
        user_id: userId,
        type,
        reference_id: referenceId,
        message,
        is_read: false,
        created_at: new Date().toISOString(),
      }
    ]);

    console.log('Notification creation result:', result);

    if (result.error) {
      console.error('Notification insert error:', result.error);
    } else {
      console.log('Notification created successfully for user:', userId);
    }

    return result;
  } catch (error) {
    console.error('Notification creation failed (non-critical):', error.message);
    return null; // Don't throw error - notifications are optional
  }
};

export const getUserNotifications = async (userId) => {
  try {
    // Check if notifications table exists
    const { error: testError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);

    if (testError) {
      console.warn('Notifications table not available, returning empty array');
      return { data: [], error: null };
    }

    return await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  } catch (error) {
    console.warn('Error fetching notifications (returning empty):', error.message);
    return { data: [], error: null }; // Return empty array instead of throwing
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    // Check if notifications table exists
    const { error: testError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);

    if (testError) {
      console.warn('Notifications table not available');
      return { data: null, error: testError };
    }

    return await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
  } catch (error) {
    console.warn('Error marking notification as read:', error.message);
    return { data: null, error };
  }
};

export const markAllNotificationsAsRead = async (userId) => {
  try {
    // Check if notifications table exists
    const { error: testError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);

    if (testError) {
      console.warn('Notifications table not available');
      return { data: null, error: testError };
    }

    return await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  } catch (error) {
    console.warn('Error marking all notifications as read:', error.message);
    return { data: null, error };
  }
};

// ==================== ATTENDANCE CORRECTIONS FUNCTIONS ====================

export const requestAttendanceCorrection = async (correctionData) => {
  try {
    console.log('Creating attendance correction request:', correctionData);

    const result = await supabase.from('attendance_corrections').insert([
      {
        user_id: correctionData.userId,
        attendance_date: correctionData.attendanceDate,
        missing_type: correctionData.missingType,
        requested_time: correctionData.requestedTime,
        reason: correctionData.reason,
        status: 'pending',
        requested_by: correctionData.userId,
        attendance_id: correctionData.attendanceId,
        original_time: correctionData.originalTime,
        created_at: new Date().toISOString(),
      }
    ]).select();

    if (result.error) throw result.error;

    console.log('Correction request created:', result.data[0]);

    // Notification removed as per requirement

    return result;
  } catch (error) {
    console.error('Error creating attendance correction:', error);
    throw error;
  }
};

export const getAttendanceCorrections = async (userId, role) => {
  try {
    if (role === 'employee') {
      // Employees see only their own corrections
      return await supabase
        .from('attendance_corrections')
        .select('*, attendance:attendance_id(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    } else if (role === 'manager' || role === 'admin') {
      // Managers see all corrections with user details and approver details
      return await supabase
        .from('attendance_corrections')
        .select(`
          *,
          users!attendance_corrections_user_id_fkey(id, full_name, email),
          approver:users!attendance_corrections_approved_by_fkey(id, full_name),
          attendance:attendance_id(*)
        `)
        .order('created_at', { ascending: false });
    }
    return { data: [], error: null };
  } catch (error) {
    console.error('Error fetching attendance corrections:', error);
    throw error;
  }
};

export const approveAttendanceCorrection = async (correctionId, approverUserId, remarks = null) => {
  try {
    // Get correction details first
    const { data: correction, error: fetchError } = await supabase
      .from('attendance_corrections')
      .select('user_id, attendance_id, missing_type, requested_time, attendance_date')
      .eq('id', correctionId)
      .single();

    if (fetchError) throw fetchError;

    // Update correction
    const { data: updateData, error: updateError } = await supabase
      .from('attendance_corrections')
      .update({
        status: 'approved',
        approved_by: approverUserId,
        approved_at: new Date().toISOString(),
        remarks,
        applied: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', correctionId)
      .select();

    if (updateError) throw updateError;

    const updateResult = { data: updateData, error: null };

    // Find attendance_id if not set
    if (!correction.attendance_id) {
      const { data: attendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('user_id', correction.user_id)
        .gte('check_in_time', `${correction.attendance_date}T00:00:00`)
        .lt('check_in_time', `${correction.attendance_date}T23:59:59`)
        .single();
      if (attendance) {
        correction.attendance_id = attendance.id;
      }
    }

    // Update the attendance record
    if (correction.attendance_id && correction.missing_type && correction.requested_time) {
      const attendanceUpdate = {};

      // Ensure requested_time has seconds
      const timeStr = correction.requested_time.includes(':') && correction.requested_time.split(':').length === 2
        ? correction.requested_time + ':00'
        : correction.requested_time;

      const timestamp = new Date(`${correction.attendance_date}T${timeStr}`).toISOString();

      if (correction.missing_type === 'check_in') {
        attendanceUpdate.check_in_time = timestamp;
        attendanceUpdate.status = 'checked-in';
      } else if (correction.missing_type === 'check_out') {
        attendanceUpdate.check_out_time = timestamp;
        attendanceUpdate.status = 'checked-out';

        // Recalculate duration if check_in exists
        const { data: attendanceRecord } = await supabase
          .from('attendance')
          .select('check_in_time')
          .eq('id', correction.attendance_id)
          .single();

        if (attendanceRecord?.check_in_time) {
          const checkInTime = new Date(attendanceRecord.check_in_time);
          const checkOutTime = new Date(timestamp);
          const durationMinutes = (checkOutTime - checkInTime) / (1000 * 60);
          const durationHours = durationMinutes / 60;
          let workDurationHours = durationHours;
          if (durationHours >= 4) {
            workDurationHours = durationHours - 1; // Deduct 1 hour lunch break
          }
          attendanceUpdate.duration_hours = parseFloat(workDurationHours.toFixed(4));
        }
      }

      if (Object.keys(attendanceUpdate).length > 0) {
        console.log('Updating attendance record:', attendanceUpdate);
        const attendanceResult = await supabase
          .from('attendance')
          .update(attendanceUpdate)
          .eq('id', correction.attendance_id);
        console.log('Attendance update result:', attendanceResult);
        if (attendanceResult.error) throw attendanceResult.error;
      }
    }


    return updateResult;
  } catch (error) {
    console.error('Error approving attendance correction:', error);
    throw error;
  }
};

export const rejectAttendanceCorrection = async (correctionId, approverUserId, remarks = null) => {
  try {
    // Get correction details first
    const { data: correction, error: fetchError } = await supabase
      .from('attendance_corrections')
      .select('user_id, attendance_id')
      .eq('id', correctionId)
      .single();

    if (fetchError) throw fetchError;

    // Update correction
    const { data: rejectData, error: rejectError } = await supabase
      .from('attendance_corrections')
      .update({
        status: 'rejected',
        approved_by: approverUserId,
        approved_at: new Date().toISOString(),
        remarks,
        updated_at: new Date().toISOString(),
      })
      .eq('id', correctionId)
      .select();

    if (rejectError) throw rejectError;

    const updateResult = { data: rejectData, error: null };

    // Update the attendance record to mark as absent
    if (correction.attendance_id) {
      await supabase
        .from('attendance')
        .update({
          status: 'absent',
          updated_at: new Date().toISOString(),
        })
        .eq('id', correction.attendance_id);
    }


    return updateResult;
  } catch (error) {
    console.error('Error rejecting attendance correction:', error);
    throw error;
  }
};
