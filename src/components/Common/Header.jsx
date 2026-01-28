import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";
import Notifications from "./Notifications";
import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  BriefcaseIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

const Header = ({ title, onNavigate }) => {
  const navigate = useNavigate();
  const { user, userProfile, logout } = useAuthStore();

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
    <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Left Section - Branding */}
          <div className="flex items-center gap-3 -ml-2">
            <div className="bg-white p-2 rounded-lg shadow-md">
              <BriefcaseIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="-ml-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                AttendanceHub
              </h1>
              {title && (
                <p className="text-blue-100 text-sm font-medium mt-0.5">
                  {title}
                </p>
              )}
            </div>
          </div>

          {/* Right Section - User Info */}
          <div className="flex items-center gap-4">
            {/* User Profile Card */}
            <div className="hidden md:flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
              <UserCircleIcon className="w-10 h-10 text-white" />
              <div className="text-left">
                <p className="font-semibold text-white text-sm">
                  {userProfile?.full_name || "User"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <EnvelopeIcon className="w-3 h-3 text-blue-200" />
                  <p className="text-xs text-blue-100">{user?.email}</p>
                </div>
                <span
                  className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(userProfile?.role)}`}
                >
                  {userProfile?.role?.toUpperCase() || "EMPLOYEE"}
                </span>
              </div>
            </div>

            {/* Mobile User Info */}
            <div className="md:hidden flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
              <UserCircleIcon className="w-8 h-8 text-white" />
              <div>
                <p className="font-semibold text-white text-sm">
                  {userProfile?.full_name?.split(" ")[0] || "User"}
                </p>
                <span
                  className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(userProfile?.role)}`}
                >
                  {userProfile?.role?.toUpperCase() || "EMPLOYEE"}
                </span>
              </div>
            </div>

            {/* Notifications */}
            <Notifications onNavigate={onNavigate} />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white hover:bg-gray-100 text-blue-600 font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
