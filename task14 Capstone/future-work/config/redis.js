const IORedis = require('ioredis');

/**
 * Single shared Redis connection used by all BullMQ queues/workers.
 * BullMQ requires `maxRetriesPerRequest: null` on the connection it's given.
 */
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

module.exports = connection;
