const express = require('express');
module.exports = (redis) => {
  const router = express.Router();

  router.post('/simulate-scale', async (req, res) => {
    const { prefix } = req.body;

    if (!prefix || typeof prefix !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid prefix' });
    }

    const keys = Array.from({ length: 1000 }, (_, i) => `session:${prefix}_loadtest_${i}`);
    const value = JSON.stringify({ user_id: "loadtest", email: `${prefix}@test.com` });
    const batchSize = 50;

    let totalGetMs = 0;
    let totalSetMs = 0;

    try {
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);

        // Measure SET latency
        const startSet = Date.now();
        await Promise.all(batch.map((key) => redis.set(key, value)));
        totalSetMs += Date.now() - startSet;

        // Measure GET latency
        const startGet = Date.now();
        await Promise.all(batch.map((key) => redis.get(key)));
        totalGetMs += Date.now() - startGet;
      }

      res.status(200).json({
        success: true,
        message: 'Simulated 1000 reads and writes in batches',
        setLatencyMs: totalSetMs,
        getLatencyMs: totalGetMs
      });
    } catch (error) {
      console.error('Error during scale simulation:', error);
      res.status(500).json({ error: 'Redis simulation failed' });
    }
  });

  return router;
};
