const IORedis = require('ioredis');

// BullMQ requires maxRetriesPerRequest: null. Upstash needs TLS (rediss://).
function createConnection() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is not set');
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    ...(url.startsWith('rediss://') ? { tls: {} } : {}),
  });
}

module.exports = { createConnection };