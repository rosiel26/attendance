# Google Calendar Integration with Philippine Holidays

This directory contains the Google Calendar integration for the attendance management system, featuring Philippine holidays for 2026.

## 📁 Files

- **`GoogleCalendar.jsx`** - Main calendar component with FullCalendar integration
- **`CalendarPage.jsx`** - Standalone calendar page component
- **`calendar.css`** - Custom styling for the calendar
- **`CalendarIntegrationExample.jsx`** - Example code showing how to integrate the calendar into dashboards
- **`README.md`** - This file

## 🚀 Quick Start

### Option 1: Use as Standalone Page

The calendar is already set up as a standalone page accessible at `/calendar`:

```jsx
// Already configured in App.jsx
<Route path="/calendar" element={
  <ProtectedRoute>
    <CalendarPage />
  </ProtectedRoute>
} />
```

Navigate to: `http://localhost:5173/calendar`

### Option 2: Integrate into Dashboard

Add the calendar to any dashboard component:

```jsx
import GoogleCalendar from '../Calendar/GoogleCalendar';

function YourDashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <GoogleCalendar />
    </div>
  );
}
```

See [`CalendarIntegrationExample.jsx`](./CalendarIntegrationExample.jsx) for detailed examples.

## 🎨 Features

✅ **Philippine Holidays 2026** - Pre-configured with all major holidays
✅ **Multiple Views** - Month, week, and day views
✅ **Interactive** - Click on dates and events
✅ **Responsive** - Works on mobile and desktop
✅ **Google Calendar Integration** - Optional integration with Google Calendar API
✅ **Material-UI Styled** - Consistent with your app's design
✅ **Toast Notifications** - User feedback on interactions

## 🇵🇭 Philippine Holidays Included

The calendar includes these 2026 holidays:

| Date | Holiday |
|------|---------|
| Jan 1 | New Year's Day |
| Feb 17 | Chinese New Year |
| Feb 25 | EDSA People Power Revolution Anniversary |
| Apr 2 | Maundy Thursday |
| Apr 3 | Good Friday |
| Apr 4 | Black Saturday |
| Apr 9 | Araw ng Kagitingan (Day of Valor) |
| May 1 | Labor Day |
| Jun 12 | Independence Day |
| Jun 16 | Eid al-Adha |
| Aug 21 | Ninoy Aquino Day |
| Aug 31 | National Heroes Day |
| Nov 1 | All Saints Day |
| Nov 2 | All Souls Day |
| Nov 30 | Bonifacio Day |
| Dec 8 | Feast of the Immaculate Conception |
| Dec 24 | Christmas Eve |
| Dec 25 | Christmas Day |
| Dec 30 | Rizal Day |
| Dec 31 | New Year's Eve |

## 🔧 Configuration

### Basic Usage (No Google Calendar)

```jsx
<GoogleCalendar />
```

This will show the calendar with Philippine holidays only.

### With Google Calendar API

```jsx
<GoogleCalendar 
  googleApiKey="your-api-key"
  googleCalendarId="your-calendar-id@group.calendar.google.com"
/>
```

See [`GOOGLE_CALENDAR_SETUP.md`](../../../GOOGLE_CALENDAR_SETUP.md) for detailed setup instructions.

## 🎯 Usage Examples

### Example 1: Add to Employee Dashboard

```jsx
// In EmployeeDashboard.jsx
import GoogleCalendar from '../Calendar/GoogleCalendar';

const tabs = [
  { id: 'check-in', label: 'Clock In/Out', icon: '⏱️' },
  { id: 'company-calendar', label: 'Company Calendar', icon: '🗓️' }, // Add this
  // ... other tabs
];

const renderContent = () => {
  switch (activeTab) {
    case 'company-calendar':
      return <GoogleCalendar />;
    // ... other cases
  }
};
```

### Example 2: Add as Dashboard Widget

```jsx
import { Grid } from '@mui/material';
import GoogleCalendar from '../Calendar/GoogleCalendar';

function Dashboard() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={8}>
        {/* Other content */}
      </Grid>
      <Grid item xs={12} lg={4}>
        <GoogleCalendar />
      </Grid>
    </Grid>
  );
}
```

### Example 3: Standalone Calendar Page

