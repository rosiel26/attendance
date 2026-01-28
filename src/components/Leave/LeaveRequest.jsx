import React, { useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import { useLeaveStore } from "../../stores/leaveStore";
import { requestLeave } from "../../services/supabaseService";
import toast from "react-hot-toast";

const LeaveRequest = () => {
  const { userProfile } = useAuthStore();
  const { fetchLeaveRequests } = useLeaveStore();
  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!userProfile?.id) {
        throw new Error("User not authenticated");
      }

      // Validate dates
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      if (endDate < startDate) {
        throw new Error("End date cannot be before start date");
      }

      // Prepare leave request data
      const leaveData = {
        user_id: userProfile.id,
        leave_type: formData.leaveType,
        start_date: formData.startDate,
        end_date: formData.endDate,
        reason: formData.reason || null,
      };

      // Submit to database
      const { error: submitError } = await requestLeave(leaveData);

      if (submitError) {
        throw submitError;
      }

      // Refresh leave requests
      await fetchLeaveRequests(userProfile.id, userProfile.role);

      // Show success message
      toast.success("Leave request submitted successfully!");

      // Reset form
      setFormData({
        leaveType: "",
        startDate: "",
        endDate: "",
        reason: "",
      });
    } catch (error) {
      console.error("Leave request error:", error);
      setError(error.message || "Failed to submit leave request");
      toast.error(error.message || "Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Request Leave</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Leave Type
          </label>
          <select
            name="leaveType"
            value={formData.leaveType}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            required
          >
            <option value="">Select leave type...</option>
            <option value="sick">Sick Leave</option>
            <option value="personal">Personal Leave</option>
            <option value="casual">Casual Leave</option>
            <option value="paid">Paid Leave</option>
            <option value="unpaid">Unpaid Leave</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              min={formData.startDate || new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Reason
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            rows="4"
            placeholder="Enter reason for leave..."
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Leave Request"}
        </button>
      </form>
    </div>
  );
};

export default LeaveRequest;
