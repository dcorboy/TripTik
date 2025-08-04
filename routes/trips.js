const express = require('express');
const router = express.Router();

// GET /trips - Return list of all trips
router.get('/', async (req, res) => {
  try {
    const trips = await req.db.getAllTrips();
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /trips/:id - Return specific trip by ID
router.get('/:id', async (req, res) => {
  try {
    const tripId = req.params.id;
    const trip = await req.db.getTripById(tripId);
    
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /trips - Create a new trip
router.post('/', async (req, res) => {
  try {
    const { name, description, start_date, end_date, user_id } = req.body;
    
    if (!name || !user_id) {
      return res.status(400).json({ error: 'Name and user_id are required' });
    }
    
    const newTrip = await req.db.createTrip({ name, description, start_date, end_date, user_id });
    res.status(201).json(newTrip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /trips/:id - Update a trip
router.put('/:id', async (req, res) => {
  try {
    const tripId = req.params.id;
    const { name, description, start_date, end_date, legs } = req.body;
    
    const updatedTrip = await req.db.updateTrip(tripId, { name, description, start_date, end_date, legs });
    res.json(updatedTrip);
  } catch (err) {
    if (err.message === 'Trip not found') {
      res.status(404).json({ error: 'Trip not found' });
    } else if (err.message === 'No fields to update') {
      res.status(400).json({ error: 'No fields to update' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// DELETE /trips/:id - Delete a trip
router.delete('/:id', async (req, res) => {
  try {
    const tripId = req.params.id;
    const result = await req.db.deleteTrip(tripId);
    res.json(result);
  } catch (err) {
    if (err.message === 'Trip not found') {
      res.status(404).json({ error: 'Trip not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// GET /trips/:id/legs - Get all legs for a specific trip
router.get('/:id/legs', async (req, res) => {
  try {
    const tripId = req.params.id;
    
    // First check if trip exists
    const trip = await req.db.getTripById(tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    const legs = await req.db.getLegsByTripId(tripId);
    res.json(legs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 