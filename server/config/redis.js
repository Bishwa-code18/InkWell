// config/redis.js — Redis client setup (redis v4)
const { createClient } = require('redis');

let client = null;

const connectRedis = async () => {
  try {
    client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: false,   // no retries — fail fast
        connectTimeout: 3000,
      },
    });

    client.on('error', () => { /* silent — Redis is optional */ });
    client.on('ready', () => console.log('✅ Redis Connected'));

    await client.connect();
    return client;
  } catch (err) {
    // Redis is optional — graceful degradation
    console.warn('⚠️  Redis not available, caching disabled (this is OK for local dev)');
    client = null;
    return null;
  }
};

/**
 * Get/set helpers with graceful fallback if Redis is unavailable.
 */
const getCache = async (key) => {
  if (!client) return null;
  try {
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
};

const setCache = async (key, data, ttlSeconds = 300) => {
  if (!client) return;
  try {
    await client.setEx(key, ttlSeconds, JSON.stringify(data));
  } catch { /* silent */ }
};

const delCache = async (key) => {
  if (!client) return;
  try { await client.del(key); } catch { /* silent */ }
};

module.exports = { connectRedis, getCache, setCache, delCache };
