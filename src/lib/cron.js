// Logic behind GET /api/cron/audits.
const { prisma } = require('./prisma');
const { auditQueue } = require('./queue');
const { runAudit } = require('./pipeline');

const DAY = 864e5;

// Enqueue monthly audits that are due (no audit in the last 30 days, none in flight).
async function enqueueDueAudits() {
  const clients = await prisma.client.findMany({
    include: { audits: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  const enqueued = [];
  for (const c of clients) {
    const last = c.audits[0];
    const inFlight = last && ['QUEUED', 'RUNNING'].includes(last.status);
    const due = !last || Date.now() - new Date(last.createdAt).getTime() >= 30 * DAY;
    if (inFlight || !due) continue;
    const audit = await prisma.audit.create({ data: { clientId: c.id, triggeredBy: 'cron' } });
    await auditQueue.add('run-audit', { auditId: audit.id }, { jobId: audit.id });
    enqueued.push(audit.id);
  }
  return enqueued;
}

// Process a bounded batch of QUEUED audits here. minAgeSeconds > 0 means "only audits a worker has
// ignored for that long", i.e. no separate worker is running.
async function processQueuedInline(limit, minAgeSeconds = 0) {
  const cutoff = new Date(Date.now() - minAgeSeconds * 1000);
  const queued = await prisma.audit.findMany({
    where: { status: 'QUEUED', createdAt: { lte: cutoff } },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
  const results = [];
  for (const a of queued) {
    try { results.push({ id: a.id, ...(await runAudit(a.id)) }); }
    catch (e) { results.push({ id: a.id, error: e.message }); }
  }
  return results;
}
module.exports = { enqueueDueAudits, processQueuedInline };