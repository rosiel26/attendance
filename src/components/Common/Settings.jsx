import React, { useState, useEffect } from "react";
import { supabase } from "../../config/supabase";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
import PaletteIcon from "@mui/icons-material/Palette";

const BACKGROUND_OPTIONS = [
  {
    id: "default",
    name: "Default Gray",
    classes: ["bg-gray-100"],
    preview: "bg-gray-200",
  },
  {
    id: "blue",
    name: "Ocean Blue",
    classes: ["bg-gradient-to-br", "from-blue-100", "to-blue-200"],
    preview: "bg-blue-300",
  },
  {
    id: "green",
    name: "Nature Green",
    classes: ["bg-gradient-to-br", "from-green-100", "to-green-200"],
    preview: "bg-green-300",
  },
  {
    id: "purple",
    name: "Royal Purple",
    classes: ["bg-gradient-to-br", "from-purple-100", "to-purple-300"],
    preview: "bg-purple-400",
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

// Apply theme immediately
const applyTheme = (themeId) => {
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

      if (dbTheme && dbTheme !== "default") {
        console.log("Loading theme from database:", dbTheme);
        setBackgroundTheme(dbTheme);
        applyTheme(dbTheme);
        setIsLoaded(true);
        return;
      }

      const saved = localStorage.getItem("backgroundTheme");
      if (saved && saved !== "default") {
        console.log("Loading theme from localStorage:", saved);
        setBackgroundTheme(saved);
        applyTheme(saved);
      } else {
        applyTheme("default");
      }
      setIsLoaded(true);
    };

    loadTheme();
  }, [userProfile]);

  // Apply theme when it changes
  useEffect(() => {
    if (isLoaded) {
      console.log("Applying theme:", backgroundTheme);
      applyTheme(backgroundTheme);
    }
  }, [backgroundTheme, isLoaded]);

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
  const { backgroundTheme, changeTheme, BACKGROUND_OPTIONS } =
    useBackgroundTheme();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleThemeChange = async (themeId) => {
    setLoading(true);
    try {
      await changeTheme(themeId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <CloseIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <PaletteIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Dashboard Background</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Choose a background theme for your dashboard
            </p>

            <div className="grid grid-cols-4 gap-3">
              {BACKGROUND_OPTIONS.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  disabled={loading}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    backgroundTheme === theme.id
                      ? "border-blue-600 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                  title={theme.name}
                >
                  <div
                    className={`w-full h-full ${theme.preview} flex items-center justify-center`}
                  >
                    {backgroundTheme === theme.id && (
                      <div className="w-4 h-4 bg-blue-600 rounded-full shadow" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 text-sm font-medium text-gray-700">
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
