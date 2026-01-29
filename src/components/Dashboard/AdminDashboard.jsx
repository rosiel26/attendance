import React, { useState, useEffect, useCallback, useMemo } from "react";
import Header from "../Common/Header";
import { supabase } from "../../config/supabase";
import toast from "react-hot-toast";
import { useAuthStore } from "../../stores/authStore";
import {
  ChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  UserPlusIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  XCircleIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

// ============ UI Components ============
const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between transition hover:shadow-md">
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
    <div className={`p-3 bg-${color}-50 rounded-lg`}>
      <Icon className={`w-8 h-8 text-${color}-600`} />
    </div>
  </div>
);

const ActionButton = ({
  onClick,
  icon: Icon,
  label,
  color = "blue",
  variant = "icon",
  title,
}) => (
  <button
    onClick={onClick}
    className={`text-${color}-600 hover:text-${color}-800 font-semibold text-xs p-1 hover:bg-${color}-50 rounded transition`}
    title={title}
  >
    <Icon className="w-5 h-5" />
  </button>
);

const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-3 px-4 text-center font-semibold transition flex items-center justify-center gap-2 ${
      active
        ? "bg-blue-500 text-white"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </button>
);

const Card = ({ children, className = "" }) => (
  <div
    className={`card bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}
  >
    {children}
  </div>
);

const ToggleButton = ({
  isOpen,
  onClick,
  iconOpen: IconOpen,
  iconClosed: IconClosed,
  label,
}) => (
  <button onClick={onClick} className="btn-primary flex items-center gap-2">
    {isOpen ? (
      <IconOpen className="w-5 h-5" />
    ) : (
      <IconClosed className="w-5 h-5" />
    )}
    <span>{isOpen ? "Cancel" : label}</span>
  </button>
);

const FormField = ({ label, children, required }) => (
  <div>
    <label className="label-text">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const Select = ({
  value,
  onChange,
  options,
  placeholder,
  required,
  className = "input-field",
}) => (
  <select
    value={value}
    onChange={onChange}
    className={className}
    required={required}
  >
    <option value="">{placeholder}</option>
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

// ============ Main Component ============
const AdminDashboard = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDepartments: 0,
    presentToday: 0,
    absentToday: 0,
  });
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    password: "",
    confirmPassword: "",
    role: "employee",
    department_id: "",
    manager_id: "",
  });
  const [showAddDept, setShowAddDept] = useState(false);
  const [deptData, setDeptData] = useState({ name: "", manager_id: "" });
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [holidayData, setHolidayData] = useState({
    name: "",
    date: "",
    is_recurring: false,
  });

  // Tab data fetching
  useEffect(() => {
    if (!user) return;
    const tabFetchers = {
      overview: fetchDashboardData,
      users: () => {
        fetchUsers();
        fetchManagers();
        fetchDepartments();
      },
      departments: fetchDepartments,
      holidays: fetchHolidays,
      attendance: fetchAttendanceStats,
    };
    tabFetchers[activeTab]?.();
  }, [activeTab, user]);

  // Combined fetch functions with parallel loading
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: usersData },
        { data: deptData },
        { data: attendanceToday },
      ] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("departments").select("*"),
        supabase
          .from("attendance")
          .select("*")
          .gte("check_in_time", new Date().toISOString().split("T")[0])
          .lt(
            "check_in_time",
            new Date(Date.now() + 86400000).toISOString().split("T")[0],
          ),
      ]);
      setStats({
        totalUsers: usersData?.length || 0,
        totalDepartments: deptData?.length || 0,
        presentToday:
          attendanceToday?.filter((a) => a.check_out_time).length || 0,
        absentToday: Math.max(
          0,
          (usersData?.length || 0) - (attendanceToday?.length || 0),
        ),
      });
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*, department:departments(name)");
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchManagers = useCallback(async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .in("role", ["manager", "admin"]);
    if (!error) setManagers(data || []);
  }, []);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("departments").select("*");
      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      toast.error("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("holidays").select("*");
      if (error) throw error;
      setHolidays(data || []);
    } catch (error) {
      toast.error("Failed to fetch holidays");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAttendanceStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select("*, users(full_name, email)")
        .order("check_in_time", { ascending: false })
        .limit(20);
      if (error) throw error;
      setAttendanceStats(data || []);
    } catch (error) {
      toast.error("Failed to fetch attendance stats");
    } finally {
      setLoading(false);
    }
  }, []);

  // User Management
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!formData.email.endsWith("@rlb.com")) {
      toast.error("Only @rlb.com email addresses are allowed");
      return;
    }

    if (
      !editingUser &&
      (!formData.password || formData.password !== formData.confirmPassword)
    ) {
      toast.error(
        editingUser ? "Email and name required" : "Passwords do not match",
      );
      return;
    }
    if (formData.role !== "manager" && !formData.manager_id) {
      toast.error("Manager selection is required for this role");
      return;
    }

    try {
      setLoading(true);
      const { data: orgData } = await supabase
        .from("organizations")
        .select("id")
        .limit(1)
        .single();
      const organizationId = orgData?.id || null;

      if (!editingUser) {
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                full_name: formData.full_name,
                role: formData.role,
                organization_id: organizationId,
                department_id: formData.department_id || null,
                manager_id: formData.manager_id || null,
              },
            },
          },
        );
        if (authError || !authData.user)
          throw new Error(authError?.message || "User creation failed");

        try {
          await supabase
            .from("users")
            .upsert(
              [
                {
                  id: authData.user.id,
                  email: formData.email,
                  full_name: formData.full_name,
                  role: formData.role,
                  organization_id: organizationId,
                  department_id: formData.department_id || null,
                  manager_id: formData.manager_id || null,
                },
              ],
              { onConflict: "id" },
            );
        } catch (dbError) {
          console.log(
            "Note: User record sync blocked by RLS, but auth user was created",
          );
        }
        toast.success(`Employee "${formData.full_name}" created successfully!`);
      } else {
        const { error: updateError } = await supabase
          .from("users")
          .update({
            email: formData.email,
            full_name: formData.full_name,
            role: formData.role,
            department_id: formData.department_id || null,
            manager_id: formData.manager_id || null,
          })
          .eq("id", editingUser.id);
        if (updateError) throw updateError;
        toast.success(`Employee "${formData.full_name}" updated successfully!`);
      }

      setFormData({
        email: "",
        full_name: "",
        password: "",
        confirmPassword: "",
        role: "employee",
        department_id: "",
        manager_id: "",
      });
      setEditingUser(null);
      setShowAddUser(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.message || "Failed to process user");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (
      !window.confirm(
        "Are you sure? This will delete the user account permanently.",
      )
    )
      return;
    try {
      setLoading(true);
      const { error: dbError } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);
      if (dbError) throw dbError;
      toast.success("User deleted successfully!");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);
      if (error) throw error;
      toast.success("User role updated");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  // Department Management
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!deptData.name) return toast.error("Department name required");
    try {
      setLoading(true);
      const { data: orgData } = await supabase
        .from("organizations")
        .select("id")
        .limit(1)
        .single();
      const { error } = await supabase
        .from("departments")
        .insert([
          {
            name: deptData.name,
            manager_id: deptData.manager_id || null,
            organization_id: orgData?.id || null,
          },
        ]);
      if (error) throw error;
      toast.success("Department added successfully");
      setDeptData({ name: "", manager_id: "" });
      setShowAddDept(false);
      fetchDepartments();
    } catch (error) {
      toast.error(
        error.message?.includes("row-level security")
          ? "Permission denied: Check RLS policies"
          : "Failed to add department",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (!window.confirm("Delete this department?")) return;
    try {
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", deptId);
      if (error) throw error;
      toast.success("Department deleted");
      fetchDepartments();
    } catch (error) {
      toast.error("Failed to delete department");
    }
  };

  // Holiday Management
  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!holidayData.name || !holidayData.date)
      return toast.error("Holiday name and date required");
    try {
      setLoading(true);
      const { error } = await supabase
        .from("holidays")
        .insert([
          {
            name: holidayData.name,
            date: holidayData.date,
            is_recurring: holidayData.is_recurring,
          },
        ]);
      if (error) throw error;
      toast.success("Holiday added");
      setHolidayData({ name: "", date: "", is_recurring: false });
      setShowAddHoliday(false);
      fetchHolidays();
    } catch (error) {
      toast.error("Failed to add holiday");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    if (!window.confirm("Delete this holiday?")) return;
    try {
      const { error } = await supabase
        .from("holidays")
        .delete()
        .eq("id", holidayId);
      if (error) throw error;
      toast.success("Holiday deleted");
      fetchHolidays();
    } catch (error) {
      toast.error("Failed to delete holiday");
    }
  };

  // Helper to get manager name
  const getManagerName = useMemo(() => {
    const managerMap = Object.fromEntries(
      managers.map((m) => [m.id, m.full_name]),
    );
    return (managerId) => managerMap[managerId] || "-";
  }, [managers]);

  // Password visibility toggle
  const PasswordField = ({ value, show, onToggle, field }) => (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
        className="input-field pr-10"
        placeholder="••••••••"
        required={!editingUser}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
      >
        {show ? (
          <EyeSlashIcon className="w-5 h-5" />
        ) : (
          <EyeIcon className="w-5 h-5" />
        )}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header title="Admin Dashboard" />
      <main className="flex-1 p-4 md:p-8 pb-24">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard
                label="Total Users"
                value={stats.totalUsers}
                icon={UsersIcon}
                color="blue"
              />
              <StatCard
                label="Departments"
                value={stats.totalDepartments}
                icon={BuildingOfficeIcon}
                color="green"
              />
              <StatCard
                label="Present Today"
                value={stats.presentToday}
                icon={ChartBarIcon}
                color="yellow"
              />
              <StatCard
                label="Absent Today"
                value={stats.absentToday}
                icon={XCircleIcon}
                color="red"
              />
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Management</h2>
              <ToggleButton
                isOpen={showAddUser}
                onClick={() => setShowAddUser(!showAddUser)}
                iconOpen={XCircleIcon}
                iconClosed={UserPlusIcon}
                label="Add Employee"
              />
            </div>

            {showAddUser && (
              <Card>
                <h3 className="text-lg font-bold mb-4">
                  {editingUser ? "Edit Employee" : "Add New Employee"}
                </h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <FormField label="Display Name" required>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      className="input-field"
                      placeholder="John Doe"
                      required
                    />
                  </FormField>
                  <FormField label="Email Address" required>
                    <div className="flex">
                      <input
                        type="text"
                        value={formData.email.replace(/@rlb\.com$/, "")}
                        onChange={(e) => {
                          const username = e.target.value.replace(/@.*$/, "");
                          if (!username.includes("@"))
                            setFormData({
                              ...formData,
                              email: username ? `${username}@rlb.com` : "",
                            });
                        }}
                        className="input-field rounded-r-none"
                        placeholder="username"
                        required
                      />
                      <span className="inline-flex items-center px-3 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md text-gray-600 text-sm">
                        @rlb.com
                      </span>
                    </div>
                  </FormField>
                  {!editingUser && (
                    <>
                      <FormField label="Password" required>
                        <PasswordField
                          value={formData.password}
                          show={showPassword}
                          onToggle={() => setShowPassword(!showPassword)}
                          field="password"
                        />
                      </FormField>
                      <FormField label="Confirm Password" required>
                        <PasswordField
                          value={formData.confirmPassword}
                          show={showConfirmPassword}
                          onToggle={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          field="confirmPassword"
                        />
                      </FormField>
                    </>
                  )}
                  <FormField label="Role" required>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="input-field"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </FormField>
                  <FormField label="Department (Optional)">
                    <Select
                      value={formData.department_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          department_id: e.target.value,
                        })
                      }
                      options={departments.map((d) => ({
                        value: d.id,
                        label: d.name,
                      }))}
                      placeholder="Select Department"
                    />
                  </FormField>
                  <FormField
                    label={`Manager${formData.role === "manager" ? " (Optional)" : ""}`}
                    required={formData.role !== "manager"}
                  >
                    <Select
                      value={formData.manager_id}
                      onChange={(e) =>
                        setFormData({ ...formData, manager_id: e.target.value })
                      }
                      options={managers.map((m) => ({
                        value: m.id,
                        label: m.full_name,
                      }))}
                      placeholder="Select Manager"
                    />
                  </FormField>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary disabled:opacity-50"
                    >
                      {loading
                        ? editingUser
                          ? "Updating..."
                          : "Creating..."
                        : editingUser
                          ? "Update Employee"
                          : "Create Employee Account"}
                    </button>
                    {editingUser && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUser(null);
                          setFormData({
                            email: "",
                            full_name: "",
                            password: "",
                            confirmPassword: "",
                            role: "employee",
                            department_id: "",
                            manager_id: "",
                          });
                          setShowAddUser(false);
                        }}
                        className="btn-secondary"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </Card>
            )}

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Role</th>
                      <th className="p-3 text-left">Department</th>
                      <th className="p-3 text-left">Manager</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{user.email}</td>
                        <td className="p-3">{user.full_name}</td>
                        <td className="p-3">
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleUpdateUserRole(user.id, e.target.value)
                            }
                            className="p-1 border rounded text-xs"
                          >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="p-3">{user.department?.name || "-"}</td>
                        <td className="p-3">
                          {getManagerName(user.manager_id)}
                        </td>
                        <td className="p-3 flex gap-2">
                          <ActionButton
                            onClick={() => {
                              setEditingUser(user);
                              setFormData({
                                email: user.email,
                                full_name: user.full_name,
                                password: "",
                                confirmPassword: "",
                                role: user.role,
                                department_id: user.department_id || "",
                                manager_id: user.manager_id || "",
                              });
                              setShowAddUser(true);
                            }}
                            icon={PencilIcon}
                            title="Edit Employee"
                          />
                          <ActionButton
                            onClick={() => handleDeleteUser(user.id)}
                            icon={TrashIcon}
                            color="red"
                            title="Delete Employee"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Departments Tab */}
        {activeTab === "departments" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Department Management</h2>
              <ToggleButton
                isOpen={showAddDept}
                onClick={() => setShowAddDept(!showAddDept)}
                iconOpen={XCircleIcon}
                iconClosed={PlusIcon}
                label="Add Department"
              />
            </div>

            {showAddDept && (
              <Card>
                <h3 className="text-lg font-bold mb-4">Add New Department</h3>
                <form onSubmit={handleAddDepartment} className="space-y-4">
                  <FormField label="Department Name" required>
                    <input
                      type="text"
                      value={deptData.name}
                      onChange={(e) =>
                        setDeptData({ ...deptData, name: e.target.value })
                      }
                      className="input-field"
                      required
                    />
                  </FormField>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {loading ? "Adding..." : "Add Department"}
                  </button>
                </form>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map((dept) => (
                <Card key={dept.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold flex items-center gap-2">
                        <BuildingOfficeIcon className="w-5 h-5 text-gray-500" />
                        {dept.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-2 ml-7">
                        ID: {dept.id}
                      </p>
                    </div>
                    <ActionButton
                      onClick={() => handleDeleteDepartment(dept.id)}
                      icon={TrashIcon}
                      color="red"
                      title="Delete Department"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Holidays Tab */}
        {activeTab === "holidays" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Holiday Management</h2>
              <ToggleButton
                isOpen={showAddHoliday}
                onClick={() => setShowAddHoliday(!showAddHoliday)}
                iconOpen={XCircleIcon}
                iconClosed={PlusIcon}
                label="Add Holiday"
              />
            </div>

            {showAddHoliday && (
              <Card>
                <h3 className="text-lg font-bold mb-4">Add New Holiday</h3>
                <form onSubmit={handleAddHoliday} className="space-y-4">
                  <FormField label="Holiday Name" required>
                    <input
                      type="text"
                      value={holidayData.name}
                      onChange={(e) =>
                        setHolidayData({ ...holidayData, name: e.target.value })
                      }
                      className="input-field"
                      required
                    />
                  </FormField>
                  <FormField label="Date" required>
                    <input
                      type="date"
                      value={holidayData.date}
                      onChange={(e) =>
                        setHolidayData({ ...holidayData, date: e.target.value })
                      }
                      className="input-field"
                      required
                    />
                  </FormField>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={holidayData.is_recurring}
                      onChange={(e) =>
                        setHolidayData({
                          ...holidayData,
                          is_recurring: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <label className="label-text">Recurring (Annual)</label>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {loading ? "Adding..." : "Add Holiday"}
                  </button>
                </form>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {holidays.map((holiday) => (
                <Card key={holiday.id} className="bg-blue-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                        <CalendarDaysIcon className="w-5 h-5" />
                        {holiday.name}
                      </h4>
                      <p className="text-sm text-blue-700 mt-2 ml-7">
                        {new Date(holiday.date).toLocaleDateString()}
                      </p>
                      {holiday.is_recurring && (
                        <p className="text-xs text-blue-600 ml-7 mt-1">
                          Recurring Annually
                        </p>
                      )}
                    </div>
                    <ActionButton
                      onClick={() => handleDeleteHoliday(holiday.id)}
                      icon={TrashIcon}
                      color="red"
                      title="Delete Holiday"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Attendance Reports Tab */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Attendance Reports</h2>
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-3 text-left">Employee</th>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Check-in</th>
                      <th className="p-3 text-left">Check-out</th>
                      <th className="p-3 text-left">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceStats.map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{record.users?.full_name}</td>
                        <td className="p-3">
                          {new Date(record.check_in_time).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          {new Date(record.check_in_time).toLocaleTimeString()}
                        </td>
                        <td className="p-3">
                          {record.check_out_time
                            ? new Date(
                                record.check_out_time,
                              ).toLocaleTimeString()
                            : "-"}
                        </td>
                        <td className="p-3 font-semibold">
                          {record.duration_hours || 0}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Tab Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            icon={ChartBarIcon}
            label="Overview"
          />
          <TabButton
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
            icon={UsersIcon}
            label="Users"
          />
          <TabButton
            active={activeTab === "departments"}
            onClick={() => setActiveTab("departments")}
            icon={BuildingOfficeIcon}
            label="Departments"
          />
          <TabButton
            active={activeTab === "holidays"}
            onClick={() => setActiveTab("holidays")}
            icon={CalendarDaysIcon}
            label="Holidays"
          />
          <TabButton
            active={activeTab === "attendance"}
            onClick={() => setActiveTab("attendance")}
            icon={ClipboardDocumentListIcon}
            label="Reports"
          />
        </div>
      </div>
      <div className="h-20"></div>
    </div>
  );
};

export default AdminDashboard;
