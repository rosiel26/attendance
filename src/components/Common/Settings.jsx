import React, { useState, useEffect } from "react";
import { supabase } from "../../config/supabase";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
import PaletteIcon from "@mui/icons-material/Palette";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

export const BACKGROUND_OPTIONS = [
  {
    id: "default",
    name: "Default",
    classes: ["bg-white"],
    preview: "bg-white",
  },
  {
    id: "blue",
    name: "Ocean Blue",
    classes: ["bg-gradient-to-br", "from-blue-100", "to-blue-200"],
    preview: "bg-blue-300",
  },
  {
    id: "sunset",
    name: "Sunset",
    classes: ["bg-gradient-to-br", "from-orange-100", "to-pink-200"],
    preview: "bg-orange-300",
  },
  {
    id: "dark",
    name: "Dark Mode",
    classes: ["bg-gray-900", "text-white", "dark-theme"],
    preview: "bg-gray-800",
  },
  {
    id: "forest",
    name: "Forest",
    classes: ["bg-gradient-to-br", "from-emerald-100", "to-teal-200"],
    preview: "bg-emerald-300",
  },
  {
    id: "lavender",
    name: "Lavender",
    classes: ["bg-gradient-to-br", "from-violet-100", "to-purple-200"],
    preview: "bg-violet-300",
  },
];

// Flatten all classes for removal
const ALL_THEME_CLASSES = BACKGROUND_OPTIONS.flatMap((t) => t.classes);

// Custom dark theme styles
const DARK_THEME_STYLES = `
  .dark-theme { color: white !important; }
  .dark-theme .card { background-color: #1f2937 !important; color: white !important; border-color: #374151 !important; }
  .dark-theme .text-gray-700, .dark-theme .text-gray-600, .dark-theme .text-gray-500 { color: #d1d5db !important; }
  .dark-theme .text-gray-900 { color: white !important; }
  .dark-theme .bg-white { background-color: #1f2937 !important; }
  .dark-theme input, .dark-theme select, .dark-theme textarea { 
    background-color: #374151 !important; 
    color: white !important; 
    border-color: #4b5563 !important;
  }
  .dark-theme table, .dark-theme th, .dark-theme td { border-color: #374151 !important; }
  .dark-theme button { color: white !important; }
`;

const removeAllThemeClasses = () => {
  ALL_THEME_CLASSES.forEach((cls) => {
    document.body.classList.remove(cls);
  });
  document.getElementById("root")?.classList.remove(...ALL_THEME_CLASSES);
  // Remove dark theme class and styles
  document.body.classList.remove("dark-theme");
  document.getElementById("root")?.classList.remove("dark-theme");
  const darkStyle = document.getElementById("dark-theme-styles");
  if (darkStyle) darkStyle.remove();
};

const addThemeClasses = (classes, isDark = false) => {
  classes.forEach((cls) => {
    document.body.classList.add(cls);
  });
  const root = document.getElementById("root");
  if (root) {
    classes.forEach((cls) => {
      root.classList.add(cls);
    });
  }
  // Add dark theme styles if dark mode
  if (isDark) {
    document.body.classList.add("dark-theme");
    if (root) root.classList.add("dark-theme");
    const style = document.createElement("style");
    style.id = "dark-theme-styles";
    style.textContent = DARK_THEME_STYLES;
    document.head.appendChild(style);
  }
};

export const applyTheme = (themeId) => {
  const theme = BACKGROUND_OPTIONS.find((t) => t.id === themeId);
  if (theme) {
    removeAllThemeClasses();
    addThemeClasses(theme.classes, themeId === "dark");
  }
};

// Context for background theme
const BackgroundThemeContext = React.createContext();

