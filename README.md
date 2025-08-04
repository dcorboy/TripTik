# Trip Manager Application

A full-stack application for managing trips and their associated legs (flights, etc.) built with Node.js/Express backend and Preact frontend.

## Features

- View list of trips
- View trip details with legs displayed in chronological order
- Clean, modern UI
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

- `GET /api/trips` - Get all trips
- `GET /api/trips/:id` - Get specific trip
- `GET /api/trips/:id/legs` - Get legs for a specific trip
- `POST /api/trips` - Create a new trip
- `PUT /api/trips/:id` - Update a trip
- `DELETE /api/trips/:id` - Delete a trip
- `POST /api/legs` - Create a new leg
- `PUT /api/legs/:id` - Update a leg
- `DELETE /api/legs/:id` - Delete a leg

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── TripList.jsx
│   │   └── TripDetails.jsx
│   ├── App.jsx
│   └── main.jsx
├── routes/
│   ├── trips.js
│   ├── legs.js
│   └── users.js
├── public/
├── index.html
├── index.js
├── database.js
└── package.json
```

## Development

The application uses:
- **Backend**: Express.js with SQLite database
- **Frontend**: Preact with Vite for development
- **Styling**: CSS with modern design principles

## Next Steps

Future enhancements could include:
- User authentication
- Add/edit/delete trips and legs
- Better date/time handling
- More sophisticated UI components
- Search and filtering capabilities 