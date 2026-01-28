import React, { useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import { requestAttendanceCorrection } from "../../services/supabaseService";
import { supabase } from "../../config/supabase";
import toast from "react-hot-toast";

const AttendanceCorrection = () => {
  const { user } = useAuthStore();
  const [attendanceDate, setAttendanceDate] = useState("");
  const [missingType, setMissingType] = useState("check_out");
  const [requestedTime, setRequestedTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!attendanceDate || !requestedTime || !reason.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    let attendanceId = null;
    try {
      const startOfDay = new Date(attendanceDate + "T00:00:00.000Z");
      const endOfDay = new Date(attendanceDate + "T23:59:59.999Z");
      const { data: existingAttendance, error } = await supabase
        .from("attendance")
        .select("id")
        .eq("user_id", user.id)
        .gte("check_in_time", startOfDay.toISOString())
        .lt("check_in_time", endOfDay.toISOString())
        .maybeSingle();
      if (error) throw error;
      if (existingAttendance) {
        attendanceId = existingAttendance.id;
      }
    } catch (error) {
      console.error("Error finding attendance:", error);
      // continue
    }

    // Check if there's already a pending correction for this date
    try {
      const { data: existingCorrection, error: corrError } = await supabase
        .from("attendance_corrections")
        .select("id")
        .eq("user_id", user.id)
        .eq("attendance_date", attendanceDate)
        .neq("status", "rejected")
        .maybeSingle();
      if (corrError) throw corrError;
      if (existingCorrection) {
        toast.error("A correction request already exists for this date.");
        return;
      }
    } catch (error) {
      console.error("Error checking existing corrections:", error);
      // continue
    }

    setLoading(true);
    try {
      const correctionData = {
        userId: user.id,
        attendanceDate,
        missingType,
        requestedTime,
        reason,
        attendanceId,
      };
      await requestAttendanceCorrection(correctionData);
      toast.success("Correction request submitted successfully");
      // reset form
      setAttendanceDate("");
      setRequestedTime("");
      setReason("");
    } catch (error) {
      toast.error("Failed to submit: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-gradient-to-br from-blue-50 to-indigo-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Request Attendance Correction
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correction Type
          </label>
          <select
            value={missingType}
            onChange={(e) => setMissingType(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="check_in">Missing Check-in</option>
            <option value="check_out">Missing Check-out</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Requested Time
          </label>
          <input
            type="time"
            value={requestedTime}
            onChange={(e) => setRequestedTime(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2 border rounded"
            rows="3"
            placeholder="Please explain the reason for the correction"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
};

export default AttendanceCorrection;
