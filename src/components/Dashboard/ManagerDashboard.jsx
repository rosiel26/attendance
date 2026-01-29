import React, { useState, useEffect, useCallback, useMemo } from "react";
import Header from "../Common/Header";
import { supabase } from "../../config/supabase";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";
import {
  getAttendanceCorrections,
  approveAttendanceCorrection,
  rejectAttendanceCorrection,
  createNotification,
} from "../../services/supabaseService";
import {
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

// ============ UI Components ============
const StatCard = ({ label, value, color, subtext }) => (
  <div className={`card bg-${color}-50 border-l-4 border-${color}-500`}>
    <div className="text-gray-600 text-sm font-semibold">{label}</div>
    <div className={`text-3xl font-bold text-${color}-600`}>{value}</div>
    {subtext && <div className="text-xs text-gray-500">{subtext}</div>}
  </div>
);

const StatusBadge = ({ status }) => {
  const colors = {
    pending: "bg-orange-100 text-orange-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    "checked-out": "bg-green-100 text-green-800",
  };
  return (
    <span
      className={`px-2 py-1 rounded text-xs font-semibold ${colors[status] || "bg-gray-100 text-gray-800"}`}
    >
      {status}
    </span>
  );
};

const ActionButtons = ({ status, onApprove, onReject, loading }) => (
  <div className="space-x-2 flex">
    <button
      onClick={onApprove}
      disabled={loading}
      className="text-green-600 hover:text-green-800 font-semibold text-sm disabled:opacity-50"
    >
      ✓ Approve
    </button>
    <button
      onClick={onReject}
      disabled={loading}
      className="text-red-600 hover:text-red-800 font-semibold text-sm disabled:opacity-50"
    >
      ✕ Reject
    </button>
  </div>
);

const RejectionModal = ({
  isOpen,
  reason,
  onChange,
  onConfirm,
  onCancel,
  loading,
  title,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <textarea
          value={reason}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter reason for rejection..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 mb-4"
          rows="4"
        />
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading || !reason.trim()}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Rejecting..." : "Reject"}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-3 px-4 text-center font-semibold transition flex items-center justify-center gap-2 ${
      active
        ? "bg-blue-500 text-white"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </button>
);

// ============ Main Component ============
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
  const [corrections, setCorrections] = useState([]);
  const [filters, setFilters] = useState({
    attendanceDate: new Date().toISOString().split("T")[0],
    attendanceEmployee: "",
    leaveStatus: "all",
    leaveEmployee: "",
  });
  const [teamIds, setTeamIds] = useState([]);
  const [rejectModal, setRejectModal] = useState({
    type: "",
    id: null,
    reason: "",
  });

  // Combined effect for data fetching
  useEffect(() => {
    if (!user?.id) return;

    const initDashboard = async () => {
      if (userProfile?.id) {
        await fetchManagerData();
        setupRealtimeSubscriptions();
      } else {
        const { data: profileData } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profileData) {
          useAuthStore.getState().setUserProfile(profileData);
          await fetchManagerData();
          setupRealtimeSubscriptions();
        }
      }
    };

    initDashboard();
    return () => {
      if (window.leaveSubscription)
        supabase.removeChannel(window.leaveSubscription);
      if (window.notificationSubscription)
        supabase.removeChannel(window.notificationSubscription);
    };
  }, [user?.id, userProfile?.id]);

  const setupRealtimeSubscriptions = useCallback(() => {
    window.leaveSubscription = supabase
      .channel("leave_requests_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leave_requests" },
        fetchManagerData,
      )
      .subscribe();
  }, []);

  const fetchManagerData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: departments } = await supabase
        .from("departments")
        .select("id, name");
      const departmentMap = Object.fromEntries(
        (departments || []).map((d) => [d.id, d.name]),
      );

      let employeeQuery = supabase.from("users").select("*");
      if (userProfile?.role !== "admin") {
        employeeQuery = employeeQuery.eq("manager_id", user.id);
      }

      const { data: allUsers } = await employeeQuery;
      const employees = (allUsers || [])
        .map((emp) => ({
          ...emp,
          department: departmentMap[emp.department_id] || null,
        }))
        .filter((u) =>
          userProfile?.role === "admin" ? u.role === "employee" : true,
        );

      if (employees.length === 0) {
        setEmployees([]);
        setLeaveRequests([]);
        setTeamAttendance([]);
        setStats({
          teamSize: 0,
          presentToday: 0,
          leaveRequests: 0,
          pendingCorrections: 0,
          teamAttendance: [],
        });
        return;
      }

      setEmployees(employees);
      const ids = employees.map((t) => t.id);
      setTeamIds(ids);
      await fetchLeaveAndAttendance(ids);
    } catch (error) {
      toast.error("Failed to load manager data");
    } finally {
      setLoading(false);
    }
  }, [user?.id, userProfile?.role]);

  const fetchLeaveAndAttendance = useCallback(
    async (ids) => {
      const currentTeamIds = ids || teamIds;
      if (currentTeamIds.length === 0) return;

      try {
        const [
          { data: leaveData },
          { data: correctionsData },
          { data: attendanceData },
        ] = await Promise.all([
          supabase
            .from("leave_requests")
            .select(
              "*, users:user_id(id, full_name, email), approver:approved_by(id, full_name)",
            )
            .in("user_id", currentTeamIds),
          getAttendanceCorrections(user.id, userProfile?.role),
          supabase
            .from("attendance")
            .select("*, users:user_id(id, full_name, email)")
            .in("user_id", currentTeamIds)
            .gte("check_in_time", new Date().toISOString().split("T")[0])
            .lt(
              "check_in_time",
              new Date(Date.now() + 86400000).toISOString().split("T")[0],
            ),
        ]);

        const filteredCorrections = (correctionsData || []).filter((c) =>
          userProfile?.role === "manager"
            ? currentTeamIds.includes(c.user_id)
            : true,
        );

        setLeaveRequests(leaveData || []);
        setCorrections(filteredCorrections);
        setTeamAttendance(attendanceData || []);
        setStats({
          teamSize: employees.length,
          presentToday:
            attendanceData?.filter((a) => a.check_out_time).length || 0,
          leaveRequests:
            leaveData?.filter((l) => l.status === "pending").length || 0,
          pendingCorrections:
            filteredCorrections?.filter((c) => c.status === "pending").length ||
            0,
          teamAttendance: attendanceData || [],
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    },
    [teamIds, user?.id, userProfile?.role, employees.length],
  );

  const handleApproveLeave = async (leaveId) => {
    if (!user?.id) return toast.error("Session expired");
    try {
      setLoading(true);
      const { data: leaveRequest } = await supabase
        .from("leave_requests")
        .select("user_id")
        .eq("id", leaveId)
        .single();
      const { error } = await supabase
        .from("leave_requests")
        .update({ status: "approved", approved_by: user.id })
        .eq("id", leaveId);
      if (error) throw error;
      await createNotification(
        leaveRequest.user_id,
        "Your leave request has been approved.",
        "leave",
        leaveId,
      );
      toast.success("Leave request approved!");
      fetchManagerData();
    } catch (error) {
      toast.error(`Failed to approve: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectLeave = async () => {
    if (!user?.id || !rejectModal.reason.trim())
      return toast.error("Please enter a reason");
    try {
      setLoading(true);
      const { error } = await supabase
        .from("leave_requests")
        .update({
          status: "rejected",
          rejection_reason: rejectModal.reason,
          approved_by: user.id,
        })
        .eq("id", rejectModal.id);
      if (error) throw error;
      toast.success("Leave request rejected");
      setRejectModal({ type: "", id: null, reason: "" });
      fetchManagerData();
    } catch (error) {
      toast.error(`Failed to reject: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCorrection = async (correctionId) => {
    if (!user?.id) return toast.error("Session expired");
    try {
      setLoading(true);
      const result = await approveAttendanceCorrection(correctionId, user.id);
      if (result?.error) throw new Error(result.error.message);
      toast.success("Correction request approved!");
      fetchManagerData();
    } catch (error) {
      toast.error(`Failed to approve: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectCorrection = async () => {
    if (!user?.id || !rejectModal.reason.trim())
      return toast.error("Please enter a reason");
    try {
      setLoading(true);
      const result = await rejectAttendanceCorrection(
        rejectModal.id,
        user.id,
        rejectModal.reason,
      );
      if (result?.error) throw new Error(result.error.message);
      toast.success("Correction request rejected");
      setRejectModal({ type: "", id: null, reason: "" });
      fetchManagerData();
    } catch (error) {
      toast.error(`Failed to reject: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceByDate = async () => {
    if (teamIds.length === 0) return;
    try {
      setLoading(true);
      const nextDate = new Date(
        new Date(filters.attendanceDate).getTime() + 86400000,
      )
        .toISOString()
        .split("T")[0];
      const { data } = await supabase
        .from("attendance")
        .select("*, users:user_id(id, full_name, email)")
        .in("user_id", teamIds)
        .gte("check_in_time", filters.attendanceDate)
        .lt("check_in_time", nextDate);
      setTeamAttendance(data || []);
    } catch (error) {
      toast.error("Failed to fetch attendance");
    } finally {
      setLoading(false);
    }
  };

  // Filtered data using useMemo
  const filteredLeaveRequests = useMemo(() => {
    return leaveRequests.filter((r) => {
      const statusMatch =
        filters.leaveStatus === "all" || r.status === filters.leaveStatus;
      const employeeMatch =
        !filters.leaveEmployee || r.user_id === filters.leaveEmployee;
      return statusMatch && employeeMatch;
    });
  }, [leaveRequests, filters.leaveStatus, filters.leaveEmployee]);

  const filteredAttendance = useMemo(() => {
    if (!filters.attendanceEmployee) return teamAttendance;
    return teamAttendance.filter(
      (a) => a.user_id === filters.attendanceEmployee,
    );
  }, [teamAttendance, filters.attendanceEmployee]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header
        title="Manager Dashboard"
        onNavigate={(type) =>
          setActiveTab(type === "leave" ? "leave-requests" : "corrections")
        }
      />

      {loading && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 m-4">
          <p>Loading data...</p>
        </div>
      )}

      <main className="flex-1 p-4 md:p-8 pb-24">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Dashboard - Quick Stats</h2>
              <button
                onClick={fetchManagerData}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 text-sm"
              >
                {loading ? "Loading..." : "Refresh Data"}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                label="Today's Attendance"
                value={stats.presentToday}
                color="blue"
                subtext={`out of ${stats.teamSize} team members`}
              />
              <StatCard
                label="Pending Leave Requests"
                value={stats.leaveRequests}
                color="orange"
              />
              <StatCard
                label="Pending Attendance Corrections"
                value={stats.pendingCorrections}
                color="purple"
              />
              <StatCard
                label="Team Size"
                value={stats.teamSize}
                color="green"
              />
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
                      <th className="p-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
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
                            {emp.department || "Not Assigned"}
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
            <div className="card">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.leaveStatus}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, leaveStatus: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    value={filters.leaveEmployee}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        leaveEmployee: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Employees</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <RejectionModal
              isOpen={rejectModal.type === "leave"}
              reason={rejectModal.reason}
              onChange={(r) => setRejectModal((m) => ({ ...m, reason: r }))}
              onConfirm={handleRejectLeave}
              onCancel={() =>
                setRejectModal({ type: "", id: null, reason: "" })
              }
              loading={loading}
              title="Reject Leave Request"
            />
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
                    {filteredLeaveRequests.length === 0 ? (
                      <tr>
                        <td
                          colSpan="7"
                          className="p-3 text-center text-gray-500"
                        >
                          No leave requests
                        </td>
                      </tr>
                    ) : (
                      filteredLeaveRequests.map((request) => (
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
                            <StatusBadge status={request.status} />
                          </td>
                          <td className="p-3">
                            {request.status === "pending" && (
                              <ActionButtons
                                status={request.status}
                                onApprove={() => handleApproveLeave(request.id)}
                                onReject={() =>
                                  setRejectModal({
                                    type: "leave",
                                    id: request.id,
                                    reason: "",
                                  })
                                }
                                loading={loading}
                              />
                            )}
                            {request.status === "rejected" &&
                              request.rejection_reason && (
                                <div className="text-xs text-red-600">
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

        {/* Corrections Tab */}
        {activeTab === "corrections" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Attendance Corrections</h2>
            <RejectionModal
              isOpen={rejectModal.type === "correction"}
              reason={rejectModal.reason}
              onChange={(r) => setRejectModal((m) => ({ ...m, reason: r }))}
              onConfirm={handleRejectCorrection}
              onCancel={() =>
                setRejectModal({ type: "", id: null, reason: "" })
              }
              loading={loading}
              title="Reject Correction Request"
            />
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-3 text-left">Employee</th>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Missing Type</th>
                      <th className="p-3 text-left">Time</th>
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
                            <StatusBadge status={correction.status} />
                          </td>
                          <td className="p-3">
                            {correction.status === "pending" && (
                              <ActionButtons
                                onApprove={() =>
                                  handleApproveCorrection(correction.id)
                                }
                                onReject={() =>
                                  setRejectModal({
                                    type: "correction",
                                    id: correction.id,
                                    reason: "",
                                  })
                                }
                                loading={loading}
                              />
                            )}
                            {correction.status === "rejected" &&
                              correction.remarks && (
                                <div className="text-xs text-red-600">
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
            <div className="card">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={filters.attendanceDate}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        attendanceDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee
                  </label>
                  <select
                    value={filters.attendanceEmployee}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        attendanceEmployee: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                    onClick={fetchAttendanceByDate}
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
                    {filteredAttendance.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="p-3 text-center text-gray-500"
                        >
                          No attendance records
                        </td>
                      </tr>
                    ) : (
                      filteredAttendance.map((record) => (
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
                            {record.duration_hours
                              ? `${Math.floor(record.duration_hours)}hr ${Math.round((record.duration_hours % 1) * 60)}mins`
                              : "-"}
                          </td>
                          <td className="p-3">
                            <StatusBadge status={record.status} />
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
          <TabButton
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
            icon={ChartBarIcon}
            label="Dashboard"
          />
          <TabButton
            active={activeTab === "attendance"}
            onClick={() => setActiveTab("attendance")}
            icon={CalendarDaysIcon}
            label="Attendance"
          />
          <TabButton
            active={activeTab === "leave-requests"}
            onClick={() => setActiveTab("leave-requests")}
            icon={ClipboardDocumentListIcon}
            label="Leave Requests"
          />
          <TabButton
            active={activeTab === "corrections"}
            onClick={() => setActiveTab("corrections")}
            icon={ClockIcon}
            label="Corrections"
          />
          <TabButton
            active={activeTab === "employee-directory"}
            onClick={() => setActiveTab("employee-directory")}
            icon={UserGroupIcon}
            label="Team"
          />
          <TabButton
            active={activeTab === "reports"}
            onClick={() => setActiveTab("reports")}
            icon={ChartBarIcon}
            label="Reports"
          />
        </div>
      </div>
      <div className="h-20"></div>
    </div>
  );
};

export default ManagerDashboard;
