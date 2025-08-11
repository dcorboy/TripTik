# Date and Time Handling in Trip Manager

## Overview

The application now supports comprehensive date and time handling with timezone awareness, proper UTC storage, and chronological ordering.

## Frontend Components

### DateTimePicker Component
Located at `src/components/DateTimePicker.jsx`, this component provides:
- Date and time selection with timezone awareness
- Integration with the application's timezone system
- Real-time validation of datetime inputs
- Consistent formatting for display and storage

### TimezonePicker Component
Located at `src/components/TimezonePicker.jsx`, this component provides:
- Timezone selection from a comprehensive list
- Integration with the `src/config/timezone.js` configuration
- Automatic timezone detection and conversion
- User-friendly timezone display

### EditableField Component
Located at `src/components/EditableField.jsx`, this component provides:
- Inline editing for trip and leg properties
- Real-time updates to the database
- Validation and error handling
- Consistent user experience across the application

## Utility Functions

### Date Formatters (`src/utils/dateFormatters.js`)
Provides utility functions for:
- Formatting dates for display
- Converting between timezones
- Validating datetime inputs
- Generating human-readable date strings

### Location Timezone (`src/utils/locationTimezone.js`)
Handles timezone mapping for:
- Airport codes and their associated timezones
- Automatic timezone detection based on location
- Timezone conversion for travel itineraries

### Trip Analyzer (`src/utils/tripAnalyzer.js`)
Provides analysis functions for:
- Calculating trip durations
- Determining layover times
- Chronological ordering of legs
- Timezone-aware trip planning

## Database Schema

### Legs Table
- `departure_datetime`: ISO 8601 format with timezone (e.g., "2024-06-15T06:30:00.000Z")
- `arrival_datetime`: ISO 8601 format with timezone (e.g., "2024-06-15T09:45:00.000Z")

### Clean Implementation
- Only `departure_datetime` and `arrival_datetime` columns are used
- No legacy date-only fields
- Simplified schema with consistent datetime handling

## Date Storage Format

### UTC Storage
All datetime values are stored in UTC (ISO 8601 format) to ensure:
- Consistent timezone handling
- Proper chronological ordering
- No daylight saving time issues
- Global travel support

### Example Formats
```javascript
// Valid datetime strings for storage
"2024-06-15T06:30:00.000Z"  // UTC time
"2024-06-15T10:30:00-04:00" // EDT time with offset
"2024-06-15T14:30:00+00:00" // UTC time with explicit offset
```

## SQLite ORDER BY Compatibility

SQLite's `ORDER BY` works perfectly with ISO 8601 datetime strings because:
- They sort lexicographically in chronological order
- No special date parsing required
- Consistent across all timezones

### Example Query
```sql
SELECT * FROM legs WHERE trip_id = 1 ORDER BY departure_datetime;
```

## Frontend Display

### Timezone Display
The frontend displays times in the user's local timezone with:
- Date and time information
- Timezone abbreviation
- Proper formatting for readability

### Example Output
```
Departure: IAD
Jun 15, 2024, 6:30 AM EDT

Arrival: MCO  
Jun 15, 2024, 9:45 AM EDT
```

## Database Utility Functions

### `formatDateTimeForSQL(dateTime, timezone)`
Converts various input formats to ISO 8601 for storage.

### `parseDateTimeFromSQL(dateTimeString)`
Converts stored datetime back to JavaScript Date object.

### `localToUTC(localDateTime, timezone)`
Converts local datetime to UTC for storage.

### `utcToLocal(utcDateTime, timezone)`
Converts UTC datetime to local timezone for display.

### `isValidDateTime(dateTimeString)`
Validates datetime format.

## Database Schema

### Clean Schema
The legs table uses only datetime fields:
```sql
CREATE TABLE legs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  departure_datetime TEXT,  -- ISO 8601 format with timezone
  departure_location TEXT,
  arrival_datetime TEXT,    -- ISO 8601 format with timezone
  arrival_location TEXT,
  carrier TEXT,
  trip_id INTEGER,
  FOREIGN KEY (trip_id) REFERENCES trips (id)
);
```

### Sample Data
```sql
INSERT INTO legs (name, departure_datetime, departure_location, arrival_datetime, arrival_location, carrier, trip_id)
VALUES ('Flight to Orlando', '2024-06-15T06:30:00.000Z', 'IAD', '2024-06-15T09:45:00.000Z', 'MCO', 'UA237', 1);
```

## Benefits

1. **Accurate Flight Times**: Store actual departure and arrival times
2. **Timezone Support**: Handle flights across different timezones
3. **Chronological Ordering**: Proper sorting by departure time
4. **Global Travel**: Support international flights with timezone changes
5. **User-Friendly Display**: Show times in local timezone
6. **Data Integrity**: UTC storage prevents timezone confusion

## Future Enhancements

- Timezone selection per leg
- Flight duration calculation
- Layover time calculation
- Multi-timezone trip support
- Calendar integration
- Timezone-aware notifications 