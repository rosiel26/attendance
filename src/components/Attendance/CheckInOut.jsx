  import React, { useEffect, useState } from "react";
import { useAuthStore } from "../../stores/authStore";
import toast from "react-hot-toast";
import {
  checkIn,
  checkOut,
  getTodayAttendance,
} from "../../services/supabaseService";

const CheckInOut = () => {
  const { user } = useAuthStore();
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchTodayStatus();
    }
  }, [user]);

  const fetchTodayStatus = async () => {
    try {
      if (!user?.id) return;

      const { data, error } = await getTodayAttendance(user.id);

      if (error) {
        console.error("Error fetching today attendance:", error);
        return;
      }

      if (data && data.length > 0) {
        // Get the most recent attendance record for today
        const latestRecord = data[0];
        setCheckedIn(latestRecord.status === "checked-in");
        setCheckInTime(latestRecord.check_in_time);
      } else {
        // No attendance record for today
        setCheckedIn(false);
        setCheckInTime(null);
      }
    } catch (error) {
      console.error("Error fetching today status:", error);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await checkIn(user.id);

      if (error) {
        throw error;
      }

      // Update local state
      setCheckedIn(true);
      setCheckInTime(new Date().toISOString());

      toast.success("✓ Checked in successfully!");
    } catch (error) {
      console.error("Check-in error:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const { data, error } = await checkOut(user.id);

      if (error) {
        throw error;
      }

      // Update local state
      setCheckedIn(false);

      toast.success("✓ Checked out successfully!");
    } catch (error) {
      console.error("Check-out error:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-gradient-to-br from-blue-50 to-indigo-100 text-center">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Clock In/Out</h2>

      <div className="mb-8">
        <div className="text-7xl font-bold text-blue-600 font-mono mb-2">
          {currentTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
        <div className="text-xl text-gray-600 font-medium">
          {currentTime.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {checkInTime && (
        <div className="mb-6 p-4 bg-white rounded-lg">
          <p className="text-gray-700">
            Check-in Time:{" "}
            <span className="font-bold text-green-600">
              {new Date(checkInTime).toLocaleTimeString()}
            </span>
          </p>
        </div>
      )}

      <button
        onClick={checkedIn ? handleCheckOut : handleCheckIn}
        disabled={loading}
        className={`w-full py-6 rounded-lg font-bold text-white text-xl transition-all disabled:opacity-50 ${
          checkedIn
            ? "bg-red-500 hover:bg-red-600 active:scale-95"
            : "bg-green-500 hover:bg-green-600 active:scale-95"
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin h-5 w-5 border-b-2 border-white"></div>
            Processing...
          </span>
        ) : checkedIn ? (
          "CHECK OUT"
        ) : (
          "CHECK IN"
        )}
      </button>

      <div className="mt-8 p-4 bg-white rounded-lg">
        <div className="text-sm text-gray-600 mb-2">Current Status</div>
        <div
          className={`text-lg font-bold ${checkedIn ? "text-green-600" : "text-gray-600"}`}
        >
          {checkedIn ? "✓ Checked In" : "○ Checked Out"}
        </div>
      </div>
    </div>
  );
};

export default CheckInOut;
