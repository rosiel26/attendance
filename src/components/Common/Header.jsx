import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";
import Notifications from "./Notifications";
import Settings, { useBackgroundTheme } from "./Settings";
import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { QuestionMark } from "@mui/icons-material";

const Header = ({ title, onNavigate }) => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const [showSettings, setShowSettings] = useState(false);
  const { backgroundTheme } = useBackgroundTheme();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  return (
    <>
      <header className="shadow-lg">
        <div className="flex justify-between items-center ">
          {/* Left Section - Branding */}
          <div className="flex items-center gap-3 -ml-2">
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

            {/* <div className="-ml-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Workforce Management System
              </h1>
              {title && (
                <p className="text-blue-100 text-sm font-medium mt-0.5">
                  {title}
                </p>
              )}
            </div> */}
          </div>

          {/* Right Section - User Info */}
          <div className="flex items-center gap-2">
            {/* Logout Button */}

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-black hover:bg-white/10 rounded-lg transition"
              title="Settings"
            >
              <Cog6ToothIcon className="w-6 h-6" />
            </button>

            {/* Notifications */}
            <Notifications className="text-black" onNavigate={onNavigate} />
            <button
              onClick={handleLogout}
              className="p-2 text-black hover:bg-white/10 rounded-lg transition"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="w-6 h-6" />
            </button>

            <QuestionMarkCircleIcon className="w-6 h-6 text-black mr-4 " />
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
};

export default Header;
