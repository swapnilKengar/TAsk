require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { prisma } = require('./src/lib/prisma');
const { getQueue } = require('./src/lib/queue');

let fails = 0;
const ok = (m) => console.log('  ✓', m);
const bad = (m) => { fails++; console.log('  ✗', m); };
const check = (cond, m) => (cond ? ok(m) : bad(m));
const exists = (p) => fs.existsSync(path.join(__dirname, p));

(async () => {
  console.log('\n1. Environment');
  ['DATABASE_URL', 'DIRECT_URL', 'REDIS_URL', 'CRON_SECRET'].forEach((k) => check(!!process.env[k], k));
  console.log('  i USE_MOCKS =', process.env.USE_MOCKS, '| ANTHROPIC_API_KEY set:', !!process.env.ANTHROPIC_API_KEY);

  console.log('\n2. Project files');
  [
    'prisma/schema.prisma', 'src/mocks/index.js', 'src/mocks/pagespeed.mock.js', 'src/mocks/gsc.mock.js',
    'src/mocks/dataforseo.mock.js', 'src/mocks/twilio.mock.js',
    'src/crawlers/crawl.js', 'src/crawlers/pagespeed.js', 'src/crawlers/gsc.js', 'src/crawlers/schema.js',
    'src/crawlers/onpage.js', 'src/crawlers/technical.js', 'src/crawlers/dataforseo.js',
    'src/lib/claude.js', 'src/lib/prompt.js', 'src/lib/pdf.js', 'src/lib/pdf-kit.js', 'src/lib/notify.js',
    'src/lib/pipeline.js', 'src/lib/queue.js', 'src/lib/cron.js', 'src/worker/index.js',
    'src/app/api/audit/route.js', 'src/app/api/audit/[id]/route.js', 'src/app/api/cron/audits/route.js',
    'src/app/api/report/[id]/route.js', 'src/app/api/clients/route.js', 'src/app/api/audits/route.js',
    'src/app/admin/page.js', 'src/app/admin/audits/[id]/page.js', 'src/app/client/[clientId]/page.js', 'src/app/page.js',
  ].forEach((f) => check(exists(f), f));

  console.log('\n3. Supplied mock files unchanged');
  try {
    check(require('./src/mocks/pagespeed.mock').categories.performance.score === 0.61, 'pagespeed.mock');
    check(require('./src/mocks/gsc.mock').totalClicks === 167, 'gsc.mock');
    check(require('./src/mocks/dataforseo.mock').client_rank_position === 4, 'dataforseo.mock');
    check(typeof require('./src/mocks/twilio.mock').sendWhatsApp === 'function', 'twilio.mock');
  } catch (e) { bad('mock load error: ' + e.message); }

  console.log('\n4. Database (Neon)');
  try {
    const [clients, audits] = await Promise.all([prisma.client.count(), prisma.audit.count()]);
    ok(`connected: ${clients} clients, ${audits} audits`);
    const a = await prisma.audit.findFirst({ where: { status: 'COMPLETED' }, orderBy: { createdAt: 'desc' }, include: { notifications: true } });
    if (!a) bad('no COMPLETED audit yet');
    else {
      check(a.overallScore != null, 'overallScore saved');
      check(!!a.scoreBreakdown, 'scoreBreakdown saved');
      check(a.completedAt != null, 'completedAt set');
      ['onPage', 'technical', 'coreWebVitals', 'schema', 'gsc', 'rankings'].forEach((k) => check(!!a.signals?.[k], 'signals.' + k));
      check(!!a.pdfPath && fs.existsSync(a.pdfPath), 'PDF file exists on disk');
      check(a.notifications.some((n) => n.channel === 'whatsapp'), 'WhatsApp notification row');
      const r = a.result || {};
      ['audit_version', 'overall_score', 'score_breakdown', 'critical_issues', 'important_issues', 'quick_wins', 'recommendations', 'executive_summary']
        .forEach((k) => check(r[k] !== undefined, 'result.' + k));
      const rec = r.recommendations?.[0] || {};
      ['priority', 'category', 'finding', 'fix', 'estimated_impact', 'effort', 'falsifiability_check']
        .forEach((k) => check(rec[k] !== undefined, 'recommendation.' + k));
    }
    const states = await prisma.audit.groupBy({ by: ['status'], _count: true });
    console.log('  i status counts:', states.map((s) => `${s.status}=${s._count}`).join(', '));
    console.log('  i audits triggered by cron:', await prisma.audit.count({ where: { triggeredBy: 'cron' } }));
  } catch (e) { bad('database error: ' + e.message); }

  console.log('\n5. Queue (Upstash / BullMQ)');
  try {
    const q = getQueue();
    ok('connected: ' + JSON.stringify(await q.getJobCounts('waiting', 'active', 'completed', 'failed')));
    await q.close();
  } catch (e) { bad('redis error: ' + e.message); }

  console.log('\n6. Technologies installed');
  const nm = (p) => exists('node_modules/' + p);
  [['next', 'Next.js'], ['tailwindcss', 'Tailwind'], ['bullmq', 'BullMQ'], ['ioredis', 'ioredis'], ['@prisma/client', 'Prisma'],
    ['cheerio', 'Cheerio'], ['@anthropic-ai/sdk', 'Claude SDK'], ['pdfkit', 'pdfkit'], ['puppeteer', 'Puppeteer (primary PDF)']]
    .forEach(([p, n]) => check(nm(p), n));
  check(exists('components.json'), 'shadcn/ui (optional)');

  console.log('\n7. Submission files (expected to fail until later steps)');
  check(exists('README.md'), 'README.md');
  check(exists('.env.example'), '.env.example');
  check(exists('.gitignore'), '.gitignore');

  console.log(`\n${fails === 0 ? 'ALL CHECKS PASSED' : fails + ' check(s) failed'}\n`);
  await prisma.$disconnect();
  process.exit(0);
})();