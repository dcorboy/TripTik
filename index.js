const express = require('express');
const Database = require('./database');
const usersRoutes = require('./routes/users');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize database
const db = new Database();

// Middleware to make database available to routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Initialize database connection and setup
async function initializeApp() {
  try {
    await db.connect();
    await db.initDatabase();
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize database:', err.message);
    process.exit(1);
  }
}

// Root route
app.get('/', (req, res) => {
  res.send('Hello from AI!');
});

// Mount user routes
app.use('/users', usersRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Initialize the application
initializeApp();

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await db.close();
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err.message);
    process.exit(1);
  }
}); 