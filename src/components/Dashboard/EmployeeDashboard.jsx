import React, { useState, useEffect, lazy, Suspense } from "react";
import Header from "../Common/Header";
import Sidebar from "../Common/Sidebar";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EditNoteIcon from "@mui/icons-material/EditNote";
import HistoryIcon from "@mui/icons-material/History";
import BuildIcon from "@mui/icons-material/Build";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ClockIcon from "@mui/icons-material/AccessTime";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useAuthStore } from "../../stores/authStore";
import { supabase } from "../../config/supabase";
import { checkIn, checkOut } from "../../services/supabaseService";
import toast from "react-hot-toast";
import { RefreshCcw } from "lucide-react";
import { Timer, Timer10 } from "@mui/icons-material";

const AttendanceCalendar = lazy(
  () => import("../Attendance/AttendanceCalendar"),
);
const LeaveRequest = lazy(() => import("../Leave/LeaveRequest"));
const LeaveHistory = lazy(() => import("../Leave/LeaveHistory"));
const AttendanceCorrection = lazy(
  () => import("../Attendance/AttendanceCorrection"),
);
const Announcements = lazy(() => import("../Leave/Announcements"));

const TAB_CONFIG = [
  { id: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { id: "calendar", label: "Attendance Calendar", icon: <CalendarTodayIcon /> },
  { id: "announcements", label: "Announcements", icon: <NotificationsIcon /> },
  { id: "leave-request", label: "Request Leave", icon: <EditNoteIcon /> },
  { id: "leave-history", label: "Leave History", icon: <HistoryIcon /> },
  { id: "corrections", label: "Attendance Corrections", icon: <BuildIcon /> },
];

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
);

