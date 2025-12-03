const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM vehicles WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ vehicles: result.rows });
  } catch (error) {
    res.status(500).json({ error: { message: 'Error fetching vehicles' } });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { truckMake, truckYear, truckVin, tagNumber, tagState, trailerMake, trailerYear, trailerTag } = req.body;
    const result = await db.query(
      `INSERT INTO vehicles (user_id, truck_make, truck_year, truck_vin, tag_number, tag_state, 
       trailer_make, trailer_year, trailer_tag)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user.id, truckMake, truckYear, truckVin, tagNumber, tagState, trailerMake, trailerYear, trailerTag]
    );
    res.status(201).json({ vehicle: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Error creating vehicle' } });
  }
});

module.exports = router;
