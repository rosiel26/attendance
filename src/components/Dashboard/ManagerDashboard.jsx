import React, { useState, useMemo, useEffect, lazy, Suspense } from "react";
import Header from "../Common/Header";
import ManagerSidebar from "../Common/ManagerSidebar";
import Settings from "../Common/Settings";
import { useAuthStore } from "../../stores/authStore";
import {
  useBackgroundTheme,
  BACKGROUND_OPTIONS,
} from "../../components/Common/Settings";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabase";
import { useManagerData } from "./useManagerData";
import {
  StatCard,
  StatusBadge,
  ActionButtons,
  RejectionModal,
  FilterCard,
  DataTable,
  SectionHeader,
  ReportCard,
  LoadingSpinner,
} from "./ui-components";
import {
  ChartBarIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  ClockIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";

const Announcements = lazy(() => import("../Leave/Announcements"));

// Helper functions
const downloadCSV = (content, filename) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Main Component
const ManagerDashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile, logout } = useAuthStore();
  const { backgroundTheme, changeTheme } = useBackgroundTheme();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filters, setFilters] = useState({
    attendanceDate: new Date().toISOString().split("T")[0],
    attendanceEmployee: "",
    leaveStatus: "all",
    leaveEmployee: "",
    monthlyHoursStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    monthlyHoursEnd: new Date().toISOString().split("T")[0],
    monthlyHoursEmployee: "",
  });
  const [rejectModal, setRejectModal] = useState({
    type: "",
    id: null,
    reason: "",
  });
  const [actionLoading, setActionLoading] = useState(false);

  const {
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
  } = useManagerData(user, userProfile);

  // Computed stats
  const stats = useMemo(
    () => ({
      teamSize: teamIds.length,
      presentToday: teamAttendance.filter((a) => a.check_in_time).length,
      leaveRequests: leaveRequests.filter((l) => l.status === "pending").length,
      pendingCorrections: corrections.filter((c) => c.status === "pending")
        .length,
    }),
    [teamIds.length, teamAttendance, leaveRequests, corrections],
  );

  // Filtered data
  const filteredAttendance = useMemo(() => {
    let data = teamAttendance;
    if (filters.attendanceEmployee)
      data = data.filter((a) =>
        a.users?.full_name
          ?.toLowerCase()
          .includes(filters.attendanceEmployee.toLowerCase()),
      );
    return data;
  }, [teamAttendance, filters.attendanceEmployee]);

  // Fetch monthly hours on mount and when filters change
  useEffect(() => {
    if (teamIds.length > 0) {
      fetchMonthlyHours(
        filters.monthlyHoursStart,
        filters.monthlyHoursEnd,
        filters.monthlyHoursEmployee
      );
    }
  }, [teamIds.length, filters.monthlyHoursStart, filters.monthlyHoursEnd, filters.monthlyHoursEmployee, fetchMonthlyHours]);

  // Handler for monthly hours filter changes
  const handleMonthlyHoursFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Handler for applying monthly hours filters
  const applyMonthlyHoursFilters = () => {
    fetchMonthlyHours(
      filters.monthlyHoursStart,
      filters.monthlyHoursEnd,
      filters.monthlyHoursEmployee
    );
  };

  const filteredLeaveRequests = useMemo(() => {
    let data = leaveRequests;
    if (filters.leaveStatus !== "all")
      data = data.filter((l) => l.status === filters.leaveStatus);
    if (filters.leaveEmployee)
      data = data.filter((l) =>
        l.users?.full_name
          ?.toLowerCase()
          .includes(filters.leaveEmployee.toLowerCase()),
      );
    return data;
  }, [leaveRequests, filters.leaveStatus, filters.leaveEmployee]);

  // Table columns
  const attendanceColumns = [
    {
      header: "Employee",
      render: (row) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {row.users?.full_name || "N/A"}
        </div>
      ),
    },
    {
      header: "Check In",
      render: (row) => (
        <span className="text-gray-700 dark:text-gray-200">
          {row.check_in_time
            ? new Date(row.check_in_time).toLocaleTimeString()
            : "Not checked in"}
        </span>
      ),
    },
    {
      header: "Check Out",
      render: (row) => (
        <span className="text-gray-700 dark:text-gray-200">
          {row.check_out_time
            ? new Date(row.check_out_time).toLocaleTimeString()
            : "Not checked out"}
        </span>
      ),
    },
    {
      header: "Hours",
      render: (row) => (
        <span className="text-gray-700 dark:text-gray-200">
          {row.hours_worked ? `${row.hours_worked.toFixed(2)}h` : "-"}
        </span>
      ),
    },
    {
      header: "Status",
      render: (row) => (
        <StatusBadge status={row.check_out_time ? "checked-out" : "pending"} />
      ),
    },
  ];

  const leaveColumns = [
    {
      header: "Employee",
      render: (row) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {row.users?.full_name || "N/A"}
        </div>
      ),
    },
    {
      header: "Type",
      accessor: "leave_type",
      render: (row) => (
        <span className="text-gray-700 dark:text-gray-200">
          {row.leave_type || "N/A"}
        </span>
      ),
    },
    {
      header: "Start Date",
      render: (row) => (
        <span className="text-gray-700 dark:text-gray-200">
          {new Date(row.start_date).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "End Date",
      render: (row) => (
        <span className="text-gray-700 dark:text-gray-200">
          {new Date(row.end_date).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: "Reason",
      render: (row) => (
        <span className="max-w-xs truncate block text-gray-700 dark:text-gray-200">
          {row.reason || "-"}
        </span>
      ),
    },
    {
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Actions",
      render: (row) =>
        row.status === "pending" && (
          <ActionButtons
            onApprove={() => handleApproveLeave(row.id)}
            onReject={() =>
              setRejectModal({ type: "leave", id: row.id, reason: "" })
            }
            loading={actionLoading}
          />
        ),
    },
  ];

  const correctionColumns = [
    {
      header: "Employee",
      render: (row) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {row.users?.full_name || "N/A"}
        </div>
      ),
    },
    {
      header: "Date",
      render: (row) => (
        <span className="text-gray-700 dark:text-gray-200">
          {row.attendance_date ? new Date(row.attendance_date).toLocaleDateString() : "- -"}
        </span>
      ),
    },
    {
      header: "Type",
      render: (row) => (
        <span className="text-gray-700 dark:text-gray-200 capitalize">
          {row.missing_type ? row.missing_type.replace("_", " ") : "- -"}
        </span>
      ),
    },
    {
      header: "Original Time",
      render: (row) => (
        <span className="text-gray-700 dark:text-gray-200">
          {row.original_time || "- -"}
        </span>
      ),
    },
    {
      header: "Requested Time",
      render: (row) => (
        <span className="text-gray-700 dark:text-gray-200">
          {row.requested_time || "- -"}
        </span>
      ),
    },
    {
      header: "Reason",
      render: (row) => (
        <span className="max-w-xs truncate block text-gray-700 dark:text-gray-200">
          {row.reason || "- -"}
        </span>
      ),
    },
    {
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: "Actions",
      render: (row) =>
        row.status === "pending" && (
          <ActionButtons
            onApprove={() => handleApproveCorrection(row.id)}
            onReject={() =>
              setRejectModal({ type: "correction", id: row.id, reason: "" })
            }
            loading={actionLoading}
          />
        ),
    },
  ];

  const monthlyHoursColumns = [
    {
      header: "Employee",
      render: (row) => (
        <div className="font-medium text-gray-900 dark:text-white">
          {row.fullName}
        </div>
      ),
    },
    {
      header: "Total Hours",
      render: (row) => (
        <span className="font-semibold text-blue-600">
          {row.totalHours.toFixed(2)}h
        </span>
      ),
    },
    {
      header: "Days Present",
      render: (row) => (
        <span className="text-gray-700 dark:text-gray-200">
          {row.daysPresent || 0}
        </span>
      ),
    },
    {
      header: "Days Late",
      render: (row) => (
        <span className="text-orange-600 font-medium">
          {row.daysLate || 0}
        </span>
      ),
    },
    {
      header: "Days Absent",
      render: (row) => (
        <span className="text-red-600 font-medium">
          {row.daysAbsent || 0}
        </span>
      ),
    },
  ];

  // Report handlers
  const generateAttendanceReport = async () => {
    if (teamIds.length === 0) return toast.error("No team members");
    toast.loading("Generating attendance report...");
    try {
      const { data } = await supabase
        .from("attendance")
        .select("*, users:user_id(id, full_name, email)")
        .in("user_id", teamIds)
        .like("check_in_time", `${new Date().toISOString().slice(0, 7)}%`)
        .order("check_in_time", { ascending: false });
      if (!data || data.length === 0) {
        toast.error("No attendance data to export");
        return;
      }
      const userStats = {};
      data.forEach((a) => {
        if (!userStats[a.user_id])
          userStats[a.user_id] = {
            name: a.users?.full_name || "N/A",
            email: a.users?.email || "N/A",
            totalHours: 0,
            daysPresent: 0,
          };
        userStats[a.user_id].totalHours += a.hours_worked || 0;
        userStats[a.user_id].daysPresent += 1;
      });
      const csvContent =
        ["Employee Name,Email,Total Hours Worked,Days Present"].join(",") +
        "\n" +
        Object.values(userStats)
          .map(
            (u) =>
              `${u.name},${u.email},${u.totalHours.toFixed(2)},${u.daysPresent}`,
          )
          .join("\n");
      downloadCSV(
        csvContent,
        `attendance_summary_${new Date().toISOString().slice(0, 7)}.csv`,
      );
      toast.success("Attendance summary report downloaded!");
    } catch (error) {
      toast.error("Failed to generate attendance report");
    }
  };

  const generateLeaveReport = async () => {
    if (teamIds.length === 0) return toast.error("No team members");
    toast.loading("Generating leave report...");
    try {
      const { data } = await supabase
        .from("leave_requests")
        .select("*, users:user_id(id, full_name, email)")
        .in("user_id", teamIds)
        .order("created_at", { ascending: false });
      if (!data || data.length === 0) {
        toast.error("No leave data to export");
        return;
      }
      const csvContent =
        [
          "Employee Name,Email,Leave Type,Start Date,End Date,Reason,Status,Applied On",
        ].join(",") +
        "\n" +
        data
          .map(
            (l) =>
              `${l.users?.full_name || "N/A"},${l.users?.email || "N/A"},${
                l.leave_type || "N/A"
              },${new Date(l.start_date).toLocaleDateString()},${new Date(
                l.end_date,
              ).toLocaleDateString()},"${l.reason || ""}",${l.status},${new Date(
                l.created_at,
              ).toLocaleDateString()}`,
          )
          .join("\n");
      downloadCSV(
        csvContent,
        `leave_report_${new Date().toISOString().split("T")[0]}.csv`,
      );
      toast.success("Leave report downloaded!");
    } catch (error) {
      toast.error("Failed to generate leave report");
    }
  };

  const generateOvertimeReport = async () => {
    if (teamIds.length === 0) return toast.error("No team members");
    toast.loading("Generating overtime & late arrivals report...");
    try {
      const { data } = await supabase
        .from("attendance")
        .select("*, users:user_id(id, full_name, email)")
        .in("user_id", teamIds)
        .order("check_in_time", { ascending: false });
      if (!data || data.length === 0) {
        toast.error("No attendance data to export");
        return;
      }
      const workStartTime = 9 * 60;
      const reportData = data.map((a) => {
        const checkInTime = a.check_in_time ? new Date(a.check_in_time) : null;
        const hours = checkInTime
          ? checkInTime.getHours() + checkInTime.getMinutes() / 60
          : null;
        const isLate = hours !== null && hours > workStartTime / 60;
        return {
          ...a,
          isLate: isLate ? "Yes" : "No",
          lateBy: isLate
            ? `${(hours - workStartTime / 60).toFixed(2)} hours`
            : "0",
          overtime: a.hours_worked
            ? Math.max(0, a.hours_worked - 8).toFixed(2) + " hours"
            : "0",
        };
      });
      const csvContent =
        [
          "Employee Name,Email,Date,Check In,Is Late,Late By,Hours Worked,Overtime",
        ].join(",") +
        "\n" +
        reportData
          .map(
            (a) =>
              `${a.users?.full_name || "N/A"},${
                a.users?.email || "N/A"
              },${new Date(a.check_in_time).toLocaleDateString()},${
                a.check_in_time
                  ? new Date(a.check_in_time).toLocaleTimeString()
                  : "N/A"
              },${a.isLate},${a.lateBy},${a.hours_worked || 0},${a.overtime}`,
          )
          .join("\n");
      downloadCSV(
        csvContent,
        `overtime_late_report_${new Date().toISOString().split("T")[0]}.csv`,
      );
      toast.success("Overtime & late arrivals report downloaded!");
    } catch (error) {
      toast.error("Failed to generate overtime report");
    }
  };

  // Generate Monthly Hours Report
  const generateMonthlyHoursReport = () => {
    if (filteredMonthlyHours.length === 0) return toast.error("No data to export");
    
    const csvContent =
      ["Employee Name,Email,Total Hours,Days Present,Days Late,Days Absent"].join(",") +
      "\n" +
      filteredMonthlyHours
        .map(
          (emp) =>
            `${emp.fullName || "N/A"},${emp.email || "N/A"},${emp.totalHours},${emp.daysPresent},${emp.daysLate || 0},${emp.daysAbsent || 0}`
        )
        .join("\n");
    
    downloadCSV(
      csvContent,
      `monthly_hours_report_${filters.monthlyHoursStart}_to_${filters.monthlyHoursEnd}.csv`
    );
    toast.success("Monthly hours report downloaded!");
  };

  // Modal handlers
  const handleRejectConfirm = async () => {
    setActionLoading(true);
    const result =
      rejectModal.type === "leave"
        ? await handleRejectLeave(rejectModal.id, rejectModal.reason)
        : await handleRejectCorrection(rejectModal.id, rejectModal.reason);
    if (result?.error) toast.error(result.error);
    else
      toast.success(
        rejectModal.type === "leave"
          ? "Leave request rejected"
          : "Correction request rejected",
      );
    setRejectModal({ type: "", id: null, reason: "" });
    setActionLoading(false);
  };

  // Render content based on activeTab
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                Manager Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Welcome back,{" "}
                {userProfile?.full_name || user?.email || "Manager"}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                label="Team Size"
                value={stats.teamSize}
                color="blue"
                icon={UserGroupIcon}
                subtext="Total members"
              />
              <StatCard
                label="Present Today"
                value={stats.presentToday}
                color="green"
                icon={ChartBarIcon}
                subtext={`${
                  stats.teamSize > 0
                    ? Math.round((stats.presentToday / stats.teamSize) * 100)
                    : 0
                }% attendance`}
              />
              <StatCard
                label="Pending Leaves"
                value={stats.leaveRequests}
                color="orange"
                icon={CalendarDaysIcon}
                subtext="Awaiting approval"
              />
              <StatCard
                label="Pending Corrections"
                value={stats.pendingCorrections}
                color="purple"
                icon={ClockIcon}
                subtext="Attendance changes"
              />
            </div>
          </div>
        );

      case "attendance":
        return (
          <div className="space-y-6">
            <SectionHeader
              title="Team Attendance"
              subtitle="View and track daily attendance"
              action={
                <button
                  onClick={fetchManagerData}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  Refresh
                </button>
              }
            />
            <FilterCard title="Filters">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={filters.attendanceDate}
                    onChange={(e) => {
                      setFilters({
                        ...filters,
                        attendanceDate: e.target.value,
                      });
                      fetchAttendanceByDate(e.target.value);
                    }}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Search Employee
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={filters.attendanceEmployee}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          attendanceEmployee: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </FilterCard>
            <DataTable
              columns={attendanceColumns}
              data={filteredAttendance}
              emptyMessage="No attendance records found"
              loading={loading}
            />
          </div>
        );

      case "leave-requests":
        return (
          <div className="space-y-6">
            <SectionHeader
              title="Leave Requests"
              subtitle="Review and manage leave applications"
              action={
                <button
                  onClick={fetchManagerData}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  Refresh
                </button>
              }
            />
            <FilterCard title="Filters">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.leaveStatus}
                    onChange={(e) =>
                      setFilters({ ...filters, leaveStatus: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Search Employee
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={filters.leaveEmployee}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          leaveEmployee: e.target.value,
                        })
                      }
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </FilterCard>
            <DataTable
              columns={leaveColumns}
              data={filteredLeaveRequests}
              emptyMessage="No leave requests found"
              loading={loading}
            />
          </div>
        );

      case "corrections":
        return (
          <div className="space-y-6">
            <SectionHeader
              title="Attendance Corrections"
              subtitle="Review and approve attendance change requests"
              action={
                <button
                  onClick={fetchManagerData}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  Refresh
                </button>
              }
            />
            <DataTable
              columns={correctionColumns}
              data={corrections}
              emptyMessage="No correction requests found"
              loading={loading}
            />
          </div>
        );

      case "monthly-hours":
        return (
          <div className="space-y-6">
            <SectionHeader
              title="Monthly Hours"
              subtitle="Track working hours for the selected period"
              action={
                <div className="flex gap-2">
                  <button
                    onClick={generateMonthlyHoursReport}
                    className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    Download Report
                  </button>
                  <button
                    onClick={applyMonthlyHoursFilters}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <ArrowPathIcon className="w-5 h-5" />
                    Refresh
                  </button>
                </div>
              }
            />
            <FilterCard>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.monthlyHoursStart}
                    onChange={(e) => handleMonthlyHoursFilterChange("monthlyHoursStart", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.monthlyHoursEnd}
                    onChange={(e) => handleMonthlyHoursFilterChange("monthlyHoursEnd", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Search Employee
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={filters.monthlyHoursEmployee}
                      onChange={(e) => handleMonthlyHoursFilterChange("monthlyHoursEmployee", e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </FilterCard>
            <DataTable
              columns={monthlyHoursColumns}
              data={filteredMonthlyHours}
              emptyMessage="No data available for the selected period."
              loading={loading}
            />
          </div>
        );

      case "employee-directory":
        return (
          <div className="space-y-6">
            <SectionHeader
              title="Team Directory"
              subtitle={`${employees.length} team members`}
              action={
                <button
                  onClick={fetchManagerData}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  Refresh
                </button>
              }
            />
            <FilterCard>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={filters.attendanceEmployee}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      attendanceEmployee: e.target.value,
                    })
                  }
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </FilterCard>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-20">
                  <LoadingSpinner size="lg" />
                </div>
              ) : employees.length === 0 ? (
                <div className="col-span-full text-center py-20">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <UserGroupIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">
                    No team members found
                  </p>
                </div>
              ) : (
                employees
                  .filter(
                    (emp) =>
                      !filters.attendanceEmployee ||
                      emp.full_name
                        ?.toLowerCase()
                        .includes(filters.attendanceEmployee.toLowerCase()) ||
                      emp.email
                        ?.toLowerCase()
                        .includes(filters.attendanceEmployee.toLowerCase()),
                  )
                  .map((emp) => (
                    <div
                      key={emp.id}
                      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {emp.avatar_url ? (
                            <img
                              src={emp.avatar_url}
                              alt={emp.full_name}
                              className="w-14 h-14 rounded-2xl object-cover ring-2 ring-gray-100 dark:ring-gray-700"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-2 ring-gray-100 dark:ring-gray-700">
                              <span className="text-white font-bold text-lg">
                                {emp.full_name?.charAt(0).toUpperCase() || "?"}
                              </span>
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full ring-2 ring-white dark:ring-gray-800"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {emp.full_name || "N/A"}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {emp.email || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                            {emp.role || "Employee"}
                          </span>
                          {emp.department && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                              {emp.department}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          ID: {emp.id?.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        );

      case "announcements":
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            <Announcements />
          </Suspense>
        );

      default:
        return (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Coming soon...</p>
          </div>
        );
    }
  };

  const themeClasses = BACKGROUND_OPTIONS.find((t) => t.id === backgroundTheme)
    ?.classes || ["bg-white"];

  return (
    <div className={`${themeClasses.join(" ")} min-h-screen`}>
      <Header title="Manager Dashboard" />
      <div className="flex">
        <ManagerSidebar activeTab={activeTab} setActiveTab={setActiveTab} onOpenSettings={() => setShowSettings(true)} />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>
      <RejectionModal
        isOpen={rejectModal.type !== ""}
        title={
          rejectModal.type === "leave"
            ? "Reject Leave Request"
            : "Reject Correction Request"
        }
        reason={rejectModal.reason}
        onChange={(reason) => setRejectModal({ ...rejectModal, reason })}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectModal({ type: "", id: null, reason: "" })}
        loading={actionLoading}
      />
      {/* Settings Modal - rendered at top level for proper z-index */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default ManagerDashboard;
