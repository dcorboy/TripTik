const express = require('express');
const router = express.Router();

// GET /users - Return list of all users
router.get('/', async (req, res) => {
  try {
    const users = await req.db.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/:id - Return specific user by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await req.db.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /users - Create a new user
router.post('/', async (req, res) => {
  try {
    const { name, email, age } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    const newUser = await req.db.createUser({ name, email, age });
    res.status(201).json(newUser);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// PUT /users/:id - Update a user
router.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, age } = req.body;
    
    const updatedUser = await req.db.updateUser(userId, { name, email, age });
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

// DELETE /users/:id - Delete a user
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const result = await req.db.deleteUser(userId);
    res.json(result);
  } catch (err) {
    if (err.message === 'User not found') {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router; 