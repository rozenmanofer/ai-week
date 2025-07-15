const express = require('express');

module.exports = (redis) => {
  const router = express.Router();

  router.post('/simulate-scale', async (req, res) => {
    const { prefix } = req.body;

    if (!prefix || typeof prefix !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid prefix' });
    }

    const keys = Array.from({ length: 10 }, (_, i) => `session:${prefix}_loadtest_${i}`);
    const batchSize = 50;

    try {
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        await Promise.all(batch.map((key) => redis.get(key)));
      }

      res.status(200).json({ success: true, message: 'Simulated 10 reads in batches' });
    } catch (error) {
      console.error('Error during scale simulation:', error);
      res.status(500).json({ error: 'Redis simulation failed' });
    }
  });

  return router;
};
