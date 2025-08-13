# TripTik Application

A full-stack application for managing trips and their associated legs (flights, etc.) built with Node.js/Express backend and Preact frontend. TripTik generates detailed trip itineraries with automatic timezone handling and provides both editing and print-friendly render views.

## Features

- **Trip Management**: View, add, edit, and delete trips and legs
- **Chronological Display**: Legs automatically sorted by departure time
- **Advanced Date/Time**: Full timezone support with UTC storage
- **Real-time Editing**: Inline editing with instant updates
- **Rich Text Rendering**: Print-friendly trip itineraries
- **URL-based Routing**: Clean, bookmarkable URLs for all views
- **Browser Navigation**: Full back/forward button support
- **Copy to Clipboard**: One-click copying of trip itineraries
- **Modern UI**: Responsive design with intuitive interface
- **RESTful API**: Complete backend API for all operations

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

The application uses a mixed setup with separate backend and frontend servers:

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
│   │   ├── TripList.jsx          # Trip list view
│   │   ├── TripDetails.jsx       # Trip editing view
│   │   ├── TripRender.jsx        # Print-friendly render view
│   │   ├── DateTimePicker.jsx    # Timezone-aware date picker
│   │   ├── TimezonePicker.jsx    # Timezone selection
│   │   └── EditableField.jsx     # Inline editing component
│   ├── config/
│   │   └── timezone.js           # Timezone configuration
│   ├── utils/
│   │   ├── dateFormatters.js     # Date formatting utilities
│   │   ├── legTextInterpreter.js # Text parsing for legs
│   │   ├── locationTimezone.js   # Location timezone mapping
│   │   └── tripAnalyzer.js       # Trip itinerary generation
│   ├── App.jsx                   # Main app with routing
│   └── main.jsx                  # App entry point
├── routes/                       # Express API routes
│   ├── trips.js
│   ├── legs.js
│   └── users.js
├── public/
│   └── style.css                 # Application styles
├── index.html                    # HTML template
├── index.js                      # Express server entry
├── database.js                   # SQLite database layer
├── package.json                  # Dependencies and scripts
└── vite.config.js               # Vite configuration
```

## Application Views

### URL Structure
The application uses clean, RESTful URLs:
- `/` - Trip list (home page)
- `/trip/:id` - Trip details for editing
- `/trip/:id/render` - Print-friendly render view

### Navigation
- **Browser Back/Forward**: Full support for browser navigation
- **Bookmarkable URLs**: All pages can be bookmarked
- **Shareable Links**: Direct links to specific trips or render views

## Development

The application uses:
- **Backend**: Express.js with SQLite database
- **Frontend**: Preact with Vite for development
- **Routing**: Custom client-side router with history API
- **Styling**: CSS with modern design principles
- **Date/Time**: Advanced timezone handling with UTC storage

## Key Components

- **TripList**: Displays all trips with add/delete functionality
- **TripDetails**: Shows trip details with editable fields and leg management
- **TripRender**: Print-friendly view for trip itineraries
- **DateTimePicker**: Timezone-aware date and time selection
- **TimezonePicker**: Timezone selection component
- **EditableField**: Inline editing component for trip properties

## Date and Time Handling

The application includes comprehensive date and time handling with timezone awareness. See `DATE_HANDLING.md` for detailed information about:
- UTC storage format
- Timezone conversion
- Chronological ordering
- Database schema

## Usage

### Creating and Editing Trips
1. Navigate to the trip list (`/`)
2. Click "Add Trip" to create a new trip
3. Click on any trip to view and edit details
4. Use inline editing to modify trip properties
5. Add legs with departure/arrival times and timezones

### Generating Trip Itineraries
1. In trip details, the system automatically generates a TripTik itinerary
2. Click "Copy" to copy the itinerary to clipboard
3. Click "Print" to open a print-friendly render view in a new tab
4. Use the browser's print dialog or the "Print" button in the render view

### Navigation
- Use browser back/forward buttons for natural navigation
- Bookmark any page for quick access
- Share direct links to specific trips or render views

## Next Steps

Future enhancements could include:
- User authentication and authorization
- Search and filtering capabilities
- Calendar integration
- Timezone-aware notifications
- Flight duration and layover calculations
- Multi-timezone trip support
- Rich text formatting in render view
- Export to PDF functionality 