```jsx
// Already created in CalendarPage.jsx
import CalendarPage from './components/Calendar/CalendarPage';

// Use in routing
<Route path="/calendar" element={<CalendarPage />} />
```

## 🎨 Customization

### Change Holiday Colors

Edit the color in [`GoogleCalendar.jsx`](./GoogleCalendar.jsx):

```jsx
const philippineHolidays2026 = [
  { title: "New Year's Day", date: '2026-01-01', color: '#your-color' },
  // ...
];
```

### Modify Calendar Appearance

Edit [`calendar.css`](./calendar.css) to customize:
- Colors
- Fonts
- Spacing
- Hover effects
- Responsive breakpoints

### Add Custom Events

```jsx
const customEvents = [
  {
    title: 'Company Meeting',
    date: '2026-03-15',
    color: '#388e3c'
  }
];

// In the component
setEvents([...philippineHolidays2026, ...customEvents]);
```

## 📱 Responsive Design

The calendar automatically adapts to different screen sizes:

- **Desktop**: Full calendar with all features
- **Tablet**: Optimized layout with touch support
- **Mobile**: Compact view with simplified controls

## 🔔 Event Handlers

### Date Click

```jsx
const handleDateClick = (arg) => {
  console.log('Date clicked:', arg.dateStr);
  // Add your custom logic here
};
```

### Event Click

```jsx
const handleEventClick = (info) => {
  console.log('Event clicked:', info.event.title);
  // Add your custom logic here
};
```

## 🌐 Google Calendar Integration

To integrate with Google Calendar:

1. **Get API Key**: Follow instructions in [`GOOGLE_CALENDAR_SETUP.md`](../../../GOOGLE_CALENDAR_SETUP.md)
2. **Add to .env.local**:
   ```env
   VITE_GOOGLE_CALENDAR_API_KEY=your_api_key
   VITE_GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
   ```
3. **Use in component**:
   ```jsx
   const googleApiKey = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY;
   const googleCalendarId = import.meta.env.VITE_GOOGLE_CALENDAR_ID;
   
   <GoogleCalendar 
     googleApiKey={googleApiKey}
     googleCalendarId={googleCalendarId}
   />
   ```

## 📦 Dependencies

The following packages are required (already installed):

```json
{
  "@fullcalendar/react": "^6.x",
  "@fullcalendar/daygrid": "^6.x",
  "@fullcalendar/interaction": "^6.x",
  "@fullcalendar/google-calendar": "^6.x",
  "@mui/material": "^5.x",
  "react-hot-toast": "^2.x"
}
```

## 🐛 Troubleshooting

### Calendar not displaying
- Check that all dependencies are installed
- Verify CSS imports are correct
- Check browser console for errors

### Google Calendar events not showing
- Verify API key is correct
- Check Calendar ID is correct
- Ensure calendar is public or properly shared
- Verify Google Calendar API is enabled

### Styling issues
- Make sure `calendar.css` is imported
- Check that FullCalendar CSS is loading
- Verify Material-UI theme is configured

## 📚 Resources

- [FullCalendar Documentation](https://fullcalendar.io/docs)
- [Google Calendar API](https://developers.google.com/calendar)
- [Material-UI](https://mui.com/)
- [Philippine Holidays](https://www.officeholidays.com/countries/philippines)

## 🔄 Updating for Future Years

To update holidays for 2027 or later:

1. Open [`GoogleCalendar.jsx`](./GoogleCalendar.jsx)
2. Update the `philippineHolidays2026` array
3. Rename to `philippineHolidays2027` (or appropriate year)
4. Update the dates accordingly

You can also fetch holidays from an API:
- [Calendarific API](https://calendarific.com/)
- [Abstract API](https://www.abstractapi.com/holidays-api)
- [Nager.Date API](https://date.nager.at/)

## 💡 Tips

1. **Performance**: The calendar is optimized for performance with lazy loading
2. **Accessibility**: All interactive elements are keyboard accessible
3. **Mobile**: Touch gestures are supported for navigation
4. **Printing**: The calendar can be printed with proper formatting
5. **Timezone**: The calendar respects the user's timezone

## 🤝 Contributing

To add new features or improvements:

1. Test thoroughly on different screen sizes
2. Ensure Philippine holidays are accurate
3. Update documentation
4. Follow the existing code style

## 📄 License

This component is part of the Attendance Management System.
