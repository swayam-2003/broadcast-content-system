const redis = require('redis');
const logger = require('../utils/logger');
const config = require('../config');

let client;

const initializeRedis = async () => {
  try {
    client = redis.createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
    });

    client.on('error', (err) => {
      logger.error('Redis client error', err);
    });

    client.on('connect', () => {
      logger.info('Redis client connected');
    });

    // Connect to Redis
    await client.connect();
    
    // Test connection
    const reply = await client.ping();
    if (reply === 'PONG') {
      logger.info('Redis connected successfully');
    }
  } catch (err) {
    logger.warn('Redis initialization failed, continuing without caching', err);
    client = null;
  }
};

class CacheService {
  async get(key) {
    try {
      if (!client) return null;
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.error('Cache get error', err);
      return null;
    }
  }

  async set(key, value, ttl = 60) {
    try {
      if (!client) return;
      await client.setEx(key, ttl, JSON.stringify(value));
    } catch (err) {
      logger.error('Cache set error', err);
    }
  }

  async delete(key) {
    try {
      if (!client) return;
      await client.del(key);
    } catch (err) {
      logger.error('Cache delete error', err);
    }
  }

  async deletePattern(pattern) {
    try {
      if (!client) return;
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (err) {
      logger.error('Cache pattern delete error', err);
    }
  }
}

module.exports = { CacheService: new CacheService(), initializeRedis };
