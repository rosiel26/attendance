# Google Calendar Integration Setup Guide

This guide will help you integrate Google Calendar API with your React application to display calendars with Philippine holidays.

## Features

- ✅ Display calendar with month, week, and day views
- ✅ Philippine holidays pre-configured for 2026
- ✅ Google Calendar API integration (optional)
- ✅ Interactive date and event clicking
- ✅ Responsive design
- ✅ Material-UI styling

## Installation

The required packages have already been installed:

```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/interaction @fullcalendar/google-calendar
```

## Google Calendar API Setup (Optional)

If you want to integrate with Google Calendar API to show additional events:

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### Step 2: Create API Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key
4. (Recommended) Restrict the API key:
   - Click on the API key to edit
   - Under "API restrictions", select "Restrict key"
   - Choose "Google Calendar API"
   - Under "Website restrictions", add your domain

### Step 3: Add API Key to Environment Variables

Add the following to your `.env.local` file:

```env
VITE_GOOGLE_CALENDAR_API_KEY=your_api_key_here
VITE_GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
```

To find your Calendar ID:
1. Go to [Google Calendar](https://calendar.google.com/)
2. Click on the calendar you want to integrate
3. Go to "Settings and sharing"
4. Scroll down to "Integrate calendar"
5. Copy the "Calendar ID"

### Step 4: Make Calendar Public (if needed)

If you want to display a specific calendar:
1. Go to Calendar Settings
2. Under "Access permissions", check "Make available to public"
3. Choose "See all event details"

## Usage

### Basic Usage (Philippine Holidays Only)

```jsx
import GoogleCalendar from './components/Calendar/GoogleCalendar';

function App() {
  return (
    <div>
      <GoogleCalendar />
    </div>
  );
}
```

### With Google Calendar Integration

```jsx
import GoogleCalendar from './components/Calendar/GoogleCalendar';

function App() {
  const googleApiKey = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY;
  const googleCalendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID;

  return (
    <div>
      <GoogleCalendar 
        googleApiKey={googleApiKey}
        googleCalendarId={googleCalendarId}
      />
    </div>
  );
}
```

### Integration in Dashboard

You can add the calendar to any dashboard component:

```jsx
import GoogleCalendar from '../Calendar/GoogleCalendar';

function EmployeeDashboard() {
  return (
    <div>
      <h1>Employee Dashboard</h1>
      <GoogleCalendar />
    </div>
  );
}
```

## Philippine Holidays 2026

The following holidays are pre-configured:

- New Year's Day (January 1)
- Chinese New Year (February 17)
- EDSA People Power Revolution Anniversary (February 25)
- Maundy Thursday (April 2)
- Good Friday (April 3)
- Black Saturday (April 4)
- Araw ng Kagitingan/Day of Valor (April 9)
- Labor Day (May 1)
- Independence Day (June 12)
- Eid al-Adha (June 16)
- Ninoy Aquino Day (August 21)
- National Heroes Day (August 31)
- All Saints Day (November 1)
- All Souls Day (November 2)
- Bonifacio Day (November 30)
- Feast of the Immaculate Conception (December 8)
- Christmas Eve (December 24)
- Christmas Day (December 25)
- Rizal Day (December 30)
- New Year's Eve (December 31)

## Updating Holidays for Future Years

To update holidays for future years, edit the `philippineHolidays2026` array in `src/components/Calendar/GoogleCalendar.jsx`:

```javascript
const philippineHolidays2027 = [
  { title: "New Year's Day", date: '2027-01-01', color: '#d32f2f' },
  // Add more holidays...
];
```

## Customization

### Change Calendar Colors

Edit the color values in the events array:

```javascript
{ title: 'Holiday Name', date: '2026-01-01', color: '#your-color' }
```

### Modify Calendar View

Change the initial view in the FullCalendar component:

```javascript
initialView="dayGridMonth" // Options: dayGridMonth, dayGridWeek, dayGridDay
```

### Add Custom Events

You can add custom events to the calendar:

```javascript
const customEvents = [
  {
    title: 'Company Event',
    date: '2026-03-15',
    color: '#388e3c'
  }
];

setEvents([...philippineHolidays2026, ...customEvents]);
```

## Styling

The calendar uses custom CSS located in `src/components/Calendar/calendar.css`. You can modify:

- Colors
- Fonts
- Spacing
- Hover effects
- Responsive breakpoints

## Features Explained

### Date Click Handler

When a user clicks on a date, a toast notification appears:

```javascript
const handleDateClick = (arg) => {
  toast.success(`Date clicked: ${arg.dateStr}`);
};
```

### Event Click Handler

When a user clicks on an event, details are shown:

```javascript
const handleEventClick = (info) => {
  toast.info(`${info.event.title}`);
};
```

### Holiday Highlighting

Days with holidays are highlighted with a red background:

```javascript
dayCellClassNames={(arg) => {
  const isHoliday = philippineHolidays2026.some(
    holiday => holiday.date === arg.date.toISOString().split('T')[0]
  );
  return isHoliday ? 'holiday-cell' : '';
}}
```

## Troubleshooting

### Calendar Not Displaying

1. Check that all dependencies are installed
2. Verify CSS imports are correct
3. Check browser console for errors

### Google Calendar Events Not Showing

1. Verify API key is correct
2. Check that Calendar ID is correct
3. Ensure calendar is public or properly shared
4. Check API key restrictions
5. Verify Google Calendar API is enabled in Google Cloud Console

### Styling Issues

1. Make sure `calendar.css` is imported
2. Check that FullCalendar CSS is loading
3. Verify Material-UI theme is configured

## API Reference

### GoogleCalendar Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| googleApiKey | string | No | Google Calendar API key |
| googleCalendarId | string | No | Google Calendar ID to display |

## Resources

- [FullCalendar Documentation](https://fullcalendar.io/docs)
- [Google Calendar API Documentation](https://developers.google.com/calendar)
- [Material-UI Documentation](https://mui.com/)

## Support

For issues or questions, refer to:
- FullCalendar: https://fullcalendar.io/docs
- Google Calendar API: https://developers.google.com/calendar/api/guides/overview
