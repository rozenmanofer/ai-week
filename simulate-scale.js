const express = require('express');

module.exports = (redis) => {
  const router = express.Router();

  router.post('/simulate-scale', async (req, res) => {
    const { prefix } = req.body;

    if (!prefix || typeof prefix !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid prefix' });
    }

    const totalKeys = 10000;
    const batchSize = 50;
    const keys = Array.from({ length: totalKeys }, (_, i) => `session:${prefix}_loadtest_${i}`);

    console.time('[Simulate Scale] Total Duration');

    try {
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);

        // Log a summary for each batch
        console.log(`[Simulate Scale] Batch ${i / batchSize + 1}: ${batch[0]} → ${batch[batch.length - 1]}`);

        // Perform Redis GETs concurrently
        await Promise.all(batch.map((key) => redis.get(key)));
      }

      console.timeEnd('[Simulate Scale] Total Duration');
      res.status(200).json({ success: true, message: `Simulated ${totalKeys} reads in batches of ${batchSize}` });
    } catch (error) {
      console.error('Error during scale simulation:', error);
      res.status(500).json({ error: 'Redis simulation failed' });
    }
  });

  return router;
};
