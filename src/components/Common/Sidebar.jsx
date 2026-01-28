import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";
import LogoutIcon from "@mui/icons-material/Logout";

const Sidebar = ({ activeTab, setActiveTab, tabs }) => {
  const navigate = useNavigate();
  const { logout, userProfile } = useAuthStore();

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
    <aside className="bg-gray-900 text-white p-6 h-screen flex flex-col sticky top-0">
      <div className="mb-6 pb-4 border-b border-gray-700">
        <div className="text-center">
          <p className="text-lg font-bold text-blue-400">
            {userProfile?.full_name || "User"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {userProfile?.role || "employee"}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-2xl font-bold">Menu</h2>
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

      <div className="pt-4 border-t border-gray-700 mt-4">
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
        >
          <LogoutIcon fontSize="small" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
