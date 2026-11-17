require('dotenv').config();
const { prisma } = require('./src/lib/prisma');
const { auditQueue, getQueue } = require('./src/lib/queue');

(async () => {
  const client = await prisma.client.findFirst();
  if (!client) throw new Error('No client found — run: node prisma/seed.js');

  const audit = await prisma.audit.create({ data: { clientId: client.id } });
  await auditQueue.add('run-audit', { auditId: audit.id }, { jobId: audit.id });
  console.log('Queued audit:', audit.id, '— watch Terminal 1');

  await getQueue().close();
  await prisma.$disconnect();
})();