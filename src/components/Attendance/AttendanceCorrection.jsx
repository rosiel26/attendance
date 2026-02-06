import React, { useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import { requestAttendanceCorrection } from "../../services/supabaseService";
import { supabase } from "../../config/supabase";
import toast from "react-hot-toast";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DescriptionIcon from "@mui/icons-material/Description";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

const AttendanceCorrection = () => {
  const { user } = useAuthStore();
  const [attendanceDate, setAttendanceDate] = useState("");
  const [missingType, setMissingType] = useState("check_out");
  const [requestedTime, setRequestedTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!attendanceDate || !requestedTime || !reason.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    let attendanceId = null;
    let originalTime = null;
    try {
      const startOfDay = new Date(attendanceDate + "T00:00:00.000Z");
      const endOfDay = new Date(attendanceDate + "T23:59:59.999Z");
      const { data: existingAttendance, error } = await supabase
        .from("attendance")
        .select("id, check_in_time, check_out_time")
        .eq("user_id", user.id)
        .gte("check_in_time", startOfDay.toISOString())
        .lt("check_in_time", endOfDay.toISOString())
        .maybeSingle();
      if (error) throw error;
      if (existingAttendance) {
        attendanceId = existingAttendance.id;
        // Store the original time (extract time portion from timestamp)
        const rawTime = missingType === "check_in" 
          ? existingAttendance.check_in_time 
          : existingAttendance.check_out_time;
        if (rawTime) {
          const timeDate = new Date(rawTime);
          originalTime = timeDate.toTimeString().split(" ")[0]; // "HH:MM:SS"
        }
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
        originalTime,
      };
      await requestAttendanceCorrection(correctionData);
      toast.success("Correction request submitted successfully");
      setIsSubmitted(true);
      // reset form after delay
      setTimeout(() => {
        setAttendanceDate("");
        setRequestedTime("");
        setReason("");
        setIsSubmitted(false);
      }, 3000);
    } catch (error) {
      toast.error("Failed to submit: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Request Submitted!
          </h2>
          <p className="text-gray-600">
            Your attendance correction request has been sent for approval.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            You will be notified once it's reviewed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <CalendarTodayIcon className="text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">
          Request Attendance Correction
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date Field */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
            <CalendarTodayIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Correction Type Dropdown */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Correction Type <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={missingType}
              onChange={(e) => setMissingType(e.target.value)}
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white transition-all cursor-pointer"
            >
              <option value="check_in">Missing Check-in</option>
              <option value="check_out">Missing Check-out</option>
            </select>
            <ArrowDropDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Select whether you missed your check-in or check-out time
          </p>
        </div>

        {/* Requested Time */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Requested Time <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="time"
              value={requestedTime}
              onChange={(e) => setRequestedTime(e.target.value)}
              className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
            <AccessTimeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            Reason <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              rows="4"
              placeholder="Please explain the reason for the correction..."
              required
            ></textarea>
            <DescriptionIcon className="absolute right-3 top-3 text-gray-400" />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl"
          }`}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Submitting...
            </>
          ) : (
            <>
              <SendIcon />
              Submit Request
            </>
          )}
        </button>

        {/* Info Note */}
        <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-600 text-xs">i</span>
          </div>
          <p>
            Your correction request will be sent to your manager for approval.
            You can only submit one request per date.
          </p>
        </div>
      </form>
    </div>
  );
};

export default AttendanceCorrection;
