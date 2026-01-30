import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";
import { ClockIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, userProfile } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-blue-50 flex flex-col">
      {/* Blue Header */}
      <div className="bg-blue-950 text-white py-3 px-4 sm:py-4 sm:px-6 shadow-md flex items-center gap-2 sm:gap-4">
        <img
          src="/src/assets/rlb-logo.jpg"
          alt="AttendanceHub Logo"
          className="h-12 w-auto sm:h-16 md:h-20"
        />
        <div className="flex flex-col text-lg sm:text-xl md:text-2xl font-normal leading-tight text-gray-200">
          <span>Rider</span>
          <span>Levett</span>
          <span>Bucknall</span>
        </div>
      </div>

      <div
        className="flex-1 flex items-center justify-center px-4 sm:px-6 md:justify-end md:pr-12 lg:pr-24 bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: "url('/src/assets/rlb-overview.jpg')" }}
      >
        <div className="absolute left-0 w-full h-32 sm:h-40 md:h-52 bg-blue-950 top-1/2 -translate-y-1/2 z-0 opacity-90 flex flex-col justify-center px-4 sm:px-6">
          <div className="h-1 bg-red-600 w-20 sm:w-28 md:w-40 ml-4 sm:ml-20 md:ml-40 mb-2"></div>
          <span className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold px-4 sm:px-10 md:px-40">
            PHILIPPINES
          </span>
          <span className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl px-4 sm:px-10 md:px-40 font-thin">
            BOHOL
          </span>
        </div>
        <div className="bg-gray-100 rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-sm md:max-w-md relative z-10 mx-4">
          <div className="text-center mb-6 sm:mb-8">
            <ClockIcon className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 mx-auto" />
            <h1 className="text-2xl sm:text-3xl font-bold text-black">
              WorkPortal
            </h1>
            <p className="text-gray-800 text-xs sm:text-sm mt-2">
              Central Access for All Staff
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="label-text">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="youremail@rlb.com"
                required
              />
            </div>

            <div>
              <label className="label-text">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="text-left">
              <button
                type="button"
                onClick={() => setFormData({ email: "", password: "" })}
                className="bg-red-500 text-white hover:bg-red-300 hover:text-black font-semibold py-2 px-4 rounded transition text-sm sm:text-base"
              >
                Clear Entries
              </button>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-200 w-full sm:w-40 btn-primary disabled:opacity-50 hover:bg-blue-700"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
