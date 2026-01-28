import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, userProfile } = useAuthStore();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    // This effect runs when the component mounts and whenever userProfile changes.
    // If a user is already logged in, it redirects them to their dashboard.
    if (userProfile) {
      const userRole = userProfile.role || "employee";
      navigate(`/${userRole}`, { replace: true });
    }
  }, [userProfile, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission
    try {
      await login(formData.email, formData.password);
      toast.success("Login successful!");
      // The useEffect hook will now handle the redirection once the userProfile is updated in the state.
    } catch (error) {
      toast.error(error.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">
            AttendanceHub
          </h1>
          <p className="text-gray-600 text-sm mt-2">
            Employee Attendance Management System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label-text">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="your.email@company.com"
              required
            />
          </div>

          <div>
            <label className="label-text">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Register Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-gray-600 mb-4">
            Don't have an account?
          </p>
          <button
            onClick={() => navigate("/register")}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded transition"
          >
            Create Account (Register)
          </button>
        </div>

        {/* Back to Portal */}
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/login-portal")}
            className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
          >
            ← Back to Portal
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
