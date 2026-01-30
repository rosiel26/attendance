import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../config/supabase";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";
import { createNotification } from "../../services/supabaseService";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FilterListIcon from "@mui/icons-material/FilterList";
import DeleteIcon from "@mui/icons-material/Delete";

// Modal component
const Modal = ({ isOpen, onClose, title, children, size = "md" }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-lg w-full ${sizeClasses[size]} shadow-xl`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

const Announcements = () => {
  const { user, userProfile, loading: authLoading } = useAuthStore();
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

  // Helper function to truncate text
  const truncateText = (text, maxLength = 60) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Fetch user profile if not available
  useEffect(() => {
    const loadProfile = async () => {
      // Skip if profile already loaded or no user
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
        // Employees see admin announcements (target_role=all) and their own manager's announcements
        const managerId = userProfile?.manager_id;
        if (managerId) {
          query = query.or(`target_role.eq.all,manager_id.eq.${managerId}`);
        } else {
          query = query.eq("target_role", "all");
        }
      } else if (userProfile?.role === "manager") {
        // Managers see admin announcements (target_role=all) and their own
        query = query.or(`target_role.eq.all,created_by.eq.${user.id}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter out expired announcements for employees
      const now = new Date();
      const validAnnouncements = data.filter((a) => {
        if (!a.expires_at) return true; // No expiration
        return new Date(a.expires_at) > now; // Not expired yet
      });

      // Fetch creator info for each announcement
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
    // Wait for auth to finish loading and profile to be loaded
    if (authLoading || !profileLoadedRef.current || !userProfile) return;

    fetchAnnouncements();
    if (userProfile?.role === "admin" || userProfile?.role === "manager") {
      setIsAdmin(true);
    }
  }, [authLoading, userProfile, fetchAnnouncements]);

  useEffect(() => {
    if (announcements.length > 0) {
      filterAnnouncements();
    }
  }, [announcements, filter, filterAnnouncements]);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const { data: announcement, error } = await supabase
        .from("announcements")
        .insert([
          {
            title: formData.title,
            content: formData.content,
            priority: formData.priority,
            expires_at: formData.expires_at || null,
            created_by: user.id,
            target_role: userProfile?.role === "admin" ? "all" : "team",
            manager_id: userProfile?.role === "manager" ? user.id : null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (userProfile?.role === "admin") {
        const { data: allUsers } = await supabase.from("users").select("id");
        if (allUsers?.length) {
          for (const u of allUsers) {
            await createNotification(
              u.id,
              `New announcement: ${formData.title}`,
              "announcement",
              announcement.id,
            );
          }
        }
      } else if (userProfile?.role === "manager") {
        const { data: teamMembers } = await supabase
          .from("users")
          .select("id")
          .eq("manager_id", user.id);

        if (teamMembers?.length) {
          for (const member of teamMembers) {
            await createNotification(
              member.id,
              `New announcement from ${userProfile?.full_name || "your manager"}: ${formData.title}`,
              "announcement",
              announcement.id,
            );
          }
        }
      }

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
          badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
          dot: "bg-red-500",
        };
      case "low":
        return {
          border: "border-l-4 border-gray-400",
          badge:
            "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
          dot: "bg-gray-400",
        };
      default:
        return {
          border: "border-l-4 border-blue-500",
          badge:
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          dot: "bg-blue-500",
        };
    }
  };

  const FilterButton = ({ type, label, icon: Icon }) => (
    <button
      onClick={() => setFilter(type)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
        filter === type
          ? "bg-blue-600 text-white shadow-md"
          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </button>
  );

  // Check if manager can delete this announcement
  const canDelete = (announcement) => {
    if (!isAdmin) return false;
    // Admin can delete all
    if (userProfile?.role === "admin") return true;
    // Manager can only delete their own announcements (not admin's)
    if (userProfile?.role === "manager") {
      return announcement.created_by === user.id;
    }
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null, title: "" })}
        title="Delete Announcement"
        size="sm"
      >
        <p className="text-gray-700 mb-4">
          Are you sure you want to delete <strong>"{deleteModal.title}"</strong>
          ?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setDeleteModal({ open: false, id: null, title: "" })}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition"
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <NotificationsIcon className="w-8 h-8 text-blue-600" />
          Announcements
        </h2>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-md"
          >
            {showForm ? "Cancel" : "+ New Announcement"}
          </button>
        )}
      </div>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Create New Announcement"
        size="lg"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="input-field"
                placeholder="Announcement Title"
                required
              />
            </div>
            <div>
              <label className="label-text">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value })
                }
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label-text">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="input-field"
              placeholder="Announcement content..."
              rows="4"
              required
            />
          </div>
          <div>
            <label className="label-text">Expires At (Optional)</label>
            <input
              type="date"
              value={formData.expires_at}
              onChange={(e) =>
                setFormData({ ...formData, expires_at: e.target.value })
              }
              className="input-field"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-md disabled:opacity-50"
            >
              {loading ? "Creating..." : "Publish Announcement"}
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

      {/* Email Inbox Style List */}
      <div className="card bg-white shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center p-12 text-gray-500">
              <NotificationsIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No announcements found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="p-4 text-left w-10 text-gray-600 dark:text-gray-200"></th>
                  <th className="p-4 text-left w-48 text-gray-600 dark:text-gray-200 font-semibold">
                    Subject
                  </th>
                  <th className="p-4 text-left w-40 text-gray-600 dark:text-gray-200 font-semibold">
                    Content
                  </th>
                  <th className="p-4 text-left w-28 text-gray-600 dark:text-gray-200 font-semibold">
                    From
                  </th>
                  <th className="p-4 text-left w-24 text-gray-600 dark:text-gray-200 font-semibold">
                    Priority
                  </th>
                  <th className="p-4 text-left w-32 text-gray-600 dark:text-gray-200 font-semibold">
                    Date
                  </th>
                  {isAdmin && <th className="p-4 text-left w-12"></th>}
                </tr>
              </thead>
              <tbody>
                {filteredAnnouncements.map((announcement) => {
                  const styles = getPriorityStyles(announcement.priority);
                  const isExpanded = expandedId === announcement.id;
                  const creator = creatorRoles[announcement.created_by];
                  const canDeleteAnnouncement = canDelete(announcement);

                  return (
                    <React.Fragment key={announcement.id}>
                      <tr
                        className={`border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-yellow-900/10 cursor-pointer transition-colors ${styles.border}`}
                        onClick={() => toggleExpand(announcement.id)}
                      >
                        <td className="p-4">
                          {isExpanded ? (
                            <ExpandMoreIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          ) : (
                            <ChevronRightIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-3 h-3 rounded-full ${styles.dot}`}
                            />
                            <span className="font-medium text-gray-900 dark:text-black">
                              {announcement.title}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className="text-gray-600 dark:text-gray-700 text-sm truncate block max-w-xs"
                            title={announcement.content}
                          >
                            {truncateText(announcement.content, 50)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              creator?.role === "admin"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            }`}
                          >
                            {creator?.role === "admin"
                              ? "Admin"
                              : creator?.full_name || "Unknown"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${styles.badge}`}
                          >
                            {announcement.priority === "high"
                              ? "HIGH"
                              : announcement.priority === "low"
                                ? "LOW"
                                : "Normal"}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(
                            announcement.created_at,
                          ).toLocaleDateString()}
                        </td>
                        {isAdmin && (
                          <td className="p-4 text-center">
                            {canDeleteAnnouncement ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDelete(
                                    announcement.id,
                                    announcement.title,
                                  );
                                }}
                                className="text-gray-400 hover:text-red-600 p-2 rounded-lg transition inline-flex items-center justify-center"
                                title="Delete"
                              >
                                <DeleteIcon className="w-5 h-5 text-red-600" />
                              </button>
                            ) : (
                              <span
                                className="text-gray-300 p-2 rounded-lg inline-flex items-center justify-center cursor-not-allowed"
                                title="Cannot delete admin announcements"
                              >
                                <DeleteIcon className="w-5 h-5 opacity-50" />
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50 dark:bg-gray-500">
                          <td colSpan={isAdmin ? 7 : 6} className="p-6">
                            <div className="ml-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm text-black">
                                  From:{" "}
                                  <span className="font-medium text-black capitalize">
                                    {creator?.full_name || "Unknown"}
                                  </span>
                                </span>
                                {announcement.expires_at && (
                                  <span className="text-sm text-gray-500">
                                    | Expires:{" "}
                                    {new Date(
                                      announcement.expires_at,
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                  {announcement.content}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Announcements;
