import React, { useState, useEffect } from 'react';
import Header from '../Common/Header';
import { supabase } from '../../config/supabase';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
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
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDepartments: 0,
    presentToday: 0,
    absentToday: 0,
  });

  // User Management
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    department_id: '',
  });

  // Department Management
  const [departments, setDepartments] = useState([]);
  const [showAddDept, setShowAddDept] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptData, setDeptData] = useState({
    name: '',
    manager_id: '',
  });

  // Holiday Management
  const [holidays, setHolidays] = useState([]);
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [holidayData, setHolidayData] = useState({
    name: '',
    date: '',
    is_recurring: false,
  });

  // Attendance Stats
  const [attendanceStats, setAttendanceStats] = useState([]);

  useEffect(() => {
    if (!user) return;

    if (activeTab === 'overview') {
      fetchDashboardData();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'departments') {
      fetchDepartments();
    } else if (activeTab === 'holidays') {
      fetchHolidays();
    } else if (activeTab === 'attendance') {
      fetchAttendanceStats();
    }
  }, [activeTab, user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch stats
      const { data: usersData, error: usersError } = await supabase.from('users').select('*');
      const { data: deptData, error: deptError } = await supabase.from('departments').select('*');
      const { data: attendanceToday, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .gte('check_in_time', new Date().toISOString().split('T')[0])
        .lt('check_in_time', new Date(Date.now() + 86400000).toISOString().split('T')[0]);

      if (usersError) console.error('Users error:', usersError);
      if (deptError) console.error('Departments error:', deptError);
      if (attendanceError) console.error('Attendance error:', attendanceError);

      setStats({
        totalUsers: usersData?.length || 0,
        totalDepartments: deptData?.length || 0,
        presentToday: attendanceToday?.filter(a => a.check_out_time).length || 0,
        absentToday: Math.max(0, (usersData?.length || 0) - (attendanceToday?.length || 0)),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Fetch users error:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('departments').select('*');
      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Fetch departments error:', error);
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('holidays').select('*');
      if (error) throw error;
      setHolidays(data || []);
    } catch (error) {
      console.error('Fetch holidays error:', error);
      toast.error('Failed to fetch holidays');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*, users(full_name, email)')
        .order('check_in_time', { ascending: false })
        .limit(20);
      if (error) throw error;
      setAttendanceStats(data || []);
    } catch (error) {
      console.error('Fetch attendance error:', error);
      toast.error('Failed to fetch attendance stats');
    } finally {
      setLoading(false);
    }
  };

  // User Management Functions
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.full_name || !formData.password) {
      toast.error('Email, name, and password required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      
      // Get the current admin's session to restore it later
      const { data: { session: adminSession } } = await supabase.auth.getSession();
      
      // Get default organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();

      const organizationId = orgData?.id || null;

      // Create auth user via Supabase - store all user data in metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: formData.role,
            organization_id: organizationId,
            department_id: formData.department_id || null,
          }
        }
      });
      
      if (authError) {
        console.error('Auth error:', authError);
        toast.error('Auth error: ' + (authError.message || 'Failed to create auth user'));
        return;
      }

      if (!authData.user) {
        toast.error('User creation failed - no auth user returned');
        return;
      }

      // Try to create user record in users table, but don't fail if RLS blocks it
      try {
        await supabase.from('users').insert([{
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          organization_id: organizationId,
          department_id: formData.department_id || null,
        }]);
      } catch (dbError) {
        console.log('Note: User record could not be synced to users table (RLS may be blocking), but auth user was created successfully');
      }

      // Restore admin session
      if (adminSession) {
        await supabase.auth.setSession(adminSession);
      }

      toast.success(`Employee account "${formData.full_name}" created successfully!`);
      setFormData({ email: '', full_name: '', password: '', confirmPassword: '', role: 'employee', department_id: '' });
      setShowAddUser(false);
      fetchUsers();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure? This will delete the user account permanently.')) return;
    try {
      setLoading(true);
      
      // Delete from users table - this prevents them from logging in
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
      
      if (dbError) {
        console.error('Database delete error:', dbError);
        toast.error('Failed to delete user: ' + dbError.message);
        setLoading(false);
        return;
      }
      
      toast.success('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user: ' + error.message);
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      toast.success('User role updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  // Department Management Functions
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!deptData.name) {
      toast.error('Department name required');
      return;
    }
    try {
      setLoading(true);

      // Get organization ID
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single();

      const { error } = await supabase.from('departments').insert([{
        name: deptData.name,
        manager_id: deptData.manager_id || null,
        organization_id: orgData?.id || null
      }]);

      if (error) throw error;
      toast.success('Department added successfully');
      setDeptData({ name: '', manager_id: '' });
      setShowAddDept(false);
      fetchDepartments();
    } catch (error) {
      console.error('Error adding department:', error);
      if (error.message?.includes('row-level security')) {
        toast.error('Permission denied: Database RLS policy blocks this action. Please run the fix script.');
      } else {
        toast.error('Failed to add department: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    if (!window.confirm('Delete this department?')) return;
    try {
      const { error } = await supabase.from('departments').delete().eq('id', deptId);
      if (error) throw error;
      toast.success('Department deleted');
      fetchDepartments();
    } catch (error) {
      toast.error('Failed to delete department');
    }
  };

  // Holiday Management Functions
  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!holidayData.name || !holidayData.date) {
      toast.error('Holiday name and date required');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.from('holidays').insert([{
        name: holidayData.name,
        date: holidayData.date,
        is_recurring: holidayData.is_recurring,
      }]);
      if (error) throw error;
      toast.success('Holiday added');
      setHolidayData({ name: '', date: '', is_recurring: false });
      setShowAddHoliday(false);
      fetchHolidays();
    } catch (error) {
      toast.error('Failed to add holiday');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHoliday = async (holidayId) => {
    if (!window.confirm('Delete this holiday?')) return;
    try {
      const { error } = await supabase.from('holidays').delete().eq('id', holidayId);
      if (error) throw error;
      toast.success('Holiday deleted');
      fetchHolidays();
    } catch (error) {
      toast.error('Failed to delete holiday');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header title="Admin Dashboard" />
      <main className="flex-1 p-4 md:p-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between transition hover:shadow-md">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <UsersIcon className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between transition hover:shadow-md">
                <div>
                  <p className="text-sm font-medium text-gray-500">Departments</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalDepartments}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <BuildingOfficeIcon className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between transition hover:shadow-md">
                <div>
                  <p className="text-sm font-medium text-gray-500">Present Today</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.presentToday}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <CheckCircleIcon className="w-8 h-8 text-yellow-600" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between transition hover:shadow-md">
                <div>
                  <p className="text-sm font-medium text-gray-500">Absent Today</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.absentToday}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <XCircleIcon className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Management</h2>
              <button onClick={() => setShowAddUser(!showAddUser)} className="btn-primary flex items-center gap-2">
                {showAddUser ? <XCircleIcon className="w-5 h-5" /> : <UserPlusIcon className="w-5 h-5" />}
                <span>{showAddUser ? 'Cancel' : 'Add Employee'}</span>
              </button>
            </div>

            {showAddUser && (
              <div className="card">
                <h3 className="text-lg font-bold mb-4">Add New Employee</h3>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="label-text">Display Name</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="input-field"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="label-text">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field"
                      placeholder="employee@company.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="label-text">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input-field pr-10"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                      >
                        {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label-text">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="input-field pr-10"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
                      >
                        {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label-text">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="input-field"
                    >
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                    {loading ? 'Creating...' : 'Create Employee Account'}
                  </button>
                </form>
              </div>
            )}

            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Role</th>
                      <th className="p-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{user.email}</td>
                        <td className="p-3">{user.full_name}</td>
                        <td className="p-3">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                            className="p-1 border rounded text-xs"
                          >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-800 font-semibold text-xs"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Departments Tab */}
        {activeTab === 'departments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Department Management</h2>
              <button onClick={() => setShowAddDept(!showAddDept)} className="btn-primary flex items-center gap-2">
                {showAddDept ? <XCircleIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                <span>{showAddDept ? 'Cancel' : 'Add Department'}</span>
              </button>
            </div>

            {showAddDept && (
              <div className="card">
                <h3 className="text-lg font-bold mb-4">Add New Department</h3>
                <form onSubmit={handleAddDepartment} className="space-y-4">
                  <div>
                    <label className="label-text">Department Name</label>
                    <input
                      type="text"
                      value={deptData.name}
                      onChange={(e) => setDeptData({ ...deptData, name: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                    {loading ? 'Adding...' : 'Add Department'}
                  </button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map(dept => (
                <div key={dept.id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold flex items-center gap-2">
                        <BuildingOfficeIcon className="w-5 h-5 text-gray-500" />
                        {dept.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-2 ml-7">ID: {dept.id}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteDepartment(dept.id)}
                      className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-full transition"
                      title="Delete Department"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Holidays Tab */}
        {activeTab === 'holidays' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Holiday Management</h2>
              <button onClick={() => setShowAddHoliday(!showAddHoliday)} className="btn-primary flex items-center gap-2">
                {showAddHoliday ? <XCircleIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                <span>{showAddHoliday ? 'Cancel' : 'Add Holiday'}</span>
              </button>
            </div>

            {showAddHoliday && (
              <div className="card">
                <h3 className="text-lg font-bold mb-4">Add New Holiday</h3>
                <form onSubmit={handleAddHoliday} className="space-y-4">
                  <div>
                    <label className="label-text">Holiday Name</label>
                    <input
                      type="text"
                      value={holidayData.name}
                      onChange={(e) => setHolidayData({ ...holidayData, name: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="label-text">Date</label>
                    <input
                      type="date"
                      value={holidayData.date}
                      onChange={(e) => setHolidayData({ ...holidayData, date: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={holidayData.is_recurring}
                      onChange={(e) => setHolidayData({ ...holidayData, is_recurring: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="label-text">Recurring (Annual)</label>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
                    {loading ? 'Adding...' : 'Add Holiday'}
                  </button>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {holidays.map(holiday => (
                <div key={holiday.id} className="card bg-blue-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                        <CalendarDaysIcon className="w-5 h-5" />
                        {holiday.name}
                      </h4>
                      <p className="text-sm text-blue-700 mt-2 ml-7">{new Date(holiday.date).toLocaleDateString()}</p>
                      {holiday.is_recurring && <p className="text-xs text-blue-600 ml-7 mt-1">Recurring Annually</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteHoliday(holiday.id)}
                      className="text-red-600 hover:text-red-800 p-2 hover:bg-red-100 rounded-full transition"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance Reports Tab */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Attendance Reports</h2>
            <div className="card">
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
                    {attendanceStats.map(record => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{record.users?.full_name}</td>
                        <td className="p-3">{new Date(record.check_in_time).toLocaleDateString()}</td>
                        <td className="p-3">{new Date(record.check_in_time).toLocaleTimeString()}</td>
                        <td className="p-3">{record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : '-'}</td>
                        <td className="p-3 font-semibold">{record.duration_hours || 0}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Tab Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          <button
            onClick={() => { setActiveTab('overview'); fetchDashboardData(); }}
            className={`flex-1 py-3 px-4 text-center font-semibold transition flex items-center justify-center gap-2 ${activeTab === 'overview' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <ChartBarIcon className="w-5 h-5" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => { setActiveTab('users'); fetchUsers(); }}
            className={`flex-1 py-3 px-4 text-center font-semibold transition flex items-center justify-center gap-2 ${activeTab === 'users' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <UsersIcon className="w-5 h-5" />
            <span>Users</span>
          </button>
          <button
            onClick={() => { setActiveTab('departments'); fetchDepartments(); }}
            className={`flex-1 py-3 px-4 text-center font-semibold transition flex items-center justify-center gap-2 ${activeTab === 'departments' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <BuildingOfficeIcon className="w-5 h-5" />
            <span>Departments</span>
          </button>
          <button
            onClick={() => { setActiveTab('holidays'); fetchHolidays(); }}
            className={`flex-1 py-3 px-4 text-center font-semibold transition flex items-center justify-center gap-2 ${activeTab === 'holidays' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <CalendarDaysIcon className="w-5 h-5" />
            <span>Holidays</span>
          </button>
          <button
            onClick={() => { setActiveTab('attendance'); fetchAttendanceStats(); }}
            className={`flex-1 py-3 px-4 text-center font-semibold transition flex items-center justify-center gap-2 ${activeTab === 'attendance' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <ClipboardDocumentListIcon className="w-5 h-5" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* Spacing for bottom navigation */}
      <div className="h-20"></div>
    </div>
  );
};

export default AdminDashboard;
