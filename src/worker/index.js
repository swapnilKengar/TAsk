// Long-running BullMQ worker. Host on Render / Railway / Fly.io / VPS (NOT Vercel).
require('dotenv').config();
const { Worker } = require('bullmq');
const { createConnection } = require('../lib/redis');
const { QUEUE_NAME } = require('../lib/queue');
const { runAudit } = require('../lib/pipeline');

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    console.log(`[WORKER] picked up job ${job.id} (audit ${job.data.auditId})`);
    return runAudit(job.data.auditId);
  },
  {
    connection: createConnection(),
    concurrency: Number(process.env.WORKER_CONCURRENCY || 1),
    // Fewer Redis commands → stays inside Upstash's 500K commands/month free tier.
    drainDelay: 30,
    stalledInterval: 120000,
    lockDuration: 300000,
  },
);

worker.on('ready', () => console.log(`[WORKER] listening on queue "${QUEUE_NAME}"`));
worker.on('completed', (job) => console.log(`[WORKER] job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`[WORKER] job ${job?.id} failed: ${err.message}`));

const shutdown = async () => { await worker.close(); process.exit(0); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);