export const BackgroundThemeProvider = ({ children }) => {
  const { user, userProfile, setUserProfile } = useAuthStore();
  const [backgroundTheme, setBackgroundTheme] = useState("default");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      const dbTheme = userProfile?.background_theme;

      // First, apply the default theme to clear any existing classes
      applyTheme("default");

      // Then load the saved theme
      if (dbTheme && dbTheme !== "default") {
        console.log("Loading theme from database:", dbTheme);
        setBackgroundTheme(dbTheme);
        return; // The second useEffect will apply the theme
      }

      const saved = localStorage.getItem("backgroundTheme");
      if (saved && saved !== "default") {
        console.log("Loading theme from localStorage:", saved);
        setBackgroundTheme(saved);
      } else {
        // Already applied default above
        setBackgroundTheme("default");
      }
      setIsLoaded(true);
    };

    loadTheme();
  }, [userProfile]);

  // Apply theme when it changes
  useEffect(() => {
    // Only apply after initial load
    if (backgroundTheme) {
      console.log("Applying theme:", backgroundTheme);
      applyTheme(backgroundTheme);
    }
    if (backgroundTheme !== "default") {
      setIsLoaded(true);
    } else if (!isLoaded) {
      setIsLoaded(true);
    }
  }, [backgroundTheme]);

  const changeTheme = async (themeId) => {
    try {
      localStorage.setItem("backgroundTheme", themeId);
      setBackgroundTheme(themeId);

      if (user) {
        const { error } = await supabase
          .from("users")
          .update({ background_theme: themeId })
          .eq("id", user.id);

        if (error) {
          console.log("Database save failed:", error.message);
        } else {
          console.log("Theme saved to database:", themeId);
          if (userProfile) {
            setUserProfile({ ...userProfile, background_theme: themeId });
          }
        }
      }

      toast.success(
        `Theme changed to ${BACKGROUND_OPTIONS.find((o) => o.id === themeId)?.name}`,
      );
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  return (
    <BackgroundThemeContext.Provider
      value={{ backgroundTheme, changeTheme, BACKGROUND_OPTIONS }}
    >
      {children}
    </BackgroundThemeContext.Provider>
  );
};

export const useBackgroundTheme = () => {
  const context = React.useContext(BackgroundThemeContext);
  if (!context) {
    return {
      backgroundTheme: "default",
      changeTheme: () => {},
      BACKGROUND_OPTIONS,
    };
  }
  return context;
};

const Settings = ({ isOpen, onClose }) => {
  const { backgroundTheme, changeTheme, BACKGROUND_OPTIONS } = useBackgroundTheme();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  if (!isOpen) return null;

  const handleThemeChange = async (themeId) => {
    setLoading(true);
    try {
      await changeTheme(themeId);
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return "Password must be at least 8 characters long";
    }
    if (!hasUpperCase) {
      return "Password must contain at least one uppercase letter";
    }
    if (!hasLowerCase) {
      return "Password must contain at least one lowercase letter";
    }
    if (!hasNumbers) {
      return "Password must contain at least one number";
    }
    if (!hasSpecialChar) {
      return "Password must contain at least one special character (!@#$%^&*())";
    }
    return null;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    // Validate password complexity
    const validationError = validatePassword(newPassword);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    setLoading(true);

    try {
      // Note: Supabase's updateUser doesn't require current password verification
      // The user must be authenticated, which they are since they're in the app
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        // If error is about re-authentication required, try re-auth flow
        if (error.message.includes("re-authentication")) {
          // Try to re-authenticate with current password
          const { error: reauthError } = await supabase.auth.signInWithPassword({
            email: user?.email,
            password: currentPassword,
          });

          if (reauthError) {
            setPasswordError("Current password is incorrect");
            setLoading(false);
            return;
          }

          // Try update again after re-auth
          const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
          });

          if (updateError) {
            setPasswordError(updateError.message);
          } else {
            setPasswordSuccess(true);
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setTimeout(() => {
              setShowPasswordChange(false);
              setPasswordSuccess(false);
            }, 2000);
          }
        } else {
          setPasswordError(error.message);
        }
      } else {
        setPasswordSuccess(true);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => {
          setShowPasswordChange(false);
          setPasswordSuccess(false);
        }, 2000);
      }
    } catch (err) {
      setPasswordError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetPasswordForm = () => {
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordError("");
    setPasswordSuccess(false);
    setShowPasswordChange(false);
  };

  const isDark = backgroundTheme === "dark";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className={`relative rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden ${
        isDark ? "bg-gray-800" : "bg-white"
      }`}>
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? "border-gray-600" : "border-gray-200"
        }`}>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-500" />
            <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Settings</h2>
          </div>
          <button
            onClick={() => {
              onClose();
              resetPasswordForm();
            }}
            className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className={`p-4 ${isDark ? "text-gray-200" : "text-gray-700"}`}>
          {/* Password Change Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <LockIcon className="w-5 h-5 text-blue-500" />
              <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Change Password</h3>
            </div>

            {!showPasswordChange ? (
              <button
                onClick={() => setShowPasswordChange(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Change Password
              </button>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className={`input-field pr-10 ${
                        isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""
                      }`}
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {showPasswords.current ? <VisibilityOffIcon className="w-5 h-5" /> : <VisibilityIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}>
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className={`input-field pr-10 ${
                        isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""
                      }`}
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {showPasswords.new ? <VisibilityOffIcon className="w-5 h-5" /> : <VisibilityIcon className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    Min 8 characters, uppercase, lowercase, number, special character
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}>
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className={`input-field pr-10 ${
                        isDark ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""
                      }`}
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {showPasswords.confirm ? <VisibilityOffIcon className="w-5 h-5" /> : <VisibilityIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {passwordError && (
                  <div className={`p-3 rounded-lg text-sm ${
                    isDark ? "bg-red-900/30 border-red-800 text-red-400" : "bg-red-50 border-red-200 text-red-600"
                  }`}>
                    {passwordError}
                  </div>
                )}

                {/* Success Message */}
                {passwordSuccess && (
                  <div className={`p-3 rounded-lg text-sm ${
                    isDark ? "bg-green-900/30 border-green-800 text-green-400" : "bg-green-50 border-green-200 text-green-600"
                  }`}>
                    Password updated successfully!
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetPasswordForm}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
                      isDark
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Theme Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <PaletteIcon className="w-5 h-5 text-blue-500" />
              <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Dashboard Background</h3>
            </div>
            <p className={`text-sm mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Choose a background theme for your dashboard
            </p>

            <div className="grid grid-cols-4 gap-3">
              {BACKGROUND_OPTIONS.slice(0, 8).map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  disabled={loading}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    backgroundTheme === theme.id
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-200 dark:border-gray-600 hover:border-gray-400"
                  }`}
                  title={theme.name}
                >
                  <div className={`w-full h-full ${theme.preview} flex items-center justify-center ${
                    isDark && theme.id === "dark" ? "ring-1 ring-gray-500" : ""
                  }`}>
                    {backgroundTheme === theme.id && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full shadow" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className={`mt-4 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Selected:{" "}
              {BACKGROUND_OPTIONS.find((o) => o.id === backgroundTheme)?.name}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
