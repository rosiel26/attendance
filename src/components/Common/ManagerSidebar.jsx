import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useBackgroundTheme } from "./Settings";
import Settings from "./Settings";
import toast from "react-hot-toast";
import {
  ChartBarIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  BellIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const ManagerSidebar = ({ activeTab, setActiveTab, onOpenSettings }) => {
  const navigate = useNavigate();
  const { user, userProfile, logout } = useAuthStore();
  const { backgroundTheme, changeTheme, BACKGROUND_OPTIONS } =
    useBackgroundTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Click outside handler to close user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = event.target.closest(".manager-sidebar");
      if (!sidebar && showUserMenu) {
        setShowUserMenu(false);
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: ChartBarIcon },
    { id: "attendance", label: "Attendance", icon: CalendarDaysIcon },
    { id: "leave-requests", label: "Leave", icon: ClipboardDocumentListIcon },
    { id: "announcements", label: "Announce", icon: BellIcon },
    { id: "corrections", label: "Corrections", icon: ClockIcon },
    { id: "employee-directory", label: "Team", icon: UserGroupIcon },
    { id: "monthly-hours", label: "Hours", icon: CurrencyDollarIcon },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "employee":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <aside className="manager-sidebar bg-gray-900 text-white h-[calc(100vh-64px)] flex flex-col w-16 flex-shrink-0">
      {/* Logo/Brand */}
      {/* <div className="mb-4 flex justify-center pt-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-sm">M</span>
        </div>
      </div> */}

      {/* Navigation Tabs - Left side with just icons */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex justify-center items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
              title={tab.label}
            >
              <tab.icon className="w-6 h-6" />
            </button>
          ))}
        </div>
      </nav>

      {/* User Profile Section with Theme and Logout Menu */}
      <div className="relative flex flex-col items-start gap-2 py-4 px-2 border-t border-gray-800">
        <div
          className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors relative"
          onClick={() => {
            setShowUserMenu(!showUserMenu);
          }}
          title="User menu"
        >
          {userProfile?.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt="Avatar"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <UserCircleIcon className="w-6 h-6 text-gray-300" />
          )}
        </div>

        {/* User Dropdown Menu with Theme and Logout */}
        {showUserMenu && (
          <div
            className={`absolute left-full ml-2 bottom-0 w-56 rounded-lg shadow-xl border border-gray-200 py-1 z-[100] ${
              backgroundTheme === "dark"
                ? "bg-gray-800 border-gray-600"
                : "bg-white"
            }`}
          >
            {/* User Info Header */}
            <div className="px-3 py-2 border-b border-gray-200/50">
              <p
                className={`font-semibold text-sm truncate ${
                  backgroundTheme === "dark" ? "text-white" : "text-gray-800"
                }`}
              >
                {userProfile?.full_name || "User"}
              </p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(userProfile?.role)}`}
              >
                {userProfile?.role || "Manager"}
              </span>
            </div>

            {/* Theme Selector */}
            <div className="px-3 py-2 border-b border-gray-200/50">
              <p
                className={`text-xs font-medium mb-2 ${
                  backgroundTheme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Theme
              </p>
              <div className="space-y-1">
                {BACKGROUND_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      changeTheme(option.id);
                      setShowUserMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-colors ${
                      backgroundTheme === option.id
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 ${option.preview} rounded-full border-2 ${
                        backgroundTheme === option.id
                          ? "border-blue-600"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    />
                    <span
                      className={
                        backgroundTheme === "dark"
                          ? "text-white"
                          : "text-gray-700"
                      }
                    >
                      {option.name || "Theme"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                handleLogout();
                setShowUserMenu(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Logout</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={() => {
                setShowUserMenu(false);
                onOpenSettings?.();
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 ${
                backgroundTheme === "dark"
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ManagerSidebar;
