const express = require('express');

module.exports = (redis) => {
  const router = express.Router();

  router.post('/simulate-scale', async (req, res) => {
    const { prefix, count, write } = req.body;

    if (!prefix || typeof prefix !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid prefix' });
    }

    const safeCount = Math.max(1, Math.min(Number(count) || 1, 100000)); // limit to 100,000 max
    const keys = Array.from({ length: safeCount }, (_, i) => `session:${prefix}_loadtest_${i}`);
    const batchSize = 50;

    try {
  // Measure GETs
  const startGet = Date.now();
  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize);
    await Promise.all(batch.map((key) => redis.get(key)));
  }
  const endGet = Date.now();
  const getLatencyMs = endGet - startGet;

  let setLatencyMs = 0;

  // Measure SETs if needed
  if (write) {
    const startSet = Date.now();
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
    const endSet = Date.now();
    setLatencyMs = endSet - startSet;
  }

  console.log(`[Simulate Scale] Completed ${safeCount} GETs in ${getLatencyMs}ms${write ? ` + ${safeCount} SETs in ${setLatencyMs}ms` : ''}`);

  res.status(200).json({
    success: true,
    message: `Simulated ${safeCount} reads${write ? ' and writes' : ''}`,
    getLatencyMs,
    setLatencyMs
  });

} catch (error) {
  console.error('Error during scale simulation:', error);
  res.status(500).json({ error: 'Redis simulation failed' });
}
  });

  return router;
};
