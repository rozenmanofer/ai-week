// simulate-scale.js
const express = require('express');
const router = express.Router();
const redis = require('./redis'); // import your Redis client instance

router.post('/simulate-scale', async (req, res) => {
  const { prefix } = req.body;

  if (!prefix || typeof prefix !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid prefix' });
  }

  const keys = Array.from({ length: 1000 }, (_, i) => `session:${prefix}_loadtest_${i}`);

  try {
    await Promise.all(
      keys.map((key) => redis.get(key))
    );
    res.status(200).json({ success: true, message: 'Simulated 1000 reads' });
  } catch (error) {
    console.error('Error during simulated scale:', error);
    res.status(500).json({ error: 'Redis simulation failed' });
  }
});

module.exports = router;
