const express = require('express');
const Database = require('./database');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize database
const db = new Database();

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

// GET /users - Return list of all users
app.get('/users', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /user/:id - Return specific user by ID
app.get('/user/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await db.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /users - Create a new user
app.post('/users', async (req, res) => {
  try {
    const { name, email, age } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    const newUser = await db.createUser({ name, email, age });
    res.status(201).json(newUser);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// PUT /user/:id - Update a user
app.put('/user/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, age } = req.body;
    
    const updatedUser = await db.updateUser(userId, { name, email, age });
    res.json(updatedUser);
  } catch (err) {
    if (err.message === 'User not found') {
      res.status(404).json({ error: 'User not found' });
    } else if (err.message === 'No fields to update') {
      res.status(400).json({ error: 'No fields to update' });
    } else if (err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// DELETE /user/:id - Delete a user
app.delete('/user/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await db.deleteUser(userId);
    res.json(result);
  } catch (err) {
    if (err.message === 'User not found') {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

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