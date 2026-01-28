/**
 * EXAMPLE: How to integrate Google Calendar into Employee Dashboard
 * 
 * This file shows how to add the Google Calendar component to your existing dashboard.
 * Copy the relevant parts to your EmployeeDashboard.jsx or other dashboard components.
 */

import React, { useState } from 'react';
import Sidebar from '../Common/Sidebar';
import CheckInOut from '../Attendance/CheckInOut';
import AttendanceCalendar from '../Attendance/AttendanceCalendar';
import LeaveRequest from '../Leave/LeaveRequest';
import LeaveHistory from '../Leave/LeaveHistory';
import GoogleCalendar from '../Calendar/GoogleCalendar'; // Import the calendar component

const EmployeeDashboardWithCalendar = () => {
  const [activeTab, setActiveTab] = useState('check-in');

  // Add the calendar tab to your existing tabs
  const tabs = [
    { id: 'check-in', label: 'Clock In/Out', icon: '⏱️' },
    { id: 'calendar', label: 'Attendance Calendar', icon: '📅' },
    { id: 'company-calendar', label: 'Company Calendar', icon: '🗓️' }, // NEW TAB
    { id: 'leave-request', label: 'Request Leave', icon: '📝' },
    { id: 'leave-history', label: 'Leave History', icon: '📋' },
  ];

  // Get Google Calendar credentials (optional)
  const googleApiKey = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY;
  const googleCalendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID;

  const renderContent = () => {
    switch (activeTab) {
      case 'check-in':
        return <CheckInOut />;
      case 'calendar':
        return <AttendanceCalendar />;
      case 'company-calendar': // NEW CASE
        return (
          <GoogleCalendar 
            googleApiKey={googleApiKey}
            googleCalendarId={googleCalendarId}
          />
        );
      case 'leave-request':
        return <LeaveRequest />;
      case 'leave-history':
        return <LeaveHistory />;
      default:
        return <CheckInOut />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="flex flex-1">
        <div className="w-full md:w-64 hidden md:block">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
        </div>
        <main className="flex-1 p-4 md:p-8 max-w-7xl">
          {/* Mobile Sidebar */}
          <div className="md:hidden mb-6">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
          </div>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default EmployeeDashboardWithCalendar;

/**
 * ALTERNATIVE: Add calendar as a widget in the dashboard
 * 
 * If you want to show the calendar alongside other content instead of in a separate tab:
 */

import { Box, Grid } from '@mui/material';

const DashboardWithCalendarWidget = () => {
  const googleApiKey = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY;
  const googleCalendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID;

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Other dashboard widgets */}
        <Grid item xs={12} md={6}>
          <CheckInOut />
        </Grid>
        
        {/* Calendar Widget */}
        <Grid item xs={12} md={6}>
          <GoogleCalendar 
            googleApiKey={googleApiKey}
            googleCalendarId={googleCalendarId}
          />
        </Grid>

        {/* More widgets */}
        <Grid item xs={12}>
          <AttendanceCalendar />
        </Grid>
      </Grid>
    </Box>
  );
};

/**
 * STEPS TO INTEGRATE:
 * 
 * 1. Import the GoogleCalendar component:
 *    import GoogleCalendar from '../Calendar/GoogleCalendar';
 * 
 * 2. Add a new tab to your tabs array:
 *    { id: 'company-calendar', label: 'Company Calendar', icon: '🗓️' }
 * 
 * 3. Add a new case in your renderContent() switch statement:
 *    case 'company-calendar':
 *      return <GoogleCalendar />;
 * 
 * 4. (Optional) Set up Google Calendar API:
 *    - Follow instructions in GOOGLE_CALENDAR_SETUP.md
 *    - Add API key and Calendar ID to .env.local
 *    - Pass them as props to GoogleCalendar component
 * 
 * 5. The calendar will automatically show Philippine holidays for 2026
 */
