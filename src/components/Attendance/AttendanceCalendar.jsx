import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";
import { supabase } from "../../config/supabase";
import {
  getLocalDateString,
  getAttendanceStorageKey,
} from "../../utils/dateHelpers";
import {
  getHolidaysForMonth,
  getHolidayInfo,
} from "../../utils/philippineHolidays";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CelebrationIcon from "@mui/icons-material/Celebration";
import CancelIcon from "@mui/icons-material/Cancel";
import AssessmentIcon from "@mui/icons-material/Assessment";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import toast from "react-hot-toast";
import {
  getAttendanceRecords,
  requestAttendanceCorrection,
} from "../../services/supabaseService";

const AttendanceCalendar = () => {
  const { user } = useAuthStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});
  const [correctionsData, setCorrectionsData] = useState([]);
  const [holidays, setHolidays] = useState([]);

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();

  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        await loadAttendanceData();
      }
      loadHolidays();
    };
    loadData();
  }, [user, currentMonth]);

  const loadHolidays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthHolidays = getHolidaysForMonth(year, month);
    setHolidays(monthHolidays);
  };

  const loadAttendanceData = async () => {
    try {
      if (!user?.id) return;

      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();

      // Get start and end dates for the current month
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      const { data, error } = await getAttendanceRecords(
        user.id,
        startDate,
        endDate,
      );

      if (error) {
        console.error("Error fetching attendance records:", error);
        return;
      }

      // Organize data by day
      const attendanceByDay = {};
      if (data) {
        data.forEach((record) => {
          const recordDate = new Date(record.check_in_time);
          const day = recordDate.getDate();
          attendanceByDay[day] = {
            checkInTime: record.check_in_time,
            checkOutTime: record.check_out_time,
            checkedIn: record.status === "checked-in",
            duration_hours: record.duration_hours,
            id: record.id,
          };
        });
      }

      setAttendanceData(attendanceByDay);

      // Load corrections data
      const { data: corrections, error: correctionsError } = await supabase
        .from("attendance_corrections")
        .select(
          "*, users!attendance_corrections_approved_by_fkey(id, full_name)",
        )
        .eq("user_id", user.id)
        .eq("status", "approved");

      if (correctionsError) {
        console.error("Error loading corrections data:", correctionsError);
      } else {
        setCorrectionsData(corrections || []);
      }
    } catch (error) {
      console.error("Error loading attendance data:", error);
    }
  };

  const getDayStatus = (day) => {
    if (!day) return null;

    const dayDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    const dateStr = getLocalDateString(dayDate);
    const holidayInfo = getHolidayInfo(dateStr);

    // Check if this day is a holiday
    if (holidayInfo) {
      return "holiday";
    }

    const attendance = attendanceData[day];
    const today = new Date();

    // Check if this is a past day (before today)
    const isPastDay =
      dayDate < today && dayDate.toDateString() !== today.toDateString();

    if (!attendance) {
      // If it's a past day with no attendance record, mark as absent
      return isPastDay ? "absent" : "no-data";
    }

    if (attendance.checkedIn && !attendance.checkOutTime) {
      return "checked-in";
    } else if (attendance.checkOutTime) {
      return "completed";
    }

    return isPastDay ? "absent" : "no-data";
  };

  const getDayClassName = (day) => {
    if (!day) return "bg-gray-50 h-24";

    const status = getDayStatus(day);
    const today = new Date();
    const isToday =
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear();

    let baseClass =
      "h-24 flex flex-col items-center justify-center rounded-lg font-semibold cursor-pointer transition-all p-2";

    if (isToday) {
      baseClass += " ring-2 ring-blue-500";
    }

    switch (status) {
      case "completed":
        return `${baseClass} bg-green-100 text-green-900 hover:bg-green-200`;
      case "checked-in":
        return `${baseClass} bg-yellow-100 text-yellow-900 hover:bg-yellow-200`;
      case "holiday":
        return `${baseClass} bg-purple-100 text-purple-900 hover:bg-purple-200`;
      case "absent":
        return `${baseClass} bg-red-100 text-red-900 hover:bg-red-200`;
      default:
        return `${baseClass} bg-gray-100 text-gray-600 hover:bg-gray-200`;
    }
  };

  const getDayContent = (day) => {
    if (!day) return null;

    const dayDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    const dateStr = getLocalDateString(dayDate);
    const holidayInfo = getHolidayInfo(dateStr);
    const attendance = attendanceData[day];
    const status = getDayStatus(day);

    // Find approved correction for this day
    const approvedCorrection = correctionsData.find((correction) => {
      const correctionDate = new Date(correction.attendance_date);
      return correctionDate.toDateString() === dayDate.toDateString();
    });

    let content = (
      <div className="flex flex-col items-center text-center">
        <span className="text-lg font-bold">{day}</span>
      </div>
    );

    // Show holiday info
    if (holidayInfo) {
      content = (
        <div className="flex flex-col items-center text-center">
          <span className="text-lg font-bold">{day}</span>
          <CelebrationIcon sx={{ fontSize: 14, mt: 0.5 }} />
          <span className="text-[0.55rem] mt-0.5 leading-tight px-1">
            {holidayInfo.name.length > 12
              ? holidayInfo.name.substring(0, 10) + "..."
              : holidayInfo.name}
          </span>
        </div>
      );
    }
    // Show attendance info
    else if (
      attendance &&
      (attendance.checkInTime || attendance.checkOutTime)
    ) {
      // Check if this is an incomplete record (check-in but no check-out)
      let correctedCheckInTime = attendance.checkInTime;
      let correctedCheckOutTime = attendance.checkOutTime;
      if (approvedCorrection) {
        if (approvedCorrection.missing_type === "check_in") {
          correctedCheckInTime = new Date(
            `${dayDate.toISOString().split("T")[0]}T${approvedCorrection.requested_time}`,
          );
        }
        if (approvedCorrection.missing_type === "check_out") {
          correctedCheckOutTime = new Date(
            `${dayDate.toISOString().split("T")[0]}T${approvedCorrection.requested_time}`,
          );
        }
      }
      const checkInFormatted = formatTime(correctedCheckInTime);
      const checkOutFormatted = formatTime(correctedCheckOutTime);
      const hoursWorked = calculateHoursWorked(
        correctedCheckInTime,
        correctedCheckOutTime,
      );
      const isIncomplete = correctedCheckInTime && !correctedCheckOutTime;

      content = (
        <div className="flex flex-col items-center text-center">
          <span className="text-lg font-bold">{day}</span>
          <div className="text-[0.6rem] mt-0.5 leading-tight">
            {checkInFormatted && <div>in-{checkInFormatted}</div>}
            {checkOutFormatted ? (
              <div>out-{checkOutFormatted}</div>
            ) : (
              <div className="text-red-500">out-❌ Missing</div>
            )}
            {hoursWorked && (
              <div className="text-[0.55rem] mt-0.5 font-medium">
                {hoursWorked.hours}hr {hoursWorked.minutes}min
              </div>
            )}
            {isIncomplete && (
              <div className="text-[0.5rem] mt-1 text-orange-600 font-medium leading-tight">
                Status: INCOMPLETE
              </div>
            )}
            {approvedCorrection && (
              <div className="text-[0.5rem] mt-1 text-green-600 font-medium leading-tight">
                Status: APPROVED BY{" "}
                {approvedCorrection.users?.full_name || "Manager"}
              </div>
            )}
          </div>
          {status === "completed" && (
            <CheckCircleIcon sx={{ fontSize: 12, mt: 0.5 }} />
          )}
          {status === "checked-in" && (
            <AccessTimeIcon sx={{ fontSize: 12, mt: 0.5 }} />
          )}
        </div>
      );
    }
    // Show status icons for absent
    else if (status === "absent") {
      content = (
        <div className="flex flex-col items-center text-center">
          <span className="text-lg font-bold">{day}</span>
          <CancelIcon sx={{ fontSize: 14, mt: 0.5 }} />
        </div>
      );
    }

    return content;
  };

  const calculateStats = () => {
    let present = 0;
    let checkedIn = 0;
    let absent = 0;

    const today = new Date();
    const currentDay = today.getDate();
    const isCurrentMonth =
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear();

    // Only count days up to today if it's the current month
    const daysToCount = isCurrentMonth ? currentDay : daysInMonth;

    for (let day = 1; day <= daysToCount; day++) {
      const status = getDayStatus(day);
      if (status === "completed") {
        present++;
      } else if (status === "checked-in") {
        checkedIn++;
      } else {
        // Only count as absent if it's a past day
        const date = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          day,
        );
        if (date < today && date.toDateString() !== today.toDateString()) {
          absent++;
        }
      }
    }

    return { present, checkedIn, absent };
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const calculateHoursWorked = (checkInTime, checkOutTime) => {
    if (!checkInTime || !checkOutTime) return null;

    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);
    const diffMs = checkOut - checkIn;

    if (diffMs <= 0) return null;

    // Round to nearest minute for better user experience
    const totalMinutes = Math.round(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return { hours, minutes };
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return "";
    const date = new Date(dateTime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    const displayHours = hours % 12 || 12;
    return `${displayHours}${minutes > 0 ? `:${minutes.toString().padStart(2, "0")}` : ""}${ampm}`;
  };

  const handleCloseCorrectionModal = () => {
    setCorrectionModalOpen(false);
    setSelectedDayForCorrection(null);
    setCorrectionReason("Forgot to time out");
    setCorrectOutTime("");
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const stats = calculateStats();

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6">Attendance Calendar</h2>

      <div className="bg-white p-6 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth(-1)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            ← Previous
          </button>
          <div className="text-center text-xl font-bold">{monthName}</div>
          <button
            onClick={() => navigateMonth(1)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Next →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center font-bold text-gray-600 py-2">
              {day}
            </div>
          ))}

          {days.map((day, idx) => {
            if (!day) {
              return <div key={idx} className="bg-gray-50"></div>;
            }

            const dayDate = new Date(
              currentMonth.getFullYear(),
              currentMonth.getMonth(),
              day,
            );
            const dateStr = getLocalDateString(dayDate);
            const holidayInfo = getHolidayInfo(dateStr);
            const attendance = attendanceData[day];

            let tooltipText = "";
            if (holidayInfo) {
              tooltipText = `${holidayInfo.name} (${holidayInfo.type === "regular" ? "Regular Holiday" : "Special Holiday"})`;
            }
            if (attendance) {
              if (tooltipText) tooltipText += "\n";
              tooltipText += `Check-in: ${new Date(attendance.checkInTime).toLocaleTimeString()}`;
              if (attendance.checkOutTime) {
                tooltipText += `\nCheck-out: ${new Date(attendance.checkOutTime).toLocaleTimeString()}`;
              }
            }

            return (
              <div
                key={idx}
                className={getDayClassName(day)}
                title={tooltipText}
              >
                {getDayContent(day)}
              </div>
            );
          })}
        </div>

        <div className="mt-6 space-y-3">
          <div className="p-4 bg-blue-50 rounded-lg flex items-center gap-2">
            <AssessmentIcon className="text-blue-600" />
            <p className="text-gray-700">
              <strong>Present:</strong> {stats.present} days |
              <strong className="ml-2">Currently Checked In:</strong>{" "}
              {stats.checkedIn} |<strong className="ml-2">Absent:</strong>{" "}
              {stats.absent} days
            </p>
          </div>

          <div className="flex gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span>Checked In</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
              <span>Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span>No Record</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
