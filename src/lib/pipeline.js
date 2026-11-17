// The audit pipeline (Section 3.2). Used by the BullMQ worker AND the cron route (inline mode).
const { prisma } = require('./prisma');
const { STEPS } = require('./steps');
const { crawlUrl } = require('../crawlers/crawl');
const { getPageSpeed } = require('../crawlers/pagespeed');
const { getSearchConsole } = require('../crawlers/gsc');
const { validateSchema } = require('../crawlers/schema');
const { analyseOnPage } = require('../crawlers/onpage');
const { checkTechnical } = require('../crawlers/technical');
const { getRankings } = require('../crawlers/dataforseo');
const { analyseWithClaude } = require('./claude');
const { generatePdfFile } = require('./pdf');
const { sendReport } = require('./notify');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const STEP = Object.fromEntries(STEPS.map((s) => [s.id, s]));

async function runAudit(auditId) {
  // Atomic claim: guarantees one runner per audit (worker vs. inline cron can't double-run).
  const claimed = await prisma.audit.updateMany({
    where: { id: auditId, status: 'QUEUED' },
    data: { status: 'RUNNING', progress: 2, currentStep: 'Starting' },
  });
  if (claimed.count === 0) {
    console.log(`[AUDIT ${auditId}] not QUEUED — skipping`);
    return { skipped: true };
  }

  const audit = await prisma.audit.findUnique({ where: { id: auditId }, include: { client: true } });
  const { client } = audit;
  const delay = Number(process.env.STEP_DELAY_MS || 0);

  const step = async (id, fn) => {
    const s = STEP[id];
    await prisma.audit.update({ where: { id: auditId }, data: { currentStep: s.label } });
    console.log(`[AUDIT ${auditId}] ${s.label}`);
    const out = await fn();
    if (delay) await sleep(delay);
    await prisma.audit.update({ where: { id: auditId }, data: { progress: s.progress } });
    return out;
  };

  try {
    const crawl = await step('crawl', () => crawlUrl(client.websiteUrl));
    const cwv = await step('pagespeed', () => getPageSpeed(client.websiteUrl));
    const gsc = await step('gsc', () => getSearchConsole(client.websiteUrl));
    const schema = await step('schema', async () => validateSchema(crawl.text));
    const onPage = await step('onpage', async () => analyseOnPage(crawl.text, client.websiteUrl));
    const technical = await step('technical', () => checkTechnical(client.websiteUrl, crawl));
    const rankings = await step('rankings', () => getRankings(client));

    const signals = { onPage, technical, coreWebVitals: cwv, schema, gsc, rankings };

    const { result, mocked } = await step('claude', () =>
      analyseWithClaude({
        url: client.websiteUrl, businessType: client.businessType, city: client.city, state: client.state,
        onPage, technical, cwv, schema, gsc, rankings,
      }));

    const saved = await step('store', () => prisma.audit.update({
      where: { id: auditId },
      data: {
        overallScore: result.overall_score,
        scoreBreakdown: result.score_breakdown,
        signals: { ...signals, _meta: { crawlMocked: !!crawl.mocked, claudeMocked: mocked } },
        result,
      },
    }));

    const pdf = await step('pdf', async () => {
      const out = await generatePdfFile({ client, audit: saved });
      await prisma.audit.update({ where: { id: auditId }, data: { pdfPath: out.path } });
      console.log(`[AUDIT ${auditId}] PDF (${out.engine}) → ${out.path}`);
      return out;
    });

    await step('notify', () => sendReport({ client, audit: saved, pdfPath: pdf.path }));

    await prisma.audit.update({
      where: { id: auditId },
      data: { status: 'COMPLETED', progress: 100, currentStep: 'Done', completedAt: new Date() },
    });
    console.log(`[AUDIT ${auditId}] COMPLETED — score ${result.overall_score}`);
    return { completed: true, score: result.overall_score };
  } catch (err) {
    console.error(`[AUDIT ${auditId}] FAILED:`, err.message);
    await prisma.audit.update({
      where: { id: auditId },
      data: { status: 'FAILED', errorMessage: String(err.message).slice(0, 500), currentStep: 'Failed' },
    });
    throw err;
  }
}
module.exports = { runAudit };