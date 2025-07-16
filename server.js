const express = require('express');
const cors = require('cors');
const Redis = require('ioredis');

const redis = new Redis({
  host: 'redis-15851.c15.us-east-1-2.ec2.redns.redis-cloud.com',
  port: 15851,
  password: 'eQT43h6keaosjNWneVeklN8NrfU9SQ4B',
  maxRetriesPerRequest: 2,
  connectTimeout: 3000
});

const simulateScale = require('./simulate-scale')(redis);
const app = express();
const port = process.env.PORT || 3000;

// Allow any origin (for now)
app.use(cors());

app.use(express.json());
app.use('/', simulateScale);

app.post('/set', async (req, res) => {
  const { key, value } = req.body;
  try {
    await redis.set(key, value);
    res.json({ status: 'ok' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/get', async (req, res) => {
  try {
    const val = await redis.get(req.query.key);
    res.json({ value: val });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/keys', async (req, res) => {
  try {
    const keys = await redis.keys('session:*');
    const results = await Promise.all(
      keys.map(async (key) => {
        const [value, ttl] = await Promise.all([
          redis.get(key),
          redis.ttl(key),
        ]);
        return { key, value, ttl };
      })
    );
    res.json(results);
  } catch (err) {
    console.error('Error fetching Redis keys:', err);
    res.status(500).json({ error: 'Failed to fetch Redis keys' });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
