# TripTik Application

A full-stack application for managing trips and their associated legs (flights, etc.) built with Node.js/Express backend and Preact frontend.

## Features

- View list of trips
- View trip details with legs displayed in chronological order
- Add, edit, and delete trips and legs
- Advanced date/time handling with timezone support
- Editable fields with real-time updates
- Clean, modern UI with responsive design
- RESTful API backend

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   npm start
   ```
   This starts the Express server on http://localhost:3000

2. **Start the frontend development server:**
   ```bash
   npm run dev
   ```
   This starts the Vite development server on http://localhost:5173

3. **Open your browser** and navigate to http://localhost:5173

### API Endpoints

- `GET /users/:id/trips` - Get all trips for a user
- `GET /trips/:id` - Get specific trip
- `POST /trips` - Create a new trip
- `PUT /trips/:id` - Update a trip
- `DELETE /trips/:id` - Delete a trip
- `GET /legs` - Get all legs
- `GET /legs/:id` - Get specific leg
- `POST /legs` - Create a new leg
- `PUT /legs/:id` - Update a leg
- `DELETE /legs/:id` - Delete a leg
- `GET /users` - Get all users
- `GET /users/:id` - Get specific user
- `POST /users` - Create a new user
- `PUT /users/:id` - Update a user
- `DELETE /users/:id` - Delete a user

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── TripList.jsx
│   │   ├── TripDetails.jsx
│   │   ├── DateTimePicker.jsx
│   │   ├── TimezonePicker.jsx
│   │   └── EditableField.jsx
│   ├── config/
│   │   └── timezone.js
│   ├── utils/
│   │   ├── dateFormatters.js
│   │   ├── legTextInterpreter.js
│   │   ├── locationTimezone.js
│   │   └── tripAnalyzer.js
│   ├── App.jsx
│   └── main.jsx
├── routes/
│   ├── trips.js
│   ├── legs.js
│   └── users.js
├── public/
│   └── style.css
├── index.html
├── index.js
├── database.js
├── package.json
└── vite.config.js
```

## Development

The application uses:
- **Backend**: Express.js with SQLite database
- **Frontend**: Preact with Vite for development
- **Styling**: CSS with modern design principles
- **Date/Time**: Advanced timezone handling with UTC storage

## Key Components

- **TripList**: Displays all trips with add/delete functionality
- **TripDetails**: Shows trip details with editable fields and leg management
- **DateTimePicker**: Timezone-aware date and time selection
- **TimezonePicker**: Timezone selection component
- **EditableField**: Inline editing component for trip properties

## Date and Time Handling

The application includes comprehensive date and time handling with timezone awareness. See `DATE_HANDLING.md` for detailed information about:
- UTC storage format
- Timezone conversion
- Chronological ordering
- Database schema

## Next Steps

Future enhancements could include:
- User authentication and authorization
- Search and filtering capabilities
- Calendar integration
- Timezone-aware notifications
- Flight duration and layover calculations
- Multi-timezone trip support 