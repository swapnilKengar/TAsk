const { Queue } = require('bullmq');
const { createConnection } = require('./redis');

const QUEUE_NAME = 'seo-audit-jobs';

// Lazy so `next build` never opens a Redis connection.
let queue;
function getQueue() {
  if (!queue) {
    queue = new Queue(QUEUE_NAME, {
      connection: createConnection(),
      defaultJobOptions: { attempts: 1, removeOnComplete: { count: 100 }, removeOnFail: { count: 100 } },
    });
  }
  return queue;
}

const auditQueue = { add: (name, data, opts) => getQueue().add(name, data, opts) };

module.exports = { QUEUE_NAME, getQueue, auditQueue };