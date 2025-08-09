const express = require('express');
const router = express.Router();

// GET /legs - Return list of all legs
router.get('/', async (req, res) => {
  try {
    const legs = await req.db.getAllLegs();
    res.json(legs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /legs/:id - Return specific leg by ID
router.get('/:id', async (req, res) => {
  try {
    const legId = req.params.id;
    const leg = await req.db.getLegById(legId);
    
    if (!leg) {
      return res.status(404).json({ error: 'Leg not found' });
    }
    
    res.json(leg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /legs - Create a new leg
router.post('/', async (req, res) => {
  try {
    const { name, departure_datetime, departure_location, departure_timezone, arrival_datetime, arrival_location, arrival_timezone, carrier, confirmation, trip_id } = req.body;
    
    if (!name || !trip_id) {
      return res.status(400).json({ error: 'Name and trip_id are required' });
    }
    
    const newLeg = await req.db.createLeg({ name, departure_datetime, departure_location, departure_timezone, arrival_datetime, arrival_location, arrival_timezone, carrier, confirmation, trip_id });
    res.status(201).json(newLeg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /legs/:id - Update a leg
router.put('/:id', async (req, res) => {
  try {
    const legId = req.params.id;
    const { name, departure_datetime, departure_location, departure_timezone, arrival_datetime, arrival_location, arrival_timezone, carrier, confirmation } = req.body;
    
    const updatedLeg = await req.db.updateLeg(legId, { name, departure_datetime, departure_location, departure_timezone, arrival_datetime, arrival_location, arrival_timezone, carrier, confirmation });
    res.json(updatedLeg);
  } catch (err) {
    if (err.message === 'Leg not found') {
      res.status(404).json({ error: 'Leg not found' });
    } else if (err.message === 'No fields to update') {
      res.status(400).json({ error: 'No fields to update' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// DELETE /legs/:id - Delete a leg
router.delete('/:id', async (req, res) => {
  try {
    const legId = req.params.id;
    const result = await req.db.deleteLeg(legId);
    res.json(result);
  } catch (err) {
    if (err.message === 'Leg not found') {
      res.status(404).json({ error: 'Leg not found' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router; 