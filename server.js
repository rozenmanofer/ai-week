import express from 'express';
import Redis from 'ioredis';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const redis = new Redis({
  host: 'your-redis-host',
  port: 12345,
  password: 'your-password',
  tls: {}
});

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

app.listen(port, () => console.log(`Server running on port ${port}`));