// Dashboard Component
const Dashboard = () => {
  const { user, userProfile } = useAuthStore();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [weeklyAttendance, setWeeklyAttendance] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [creatorRoles, setCreatorRoles] = useState({});
  const [expandedAnnouncement, setExpandedAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayStatus, setTodayStatus] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.id) {
      if (userProfile) {
        fetchDashboardData();
      } else {
        const loadProfile = async () => {
          const { data: profileData } = await supabase
            .from("users")
            .select("*")
            .eq("id", user.id)
            .single();
          if (profileData) {
            useAuthStore.getState().setUserProfile(profileData);
            fetchDashboardData();
          }
        };
        loadProfile();
      }
    }
  }, [user?.id, userProfile]);

  const fetchDashboardData = async () => {
    try {
      // Use both UTC and local date to handle timezone edge cases
      const utcDate = new Date().toISOString().split("T")[0];
      const localDate = new Date().toLocaleString("en-CA"); // YYYY-MM-DD in local timezone

      const utcStart = utcDate + "T00:00:00.000Z";
      const utcEnd = utcDate + "T23:59:59.999Z";

      const localStart = localDate + "T00:00:00";
      const localEnd = localDate + "T23:59:59";

      // Calculate week start (Monday) using local date
      const today = new Date();
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      const weekStartUtc = monday.toISOString().split("T")[0];
      const weekStartLocal = monday.toLocaleString("en-CA");

      // Query today's attendance (try UTC first, then local)
      let todayData = null;
      let todayError = null;

      const utcResult = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", user.id)
        .gte("check_in_time", utcStart)
        .lte("check_in_time", utcEnd)
        .order("check_in_time", { ascending: false })
        .limit(1)
        .single();

      if (utcResult.error && utcResult.error.code !== "PGRST116") {
        // Try local date query
        const localResult = await supabase
          .from("attendance")
          .select("*")
          .eq("user_id", user.id)
          .gte("check_in_time", localStart)
          .lte("check_in_time", localEnd)
          .order("check_in_time", { ascending: false })
          .limit(1)
          .single();

        if (localResult.error && localResult.error.code !== "PGRST116") {
          todayError = localResult.error;
        } else {
          todayData = localResult.data;
        }
      } else {
        todayData = utcResult.data;
      }

      if (todayError && todayError.code !== "PGRST116") {
        throw todayError;
      }
      setTodayAttendance(todayData || null);

      // Query weekly attendance (try UTC first, then local)
      let weekData = null;
      let weekError = null;

      const weekUtcResult = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", user.id)
        .gte("check_in_time", weekStartUtc + "T00:00:00.000Z")
        .lte("check_in_time", utcEnd)
        .order("check_in_time", { ascending: false });

      if (weekUtcResult.error && weekUtcResult.error.code !== "PGRST116") {
        // Try local date query
        const weekLocalResult = await supabase
          .from("attendance")
          .select("*")
          .eq("user_id", user.id)
          .gte("check_in_time", weekStartLocal + "T00:00:00")
          .lte("check_in_time", localEnd)
          .order("check_in_time", { ascending: false });

        if (
          weekLocalResult.error &&
          weekLocalResult.error.code !== "PGRST116"
        ) {
          weekError = weekLocalResult.error;
        } else {
          weekData = weekLocalResult.data;
        }
      } else {
        weekData = weekUtcResult.data;
      }

      if (weekError && weekError.code !== "PGRST116") {
        throw weekError;
      }
      setWeeklyAttendance(weekData || []);

      // Fetch today's attendance status for the quick action container
      const todayStatusData = todayData;
      setTodayStatus(todayStatusData);

      let announcementQuery = supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (userProfile?.role === "employee") {
        const managerId = userProfile?.manager_id;
        if (managerId) {
          announcementQuery = announcementQuery.or(
            `target_role.eq.all,manager_id.eq.${managerId}`,
          );
        } else {
          announcementQuery = announcementQuery.eq("target_role", "all");
        }
      } else {
        announcementQuery = announcementQuery.eq("target_role", "all");
      }

      const { data: announcementData, error: announcementError } =
        await announcementQuery;

      if (announcementError && announcementError.code !== "PGRST116") {
        throw announcementError;
      }

      const now = new Date();
      const validAnnouncements = (announcementData || []).filter((a) => {
        if (!a.expires_at) return true;
        return new Date(a.expires_at) > now;
      });

      setAnnouncements(validAnnouncements);

      const creatorIds = [
        ...new Set(validAnnouncements.map((a) => a.created_by)),
      ];
      if (creatorIds.length > 0) {
        const { data: creators } = await supabase
          .from("users")
          .select("id, full_name, role")
          .in("id", creatorIds);

        const roleMap = {};
        creators?.forEach((c) => {
          roleMap[c.id] = c;
        });
        setCreatorRoles(roleMap);
      }

      const { data: notificationData, error: notificationError } =
        await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

      if (notificationError && notificationError.code !== "PGRST116") {
        console.error("Error fetching notifications:", notificationError);
      }

      const notificationActivities = (notificationData || []).map((notif) => {
        let type = "announcement";
        let priority = "normal";
        let displayTitle = notif.message.split(":")[0] || "Notification";

        if (notif.type === "leave") {
          type = "leave";
          priority = "low";
          if (notif.message.toLowerCase().includes("approved")) {
            displayTitle = "Leave Approved";
          } else if (notif.message.toLowerCase().includes("rejected")) {
            displayTitle = "Leave Rejected";
          } else {
            displayTitle = "Leave Update";
          }
        } else if (notif.type === "correction") {
          type = "correction";
        }

        return {
          id: `notif-${notif.id}`,
          type,
          title: displayTitle,
          content: notif.message,
          created_at: notif.created_at,
          priority,
        };
      });

      const allActivities = [
        ...notificationActivities,
        ...validAnnouncements.map((a) => ({ ...a, type: "announcement" })),
      ]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      setRecentActivities(allActivities);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateHoursWorked = (attendance) => {
    if (!attendance || !attendance.duration_hours) return "--:--";
    const hours = Math.floor(attendance.duration_hours);
    const minutes = Math.round((attendance.duration_hours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return "--:--";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "--";
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const timeAgo = (dateString) => {
    if (!dateString) return "";
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffSeconds < 60) return "Just now";
    if (diffMinutes < 60)
      return `${diffMinutes} min${diffMinutes > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffWeeks < 4)
      return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case "high":
        return {
          border: "border-l-4 border-red-500",
          badge: "bg-red-100 text-red-800",
          dot: "bg-red-500",
        };
      case "low":
        return {
          border: "border-l-4 border-gray-400",
          badge: "bg-gray-100 text-gray-800",
          dot: "bg-gray-400",
        };
      default:
        return {
          border: "border-l-4 border-blue-500",
          badge: "bg-blue-100 text-blue-800",
          dot: "bg-blue-500",
        };
    }
  };

  const handleQuickCheckIn = async () => {
    setAttendanceLoading(true);
    try {
      const result = await checkIn(user.id);

      if (result.error) throw result.error;

      toast.success("✓ Checked in successfully!");
      // Refresh dashboard data
      await fetchDashboardData();
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error(error.message || "Failed to check in");

      // If already checked in, refresh status
      if (error.message?.includes("already checked")) {
        await fetchDashboardData();
      }
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleQuickCheckOut = async () => {
    setAttendanceLoading(true);
    try {
      const result = await checkOut(user.id);

      if (result.error) throw result.error;

      toast.success("✓ Checked out successfully!");
      // Refresh dashboard data
      await fetchDashboardData();
    } catch (error) {
      console.error("Check-out error:", error);
      toast.error(error.message || "Failed to check out");
      // Refresh status on error
      await fetchDashboardData();
    } finally {
      setAttendanceLoading(false);
    }
  };

  const getTodayStatus = () => {
    if (!todayStatus)
      return { status: "absent", text: "Absent", color: "text-gray-500" };
    if (todayStatus.check_out_time)
      return { status: "present", text: "Present", color: "text-green-600" };
    if (todayStatus.check_in_time)
      return {
        status: "checked-in",
        text: "Checked In",
        color: "text-blue-600",
      };
    return { status: "absent", text: "Absent", color: "text-gray-500" };
  };

  const toggleAnnouncement = (id) => {
    setExpandedAnnouncement(expandedAnnouncement === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left side */}
        <div>
          <h2 className="text-2xl lg:text-xl font-bold text-blue-950">
            {getGreeting()},{" "}
            <span className="text-blue-900">
              {userProfile?.full_name?.split(" ")[0] || "Employee"}
            </span>
            !
          </h2>
        </div>

        {/* Right side */}
        <div className="text-left lg:text-right">
          <p className="text-black-200 text-sm">Current Time</p>
          <p className="text-md font-medium flex items-center justify-end gap-2 text-blue-950">
            {currentTime.toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </p>

          {/* <p className="text-black text-sm mt-1">{getFormattedDate()}</p> */}
        </div>
      </div>

      {/* Welcome Section with Attendance Status and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left side: Today's Attendance Status */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-full">
            <div className="flex flex-col h-full">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">Today</h3>
                  <span
                    className={`text-sm font-medium px-2 py-1 rounded-full ${getTodayStatus().color === "text-green-600" ? "bg-green-100 text-green-800" : getTodayStatus().color === "text-blue-600" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {getTodayStatus().text}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {getTodayStatus().status === "absent" && (
                    <p className="text-orange-600 font-medium">
                      You have not marked your attendance today!
                    </p>
                  )}
                  {getTodayStatus().status === "present" && (
                    <p className="text-green-600 font-medium">
                      Your attendance has been marked today.
                    </p>
                  )}
                  {getTodayStatus().status === "checked-in" && (
                    <p className="text-blue-600 font-medium">
                      You have successfully checked in!
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                {getTodayStatus().status === "checked-in" ? (
                  <button
                    onClick={handleQuickCheckOut}
                    disabled={attendanceLoading}
                    className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {attendanceLoading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <AccessTimeIcon className="w-4 h-4" />
                        Check Out
                      </>
                    )}
                  </button>
                ) : getTodayStatus().status === "absent" ? (
                  <button
                    onClick={handleQuickCheckIn}
                    disabled={attendanceLoading}
                    className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {attendanceLoading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <AccessTimeIcon className="w-4 h-4" />
                        Check In
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-full px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium text-center">
                    Completed for Today
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Stats Cards */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3 border-2 rounded-xl px-4 py-3 shadow-sm">
              {/* Icon */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100">
                <ClockIcon className="w-5 h-5 text-yellow-600" />
              </div>

              {/* Text */}
              <div className="text-left">
                <p className="text-lg font-bold text-gray-900">
                  {formatTime(todayAttendance?.check_in_time) || "--:--"}
                </p>
                <p className="text-xs text-gray-500">Clock In Today</p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-2 rounded-xl px-4 py-3 shadow-sm">
              {/* Icon */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                <RefreshCcw className="w-5 h-5 text-green-600" />
              </div>

              {/* Text */}
              <div className="text-left">
                <p className="text-lg font-bold text-gray-900">
                  {formatTime(todayAttendance?.check_out_time)}
                </p>
                <p className="text-xs text-gray-500">Clock Out Today</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm">
              {/* Icon */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                <Timer className="w-5 h-5 text-blue-600" />
              </div>

              {/* Text */}
              <div className="text-left">
                <p className="text-lg font-bold text-gray-900">
                  {(() => {
                    const totalHours = weeklyAttendance.reduce((acc, att) => {
                      return acc + (att.duration_hours || 0);
                    }, 0);
                    const hours = Math.floor(totalHours);
                    const minutes = Math.round((totalHours - hours) * 60);
                    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
                  })()}
                </p>
                <p className="text-xs text-gray-500">Hours This Week</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Attendance Table - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-md font-bold text-gray-900">
              Weekly Attendance Board
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Clock In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Clock Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Work Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Loading...
                    </td>
                  </tr>
                ) : weeklyAttendance.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No attendance records for this week
                    </td>
                  </tr>
                ) : (
                  weeklyAttendance.map((attendance) => (
                    <tr key={attendance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {formatDate(attendance.check_in_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {formatTime(attendance.check_in_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {formatTime(attendance.check_out_time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                        {calculateHoursWorked(attendance)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            !attendance
                              ? "bg-gray-100 text-gray-800"
                              : attendance.check_out_time
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {!attendance
                            ? "Absent"
                            : attendance.check_out_time
                              ? "Present"
                              : "In Progress"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities - Takes 1 column */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <NotificationsIcon className="w-5 h-5 text-blue-600 text-md " />
              Recent Activities
            </h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : recentActivities.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No recent activities
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentActivities.map((item) => {
                  const styles = getPriorityStyles(item.priority);
                  const isExpanded = expandedAnnouncement === item.id;
                  const creator =
                    item.type === "announcement"
                      ? creatorRoles[item.created_by]
                      : null;

                  const truncateContent = (text, maxLength = 60) => {
                    if (!text) return "";
                    if (text.length <= maxLength) return text;
                    return text.substring(0, maxLength) + "...";
                  };

                  const getTypeIcon = () => {
                    if (item.type === "leave") {
                      if (item.title.includes("Approved")) {
                        return {
                          dot: "bg-green-500",
                          badge: "bg-green-100 text-green-800",
                        };
                      } else {
                        return {
                          dot: "bg-red-500",
                          badge: "bg-red-100 text-red-800",
                        };
                      }
                    }
                    if (item.type === "correction") {
                      return {
                        dot: "bg-purple-500",
                        badge: "bg-purple-100 text-purple-800",
                      };
                    }
                    return { dot: styles.dot, badge: styles.badge };
                  };

                  const typeStyles = getTypeIcon();

                  return (
                    <div
                      key={item.id}
                      className={
                        item.type === "announcement" ? styles.border : ""
                      }
                    >
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition"
                        onClick={() =>
                          item.type === "announcement" &&
                          toggleAnnouncement(item.id)
                        }
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${typeStyles.dot} mt-1.5 flex-shrink-0`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {item.type === "announcement"
                                ? item.title
                                : item.type === "leave"
                                  ? item.title
                                  : "Correction"}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {truncateContent(item.content, 50)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {timeAgo(item.created_at)}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${typeStyles.badge} flex-shrink-0 ml-2`}
                          >
                            {item.type === "announcement"
                              ? item.priority === "high"
                                ? "HIGH"
                                : item.priority === "low"
                                  ? "LOW"
                                  : "Normal"
                              : item.type === "leave"
                                ? item.title.includes("Approved")
                                  ? "APPROVED"
                                  : item.title.includes("Rejected")
                                    ? "REJECTED"
                                    : "STATUS"
                                : "CORRECTION"}
                          </span>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 ml-6 pt-3 border-t border-gray-100">
                            {item.type === "announcement" && (
                              <p className="text-xs text-gray-500 mb-2">
                                From:{" "}
                                <span className="font-medium text-gray-700">
                                  {creator?.full_name || "Unknown"}
                                </span>
                              </p>
                            )}
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {item.content}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("employeeDashboardTab") || "dashboard",
  );

  const handleTabChange = (tabId) => {
    localStorage.setItem("employeeDashboardTab", tabId);
    setActiveTab(tabId);
  };

  const handleNotificationNavigate = (type) => {
    if (type === "leave") setActiveTab("leave-history");
    if (type === "announcement") setActiveTab("announcements");
  };

  const renderComponent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "calendar":
        return <AttendanceCalendar />;
      case "announcements":
        return <Announcements />;
      case "leave-request":
        return <LeaveRequest />;
      case "leave-history":
        return <LeaveHistory />;
      case "corrections":
        return <AttendanceCorrection />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Employee Dashboard"
        onNavigate={handleNotificationNavigate}
      />
      <div className="flex flex-1">
        <aside className="w-full md:w-80 hidden md:block text-sm ">
          <Sidebar
            tabs={TAB_CONFIG}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
          />
        </aside>
        <main className="flex-1 p-4 md:p-8 flex justify-center">
          <div className="w-full max-w-7xl">
            <div className="md:hidden mb-6">
              <Sidebar
                tabs={TAB_CONFIG}
                activeTab={activeTab}
                setActiveTab={handleTabChange}
              />
            </div>
            <Suspense fallback={<LoadingFallback />}>
              {renderComponent()}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
