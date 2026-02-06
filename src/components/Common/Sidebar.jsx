import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useBackgroundTheme } from "./Settings";
import toast from "react-hot-toast";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonIcon from "@mui/icons-material/Person";
import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const Sidebar = ({ activeTab, setActiveTab, tabs, onOpenSettings }) => {
  const navigate = useNavigate();
  const { user, userProfile, logout } = useAuthStore();
  const { backgroundTheme, changeTheme, BACKGROUND_OPTIONS } = useBackgroundTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const getThemeClasses = () => {
    const theme = BACKGROUND_OPTIONS.find((t) => t.id === backgroundTheme);
    return theme?.classes || ["bg-gray-100"];
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

  // Get current theme preview color
  const getThemePreviewColor = () => {
    const theme = BACKGROUND_OPTIONS.find((t) => t.id === backgroundTheme);
    return theme?.preview || "bg-gray-300";
  };

  return (
    <aside className="bg-gray-900 text-white p-2 h-screen flex flex-col sticky top-0 w-16">
      <div className="mb-4 flex justify-center">
        <p className="text-xs text-gray-400 mt-1 capitalize hidden">
          {userProfile?.role || "Employee"}
        </p>
      </div>

      <nav className="space-y-2 flex-1 overflow-y-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex justify-center items-center px-3 py-3 rounded-lg transition ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
            title={tab.label}
          >
            {tab.icon && <span>{tab.icon}</span>}
          </button>
        ))}
      </nav>

      {/* User Profile Section with Menu */}
      <div className="flex flex-col items-center gap-2 py-2 relative">
        <div
          className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
          onClick={() => {
            setShowUserMenu(!showUserMenu);
            setShowThemeMenu(false);
          }}
          title="User menu"
        >
          <UserCircleIcon className="w-8 h-8 text-gray-300" />
        </div>

        {/* User Dropdown Menu */}
        {(showUserMenu || showThemeMenu) && (
          <div
            className={`absolute bottom-full mb-2 left-0 w-56 rounded-lg shadow-xl border border-gray-200 py-1 z-[100] ${
              backgroundTheme === "dark"
                ? "bg-gray-800 border-gray-600"
                : getThemeClasses().join(" ")
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
              <p
                className={`text-xs truncate ${
                  backgroundTheme === "dark" ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {userProfile?.role || "Employee"}
              </p>
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
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
                  backgroundTheme === "dark"
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-white/50 hover:bg-white"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full ${getThemePreviewColor()}`}
                />
                <span
                  className={`text-sm ${
                    backgroundTheme === "dark" ? "text-white" : "text-gray-700"
                  }`}
                >
                  {
                    BACKGROUND_OPTIONS.find((t) => t.id === backgroundTheme)
                      ?.name
                  }
                </span>
              </button>

              {/* Theme Options */}
              {showThemeMenu && (
                <div className="mt-2 grid grid-cols-4 gap-1 p-1 bg-black/5 rounded-lg">
                  {BACKGROUND_OPTIONS.slice(0, 8).map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        changeTheme(theme.id);
                        setShowThemeMenu(false);
                      }}
                      className={`w-full aspect-square rounded-md overflow-hidden border-2 transition-all ${
                        backgroundTheme === theme.id
                          ? "border-blue-600"
                          : "border-transparent hover:border-gray-400"
                      }`}
                      title={theme.name}
                    >
                      <div className={`w-full h-full ${theme.preview}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Menu Items */}

            <div
              className={`border-t my-1 ${
                backgroundTheme === "dark"
                  ? "border-gray-600"
                  : "border-gray-200"
              }`}
            ></div>

            {/* Settings Button */}
            <button
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                backgroundTheme === "dark"
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => {
                setShowUserMenu(false);
                onOpenSettings?.();
              }}
            >
              <SettingsIcon fontSize="small" />
              Settings
            </button>

            <button
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                backgroundTheme === "dark"
                  ? "text-red-400 hover:bg-gray-700"
                  : "text-red-600 hover:bg-red-50"
              }`}
              onClick={() => {
                setShowUserMenu(false);
                handleLogout();
              }}
            >
              <LogoutIcon fontSize="small" />
              Logout
            </button>
          </div>
        )}

        {/* Click outside to close menu */}
        {(showUserMenu || showThemeMenu) && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setShowUserMenu(false);
              setShowThemeMenu(false);
            }}
          ></div>
        )}
      </div>

      {/* <div className="pt-4 border-t border-gray-700 mt-4">
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
        >
          <LogoutIcon fontSize="small" />
          Logout
        </button>
      </div> */}
    </aside>
  );
};

export default Sidebar;
