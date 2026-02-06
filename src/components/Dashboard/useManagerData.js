import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../config/supabase";
import { getAttendanceCorrections, approveAttendanceCorrection, rejectAttendanceCorrection, createNotification } from "../../services/supabaseService";
import { useAuthStore } from "../../stores/authStore";

export const useManagerData = (user, userProfile) => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [teamIds, setTeamIds] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [teamAttendance, setTeamAttendance] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [monthlyHours, setMonthlyHours] = useState([]);
  const [filteredMonthlyHours, setFilteredMonthlyHours] = useState([]);

  const fetchManagerData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: departments } = await supabase.from("departments").select("id, name");
      const departmentMap = Object.fromEntries((departments || []).map((d) => [d.id, d.name]));

      let employeeQuery = supabase.from("users").select("*");
      if (userProfile?.role !== "admin") employeeQuery = employeeQuery.eq("manager_id", user.id);

      const { data: allUsers } = await employeeQuery;
      const filteredEmployees = (allUsers || []).map((emp) => ({ ...emp, department: departmentMap[emp.department_id] || null })).filter((u) => userProfile?.role === "admin" ? u.role === "employee" : true);

      if (filteredEmployees.length === 0) {
        setEmployees([]);
        setTeamIds([]);
        setLeaveRequests([]);
        setTeamAttendance([]);
        setCorrections([]);
        return;
      }

      setEmployees(filteredEmployees);
      const ids = filteredEmployees.map((t) => t.id);
      setTeamIds(ids);
      await fetchLeaveAndAttendance(ids);
    } catch (error) {
      console.error("Failed to load manager data:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, userProfile?.role]);

  const fetchLeaveAndAttendance = useCallback(async (ids) => {
    const currentTeamIds = ids || teamIds;
    if (currentTeamIds.length === 0) return;

    try {
      const [{ data: leaveData }, { data: correctionsData }, { data: attendanceData }] = await Promise.all([
        supabase.from("leave_requests").select("*, users:user_id(id, full_name, email), approver:approved_by(id, full_name)").in("user_id", currentTeamIds),
        getAttendanceCorrections(user.id, userProfile?.role),
        supabase.from("attendance").select("*, users:user_id(id, full_name, email)").in("user_id", currentTeamIds).gte("check_in_time", new Date().toISOString().split("T")[0]).lt("check_in_time", new Date(Date.now() + 86400000).toISOString().split("T")[0]),
      ]);

      const filteredCorrections = (correctionsData || []).filter((c) => userProfile?.role === "manager" ? currentTeamIds.includes(c.user_id) : true);

      setLeaveRequests(leaveData || []);
      setCorrections(filteredCorrections);
      setTeamAttendance(attendanceData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [teamIds, user?.id, userProfile?.role]);

  const fetchAttendanceByDate = useCallback(async (date) => {
    if (teamIds.length === 0) return;
    setLoading(true);
    try {
      const nextDate = new Date(new Date(date).getTime() + 86400000).toISOString().split("T")[0];
      const { data } = await supabase.from("attendance").select("*, users:user_id(id, full_name, email)").in("user_id", teamIds).gte("check_in_time", date).lt("check_in_time", nextDate);
      setTeamAttendance(data || []);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    } finally {
      setLoading(false);
    }
  }, [teamIds]);

  const fetchMonthlyHours = useCallback(async (startDate, endDate, employeeSearch = "") => {
    if (teamIds.length === 0) return;
    setLoading(true);
    try {
      const workStartHour = 9; // 9 AM
      
      const { data: attendanceData } = await supabase.from("attendance").select("*, users:user_id(id, full_name, email)").in("user_id", teamIds).gte("check_in_time", startDate).lte("check_in_time", endDate);

      const hoursByEmployee = {};
      
      // Get dates with attendance for each employee
      const employeeDates = {};
      (attendanceData || []).forEach((record) => {
        const userId = record.user_id;
        if (!employeeDates[userId]) {
          employeeDates[userId] = new Set();
        }
        if (record.check_in_time) {
          const date = new Date(record.check_in_time).toISOString().split("T")[0];
          employeeDates[userId].add(date);
        }
      });

      (attendanceData || []).forEach((record) => {
        const userId = record.user_id;
        if (!hoursByEmployee[userId]) {
          hoursByEmployee[userId] = { 
            userId, 
            fullName: record.users?.full_name || "Unknown", 
            email: record.users?.email, 
            totalHours: 0, 
            daysPresent: 0,
            daysLate: 0,
            daysAbsent: 0 
          };
        }
        if (record.check_in_time) {
          hoursByEmployee[userId].totalHours += record.duration_hours || 0;
          hoursByEmployee[userId].daysPresent += 1;
          
          // Check if late (after 9 AM)
          const checkInTime = new Date(record.check_in_time);
          const hours = checkInTime.getHours() + checkInTime.getMinutes() / 60;
          if (hours > workStartHour) {
            hoursByEmployee[userId].daysLate += 1;
          }
        }
      });

      // Calculate absent days for each employee based on their actual attendance dates
      const monthlyHoursData = Object.values(hoursByEmployee).map((emp) => {
        const presentDates = employeeDates[emp.userId] || new Set();
        
        // Count weekdays between start and end date
        const start = new Date(startDate);
        const end = new Date(endDate);
        let weekdaysInRange = 0;
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const day = d.getDay();
          if (day !== 0 && day !== 6) { // Skip Sunday (0) and Saturday (6)
            weekdaysInRange += 1;
          }
        }
        
        return {
          ...emp,
          totalHours: parseFloat(emp.totalHours.toFixed(2)),
          daysAbsent: Math.max(0, weekdaysInRange - emp.daysPresent),
        };
      }).sort((a, b) => b.totalHours - a.totalHours);

      // Filter by employee name if search is provided
      const filteredData = employeeSearch 
        ? monthlyHoursData.filter(emp => 
            emp.fullName?.toLowerCase().includes(employeeSearch.toLowerCase())
          )
        : monthlyHoursData;

      setMonthlyHours(monthlyHoursData);
      setFilteredMonthlyHours(filteredData);
    } catch (error) {
      console.error("Failed to fetch monthly hours:", error);
    } finally {
      setLoading(false);
    }
  }, [teamIds]);

  const handleApproveLeave = useCallback(async (leaveId) => {
    if (!user?.id) return { error: "Session expired" };
    try {
      const { data: leaveRequest } = await supabase.from("leave_requests").select("user_id").eq("id", leaveId).single();
      const { error } = await supabase.from("leave_requests").update({ status: "approved", approved_by: user.id }).eq("id", leaveId);
      if (error) throw error;
      await createNotification(leaveRequest.user_id, "Your leave request has been approved.", "leave", leaveId);
      await fetchManagerData();
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }, [user?.id, fetchManagerData]);

  const handleRejectLeave = useCallback(async (leaveId, reason) => {
    if (!user?.id || !reason.trim()) return { error: "Please enter a reason" };
    try {
      const { error } = await supabase.from("leave_requests").update({ status: "rejected", rejection_reason: reason, approved_by: user.id }).eq("id", leaveId);
      if (error) throw error;
      await fetchManagerData();
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }, [user?.id, fetchManagerData]);

  const handleApproveCorrection = useCallback(async (correctionId) => {
    if (!user?.id) return { error: "Session expired" };
    try {
      const result = await approveAttendanceCorrection(correctionId, user.id);
      if (result?.error) throw new Error(result.error.message);
      await fetchManagerData();
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }, [user?.id, fetchManagerData]);

  const handleRejectCorrection = useCallback(async (correctionId, reason) => {
    if (!user?.id || !reason.trim()) return { error: "Please enter a reason" };
    try {
      const result = await rejectAttendanceCorrection(correctionId, user.id, reason);
      if (result?.error) throw new Error(result.error.message);
      await fetchManagerData();
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  }, [user?.id, fetchManagerData]);

  const setupRealtimeSubscriptions = useCallback(() => {
    window.leaveSubscription = supabase.channel("leave_requests_changes").on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, fetchManagerData).subscribe();
  }, [fetchManagerData]);

  useEffect(() => {
    if (!user?.id) return;
    const initDashboard = async () => {
      if (userProfile?.id) {
        await fetchManagerData();
        setupRealtimeSubscriptions();
      } else {
        const { data: profileData } = await supabase.from("users").select("*").eq("id", user.id).single();
        if (profileData) {
          useAuthStore.getState().setUserProfile(profileData);
          await fetchManagerData();
          setupRealtimeSubscriptions();
        }
      }
    };
    initDashboard();
    return () => {
      if (window.leaveSubscription) supabase.removeChannel(window.leaveSubscription);
      if (window.notificationSubscription) supabase.removeChannel(window.notificationSubscription);
    };
  }, [user?.id, userProfile?.id, fetchManagerData, setupRealtimeSubscriptions]);

  return {
    loading,
    employees,
    teamIds,
    leaveRequests,
    teamAttendance,
    corrections,
    monthlyHours,
    filteredMonthlyHours,
    fetchManagerData,
    fetchAttendanceByDate,
    fetchMonthlyHours,
    handleApproveLeave,
    handleRejectLeave,
    handleApproveCorrection,
    handleRejectCorrection,
    setupRealtimeSubscriptions,
  };
};

export default useManagerData;
