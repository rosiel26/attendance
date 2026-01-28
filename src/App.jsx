import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./hooks/useAuth";
import { useAuthStore } from "./stores/authStore";

import LoginPortal from "./components/Auth/LoginPortal";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import EmployeeDashboard from "./components/Dashboard/EmployeeDashboard";
import ManagerDashboard from "./components/Dashboard/ManagerDashboard";
import AdminDashboard from "./components/Dashboard/AdminDashboard";
import CalendarPage from "./components/Calendar/CalendarPage";

import "./styles/index.css";

// Smart redirect based on user role
const RoleBasedRedirect = () => {
  const { userProfile } = useAuthStore();

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  const role = userProfile.role || "employee";

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  } else if (role === "manager") {
    return <Navigate to="/manager" replace />;
  } else {
    return <Navigate to="/employee" replace />;
  }
};

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login-portal" element={<LoginPortal />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/employee"
            element={
              <ProtectedRoute>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager"
            element={
              <ProtectedRoute>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
