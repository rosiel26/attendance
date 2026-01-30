import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";
import LogoutIcon from "@mui/icons-material/Logout";
import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const Sidebar = ({ activeTab, setActiveTab, tabs }) => {
  const navigate = useNavigate();
  const { user, userProfile, logout } = useAuthStore();

  // const handleLogout = async () => {
  //   try {
  //     await logout();
  //     toast.success("Logged out successfully");
  //     navigate("/");
  //   } catch (error) {
  //     toast.error("Logout failed");
  //   }
  // };
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
    <aside className="bg-gray-900 text-white p-2 h-screen flex flex-col sticky top-0">
      <div className="mb-4">
        <p className="text-xs text-gray-400 mt-1 capitalize">
          {userProfile?.role || "Employee"}
        </p>
      </div>

      <nav className="space-y-2 flex-1 overflow-y-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full text-left px-4 py-3 rounded-lg transition ${
              activeTab === tab.id
                ? "bg-blue-600 text-white font-semibold"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            {tab.icon && <span className="inline-block mr-3">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </nav>

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
            className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(
              userProfile?.role,
            )}`}
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
            className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeColor(
              userProfile?.role,
            )}`}
          >
            {userProfile?.role?.toUpperCase() || "EMPLOYEE"}
          </span>
        </div>
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
