import React, { useState, useEffect } from "react";
import Header from "../Common/Header";
import { supabase } from "../../config/supabase";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";
import {
  getAttendanceCorrections,
  approveAttendanceCorrection,
  rejectAttendanceCorrection,
} from "../../services/supabaseService";
import {
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const ManagerDashboard = () => {
  const { user, userProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({
    teamSize: 0,
    presentToday: 0,
    leaveRequests: 0,
    pendingCorrections: 0,
    teamAttendance: [],
  });
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [teamAttendance, setTeamAttendance] = useState([]);
  const [rejectingRequestId, setRejectingRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [attendanceFilters, setAttendanceFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    employee: "",
  });
  const [leaveFilters, setLeaveFilters] = useState({
    status: "all",
    employee: "",
  });
  const [leaveBalances, setLeaveBalances] = useState({});
  const [corrections, setCorrections] = useState([]);
  const [rejectingCorrectionId, setRejectingCorrectionId] = useState(null);
  const [correctionRejectionReason, setCorrectionRejectionReason] =
    useState("");

  useEffect(() => {
    if (user?.id) {
      fetchManagerData();
      setupRealtimeSubscriptions();
    }

    return () => {
      // Cleanup subscriptions
      if (window.leaveSubscription) {
        supabase.removeChannel(window.leaveSubscription);
      }
      if (window.notificationSubscription) {
        supabase.removeChannel(window.notificationSubscription);
      }
    };
  }, [user?.id]);

  const setupRealtimeSubscriptions = () => {
    // Subscribe to leave requests changes
    window.leaveSubscription = supabase
      .channel("leave_requests_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leave_requests",
        },
        (payload) => {
          console.log("Leave request change:", payload);
          fetchManagerData(); // Refresh data when leave requests change
        },
      )
      .subscribe();

    // Note: Notifications are handled by the Notifications component
    // No need to duplicate subscription here
  };

  const fetchManagerData = async () => {
    setLoading(true);
    try {
      console.log(
        "Fetching manager data for user:",
        user?.id,
        "Role:",
        user?.role,
      );

      // First, try fetching all users without any filter to check RLS
      const { data: allUsers, error: allError } = await supabase
        .from("users")
        .select("*");

      console.log("All users (no filter):", allUsers, "Error:", allError);

      if (allError) {
        console.error("Cannot read users table - RLS blocking:", allError);
        toast.error(
          "RLS policy is blocking access to users table. Check manager permissions.",
        );
        setLoading(false);
        return;
      }

      // Filter for employees
      const employees = allUsers?.filter((u) => u.role === "employee") || [];
      console.log("Filtered employees:", employees);

      if (employees.length === 0) {
        console.log("No employees found");
        setEmployees([]);
        setLeaveRequests([]);
        setTeamAttendance([]);
        setStats({
          teamSize: 0,
          presentToday: 0,
          leaveRequests: 0,
          teamAttendance: [],
        });
        setLoading(false);
        return;
      }

      setEmployees(employees);
      const teamIds = employees.map((t) => t.id);
      await fetchLeaveAndAttendance(teamIds, employees);
    } catch (error) {
      console.error("Error fetching manager data:", error);
      toast.error("Failed to load manager data: " + error.message);
      setLoading(false);
    }
  };

  const fetchLeaveAndAttendance = async (teamIds, teamData) => {
    try {
      // Fetch team leave requests
      console.log("Team IDs:", teamIds);

      const { data: leaveData, error: leaveError } = await supabase
        .from("leave_requests")
        .select(
          `
          id,
          user_id,
          leave_type,
          start_date,
          end_date,
          reason,
          status,
          approved_by,
          rejection_reason,
          created_at,
          updated_at,
          users:user_id (
            id,
            full_name,
            email
          )
        `,
        )
        .in("user_id", teamIds);

      console.log("Leave data:", leaveData, "Error:", leaveError);

      if (leaveError) {
        console.error("Leave data error:", leaveError);
      }

      setLeaveRequests(leaveData || []);

      // Fetch attendance corrections
      console.log(
        "Fetching corrections for user:",
        user.id,
        "role:",
        userProfile?.role,
      );
      const { data: correctionsData, error: correctionsError } =
        await getAttendanceCorrections(user.id, userProfile?.role);

      console.log(
        "Corrections data:",
        correctionsData,
        "Error:",
        correctionsError,
      );

      if (correctionsError) {
        console.error("Corrections data error:", correctionsError);
      }

      setCorrections(correctionsData || []);

      // Fetch team attendance today
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000)
        .toISOString()
        .split("T")[0];

      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select(
          `
          *,
          users:user_id (
            id,
            full_name,
            email
          )
        `,
        )
        .in("user_id", teamIds)
        .gte("check_in_time", today)
        .lt("check_in_time", tomorrow);

      console.log(
        "Attendance data:",
        attendanceData,
        "Error:",
        attendanceError,
      );

      if (attendanceError) {
        console.error("Attendance data error:", attendanceError);
      }

      setTeamAttendance(attendanceData || []);

      setStats({
        teamSize: teamData?.length || 0,
        presentToday:
          attendanceData?.filter((a) => a.check_out_time).length || 0,
        leaveRequests:
          leaveData?.filter((l) => l.status === "pending").length || 0,
        pendingCorrections:
          correctionsData?.filter((c) => c.status === "pending").length || 0,
        teamAttendance: attendanceData || [],
      });

      console.log("Manager data loaded successfully");
    } catch (error) {
      console.error("Error in fetchLeaveAndAttendance:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (leaveId) => {
    if (!user?.id) {
      toast.error("User session not found. Please login again.");
      return;
    }

    try {
      setLoading(true);
      console.log("Approving leave request:", leaveId);

      const { data, error } = await supabase
        .from("leave_requests")
        .update({
          status: "approved",
          approved_by: user.id,
        })
        .eq("id", leaveId)
        .select();

      console.log("Approve response:", { data, error });

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Request could not be updated. Check permissions.");
      }

      toast.success("✓ Leave request approved!");
      await fetchManagerData();
    } catch (error) {
      console.error("Approve error:", error);
      toast.error(`Failed to approve: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectLeave = async (leaveId) => {
    if (!user?.id) {
      toast.error("User session not found. Please login again.");
      return;
    }

    if (!rejectionReason.trim()) {
      toast.error("Please enter a reason for rejection");
      return;
    }

    try {
      setLoading(true);
      console.log("Rejecting leave request:", leaveId);

      const { data, error } = await supabase
        .from("leave_requests")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason,
          approved_by: user.id,
        })
        .eq("id", leaveId)
        .select();

      console.log("Reject response:", { data, error });

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Request could not be updated. Check permissions.");
      }

      toast.success("✕ Leave request rejected");
      setRejectingRequestId(null);
      setRejectionReason("");
      await fetchManagerData();
    } catch (error) {
      console.error("Reject error:", error);
      toast.error(`Failed to reject: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCorrection = async (correctionId) => {
    if (!user?.id) {
      toast.error("User session not found. Please login again.");
      return;
    }

    try {
      setLoading(true);
      console.log("Approving correction request:", correctionId);

      const result = await approveAttendanceCorrection(correctionId, user.id);

      if (result.error) throw result.error;

      toast.success("✓ Correction request approved!");
      await fetchManagerData();
    } catch (error) {
      console.error("Approve correction error:", error);
      toast.error(`Failed to approve: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectCorrection = async (correctionId) => {
    if (!user?.id) {
      toast.error("User session not found. Please login again.");
      return;
    }

    if (!correctionRejectionReason.trim()) {
      toast.error("Please enter a reason for rejection");
      return;
    }

    try {
      setLoading(true);
      console.log("Rejecting correction request:", correctionId);

      const result = await rejectAttendanceCorrection(
        correctionId,
        user.id,
        correctionRejectionReason,
      );

      if (result.error) throw result.error;

      toast.success("✕ Correction request rejected");
      setRejectingCorrectionId(null);
      setCorrectionRejectionReason("");
      await fetchManagerData();
    } catch (error) {
      console.error("Reject correction error:", error);
      toast.error(`Failed to reject: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationNavigate = (type, notification) => {
    if (type === "leave") {
      setActiveTab("leave-requests");
    } else if (type === "correction") {
      setActiveTab("corrections");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header
        title="Manager Dashboard"
        onNavigate={handleNotificationNavigate}
      />

      {/* Debug Info */}
      {loading && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 m-4">
          <p>Loading data...</p>
        </div>
      )}

      <main className="flex-1 p-4 md:p-8 pb-24">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Dashboard - Quick Stats</h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card bg-blue-50 border-l-4 border-blue-500">
                <div className="text-gray-600 text-sm font-semibold">
                  Today's Attendance
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {stats.presentToday}
                </div>
                <div className="text-xs text-gray-500">
                  out of {stats.teamSize} team members
                </div>
              </div>
              <div className="card bg-orange-50 border-l-4 border-orange-500">
                <div className="text-gray-600 text-sm font-semibold">
                  Pending Leave Requests
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  {stats.leaveRequests}
                </div>
              </div>
              <div className="card bg-purple-50 border-l-4 border-purple-500">
                <div className="text-gray-600 text-sm font-semibold">
                  Pending Attendance Corrections
                </div>
                <div className="text-3xl font-bold text-purple-600">
                  {stats.pendingCorrections}
                </div>
              </div>
              <div className="card bg-green-50 border-l-4 border-green-500">
                <div className="text-gray-600 text-sm font-semibold">
                  Team Size
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {stats.teamSize}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Employee Directory Tab */}
        {activeTab === "employee-directory" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Team Members</h2>

            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-3 text-left">Full Name</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Role</th>
                      <th className="p-3 text-left">Department</th>
                      <th className="p-3 text-left">Leave Balance</th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length === 0 ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="p-3 text-center text-gray-500"
                        >
                          No team members found
                        </td>
                      </tr>
                    ) : (
                      employees.map((emp) => (
                        <tr key={emp.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-semibold">{emp.full_name}</td>
                          <td className="p-3">{emp.email}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                              {emp.role || "Employee"}
                            </span>
                          </td>
                          <td className="p-3">
                            {emp.department_id || "Not Assigned"}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                              {leaveBalances[emp.id]?.remaining_days || 0} days
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Leave Requests Tab */}
        {activeTab === "leave-requests" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Leave Requests</h2>

            {/* Filters */}
            <div className="card">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={leaveFilters.status}
                    onChange={(e) =>
                      setLeaveFilters((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee
                  </label>
                  <select
                    value={leaveFilters.employee}
                    onChange={(e) =>
                      setLeaveFilters((prev) => ({
                        ...prev,
                        employee: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All Employees</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      /* TODO: Apply filters */
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Rejection Reason Modal */}
            {rejectingRequestId && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-lg font-bold mb-4">
                    Reject Leave Request
                  </h3>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 mb-4"
                    rows="4"
                  ></textarea>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleRejectLeave(rejectingRequestId)}
                      disabled={loading || !rejectionReason.trim()}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                    >
                      {loading ? "Rejecting..." : "Reject"}
                    </button>
                    <button
                      onClick={() => {
                        setRejectingRequestId(null);
                        setRejectionReason("");
                      }}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-3 text-left">Employee</th>
                      <th className="p-3 text-left">Leave Type</th>
                      <th className="p-3 text-left">Start Date</th>
                      <th className="p-3 text-left">End Date</th>
                      <th className="p-3 text-left">Reason</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="p-3 text-center text-gray-500"
                        >
                          No leave requests
                        </td>
                      </tr>
                    ) : (
                      leaveRequests.map((request) => (
                        <tr
                          key={request.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3 font-semibold">
                            {request.users?.full_name}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                              {request.leave_type}
                            </span>
                          </td>
                          <td className="p-3">
                            {new Date(request.start_date).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            {new Date(request.end_date).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-gray-600 max-w-xs truncate">
                            {request.reason || "-"}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                request.status === "pending"
                                  ? "bg-orange-100 text-orange-800"
                                  : request.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {request.status}
                            </span>
                          </td>
                          <td className="p-3">
                            {request.status === "pending" && (
                              <div className="space-x-2 flex">
                                <button
                                  onClick={() => handleApproveLeave(request.id)}
                                  disabled={loading}
                                  className="text-green-600 hover:text-green-800 font-semibold text-sm disabled:opacity-50"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() =>
                                    setRejectingRequestId(request.id)
                                  }
                                  disabled={loading}
                                  className="text-red-600 hover:text-red-800 font-semibold text-sm disabled:opacity-50"
                                >
                                  ✕ Reject
                                </button>
                              </div>
                            )}
                            {request.status === "rejected" &&
                              request.rejection_reason && (
                                <div className="text-xs text-red-600 max-w-xs">
                                  <strong>Reason:</strong>{" "}
                                  {request.rejection_reason}
                                </div>
                              )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Corrections Tab */}
        {activeTab === "corrections" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Attendance Corrections</h2>

            {/* Rejection Reason Modal */}
            {rejectingCorrectionId && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h3 className="text-lg font-bold mb-4">
                    Reject Correction Request
                  </h3>
                  <textarea
                    value={correctionRejectionReason}
                    onChange={(e) =>
                      setCorrectionRejectionReason(e.target.value)
                    }
                    placeholder="Enter reason for rejection..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 mb-4"
                    rows="4"
                  ></textarea>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        handleRejectCorrection(rejectingCorrectionId)
                      }
                      disabled={loading || !correctionRejectionReason.trim()}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                    >
                      {loading ? "Rejecting..." : "Reject"}
                    </button>
                    <button
                      onClick={() => {
                        setRejectingCorrectionId(null);
                        setCorrectionRejectionReason("");
                      }}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-3 text-left">Employee</th>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Missing Type</th>
                      <th className="p-3 text-left">Requested Time</th>
                      <th className="p-3 text-left">Reason</th>
                      <th className="p-3 text-left">Status</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {corrections.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="p-3 text-center text-gray-500"
                        >
                          No correction requests
                        </td>
                      </tr>
                    ) : (
                      corrections.map((correction) => (
                        <tr
                          key={correction.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3 font-semibold">
                            {correction.users?.full_name}
                          </td>
                          <td className="p-3">
                            {new Date(
                              correction.attendance_date,
                            ).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                              {correction.missing_type === "check_out"
                                ? "Check-out"
                                : correction.missing_type}
                            </span>
                          </td>
                          <td className="p-3">{correction.requested_time}</td>
                          <td className="p-3 text-gray-600 max-w-xs truncate">
                            {correction.reason || "-"}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                correction.status === "pending"
                                  ? "bg-orange-100 text-orange-800"
                                  : correction.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {correction.status}
                            </span>
                          </td>
                          <td className="p-3">
                            {correction.status === "pending" && (
                              <div className="space-x-2 flex">
                                <button
                                  onClick={() =>
                                    handleApproveCorrection(correction.id)
                                  }
                                  disabled={loading}
                                  className="text-green-600 hover:text-green-800 font-semibold text-sm disabled:opacity-50"
                                >
                                  ✓ Approve
                                </button>
                                <button
                                  onClick={() =>
                                    setRejectingCorrectionId(correction.id)
                                  }
                                  disabled={loading}
                                  className="text-red-600 hover:text-red-800 font-semibold text-sm disabled:opacity-50"
                                >
                                  ✕ Reject
                                </button>
                              </div>
                            )}
                            {correction.status === "rejected" &&
                              correction.remarks && (
                                <div className="text-xs text-red-600 max-w-xs">
                                  <strong>Reason:</strong> {correction.remarks}
                                </div>
                              )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Team Attendance</h2>

            {/* Filters */}
            <div className="card">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={attendanceFilters.date}
                    onChange={(e) =>
                      setAttendanceFilters((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee
                  </label>
                  <select
                    value={attendanceFilters.employee}
                    onChange={(e) =>
                      setAttendanceFilters((prev) => ({
                        ...prev,
                        employee: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All Employees</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      /* TODO: Apply filters */
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-3 text-left">Employee</th>
                      <th className="p-3 text-left">Check-in</th>
                      <th className="p-3 text-left">Check-out</th>
                      <th className="p-3 text-left">Hours Worked</th>
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamAttendance.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-3 text-center text-gray-500"
                        >
                          No attendance records today
                        </td>
                      </tr>
                    ) : (
                      teamAttendance.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3 font-semibold">
                            {record.users?.full_name}
                          </td>
                          <td className="p-3">
                            {new Date(
                              record.check_in_time,
                            ).toLocaleTimeString()}
                          </td>
                          <td className="p-3">
                            {record.check_out_time
                              ? new Date(
                                  record.check_out_time,
                                ).toLocaleTimeString()
                              : "-"}
                          </td>
                          <td className="p-3 font-semibold">
                            {record.duration_hours}h
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                record.status === "checked-out"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Reports</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="card bg-blue-50 border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Attendance Summary
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Export monthly attendance reports
                </p>
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                  Export Attendance Report
                </button>
              </div>

              <div className="card bg-green-50 border-l-4 border-green-500">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Leave Summary
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Monthly leave usage by employee
                </p>
                <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                  Export Leave Report
                </button>
              </div>

              <div className="card bg-orange-50 border-l-4 border-orange-500">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">
                  Overtime & Late Arrivals
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Track overtime hours and late arrivals
                </p>
                <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                  Export Overtime Report
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Tab Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 py-3 px-4 text-center font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === "dashboard"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex-1 py-3 px-4 text-center font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === "attendance"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <CalendarDaysIcon className="w-5 h-5" />
            <span>Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab("leave-requests")}
            className={`flex-1 py-3 px-4 text-center font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === "leave-requests"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <ClipboardDocumentListIcon className="w-5 h-5" />
            <span>Leave Requests</span>
          </button>
          <button
            onClick={() => setActiveTab("corrections")}
            className={`flex-1 py-3 px-4 text-center font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === "corrections"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <ClockIcon className="w-5 h-5" />
            <span>Corrections</span>
          </button>
          <button
            onClick={() => setActiveTab("employee-directory")}
            className={`flex-1 py-3 px-4 text-center font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === "employee-directory"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <UserGroupIcon className="w-5 h-5" />
            <span>Employee Directory</span>
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex-1 py-3 px-4 text-center font-semibold transition flex items-center justify-center gap-2 ${
              activeTab === "reports"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* Spacing for bottom navigation */}
      <div className="h-20"></div>
    </div>
  );
};

export default ManagerDashboard;
