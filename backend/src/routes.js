const express = require('express');
const router = express.Router();
const db = require('./db');

// Get all users
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// // Get user by ID
// router.get('/:id', async (req, res) => {
//   try {
//     const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
//     if (rows.length === 0) {
//       return res.status(404).send('User not found');
//     }
//     res.json(rows[0]);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });

// // Create a new user
// router.post('/', async (req, res) => {
//   const { name, email } = req.body;
//   try {
//     const [result] = await db.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
//     res.status(201).json({ id: result.insertId, name, email });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });

module.exports = router;