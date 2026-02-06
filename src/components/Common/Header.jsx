import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";
import Notifications from "./Notifications";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

const Header = ({
  onLogout,
  showThemeMenu,
  setShowThemeMenu,
  changeTheme,
  title,
  onNavigate,
}) => {
  const navigate = useNavigate();
  const { userProfile } = useAuthStore();

  const handleLogout = async () => {
    try {
      await onLogout();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  return (
    <>
      <header className="shadow-lg relative z-10 h-24">
        <div className="flex justify-between items-center">
          {/* Left Section - Branding */}
          <div className="flex items-center gap-3 -ml-2 ">
            <div className="flex items-center gap-3 px-6 py-2">
              <img
                src="/src/assets/rlb-logo.jpg"
                alt="AttendanceHub Logo"
                className="h-12 w-auto sm:h-16 md:h-20"
              />

              <div className="flex flex-col text-lg sm:text-xl md:text-xl font-normal leading-tight text-gray-600">
                <span>Rider</span>
                <span>Levett</span>
                <span>Bucknall</span>
              </div>
            </div>
          </div>

          {/* Right Section - User Info */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Notifications className="text-black" onNavigate={onNavigate} />

            {/* Help Icon */}
            <QuestionMarkCircleIcon className="w-6 h-6 text-black mr-4" />
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
