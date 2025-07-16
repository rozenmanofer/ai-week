const express = require('express');

module.exports = (redis) => {
  const router = express.Router();

  router.post('/simulate-scale', async (req, res) => {
    const { prefix, count, write } = req.body;

    if (!prefix || typeof prefix !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid prefix' });
    }

    const safeCount = Math.max(1, Math.min(Number(count) || 1, 10000)); // limit to 10,000 max
    const keys = Array.from({ length: safeCount }, (_, i) => `session:${prefix}_loadtest_${i}`);
    const batchSize = 50;

    const startTime = Date.now();

    try {
      // Simulate GETs
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        await Promise.all(batch.map((key) => redis.get(key)));
      }

      // Simulate SETs if needed
      if (write) {
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          await Promise.all(batch.map((key) =>
            redis.set(key, JSON.stringify({
              user_id: `fake-${i}`,
              email: `${prefix}_loadtest_${i}@test.com`,
              roles: ['user'],
              created_at: new Date().toISOString()
            }))
          ));
        }
      }

      const endTime = Date.now();
      const durationMs = endTime - startTime;

      res.status(200).json({
        success: true,
        message: `Simulated ${safeCount} reads${write ? ' and writes' : ''}`,
        latencyMs
      });
    } catch (error) {
      console.error('Error during scale simulation:', error);
      res.status(500).json({ error: 'Redis simulation failed' });
    }
  });

  return router;
};
