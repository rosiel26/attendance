import React, { useState, lazy, Suspense } from "react";
import Header from "../Common/Header";
import Sidebar from "../Common/Sidebar";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EditNoteIcon from "@mui/icons-material/EditNote";
import HistoryIcon from "@mui/icons-material/History";
import BuildIcon from "@mui/icons-material/Build";

const CheckInOut = lazy(() => import("../Attendance/CheckInOut"));
const AttendanceCalendar = lazy(
  () => import("../Attendance/AttendanceCalendar"),
);
const LeaveRequest = lazy(() => import("../Leave/LeaveRequest"));
const LeaveHistory = lazy(() => import("../Leave/LeaveHistory"));
const AttendanceCorrection = lazy(
  () => import("../Attendance/AttendanceCorrection"),
);

const TAB_CONFIG = [
  { id: "check-in", label: "Clock In/Out", icon: <AccessTimeIcon /> },
  { id: "calendar", label: "Attendance Calendar", icon: <CalendarTodayIcon /> },
  { id: "leave-request", label: "Request Leave", icon: <EditNoteIcon /> },
  { id: "leave-history", label: "Leave History", icon: <HistoryIcon /> },
  { id: "corrections", label: "Attendance Corrections", icon: <BuildIcon /> },
];

const COMPONENTS = {
  "check-in": CheckInOut,
  calendar: AttendanceCalendar,
  "leave-request": LeaveRequest,
  "leave-history": LeaveHistory,
  corrections: AttendanceCorrection,
};

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
);

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState(
    () => localStorage.getItem("employeeDashboardTab") || "check-in",
  );

  const handleTabChange = (tabId) => {
    localStorage.setItem("employeeDashboardTab", tabId);
    setActiveTab(tabId);
  };

  const handleNotificationNavigate = (type) => {
    if (type === "leave") setActiveTab("leave-history");
  };

  const ActiveComponent = COMPONENTS[activeTab] || CheckInOut;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header
        title="Employee Dashboard"
        onNavigate={handleNotificationNavigate}
      />
      <div className="flex flex-1">
        <aside className="w-full md:w-80 hidden md:block">
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
              <ActiveComponent />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
