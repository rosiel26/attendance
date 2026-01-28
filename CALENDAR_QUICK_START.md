# 📅 Calendar Quick Start Guide

Get the Google Calendar with Philippine holidays up and running in 5 minutes!

## ✅ What's Already Done

The calendar integration is **already set up** and ready to use! Here's what's included:

- ✅ FullCalendar React component installed
- ✅ Philippine holidays for 2026 pre-configured
- ✅ Responsive design with Material-UI
- ✅ Standalone calendar page at `/calendar`
- ✅ Custom styling and interactions
- ✅ Toast notifications for user feedback

## 🚀 How to Use

### Option 1: View the Standalone Calendar Page

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the calendar page:
   ```
   http://localhost:5173/calendar
   ```

3. You'll see a full calendar with all Philippine holidays for 2026!

### Option 2: Add to Your Dashboard

To add the calendar to the Employee Dashboard (or any other dashboard):

1. Open `src/components/Dashboard/EmployeeDashboard.jsx`

2. Import the calendar component:
   ```jsx
   import GoogleCalendar from '../Calendar/GoogleCalendar';
   ```

3. Add a new tab:
   ```jsx
   const tabs = [
     { id: 'check-in', label: 'Clock In/Out', icon: '⏱️' },
     { id: 'calendar', label: 'Attendance Calendar', icon: '📅' },
     { id: 'company-calendar', label: 'Company Calendar', icon: '🗓️' }, // ADD THIS
     { id: 'leave-request', label: 'Request Leave', icon: '📝' },
     { id: 'leave-history', label: 'Leave History', icon: '📋' },
   ];
   ```

4. Add the calendar to the render function:
   ```jsx
   const renderContent = () => {
     switch (activeTab) {
       case 'check-in':
         return <CheckInOut />;
       case 'calendar':
         return <AttendanceCalendar />;
       case 'company-calendar': // ADD THIS CASE
         return <GoogleCalendar />;
       case 'leave-request':
         return <LeaveRequest />;
       case 'leave-history':
         return <LeaveHistory />;
       default:
         return <CheckInOut />;
     }
   };
   ```

5. Save and refresh - you're done! 🎉

## 🇵🇭 Philippine Holidays Included

The calendar automatically shows these 2026 holidays in red:

- New Year's Day (Jan 1)
- Chinese New Year (Feb 17)
- EDSA People Power Revolution (Feb 25)
- Maundy Thursday (Apr 2)
- Good Friday (Apr 3)
- Black Saturday (Apr 4)
- Day of Valor (Apr 9)
- Labor Day (May 1)
- Independence Day (Jun 12)
- Eid al-Adha (Jun 16)
- Ninoy Aquino Day (Aug 21)
- National Heroes Day (Aug 31)
- All Saints Day (Nov 1)
- All Souls Day (Nov 2)
- Bonifacio Day (Nov 30)
- Immaculate Conception (Dec 8)
- Christmas Eve (Dec 24)
- Christmas Day (Dec 25)
- Rizal Day (Dec 30)
- New Year's Eve (Dec 31)

## 🎯 Features You Get

### 1. Multiple Views
- **Month View** - See the whole month at a glance
- **Week View** - Focus on a single week
- **Day View** - Detailed daily schedule

### 2. Interactive
- Click on any date to see details
- Click on holidays to view information
- Navigate between months easily

### 3. Responsive
- Works perfectly on desktop, tablet, and mobile
- Touch-friendly on mobile devices

### 4. Beautiful Design
- Material-UI components
- Custom styling with hover effects
- Holiday highlighting in red
- Today's date highlighted in blue

## 🔧 Optional: Add Google Calendar Integration

Want to show events from a Google Calendar too? Follow these steps:

### Step 1: Get Google Calendar API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Google Calendar API"
4. Create an API key under "Credentials"

### Step 2: Add to Environment Variables

Add to your `.env.local` file:

```env
VITE_GOOGLE_CALENDAR_API_KEY=your_api_key_here
VITE_GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
```

### Step 3: Use in Component

```jsx
const googleApiKey = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY;
const googleCalendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID;

<GoogleCalendar 
  googleApiKey={googleApiKey}
  googleCalendarId={googleCalendarId}
/>
```

For detailed instructions, see [`GOOGLE_CALENDAR_SETUP.md`](./GOOGLE_CALENDAR_SETUP.md)

## 📁 Files Created

Here's what was added to your project:

```
src/components/Calendar/
├── GoogleCalendar.jsx              # Main calendar component
├── CalendarPage.jsx                # Standalone page
├── calendar.css                    # Custom styles
├── CalendarIntegrationExample.jsx  # Integration examples
└── README.md                       # Detailed documentation

GOOGLE_CALENDAR_SETUP.md            # Google API setup guide
CALENDAR_QUICK_START.md             # This file
```

## 🎨 Customization

### Change Holiday Colors

Edit `src/components/Calendar/GoogleCalendar.jsx`:

```jsx
const philippineHolidays2026 = [
  { title: "New Year's Day", date: '2026-01-01', color: '#your-color' },
  // ...
];
```

### Add Custom Events

```jsx
const customEvents = [
  {
    title: 'Company Meeting',
    date: '2026-03-15',
    color: '#388e3c'
  }
];
```

### Modify Styles

Edit `src/components/Calendar/calendar.css` to customize colors, fonts, spacing, etc.

## 🐛 Troubleshooting

### Calendar not showing?

1. Make sure the dev server is running: `npm run dev`
2. Check browser console for errors
3. Verify all dependencies are installed: `npm install`

### Holidays not displaying?

1. Check that the dates are in the correct format: `YYYY-MM-DD`
2. Verify the color property is set
3. Look for JavaScript errors in the console

### Styling looks off?

1. Make sure `calendar.css` is imported in `GoogleCalendar.jsx`
2. Check that Material-UI is properly configured
3. Clear browser cache and refresh

## 📚 Learn More

- **Detailed Documentation**: [`src/components/Calendar/README.md`](./src/components/Calendar/README.md)
- **Google API Setup**: [`GOOGLE_CALENDAR_SETUP.md`](./GOOGLE_CALENDAR_SETUP.md)
- **Integration Examples**: [`src/components/Calendar/CalendarIntegrationExample.jsx`](./src/components/Calendar/CalendarIntegrationExample.jsx)

## 🎉 You're All Set!

The calendar is ready to use. Just navigate to `/calendar` or integrate it into your dashboard!

### Quick Test

1. Start the server: `npm run dev`
2. Go to: `http://localhost:5173/calendar`
3. You should see a calendar with Philippine holidays highlighted in red!

---

**Need Help?** Check the detailed documentation in the files listed above, or refer to:
- [FullCalendar Docs](https://fullcalendar.io/docs)
- [Google Calendar API](https://developers.google.com/calendar)
