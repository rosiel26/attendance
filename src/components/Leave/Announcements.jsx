import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../config/supabase";
import { useAuthStore } from "../../stores/authStore";
import { useBackgroundTheme } from "../Common/Settings";
import toast from "react-hot-toast";
import { createNotification } from "../../services/supabaseService";
import {
  BellIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  TrashIcon,
  PlusIcon,
  CalendarIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";

// Modal component
const Modal = ({ isOpen, onClose, title, children, size = "md", isDark }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div
        className={`${
          isDark ? "bg-gray-800 border border-gray-700" : "bg-white"
        } rounded-xl w-full ${sizeClasses[size]} shadow-2xl`}
      >
        <div
          className={`flex justify-between items-center p-4 border-b ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <h3
            className={`text-lg font-bold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className={`${
              isDark
                ? "text-gray-400 hover:text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

const Announcements = () => {
  const { user, userProfile, loading: authLoading } = useAuthStore();
  const { backgroundTheme } = useBackgroundTheme();
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [creatorRoles, setCreatorRoles] = useState({});
  const [filter, setFilter] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "normal",
    expires_at: "",
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const profileLoadedRef = useRef(false);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    id: null,
    title: "",
  });

  // Fetch user profile if not available
  useEffect(() => {
    const loadProfile = async () => {
      if (profileLoadedRef.current || !user?.id) return;

      const shouldFetch = !userProfile || !userProfile.manager_id;

      if (shouldFetch) {
        const { data: profileData } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profileData) {
          useAuthStore.getState().setUserProfile(profileData);
        }
      }

      profileLoadedRef.current = true;
    };
    loadProfile();
  }, [user?.id, userProfile]);

  const fetchAnnouncements = useCallback(async () => {
    if (!userProfile) return;

    try {
      setLoading(true);
      let query = supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (userProfile?.role === "employee") {
        const managerId = userProfile?.manager_id;
        // Show announcements where:
        // 1. target_role = 'all' (for everyone)
        // 2. target_role = 'team' AND manager_id = employee's manager (for team members only)
        if (managerId) {
          query = query.or(`target_role.eq.all,and(target_role.eq.team,manager_id.eq.${managerId})`);
        } else {
          query = query.eq("target_role", "all");
        }
      } else if (userProfile?.role === "manager") {
        // Managers see all announcements or their own team announcements
        query = query.or(`target_role.eq.all,target_role.eq.team,manager_id.eq.${user.id},created_by.eq.${user.id}`);
      }
      // Admins see all announcements (no filter needed)

      const { data, error } = await query;

      if (error) throw error;

      // Filter out expired announcements
      const now = new Date();
      const validAnnouncements = data.filter((a) => {
        if (!a.expires_at) return true;
        return new Date(a.expires_at) > now;
      });

      // Fetch creator info
      const creatorIds = [
        ...new Set(validAnnouncements.map((a) => a.created_by)),
      ];
      const { data: creators } = await supabase
        .from("users")
        .select("id, full_name, role")
        .in("id", creatorIds);

      const roleMap = {};
      creators?.forEach((c) => {
        roleMap[c.id] = c;
      });
      setCreatorRoles(roleMap);

      setAnnouncements(validAnnouncements || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, [userProfile, user?.id]);

  const filterAnnouncements = useCallback(() => {
    if (filter === "all") {
      setFilteredAnnouncements(announcements);
    } else {
      setFilteredAnnouncements(
        announcements.filter((a) => {
          const creator = creatorRoles[a.created_by];
          return creator?.role === filter;
        }),
      );
    }
  }, [announcements, filter, creatorRoles]);

  useEffect(() => {
    if (authLoading || !profileLoadedRef.current || !userProfile) return;

    fetchAnnouncements();
    console.log("User profile role:", userProfile?.role);
    if (userProfile?.role === "admin" || userProfile?.role === "manager") {
      setIsAdmin(true);
      console.log("Admin/Manager detected, enabling announcement controls");
    } else {
      console.log("Not admin/manager, announcement controls disabled");
    }
  }, [authLoading, userProfile, fetchAnnouncements]);

  useEffect(() => {
    if (announcements.length > 0) {
      filterAnnouncements();
    }
  }, [announcements, filter, filterAnnouncements]);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    console.log("Creating announcement with data:", {
      title: formData.title,
      content: formData.content,
      priority: formData.priority,
      expires_at: formData.expires_at || null,
      created_by: user.id,
      target_role: userProfile?.role === "admin" ? "all" : "team",
      manager_id: userProfile?.role === "manager" ? user.id : (user.id || null),
    });
    
    try {
      setLoading(true);

      // Insert without select to avoid .single() issues
      // For admin, use current user as manager_id if available
      const insertData = {
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        expires_at: formData.expires_at || null,
        target_role: userProfile?.role === "admin" ? "all" : "team",
      };

      // Add created_by if user.id exists
      if (user.id) {
        insertData.created_by = user.id;
      }

      // For manager/admin, use their user.id as manager_id
      if (userProfile?.role === "manager" || userProfile?.role === "admin") {
        insertData.manager_id = user.id;
      } else {
        // For employees, use their assigned manager
        insertData.manager_id = userProfile?.manager_id || null;
      }

      console.log("Inserting announcement:", insertData);

      const { error } = await supabase
        .from("announcements")
        .insert([insertData]);

      if (error) {
        console.error("Supabase insert error:", error);
        toast.error("Failed to create announcement: " + error.message);
        return;
      }

      console.log("Announcement created successfully!");
      toast.success("Announcement created!");
      setFormData({
        title: "",
        content: "",
        priority: "normal",
        expires_at: "",
      });
      setShowForm(false);
      fetchAnnouncements();
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast.error("Failed to create announcement");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id, title) => {
    setDeleteModal({ open: true, id, title });
  };

  const handleDelete = async () => {
    const { id } = deleteModal;
    if (!id) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Announcement deleted");
      setDeleteModal({ open: false, id: null, title: "" });
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast.error("Failed to delete announcement");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case "high":
        return {
          border: "border-l-4 border-red-500",
          badge: "bg-red-100 text-red-700",
          dot: "bg-red-500",
          icon: "text-red-500",
        };
      case "low":
        return {
          border: "border-l-4 border-gray-400",
          badge: "bg-gray-100 text-gray-700",
          dot: "bg-gray-400",
          icon: "text-gray-400",
        };
      default:
        return {
          border: "border-l-4 border-blue-500",
          badge: "bg-blue-100 text-blue-700",
          dot: "bg-blue-500",
          icon: "text-blue-500",
        };
    }
  };

  const FilterButton = ({ type, label }) => (
    <button
      onClick={() => setFilter(type)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        filter === type
          ? "bg-blue-600 text-white shadow-md"
          : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
      }`}
    >
      {label}
    </button>
  );

  const canDelete = (announcement) => {
    if (!isAdmin) return false;
    if (userProfile?.role === "admin") return true;
    if (userProfile?.role === "manager") {
      return announcement.created_by === user.id;
    }
    return false;
  };

  // Get theme-aware colors
  const isDarkTheme = backgroundTheme === "dark";
  const cardBgClass = isDarkTheme ? "bg-gray-800" : "bg-white";
  const textClass = isDarkTheme ? "text-white" : "text-gray-800";
  const subtextClass = isDarkTheme ? "text-gray-400" : "text-gray-600";

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, title: "" })}
        title="Delete Announcement"
        size="sm"
        isDark={isDarkTheme}
      >
        <p
          className={`mb-4 ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}
        >
          Are you sure you want to delete <strong>"{deleteModal.title}"</strong>
          ?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setDeleteModal({ open: false, id: null, title: "" })}
            className={`px-4 py-2 rounded-lg transition ${
              isDarkTheme
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </Modal>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <BellIcon className="w-6 h-6 text-blue-600" />
          </div>
          <span>Announcements</span>
        </h2>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2.5 rounded-lg transition shadow-lg flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            {showForm ? "Cancel" : "New Announcement"}
          </button>
        )}
      </div>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Create New Announcement"
        size="lg"
        isDark={isDarkTheme}
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDarkTheme ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkTheme
                  ? "bg-gray-900 border-gray-700 text-white placeholder-gray-400"
                  : "border-gray-300 text-gray-900"
              }`}
              placeholder="Announcement Title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkTheme
                    ? "bg-gray-900 border-gray-700 text-white"
                    : "border-gray-300 text-gray-900"
                }`}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDarkTheme ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Expires At (Optional)
              </label>
              <input
                type="date"
                value={formData.expires_at}
                onChange={(e) =>
                  setFormData({ ...formData, expires_at: e.target.value })
                }
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkTheme
                    ? "bg-gray-900 border-gray-700 text-white"
                    : "border-gray-300 text-gray-900"
                }`}
              />
            </div>
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDarkTheme ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkTheme
                  ? "bg-gray-900 border-gray-700 text-white placeholder-gray-400"
                  : "border-gray-300 text-gray-900"
              }`}
              placeholder="Announcement content..."
              rows="4"
              required
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className={`px-4 py-2 rounded-lg transition ${
                isDarkTheme
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-800"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              <SendIcon fontSize="small" />
              {loading ? "Creating..." : "Publish"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <FilterButton type="all" label="All" />
        <FilterButton type="admin" label="Admin" />
        <FilterButton type="manager" label="Manager" />
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex justify-center p-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className={`${cardBgClass} rounded-xl shadow-sm p-12 text-center`}>
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <BellIcon className="w-10 h-10 text-gray-400" />
          </div>
          <p className={`text-lg ${subtextClass}`}>No announcements found</p>
          <p className="text-sm text-gray-400 mt-1">
            Check back later for updates
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((announcement) => {
            const styles = getPriorityStyles(announcement.priority);
            const isExpanded = expandedId === announcement.id;
            const creator = creatorRoles[announcement.created_by];
            const canDeleteAnnouncement = canDelete(announcement);
            // Fallback to "Manager" if creator is not found (since team announcements are from managers)
            const creatorDisplayName = creator?.full_name || creator?.role === "manager" ? "Manager" : creator?.full_name || "Unknown";

            return (
              <div
                key={announcement.id}
                className={`${cardBgClass} rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md ${styles.border}`}
              >
                {/* Card Header - Clickable */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpand(announcement.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Expand Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {isExpanded ? (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Priority Dot */}
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${styles.dot}`}
                        />
                        {/* Title */}
                        <h3 className={`font-semibold ${textClass} truncate`}>
                          {announcement.title}
                        </h3>
                        {/* Priority Badge */}
                        <span
                          className={`px-2.5 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${styles.badge}`}
                        >
                          {announcement.priority === "high"
                            ? "HIGH"
                            : announcement.priority === "low"
                              ? "LOW"
                              : "Normal"}
                        </span>
                      </div>

                      {/* Preview */}
                      <p className={`text-sm ${subtextClass} line-clamp-2`}>
                        {announcement.content.substring(0, 120)}
                        {announcement.content.length > 120 ? "..." : ""}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <UserIcon className="w-4 h-4" />
                          <span>
                            {creator?.role === "admin"
                              ? "Admin"
                              : creatorDisplayName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>
                            {new Date(
                              announcement.created_at,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete Button (Admin only) */}
                    {isAdmin && canDeleteAnnouncement && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(announcement.id, announcement.title);
                        }}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <div className="ml-9">
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span>
                          From:{" "}
                          <span className="font-medium text-gray-700 capitalize">
                            {creatorDisplayName}
                          </span>
                        </span>
                        {announcement.expires_at && (
                          <span>
                            Expires:{" "}
                            {new Date(
                              announcement.expires_at,
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div
                        className={`${cardBgClass} p-4 rounded-lg border border-gray-200`}
                      >
                        <p
                          className={`${textClass} whitespace-pre-wrap leading-relaxed`}
                        >
                          {announcement.content}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Announcements;
