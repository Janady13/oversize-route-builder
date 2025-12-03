const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Get all routes for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, p.permit_number, p.state
       FROM routes r
       JOIN permits p ON r.permit_id = p.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json({ routes: result.rows });
  } catch (error) {
    console.error('Get routes error:', error);
    res.status(500).json({ error: { message: 'Error fetching routes' } });
  }
});

// Get single route
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, p.permit_number, p.state, ls.*
       FROM routes r
       JOIN permits p ON r.permit_id = p.id
       LEFT JOIN load_specs ls ON p.id = ls.permit_id
       WHERE r.id = $1 AND r.user_id = $2`,
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Route not found' } });
    }
    
    res.json({ route: result.rows[0] });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(500).json({ error: { message: 'Error fetching route' } });
  }
});

module.exports = router;
