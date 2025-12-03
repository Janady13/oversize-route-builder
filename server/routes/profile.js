const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, company_name, usdot_number, phone, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ profile: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Error fetching profile' } });
  }
});

router.put('/', authMiddleware, async (req, res) => {
  try {
    const { companyName, usdotNumber, phone } = req.body;
    const result = await db.query(
      `UPDATE users SET company_name = $1, usdot_number = $2, phone = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING id, email, company_name, usdot_number, phone`,
      [companyName, usdotNumber, phone, req.user.id]
    );
    res.json({ profile: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: { message: 'Error updating profile' } });
  }
});

module.exports = router;
