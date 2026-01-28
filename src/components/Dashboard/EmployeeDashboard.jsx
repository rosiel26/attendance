import React, { useState } from "react";
import Header from "../Common/Header";
import Sidebar from "../Common/Sidebar";
import CheckInOut from "../Attendance/CheckInOut";
import AttendanceCalendar from "../Attendance/AttendanceCalendar";
import LeaveRequest from "../Leave/LeaveRequest";
import LeaveHistory from "../Leave/LeaveHistory";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EditNoteIcon from "@mui/icons-material/EditNote";
import HistoryIcon from "@mui/icons-material/History";

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState(() => {
    // Load saved tab from localStorage, default to 'check-in'
    return localStorage.getItem("employeeDashboardTab") || "check-in";
  });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    localStorage.setItem("employeeDashboardTab", tabId);
  };

  const handleNotificationNavigate = (type, notification) => {
    if (type === "leave") {
      setActiveTab("leave-history");
    }
  };

  const tabs = [
    { id: "check-in", label: "Clock In/Out", icon: <AccessTimeIcon /> },
    {
      id: "calendar",
      label: "Attendance Calendar",
      icon: <CalendarTodayIcon />,
    },
    { id: "leave-request", label: "Request Leave", icon: <EditNoteIcon /> },
    { id: "leave-history", label: "Leave History", icon: <HistoryIcon /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "check-in":
        return <CheckInOut />;
      case "calendar":
        return <AttendanceCalendar />;
      case "leave-request":
        return <LeaveRequest />;
      case "leave-history":
        return <LeaveHistory />;
      default:
        return <CheckInOut />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header
        title="Employee Dashboard"
        onNavigate={handleNotificationNavigate}
      />
      <div className="flex flex-1">
        <div className="w-full md:w-80 hidden md:block">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            tabs={tabs}
          />
        </div>
        <main className="flex-1 p-4 md:p-8 flex justify-center">
          <div className="w-full max-w-7xl">
            {/* Mobile Sidebar */}
            <div className="md:hidden mb-6">
              <Sidebar
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                tabs={tabs}
              />
            </div>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
